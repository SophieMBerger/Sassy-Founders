import { Router, Request, Response } from 'express';
import { getPool, computeEloRatings, isUserPremium } from './db';
import { getAuthUser } from './auth';

const router = Router();

// In-memory daily pairwise vote tracker for rate limiting (keyed by IP)
const FREE_DAILY_PAIRWISE_LIMIT = 10;
type DayCount = { date: string; count: number };
const pairwiseDailyTracker = new Map<string, DayCount>();

function checkAndIncrementPairwiseLimit(ip: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  const entry = pairwiseDailyTracker.get(ip);
  if (!entry || entry.date !== today) {
    pairwiseDailyTracker.set(ip, { date: today, count: 1 });
    return true;
  }
  if (entry.count >= FREE_DAILY_PAIRWISE_LIMIT) return false;
  entry.count++;
  return true;
}

function getPairwiseRemaining(ip: string): number {
  const today = new Date().toISOString().split('T')[0];
  const entry = pairwiseDailyTracker.get(ip);
  if (!entry || entry.date !== today) return FREE_DAILY_PAIRWISE_LIMIT;
  return Math.max(0, FREE_DAILY_PAIRWISE_LIMIT - entry.count);
}

async function toFounder(row: Record<string, unknown>) {
  const db = getPool();
  const { rows } = await db.query<{ avg: number | null; cnt: string }>(
    'SELECT AVG(whiskey_units) as avg, COUNT(*) as cnt FROM community_votes WHERE founder_id = $1',
    [row.id]
  );
  const votes = rows[0];

  return {
    id: row.id,
    name: row.name,
    company: row.company,
    title: row.title,
    imageUrl: row.image_url || undefined,
    bio: row.bio,
    sassyScore: row.sassy_score,
    communityScore: votes.avg !== null ? Math.round(votes.avg * 10) / 10 : null,
    communityVoteCount: Number(votes.cnt),
    scoreBreakdown: {
      arrogance: row.arrogance,
      controversialTakes: row.controversial_takes,
      interruptionTendency: row.interruption_tendency,
      humblebragging: row.humblebragging,
      buzzwordDensity: row.buzzword_density,
    },
  };
}

// GET /api/founders — leaderboard, sorted by sassy score desc
router.get('/founders', async (_req: Request, res: Response) => {
  try {
    const db = getPool();
    const { rows } = await db.query('SELECT * FROM founders ORDER BY sassy_score DESC');
    const eloRatings = await computeEloRatings(db);
    const founders = await Promise.all(rows.map(async row => ({
      ...(await toFounder(row)),
      eloScore: Math.round((eloRatings.get(row.id as number) ?? 1500) * 10) / 10,
    })));
    res.json({ founders, total: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/founders/pair — return two random founders for pairwise comparison
router.get('/founders/pair', async (_req: Request, res: Response) => {
  try {
    const db = getPool();
    const { rows } = await db.query('SELECT * FROM founders');
    if (rows.length < 2) {
      res.status(400).json({ error: 'Not enough founders' });
      return;
    }
    const shuffled = [...rows].sort(() => Math.random() - 0.5);
    const [a, b] = shuffled;
    res.json({ founders: [await toFounder(a), await toFounder(b)] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/pairwise/vote — record a pairwise vote
router.post('/pairwise/vote', async (req: Request, res: Response) => {
  try {
    const db = getPool();
    const { winnerId, loserId } = req.body;
    if (!winnerId || !loserId || winnerId === loserId) {
      res.status(400).json({ error: 'winnerId and loserId must be different valid founder ids' });
      return;
    }

    // Rate limiting: premium users get unlimited votes; free users get FREE_DAILY_PAIRWISE_LIMIT/day
    const user = getAuthUser(req);
    const isPremium = user ? await isUserPremium(user.id) : false;
    if (!isPremium) {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';
      const allowed = checkAndIncrementPairwiseLimit(ip);
      if (!allowed) {
        res.status(429).json({
          error: `Daily limit reached. Upgrade to Sipster Club for unlimited voting!`,
          upgradeUrl: '/upgrade',
        });
        return;
      }
    }

    const winner = await db.query('SELECT id FROM founders WHERE id = $1', [winnerId]);
    const loser = await db.query('SELECT id FROM founders WHERE id = $1', [loserId]);
    if (!winner.rows[0] || !loser.rows[0]) {
      res.status(404).json({ error: 'Founder not found' });
      return;
    }
    await db.query('INSERT INTO pairwise_votes (winner_id, loser_id) VALUES ($1, $2)', [winnerId, loserId]);
    const eloRatings = await computeEloRatings(db);

    // Return remaining votes for free users
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';
    const remaining = isPremium ? null : getPairwiseRemaining(ip);

    res.json({
      winnerElo: Math.round((eloRatings.get(Number(winnerId)) ?? 1500) * 10) / 10,
      loserElo: Math.round((eloRatings.get(Number(loserId)) ?? 1500) * 10) / 10,
      votesRemaining: remaining,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/founders/:id — founder detail
router.get('/founders/:id', async (req: Request, res: Response) => {
  try {
    const db = getPool();
    const { rows } = await db.query('SELECT * FROM founders WHERE id = $1', [req.params.id]);
    if (!rows[0]) {
      res.status(404).json({ error: 'Founder not found' });
      return;
    }
    const { rows: votes } = await db.query<{ whiskey_units: number; created_at: string }>(
      'SELECT whiskey_units, created_at FROM community_votes WHERE founder_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.params.id]
    );

    // Include the current user's vote if authenticated
    const user = getAuthUser(req);
    let myVote: number | null = null;
    if (user) {
      const { rows: myVoteRows } = await db.query<{ whiskey_units: number }>(
        'SELECT whiskey_units FROM community_votes WHERE founder_id = $1 AND user_id = $2',
        [req.params.id, user.id]
      );
      myVote = myVoteRows[0]?.whiskey_units ?? null;
    }

    res.json({
      ...(await toFounder(rows[0])),
      communityVotes: votes.map(v => ({ founderId: Number(req.params.id), whiskeyUnits: v.whiskey_units })),
      myVote,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/founders/:id/vote — submit community vote (requires auth, one vote per user per founder)
router.post('/founders/:id/vote', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Sign in to vote' });
    return;
  }

  try {
    const db = getPool();
    const { rows } = await db.query('SELECT id FROM founders WHERE id = $1', [req.params.id]);
    if (!rows[0]) {
      res.status(404).json({ error: 'Founder not found' });
      return;
    }

    const units = Number(req.body.whiskeyUnits);
    if (isNaN(units) || units < 0 || units > 10) {
      res.status(400).json({ error: 'whiskeyUnits must be between 0 and 10' });
      return;
    }

    // Upsert: one vote per user per founder
    await db.query(
      `INSERT INTO community_votes (founder_id, user_id, whiskey_units)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, founder_id) WHERE user_id IS NOT NULL
       DO UPDATE SET whiskey_units = EXCLUDED.whiskey_units, created_at = NOW()`,
      [req.params.id, user.id, units]
    );

    const { rows: updatedRows } = await db.query('SELECT * FROM founders WHERE id = $1', [req.params.id]);
    res.json(await toFounder(updatedRows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/founders/history — historical score trends (premium only)
router.get('/founders/history', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Sign in required' });
    return;
  }
  const isPremium = await isUserPremium(user.id);
  if (!isPremium) {
    res.status(403).json({ error: 'Sipster Club membership required', upgradeUrl: '/upgrade' });
    return;
  }

  try {
    const db = getPool();
    const days = Math.min(Number(req.query.days ?? 30), 90);
    const { rows } = await db.query<{
      founder_id: number;
      name: string;
      recorded_at: string;
      sassy_score: number;
      community_score: number | null;
      elo_score: number | null;
    }>(
      `SELECT sh.founder_id, f.name, sh.recorded_at, sh.sassy_score, sh.community_score, sh.elo_score
       FROM score_history sh
       JOIN founders f ON f.id = sh.founder_id
       WHERE sh.recorded_at >= CURRENT_DATE - $1::int
       ORDER BY sh.founder_id, sh.recorded_at ASC`,
      [days]
    );

    // Group by founder
    const byFounder = new Map<number, { name: string; history: object[] }>();
    for (const row of rows) {
      if (!byFounder.has(row.founder_id)) {
        byFounder.set(row.founder_id, { name: row.name, history: [] });
      }
      byFounder.get(row.founder_id)!.history.push({
        date: row.recorded_at,
        sassyScore: row.sassy_score,
        communityScore: row.community_score,
        eloScore: row.elo_score,
      });
    }

    res.json({ founders: Object.fromEntries(byFounder) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { getPool, computeEloRatings } from './db';

const router = Router();

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
    const winner = await db.query('SELECT id FROM founders WHERE id = $1', [winnerId]);
    const loser = await db.query('SELECT id FROM founders WHERE id = $1', [loserId]);
    if (!winner.rows[0] || !loser.rows[0]) {
      res.status(404).json({ error: 'Founder not found' });
      return;
    }
    await db.query('INSERT INTO pairwise_votes (winner_id, loser_id) VALUES ($1, $2)', [winnerId, loserId]);
    const eloRatings = await computeEloRatings(db);
    res.json({
      winnerElo: Math.round((eloRatings.get(Number(winnerId)) ?? 1500) * 10) / 10,
      loserElo: Math.round((eloRatings.get(Number(loserId)) ?? 1500) * 10) / 10,
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

    res.json({
      ...(await toFounder(rows[0])),
      communityVotes: votes.map(v => ({ founderId: Number(req.params.id), whiskeyUnits: v.whiskey_units })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/founders/:id/vote — submit community vote
router.post('/founders/:id/vote', async (req: Request, res: Response) => {
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

    await db.query('INSERT INTO community_votes (founder_id, whiskey_units) VALUES ($1, $2)', [req.params.id, units]);

    const { rows: updatedRows } = await db.query('SELECT * FROM founders WHERE id = $1', [req.params.id]);
    res.json(await toFounder(updatedRows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

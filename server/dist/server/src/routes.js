"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("./db");
const router = (0, express_1.Router)();
function toFounder(row) {
    const db = (0, db_1.getDb)();
    const votes = db.prepare('SELECT AVG(whiskey_units) as avg, COUNT(*) as cnt FROM community_votes WHERE founder_id = ?').get(row.id);
    return {
        id: row.id,
        name: row.name,
        company: row.company,
        title: row.title,
        imageUrl: row.image_url || undefined,
        bio: row.bio,
        sassyScore: row.sassy_score,
        communityScore: votes.avg !== null ? Math.round(votes.avg * 10) / 10 : null,
        communityVoteCount: votes.cnt,
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
router.get('/founders', (_req, res) => {
    const db = (0, db_1.getDb)();
    const rows = db.prepare('SELECT * FROM founders ORDER BY sassy_score DESC').all();
    const eloRatings = (0, db_1.computeEloRatings)(db);
    const founders = rows.map(row => ({
        ...toFounder(row),
        eloScore: Math.round((eloRatings.get(row.id) ?? 1500) * 10) / 10,
    }));
    res.json({ founders, total: rows.length });
});
// GET /api/founders/pair — return two random founders for pairwise comparison
router.get('/founders/pair', (_req, res) => {
    const db = (0, db_1.getDb)();
    const rows = db.prepare('SELECT * FROM founders').all();
    if (rows.length < 2) {
        res.status(400).json({ error: 'Not enough founders' });
        return;
    }
    const shuffled = [...rows].sort(() => Math.random() - 0.5);
    const [a, b] = shuffled;
    res.json({ founders: [toFounder(a), toFounder(b)] });
});
// POST /api/pairwise/vote — record a pairwise vote
router.post('/pairwise/vote', (req, res) => {
    const db = (0, db_1.getDb)();
    const { winnerId, loserId } = req.body;
    if (!winnerId || !loserId || winnerId === loserId) {
        res.status(400).json({ error: 'winnerId and loserId must be different valid founder ids' });
        return;
    }
    const winner = db.prepare('SELECT id FROM founders WHERE id = ?').get(winnerId);
    const loser = db.prepare('SELECT id FROM founders WHERE id = ?').get(loserId);
    if (!winner || !loser) {
        res.status(404).json({ error: 'Founder not found' });
        return;
    }
    db.prepare('INSERT INTO pairwise_votes (winner_id, loser_id) VALUES (?, ?)').run(winnerId, loserId);
    const eloRatings = (0, db_1.computeEloRatings)(db);
    res.json({
        winnerElo: Math.round((eloRatings.get(Number(winnerId)) ?? 1500) * 10) / 10,
        loserElo: Math.round((eloRatings.get(Number(loserId)) ?? 1500) * 10) / 10,
    });
});
// GET /api/founders/:id — founder detail
router.get('/founders/:id', (req, res) => {
    const db = (0, db_1.getDb)();
    const row = db.prepare('SELECT * FROM founders WHERE id = ?').get(req.params.id);
    if (!row) {
        res.status(404).json({ error: 'Founder not found' });
        return;
    }
    const votes = db.prepare('SELECT whiskey_units, created_at FROM community_votes WHERE founder_id = ? ORDER BY created_at DESC LIMIT 50').all(req.params.id);
    res.json({
        ...toFounder(row),
        communityVotes: votes.map(v => ({ founderId: Number(req.params.id), whiskeyUnits: v.whiskey_units })),
    });
});
// POST /api/founders/:id/vote — submit community vote
router.post('/founders/:id/vote', (req, res) => {
    const db = (0, db_1.getDb)();
    const founder = db.prepare('SELECT id FROM founders WHERE id = ?').get(req.params.id);
    if (!founder) {
        res.status(404).json({ error: 'Founder not found' });
        return;
    }
    const units = Number(req.body.whiskeyUnits);
    if (isNaN(units) || units < 0 || units > 10) {
        res.status(400).json({ error: 'whiskeyUnits must be between 0 and 10' });
        return;
    }
    db.prepare('INSERT INTO community_votes (founder_id, whiskey_units) VALUES (?, ?)').run(req.params.id, units);
    const updated = db.prepare('SELECT * FROM founders WHERE id = ?').get(req.params.id);
    res.json(toFounder(updated));
});
exports.default = router;

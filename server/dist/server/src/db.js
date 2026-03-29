"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = getPool;
exports.initSchema = initSchema;
exports.isUserPremium = isUserPremium;
exports.updateFounderImages = updateFounderImages;
exports.computeEloRatings = computeEloRatings;
const pg_1 = require("pg");
let pool = null;
function getPool() {
    if (!pool) {
        pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
        });
    }
    return pool;
}
async function initSchema() {
    const db = getPool();
    await db.query(`
    CREATE TABLE IF NOT EXISTS founders (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      image_url TEXT,
      bio TEXT NOT NULL,
      sassy_score FLOAT NOT NULL,
      arrogance FLOAT NOT NULL,
      controversial_takes FLOAT NOT NULL,
      interruption_tendency FLOAT NOT NULL,
      humblebragging FLOAT NOT NULL,
      buzzword_density FLOAT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      email TEXT,
      name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(provider, provider_id)
    );

    CREATE TABLE IF NOT EXISTS community_votes (
      id SERIAL PRIMARY KEY,
      founder_id INTEGER NOT NULL REFERENCES founders(id),
      whiskey_units FLOAT NOT NULL CHECK(whiskey_units >= 0 AND whiskey_units <= 10),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pairwise_votes (
      id SERIAL PRIMARY KEY,
      winner_id INTEGER NOT NULL REFERENCES founders(id),
      loser_id INTEGER NOT NULL REFERENCES founders(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      status TEXT NOT NULL DEFAULT 'inactive',
      plan TEXT,
      current_period_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id)
    );

    CREATE TABLE IF NOT EXISTS score_history (
      id SERIAL PRIMARY KEY,
      founder_id INTEGER NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
      sassy_score NUMERIC(4,1) NOT NULL,
      community_score NUMERIC(5,2),
      elo_score NUMERIC(8,2),
      recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
      UNIQUE(founder_id, recorded_at)
    );
  `);
    // Additive migrations for tables that may already exist without these columns
    await db.query(`
    ALTER TABLE community_votes ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
  `);
    await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_community_votes_user_founder
      ON community_votes(user_id, founder_id) WHERE user_id IS NOT NULL;
  `);
    await seedFounders(db);
    await seedScoreHistory(db);
}
async function isUserPremium(userId) {
    const db = getPool();
    const { rows } = await db.query('SELECT status FROM subscriptions WHERE user_id = $1', [userId]);
    return rows[0]?.status === 'active';
}
// Maps founder names to Wikipedia article titles for image lookup
const WIKIPEDIA_TITLES = {
    'Elon Musk': 'Elon_Musk',
    'Mark Zuckerberg': 'Mark_Zuckerberg',
    'Sam Altman': 'Sam_Altman',
    'Travis Kalanick': 'Travis_Kalanick',
    'Adam Neumann': 'Adam_Neumann',
    'Peter Thiel': 'Peter_Thiel',
    'Gary Vaynerchuk': 'Gary_Vaynerchuk',
    'Elizabeth Holmes': 'Elizabeth_Holmes',
    'Jack Dorsey': 'Jack_Dorsey',
    'Balaji Srinivasan': 'Balaji_Srinivasan',
    'Jeff Bezos': 'Jeff_Bezos',
    'Reid Hoffman': 'Reid_Hoffman',
    'Marc Andreessen': 'Marc_Andreessen',
    'Chamath Palihapitiya': 'Chamath_Palihapitiya',
    'Naval Ravikant': 'Naval_Ravikant',
    'Alexis Ohanian': 'Alexis_Ohanian',
    'Steve Jobs': 'Steve_Jobs',
    'Larry Ellison': 'Larry_Ellison',
    'Patrick Collison': 'Patrick_Collison',
    'Yann LeCun': 'Yann_LeCun',
};
async function updateFounderImages() {
    const db = getPool();
    const { rows: founders } = await db.query('SELECT id, name, image_url FROM founders WHERE image_url IS NULL');
    for (const founder of founders) {
        const wikiTitle = WIKIPEDIA_TITLES[founder.name];
        if (!wikiTitle)
            continue;
        try {
            const resp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`, { headers: { 'User-Agent': 'SassyFounders/0.1 (educational satire site)' } });
            if (!resp.ok)
                continue;
            const data = await resp.json();
            if (data.thumbnail?.source) {
                await db.query('UPDATE founders SET image_url = $1 WHERE id = $2', [data.thumbnail.source, founder.id]);
                console.log(`[images] Updated image for ${founder.name}`);
            }
        }
        catch {
            // Non-fatal: image fetch failed, will retry next startup
        }
    }
}
async function computeEloRatings(db) {
    const { rows: founderRows } = await db.query('SELECT id FROM founders');
    const ratings = new Map(founderRows.map(r => [r.id, 1500]));
    const { rows: votes } = await db.query('SELECT winner_id, loser_id FROM pairwise_votes ORDER BY created_at ASC');
    for (const { winner_id, loser_id } of votes) {
        const rW = ratings.get(winner_id) ?? 1500;
        const rL = ratings.get(loser_id) ?? 1500;
        const expected = 1 / (1 + Math.pow(10, (rL - rW) / 400));
        const K = 32;
        ratings.set(winner_id, rW + K * (1 - expected));
        ratings.set(loser_id, rL - K * expected);
    }
    return ratings;
}
async function seedFounders(db) {
    const { rows } = await db.query('SELECT COUNT(*) as c FROM founders');
    if (Number(rows[0].c) > 0)
        return;
    const founders = [
        { name: 'Elon Musk', company: 'X / Tesla / SpaceX', title: 'Chief Meme Officer', bio: 'Prolific tweeter, rocket enthusiast, and self-styled free speech absolutist. Will challenge you to a cage fight.', arrogance: 9.2, controversial_takes: 9.8, interruption_tendency: 7.5, humblebragging: 6.0, buzzword_density: 5.5 },
        { name: 'Mark Zuckerberg', company: 'Meta', title: 'CEO & Human Simulator', bio: 'Drinks exactly 2.7 glasses of water per day. Trains MMA now. Definitely not a robot.', arrogance: 7.0, controversial_takes: 6.5, interruption_tendency: 5.0, humblebragging: 8.5, buzzword_density: 9.0 },
        { name: 'Sam Altman', company: 'OpenAI', title: 'AGI Whisperer', bio: 'Casually mentions that AGI might end civilization in the same breath as discussing his morning run.', arrogance: 7.5, controversial_takes: 8.0, interruption_tendency: 5.5, humblebragging: 9.0, buzzword_density: 8.5 },
        { name: 'Travis Kalanick', company: 'CloudKitchens', title: 'Disruption Veteran', bio: 'Rode regulatory battles at Uber like a hobby horse. Has strong opinions about everything.', arrogance: 8.5, controversial_takes: 8.0, interruption_tendency: 8.5, humblebragging: 7.0, buzzword_density: 7.0 },
        { name: 'Adam Neumann', company: 'Flow (formerly WeWork)', title: 'Consciousness Entrepreneur', bio: 'Sold hot desks as a spiritual journey. Still somehow raising billions.', arrogance: 9.5, controversial_takes: 8.5, interruption_tendency: 7.0, humblebragging: 9.5, buzzword_density: 10.0 },
        { name: 'Peter Thiel', company: 'Founders Fund', title: 'Contrarian Oracle', bio: 'Competition is for losers. Democracy is a problem to be solved. Extremely chill about all of it.', arrogance: 8.0, controversial_takes: 9.5, interruption_tendency: 4.0, humblebragging: 5.0, buzzword_density: 4.5 },
        { name: 'Gary Vaynerchuk', company: 'VaynerMedia', title: 'Hustle Maximalist', bio: 'Will tell you to wake up at 4am and document everything. Will also call you a "loser" with genuine warmth.', arrogance: 7.5, controversial_takes: 7.0, interruption_tendency: 9.0, humblebragging: 8.5, buzzword_density: 8.0 },
        { name: 'Elizabeth Holmes', company: 'Theranos (dissolved)', title: 'Visionary (retired)', bio: "Spoke in a mysterious baritone. The blood tests were fake but the inspiration was real (it wasn't).", arrogance: 9.0, controversial_takes: 7.0, interruption_tendency: 6.0, humblebragging: 9.0, buzzword_density: 8.5 },
        { name: 'Jack Dorsey', company: 'Block', title: 'Meditating Minimalist', bio: 'Only eats on weekends. Practices 10-day silent meditation retreats. Still somehow runs two companies.', arrogance: 5.0, controversial_takes: 7.5, interruption_tendency: 3.5, humblebragging: 8.0, buzzword_density: 6.0 },
        { name: 'Balaji Srinivasan', company: 'Various', title: 'Network State Prophet', bio: 'Will explain why everything you know about society is wrong in a 40-tweet thread. Occasionally correct.', arrogance: 7.0, controversial_takes: 9.5, interruption_tendency: 5.0, humblebragging: 6.5, buzzword_density: 8.0 },
        { name: 'Jeff Bezos', company: 'Amazon / Blue Origin', title: 'Day One Philosopher', bio: 'Insists every day at Amazon is "Day 1." Has been saying this for 30 years. Neck is very wide.', arrogance: 8.0, controversial_takes: 6.0, interruption_tendency: 6.5, humblebragging: 7.5, buzzword_density: 7.0 },
        { name: 'Reid Hoffman', company: 'LinkedIn / Greylock', title: 'Blitzscaling Evangelist', bio: 'Coined "blitzscaling." Wants you to know he coined "blitzscaling." Will reference "blitzscaling" again.', arrogance: 6.5, controversial_takes: 5.5, interruption_tendency: 5.5, humblebragging: 8.0, buzzword_density: 9.0 },
        { name: 'Marc Andreessen', company: 'a16z', title: 'Techno-Optimist Philosopher', bio: 'Published a 5,000-word manifesto about why technology will save us. Lives in a bunker in the hills.', arrogance: 8.5, controversial_takes: 9.0, interruption_tendency: 7.0, humblebragging: 7.0, buzzword_density: 8.5 },
        { name: 'Chamath Palihapitiya', company: 'Social Capital', title: 'SPAC King', bio: 'Goes on All-In Podcast and says the quiet part loud. Very loud.', arrogance: 9.0, controversial_takes: 9.5, interruption_tendency: 9.5, humblebragging: 8.0, buzzword_density: 7.0 },
        { name: 'Naval Ravikant', company: 'AngelList', title: 'Aphorism Dispenser', bio: 'Every tweet is a koan. "Desire is suffering." "Code is leverage." "Retweet if you want to get rich without luck."', arrogance: 6.0, controversial_takes: 7.0, interruption_tendency: 3.0, humblebragging: 8.5, buzzword_density: 7.5 },
        { name: 'Alexis Ohanian', company: 'Reddit / Seven Seven Six', title: 'Supportive Spouse / VC', bio: 'Cheerfully reminds you that he co-founded Reddit. Will also tell you about being a feminist ally.', arrogance: 5.5, controversial_takes: 4.5, interruption_tendency: 4.5, humblebragging: 9.0, buzzword_density: 6.5 },
        { name: 'Steve Jobs', company: 'Apple (historical)', title: 'Reality Distortion Field', bio: 'Wore the same outfit every day to avoid decision fatigue. Reserved all decisions for making people cry.', arrogance: 10.0, controversial_takes: 8.0, interruption_tendency: 9.5, humblebragging: 6.0, buzzword_density: 6.5 },
        { name: 'Larry Ellison', company: 'Oracle', title: 'Yacht Collector', bio: "Has been in a 40-year war with SAP. Owns an island in Hawaii. Thinks he's a samurai.", arrogance: 9.5, controversial_takes: 7.5, interruption_tendency: 8.5, humblebragging: 7.0, buzzword_density: 5.0 },
        { name: 'Patrick Collison', company: 'Stripe', title: 'Infrastructure Purist', bio: 'Reads more books than you. Thinks payments infrastructure is romantic. Is usually right about everything.', arrogance: 4.5, controversial_takes: 5.0, interruption_tendency: 3.0, humblebragging: 6.0, buzzword_density: 4.0 },
        { name: 'Yann LeCun', company: 'Meta AI', title: 'Deep Learning Godfather (Self-Appointed)', bio: 'Gets into extremely public fights on Twitter about AI capabilities. Always wins (in his own scoring system).', arrogance: 7.5, controversial_takes: 8.5, interruption_tendency: 7.0, humblebragging: 7.5, buzzword_density: 7.0 },
    ];
    for (const f of founders) {
        const sassy_score = Math.round((f.arrogance * 0.25 +
            f.controversial_takes * 0.25 +
            f.interruption_tendency * 0.2 +
            f.humblebragging * 0.15 +
            f.buzzword_density * 0.15) * 10) / 10;
        await db.query(`INSERT INTO founders (name, company, title, bio, sassy_score, arrogance, controversial_takes, interruption_tendency, humblebragging, buzzword_density)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [f.name, f.company, f.title, f.bio, sassy_score, f.arrogance, f.controversial_takes, f.interruption_tendency, f.humblebragging, f.buzzword_density]);
    }
    console.log('[db] Seeded founders');
}
async function seedScoreHistory(db) {
    const { rows: existing } = await db.query('SELECT COUNT(*) as c FROM score_history');
    if (Number(existing[0].c) > 0)
        return;
    const { rows: founders } = await db.query('SELECT id, sassy_score FROM founders');
    if (founders.length === 0)
        return;
    // Generate 30 days of mock history with small random walks
    const now = new Date();
    for (const founder of founders) {
        let score = founder.sassy_score;
        let communityScore = Math.max(1, score - 1 + Math.random() * 2);
        let eloScore = 1500 + (Math.random() - 0.5) * 200;
        for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
            const date = new Date(now);
            date.setDate(date.getDate() - daysAgo);
            const dateStr = date.toISOString().split('T')[0];
            // Small random walk — scores drift up to ±0.3 per day
            score = Math.min(10, Math.max(0, score + (Math.random() - 0.5) * 0.3));
            communityScore = Math.min(10, Math.max(0, communityScore + (Math.random() - 0.5) * 0.4));
            eloScore = Math.max(1000, Math.min(2200, eloScore + (Math.random() - 0.5) * 20));
            await db.query(`INSERT INTO score_history (founder_id, sassy_score, community_score, elo_score, recorded_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (founder_id, recorded_at) DO NOTHING`, [founder.id, Math.round(score * 10) / 10, Math.round(communityScore * 100) / 100, Math.round(eloScore * 10) / 10, dateStr]);
        }
    }
    console.log('[db] Seeded score history (30 days)');
}

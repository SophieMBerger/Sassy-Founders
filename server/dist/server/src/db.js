"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.computeEloRatings = computeEloRatings;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.join(__dirname, '../../data/sassy.db');
let db;
function getDb() {
    if (!db) {
        const fs = require('fs');
        fs.mkdirSync(path_1.default.dirname(DB_PATH), { recursive: true });
        db = new better_sqlite3_1.default(DB_PATH);
        db.pragma('journal_mode = WAL');
        initSchema(db);
        seedFounders(db);
    }
    return db;
}
function initSchema(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS founders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      image_url TEXT,
      bio TEXT NOT NULL,
      sassy_score REAL NOT NULL,
      arrogance REAL NOT NULL,
      controversial_takes REAL NOT NULL,
      interruption_tendency REAL NOT NULL,
      humblebragging REAL NOT NULL,
      buzzword_density REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      founder_id INTEGER NOT NULL REFERENCES founders(id),
      whiskey_units REAL NOT NULL CHECK(whiskey_units >= 0 AND whiskey_units <= 10),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pairwise_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      winner_id INTEGER NOT NULL REFERENCES founders(id),
      loser_id INTEGER NOT NULL REFERENCES founders(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
function computeEloRatings(db) {
    const founderIds = db.prepare('SELECT id FROM founders').all().map(r => r.id);
    const ratings = new Map(founderIds.map(id => [id, 1500]));
    const votes = db.prepare('SELECT winner_id, loser_id FROM pairwise_votes ORDER BY created_at ASC').all();
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
function seedFounders(db) {
    const count = db.prepare('SELECT COUNT(*) as c FROM founders').get().c;
    if (count > 0)
        return;
    const founders = [
        {
            name: 'Elon Musk',
            company: 'X / Tesla / SpaceX',
            title: 'Chief Meme Officer',
            bio: 'Prolific tweeter, rocket enthusiast, and self-styled free speech absolutist. Will challenge you to a cage fight.',
            arrogance: 9.2,
            controversial_takes: 9.8,
            interruption_tendency: 7.5,
            humblebragging: 6.0,
            buzzword_density: 5.5,
        },
        {
            name: 'Mark Zuckerberg',
            company: 'Meta',
            title: 'CEO & Human Simulator',
            bio: 'Drinks exactly 2.7 glasses of water per day. Trains MMA now. Definitely not a robot.',
            arrogance: 7.0,
            controversial_takes: 6.5,
            interruption_tendency: 5.0,
            humblebragging: 8.5,
            buzzword_density: 9.0,
        },
        {
            name: 'Sam Altman',
            company: 'OpenAI',
            title: 'AGI Whisperer',
            bio: 'Casually mentions that AGI might end civilization in the same breath as discussing his morning run.',
            arrogance: 7.5,
            controversial_takes: 8.0,
            interruption_tendency: 5.5,
            humblebragging: 9.0,
            buzzword_density: 8.5,
        },
        {
            name: 'Travis Kalanick',
            company: 'CloudKitchens',
            title: 'Disruption Veteran',
            bio: 'Rode regulatory battles at Uber like a hobby horse. Has strong opinions about everything.',
            arrogance: 8.5,
            controversial_takes: 8.0,
            interruption_tendency: 8.5,
            humblebragging: 7.0,
            buzzword_density: 7.0,
        },
        {
            name: 'Adam Neumann',
            company: 'Flow (formerly WeWork)',
            title: 'Consciousness Entrepreneur',
            bio: 'Sold hot desks as a spiritual journey. Still somehow raising billions.',
            arrogance: 9.5,
            controversial_takes: 8.5,
            interruption_tendency: 7.0,
            humblebragging: 9.5,
            buzzword_density: 10.0,
        },
        {
            name: 'Peter Thiel',
            company: 'Founders Fund',
            title: 'Contrarian Oracle',
            bio: 'Competition is for losers. Democracy is a problem to be solved. Extremely chill about all of it.',
            arrogance: 8.0,
            controversial_takes: 9.5,
            interruption_tendency: 4.0,
            humblebragging: 5.0,
            buzzword_density: 4.5,
        },
        {
            name: 'Gary Vaynerchuk',
            company: 'VaynerMedia',
            title: 'Hustle Maximalist',
            bio: 'Will tell you to wake up at 4am and document everything. Will also call you a "loser" with genuine warmth.',
            arrogance: 7.5,
            controversial_takes: 7.0,
            interruption_tendency: 9.0,
            humblebragging: 8.5,
            buzzword_density: 8.0,
        },
        {
            name: 'Elizabeth Holmes',
            company: 'Theranos (dissolved)',
            title: 'Visionary (retired)',
            bio: 'Spoke in a mysterious baritone. The blood tests were fake but the inspiration was real (it wasn\'t).',
            arrogance: 9.0,
            controversial_takes: 7.0,
            interruption_tendency: 6.0,
            humblebragging: 9.0,
            buzzword_density: 8.5,
        },
        {
            name: 'Jack Dorsey',
            company: 'Block',
            title: 'Meditating Minimalist',
            bio: 'Only eats on weekends. Practices 10-day silent meditation retreats. Still somehow runs two companies.',
            arrogance: 5.0,
            controversial_takes: 7.5,
            interruption_tendency: 3.5,
            humblebragging: 8.0,
            buzzword_density: 6.0,
        },
        {
            name: 'Balaji Srinivasan',
            company: 'Various',
            title: 'Network State Prophet',
            bio: 'Will explain why everything you know about society is wrong in a 40-tweet thread. Occasionally correct.',
            arrogance: 7.0,
            controversial_takes: 9.5,
            interruption_tendency: 5.0,
            humblebragging: 6.5,
            buzzword_density: 8.0,
        },
        {
            name: 'Jeff Bezos',
            company: 'Amazon / Blue Origin',
            title: 'Day One Philosopher',
            bio: 'Insists every day at Amazon is "Day 1." Has been saying this for 30 years. Neck is very wide.',
            arrogance: 8.0,
            controversial_takes: 6.0,
            interruption_tendency: 6.5,
            humblebragging: 7.5,
            buzzword_density: 7.0,
        },
        {
            name: 'Reid Hoffman',
            company: 'LinkedIn / Greylock',
            title: 'Blitzscaling Evangelist',
            bio: 'Coined "blitzscaling." Wants you to know he coined "blitzscaling." Will reference "blitzscaling" again.',
            arrogance: 6.5,
            controversial_takes: 5.5,
            interruption_tendency: 5.5,
            humblebragging: 8.0,
            buzzword_density: 9.0,
        },
        {
            name: 'Marc Andreessen',
            company: 'a16z',
            title: 'Techno-Optimist Philosopher',
            bio: 'Published a 5,000-word manifesto about why technology will save us. Lives in a bunker in the hills.',
            arrogance: 8.5,
            controversial_takes: 9.0,
            interruption_tendency: 7.0,
            humblebragging: 7.0,
            buzzword_density: 8.5,
        },
        {
            name: 'Chamath Palihapitiya',
            company: 'Social Capital',
            title: 'SPAC King',
            bio: 'Goes on All-In Podcast and says the quiet part loud. Very loud.',
            arrogance: 9.0,
            controversial_takes: 9.5,
            interruption_tendency: 9.5,
            humblebragging: 8.0,
            buzzword_density: 7.0,
        },
        {
            name: 'Naval Ravikant',
            company: 'AngelList',
            title: 'Aphorism Dispenser',
            bio: 'Every tweet is a koan. "Desire is suffering." "Code is leverage." "Retweet if you want to get rich without luck."',
            arrogance: 6.0,
            controversial_takes: 7.0,
            interruption_tendency: 3.0,
            humblebragging: 8.5,
            buzzword_density: 7.5,
        },
        {
            name: 'Alexis Ohanian',
            company: 'Reddit / Seven Seven Six',
            title: 'Supportive Spouse / VC',
            bio: 'Cheerfully reminds you that he co-founded Reddit. Will also tell you about being a feminist ally.',
            arrogance: 5.5,
            controversial_takes: 4.5,
            interruption_tendency: 4.5,
            humblebragging: 9.0,
            buzzword_density: 6.5,
        },
        {
            name: 'Steve Jobs',
            company: 'Apple (historical)',
            title: 'Reality Distortion Field',
            bio: 'Wore the same outfit every day to avoid decision fatigue. Reserved all decisions for making people cry.',
            arrogance: 10.0,
            controversial_takes: 8.0,
            interruption_tendency: 9.5,
            humblebragging: 6.0,
            buzzword_density: 6.5,
        },
        {
            name: 'Larry Ellison',
            company: 'Oracle',
            title: 'Yacht Collector',
            bio: 'Has been in a 40-year war with SAP. Owns an island in Hawaii. Thinks he\'s a samurai.',
            arrogance: 9.5,
            controversial_takes: 7.5,
            interruption_tendency: 8.5,
            humblebragging: 7.0,
            buzzword_density: 5.0,
        },
        {
            name: 'Patrick Collison',
            company: 'Stripe',
            title: 'Infrastructure Purist',
            bio: 'Reads more books than you. Thinks payments infrastructure is romantic. Is usually right about everything.',
            arrogance: 4.5,
            controversial_takes: 5.0,
            interruption_tendency: 3.0,
            humblebragging: 6.0,
            buzzword_density: 4.0,
        },
        {
            name: 'Yann LeCun',
            company: 'Meta AI',
            title: 'Deep Learning Godfather (Self-Appointed)',
            bio: 'Gets into extremely public fights on Twitter about AI capabilities. Always wins (in his own scoring system).',
            arrogance: 7.5,
            controversial_takes: 8.5,
            interruption_tendency: 7.0,
            humblebragging: 7.5,
            buzzword_density: 7.0,
        },
    ];
    const insert = db.prepare(`
    INSERT INTO founders (name, company, title, bio, sassy_score, arrogance, controversial_takes, interruption_tendency, humblebragging, buzzword_density)
    VALUES (@name, @company, @title, @bio, @sassy_score, @arrogance, @controversial_takes, @interruption_tendency, @humblebragging, @buzzword_density)
  `);
    const insertAll = db.transaction((rows) => {
        for (const row of rows) {
            const sassy_score = (row.arrogance * 0.25 +
                row.controversial_takes * 0.25 +
                row.interruption_tendency * 0.2 +
                row.humblebragging * 0.15 +
                row.buzzword_density * 0.15);
            insert.run({ ...row, sassy_score: Math.round(sassy_score * 10) / 10 });
        }
    });
    insertAll(founders);
}

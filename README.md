# Sassy Founders 🥃

> **SATIRE DISCLAIMER:** This site is entirely fictional and comedic. All scores are made up for entertainment purposes. We love (most of) these founders.

A ranking site for tech founders, measured in whiskey units — how much you'd need to drink to enjoy a conversation with them.

## Features

- **Official Leaderboard** — 20 seeded tech founders ranked by algorithmic sassy score
- **Community Ranking Mode** — toggle to sort by community votes
- **Founder Profiles** — per-founder score breakdown across 5 sassy dimensions
- **Community Voting** — submit your own whiskey unit rating (0–10)

## Tech Stack

- **Backend:** Node.js + TypeScript, Express, SQLite (better-sqlite3)
- **Frontend:** React 18 + TypeScript, Vite, React Router
- **Monorepo:** npm workspaces with shared types

## Setup

```bash
# Install all dependencies
npm run install:all

# Start dev server (backend on :3001, frontend on :5173)
npm run dev
```

Open http://localhost:5173 in your browser.

## Project Structure

```
├── server/          Express API + SQLite database
│   └── src/
│       ├── index.ts    Server entry point
│       ├── db.ts       Schema, seed data
│       └── routes.ts   API routes
├── client/          React + Vite frontend
│   └── src/
│       ├── App.tsx
│       ├── pages/
│       │   ├── Leaderboard.tsx
│       │   └── FounderDetail.tsx
│       └── components/
│           ├── Disclaimer.tsx
│           └── WhiskeyBar.tsx
└── shared/          Shared TypeScript types
    └── types.ts
```

## API

| Endpoint | Description |
|---|---|
| `GET /api/founders` | Leaderboard sorted by sassy score |
| `GET /api/founders/:id` | Founder detail + recent votes |
| `POST /api/founders/:id/vote` | Submit `{ whiskeyUnits: 0-10 }` |

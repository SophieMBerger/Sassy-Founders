import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getPool } from './db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export interface AuthUser {
  id: number;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  provider: string;
}

export function getAuthUser(req: Request): AuthUser | null {
  const token = req.cookies?.auth_token;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

function setAuthCookie(res: Response, user: AuthUser): void {
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

async function upsertUser(provider: string, providerId: string, email: string | null, name: string | null, avatarUrl: string | null): Promise<AuthUser> {
  const db = getPool();
  const { rows } = await db.query<{ id: number; name: string | null; email: string | null; avatar_url: string | null; provider: string }>(
    `INSERT INTO users (provider, provider_id, email, name, avatar_url)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (provider, provider_id) DO UPDATE
       SET email = EXCLUDED.email, name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
     RETURNING id, name, email, avatar_url, provider`,
    [provider, providerId, email, name, avatarUrl]
  );
  const row = rows[0];
  return { id: row.id, name: row.name, email: row.email, avatarUrl: row.avatar_url, provider: row.provider };
}

// GET /api/auth/me
router.get('/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json(user);
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.json({ ok: true });
});

// --- Google OAuth ---

// GET /api/auth/google
router.get('/google', (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: 'Google OAuth not configured' });
    return;
  }
  const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// GET /api/auth/google/callback
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    res.redirect(`${FRONTEND_URL}?auth_error=google_misconfigured`);
    return;
  }

  try {
    const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) throw new Error('No access token');

    // Get user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json() as { id: string; email?: string; name?: string; picture?: string };

    const user = await upsertUser('google', profile.id, profile.email ?? null, profile.name ?? null, profile.picture ?? null);
    setAuthCookie(res, user);
    res.redirect(FRONTEND_URL);
  } catch (err) {
    console.error('[auth] Google callback error:', err);
    res.redirect(`${FRONTEND_URL}?auth_error=google_failed`);
  }
});

// --- GitHub OAuth ---

// GET /api/auth/github
router.get('/github', (_req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: 'GitHub OAuth not configured' });
    return;
  }
  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'user:email',
    redirect_uri: `${process.env.API_URL || 'http://localhost:3001'}/api/auth/github/callback`,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// GET /api/auth/github/callback
router.get('/github/callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    res.redirect(`${FRONTEND_URL}?auth_error=github_misconfigured`);
    return;
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) throw new Error('No access token');

    // Get user profile
    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'SassyFounders/0.1' },
    });
    const profile = await profileRes.json() as { id: number; login: string; name?: string; avatar_url?: string; email?: string };

    // GitHub may not return email in profile — fetch separately if needed
    let email = profile.email ?? null;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'SassyFounders/0.1' },
      });
      const emails = await emailsRes.json() as { email: string; primary: boolean; verified: boolean }[];
      email = emails.find(e => e.primary && e.verified)?.email ?? emails[0]?.email ?? null;
    }

    const user = await upsertUser('github', String(profile.id), email, profile.name ?? profile.login, profile.avatar_url ?? null);
    setAuthCookie(res, user);
    res.redirect(FRONTEND_URL);
  } catch (err) {
    console.error('[auth] GitHub callback error:', err);
    res.redirect(`${FRONTEND_URL}?auth_error=github_failed`);
  }
});

export default router;

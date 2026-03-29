import type { VercelRequest, VercelResponse } from '@vercel/node';
import app, { ensureInitialized } from '../server/src/app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureInitialized();
  return new Promise<void>((resolve, reject) => {
    app(req as unknown as Parameters<typeof app>[0], res as unknown as Parameters<typeof app>[1], (err?: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

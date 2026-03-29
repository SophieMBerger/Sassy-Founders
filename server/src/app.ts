import express from 'express';
import cors from 'cors';
import routes from './routes';
import { initSchema, updateFounderImages } from './db';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', routes);

let initialized = false;

export async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  initialized = true;
  await initSchema();
  updateFounderImages().catch(err => console.error('[images] Failed to update founder images:', err));
}

export default app;

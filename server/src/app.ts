import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import authRoutes from './auth';
import stripeRouter, { stripeWebhookHandler } from './stripe';
import { initSchema, updateFounderImages } from './db';

const app = express();

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();

app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// Webhook must use raw body before express.json() parses it
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRouter);
app.use('/api', routes);

let initialized = false;

export async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  initialized = true;
  await initSchema();
  updateFounderImages().catch(err => console.error('[images] Failed to update founder images:', err));
}

export default app;

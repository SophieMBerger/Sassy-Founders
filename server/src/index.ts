import app, { ensureInitialized } from './app';

const PORT = process.env.PORT || 3001;

ensureInitialized().then(() => {
  app.listen(PORT, () => {
    console.log(`Sassy Founders API running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize:', err);
  process.exit(1);
});

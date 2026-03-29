import express from 'express';
import cors from 'cors';
import routes from './routes';
import { getDb, updateFounderImages } from './db';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Sassy Founders API running on http://localhost:${PORT}`);
  getDb(); // ensure DB is initialized
  updateFounderImages().catch(err => console.error('[images] Failed to update founder images:', err));
});

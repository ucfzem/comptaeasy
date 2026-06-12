import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSchema } from './db/database.js';
import dashboardRouter from './routes/dashboard.js';
import entriesRouter from './routes/entries.js';
import clientsRouter from './routes/clients.js';
import ocrRouter from './routes/ocr.js';
import fecRouter from './routes/fec.js';
import iaRouter from './routes/ia.js';
import veilleRouter from './routes/veille.js';
import alertesRouter from './routes/alertes.js';
import financeRouter from './routes/finance.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Init DB + seed if empty
initSchema();

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/dashboard', dashboardRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/ocr', ocrRouter);
app.use('/api/fec', fecRouter);
app.use('/api/ia', iaRouter);
app.use('/api/veille', veilleRouter);
app.use('/api/alertes', alertesRouter);

app.use('/api/finance', financeRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// Serve front
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ ComptaEasy API running on port ${PORT}`);
  console.log(`  Dashboard: http://localhost:${PORT}`);
  console.log(`  API:       http://localhost:${PORT}/api/health`);
});

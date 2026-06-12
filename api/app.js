import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSchema } from '../db/database.js';
import dashboardRouter from '../routes/dashboard.js';
import entriesRouter from '../routes/entries.js';
import clientsRouter from '../routes/clients.js';
import ocrRouter from '../routes/ocr.js';
import fecRouter from '../routes/fec.js';
import iaRouter from '../routes/ia.js';
import veilleRouter from '../routes/veille.js';
import alertesRouter from '../routes/alertes.js';
import financeRouter from '../routes/finance.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

initSchema();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/dashboard', dashboardRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/ocr', ocrRouter);
app.use('/api/fec', fecRouter);
app.use('/api/ia', iaRouter);
app.use('/api/veille', veilleRouter);
app.use('/api/alertes', alertesRouter);
app.use('/api/finance', financeRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

export default app;

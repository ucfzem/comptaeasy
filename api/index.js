import initSqlJs from 'sql.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    const SQL = await initSqlJs({
      locateFile: file => path.join(__dirname, file)
    });
    const db = new SQL.Database();
    const result = db.exec("SELECT sqlite_version() as v")[0];
    res.json({ status: 'ok', version: '1.0.0', sqlite: result.values[0][0] });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0, 3).join('\n') });
  }
});

app.get('*', (req, res) => res.json({ error: 'not found' }));

export default app;

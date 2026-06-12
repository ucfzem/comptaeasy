import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { setDb, setSQL } from './db/database.js';
import { createTables } from './db/schema.js';
import { runSeed } from './db/seed.js';
import { createApp } from './api/app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

async function start() {
  const SQL = await initSqlJs({
    locateFile: file => path.join(__dirname, 'api', file)
  });
  const db = new SQL.Database();
  createTables(db);
  setDb(db);
  setSQL(SQL);
  await runSeed();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`✓ ComptaEasy API on port ${PORT}`);
  });
}

start();

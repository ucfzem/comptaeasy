import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { setDb, setSQL } from '../db/database.js';
import { createTables } from '../db/schema.js';
import { runSeed } from '../db/seed.js';
import { createApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = createApp();
let ready = false;

export default async (req, res) => {
  if (!ready) {
    const SQL = await initSqlJs({
      locateFile: file => path.join(__dirname, file)
    });
    const db = new SQL.Database();
    createTables(db);
    setDb(db);
    setSQL(SQL);
    await runSeed();
    ready = true;
  }
  app(req, res);
};

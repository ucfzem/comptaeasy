import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');

let db;
let SQL;

export async function getDb() {
  if (db) return db;
  SQL = await initSqlJs({
    locateFile: file => path.join(__dirname, '..', 'api', file)
  });
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }
  return db;
}

export function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export async function initSchema() {
  const d = await getDb();
  d.run("PRAGMA journal_mode=WAL");
  d.run(`CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, siren TEXT, fiscal_year INTEGER DEFAULT 2024
  )`);
  d.run(`CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, date TEXT NOT NULL, label TEXT NOT NULL,
    piece TEXT, account_code TEXT NOT NULL, debit REAL DEFAULT 0, credit REAL DEFAULT 0,
    status TEXT DEFAULT 'pending', match_ref TEXT, created_at TEXT DEFAULT (datetime('now'))
  )`);
  d.run(`CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, address TEXT,
    email TEXT, doc_count INTEGER DEFAULT 0, status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  d.run(`CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
    urgency TEXT DEFAULT 'amber', due_date TEXT, created_at TEXT DEFAULT (datetime('now'))
  )`);
  saveDb();
}

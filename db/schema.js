export function createTables(db) {
  db.run("PRAGMA journal_mode=WAL");
  db.run(`CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, siren TEXT, fiscal_year INTEGER DEFAULT 2024
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, date TEXT NOT NULL, label TEXT NOT NULL,
    piece TEXT, account_code TEXT NOT NULL, debit REAL DEFAULT 0, credit REAL DEFAULT 0,
    status TEXT DEFAULT 'pending', match_ref TEXT, created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, address TEXT,
    email TEXT, doc_count INTEGER DEFAULT 0, status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
    urgency TEXT DEFAULT 'amber', due_date TEXT, created_at TEXT DEFAULT (datetime('now'))
  )`);
}

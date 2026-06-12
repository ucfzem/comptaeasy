let _db;
let _SQL;

export function setDb(db) {
  _db = db;
}

export function setSQL(SQL) {
  _SQL = SQL;
}

export function getDb() {
  return _db;
}

export function saveDb() {
  if (!_db || !_SQL) return;
}

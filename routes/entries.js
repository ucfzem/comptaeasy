import { Router } from 'express';
import { getDb, saveDb } from '../db/database.js';
import { v4 as uuid } from 'uuid';

const router = Router();

router.get('/', (req, res) => {
  const d = getDb();
  const result = d.exec("SELECT * FROM entries WHERE tenant_id='demo-001' ORDER BY date DESC");
  const rows = result.length ? result[0].values : [];

  const entries = rows.map(r => ({
    id: r[0], date: r[2], label: r[3],
    piece: r[4], account_code: r[5],
    debit: Number(r[6]), credit: Number(r[7]),
    status: r[8], match_ref: r[9],
  }));
  const unmatched = req.query.unmatched === 'true' ? entries.filter(e => !e.match_ref) : entries;
  res.json({ entries: unmatched, total: unmatched.length, unmatched_count: entries.filter(e => !e.match_ref).length });
});

router.post('/', (req, res) => {
  const d = getDb();
  const { date, label, piece, account_code, debit, credit } = req.body;
  const id = uuid();
  d.run("INSERT INTO entries (id, tenant_id, date, label, piece, account_code, debit, credit) VALUES (?,?,?,?,?,?,?,?)",
    [id, 'demo-001', date, label, piece || null, account_code, debit || 0, credit || 0]);
  saveDb();
  res.json({ success: true, id });
});

router.post('/match', (req, res) => {
  const d = getDb();
  const { ids, ref } = req.body;
  if (!ids?.length) return res.status(400).json({ error: 'No IDs' });
  const matchRef = ref || `M-${Date.now()}`;
  for (const id of ids) d.run(`UPDATE entries SET status='validated', match_ref='${matchRef}' WHERE id='${id}'`);
  saveDb();
  res.json({ success: true, matched: ids.length, ref: matchRef });
});

router.patch('/:id', (req, res) => {
  const d = getDb();
  const sets = [];
  for (const k of ['label', 'account_code', 'debit', 'credit', 'status']) {
    if (req.body[k] !== undefined) sets.push(`${k}=${typeof req.body[k] === 'string' ? `'${req.body[k]}'` : req.body[k]}`);
  }
  if (sets.length) d.run(`UPDATE entries SET ${sets.join(',')} WHERE id='${req.params.id}'`);
  saveDb();
  res.json({ success: true });
});

export default router;

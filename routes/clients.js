import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', (req, res) => {
  const d = getDb();
  const result = d.exec("SELECT * FROM clients WHERE tenant_id='demo-001' ORDER BY doc_count DESC");
  const rows = result.length ? result[0].values : [];

  const clients = rows.map(r => ({
    id: r[0], name: r[2], address: r[3] || '',
    email: r[4] || '', doc_count: r[5] || 0,
  }));
  const totalDocs = clients.reduce((s, c) => s + c.doc_count, 0);
  res.json({ clients, stats: { total: clients.length, total_docs: totalDocs, treated: clients.filter(c => c.doc_count > 0).length, pending: clients.filter(c => c.doc_count === 0).length } });
});

export default router;

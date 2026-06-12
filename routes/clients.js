import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', async (req, res) => {
  const d = await getDb();
  const rows = d.exec("SELECT * FROM clients WHERE tenant_id='demo-001' ORDER BY doc_count DESC");
  const clients = rows.map(r => ({
    id: r.values[0][0], name: r.values[0][2], address: r.values[0][3] || '',
    email: r.values[0][4] || '', doc_count: r.values[0][5] || 0,
  }));
  const totalDocs = clients.reduce((s, c) => s + c.doc_count, 0);
  res.json({ clients, stats: { total: clients.length, total_docs: totalDocs, treated: clients.filter(c => c.doc_count > 0).length, pending: clients.filter(c => c.doc_count === 0).length } });
});

export default router;

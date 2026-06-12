import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', async (req, res) => {
  const d = await getDb();
  const rows = d.exec("SELECT * FROM alerts WHERE tenant_id='demo-001' ORDER BY CASE urgency WHEN 'red' THEN 0 WHEN 'amber' THEN 1 ELSE 2 END, due_date ASC");
  const entries = d.exec("SELECT * FROM entries WHERE tenant_id='demo-001'");

  const totalDebit = entries.reduce((s, r) => s + Number(r.values[0][6]), 0);
  const totalCredit = entries.reduce((s, r) => s + Number(r.values[0][7]), 0);
  const matched = entries.filter(r => r.values[0][9]).length;

  res.json({
    alerts: rows.map(r => ({ title: r.values[0][2], description: r.values[0][3], urgency: r.values[0][4], due_date: r.values[0][5] })),
    cloture: {
      progress: Math.round(matched / Math.max(entries.length, 1) * 100),
      balance_debit: totalDebit, balance_credit: totalCredit,
      balance_ok: Math.abs(totalDebit - totalCredit) < 0.01,
      entry_count: entries.length,
    },
    cashflow: {
      encaissements: [62000, 67000, 72000, 74000, 77000, 79000],
      decaissements: [44000, 52000, 47000, 54000, 57000, 60000],
      months: ['Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'],
    },
  });
});

export default router;

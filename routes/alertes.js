import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', (req, res) => {
  const d = getDb();

  const alertsResult = d.exec("SELECT * FROM alerts WHERE tenant_id='demo-001' ORDER BY CASE urgency WHEN 'red' THEN 0 WHEN 'amber' THEN 1 ELSE 2 END, due_date ASC");
  const alertRows = alertsResult.length ? alertsResult[0].values : [];

  const entriesResult = d.exec("SELECT * FROM entries WHERE tenant_id='demo-001'");
  const entryRows = entriesResult.length ? entriesResult[0].values : [];

  const totalDebit = entryRows.reduce((s, r) => s + Number(r[6]), 0);
  const totalCredit = entryRows.reduce((s, r) => s + Number(r[7]), 0);
  const matched = entryRows.filter(r => r[9]).length;

  res.json({
    alerts: alertRows.map(r => ({ title: r[2], description: r[3], urgency: r[4], due_date: r[5] })),
    cloture: {
      progress: Math.round(matched / Math.max(entryRows.length, 1) * 100),
      balance_debit: totalDebit, balance_credit: totalCredit,
      balance_ok: Math.abs(totalDebit - totalCredit) < 0.01,
      entry_count: entryRows.length,
    },
    cashflow: {
      encaissements: [62000, 67000, 72000, 74000, 77000, 79000],
      decaissements: [44000, 52000, 47000, 54000, 57000, 60000],
      months: ['Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'],
    },
  });
});

export default router;

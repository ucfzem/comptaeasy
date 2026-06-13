import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

function query(d, sql) {
  const r = d.exec(sql);
  return r.length ? r[0].values : [];
}

function val(d, sql) {
  const rows = query(d, sql);
  return rows.length ? rows[0][0] : 0;
}

router.get('/', (req, res) => {
  const d = getDb();
  const t = 'demo-001';

  const totalDebit = Number(val(d, `SELECT COALESCE(SUM(debit),0) FROM entries WHERE tenant_id='${t}'`));
  const totalCredit = Number(val(d, `SELECT COALESCE(SUM(credit),0) FROM entries WHERE tenant_id='${t}'`));
  const entryCount = Number(val(d, `SELECT COUNT(*) FROM entries WHERE tenant_id='${t}'`));
  const matchedCount = Number(val(d, `SELECT COUNT(*) FROM entries WHERE tenant_id='${t}' AND match_ref IS NOT NULL`));
  const clientCount = Number(val(d, `SELECT COUNT(*) FROM clients WHERE tenant_id='${t}'`));

  const entryRows = query(d, `SELECT * FROM entries WHERE tenant_id='${t}' ORDER BY date DESC LIMIT 6`);
  const alertRows = query(d, `SELECT * FROM alerts WHERE tenant_id='${t}' ORDER BY CASE urgency WHEN 'red' THEN 0 WHEN 'amber' THEN 1 ELSE 2 END, due_date ASC LIMIT 6`);
  const clientRows = query(d, `SELECT * FROM clients WHERE tenant_id='${t}'`);

  res.json({
    kpi: {
      ca: Math.round(totalCredit * 0.6),
      caDelta: '+8.4%',
      resultat: Math.round(totalCredit * 0.15),
      resultatDelta: '+5.2%',
      tvaMontant: 569500,
      tvaDate: '15 Jan 2026',
      lettrageCount: matchedCount,
      lettrageTotal: entryCount,
      ticker: {
        ca: `${(totalCredit * 0.6).toLocaleString('fr-FR')} €`,
        tva: '569 500 €',
        clients: String(clientCount),
        ecritures: String(entryCount),
        is: '142 375 €',
        amort: '38 900 €',
      },
    },
    journal: entryRows.map(r => ({
      date: r[2], piece: r[4] || '', label: r[3], compte: r[5],
      debit: Number(r[6]), credit: Number(r[7]), statut: r[8],
    })),
    alerts: alertRows.map(r => ({
      title: r[2], description: r[3], urgency: r[4], due_date: r[5],
    })),
    clients: clientRows.map(r => ({
      name: r[2], address: r[3] || '', doc_count: r[5] || 0,
    })),
  });
});

export default router;

import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', (req, res) => {
  const d = getDb();
  const year = req.query.year || 2024;
  const result = d.exec(`SELECT * FROM entries WHERE tenant_id='demo-001' AND date LIKE '${year}-%' ORDER BY date`);
  const rows = result.length ? result[0].values : [];

  const lines = ['JournalCode;JournalLib;EcritureNum;EcritureDate;CompteNum;CompteLib;PieceNum;EcritureLib;Debit;Credit;EcritureLet;DateLet;ValidDate;Montantdevise;Iodevise'];
  rows.forEach((r, i) => {
    const date = (r[2] || '').replace(/-/g, '');
    const row = [
      'VT', 'Opérations diverses', i + 1, date, r[5], `Compte ${r[5]}`,
      r[4] || `PIECE-${i + 1}`, r[3],
      Number(r[6]).toFixed(2), Number(r[7]).toFixed(2),
      r[9] || '', '', date, '', '',
    ].join(';');
    lines.push(row);
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="FEC_${year}.csv"`);
  res.send(lines.join('\n'));
});

export default router;

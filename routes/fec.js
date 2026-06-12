import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', async (req, res) => {
  const d = await getDb();
  const year = req.query.year || 2024;
  const rows = d.exec(`SELECT * FROM entries WHERE tenant_id='demo-001' AND date LIKE '${year}-%' ORDER BY date`);

  const lines = ['JournalCode;JournalLib;EcritureNum;EcritureDate;CompteNum;CompteLib;PieceNum;EcritureLib;Debit;Credit;EcritureLet;DateLet;ValidDate;Montantdevise;Iodevise'];
  rows.forEach((r, i) => {
    const date = (r.values[0][2] || '').replace(/-/g, '');
    const row = [
      'VT', 'Opérations diverses', i + 1, date, r.values[0][5], `Compte ${r.values[0][5]}`,
      r.values[0][4] || `PIECE-${i + 1}`, r.values[0][3],
      Number(r.values[0][6]).toFixed(2), Number(r.values[0][7]).toFixed(2),
      r.values[0][9] || '', '', date, '', '',
    ].join(';');
    lines.push(row);
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="FEC_${year}.csv"`);
  res.send(lines.join('\n'));
});

export default router;

import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/bilan', async (req, res) => {
  const d = await getDb();
  const entries = d.exec("SELECT * FROM entries WHERE tenant_id='demo-001'");
  const tDebit = entries.reduce((s, r) => s + Number(r.values[0][6]), 0);
  const tCredit = entries.reduce((s, r) => s + Number(r.values[0][7]), 0);
  const total = Math.round(Math.max(tDebit, tCredit) * 1.4);
  res.json({
    actif: [['Immobilisations', Math.round(total * 0.48)], ['Stocks', Math.round(total * 0.10)], ['Créances', Math.round(total * 0.27)], ['Trésorerie', Math.round(total * 0.15)]],
    passif: [['Capitaux propres', Math.round(total * 0.65)], ['Dettes financières', Math.round(total * 0.17)], ['Dettes fournisseurs', Math.round(total * 0.13)], ['Dettes fiscales', Math.round(total * 0.05)]],
  });
});

router.get('/cr', async (req, res) => {
  const d = await getDb();
  const entries = d.exec("SELECT * FROM entries WHERE tenant_id='demo-001'");
  const total = entries.reduce((s, r) => s + Number(r.values[0][6]) + Number(r.values[0][7]), 0);
  res.json({
    charges: [['Achats', Math.round(total * 0.35)], ['Salaires', Math.round(total * 0.23)], ['Amortissements', Math.round(total * 0.02)], ['Frais généraux', Math.round(total * 0.12)]],
    produits: [['Ventes', Math.round(total * 0.9)], ['Autres produits', Math.round(total * 0.1)]],
  });
});

router.get('/annexe', async (req, res) => {
  res.json({ notes: ['Règles et méthodes comptables', 'Faits marquants de l\'exercice', 'Notes sur le bilan', 'Notes sur le compte de résultat'] });
});

router.post('/is/calculate', (req, res) => {
  const profit = parseFloat(req.body.profit) || 0;
  const r15 = Math.min(profit, 42622) * 0.15;
  const r25 = Math.max(0, profit - 42622) * 0.25;
  res.json({ is_15: Math.round(r15), is_25: Math.round(r25), total: Math.round(r15 + r25), taux_effectif: profit > 0 ? Math.round((r15 + r25) / profit * 10000) / 100 : 0 });
});

router.get('/tresorerie', async (req, res) => {
  res.json({ encaissements: [62000, 67000, 72000, 74000, 77000, 79000], decaissements: [44000, 52000, 47000, 54000, 57000, 60000], months: ['Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'] });
});

router.get('/balance', async (req, res) => {
  const d = await getDb();
  const entries = d.exec("SELECT * FROM entries WHERE tenant_id='demo-001'");
  const totalDebit = entries.reduce((s, r) => s + Number(r.values[0][6]), 0);
  const totalCredit = entries.reduce((s, r) => s + Number(r.values[0][7]), 0);
  res.json({ total_debit: totalDebit, total_credit: totalCredit, ecart: totalDebit - totalCredit, equilibre: Math.abs(totalDebit - totalCredit) < 0.01, nb_ecritures: entries.length });
});

export default router;

import { Router } from 'express';

const router = Router();

const VEILLE_ARTICLES = [
  { title: 'CGI Maroc art. 17-I : Taux IS 2026 — barème progressif 10%-31%', date: '12 Jan 2026', tags: ['IS', 'Conformité'], source: 'DGI' },
  { title: 'CGI Maroc art. 92 : Franchise TVA relevée à 500 000 MAD', date: '8 Jan 2026', tags: ['TVA', 'Franchise'], source: 'DGI' },
  { title: 'CGI Maroc art. 25 : Délai FEC fixé à 30 jours', date: '5 Jan 2026', tags: ['FEC', 'Urgent'], source: 'Code Général des Impôts' },
  { title: 'Loi de Finances 2026 Maroc : mesures fiscales adoptées', date: '1 Jan 2026', tags: ['Fiscal'], source: 'Code Général des Impôts' },
  { title: 'Barème kilométrique 2026 Maroc publié par la DGI', date: '28 Déc 2025', tags: ['Fiscal'], source: 'DGI' },
  { title: 'Seuils de certification légale revalorisés — Maroc', date: '15 Déc 2025', tags: ['Comptabilité'], source: 'DGI' },
  { title: 'Dématérialisation factures Maroc : échéance 2026', date: '10 Déc 2025', tags: ['E-invoicing'], source: 'DGI' },
];

router.get('/', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  let articles = VEILLE_ARTICLES;
  if (q) {
    articles = articles.filter(a =>
      a.title.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  res.json({ articles, total: articles.length });
});

export default router;

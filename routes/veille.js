import { Router } from 'express';

const router = Router();

const VEILLE_ARTICLES = [
  { title: 'BOI-IS-DEC-20 : Taux IS 2026 confirmé à 25%', date: '12 Jan 2026', tags: ['IS', 'Conformité'], source: 'BOFIP' },
  { title: 'BOI-TVA-DEC-30 : Franchise en base relevée à 91 900 €', date: '8 Jan 2026', tags: ['TVA', 'Franchise'], source: 'BOFIP' },
  { title: 'C. com. art. L123-12 : Délai FEC allongé à 30 jours ouvrés', date: '5 Jan 2026', tags: ['FEC', 'Urgent'], source: 'Légifrance' },
  { title: 'Loi de Finances 2026 : mesures adoptées', date: '1 Jan 2026', tags: ['Fiscal'], source: 'Légifrance' },
  { title: 'Barème kilométrique 2026 publié', date: '28 Déc 2025', tags: ['Fiscal'], source: 'BOFIP' },
  { title: 'Seuils de certification légale revalorisés', date: '15 Déc 2025', tags: ['Comptabilité'], source: 'H3C' },
  { title: 'Dématérialisation des factures : échéance 2026', date: '10 Déc 2025', tags: ['E-invoicing'], source: 'DGFiP' },
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

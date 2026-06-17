import { Router } from 'express';
import { getDb, saveDb } from '../db/database.js';
import { v4 as uuid } from 'uuid';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const RULES = [
  { k: ['edf', 'enedis'], ac: '606100', lb: 'Énergie' },
  { k: ['orange', 'sfr', 'free'], ac: '606400', lb: 'Fournitures administratives' },
  { k: ['bp', 'total', 'shell'], ac: '606300', lb: 'Carburant' },
  { k: ['dupont'], ac: '601100', lb: 'Achats matières' },
];

function suggest(s) {
  const t = (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const r of RULES) if (r.k.some(k => t.includes(k))) return r;
  return { ac: '606400', lb: 'Fournitures administratives' };
}

router.post('/vision', async (req, res) => {
  const { image, media_type } = req.body;
  const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;
  if (!CLAUDE_KEY) return res.status(400).json({ error: 'Clé Anthropic manquante sur le serveur' });
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: media_type || 'image/jpeg', data: image } },
            { type: 'text', text: 'Tu es un OCR comptable. Extrais les données de cette facture et réponds UNIQUEMENT en JSON valide, sans backticks ni explication, avec exactement ces clés:\n{\n  "supplier": "nom du fournisseur ou émetteur",\n  "invoice_no": "numéro de facture",\n  "date": "JJ/MM/AAAA",\n  "montant_ht": 0.00,\n  "tva": 0.00,\n  "montant_ttc": 0.00,\n  "account": "601100",\n  "account_label": "Achats matières"\n}\nSi une valeur est absente, utilise null pour les nombres et "—" pour les textes.\nPour le compte comptable, déduis-le du type de prestation (loyer→613200, honoraires→622700, télécom→626000, publicité→623000, fournitures→601100, transport→624100).' }
          ]
        }]
      })
    });
    const json = await resp.json();
    if (!resp.ok) { const e = json.error || {}; throw new Error(e.message || `HTTP ${resp.status}`); }
    const text = (json.content || []).map(b => b.text || '').join('').trim();
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    console.error('Vision proxy error:', err);
    res.status(502).json({ error: err.message });
  }
});

router.post('/analyze', upload.single('file'), (req, res) => {
  const name = req.body.supplier || 'SARL Dupont';
  const ttc = parseFloat(req.body.amount) || 1500;
  const tva = Math.round(ttc * 20 / 120 * 100) / 100;
  const ht = Math.round((ttc - tva) * 100) / 100;
  const s = suggest(name);

  const d = getDb();
  const id = uuid();
  d.run("INSERT INTO entries (id, tenant_id, date, label, piece, account_code, debit, credit, status) VALUES (?,?,?,?,?,?,?,?,'pending')",
    [id, 'demo-001', new Date().toISOString().slice(0, 10), `Fournitures ${name}`, req.file?.originalname || 'facture.pdf', s.ac, ht, 0]);
  saveDb();

  res.json({ success: true, confidence: 97.5, data: { supplier: name, montant_ttc: ttc, tva, ht, account: s.ac, account_label: s.lb, entry_id: id } });
});

export default router;

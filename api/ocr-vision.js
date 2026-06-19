const VISION_PROMPT = 'Tu es un OCR comptable. Extrais les données de cette facture et réponds UNIQUEMENT en JSON valide, sans backticks ni explication, avec exactement ces clés:\n{\n  "supplier": "nom du fournisseur ou émetteur",\n  "invoice_no": "numéro de facture",\n  "date": "JJ/MM/AAAA",\n  "montant_ht": 0.00,\n  "tva": 0.00,\n  "montant_ttc": 0.00,\n  "account": "601100",\n  "account_label": "Achats matières"\n}\nSi une valeur est absente, utilise null pour les nombres et "—" pour les textes.\nPour le compte comptable, déduis-le du type de prestation (loyer→613200, honoraires→622700, télécom→626000, publicité→623000, fournitures→601100, transport→624100).';

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body;
  try {
    body = JSON.parse(req.body);
  } catch {
    return res.status(400).json({ error: 'JSON invalide' });
  }

  const { base64, mediaType, apiKey } = body || {};
  if (!apiKey) return res.status(400).json({ error: 'Clé API manquante' });

  const isDoc = mediaType === 'application/pdf';

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: VISION_PROMPT,
        messages: [{
          role: 'user',
          content: [
            isDoc
              ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } }
              : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: "Extrais les données de cette facture au format JSON indiqué." }
          ]
        }]
      }),
    });

    if (!resp.ok) {
      const e = await resp.json().catch(() => ({}));
      return res.status(resp.status).json({ error: e.error?.message || `HTTP ${resp.status}` });
    }

    const json = await resp.json();
    const text = json.content?.map(c => c.text).filter(Boolean).join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
};

import { Router } from 'express';

const router = Router();
const GEMINI_KEY = process.env.GEMINI_KEY;

const SYSTEM_PROMPT = `Tu es un expert-comptable et fiscaliste senior français. 
Réponds avec précision en utilisant la terminologie du PCG, du CGI et des normes IFRS. 
Sois concis (max 150 mots). Si on te pose une question hors comptabilité/fiscalité, 
réponds "Je suis spécialisé en comptabilité et fiscalité. Posez-moi une question sur ces sujets."
Utilise du HTML simple pour la mise en forme (strong, br).`;

router.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.json({ answer: '❓ Posez-moi une question (IS, TVA, FEC, amortissement…).' });
  if (!GEMINI_KEY) throw new Error('No API key configured');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${SYSTEM_PROMPT}\n\nQuestion : ${question}` }]
        }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.3 }
      })
    });

    const data = await response.json();

    // Quota exhausted → fallback
    if (data?.error || !data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error(data?.error?.message || 'No response');
    }

    const text = data.candidates[0].content.parts[0].text;
    res.json({
      answer: text.replace(/\n/g, '<br>'),
      sources: ['IA Gemini · ComptaEasy'],
    });
  } catch (e) {
    console.error('Gemini error:', e.message);
    // Fallback
    const fallbacks = {
      is: 'Le taux normal de l\'IS est fixé à <strong>25%</strong> pour les exercices ouverts depuis 2022. Le taux réduit de <strong>15%</strong> s\'applique sur la fraction ≤ 42 622 € (PME éligibles).',
      tva: 'Régime réel normal de TVA : CA > 840 000 € (ventes) ou > 254 000 € (prestations). Déclaration <strong>CA3</strong>. Taux normal : <strong>20%</strong>.',
      fec: 'FEC (Fichier des Écritures Comptables) obligatoire en cas de contrôle DGFiP. Norme 2013 : 18 colonnes, format CSV/UTF-8.',
    };
    const q = question.toLowerCase();
    let answer = 'Service IA momentanément indisponible. Veuillez réessayer.';
    for (const [key, val] of Object.entries(fallbacks)) {
      if (q.includes(key)) { answer = val; break; }
    }
    res.json({ answer, sources: ['Cache local ComptaEasy'] });
  }
});

export default router;

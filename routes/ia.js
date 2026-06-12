import { Router } from 'express';

const router = Router();
const OR_KEY = process.env.OPENROUTER_KEY;

const SYSTEM_PROMPT = `Tu es un expert-comptable et fiscaliste senior français.
Réponds avec précision en utilisant la terminologie du PCG, du CGI et des normes IFRS.
Sois concis (max 150 mots). Si on te pose une question hors comptabilité/fiscalité,
réponds "Je suis spécialisé en comptabilité et fiscalité. Posez-moi une question sur ces sujets."
Utilise du HTML simple pour la mise en forme (strong, br).`;

const FALLBACKS = {
  is: 'Le taux normal de l\'IS est fixé à <strong>25%</strong> pour les exercices ouverts depuis 2022. Le taux réduit de <strong>15%</strong> s\'applique sur la fraction ≤ 42 622 € (PME éligibles).',
  tva: 'Régime réel normal de TVA : CA > 840 000 € (ventes) ou > 254 000 € (prestations). Déclaration <strong>CA3</strong>. Taux normal : <strong>20%</strong>.',
  fec: 'FEC (Fichier des Écritures Comptables) obligatoire en cas de contrôle DGFiP. Norme 2013 : 18 colonnes, format CSV/UTF-8.',
  cet: 'CET = CFE + CVAE. Plafond : 3% de la VA. Déclaration obligatoire avant la 2<sup>ème</sup> échéance.',
  cvae: 'CVAE : cotisation sur la valeur ajoutée des entreprises (CA > 500k€). Taux variable selon CA. Déclaration n°1329AC.',
  cfe: 'CFE : cotisation foncière des entreprises. Base = valeur locative des biens imposables. Due par tout contribuable exerçant une activité professionnelle non salariée.',
  amort: 'Amortissement linéaire = coût × (1/durée). Dégressif possible pour biens neufs (durée ≥ 3 ans).',
  'plus-value': 'Plus-value professionnelle : court terme (≤ 2 ans) imposée au BIC/BN, long terme (> 2 ans) au taux de 12,8% + prélèvements sociaux.',
  'credit impot': 'CIR (Crédit d\'Impôt Recherche) : 30% des dépenses de R&D ≤ 100M€, 5% au-delà. Plafond à 100M€. CICE remplacé par baisse de charges.',
  resultat: 'Résultat comptable → résultat fiscal après réintégrations/déductions extra-comptables. Tableau 2058-A.',
  seuil: 'Micro-entreprise : CA ≤ 188 700 € (ventes) ou ≤ 77 700 € (prestations). Franchise TVA jusqu\'à 91 900 € (ventes) ou 36 800 € (prestations).',
};

router.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.json({ answer: '❓ Posez-moi une question (IS, TVA, FEC, amortissement…).' });

  if (OR_KEY) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OR_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://comptaeasy-7gej.vercel.app',
          'X-Title': 'ComptaEasy',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: question },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      const data = await response.json();

      if (data?.error) throw new Error(data.error.message || 'OpenRouter error');
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Empty response');

      return res.json({
        answer: text.replace(/\n/g, '<br>'),
        sources: ['IA Gemini · OpenRouter · ComptaEasy'],
      });
    } catch (e) {
      console.error('OpenRouter error:', e.message);
    }
  }

  // Fallback local
  const q = question.toLowerCase();
  let answer = 'Service IA momentanément indisponible. Veuillez réessayer.';
  for (const [key, val] of Object.entries(FALLBACKS)) {
    if (q.includes(key)) { answer = val; break; }
  }
  res.json({ answer, sources: ['Cache local ComptaEasy'] });
});

export default router;

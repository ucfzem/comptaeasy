import { Router } from 'express';

const router = Router();
const OR_KEY = process.env.OPENROUTER_KEY;

const LANG_MAP = { fr:'français', en:'anglais', es:'espagnol', ar:'arabe' };

function buildPrompt(lang) {
  const langName = LANG_MAP[lang] || 'français';
  return `Tu es un expert-comptable et fiscaliste senior.
Réponds en ${langName}. Utilise la terminologie du PCG, du CGI et des normes IFRS.
Sois concis (max 150 mots). Si on te pose une question hors comptabilité/fiscalité,
réponds "Je suis spécialisé en comptabilité et fiscalité. Posez-moi une question sur ces sujets."
Utilise du HTML simple pour la mise en forme (strong, br).`;
}

const FALLBACKS = {
  fr: {
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
  },
  en: {
    is: 'Corporate income tax: standard rate <strong>25%</strong> (2022+). Reduced <strong>15%</strong> on first €42,622 for eligible SMEs.',
    tva: 'Standard VAT regime: revenue > €840K (goods) or > €254K (services). Monthly <strong>CA3</strong> return. Standard rate: <strong>20%</strong>.',
    fec: 'FEC (Standard Audit File for Tax) mandatory for tax audits. 2013 format: 18 columns, CSV/UTF-8.',
    cet: 'CET = CFE + CVAE. Cap: 3% of value added. File before the 2nd installment deadline.',
    cvae: 'CVAE: contribution on business value added (revenue > €500K). Variable rate. Form n°1329AC.',
    cfe: 'CFE: business property tax. Based on rental value of taxable assets.',
    amort: 'Straight-line depreciation = cost × (1/useful life). Declining balance available for new assets (life ≥ 3 years).',
    'plus-value': 'Capital gains: short-term (≤ 2 years) taxed at income tax rates, long-term (> 2 years) at 12.8% + social levies.',
    'credit impot': 'R&D Tax Credit (CIR): 30% of R&D expenses up to €100M, 5% beyond. Cap at €100M.',
    resultat: 'Book income → taxable income after add-backs and deductions. Form 2058-A.',
    seuil: 'Micro-enterprise: revenue ≤ €188,700 (goods) or ≤ €77,700 (services). VAT exemption up to €91,900 (goods) or €36,800 (services).',
  },
};
const FALLBACK_KEYS = Object.keys(FALLBACKS.fr);

router.post('/ask', async (req, res) => {
  const { question, lang } = req.body;
  const curLang = LANG_MAP[lang] ? lang : 'fr';
  const notFoundMsg = {
    fr: '❓ Posez-moi une question (IS, TVA, FEC, amortissement…).',
    en: '❓ Ask me about corporate tax, VAT, accounting, FEC…',
    es: '❓ Pregúnteme sobre IS, IVA, contabilidad, FEC…',
    ar: '❓ اسألني عن الضرائب، ضريبة القيمة المضافة، المحاسبة…'
  };
  if (!question) return res.json({ answer: notFoundMsg[curLang] });

  if (OR_KEY) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${OR_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://comptaeasy-7gej.vercel.app',
          'X-Title': 'ComptaEasy',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: buildPrompt(lang) },
            { role: 'user', content: question },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });
      clearTimeout(timeout);

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
  const fb = FALLBACKS[curLang] || FALLBACKS.fr;
  const unavailable = { fr:'Service IA momentanément indisponible. Veuillez réessayer.', en:'AI service temporarily unavailable. Please try again.', es:'Servicio de IA temporalmente no disponible. Intente de nuevo.', ar:'خدمة الذكاء الاصطناعي غير متاحة مؤقتًا. يرجى المحاولة مرة أخرى.' };
  let answer = unavailable[curLang] || unavailable.fr;
  for (const key of FALLBACK_KEYS) {
    if (q.includes(key)) { answer = fb[key]; break; }
  }
  res.json({ answer, sources: ['Cache local ComptaEasy'] });
});

export default router;

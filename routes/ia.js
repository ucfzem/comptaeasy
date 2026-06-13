import { Router } from 'express';

const router = Router();
const OR_KEY = process.env.OPENROUTER_KEY;

const LANG_MAP = { fr:'français', en:'anglais', es:'espagnol', ar:'arabe' };

const OUT_OF_SCOPE = {
  fr: 'Je suis spécialisé en comptabilité et fiscalité. Posez-moi une question sur ces sujets.',
  en: 'I am specialized in accounting and taxation. Please ask me a question on these topics.',
  es: 'Estoy especializado en contabilidad y fiscalidad. Hágame una pregunta sobre estos temas.',
  ar: 'أنا متخصص في المحاسبة والضرائب. يرجى طرح سؤال حول هذه المواضيع.'
};
function buildPrompt(lang) {
  const langName = LANG_MAP[lang] || 'français';
  const oos = OUT_OF_SCOPE[lang] || OUT_OF_SCOPE.fr;
  return `Tu es un expert-comptable et fiscaliste marocain senior.
Réponds en ${langName}. Tu appliques UNIQUEMENT la législation fiscale et comptable du MAROC (CGI marocain, PCG marocain, normes IFRS adaptées au Maroc).
Ne donne jamais de règles françaises — seulement les règles marocaines.
Les questions d'optimisation fiscale (optimisation IS/IR, optimisation TVA, optimisation des amortissements) SONT dans ton domaine.
Sois concis (max 150 mots). Si on te pose une question hors comptabilité/fiscalité,
réponds "${oos}"
Utilise du HTML simple pour la mise en forme (strong, br).`;
}

const FALLBACKS = {
  fr: {
    is: 'Taux IS Maroc : <strong>31%</strong> (bénéfice > 100M MAD), <strong>20%</strong> (1M-100M MAD), <strong>10%</strong> (≤ 1M MAD). Art. 17-I CGI marocain.',
    tva: 'TVA Maroc : régime réel pour CA > 2M MAD (biens) ou > 500K MAD (services). Taux : 20% (normal), 14%, 10%, 7%. Déclaration mensuelle.',
    fec: 'FEC Maroc : Fichier des Écritures Comptables obligatoire en cas de contrôle DGI. Norme DGI : 15 colonnes, format CSV/UTF-8.',
    cet: 'CM (Cotisation Minimale) : 0,50% du CA HT (Art. 144 CGI). Minimum : 3 000 MAD. Exonérée les 36 premiers mois (Art. 144-I-1°). Déductible de l\'IS.',
    perte: 'En cas de résultat déficitaire : IS = 0. Mais la CM (0,50% du CA HT, min 3 000 MAD) reste due sauf si l\'entreprise est dans ses 36 premiers mois (exonération CM). Nouvelle société déficitaire = 0 à payer.',
    cvae: 'TVA Maroc : taux 20% (normal), 14%, 10%, 7%. Régime réel pour CA > 2M MAD (biens) ou > 500K MAD (services).',
    cfe: 'Patente (cotisation minimale) : due par toute personne exerçant une activité professionnelle au Maroc. Calculée sur le CA.',
    amort: 'Amortissement linéaire = coût × (1/durée). Dégressif possible pour biens neufs (durée ≥ 3 ans) au Maroc.',
    'plus-value': 'Plus-value professionnelle Maroc : imposée au taux de l\'IS (31%/20%/10%) selon le montant du bénéfice.',
    'credit impot': 'Crédit d\'impôt recherche Maroc : 30% des dépenses de R&D, plafonné à 10M MAD par an.',
    resultat: 'Résultat comptable → résultat fiscal après réintégrations/déductions. Déclaration selon modèle DGI marocain.',
    seuil: 'Micro-entreprise Maroc : CA ≤ 2M MAD (ventes) ou ≤ 1M MAD (services). Régime de la franchise TVA applicable.',
  },
  es: {
    is: 'Tipos IS Marruecos: <strong>31%</strong> (beneficio > 100M MAD), <strong>20%</strong> (1M-100M MAD), <strong>10%</strong> (≤ 1M MAD). Art. 17-I CGI marroquí.',
    tva: 'IVA Marruecos: régimen real para ingresos > 2M MAD (bienes) o > 500K MAD (servicios). Tipos: 20%, 14%, 10%, 7%. Declaración mensual.',
    fec: 'FEC Marruecos: obligatorio en caso de control DGI. Formato DGI: 15 columnas, CSV/UTF-8.',
    cet: 'CM (Cotización Mínima): 0,50% de los ingresos brutos (Art. 144 CGI). Mínimo: 3 000 MAD. Exenta los primeros 36 meses (Art. 144-I-1°). Deducible del IS.',
    perte: 'Si resultado deficitario: IS = 0. Pero la CM (0,50% de ingresos, mín. 3 000 MAD) sigue aplicándose salvo exención por primeros 36 meses. Nueva empresa deficitaria = 0 a pagar.',
    cvae: 'IVA Marruecos: 20% (general), 14%, 10%, 7%. Régimen real para ingresos > 2M MAD (bienes) o > 500K MAD (servicios).',
    cfe: 'Patente marroquí: aplicable a toda actividad profesional. Calculada sobre los ingresos.',
    amort: 'Amortización lineal = costo × (1/vida útil). Degresivo posible para bienes nuevos (vida ≥ 3 años) en Marruecos.',
    'plus-value': 'Plusvalía profesional Marruecos: gravada al tipo del IS (31%/20%/10%) según el beneficio.',
    'credit impot': 'Crédito fiscal I+D Marruecos: 30% de gastos en I+D, límite 10M MAD al año.',
    resultat: 'Resultado contable → resultado fiscal tras ajustes. Declaración según modelo DGI marroquí.',
    seuil: 'Microempresa Marruecos: ingresos ≤ 2M MAD (bienes) o ≤ 1M MAD (servicios). Exención de IVA aplicable.',
  },
  en: {
    is: 'Moroccan CIT rates: <strong>31%</strong> (profit > 100M MAD), <strong>20%</strong> (1M-100M MAD), <strong>10%</strong> (≤ 1M MAD). Art. 17-I Moroccan CGI.',
    tva: 'Moroccan VAT: standard regime for revenue > 2M MAD (goods) or > 500K MAD (services). Rates: 20%, 14%, 10%, 7%. Monthly return.',
    fec: 'Moroccan FEC (Fichier des Écritures Comptables) mandatory for DGI tax audits. DGI format: 15 columns, CSV/UTF-8.',
    cet: 'CM (Cotisation Minimale): 0.50% of gross revenue (Art. 144 CGI). Minimum: 3,000 MAD. Exempt for first 36 months (Art. 144-I-1°). Deductible from CIT.',
    perte: 'With a tax loss: CIT = 0. But CM (0.50% of revenue, min 3,000 MAD) is still due unless the company is within its first 36 months (CM exemption). New loss-making company = 0 to pay.',
    cvae: 'Moroccan VAT: 20% (standard), 14%, 10%, 7%. Real regime for revenue > 2M MAD (goods) or > 500K MAD (services).',
    cfe: 'Professional tax (patente) in Morocco. Applies to all professional activities. Calculated based on revenue.',
    amort: 'Straight-line depreciation = cost × (1/useful life). Declining balance for new assets (life ≥ 3 years) in Morocco.',
    'plus-value': 'Moroccan capital gains: taxed at CIT rate (31%/20%/10%) based on profit bracket.',
    'credit impot': 'Moroccan R&D tax credit: 30% of R&D expenses, capped at 10M MAD per year.',
    resultat: 'Book income → taxable income after add-backs and deductions. Moroccan DGI declaration format.',
    seuil: 'Moroccan micro-enterprise: revenue ≤ 2M MAD (goods) or ≤ 1M MAD (services). VAT exemption regime applicable.',
  },
};
const KEYWORDS = {
  is: [' is ', ' impôt ', 'corporat', 'income tax', 'impuesto', 'impôt sur les sociétés', 'ضريبة الشركات', 'ضريبة', 'الضرائب'],
  tva: [' tva ', ' vat ', ' iva ', 'value added tax', 'taxe sur la valeur', 'ضريبة القيمة المضافة', 'ض.ق.م.'],
  fec: [' fec ', 'fichier', 'écritures comptables', 'audit file'],
  cet: [' cet ', 'cotisation minimale', 'cm ', 'الواجب الأدنى', 'الحد الأدنى'],
  cvae: [' cvae ', 'cotisation valeur ajoutée'],
  cfe: [' cfe ', 'patente', 'cotisation foncière', 'professional tax'],
  amort: ['amort', 'depreciat', 'amortización'],
  'plus-value': ['plus-value', 'plusvalue', 'capital gain', 'plusvalía'],
  'credit impot': ['credit', 'crédit', 'crédito', 'tax credit', 'r&d', 'recherche', 'i+d', 'research'],
  perte: ['perte', 'déficit', 'deficit', 'loss', 'déficitaire', 'deficitario', 'resultat négatif', 'resultado negativo', 'negative result', 'bénéfice 0', 'pas de bénéfice', 'pas de chiffre', 'خسارة', 'عجز'],
  resultat: ['résultat', 'resultat', 'resultado', 'result', 'fiscal', 'taxable income', 'profit', 'déclaration', 'resultado contable', 'نتيجة', 'نتائج'],
  seuil: ['seuil', 'seuil', 'threshold', 'micro-entrepris', 'micro entrepris', 'microempres', 'franchise', 'حد', 'حدود', 'مقاولة صغرى'],
};

router.post('/ask', async (req, res) => {
  const { question, lang } = req.body;
  const curLang = LANG_MAP[lang] ? lang : 'fr';
  const notFoundMsg = {
    fr: '❓ Posez-moi une question (IS, TVA, FEC, amortissement…).',
    en: '❓ Ask me about corporate tax, VAT, accounting, FEC…',
    es: '❓ Pregúnteme sobre IS, IVA, contabilidad, FEC…',
    ar: '❓ اسألني عن الضرائب، ضريبة القيمة المضافة، المحاسبة، الخسارة…'
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
          model: 'meta-llama/llama-3.2-3b-instruct:free',
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

      const rateLimitPatterns = /free usage|rate\s*limit|quota|trop de requ[eè]tes|tentative dans|429|too many /i;
      if (rateLimitPatterns.test(text)) throw new Error('API rate limited');

      return res.json({
        answer: text.replace(/\n/g, '<br>'),
        sources: ['IA · OpenRouter · ComptaEasy'],
      });
    } catch (e) {
      console.error('OpenRouter error:', e.message);
    }
  }

  // Fallback local
  const q = ' ' + question.toLowerCase().replace(/[^a-z0-9à-ÿ؀-ۿݐ-ݿø ]/g, '') + ' ';
  const fb = FALLBACKS[curLang] || FALLBACKS.en;
  const unavailable = { fr:'Service IA momentanément indisponible. Veuillez réessayer.', en:'AI service temporarily unavailable. Please try again.', es:'Servicio de IA temporalmente no disponible. Intente de nuevo.', ar:'خدمة الذكاء الاصطناعي غير متاحة مؤقتًا. يرجى المحاولة مرة أخرى.' };
  let answer = unavailable[curLang] || unavailable.fr;
  for (const [key, terms] of Object.entries(KEYWORDS)) {
    if (terms.some(t => q.includes(t))) { answer = fb[key]; break; }
  }
  res.json({ answer, sources: ['Cache local ComptaEasy'] });
});

export default router;

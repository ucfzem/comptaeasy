# ComptaEasy — Session Backup

Date: 13 Juin 2026

## Problèmes corrigés

### 1. Sélecteur de langue mort
- **Cause**: `}` manquante dans la fonction `calcIS()` à la ligne 1308 de `public/js/script.js`
- **Effet**: Tout le bloc `<script>` échouait au parsing → `setLang()`, `applyLang()` et toutes les autres fonctions n'étaient jamais définies
- **Correction**: Ajout de la `}` manquante dans les 4 copies du projet

### 2. IA répondait toujours en français
- **Cause**: Le paramètre `lang` n'était pas passé à l'API, et le prompt système ne forçait pas la langue
- **Correction**: 
  - Frontend: passage de `currentLang` à l'appel API (`askIA(q, currentLang)`)
  - Backend: `buildPrompt(lang)` utilise `LANG_MAP` pour forcer la réponse dans la langue demandée
  - Traductions EN ajoutées dans `FALLBACKS`

### 3. IA donnait du droit français au lieu du marocain
- **Cause**: Prompt système référençait "PCG, CGI" français, fallbacks avec taux français (25% IS, CVAE, etc.)
- **Correction**:
  - Prompt système: "expert-comptable et fiscaliste **marocain** senior" + "UNIQUEMENT législation du MAROC"
  - Taux IS: 31% (>100M MAD), 20% (1M-100M MAD), 10% (≤1M MAD)
  - TVA: 20%, 14%, 10%, 7% (marocain)
  - CM (Cotisation Minimale) au lieu de CVAE
  - FEC: norme DGI 15 colonnes
  - Patente au lieu de CFE

### 4. Fallback silencieux en cas de rate-limit API
- **Détection**: Regex `/free usage|rate\s*limit|quota|trop de requ[eè]tes|tentative dans|429|too many /i`
- **Comportement**: Si l'API retourne un message de rate-limit, le code bascule silencieusement vers le cache local
- **L'utilisateur ne voit jamais de message d'erreur API**

### 5. Fallback local multilingue
- **KEYWORDS** remplace l'ancien système `FALLBACK_KEYS` basé uniquement sur le français
- Mots-clés FR/EN/ES pour chaque sujet (`is`, `tva`, `fec`, `amort`, etc.)
- Query paddée avec des espaces pour gérer les mots en début/fin de phrase
- Fallback par défaut: `FALLBACKS.en` au lieu de `FALLBACKS.fr`

### 6. "Optimización IS 2026" en español
- **Cause**: Le LLM classifiait "optimización" comme hors-sujet
- **Correction**: Ajout de "Les questions d'optimisation fiscale SONT dans ton domaine" dans le prompt système

### 7. "Amortissement" matchait "is" à cause de "dégressif"
- **Cause**: L'ancien `q.includes('is')` matichait n'importe quelle occurrence de "is"
- **Correction**: `' is '` (avec espaces) dans KEYWORDS + padding de la requête

## Modèle IA
- Ancien: `google/gemini-2.5-flash` (limites de taux gratuites)
- Nouveau: `meta-llama/llama-3.2-3b-instruct:free` (entièrement gratuit sur OpenRouter)

## Déploiements
1. **GitHub Pages** → `ucfzem.github.io/comptaeasy`
   - Repo: `github.com/ucfzem/comptaeasy`
2. **V.2** → `ucfzem.github.io/comptaeasy-V.2/`
   - Repo: `github.com/ucfzem/ucfzem.github.io`
3. **Vercel** → `comptaeasy.vercel.app`
   - Token: `vcp_***` (redacted, present in user's env)

## Fichiers modifiés (3 copies × 1 fichier = 3 fichiers)
- `routes/ia.js` — Backend API IA (toute la logique de prompt, fallback, keywords)

## Tests validés
| Query | Lang | Résultat |
|---|---|---|
| "Taux IS Maroc 2026" | FR | ✅ Taux marocains 31/20/10% |
| "Amortissement dégressif Maroc" | FR | ✅ Amortissement |
| "Optimización IS 2026" | ES | ✅ Tipos IS Marruecos |
| "VAT rate in Morocco" | EN | ✅ Moroccan VAT |
| "Corporate income tax Morocco" | EN | ✅ Moroccan CIT |
| "Tipo de IVA en Marruecos" | ES | ✅ IVA Marruecos |

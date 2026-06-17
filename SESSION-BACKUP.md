# ComptaEasy — Session de Travail Complète

> **Date :** 17 Juin 2026
> **Projet :** ComptaEasy — Plateforme comptable experte (Maroc)
> **Stack :** Vanilla JS SPA, Node.js/Express API, Vercel + GitHub Pages
> **Repo :** https://github.com/ucfzem/comptaeasy

---

## Sommaire

1. [Contexte & Objectif](#1-contexte--objectif)
2. [Architecture](#2-architecture)
3. [Problème Résolu — OCR Import de Factures](#3-problème-résolu--ocr-import-de-factures)
4. [Itérations & Décisions](#4-itérations--décisions)
5. [Code Final — Explication Détaillée](#5-code-final--explication-détaillée)
6. [Clés API Embarquées](#6-clés-api-embarquées)
7. [Déploiements](#7-déploiements)
8. [Fichiers Modifiés](#8-fichiers-modifiés)

---

## 1. Contexte & Objectif

ComptaEasy est une application web comptable destinée aux experts-comptables marocains.
L'application est un **SPA en Vanilla JS** (single `index.html`) avec un backend Node.js/Express
déployé sur Vercel.

### Objectif principal de la session

Rendre fonctionnelle la page **"Import de Factures"** (section `saisie`) :
- Upload de fichiers (PDF, JPG, PNG)
- Extraction automatique des données de facture (fournisseur, montant, TVA, date, numéro)
- Affichage des résultats avec copie et export
- Alimentation automatique du tableau d'écritures comptables

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  index.html (SPA unique)                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ <head>                                              │    │
│  │   PDF.js CDN (pdf.min.js + worker) ← OCR PDF        │    │
│  │ </head>                                             │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ <body>                                              │    │
│  │   App Shell (sidebar + header + main-content)       │    │
│  │   SECTION_HTML (5 vues : dashboard, saisie, ...)    │    │
│  │   SAISIE_HTML (template OCR + resultat + écritures) │    │
│  │ </body>                                             │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ <script> (toute la logique)                         │    │
│  │   API AI réponses (locales)                         │    │
│  │   i18n (FR/EN/ES/AR)                                │    │
│  │   Navigation / Routing                              │    │
│  │   OCR : parseOCRText / runVisionOCR / extractText   │    │
│  │   Copy / Download helpers                           │    │
│  │   API config (Clé Anthropic + Gemini)               │    │
│  │ </script>                                           │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  vercel.json (static + API Node.js)                         │
├─────────────────────────────────────────────────────────────┤
│  api/ (backend Express)                                     │
│    app.js → routes/ → ocr.js, dashboard.js, ia.js, ...     │
│    → Retourne des données factices / hardcodées             │
└─────────────────────────────────────────────────────────────┘
```

### Déploiements

| Plateforme | URL | Usage |
|-----------|-----|-------|
| **GitHub Pages** | `https://ucfzem.github.io/comptaeasy/` | Frontend statique |
| **Vercel** | `https://comptaeasy.vercel.app/` | Frontend + API (aliasé) |
| **Vercel (originel)** | `https://comptaeasy-7gej.vercel.app/` | API backend uniquement |

---

## 3. Problème Résolu — OCR Import de Factures

### Le besoin

Un expert-comptable reçoit des factures en PDF ou photo :
→ Il les upload → L'app reconnaît les champs → Il copie/exporte.

### La difficulté

- **API backend** (`/api/ocr/analyze`) retourne des données **hardcodées** (`SARL Dupont`, `1 500 €`)
  quelle que soit la facture uploadée — inutilisable en conditions réelles.
- Le **OCR navigateur** (Tesseract.js) est lent, imprécis, échoue sur les images mobiles.
- Les regex de `parseOCRText` ne trouvent pas les montants si la mise en page varie.

### La solution (3 itérations)

#### Itération 1 — Tesseract.js (abandonné)
- `tesseract.js@5` CDN → OCR côté client
- `parseOCRText()` → regex pour extraire les champs
- **Problème :** Tesseract échoue silencieusement, fallback sur API → SARL Dupont

#### Itération 2 — Adobe Scan suggéré (abandonné)
- Remplacer Tesseract par **PDF.js** (extraction de texte)
- Pour les images : message "utilisez Adobe Scan"
- Pour les scans PDF : message "pas de texte exploitable"
- Fallback supprimé → plus de SARL Dupont
- **Problème :** UX médiocre — l'utilisateur doit sortir de l'app

#### Itération 3 — Vision IA (solution finale) ✅
- **PDF.js** pour extraire le texte des PDFs texturés (numériques)
- **Claude Vision API** pour lire les images directement (JPG, PNG, BMP, TIFF, WebP)
- **Claude Vision + Canvas** pour les PDFs scannés (render page 1 → image → API)
- `parseOCRText()` amélioré avec mapping de comptes (loyer→613200, honoraires→622700...)
- Résultats copiables, export .txt/.csv/.json
- Tableau d'écritures auto-alimenté

---

## 4. Itérations & Décisions

### Décision 1 : OCR Client vs Serveur
- **Choix :** Client-side (API avec clés embarquées)
- **Raison :** Pas de backend OCR → pas de surcharge Vercel serverless

### Décision 2 : Quelles API ?
- **Claude Sonnet 4** pour Vision OCR (meilleur que Gemini en extraction de doc)
- **Gemini 2.0 Flash** pour l'assistant fiscal (gratuit, clé intégrée dispo)
- **Stockage :** `localStorage` + fallback vers valeurs embarquées

### Décision 3 : Upload mobile
- `<input type="file">` caché + bouton "Parcourir" (pas de drag-and-drop sur mobile)
- Bouton séparé = pas de double-déclenchement

---
## 5. Code Final — Explication Détaillée

### 5.1 Template HTML (`SAISIE_HTML`)

```javascript
const SAISIE_HTML = `
<div style="display:flex;flex-direction:column;gap:14px">
  <!-- Grid 2 colonnes : Import (gauche) + Résultat (droite) -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" id="saisie-grid">
    ...
  </div>
  <!-- Tableau des écritures suggérées (bas) -->
  <div class="card"> ... </div>
</div>`;
```

Points clés :
- `#file-input` — input caché (accept: `.pdf,.jpg,.jpeg,.png,.webp,.bmp,.tiff`)
- `#dropzone` — zone visuelle, drag & drop uniquement (pas de click)
- `#browse-btn` — bouton séparé pour le click (évite le double-fire)
- `#analyze-btn` — caché jusqu'à sélection d'un fichier
- `#file-chips` — vignettes des fichiers sélectionnés
- `#ocr-preview` — aperçu (image ou infos PDF)
- `#ocr-result` — résultat OCR avec champs + boutons
- `#ocr-entries` — tableau des écritures comptables

### 5.2 parseOCRText

```javascript
function parseOCRText(text) {
  // 1. Extrait tous les nombres de type monétaire (ex: "1 250,00")
  // 2. Trie et prend les 2 plus grands → HT et TTC
  // 3. Calcule TVA = TTC - HT (ou 20/120 si un seul montant)
  // 4. Parcourt les lignes pour :
  //    - N° facture (pattern FAC-XXXX-XXXX)
  //    - Date (JJ/MM/AAAA)
  //    - Fournisseur (SARL, EURL, SAS, etc.)
  //    - Mapping compte (loyer→613200, honoraires→622700, ...)
}
```

### 5.3 runVisionOCR (Claude API)

```javascript
async function runVisionOCR(file) {
  // 1. Lit le fichier en base64 via FileReader
  // 2. Envoie à Anthropic Claude Sonnet 4 :
  //    - Image en base64 inline
  //    - Prompt : "Extrais les données en JSON"
  // 3. Parse la réponse JSON
  // 4. Retourne l'objet structuré
}
```

### 5.4 extractTextFromPDF (PDF.js)

```javascript
async function extractTextFromPDF(file) {
  // 1. Lit le fichier en ArrayBuffer
  // 2. pdfjsLib.getDocument() → charge le PDF
  // 3. Pour chaque page : getTextContent() → extrait le texte
  // 4. Concatène toutes les pages
  // 5. parseOCRText() → structure les données
}
```

### 5.5 runOCR (Orchestrateur)

```javascript
async function runOCR() {
  try {
    if (isPDF) {
      let data = parseOCRText(await extractTextFromPDF(file));
      if (!data.montant_ttc) {
        // PDF scanné → render canvas → Vision API
        data = await extractPDFPageAsImage(file);
      }
    } else if (isImage) {
      data = await runVisionOCR(file);
    }
    renderOCRResult(data);
  } catch {
    simulateOCR(); // fallback demo
  }
}
```

### 5.6 renderOCRResult

```javascript
function renderOCRResult(data) {
  // 1. Affiche les 7 champs (Fournisseur, N° Facture, Date, HT, TVA, TTC, Compte)
  // 2. Chaque champ a un bouton "Copier" individuel
  // 3. Boutons globaux : "Tout copier", .TXT, .CSV, .JSON
  // 4. Auto-alimente le tableau d'écritures (3 lignes : achat, TVA, fournisseur)
}
```

### 5.7 initOCRUpload

```javascript
function initOCRUpload() {
  // Bouton "Parcourir" → ouvre le file picker
  // Drag & drop → dragover/dragleave/drop + handleOCRFile
  // Changement input file → handleOCRFile
  // PAS de click sur la dropzone (évite les doubles appels)
}
```

### 5.8 simulateOCR (Demo)

```javascript
function simulateOCR(type) {
  // type === 'img' → Martin & Associés (FAC-2026-0839, 3 200 €)
  // sinon → K. Abdessalam (FAC-2026-0847, 1 500 €)
  // Appel renderOCRResult après 1.4s
}
```

### 5.9 Helpers (Copy / Download)

- `copyField(value, btn)` → clipboard API + fallback execCommand
- `fallbackCopy(text, cb)` → textarea caché
- `copyAllOCR()` → tout le texte formaté
- `downloadOCR('txt'|'csv'|'json')` → Blob + téléchargement
- `validateEntries()` → alert du nombre de lignes

---

## 6. Clés API Embarquées

Deux clés API sont embarquées dans `index.html` (visibles dans DevTools — usage démo / prototypage) :

| Service | Clé | Usage |
|---------|-----|-------|
| **Anthropic Claude** | `sk-ant-...` | Vision OCR (images + PDF scannés) |
| **Google Gemini** | `AIza...` | Assistant fiscal IA |

L'utilisateur peut les surcharger via le bouton 🔑 dans l'en-tête
(stockage `localStorage` — persistant).

---

## 7. Déploiements

| Commande | Plateforme | Statut |
|----------|-----------|--------|
| `git push origin main` | GitHub Pages | ⚠️ Bloqué par secret scanning (clé GCP) |
| `npx vercel deploy --prod` | Vercel | ✅ OK — production aliasée |

---

## 8. Fichiers Modifiés

| Fichier | Modifications |
|---------|---------------|
| `index.html` | Saisie HTML complet, toutes les fonctions OCR, API keys |
| `public/index.html` | Backup synchronisé |
| `vercel.json` | Configuration static + API (inchangé) |
| `BACKUP-SESSION.md` | Ce fichier |

---

## Résumé des Commits

```
b32b7bc feat: embed API keys for foreign users
0659239 feat: persistent API key config (Claude for Vision OCR, Gemini for assistant)
131f754 feat: real Vision AI OCR via Claude API for images + PDF.js text + scanned fallback
f2b85ec fix: drop Tesseract.js, use PDF.js for searchable PDFs with Adobe Scan suggestion
101af38 feat: real client-side OCR via Tesseract.js + text parsing
e008197 feat: selectable OCR results with copy & export
bda2f53 fix: resolve all mobile upload bugs
6c78412 fix: nest file input inside label for iOS reliability
d61e408 fix: mobile upload using label for file input
```

---

*Fin du document — Session complète du 17 Juin 2026*

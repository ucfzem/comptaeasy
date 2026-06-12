// ====== ComptaEasy API Bridge ======
// Colle ce fichier dans index.html avant </body>
// Ajoute aussi : <script>window.COMPTAEASY_API = 'http://localhost:3000';</script>

(function() {
  const API = window.COMPTAEASY_API || 'http://localhost:3000';

  window.CE = {};

  // --- Dashboard ---
  window.CE.loadDashboard = async () => {
    try {
      const res = await fetch(`${API}/api/dashboard`);
      const data = await res.json();

      // KPI cards
      const kpi = data.kpi;
      const caEl = document.getElementById('kpi-ca');
      if (caEl) caEl.textContent = kpi.ca.replace(/[^0-9,\s]/g, '').trim();

      // Ticker
      const tickerMap = { 't-ca': kpi.ticker.ca };
      Object.entries(tickerMap).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      });

      // Table
      const tbody = document.querySelector('.data-table tbody');
      if (tbody && data.journal) {
        tbody.innerHTML = data.journal.map(e => `
          <tr>
            <td class="mono">${e.date}</td>
            <td class="mono">${e.piece || '-'}</td>
            <td>${e.label}</td>
            <td class="mono">${e.compte}</td>
            <td class="mono ${e.debit > 0 ? 'text-red' : ''}">${e.debit > 0 ? e.debit.toFixed(2) : '—'}</td>
            <td class="mono ${e.credit > 0 ? 'text-green' : ''}">${e.credit > 0 ? e.credit.toFixed(2) : '—'}</td>
            <td><span class="status-pill ${e.statut}">${e.statut}</span></td>
          </tr>
        `).join('');
      }

      return data;
    } catch(e) {
      console.warn('API not available, using demo mode', e);
      return null;
    }
  };

  // --- OCR ---
  window.CE.analyzeOCR = async (file, supplier, amount) => {
    const form = new FormData();
    if (file) form.append('file', file);
    form.append('supplier', supplier || '');
    form.append('amount', amount || '');
    const res = await fetch(`${API}/api/ocr/analyze`, { method: 'POST', body: form });
    return res.json();
  };

  // --- IA ---
  window.CE.askIA = async (question) => {
    const res = await fetch(`${API}/api/ia/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    return res.json();
  };

  // --- FEC ---
  window.CE.downloadFEC = (year = 2024) => {
    window.open(`${API}/api/fec?year=${year}`, '_blank');
  };

  // --- Veille ---
  window.CE.searchVeille = async (q) => {
    const res = await fetch(`${API}/api/veille?q=${encodeURIComponent(q)}`);
    return res.json();
  };

  // --- Clients ---
  window.CE.loadClients = async () => {
    const res = await fetch(`${API}/api/clients`);
    return res.json();
  };

  // --- Auto-load on dashboard ---
  if (window.location.hash === '#dashboard' || window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
    window.CE.loadDashboard();
  }

  console.log('✓ ComptaEasy API Bridge loaded');
})();

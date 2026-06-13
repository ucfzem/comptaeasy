import { getDb, saveDb } from './database.js';
import { v4 as uuid } from 'uuid';

export function runSeed() {
  const d = getDb();

  for (const t of ['entries', 'clients', 'alerts', 'tenants']) {
    d.run(`DELETE FROM ${t}`);
  }

  const TENANT = 'demo-001';
  d.run("INSERT INTO tenants (id, name, siren, fiscal_year) VALUES (?, ?, ?, ?)", [TENANT, 'Cabinet Expert', '123456789', 2024]);

  const entries = [
    ['2024-01-09', 'Loyer local commercial Q1', 'FAC-2025-0831', '613200', 5500, 0, 'overdue'],
    ['2024-01-10', 'Prestation conseil — Audit interne', 'FAC-2025-0839', '622700', 3200, 0, 'pending'],
    ['2024-01-11', 'Dotation amort. matériel informatique', 'OD-2025-0089', '681110', 875, 0, 'processing'],
    ['2024-01-11', 'Virement clients — Société Martin', 'VIR-2025-0211', '411000', 0, 4800, 'validated', 'M-001'],
    ['2024-01-12', 'Fournitures bureau SARL Dupont', 'FAC-2025-0847', '601100', 1250, 0, 'validated', 'M-002'],
    ['2024-01-12', 'TVA déductible s/achat', 'FAC-2025-0847', '445660', 250, 0, 'validated', 'M-002'],
  ];
  for (const e of entries) {
    d.run("INSERT INTO entries (id, tenant_id, date, label, piece, account_code, debit, credit, status, match_ref) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [uuid(), TENANT, ...e]);
  }

  const clients = [
    ['SARL Dupont', '3-5 rue de Paris · 75001 Paris', 5],
    ['Martin SARL', '8 avenue Victor Hugo · 69002 Lyon', 2],
    ['Petit & Fils', '12 rue de la Paix · 75002 Paris', 12],
    ['Dupuis SAS', '45 boulevard Saint-Germain · 75005 Paris', 0],
  ];
  for (const c of clients) {
    d.run("INSERT INTO clients (id, tenant_id, name, address, doc_count) VALUES (?,?,?,?,?)", [uuid(), TENANT, ...c]);
  }

  const alerts = [
    ['Déclaration CA3 — TVA mensuelle', 'Montant à déclarer : 569 500 € — Compte 44571', 'red', '2025-01-15'],
    ['Acompte IS — 4ème échéance', 'Provision estimée : 35 593 €', 'amber', '2024-12-15'],
    ['Clôture bilan — Dossier Martin SARL', 'Inventaire physique non confirmé', 'amber', '2025-01-31'],
    ['Liasse fiscale — Dossier Petit & Fils', 'Télétransmission DGFiP en attente', 'blue', '2025-02-15'],
    ['OCR — 12 factures en attente', 'Reconnaissance automatique disponible', 'green', null],
    ['Déclaration CVAE 2024', 'Formulaire 1329-DEF à déposer', 'amber', '2025-05-02'],
  ];
  for (const a of alerts) {
    d.run("INSERT INTO alerts (id, tenant_id, title, description, urgency, due_date) VALUES (?,?,?,?,?,?)", [uuid(), TENANT, ...a]);
  }

  saveDb();
}

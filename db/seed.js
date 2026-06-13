import { getDb, saveDb } from './database.js';
import { v4 as uuid } from 'uuid';

export function runSeed() {
  const d = getDb();

  for (const t of ['entries', 'clients', 'alerts', 'tenants']) {
    d.run(`DELETE FROM ${t}`);
  }

  const TENANT = 'demo-001';
  d.run("INSERT INTO tenants (id, name, siren, fiscal_year) VALUES (?, ?, ?, ?)", [TENANT, 'Cabinet Expert', '123456789', 2026]);

  const entries = [
    ['2026-01-09', 'Loyer local commercial Q1', 'FAC-2026-0831', '613200', 5500, 0, 'overdue'],
    ['2026-01-10', 'Prestation conseil — Audit interne', 'FAC-2026-0839', '622700', 3200, 0, 'pending'],
    ['2026-01-11', 'Dotation amort. matériel informatique', 'OD-2026-0089', '681110', 875, 0, 'processing'],
    ['2026-01-11', 'Virement clients — Société T. Omar', 'VIR-2026-0211', '411000', 0, 4800, 'validated', 'M-001'],
    ['2026-01-12', 'Fournitures bureau K. Abdessalam', 'FAC-2026-0847', '601100', 1250, 0, 'validated', 'M-002'],
    ['2026-01-12', 'TVA déductible s/achat', 'FAC-2026-0847', '445660', 250, 0, 'validated', 'M-002'],
  ];
  for (const e of entries) {
    d.run("INSERT INTO entries (id, tenant_id, date, label, piece, account_code, debit, credit, status, match_ref) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [uuid(), TENANT, ...e]);
  }

  const clients = [
    ['K. Abdessalam', '3-5 rue de Paris · 75001 Paris', 5],
    ['T. Omar SARL', '8 avenue Victor Hugo · 69002 Lyon', 2],
    ['H. Khadija', '12 rue de la Paix · 75002 Paris', 12],
    ['Dupuis SAS', '45 boulevard Saint-Germain · 75005 Paris', 0],
  ];
  for (const c of clients) {
    d.run("INSERT INTO clients (id, tenant_id, name, address, doc_count) VALUES (?,?,?,?,?)", [uuid(), TENANT, ...c]);
  }

  const alerts = [
    ['Déclaration CA3 — TVA mensuelle', 'Montant à déclarer : 569 500 € — Compte 44571', 'red', '2026-01-15'],
    ['Acompte IS — 4ème échéance', 'Provision estimée : 35 593 €', 'amber', '2026-12-15'],
    ['Clôture bilan — Dossier T. Omar SARL', 'Inventaire physique non confirmé', 'amber', '2026-01-31'],
    ['Liasse fiscale — Dossier H. Khadija', 'Télétransmission DGFiP en attente', 'blue', '2026-02-15'],
    ['OCR — 12 factures en attente', 'Reconnaissance automatique disponible', 'green', null],
    ['Déclaration CVAE 2026', 'Formulaire 1329-DEF à déposer', 'amber', '2026-05-02'],
  ];
  for (const a of alerts) {
    d.run("INSERT INTO alerts (id, tenant_id, title, description, urgency, due_date) VALUES (?,?,?,?,?,?)", [uuid(), TENANT, ...a]);
  }

  saveDb();
}

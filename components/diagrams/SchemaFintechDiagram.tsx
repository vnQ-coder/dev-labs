'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SchemaFintechDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Top — 1:1 highlighted
    mkNode('customers',   0,   0,   { icon: '👤', title: 'Customers',     sub: 'id, name, email',                                       color: '#38bdf8' }),
    mkNode('kyc-details', 380, 0,   { icon: '🪪', title: 'KYCDetails',    sub: 'customer_id UNIQUE, verified_at, doc_type',             color: '#38bdf8', badge: '1:1' }),

    // Middle
    mkNode('accounts',      0,   180, { icon: '🏦', title: 'Accounts',      sub: 'id, customer_id, type: savings/checking, currency',    color: '#4ade80' }),
    mkNode('beneficiaries', 380, 180, { icon: '📤', title: 'Beneficiaries', sub: 'customer_id, bank_code, account_no',                   color: '#a78bfa' }),

    // Center-large — immutable ledger
    mkNode('ledger-entries', 190, 360, { icon: '📒', title: 'LedgerEntries', sub: 'id, account_id, type: DEBIT/CREDIT, amount_cents, reference_id, created_at', color: '#f87171', badge: 'IMMUTABLE — never UPDATE, only INSERT' }),

    // Below ledger
    mkNode('transactions', 190, 560, { icon: '↔️', title: 'Transactions', sub: 'id, from_account, to_account, amount, status, created_at', color: '#f59e0b' }),

    // Audit
    mkNode('audit-log', 560, 420, { icon: '📝', title: 'AuditLog', sub: 'entity_type, entity_id, action, changed_by, timestamp',      color: '#2dd4bf' }),

    mkLabel('lbl', 0, 720, { label: 'Balance = SUM(credits) - SUM(debits) on ledger_entries — never store computed balance', color: '#f87171' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'customers',   'kyc-details',     { color: '#38bdf8', labelText: '1:1' }),
    mkEdge('e2', 'customers',   'accounts',        { color: '#4ade80', labelText: '1:M' }),
    mkEdge('e3', 'customers',   'beneficiaries',   { color: '#a78bfa' }),
    mkEdge('e4', 'accounts',    'ledger-entries',  { color: '#4ade80', labelText: 'account_id' }),
    mkEdge('e5', 'transactions','ledger-entries',  { color: '#f59e0b', labelText: 'two entries', dashed: true }),
    mkEdge('e6', 'ledger-entries','audit-log',     { color: '#2dd4bf', dashed: true, labelText: 'on change' }),
    mkEdge('e7', 'accounts',    'transactions',    { color: '#f59e0b', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}

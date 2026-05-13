'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SOLIDOCPDiagram() {
  const nodes: Node[] = useMemo(() => [
    // BAD group — switch/if-else
    mkGroup('grp-bad', 0, 0, 680, 140, { label: 'BAD — PaymentService modified every time a new provider is added', color: '#dc2626' }),
    mkNode('pay-bad',   20, 50, { icon: '💣', title: 'PaymentService', sub: 'switch (provider)', color: '#dc2626', badge: 'modified every time' }),
    mkNode('stripe-if', 240, 30, { icon: '💳', title: "case 'stripe'",  sub: 'Stripe logic inline', color: '#dc2626' }),
    mkNode('paypal-if', 240, 80, { icon: '💳', title: "case 'paypal'",  sub: 'PayPal logic inline', color: '#dc2626' }),
    mkNode('crypto-if', 460, 55, { icon: '💳', title: "case 'crypto'",  sub: 'Crypto logic inline', color: '#dc2626' }),

    // GOOD group — interface + implementations
    mkGroup('grp-good', 0, 175, 820, 200, { label: 'GOOD — PaymentService closed for modification, open for extension via new class', color: '#10b981' }),
    mkNode('pay-good',   20, 240, { icon: '✅', title: 'PaymentService', sub: 'calls provider.charge()', color: '#10b981', badge: 'never changes' }),
    mkNode('iface',     240, 240, { icon: '📐', title: 'PaymentProvider', sub: '«interface» charge(amount)', color: '#38bdf8', badge: 'abstraction' }),
    mkNode('stripe-impl',460, 205, { icon: '💳', title: 'StripeProvider',  sub: 'implements PaymentProvider', color: '#10b981' }),
    mkNode('paypal-impl',460, 255, { icon: '💳', title: 'PaypalProvider',  sub: 'implements PaymentProvider', color: '#10b981' }),
    mkNode('crypto-impl',460, 305, {
      icon: '🪙',
      title: 'CryptoProvider',
      sub: 'implements PaymentProvider',
      color: '#a78bfa',
      badge: 'new — no existing code changed',
    }),

    // Bottom label
    mkLabel('lbl', 60, 400, { label: 'Open for extension (new class), closed for modification (existing class unchanged)', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // BAD
    mkEdge('e-bad-stripe', 'pay-bad', 'stripe-if', { color: '#dc2626', dashed: true }),
    mkEdge('e-bad-paypal', 'pay-bad', 'paypal-if', { color: '#dc2626', dashed: true }),
    mkEdge('e-bad-crypto', 'pay-bad', 'crypto-if', { color: '#dc2626', dashed: true }),

    // GOOD — PaymentService → interface (abstract)
    mkEdge('e-good-iface', 'pay-good', 'iface', { color: '#38bdf8', labelText: 'depends on abstraction' }),

    // Implementations → interface
    mkEdge('e-stripe-iface', 'stripe-impl', 'iface', { color: '#10b981', labelText: 'implements' }),
    mkEdge('e-paypal-iface', 'paypal-impl', 'iface', { color: '#10b981', labelText: 'implements' }),
    mkEdge('e-crypto-iface', 'crypto-impl', 'iface', { color: '#a78bfa', dashed: true, labelText: 'implements (new)' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}

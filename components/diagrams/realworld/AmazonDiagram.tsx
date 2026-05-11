'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const AMAZON = '#ff9900';
const STORE  = '#34d399';
const CLIENT = '#38bdf8';
const ASYNC  = '#f59e0b';

// Animation steps through the order pipeline
const STEPS = [
  'browser',
  'cdn',
  'gateway',
  'order',
  'inventory',
  'payment',
  'fulfillment',
  'warehouse',
  'shipping',
] as const;
type Step = (typeof STEPS)[number];

export default function AmazonDiagram() {
  const [active, setActive] = useState<Step>('browser');

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % STEPS.length;
      setActive(STEPS[i]);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => {
    const hi = (id: Step, color: string) =>
      active === id ? color : undefined;

    return [
      // Ingress
      mkNode('browser', 10, 150, {
        icon: '🌐',
        title: 'User Browser',
        sub: 'shop.amazon.com',
        color: hi('browser', CLIENT) ?? CLIENT,
        dim: active !== 'browser',
      }),
      mkNode('cdn', 185, 150, {
        icon: '🌍',
        title: 'CloudFront CDN',
        sub: 'edge caching',
        color: hi('cdn', AMAZON) ?? AMAZON,
        dim: active !== 'cdn',
      }),
      mkNode('gateway', 360, 150, {
        icon: '🔀',
        title: 'API Gateway',
        sub: 'auth · routing · throttle',
        color: hi('gateway', AMAZON) ?? AMAZON,
        dim: active !== 'gateway',
      }),

      // Fan-out services
      mkNode('product', 535, 30, {
        icon: '📦',
        title: 'Product Service',
        sub: 'catalog · search',
        color: AMAZON,
        dim: !['gateway'].includes(active),
        badge: 'DynamoDB',
      }),
      mkNode('cart', 535, 150, {
        icon: '🛒',
        title: 'Cart Service',
        sub: 'session store',
        color: AMAZON,
        dim: !['gateway'].includes(active),
        badge: 'Redis',
      }),
      mkNode('order', 535, 270, {
        icon: '📋',
        title: 'Order Service',
        sub: 'create & track orders',
        color: hi('order', AMAZON) ?? AMAZON,
        dim: active !== 'order' && !['gateway'].includes(active) && active !== 'inventory' && active !== 'payment' && active !== 'fulfillment' && active !== 'warehouse' && active !== 'shipping',
        badge: 'Aurora RDS',
      }),

      // Order fan-out
      mkNode('inventory', 720, 150, {
        icon: '🏪',
        title: 'Inventory Service',
        sub: 'stock check & reserve',
        color: hi('inventory', ASYNC) ?? ASYNC,
        dim: !['inventory', 'order'].includes(active),
      }),
      mkNode('payment', 720, 270, {
        icon: '💳',
        title: 'Payment Service',
        sub: 'charge & fraud check',
        color: hi('payment', ASYNC) ?? ASYNC,
        dim: !['payment', 'order'].includes(active),
      }),
      mkNode('fulfillment', 720, 390, {
        icon: '🏭',
        title: 'Fulfillment Service',
        sub: 'pick · pack · dispatch',
        color: hi('fulfillment', AMAZON) ?? AMAZON,
        dim: !['fulfillment', 'order'].includes(active),
      }),

      // Fulfillment fan-out
      mkNode('warehouse', 900, 310, {
        icon: '🗄️',
        title: 'Warehouse DB',
        sub: 'bin locations',
        color: hi('warehouse', STORE) ?? STORE,
        dim: !['warehouse', 'fulfillment'].includes(active),
      }),
      mkNode('shipping', 900, 430, {
        icon: '🚚',
        title: 'Shipping Service',
        sub: 'carrier APIs · label gen',
        color: hi('shipping', CLIENT) ?? CLIENT,
        dim: !['shipping', 'fulfillment'].includes(active),
      }),

      // Annotation
      mkLabel('lbl', 10, 10, {
        label: 'Every service has its own DB — polyglot persistence at scale',
        icon: '🔑',
        color: AMAZON,
      }),
    ];
  }, [active]);

  const edges: Edge[] = useMemo(() => {
    const pulse = (step: Step, color: string) =>
      active === step ? color : '#334155';

    return [
      mkEdge('e-br-cdn',  'browser',     'cdn',         { color: pulse('cdn',     CLIENT), animated: active === 'cdn' }),
      mkEdge('e-cdn-gw',  'cdn',         'gateway',     { color: pulse('gateway', AMAZON), animated: active === 'gateway' }),
      mkEdge('e-gw-prod', 'gateway',     'product',     { color: AMAZON, animated: active === 'gateway' }),
      mkEdge('e-gw-cart', 'gateway',     'cart',        { color: AMAZON, animated: active === 'gateway' }),
      mkEdge('e-gw-ord',  'gateway',     'order',       { color: pulse('order',   AMAZON), animated: active === 'order' }),
      mkEdge('e-ord-inv', 'order',       'inventory',   { color: pulse('inventory', ASYNC), animated: active === 'inventory', labelText: 'reserve' }),
      mkEdge('e-ord-pay', 'order',       'payment',     { color: pulse('payment',   ASYNC), animated: active === 'payment',   labelText: 'charge' }),
      mkEdge('e-ord-ful', 'order',       'fulfillment', { color: pulse('fulfillment', AMAZON), animated: active === 'fulfillment' }),
      mkEdge('e-ful-wh',  'fulfillment', 'warehouse',   { color: pulse('warehouse', STORE), animated: active === 'warehouse' }),
      mkEdge('e-ful-sh',  'fulfillment', 'shipping',    { color: pulse('shipping',  CLIENT), animated: active === 'shipping' }),
    ];
  }, [active]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}

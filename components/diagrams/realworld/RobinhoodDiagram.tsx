'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function RobinhoodDiagram() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Left: SIP Exchange Feed
    mkNode('sip', 0, 30, {
      icon: '📡',
      title: 'SIP Exchange Feed',
      sub: 'NBBO market data',
      color: '#94a3b8',
      badge: '25K updates/sec',
    }),

    // Market Data Service
    mkNode('marketdata', 150, 30, {
      icon: '📈',
      title: 'Market Data Service',
      sub: 'Normalise & enrich',
      color: '#00c805',
    }),

    // Kafka (quote events)
    mkNode('kafka', 310, 30, {
      icon: '📨',
      title: 'Kafka',
      sub: 'Quote event bus',
      color: '#f59e0b',
      badge: 'quote events',
    }),

    // Quote Fan-out Service
    mkNode('fanout', 470, 30, {
      icon: '📢',
      title: 'Quote Fan-out',
      sub: 'Pub/sub push',
      color: '#00c805',
      badge: '250M pushes/sec',
    }),

    // WebSocket → User App (right top)
    mkNode('userapp', 650, 30, {
      icon: '📱',
      title: 'User App',
      sub: 'iOS / Android / Web',
      color: '#38bdf8',
    }),

    // Order Entry (centre-left, order path)
    mkNode('orderentry', 150, 220, {
      icon: '📝',
      title: 'Order Entry',
      sub: 'Trade submission',
      color: '#00c805',
    }),

    // Risk Engine
    mkNode('risk', 310, 220, {
      icon: '⚠️',
      title: 'Risk Engine',
      sub: 'PDT · margin check',
      color: '#dc2626',
      badge: 'PDT · margin check',
    }),

    // Redis PDT sorted set
    mkNode('redispdt', 310, 340, {
      icon: '⚡',
      title: 'Redis PDT',
      sub: 'Day trade counter',
      color: '#dc2626',
      badge: 'ZSET day trades',
    }),

    // Broker / FIX
    mkNode('broker', 470, 220, {
      icon: '🏦',
      title: 'Broker FIX',
      sub: 'Order routing',
      color: '#6366f1',
      badge: 'PFOF routing',
    }),

    // PostgreSQL trade records
    mkNode('postgres', 470, 340, {
      icon: '🐘',
      title: 'PostgreSQL',
      sub: 'Trade ledger',
      color: '#336791',
      badge: 'trade records',
    }),

    // P&L Engine
    mkNode('pnl', 650, 220, {
      icon: '💹',
      title: 'P&L Engine',
      sub: 'Real-time portfolio',
      color: '#00c805',
      badge: 'real-time calc',
    }),

    // Annotation label
    mkLabel('lbl', 50, 420, {
      label: '25K quote updates/sec fan-out to 5M users · Redis sorted set enforces PDT rule',
      icon: '💡',
      color: '#00c805',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // Quote path: SIP → Market Data → Kafka → Fan-out → WebSocket → User App
    mkEdge('e-sip-md', 'sip', 'marketdata', { color: '#94a3b8', animated: pulse }),
    mkEdge('e-md-kafka', 'marketdata', 'kafka', { color: '#f59e0b', animated: pulse }),
    mkEdge('e-kafka-fanout', 'kafka', 'fanout', { color: '#00c805', animated: pulse }),
    mkEdge('e-fanout-user', 'fanout', 'userapp', { color: '#38bdf8', animated: pulse, labelText: 'WebSocket' }),

    // Order path: User App → Order Entry → Risk Engine → Broker → (Execution back)
    mkEdge('e-user-order', 'userapp', 'orderentry', { color: '#00c805', animated: pulse, srcHandle: 'b', tgtHandle: 't' }),
    mkEdge('e-order-risk', 'orderentry', 'risk', { color: '#dc2626', animated: pulse }),
    mkEdge('e-risk-redis', 'risk', 'redispdt', { color: '#dc2626', animated: false, srcHandle: 'b', tgtHandle: 't' }),
    mkEdge('e-risk-broker', 'risk', 'broker', { color: '#6366f1', animated: pulse }),

    // Execution → Trade Service → PostgreSQL → P&L → User App
    mkEdge('e-broker-pg', 'broker', 'postgres', { color: '#336791', animated: false, srcHandle: 'b', tgtHandle: 't' }),
    mkEdge('e-pg-pnl', 'postgres', 'pnl', { color: '#00c805', animated: pulse, srcHandle: 'r', tgtHandle: 'b' }),
    mkEdge('e-pnl-user', 'pnl', 'userapp', { color: '#38bdf8', animated: false, dashed: true, srcHandle: 't', tgtHandle: 'b' }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}

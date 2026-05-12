'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function GoogleSearchDiagram() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // ── Crawl pipeline (top row) ───────────────────────────────
    mkNode('googlebot', 20, 50, {
      icon: '🤖',
      title: 'Googlebot',
      sub: 'distributed crawler',
      color: '#4285f4',
      badge: '20B pages/day',
    }),
    mkNode('frontier', 185, 50, {
      icon: '📋',
      title: 'URL Frontier',
      sub: 'priority queue',
      color: '#6366f1',
    }),
    mkNode('indexing', 360, 50, {
      icon: '⚙️',
      title: 'Indexing Pipeline',
      sub: 'parse · rank · dedup',
      color: '#4285f4',
    }),
    mkNode('bigtable', 545, 50, {
      icon: '🗄️',
      title: 'BigTable Index',
      sub: 'inverted index store',
      color: '#34d399',
      badge: '1 PB compressed',
    }),
    mkNode('caffeine', 440, 200, {
      icon: '⚡',
      title: 'Caffeine Layer',
      sub: 'real-time freshness',
      color: '#f59e0b',
      badge: 'real-time · < 10min',
    }),
    // ── Query serving (bottom row) ────────────────────────────
    mkNode('userquery', 20, 330, {
      icon: '🔎',
      title: 'User Query',
      sub: 'search.google.com',
      color: '#38bdf8',
    }),
    mkNode('router', 185, 330, {
      icon: '🔀',
      title: 'Query Router',
      sub: 'scatter-gather',
      color: '#4285f4',
    }),
    mkNode('shard', 370, 330, {
      icon: '📂',
      title: 'TermIndex Shards',
      sub: '1,000+ parallel machines',
      color: '#4285f4',
      badge: 'parallel shards',
    }),
    mkNode('aggregator', 545, 330, {
      icon: '🧮',
      title: 'Aggregator',
      sub: 'merge · re-rank',
      color: '#6366f1',
    }),
    mkNode('serp', 700, 330, {
      icon: '📄',
      title: 'SERP',
      sub: 'results page',
      color: '#38bdf8',
    }),
    mkLabel('lbl', 100, 440, {
      label: '100B pages indexed · scatter-gather across 1,000+ machines per query',
      icon: '💡',
      color: '#4285f4',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // Crawl pipeline
    mkEdge('e-bot-frontier', 'googlebot', 'frontier', {
      color: '#4285f4',
      animated: pulse,
      labelText: 'discovered URLs',
    }),
    mkEdge('e-frontier-indexing', 'frontier', 'indexing', {
      color: '#6366f1',
      animated: pulse,
      labelText: 'fetch & parse',
    }),
    mkEdge('e-indexing-bigtable', 'indexing', 'bigtable', {
      color: '#34d399',
      animated: pulse,
      labelText: 'write index',
    }),
    // Caffeine (fresh layer)
    mkEdge('e-indexing-caffeine', 'indexing', 'caffeine', {
      color: '#f59e0b',
      animated: false,
      dashed: true,
      labelText: 'fresh docs',
    }),
    mkEdge('e-caffeine-aggregator', 'caffeine', 'aggregator', {
      color: '#f59e0b',
      animated: false,
      dashed: true,
      labelText: 'inject fresh results',
    }),
    // BigTable feeds serving shards
    mkEdge('e-bigtable-shard', 'bigtable', 'shard', {
      color: '#34d399',
      animated: false,
      labelText: 'index feeds shards',
    }),
    // Query serving
    mkEdge('e-query-router', 'userquery', 'router', {
      color: '#38bdf8',
      animated: pulse,
      labelText: 'search query',
    }),
    mkEdge('e-router-shard', 'router', 'shard', {
      color: '#4285f4',
      animated: pulse,
      labelText: 'fan-out',
    }),
    mkEdge('e-shard-aggregator', 'shard', 'aggregator', {
      color: '#6366f1',
      animated: pulse,
      labelText: 'top-k docs',
    }),
    mkEdge('e-aggregator-serp', 'aggregator', 'serp', {
      color: '#38bdf8',
      animated: pulse,
      labelText: 'ranked results',
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}

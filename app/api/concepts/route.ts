import { NextResponse } from 'next/server';
import { CONCEPTS } from '@/lib/data/concepts';

export async function GET() {
  // Return a summarized version of all concepts for the Python agent
  const summarized = CONCEPTS.map(c => ({
    id: c.id,
    cat: c.cat,
    color: c.color,
    title: c.title,
    tag: c.tag,
    overview: c.overview ?? '',
    howItWorks: c.howItWorks ?? '',
    components: (c.components ?? []).map(comp => ({
      name: comp.name,
      role: comp.role,
      detail: comp.detail,
    })),
    failures: (c.failures ?? []).map(f => ({
      name: f.name,
      cause: f.cause,
      symptom: f.symptom,
      fix: f.fix,
      severity: f.severity,
    })),
    decision: c.decision ? {
      choose: c.decision.choose,
      avoid: c.decision.avoid,
      vs: c.decision.vs,
    } : undefined,
    interview: c.interview ? {
      q: c.interview.q,
      a: c.interview.a,
      fu: c.interview.fu,
    } : undefined,
    te: c.te ? {
      def: c.te.def,
      when: c.te.when,
      trade: c.te.trade,
      types: c.te.types,
      rw: c.te.rw,
    } : undefined,
    a: c.a ? {
      t: c.a.t,
      tx: c.a.tx,
      s: c.a.s,
    } : undefined,
    hook: c.hook,
    simpleExplain: c.simpleExplain,
    pipeline: c.pipeline,
    commands: c.commands,
  }));

  return NextResponse.json(summarized, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

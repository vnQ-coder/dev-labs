import { Concept } from '../types';

export const NEXTJS_CONCEPTS: Concept[] = [
  // ─── RENDERING STRATEGIES ─────────────────────────────────────────────────────

  {
    id: 'nextjs-rendering',
    cat: 'nextjs',
    color: '#7c3aed',
    icon: '🖥️',
    title: 'Rendering Strategies: SSR, SSG, ISR, CSR',
    tag: 'Choose rendering per route — static for speed, dynamic for freshness, ISR for both',
    overview:
      'Next.js supports four main rendering strategies, each suited to different data freshness and performance requirements. CSR (Client-Side Rendering) runs entirely in the browser — the server sends a bare HTML shell and React hydrates it. SSR (Server-Side Rendering) generates HTML on the server per request — always fresh but adds server latency. SSG (Static Site Generation) pre-renders pages at build time — lightning fast but requires a rebuild for updates. ISR (Incremental Static Regeneration) pre-renders statically but regenerates stale pages in the background after a revalidation window — combining the speed of static with the freshness of dynamic. PPR (Partial Prerendering, introduced in Next.js 14) pre-renders a static shell instantly and streams dynamic holes via Suspense boundaries, giving you the best of both worlds in a single response.',
    components: [
      {
        name: 'generateStaticParams',
        icon: '📋',
        role: 'Pre-render dynamic routes at build time (SSG).',
        detail:
          'Export "generateStaticParams" from a dynamic route segment to tell Next.js which param values to pre-render. Next.js calls the function at build time and generates one static page per returned value. Any param not in the list is rendered on-demand (or returns 404 if "dynamicParams = false").',
      },
      {
        name: 'revalidate',
        icon: '⏱️',
        role: 'Control ISR revalidation window.',
        detail:
          'Export "export const revalidate = N" from a route segment to enable ISR with an N-second stale window. After N seconds, the next request triggers a background regeneration. The stale page is served until the new one is ready. Set to "false" for indefinite caching (pure SSG) or "0" for no cache (SSR).',
      },
      {
        name: "dynamic = 'force-dynamic'",
        icon: '🔄',
        role: 'Force SSR — opt out of all caching.',
        detail:
          'Export "export const dynamic = \'force-dynamic\'" to make a route fully dynamic — equivalent to "getServerSideProps" in the Pages Router. Every request triggers a fresh server render. Use for pages that depend on cookies, headers, or real-time data.',
      },
      {
        name: 'Suspense Boundaries',
        icon: '⏳',
        role: 'Stream dynamic content while static shell loads instantly.',
        detail:
          'Wrap slow data-fetching Server Components in "<Suspense fallback={...}>". The static outer shell is sent immediately; the Suspense boundary streams in when the data resolves. PPR hardens this pattern — the static shell is truly pre-rendered at build time.',
      },
      {
        name: 'PPR (Partial Prerendering)',
        icon: '⚡',
        role: 'Static shell + streamed dynamic holes in one request.',
        detail:
          'PPR pre-renders everything outside Suspense boundaries at build time and streams the Suspense content dynamically. Enable with "experimental.ppr = true" in next.config. The user sees the static shell with zero TTFB; dynamic data streams in immediately after.',
      },
      {
        name: 'Edge Runtime',
        icon: '🌍',
        role: 'Run route handlers at the CDN edge for minimal latency.',
        detail:
          'Export "export const runtime = \'edge\'" to run a route in the Edge Runtime (V8 isolates at CDN PoPs). No cold start, global low latency. Limited Node.js API surface — no fs, no native modules. Best for auth redirects, A/B testing, and geo-routing in Middleware.',
      },
    ],
    a: {
      v: 'Restaurant kitchen models',
      t: 'SSG is meal prep — cook everything on Sunday, serve instantly all week. ISR is meal prep with a refresh — after 24 hours the meal is "stale" and the kitchen quietly cooks a fresh batch for the next customer. SSR is cooking to order — always fresh but the customer waits. CSR is handing the customer a recipe — they cook it themselves in the browser.',
      tx: 'Each model trades build/server cost for freshness and latency. The right choice depends on how often the data changes and how many users hit the route.',
      s: 'A marketing landing page is SSG (never changes). A product listing is ISR (refresh every 60s). A checkout is SSR (must be real-time). An interactive dashboard is CSR (user-specific, no SEO needed).',
    },
    te: {
      def: 'Rendering strategy determines where and when HTML is generated. Next.js App Router selects the strategy per route segment based on exports (revalidate, dynamic) and whether the segment reads dynamic data sources (cookies, headers, searchParams).',
      types: [
        {
          n: 'SSG (Static Site Generation)',
          d: 'HTML generated at build time. Served from CDN. Zero server compute per request. Requires rebuild or revalidation to update.',
        },
        {
          n: 'ISR (Incremental Static Regeneration)',
          d: 'SSG with a time-based revalidation window. Stale pages are regenerated in the background. The best default for content that changes infrequently.',
        },
        {
          n: 'SSR (Server-Side Rendering)',
          d: 'HTML generated on the server per request. Always fresh. Adds server latency and compute cost. Required for personalised or real-time pages.',
        },
        {
          n: 'CSR (Client-Side Rendering)',
          d: 'HTML shell from server, React renders in the browser. Best for behind-auth dashboards with no SEO requirement.',
        },
        {
          n: 'PPR (Partial Prerendering)',
          d: 'Static shell pre-rendered at build, dynamic Suspense holes streamed per request. Combines SSG speed with SSR freshness in one route.',
        },
      ],
      when: 'Default to ISR for most pages. Use SSG for content that never changes between deployments. Use SSR only when the page must read cookies, headers, or truly real-time data. Use CSR for highly interactive, authenticated UIs with no SEO requirement. Evaluate PPR when you have a mix of static and dynamic content on the same route.',
      trade:
        'SSG and ISR reduce server load but require a caching strategy for invalidation. SSR eliminates stale data but every request hits the server. CSR removes server load entirely but hurts SEO and initial paint. PPR is the best trade-off for most production routes but is still experimental.',
      code: `// 1. SSG — pre-render all blog posts at build time
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());
  return posts.map((p: { slug: string }) => ({ slug: p.slug }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await fetch('https://api.example.com/posts/' + params.slug, {
    cache: 'force-cache', // SSG — cached indefinitely
  }).then(r => r.json());
  return <article>{post.title}</article>;
}

// 2. ISR — regenerate every 60 seconds
// app/products/page.tsx
export const revalidate = 60; // ISR — stale after 60s, background regen

export default async function Products() {
  const products = await fetch('https://api.example.com/products', {
    next: { revalidate: 60 },
  }).then(r => r.json());
  return <ul>{products.map((p: { id: string; name: string }) => <li key={p.id}>{p.name}</li>)}</ul>;
}

// 3. SSR — force dynamic, reads cookies
// app/dashboard/page.tsx
export const dynamic = 'force-dynamic'; // SSR — no caching

import { cookies } from 'next/headers';

export default async function Dashboard() {
  const token = cookies().get('auth-token')?.value;
  const data = await fetch('https://api.example.com/me', {
    headers: { Authorization: 'Bearer ' + token },
    cache: 'no-store',
  }).then(r => r.json());
  return <div>Welcome, {data.name}</div>;
}

// 4. Streaming with Suspense (PPR pattern)
// app/home/page.tsx
import { Suspense } from 'react';

async function DynamicFeed() {
  const feed = await fetch('https://api.example.com/feed', { cache: 'no-store' }).then(r => r.json());
  return <ul>{feed.map((item: { id: string; title: string }) => <li key={item.id}>{item.title}</li>)}</ul>;
}

export default function Home() {
  // Static shell renders instantly; DynamicFeed streams in
  return (
    <main>
      <h1>Welcome</h1>
      <Suspense fallback={<p>Loading feed...</p>}>
        <DynamicFeed />
      </Suspense>
    </main>
  );
}

// 5. Edge runtime for Middleware (geo-routing, auth redirect)
// middleware.ts
export const config = { matcher: ['/dashboard/:path*'] };
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  if (!token) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}`,
      rw: {
        ex: [
          'Vercel marketing site — pure SSG, all pages pre-rendered at deploy time, served from CDN globally',
          'Next.js Commerce — ISR for product pages (revalidate: 60), SSR for cart/checkout (force-dynamic + cookies)',
          'GitHub — static shell with CSR for the file tree; SSR for commit history pages',
          'Shopify Hydrogen — PPR for product pages: static header/nav, dynamic price/inventory streamed',
        ],
        cs: 'The Next.js docs site uses ISR: pages are pre-rendered at deploy time but can be revalidated on-demand via a webhook when content changes in their CMS. This gives sub-millisecond TTFB globally while keeping docs always up to date within seconds of a CMS publish.',
      },
    },
    interview: {
      q: 'When do you choose SSR vs ISR?',
      a: 'Choose SSR when the page must read request-time data — cookies, headers, or searchParams — that differs per user. Examples: authenticated dashboards, checkout pages, A/B tests keyed to a cookie. Choose ISR when the content is the same for all users but changes over time — product listings, blog posts, marketing pages. ISR serves the pre-rendered page instantly from the CDN and regenerates it in the background after the revalidation window, giving you CDN speed with eventual freshness. The key test: if removing the user\'s cookie or session would make the page look identical to any other user\'s page, ISR is the right choice. If the page is meaningfully different per user, you need SSR.',
      fu: [
        'What is Partial Prerendering in Next.js 14?',
        'How does ISR differ from SSG with on-demand revalidation?',
        'How do you measure TTFB difference between SSR and ISR in production?',
      ],
    },
  },

  // ─── APP ROUTER & SERVER COMPONENTS ──────────────────────────────────────────

  {
    id: 'nextjs-app-router',
    cat: 'nextjs',
    color: '#7c3aed',
    icon: '📁',
    title: 'App Router & React Server Components',
    tag: 'Server Components run on the server — no JS sent to client, direct DB access, but no hooks or browser APIs',
    overview:
      'The App Router (introduced in Next.js 13, stable in 14) is built on React Server Components. Every component in the "app" directory is a Server Component by default — it renders on the server, can directly access databases and secrets, and sends zero JavaScript to the browser. Client Components opt in with the "use client" directive at the top of the file and are hydrated in the browser, enabling hooks and browser APIs. The App Router introduces a set of special file conventions: layout.tsx (shared UI across routes), page.tsx (the page itself), loading.tsx (automatic Suspense boundary), error.tsx (automatic Error boundary), template.tsx (re-mounts on navigation), not-found.tsx, and route.tsx (API route handlers). Route groups ((group)) allow sharing layouts without affecting the URL.',
    components: [
      {
        name: 'Server Components (default)',
        icon: '🖥️',
        role: 'Run on server — zero client JS, direct DB access.',
        detail:
          'Server Components are the default in the App Router. They can import server-only modules, query databases directly, read environment variables, and access the filesystem. They render to HTML+RSC payload on the server. They cannot use useState, useEffect, event handlers, or browser APIs.',
      },
      {
        name: "Client Components ('use client')",
        icon: '🌐',
        role: 'Run in browser — full React hooks, event handlers, browser APIs.',
        detail:
          '\'use client\' at the top of a file marks it (and all its imports) as a Client Component boundary. Client Components are pre-rendered on the server (SSR) and then hydrated in the browser. They can use hooks, event handlers, localStorage, and browser APIs. They cannot directly import server-only code.',
      },
      {
        name: 'layout.tsx',
        icon: '🗂️',
        role: 'Shared UI that persists across navigations.',
        detail:
          'layout.tsx wraps all pages in the same segment. It is NOT re-mounted on navigation within the same segment — state persists. Nested segments get nested layouts, composing a layout tree. The root layout.tsx must include <html> and <body> tags.',
      },
      {
        name: 'loading.tsx',
        icon: '⏳',
        role: 'Automatic Suspense boundary for the segment.',
        detail:
          'Next.js automatically wraps the page in a <Suspense> boundary using loading.tsx as the fallback. The loading UI appears instantly on navigation while the server streams the page content. No manual Suspense wrapping needed.',
      },
      {
        name: 'error.tsx',
        icon: '❌',
        role: 'Automatic Error boundary for the segment.',
        detail:
          'error.tsx is a Client Component (must be) that catches errors thrown in the segment and its children. It receives an "error" prop and a "reset" function. Errors bubble up to the nearest error.tsx — you can have per-segment error UIs.',
      },
      {
        name: 'Parallel Routes (@slot)',
        icon: '⊞',
        role: 'Render multiple pages simultaneously in the same layout.',
        detail:
          'Folders named "@slotName" define parallel route slots injected into the parent layout as props. The layout can render "@feed" and "@sidebar" side by side, each with their own loading/error states, independent navigation, and URL. Used for split-view dashboards and conditional modals.',
      },
    ],
    a: {
      v: 'Restaurant kitchen vs dining room',
      t: 'Server Components are the kitchen — chefs (the server) have direct access to ingredients (database, secrets), do all the work, and send finished dishes to the dining room. Client Components are the dining room — waiters interact with customers (users), respond to requests (events), but cannot go into the kitchen directly.',
      tx: 'The kitchen-dining room boundary is "use client". Data flows one way: kitchen prepares and sends food to the dining room. The dining room cannot walk into the kitchen (import server modules). But the kitchen can pass dishes through the window (pass Server Components as children to Client Components).',
      s: 'A ProductPage (Server Component) queries Postgres directly, then passes a <AddToCartButton> (Client Component) as a child. The button handles onClick without the page needing to be a Client Component.',
    },
    te: {
      def: 'React Server Components (RSC) render on the server and produce HTML + a serialised component tree (RSC payload). Client Components hydrate in the browser. The App Router adds file-system conventions that map to React Suspense/Error boundaries and layout composition.',
      types: [
        {
          n: 'Server Component',
          d: 'Default in app/. Renders on server. No JS shipped. Can import server-only modules, query DB, read secrets. Cannot use hooks or event handlers.',
        },
        {
          n: "Client Component ('use client')",
          d: 'Opt-in boundary. Pre-rendered on server, hydrated in browser. Full hooks and event handler support. Cannot import server-only modules.',
        },
        {
          n: 'Shared Component',
          d: 'A component with no directives that is compatible with both environments (pure rendering, no hooks, no server-only imports). Can be imported by either type.',
        },
      ],
      when: 'Start every component as a Server Component. Add "use client" only when you need interactivity (hooks, events), browser APIs, or third-party libraries that use them. Push the "use client" boundary as deep in the tree as possible to maximise server rendering.',
      trade:
        'Server Components eliminate client JS for data fetching and static content — massive bundle savings. The trade-off is a harder mental model: the server/client split requires careful prop passing (only serialisable values cross the boundary) and the "children pattern" for passing Server Components into Client Components.',
      code: `// 1. Server Component querying DB directly — no API route needed
// app/users/page.tsx (Server Component by default)
import { db } from '@/lib/db'; // server-only import — fine in Server Component

export default async function UsersPage() {
  const users = await db.user.findMany(); // direct DB query
  return (
    <ul>
      {users.map(u => (
        <li key={u.id}>{u.name} <DeleteButton userId={u.id} /></li>
      ))}
    </ul>
  );
}

// 2. Client Component for interactivity
// app/users/DeleteButton.tsx
'use client'; // marks this file as a Client Component

import { useState } from 'react';

export function DeleteButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        await fetch('/api/users/' + userId, { method: 'DELETE' });
        setLoading(false);
      }}
    >
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  );
}

// 3. Passing Server Component as children to Client Component
// app/layout-wrapper.tsx
'use client';
import { useState } from 'react';

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <aside style={{ width: open ? 240 : 0 }}>
      <button onClick={() => setOpen(!open)}>Toggle</button>
      {children} {/* Server Component passed as children — works! */}
    </aside>
  );
}

// app/layout.tsx — Server Component composes Client Component with server children
import { Sidebar } from './layout-wrapper';
import { NavLinks } from './NavLinks'; // Server Component

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Sidebar>
          <NavLinks /> {/* Server Component inside Client Component — valid via children */}
        </Sidebar>
        <main>{children}</main>
      </body>
    </html>
  );
}

// 4. loading.tsx — automatic Suspense boundary
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return <div className='skeleton' aria-label='Loading dashboard...' />;
}

// 5. Parallel routes — split-view dashboard
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  feed,
  sidebar,
}: {
  children: React.ReactNode;
  feed: React.ReactNode;    // @feed slot
  sidebar: React.ReactNode; // @sidebar slot
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px' }}>
      <div>{children}{feed}</div>
      <div>{sidebar}</div>
    </div>
  );
}`,
      rw: {
        ex: [
          'Vercel dashboard — Server Components for all data display, Client Components only for interactive controls',
          'Next.js e-commerce — product page is a Server Component querying a DB; AddToCart is a Client Component',
          'GitHub Copilot chat UI — Client Component for the input/streaming; file tree is a Server Component',
          'Notion-like editors — rich text editor is a Client Component; sidebar navigation is a Server Component',
        ],
        cs: 'The Next.js documentation site itself uses the App Router with Server Components. The entire docs tree is rendered on the server — zero client JS for navigation and content. Only the search and feedback widgets are Client Components. This cuts the JS bundle for the docs from ~200kb to under 30kb.',
      },
    },
    interview: {
      q: 'Can a Server Component import a Client Component? Vice versa?',
      a: 'A Server Component can import and render a Client Component — this is the normal pattern. When Next.js encounters a Client Component inside a Server Component tree, it includes the Client Component in the JS bundle and hydrates it in the browser. The reverse is restricted: a Client Component cannot import a Server Component directly, because Client Components run in the browser where server-only code (DB access, secrets) cannot execute. However, you can pass a Server Component to a Client Component as a "children" prop or any other prop typed as "React.ReactNode". The Server Component renders on the server and the resulting HTML/RSC payload is passed through the Client Component as an opaque value — the Client Component never imports or executes the server code. This "children pattern" is the standard way to compose server and client rendering.',
      fu: [
        'Why can\'t Server Components use useState or useEffect?',
        'What is the component composition pattern for mixing server and client?',
        'What values can be passed as props across the server/client boundary?',
      ],
    },
  },

  // ─── DATA FETCHING & CACHING ─────────────────────────────────────────────────

  {
    id: 'nextjs-data-fetching',
    cat: 'nextjs',
    color: '#7c3aed',
    icon: '📡',
    title: 'Data Fetching & Caching in Next.js',
    tag: 'Next.js extends fetch with caching — control freshness per request with revalidate and tags',
    overview:
      'Next.js extends the native "fetch" API with a built-in caching layer that operates at four levels: Request Memoization (deduplicates identical fetch calls within a single render), Data Cache (persists fetch results across requests and deployments, configurable per fetch), Full Route Cache (caches the rendered HTML + RSC payload for static routes), and Router Cache (client-side in-memory cache that stores visited route segments). You control the Data Cache per fetch call using the "cache" and "next" options. For non-fetch data sources (ORMs, SDKs), "unstable_cache" provides the same caching semantics. Server Actions handle form mutations and can invalidate the cache via "revalidatePath" or "revalidateTag", triggering ISR-style background regeneration.',
    components: [
      {
        name: 'fetch() with cache options',
        icon: '🌐',
        role: 'Control Data Cache behaviour per request.',
        detail:
          '"{ cache: \'force-cache\' }" — cache indefinitely (default for static routes). "{ next: { revalidate: N } }" — ISR-style cache with N-second window. "{ cache: \'no-store\' }" — bypass cache entirely (SSR). "{ next: { tags: [\'products\'] } }" — tag the cache entry for on-demand invalidation.',
      },
      {
        name: 'unstable_cache',
        icon: '💾',
        role: 'Cache non-fetch data (ORM queries, SDK calls).',
        detail:
          '"unstable_cache(fn, keyParts, options)" wraps any async function with the same Data Cache semantics as fetch. "keyParts" is the cache key; "options.revalidate" and "options.tags" work identically to fetch options. Essential for Prisma/Drizzle queries in Server Components.',
      },
      {
        name: 'revalidatePath()',
        icon: '🗑️',
        role: 'Purge the Full Route Cache for a specific path.',
        detail:
          'Call "revalidatePath(\'/products\')" inside a Server Action or Route Handler to immediately invalidate the cached page at that path. Next.js will regenerate it on the next request. Pass "\'layout\'" as the second argument to revalidate all pages under the path.',
      },
      {
        name: 'revalidateTag()',
        icon: '🏷️',
        role: 'Purge all cache entries with a specific tag.',
        detail:
          'Tags group related cache entries across multiple fetches and pages. Call "revalidateTag(\'products\')" to invalidate every fetch call tagged with "\'products\'" across all pages. The next request to any affected page triggers a fresh fetch. This is on-demand ISR.',
      },
      {
        name: 'Server Actions',
        icon: '⚡',
        role: 'Async server functions called from Client Components.',
        detail:
          'Defined with "\'use server\'" directive (function-level or file-level). Called directly from Client Component event handlers or form actions. Run on the server — can access DB, secrets. After mutating data, call "revalidatePath" or "revalidateTag" to update the cache.',
      },
      {
        name: 'React cache()',
        icon: '🔁',
        role: 'Memoize a function within a single request (Request Memoization).',
        detail:
          '"import { cache } from \'react\'" — wraps a function so that multiple calls with the same arguments within one render tree return the same promise. Deduplicates DB queries when multiple Server Components in the same render call the same function.',
      },
    ],
    a: {
      v: 'Library borrowing system',
      t: 'Request Memoization is the librarian remembering you already asked for a book today — they hand you the same copy without going to the stacks again. The Data Cache is the library\'s reserve shelf — books stay there across days (across requests) until explicitly returned. revalidateTag is a recall notice — all copies of "Harry Potter" must be returned and replaced with the new edition.',
      tx: 'The four cache layers operate at different scopes: within a request, across requests, across deployments, and on the client. Understanding which layer a cache hit belongs to tells you exactly how stale the data can be.',
      s: 'A product page fetches price data tagged "products". When a price changes, a Server Action calls revalidateTag("products") — Next.js purges the Data Cache and Full Route Cache for all product pages. The next visitor gets fresh data.',
    },
    te: {
      def: 'Next.js caching operates at four levels: Request Memoization (per-render deduplication via React cache), Data Cache (persistent fetch cache, configurable per call), Full Route Cache (rendered HTML+RSC payload for static routes), and Router Cache (client-side segment cache for fast navigation).',
      types: [
        {
          n: 'Request Memoization',
          d: 'Deduplicates identical fetch (or React cache()) calls within a single server render. Automatic for fetch — the same URL+options combination is called only once even if 10 components request it.',
        },
        {
          n: 'Data Cache',
          d: 'Persists fetch results on the Next.js server across requests and deployments. Configurable per fetch call via cache and next options. Survives server restarts (stored on disk/CDN).',
        },
        {
          n: 'Full Route Cache',
          d: 'Caches the rendered HTML and RSC payload for static routes. Populated at build time (SSG) or on first request (ISR). Invalidated by revalidatePath or time-based revalidation.',
        },
        {
          n: 'Router Cache',
          d: 'Client-side in-memory cache of RSC payloads for visited route segments. Persists for the session. Makes back-navigation and prefetched links instant.',
        },
      ],
      when: 'Tag every fetch call that can be invalidated by a mutation ("next: { tags: [\'entity-name\'] }"). Use revalidateTag in Server Actions after mutations — it is more precise than revalidatePath. Use unstable_cache for all ORM queries in data access layer functions. Use React cache() to share a single DB query result across multiple Server Components in the same render.',
      trade:
        'Aggressive caching (force-cache, long revalidation windows) maximises performance but risks serving stale data after mutations. No-store is always fresh but eliminates CDN caching. ISR with revalidateTag is the best trade-off: cache aggressively, invalidate precisely on mutation.',
      code: `// 1. fetch with cache options
// force-cache = SSG (cached indefinitely)
const staticData = await fetch('https://api.example.com/config', {
  cache: 'force-cache',
});

// ISR — refresh every 60 seconds
const products = await fetch('https://api.example.com/products', {
  next: { revalidate: 60, tags: ['products'] },
});

// no-store = SSR — bypass all caching
const userData = await fetch('https://api.example.com/me', {
  cache: 'no-store',
});

// 2. revalidateTag for on-demand ISR
// app/actions/product-actions.ts
'use server';
import { revalidateTag } from 'next/cache';
import { db } from '@/lib/db';

export async function updateProduct(id: string, price: number) {
  await db.product.update({ where: { id }, data: { price } });
  revalidateTag('products'); // purge all cache entries tagged 'products'
}

// 3. Server Action with form + revalidatePath
// app/actions/create-post.ts
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  await db.post.create({ data: { title } });
  revalidatePath('/blog'); // regenerate the blog listing page
  redirect('/blog');
}

// app/blog/new/page.tsx — Client Component using the Server Action
'use client';
import { createPost } from '@/app/actions/create-post';

export default function NewPostForm() {
  return (
    <form action={createPost}>
      <input name='title' placeholder='Post title' />
      <button type='submit'>Create</button>
    </form>
  );
}

// 4. Parallel data fetching in Server Components
// app/dashboard/page.tsx
export default async function Dashboard() {
  // Fetch in parallel — do NOT await sequentially
  const [user, metrics, feed] = await Promise.all([
    fetch('https://api.example.com/user', { cache: 'no-store' }).then(r => r.json()),
    fetch('https://api.example.com/metrics', { next: { revalidate: 30 } }).then(r => r.json()),
    fetch('https://api.example.com/feed', { next: { revalidate: 60 } }).then(r => r.json()),
  ]);
  return <div>{user.name} — {metrics.revenue}</div>;
}

// 5. unstable_cache for DB queries (ORM — not fetch)
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

export const getCachedProducts = unstable_cache(
  async () => db.product.findMany(),
  ['products-list'], // cache key parts
  { revalidate: 60, tags: ['products'] },
);`,
      rw: {
        ex: [
          'Vercel Commerce — products cached with revalidateTag("product-{id}"), triggered by Shopify webhook on inventory change',
          'Next.js blog template — posts cached with unstable_cache, revalidated via CMS webhook calling revalidateTag',
          'Linear — dashboard data fetched in parallel Server Components, user session via no-store',
          'Stripe dashboard — real-time transaction list uses no-store; historical charts use revalidate: 3600',
        ],
        cs: 'Contentlayer + Next.js ISR: blog posts are MDX files transformed at build time (SSG), but "revalidateTag" is called from a GitHub webhook handler whenever a post is pushed to the repo. The page regenerates in under 2 seconds globally — the reader sees fresh content, the server never takes a per-request hit.',
      },
    },
    interview: {
      q: 'What is request memoization vs the Data Cache in Next.js?',
      a: 'Request Memoization is a per-render deduplication layer built on React\'s "cache()" function. If 10 Server Components in the same render tree call "fetch()" with the same URL and options, Next.js executes the actual network request only once and shares the result. Memoization is scoped to a single request/render — it is cleared after the response is sent. The Data Cache is persistent storage on the Next.js server (disk or CDN). A cache hit in the Data Cache means the network request is skipped entirely across multiple requests, deployments, and server instances. You control it with "cache: \'force-cache\'" (persist indefinitely), "next: { revalidate: N }" (time-based expiry), or "cache: \'no-store\'" (opt out). The two layers are independent: Request Memoization always deduplicates within a render; the Data Cache determines whether a fresh network request is made at all.',
      fu: [
        'How do Server Actions work and when do you use them?',
        'How do you do on-demand cache invalidation in Next.js?',
        'What is the difference between revalidatePath and revalidateTag?',
      ],
    },
  },

  // ─── ROUTING SYSTEM ───────────────────────────────────────────────────────────

  {
    id: 'nextjs-routing',
    cat: 'nextjs',
    color: '#7c3aed',
    icon: '🗺️',
    title: 'Next.js Routing System',
    tag: 'File-based routing with dynamic segments, catch-all routes, parallel routes, and intercepting routes',
    overview:
      'Next.js App Router uses the file system as the router. Every "page.tsx" file inside "app/" becomes a publicly accessible route. Folders define URL segments. Special file names (page, layout, loading, error, template, not-found, route) have fixed roles. Dynamic segments are created with "[param]" folder names. Catch-all segments use "[...slug]" and optional catch-all use "[[...slug]]". Route groups "(group)" let you organise files and share layouts without affecting the URL. Parallel routes "@slot" let you render multiple pages simultaneously in one layout. Intercepting routes "(.)path" let you load a route inside the current layout while the URL changes — the classic use case is a modal that preserves the background page.',
    components: [
      {
        name: 'Dynamic routes ([id])',
        icon: '🔀',
        role: 'URL segments captured as params.',
        detail:
          '"app/products/[id]/page.tsx" matches "/products/123". The "params" prop is passed to the page as "{ id: \'123\' }". Combine with "generateStaticParams" for SSG of known IDs.',
      },
      {
        name: 'Catch-all ([...slug])',
        icon: '🌊',
        role: 'Capture multiple segments as an array.',
        detail:
          '"app/docs/[...slug]/page.tsx" matches "/docs/a/b/c" with "params.slug = [\'a\', \'b\', \'c\']". Useful for documentation trees and CMS-driven URLs. "[[...slug]]" is the optional variant — also matches "/docs" with no slug.',
      },
      {
        name: 'Route groups ((group))',
        icon: '📁',
        role: 'Organise routes and share layouts without affecting URL.',
        detail:
          'Folders wrapped in parentheses "(group)" are excluded from the URL. Use to apply a layout to a subset of routes: "(auth)/login" and "(auth)/register" share a layout but the URL is "/login" and "/register". "(dashboard)/settings" and "(dashboard)/profile" share a dashboard layout.',
      },
      {
        name: 'Parallel routes (@slot)',
        icon: '⊞',
        role: 'Render multiple pages simultaneously in one layout.',
        detail:
          '"@feed" and "@sidebar" are parallel route slots. Each renders its own page.tsx and can have independent loading/error states. The parent layout receives them as props. Navigating in one slot does not affect the other. Used for split-view dashboards, analytics views, and conditional modals.',
      },
      {
        name: 'Intercepting routes ((.))',
        icon: '🪟',
        role: 'Load a route inside the current layout while updating the URL.',
        detail:
          '"(.)photo/[id]" intercepts navigation to "/photo/123" and renders it in the current layout (as a modal, for example) instead of doing a full page navigation. The URL updates to "/photo/123" so the link is shareable. On hard refresh, the actual "/photo/[id]/page.tsx" renders normally.',
      },
      {
        name: 'Middleware (matcher)',
        icon: '🛡️',
        role: 'Run code before every matched request — auth, redirects, A/B.',
        detail:
          '"middleware.ts" at the root exports a "middleware" function and a "config.matcher" array. Runs at the Edge before the route renders. Use for auth token validation and redirects, geo-routing, feature flags, and rate limiting.',
      },
    ],
    a: {
      v: 'City street grid',
      t: 'Static routes are named streets — "5th Avenue" always goes to the same place. Dynamic routes are numbered street + house number — "[street]/[number]" matches any address on any street. Catch-all routes are GPS coordinates — "[...coords]" matches any depth of navigation. Parallel routes are multi-lane highways — multiple lanes running simultaneously to different destinations. Intercepting routes are on-ramps — you enter the highway (URL changes) but stay on the same road (layout stays).',
      tx: 'The file system is the map. The folder structure defines every possible route. Special naming conventions ([param], [...slug], @slot, (.), (group)) encode routing behaviour directly in the filesystem.',
      s: '"app/(dashboard)/@modal/(.)photo/[id]/page.tsx" — a modal that intercepts photo navigation, rendered in the dashboard layout\'s @modal slot, with a shareable URL.',
    },
    te: {
      def: 'The App Router maps the "app/" directory to URL routes. Every "page.tsx" is a route. Folder names become URL segments. Special naming conventions encode dynamic matching, layout grouping, parallel rendering, and route interception.',
      types: [
        {
          n: 'Static Routes',
          d: '"app/about/page.tsx" maps to "/about". No JavaScript needed for routing — the file system is the route definition.',
        },
        {
          n: 'Dynamic Routes',
          d: '"[param]" captures a URL segment. "[...slug]" captures multiple segments. "[[...slug]]" makes the catch-all optional.',
        },
        {
          n: 'Route Groups',
          d: '"(group)" folders organise files and apply layouts without affecting the URL. Use for "(auth)", "(marketing)", "(dashboard)" layout splits.',
        },
        {
          n: 'Parallel + Intercepting Routes',
          d: '"@slot" for simultaneous page rendering. "(.)path" for in-layout route interception. Combine for the modal-with-URL pattern.',
        },
      ],
      when: 'Use route groups for every major layout boundary (auth vs app, marketing vs dashboard). Use catch-all for content trees where depth is unknown. Use parallel routes when sections of a page navigate independently. Use intercepting routes for modals that need shareable, bookmarkable URLs.',
      trade:
        'The file system convention is powerful but can produce deeply nested folder structures. Route groups mitigate this. Parallel and intercepting routes add complexity — use them only when the UX benefit (independent navigation, modal URLs) is clear.',
      code: `// 1. Dynamic route with generateStaticParams (SSG)
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());
  return posts.map((p: { slug: string }) => ({ slug: p.slug }));
}

export default function Post({ params }: { params: { slug: string } }) {
  return <h1>Post: {params.slug}</h1>;
}

// 2. Catch-all for documentation
// app/docs/[...slug]/page.tsx
export default function DocsPage({ params }: { params: { slug: string[] } }) {
  // slug = ['api', 'routes', 'dynamic'] for /docs/api/routes/dynamic
  const path = params.slug.join('/');
  return <div>Docs: {path}</div>;
}

// 3. Route groups — (auth) and (dashboard) share different layouts
// app/(auth)/layout.tsx — minimal layout for login/register
// app/(auth)/login/page.tsx   => URL: /login
// app/(auth)/register/page.tsx => URL: /register
// app/(dashboard)/layout.tsx — full app shell
// app/(dashboard)/settings/page.tsx => URL: /settings

// 4. Parallel routes — split-view dashboard
// app/dashboard/layout.tsx
export default function Layout({
  children,
  feed,
  sidebar,
}: {
  children: React.ReactNode;
  feed: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <section>
      <nav>{sidebar}</nav>
      <main>{children}{feed}</main>
    </section>
  );
}
// app/dashboard/@feed/page.tsx — renders as the feed slot
// app/dashboard/@sidebar/page.tsx — renders as the sidebar slot

// 5. Intercepting route for Instagram-style photo modal
// app/(dashboard)/@modal/(.)photos/[id]/page.tsx
// Intercepts navigation to /photos/[id] inside the dashboard layout
// Shows as a modal overlay; URL becomes /photos/123
// Hard refresh of /photos/123 renders app/photos/[id]/page.tsx normally
export default function PhotoModal({ params }: { params: { id: string } }) {
  return <dialog open><img src={'/photos/' + params.id + '.jpg'} alt='Photo' /></dialog>;
}

// 6. Middleware for auth redirect
// middleware.ts (root of project)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
  if (!token && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
};`,
      rw: {
        ex: [
          'Vercel dashboard — parallel routes for the main content and notification panel, independent navigation',
          'Instagram web — intercepting routes for photo modals: click opens modal at /p/[id], refresh shows the full photo page',
          'Next.js docs — catch-all "[...slug]" for the entire docs tree, generateStaticParams for SSG',
          'Linear — route groups "(app)" vs "(marketing)" for completely different layouts on the same domain',
        ],
        cs: 'Figma\'s web app uses a pattern equivalent to intercepting routes: clicking a file in the dashboard opens a modal with the file URL. Sharing that URL opens the file directly. Next.js intercepting routes implement this pattern natively — the same URL renders as a modal in the app context and as a full page on direct navigation.',
      },
    },
    interview: {
      q: 'What are parallel routes and when do you use them?',
      a: 'Parallel routes let you render multiple pages simultaneously in the same layout, each as a named slot. You define them with "@slotName" folders — "app/dashboard/@feed/page.tsx" and "app/dashboard/@sidebar/page.tsx" — and the parent layout receives them as "feed" and "sidebar" props alongside the default "children". Each slot has its own independent loading.tsx and error.tsx, so a slow feed does not block the sidebar from rendering. Navigation in one slot does not reset the other. Use parallel routes when sections of a page need to navigate independently — split-view dashboards, analytics with a detail panel, or a feed with a compose modal. The classic combination is parallel routes with intercepting routes: the "@modal" slot intercepts navigation to a route, showing it as an overlay while the background page stays mounted.',
      fu: [
        'How do intercepting routes enable the soft navigation modal pattern?',
        'What is the difference between route groups and regular folders?',
        'How do you handle loading and error states independently in parallel routes?',
      ],
    },
  },

  // ─── NEXT.JS OPTIMIZATION ─────────────────────────────────────────────────────

  {
    id: 'nextjs-optimization',
    cat: 'nextjs',
    color: '#7c3aed',
    icon: '⚡',
    title: 'Next.js Performance Optimization',
    tag: 'Built-in optimizations for images, fonts, scripts, and bundles — understand what they do',
    overview:
      'Next.js ships with several built-in optimization primitives that handle the most common performance pitfalls automatically. next/image handles lazy loading, format conversion (WebP/AVIF), responsive sizing, and prevents Cumulative Layout Shift (CLS) by requiring explicit width/height or the "fill" prop. next/font eliminates layout shift from custom fonts by self-hosting Google Fonts and injecting font-display:swap automatically. next/script gives you fine-grained control over third-party script loading with four strategies. React Server Components are the single biggest bundle optimization — every component that stays on the server contributes zero bytes to the client JS bundle. Dynamic imports via "next/dynamic" enable code splitting for heavy client-side libraries.',
    components: [
      {
        name: 'next/image',
        icon: '🖼️',
        role: 'Automatic image optimization — lazy load, WebP, responsive, LCP.',
        detail:
          'next/image serves images in WebP or AVIF format, resizes for the viewport, lazy loads by default (add "priority" for LCP images), and prevents CLS by reserving space before the image loads. The "sizes" prop is critical for responsive images — it tells the browser what size the image will be at each breakpoint.',
      },
      {
        name: 'next/font',
        icon: '🔤',
        role: 'Zero layout shift, self-hosted Google Fonts.',
        detail:
          'next/font downloads Google Fonts at build time and serves them from your own domain — no Google request at runtime. It generates a CSS class with "font-display: optional" by default (or "swap" if configured), eliminating FOUT. The font is tree-shaken to include only the characters used.',
      },
      {
        name: 'next/script',
        icon: '📜',
        role: 'Controlled third-party script loading strategy.',
        detail:
          'Four strategies: "beforeInteractive" — blocks hydration (use only for critical scripts like consent managers). "afterInteractive" — loads after hydration (analytics, tag managers). "lazyOnload" — loads during browser idle time (chat widgets, social embeds). "worker" — loads in a Web Worker (experimental, via Partytown).',
      },
      {
        name: 'Bundle Analyzer',
        icon: '📊',
        role: 'Visualise what is in your JS bundles.',
        detail:
          '"@next/bundle-analyzer" wraps the Next.js build and generates an interactive treemap of every module in every chunk. Run with "ANALYZE=true npm run build". Use it to identify heavy dependencies that should be dynamic-imported, code-split, or replaced.',
      },
      {
        name: 'Dynamic Imports (next/dynamic)',
        icon: '✂️',
        role: 'Code-split heavy Client Components.',
        detail:
          '"next/dynamic(() => import(\'./HeavyComponent\'))" creates a lazy-loaded bundle split. The component\'s JS is not included in the initial bundle — it loads on demand when the component first renders. Combine with "{ ssr: false }" to skip server rendering for browser-only components.',
      },
      {
        name: 'React Server Components (bundle reduction)',
        icon: '🗜️',
        role: 'Eliminate client JS by keeping components on the server.',
        detail:
          'Every Server Component contributes zero bytes to the client JS bundle. A data table that fetches and renders 1000 rows on the server sends only HTML to the browser — no React code, no data fetching library, no rendering logic. This is the highest-leverage bundle optimization in the App Router.',
      },
    ],
    a: {
      v: 'Restaurant supply chain',
      t: 'next/image is a chef who automatically portions, cooks at the right temperature, and packages food optimally — you hand over raw ingredients and get a perfect dish. next/font is a supplier who pre-negotiates with producers so ingredients arrive ready to use with no last-minute sourcing. next/script strategies are delivery windows — some deliveries must arrive before service (beforeInteractive), some can arrive mid-service (afterInteractive), and some can wait until the kitchen is quiet (lazyOnload).',
      tx: 'Each optimization primitive removes a category of manual work that developers commonly get wrong. next/image eliminates unoptimized images (the #1 LCP killer). next/font eliminates FOUT. next/script eliminates render-blocking third-party scripts.',
      s: 'A page with 10 unoptimized images, a Google Fonts link, and a chat widget loaded in <head> will score 30 on Lighthouse. The same page with next/image, next/font, and next/script lazyOnload will score 95.',
    },
    te: {
      def: 'Next.js optimization primitives (next/image, next/font, next/script) automate the most impactful web performance optimizations. React Server Components reduce the JS bundle by keeping server-only code off the client. Dynamic imports and bundle analysis enable fine-grained code splitting.',
      types: [
        {
          n: 'Image Optimization',
          d: 'next/image: automatic WebP/AVIF, responsive srcset, lazy loading, CLS prevention via size reservation.',
        },
        {
          n: 'Font Optimization',
          d: 'next/font: build-time Google Fonts download, self-hosting, font-display control, zero FOUT/FOIT.',
        },
        {
          n: 'Script Optimization',
          d: 'next/script: four load strategies for third-party scripts — block, after-hydration, idle, or Web Worker.',
        },
        {
          n: 'Bundle Optimization',
          d: 'Server Components (zero client JS), dynamic imports (code splitting), bundle analyzer (visibility into bundle composition).',
        },
      ],
      when: 'Always use next/image for every image — never use <img> directly. Always use next/font for any custom font. Use next/script for any third-party script tag (analytics, chat, maps). Audit with the bundle analyzer before any major release. Default new components to Server Components and only add "use client" when necessary.',
      trade:
        'next/image requires explicit width and height (or fill + a sized container) — a small upfront cost for CLS prevention. next/font requires importing fonts at the layout level and applying the CSS class — one-time setup. next/script "lazyOnload" means analytics scripts fire later — a small data loss trade-off for better TTI.',
      code: `// 1. next/image with proper sizes prop for responsive images
import Image from 'next/image';

export function ProductCard({ product }: { product: { name: string; imageUrl: string } }) {
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
      <Image
        src={product.imageUrl}
        alt={product.name}
        fill
        sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        priority={false} // set priority=true for LCP image (above the fold)
        style={{ objectFit: 'cover' }}
      />
    </div>
  );
}

// 2. next/font — zero layout shift, self-hosted Google Fonts
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const mono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={inter.variable + ' ' + mono.variable}>
      <body>{children}</body>
    </html>
  );
}

// 3. next/script strategies
import Script from 'next/script';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* afterInteractive: loads after hydration — analytics */}
      <Script
        src='https://www.googletagmanager.com/gtag/js?id=G-XXXXX'
        strategy='afterInteractive'
      />
      {/* lazyOnload: loads during idle — chat widget */}
      <Script
        src='https://cdn.chatwidget.com/widget.js'
        strategy='lazyOnload'
        onLoad={() => console.log('Chat widget loaded')}
      />
      {children}
    </>
  );
}

// 4. Bundle analyzer setup
// next.config.ts
import withBundleAnalyzer from '@next/bundle-analyzer';

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withAnalyzer({
  // next config
});
// Run: ANALYZE=true npm run build

// 5. Dynamic import for heavy library
import dynamic from 'next/dynamic';

// Load chart library only when ChartComponent renders
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // skip SSR for browser-only libraries
});

export default function Dashboard() {
  return (
    <main>
      <h1>Dashboard</h1>
      <HeavyChart /> {/* chunk loads on demand */}
    </main>
  );
}

// 6. Server Component eliminating client JS for a data table
// app/reports/page.tsx (Server Component — zero client JS)
import { db } from '@/lib/db';

export default async function ReportsPage() {
  const rows = await db.report.findMany({ take: 1000 });
  // This entire component — data fetching + rendering — runs on server
  // The browser receives HTML only. No React, no DB library, no render logic sent.
  return (
    <table>
      <tbody>
        {rows.map(r => (
          <tr key={r.id}><td>{r.name}</td><td>{r.value}</td></tr>
        ))}
      </tbody>
    </table>
  );
}`,
      rw: {
        ex: [
          'Vercel — all product images via next/image, Google Fonts via next/font, Intercom chat via next/script lazyOnload',
          'Shopify Hydrogen — next/image for product photos with priority on the hero image (LCP element)',
          'Loom — bundle analyzer revealed a 200kb date picker library; replaced with a lightweight alternative, cutting TTI by 1.2s',
          'GitHub — Server Components for the file tree and README render; zero client JS for the largest DOM elements on the page',
        ],
        cs: 'The New York Times migrated to next/image and reduced their LCP by 35% — the hero image now loads in WebP at the exact viewport size instead of a 2MB JPEG. The "priority" prop ensures the LCP image is preloaded. "sizes" generates a proper srcset so mobile users download a 200kb image instead of a 2MB one.',
      },
    },
    interview: {
      q: 'How does next/image optimize LCP?',
      a: 'next/image improves LCP (Largest Contentful Paint) in three ways. First, it converts images to WebP or AVIF automatically — typically 30-50% smaller than JPEG/PNG at the same quality, so the file downloads faster. Second, it generates a responsive srcset based on the "sizes" prop, so mobile devices download a 300px image instead of a 1200px one. Third, and most importantly, adding "priority" to the LCP image causes Next.js to inject a "<link rel=preload>" tag in the <head> — the browser starts downloading the image before it even parses the component tree. Without "priority", the LCP image is lazy-loaded and only starts downloading after the browser renders the page, which tanks LCP. The rule is: add "priority" to every image that is visible in the viewport on initial load.',
      fu: [
        'What is the difference between script strategy lazyOnload vs afterInteractive?',
        'How do React Server Components reduce the JS bundle size?',
        'How do you use the bundle analyzer to identify and fix a large dependency?',
      ],
    },
  },
];

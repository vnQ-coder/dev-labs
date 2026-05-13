import { Concept } from '../types';

export const REACT_CONCEPTS: Concept[] = [
  // ─── VIRTUAL DOM & RECONCILIATION ────────────────────────────────────────────

  {
    id: 'react-virtual-dom',
    cat: 'react',
    color: '#61dafb',
    icon: '🌳',
    title: 'Virtual DOM & Reconciliation',
    tag: "React's Virtual DOM diffs the old and new tree to make minimal real DOM updates",
    overview:
      'The Virtual DOM is an in-memory JavaScript representation of the real DOM tree. Every time state or props change, React builds a new Virtual DOM tree and diffs it against the previous one — this is reconciliation. Only the parts of the real DOM that actually changed are updated. Real DOM mutations are expensive because they trigger layout, paint, and composite steps in the browser rendering pipeline. By batching and minimising those mutations, React keeps UIs fast even with frequent state changes. React Fiber, introduced in React 16, rewrote the reconciliation engine to be incremental — work can be paused, aborted, and resumed, enabling features like Concurrent Mode and Suspense. Keys tell the reconciler how to match old and new list items: a wrong or missing key forces full re-renders of list children instead of reusing existing DOM nodes.',
    components: [
      {
        name: 'Virtual DOM Tree',
        icon: '🌲',
        role: 'In-memory JS representation of the UI.',
        detail:
          'React builds a tree of plain JavaScript objects (React elements) describing the UI. This tree is cheap to create and diff compared to real DOM operations, which trigger expensive browser layout and paint cycles.',
      },
      {
        name: 'Reconciliation',
        icon: '🔄',
        role: 'Process of computing the minimal diff between two Virtual DOM trees.',
        detail:
          'After a render, React compares the new element tree with the previous one. It walks both trees simultaneously, identifying added, removed, and changed nodes. Only identified changes are flushed to the real DOM.',
      },
      {
        name: 'Diffing Algorithm',
        icon: '🔍',
        role: 'Heuristics that make O(n) tree comparison possible.',
        detail:
          'A naive tree diff is O(n³). React uses two heuristics: elements of different types produce different trees (so React replaces the subtree entirely), and keys identify which list children are stable across renders, enabling reuse.',
      },
      {
        name: 'Fiber',
        icon: '🧵',
        role: 'Unit of work — the incremental reconciliation engine.',
        detail:
          'Each React element corresponds to a Fiber node. The Fiber reconciler processes work in small units, yielding to the browser between units. This makes it possible to interrupt low-priority work (like an off-screen update) to respond to high-priority user input.',
      },
      {
        name: 'Keys',
        icon: '🔑',
        role: 'Stable identity for list items across renders.',
        detail:
          'A key tells React which Fiber node in the old tree corresponds to which element in the new tree. Without a stable key, React falls back to index-based matching, which causes unnecessary unmounts and remounts when list order changes.',
      },
      {
        name: 'Render Phase',
        icon: '🎨',
        role: 'Pure computation — diff the trees, build the work list.',
        detail:
          'The render phase is interruptible. React calls component functions (or render methods), diffs the resulting element trees, and builds a list of effects. No DOM mutations happen here.',
      },
      {
        name: 'Commit Phase',
        icon: '✅',
        role: 'Flush the effect list to the real DOM — synchronous and uninterruptible.',
        detail:
          'The commit phase walks the completed Fiber tree and applies DOM mutations, calls refs, and fires layout effects. It must run synchronously so the browser does not show a partially updated UI.',
      },
    ],
    a: {
      v: 'Architect with building blueprints',
      t: 'Instead of tearing down a building every time you want to change a room, an architect first updates the blueprint, compares it to the old blueprint, and sends workers only to the rooms that actually changed.',
      tx: 'The blueprint is the Virtual DOM. The comparison is reconciliation. Sending workers only to changed rooms is the minimal DOM update. Rebuilding blueprints is cheap; demolishing and rebuilding rooms is expensive — just like diffing JS objects vs mutating real DOM nodes.',
      s: 'React is the architect. Your component renders are blueprint revisions. The Fiber reconciler is the comparison engine. The commit phase is the construction crew.',
    },
    te: {
      def: 'The Virtual DOM is an in-memory tree of JavaScript objects mirroring the real DOM. Reconciliation is the algorithm that diffs old and new Virtual DOM trees and computes the minimal set of real DOM mutations needed to bring the UI up to date.',
      types: [
        {
          n: 'Element Diffing',
          d: 'If the root element type changes (e.g., div to span), React unmounts the old subtree and mounts the new one entirely. Same type means React updates the changed props only.',
        },
        {
          n: 'List Diffing with Keys',
          d: 'Keys let React match old and new list children by identity. Without keys, React diffs by position — reordering the list causes all items to update even if their content did not change.',
        },
        {
          n: 'Fiber Incremental Rendering',
          d: 'Fiber splits rendering into units of work. High-priority updates (user input) can interrupt low-priority ones (data loading). Enables Concurrent Mode, Suspense, and useTransition.',
        },
      ],
      when: 'Understanding reconciliation is critical when debugging unexpected re-renders, list performance, or why a component loses state (key change = unmount + remount).',
      trade:
        'The Virtual DOM adds a layer of indirection and memory overhead. For simple static UIs, direct DOM manipulation is faster. React wins on developer experience and correctness for complex, frequently-updating UIs — the diffing overhead is far smaller than the cost of manual DOM management at scale.',
      code: `// 1. Wrong key = full re-render of list children on reorder
// BAD: using array index as key
const BadList = ({ items }) => (
  <ul>
    {items.map((item, index) => (
      <li key={index}>{item.name}</li>  // index key breaks on reorder/insert
    ))}
  </ul>
);

// GOOD: stable, unique ID as key
const GoodList = ({ items }) => (
  <ul>
    {items.map((item) => (
      <li key={item.id}>{item.name}</li>  // React reuses existing DOM nodes
    ))}
  </ul>
);

// 2. React.memo prevents re-render when props did not change
const ExpensiveChild = React.memo(({ value }) => {
  console.log('render');
  return <div>{value}</div>;
});

// Parent re-renders do not re-render ExpensiveChild unless 'value' changes.
// Without React.memo, every parent render triggers a child render.

// 3. How reconciliation decides to reuse vs replace
// Same type -> update props (reuse DOM node)
// <div className='a' /> -> <div className='b' />  // className updated, div reused

// Different type -> unmount old, mount new
// <div /> -> <span />  // div unmounted, span mounted from scratch

// 4. Fiber work loop (conceptual)
// React processes Fiber nodes one at a time, checking after each unit
// whether higher-priority work has arrived (e.g., user clicked a button).
// If so, React yields, handles the high-priority update, then resumes.

// 5. React DevTools Profiler
// Wrap your app with <React.Profiler id='App' onRender={callback}>
// to measure render duration and identify expensive components.
const ProfiledApp = () => (
  <React.Profiler
    id='App'
    onRender={(id, phase, actualDuration) => {
      console.log(id, phase, actualDuration + 'ms');
    }}
  >
    <App />
  </React.Profiler>
);`,
      rw: {
        ex: [
          'React Native uses the same reconciler (Fiber) but targets native views instead of the DOM',
          'React DevTools Profiler visualises the Fiber work units and commit phases',
          'useTransition marks state updates as non-urgent, letting Fiber deprioritise them in favour of user input',
          'Suspense boundaries integrate with Fiber to suspend rendering of a subtree until async data resolves',
        ],
        cs: 'Facebook News Feed — tens of thousands of items updating in real time. Before React, engineers hand-optimised every DOM mutation. React\'s reconciler reduced this to a declarative render function per component; the diffing engine handles mutation optimisation automatically.',
      },
    },
    interview: {
      q: 'How does React\'s reconciliation algorithm work?',
      a: 'React maintains two Fiber trees: the current tree (what is in the DOM) and the work-in-progress tree (the new render output). Reconciliation walks both trees simultaneously. Two heuristics make this O(n): if element types differ, the old subtree is unmounted and a new one mounted; if types match, only changed props are updated. For lists, keys let React match old and new children by stable identity rather than position, so reordering does not force full re-renders. The Fiber architecture makes this incremental: work is split into units, and React can pause and resume processing between units, yielding the thread to the browser for high-priority tasks. The commit phase then flushes all computed DOM mutations synchronously.',
      fu: [
        'Why are keys important in lists?',
        'What is React Fiber?',
        'What is the difference between the render phase and the commit phase?',
        'How does useTransition relate to Fiber scheduling?',
      ],
    },
  },

  // ─── REACT HOOKS DEEP DIVE ───────────────────────────────────────────────────

  {
    id: 'react-hooks',
    cat: 'react',
    color: '#61dafb',
    icon: '🪝',
    title: 'React Hooks Deep Dive',
    tag: 'Hooks let function components use state and lifecycle features — but rules matter',
    overview:
      'Hooks, introduced in React 16.8, allow function components to use state, side effects, context, and other React features that previously required class components. The two rules of hooks — only call hooks at the top level, never inside loops or conditions; only call hooks from React functions — exist because React relies on the call order of hooks to associate each hook call with its state across renders. The most common bugs with hooks stem from the stale closure problem in useEffect: the effect closes over variables from the render it was created in, and if those variables change, the effect still sees the old values unless its dependency array is correct. useCallback memoizes a function reference; useMemo memoizes a computed value. Custom hooks extract stateful logic into reusable functions that compose cleanly without render prop or HOC indirection.',
    components: [
      {
        name: 'useState',
        icon: '📦',
        role: 'Local component state with automatic re-render on update.',
        detail:
          'React 18 batches all setState calls within event handlers and async transitions by default, reducing unnecessary re-renders. setState calls in setTimeout or native event handlers were previously not batched; React 18 fixes this with automatic batching.',
      },
      {
        name: 'useEffect',
        icon: '⚡',
        role: 'Synchronise the component with an external system (DOM, subscriptions, timers).',
        detail:
          'The cleanup function (returned from the effect) runs before the next effect and on unmount. The dependency array controls when the effect re-runs: empty array = once on mount, specific values = when those values change, no array = every render.',
      },
      {
        name: 'useCallback',
        icon: '🔁',
        role: 'Memoize a function reference to preserve referential equality across renders.',
        detail:
          'Returns the same function object as long as the dependencies have not changed. Useful when passing callbacks to memoized children (React.memo) — without useCallback, a new function object is created on every parent render, breaking memo\'s referential equality check.',
      },
      {
        name: 'useMemo',
        icon: '🧠',
        role: 'Memoize an expensive computed value.',
        detail:
          'Re-computes the value only when dependencies change. Unlike useCallback (which memoizes functions), useMemo memoizes the return value of any computation. Use for expensive pure calculations; avoid for trivial ones — the memoization overhead can exceed the computation cost.',
      },
      {
        name: 'useRef',
        icon: '📌',
        role: 'Mutable value that persists across renders without causing re-renders.',
        detail:
          'Two uses: hold a DOM node reference (passed as the ref prop), or store a mutable value (like a previous state or interval ID) that should persist across renders without triggering a re-render when changed. Updating ref.current is synchronous and does not schedule a re-render.',
      },
      {
        name: 'useContext',
        icon: '🌐',
        role: 'Read context value without prop drilling.',
        detail:
          'Returns the nearest Provider value. Every component that calls useContext re-renders whenever the context value changes — even if it only uses one field of a large context object. This is the key performance caveat of the Context API.',
      },
      {
        name: 'useReducer',
        icon: '🔧',
        role: 'Manage complex state transitions with a reducer function.',
        detail:
          'Preferred over useState when next state depends on previous state in complex ways, or when multiple state values move together. The reducer is a pure function: (state, action) => newState. Often paired with useContext as a lightweight state management solution.',
      },
      {
        name: 'Custom Hooks',
        icon: '🧩',
        role: 'Extract and reuse stateful logic across components.',
        detail:
          'A custom hook is a function whose name starts with "use" and that calls other hooks. It extracts stateful logic (data fetching, subscriptions, form handling) into a reusable unit without adding components to the tree — unlike render props or HOCs.',
      },
    ],
    a: {
      v: 'Power outlets in a building',
      t: 'Hooks are like standardised power outlets — every room (function component) has the same sockets (useState, useEffect, useContext). You plug in whatever appliance (feature) you need. You cannot wire a new outlet in the middle of a conversation about furniture — hooks must be at the top level, always.',
      tx: 'The rules of hooks exist because React tracks hook state by call order. Adding a hook inside a condition would shift the order on some renders, corrupting the state mapping — like rewiring outlets mid-use.',
      s: 'Custom hooks are extension cords — they let you bring the outlet to wherever the logic needs to live, keeping components clean.',
    },
    te: {
      def: 'Hooks are functions that let React function components opt into state, lifecycle, context, and other React features. They must be called unconditionally and at the top level so React can associate each hook call with its persisted state by stable call order.',
      types: [
        {
          n: 'State Hooks',
          d: 'useState and useReducer — hold values that trigger re-renders when updated. useState for simple values; useReducer for complex state machines.',
        },
        {
          n: 'Effect Hooks',
          d: 'useEffect and useLayoutEffect — run side effects after render. useEffect is async (does not block paint); useLayoutEffect is synchronous (blocks paint, use for DOM measurements).',
        },
        {
          n: 'Memoization Hooks',
          d: 'useMemo and useCallback — skip expensive recomputation and preserve referential equality across renders. Only pay the overhead when the memoized value is truly expensive.',
        },
      ],
      when: 'Use useEffect for any synchronisation with an external system. Use useCallback when passing functions to memoized children. Use useMemo for computationally expensive derivations. Use useReducer when state transitions are complex or multiple state values change together.',
      trade:
        'Hooks simplify component logic and eliminate class component ceremony, but the stale closure problem is non-obvious and can cause silent bugs. The dependency array is the most common source of bugs in React codebases — missing dependencies cause stale reads; unnecessary dependencies cause infinite effect loops.',
      code: `// 1. useEffect with proper cleanup — prevents memory leaks
useEffect(() => {
  const subscription = eventBus.subscribe('update', handler);
  const timer = setInterval(tick, 1000);

  return () => {
    subscription.unsubscribe();  // cleanup on unmount or before next effect
    clearInterval(timer);
  };
}, [handler]);  // re-subscribe only if handler changes

// 2. Stale closure bug and fix with useRef
function Counter() {
  const [count, setCount] = useState(0);

  // BUG: 'count' is captured at effect creation time.
  // After 1s, logs '0' even if count has changed.
  useEffect(() => {
    const id = setTimeout(() => console.log(count), 1000);
    return () => clearTimeout(id);
  }, []);  // missing 'count' dependency

  // FIX: store count in a ref — ref.current always has the latest value
  const countRef = useRef(count);
  countRef.current = count;
  useEffect(() => {
    const id = setTimeout(() => console.log(countRef.current), 1000);
    return () => clearTimeout(id);
  }, []);  // no dependency needed — ref is stable

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// 3. useCallback vs useMemo difference
const Parent = ({ items }) => {
  // useCallback: memoize the function reference
  const handleClick = useCallback((id) => {
    console.log('clicked', id);
  }, []);  // stable reference — MemoChild does not re-render

  // useMemo: memoize the computed value
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]  // re-sort only when items array changes
  );

  return <MemoChild onClick={handleClick} items={sorted} />;
};

// 4. Custom hook — useFetch
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };  // prevent state update on unmount
  }, [url]);

  return { data, loading, error };
}

// 5. useReducer for complex state
const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START': return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS': return { loading: false, error: null, data: action.payload };
    case 'FETCH_ERROR': return { ...state, loading: false, error: action.error };
    default: return state;
  }
};

function DataComponent() {
  const [state, dispatch] = useReducer(reducer, { loading: false, data: null, error: null });
  // dispatch({ type: 'FETCH_START' }) ...
}`,
      rw: {
        ex: [
          'React Query uses useEffect and useRef internally to manage cache, refetch intervals, and subscription lifecycles',
          'React Router uses useContext to provide routing state to any component in the tree',
          'React Hook Form uses useRef to track form field values without controlled re-renders on every keystroke',
          'SWR (Stale-While-Revalidate) is built entirely as a custom hook — useSWR returns data, error, and loading state',
        ],
        cs: 'Airbnb migrated millions of lines of React class components to hooks. They found hooks eliminated 40% of the class component ceremony and made logic reuse (via custom hooks) far easier than HOC composition chains, which previously caused the "wrapper hell" problem.',
      },
    },
    interview: {
      q: 'What is the stale closure problem in useEffect and how do you fix it?',
      a: 'A closure is stale when an effect (or any callback) captures a variable from a previous render and that variable has since changed. In useEffect, if you read a state variable but omit it from the dependency array, the effect always sees the value from the render it was created in — never the current value. The canonical fix is to list all values the effect reads in the dependency array. When this causes the effect to run too often, you have two alternatives: use the functional updater form of setState (setCount(prev => prev + 1)) so you do not need to read count at all; or store the latest value in a ref (ref.current = value) and read from the ref inside the effect — refs are mutable, stable across renders, and reading them does not trigger re-renders.',
      fu: [
        'When do you use useCallback vs useMemo?',
        'What are the rules of hooks and why do they exist?',
        'What is the difference between useEffect and useLayoutEffect?',
        'How does React 18 automatic batching change useState behaviour?',
      ],
    },
  },

  // ─── STATE MANAGEMENT ────────────────────────────────────────────────────────

  {
    id: 'react-state',
    cat: 'react',
    color: '#61dafb',
    icon: '🗃️',
    title: 'State Management Patterns',
    tag: 'Local state, lifted state, Context, Zustand, Redux — pick the right tool for the scale',
    overview:
      'State management is not one problem — it is two: client state (UI state, user interactions, local component state) and server state (data fetched from an API, caching, synchronisation). Conflating the two leads to overly complex Redux stores full of API data that a library like React Query would manage better. For client state, the decision ladder is: local useState if only one component needs it; lifted state if siblings share it; Context if many components need it but it changes infrequently; Zustand or Jotai for high-frequency shared state with minimal boilerplate; Redux Toolkit for large teams needing strict patterns, time-travel debugging, or middleware. The Context API is not a state manager — it is a dependency injection mechanism. Using it for high-frequency state (typing in an input, mouse position) causes every consumer to re-render on every update, which is a performance problem that splitting contexts partially mitigates.',
    components: [
      {
        name: 'Local State (useState)',
        icon: '📦',
        role: 'State owned by a single component.',
        detail:
          'The simplest and most common form of state. Keep it local as long as possible — only lift when two or more components need the same value. Lifting to a shared ancestor and passing down via props is always correct; it is only worth adding a state manager when prop drilling becomes painful.',
      },
      {
        name: 'Lifted State',
        icon: '🏗️',
        role: 'State moved to the nearest common ancestor of the components that need it.',
        detail:
          'Lifting state is a refactoring, not an architecture. Move state up the tree until both consumers can access it via props. This works well for shallow component trees; it becomes prop drilling when the tree is deep.',
      },
      {
        name: 'Context API',
        icon: '🌐',
        role: 'Broadcast a value to any descendant without prop drilling.',
        detail:
          'Context is ideal for slow-changing values: theme, locale, auth user, feature flags. Every component that calls useContext re-renders when the context value reference changes. Splitting a large context into smaller ones limits re-render blast radius.',
      },
      {
        name: 'useReducer + Context',
        icon: '🔧',
        role: 'Lightweight global state without an external library.',
        detail:
          'Pair a useReducer in a top-level component with Context to distribute dispatch and state to any descendant. Works well for medium-complexity state with a small number of consumers. Scales worse than Zustand under high update frequency.',
      },
      {
        name: 'Zustand',
        icon: '🐻',
        role: 'Minimal external state manager — no boilerplate, selective subscriptions.',
        detail:
          'A single create() call produces a store with state and actions. Components subscribe to slices of the store via a selector — only those components re-render when that slice changes. No provider, no reducer boilerplate, no action creators.',
      },
      {
        name: 'Redux Toolkit (RTK)',
        icon: '🏪',
        role: 'Opinionated, full-featured state manager for large applications.',
        detail:
          'createSlice combines reducer and action creators. createAsyncThunk handles async operations with pending/fulfilled/rejected states. RTK Query is a built-in data fetching and caching layer. Best for teams that need strict conventions, Redux DevTools, or complex middleware.',
      },
      {
        name: 'React Query (Server State)',
        icon: '🌩️',
        role: 'Cache, sync, and invalidate server data — separate from client UI state.',
        detail:
          'React Query treats server data as a cache that needs to stay fresh, not as owned state. useQuery fetches and caches; useMutation updates and invalidates. Provides background refetch, stale-while-revalidate, pagination, and optimistic updates out of the box.',
      },
    ],
    a: {
      v: 'Kitchen pantry system',
      t: 'Local state is ingredients on your counter — only you use them. Lifted state is a shared shelf siblings both reach. Context is a community fridge everyone in the building can access. Zustand is a smart fridge that notifies you only when your specific shelf changes. Redux is a commercial kitchen inventory system — more setup, but full audit log and roles.',
      tx: 'You would not put a can of salt in a commercial inventory system, and you would not manage a restaurant supply chain on a kitchen counter. Match the tool to the scope.',
      s: 'Server state (React Query) is the delivery system — the ingredients arrive fresh, are cached, and expire. It is separate from how you store them once they arrive.',
    },
    te: {
      def: 'State management is the discipline of deciding where state lives, how it changes, and how components access it. Client state and server state are distinct problems requiring different tools.',
      types: [
        {
          n: 'Client State',
          d: 'UI state owned by the frontend: open/closed modal, selected tab, form input values, user preferences. Lives in useState, useReducer, Zustand, or Redux.',
        },
        {
          n: 'Server State',
          d: 'Data fetched from an API that needs caching, background refresh, and invalidation. Best managed by React Query, SWR, or RTK Query — not by global client state.',
        },
        {
          n: 'URL State',
          d: 'State encoded in the URL (query params, path segments). Survives navigation and is shareable. Managed with React Router or Next.js router.',
        },
      ],
      when: 'Start with local state. Lift when siblings share. Add Context for slow-changing global values. Add Zustand for high-frequency shared state. Add RTK when you need middleware, DevTools, or a team-wide convention. Always use React Query for server data.',
      trade:
        'Every step up the state management ladder adds capability at the cost of boilerplate and indirection. The biggest mistake is over-engineering: reaching for Redux for a three-page app, or storing server data (API responses) in Redux instead of React Query, forcing you to manually manage loading, error, and cache-invalidation logic that the library provides for free.',
      code: `// 1. Context API performance problem and fix
// BAD: one large context — all consumers re-render on any change
const AppContext = createContext(null);
const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [count, setCount] = useState(0);  // high-frequency
  return (
    <AppContext.Provider value={{ user, setUser, theme, setTheme, count, setCount }}>
      {children}
    </AppContext.Provider>
  );
};
// Typing in a counter updates 'count' -> EVERY consumer re-renders

// GOOD: split into separate contexts by update frequency
const UserContext = createContext(null);    // slow changing
const ThemeContext = createContext(null);   // slow changing
const CounterContext = createContext(null); // fast changing — isolated

// 2. Zustand store — minimal boilerplate
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  user: null,
  increment: () => set((state) => ({ count: state.count + 1 })),
  setUser: (user) => set({ user }),
}));

// Selective subscription — only re-renders when 'count' changes
const Counter = () => {
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);
  return <button onClick={increment}>{count}</button>;
};

// 3. RTK createSlice + createAsyncThunk
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchUser = createAsyncThunk('user/fetch', async (id) => {
  const res = await fetch('/api/users/' + id);
  return res.json();
});

const userSlice = createSlice({
  name: 'user',
  initialState: { data: null, loading: false, error: null },
  reducers: {
    clearUser: (state) => { state.data = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => { state.loading = true; })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

// 4. React Query for server state
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const UserProfile = ({ userId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch('/api/users/' + userId).then(r => r.json()),
    staleTime: 5 * 60 * 1000,  // cache for 5 minutes
  });

  const queryClient = useQueryClient();
  const updateUser = useMutation({
    mutationFn: (updates) => fetch('/api/users/' + userId, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', userId] }),
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <div>{data.name}</div>;
};`,
      rw: {
        ex: [
          'Vercel\'s dashboard uses React Query for all server data — the dashboard refetches deployment status in the background without full page reloads',
          'Linear uses Zustand for client UI state (selected issue, sidebar open/closed) and a custom sync layer for server state',
          'Redux is widely used in large e-commerce applications where complex cart, checkout, and user session state needs middleware (analytics, logging) and time-travel debugging',
          'Next.js applications often use React Query or SWR because server-side rendering and client-side caching are first-class features of both libraries',
        ],
        cs: 'Shopify Polaris design system migrated their admin from class-based Redux to a combination of React Query (server state) and local component state. This eliminated 60% of their Redux reducers and actions, removed the need for thunks, and made individual component tests trivial because components no longer depended on a global Redux store.',
      },
    },
    interview: {
      q: "What's wrong with using Context API for high-frequency state updates?",
      a: "Context does not have a subscription model — it has a broadcast model. When the context value reference changes, React re-renders every component that calls useContext for that context, regardless of whether the component uses the specific piece of data that changed. For slow-changing values (auth user, theme, locale), this is fine — they rarely change. For high-frequency values (a counter, mouse position, a form field), every update triggers a re-render cascade across all consumers. Splitting the context into smaller, focused contexts limits the blast radius. But for truly high-frequency state, use Zustand — it has a selector-based subscription model where a component only re-renders when the specific slice of state it selects has changed.",
      fu: [
        'What is the difference between client state and server state?',
        'When would you choose Zustand over Redux?',
        'How does React Query handle cache invalidation?',
        'What is stale-while-revalidate?',
      ],
    },
  },

  // ─── REACT PERFORMANCE ───────────────────────────────────────────────────────

  {
    id: 'react-performance',
    cat: 'react',
    color: '#61dafb',
    icon: '⚡',
    title: 'React Performance Optimization',
    tag: 'Avoid unnecessary re-renders and expensive computations — measure before optimizing',
    overview:
      'React performance problems fall into two categories: unnecessary re-renders (a component re-renders when its output would not change) and expensive renders (a component does significant work each time it renders). The tools for unnecessary re-renders are React.memo, useCallback, and useMemo. The tools for expensive renders are lazy loading, code splitting, and virtualization. The cardinal rule is: measure first. React DevTools Profiler tells you exactly which components are slow and why. Premature optimization with useMemo and useCallback can actually hurt performance — creating closures and running dependency comparisons has overhead that only pays off when the memoized value or function is genuinely expensive to recreate. Virtualization (rendering only visible items) is essential when rendering lists of thousands of items — no amount of memoization helps when 10,000 DOM nodes exist simultaneously.',
    components: [
      {
        name: 'React.memo',
        icon: '🧠',
        role: 'Skip re-rendering a component when its props have not changed.',
        detail:
          'React.memo wraps a component and shallowly compares props between renders. If all props are equal by reference (or value for primitives), the component skips the render and reuses the previous output. A custom comparison function can be passed as the second argument for deep equality or partial prop comparison.',
      },
      {
        name: 'useMemo',
        icon: '💾',
        role: 'Memoize expensive computed values.',
        detail:
          'Re-computes the value only when listed dependencies change. If an object or array is computed in render and passed as a prop to a memoized child, useMemo preserves its reference between renders, preventing the child from seeing a "new" prop every time.',
      },
      {
        name: 'useCallback',
        icon: '🔁',
        role: 'Preserve function reference across renders.',
        detail:
          'Without useCallback, a function defined in render is a new object every render. Passing it to a React.memo child breaks memoization because the child sees a new prop. useCallback returns the same function reference unless dependencies change.',
      },
      {
        name: 'lazy + Suspense',
        icon: '⏳',
        role: 'Code-split components — load them only when first rendered.',
        detail:
          'React.lazy(() => import("./HeavyComponent")) creates a lazy component. Suspense wraps it with a fallback (loading spinner). The component bundle is only downloaded when the component is first rendered, reducing initial bundle size.',
      },
      {
        name: 'Code Splitting',
        icon: '✂️',
        role: 'Break the JS bundle into smaller chunks loaded on demand.',
        detail:
          'Route-level code splitting (lazy() per route) is the highest-impact optimization for most apps. Users download only the code for the pages they visit. Webpack and Vite split bundles automatically at dynamic import() boundaries.',
      },
      {
        name: 'React DevTools Profiler',
        icon: '🔍',
        role: 'Measure which components render, how often, and how long they take.',
        detail:
          'Record a session, then inspect the flame chart. Look for large bars (expensive renders) and components that render unexpectedly often. The "why did this render" feature shows which prop or state change triggered each render.',
      },
      {
        name: 'Virtualization (react-window)',
        icon: '📋',
        role: 'Render only visible list items — constant DOM size regardless of list length.',
        detail:
          'Rendering 10,000 list items creates 10,000 DOM nodes, destroying scroll performance. react-window and react-virtual render only the items currently visible in the viewport, recycling DOM nodes as the user scrolls. DOM node count stays constant at ~20-30 regardless of list length.',
      },
      {
        name: 'key prop',
        icon: '🔑',
        role: 'Stable identity for list items; force remount when identity changes.',
        detail:
          'Using an unstable key (like array index) on a list that changes causes unnecessary remounts. Using a stable ID preserves component state and DOM nodes. Conversely, changing the key intentionally forces React to unmount and remount — useful for resetting component state.',
      },
    ],
    a: {
      v: 'Efficient factory assembly line',
      t: 'A factory does not rebuild every product from scratch for every order. It caches subassemblies (memoization), only builds what is ordered (lazy loading), and keeps only the boxes currently on the conveyor belt (virtualization), not all 10,000 in the warehouse.',
      tx: 'Optimizing before you know which station is the bottleneck wastes engineering effort. Measure the line (Profiler) first, then optimize the slowest station.',
      s: 'React DevTools Profiler is the factory floor monitor. React.memo and useMemo are the cached subassemblies. react-window is the conveyor belt that only carries visible boxes.',
    },
    te: {
      def: 'React performance optimization reduces unnecessary re-renders (via memoization), expensive computations (via useMemo), bundle size (via code splitting), and DOM node count (via virtualization). Always profile before optimizing.',
      types: [
        {
          n: 'Re-render Prevention',
          d: 'React.memo, useCallback, useMemo — preserve referential equality so downstream components see the same prop references and skip rendering.',
        },
        {
          n: 'Bundle Optimization',
          d: 'React.lazy, dynamic import(), route-level splitting — reduce the initial JS payload the browser must download and parse.',
        },
        {
          n: 'DOM Optimization',
          d: 'Virtualization (react-window, react-virtual) — keep DOM node count constant for large lists by only rendering visible items.',
        },
      ],
      when: 'Profile first with React DevTools Profiler. Optimize when a component renders more than it should, takes more than 16ms (60fps budget), or when the initial bundle is large enough to hurt load time. Do not add useMemo or useCallback to every function and value by default.',
      trade:
        'Memoization adds cognitive overhead (dependency arrays, referential equality rules) and runtime overhead (closure creation, dependency comparison). It only pays off when the memoized value is significantly more expensive to create than the comparison. Over-memoization makes code harder to read and can slow down simple components. Virtualization requires knowing item heights in advance (or measuring them), adds complexity, and breaks some CSS assumptions.',
      code: `// 1. React.memo with custom comparison
const PriceTag = React.memo(
  ({ price, currency }) => <span>{currency}{price}</span>,
  (prev, next) => prev.price === next.price && prev.currency === next.currency
);

// 2. Referential equality problem — why memo sometimes does not work
const Parent = () => {
  // BAD: new object on every render — breaks MemoChild
  const style = { color: 'red' };
  const handleClick = () => console.log('clicked');

  // GOOD: stable references
  const stableStyle = useMemo(() => ({ color: 'red' }), []);
  const stableClick = useCallback(() => console.log('clicked'), []);

  return <MemoChild style={stableStyle} onClick={stableClick} />;
};

// 3. Route-level code splitting with lazy + Suspense
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Analytics = lazy(() => import('./pages/Analytics'));

const App = () => (
  <Suspense fallback={<PageSpinner />}>
    <Routes>
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/settings' element={<Settings />} />
      <Route path='/analytics' element={<Analytics />} />
    </Routes>
  </Suspense>
);

// 4. react-window for 10,000-item list
import { FixedSizeList } from 'react-window';

const Row = ({ index, style }) => (
  <div style={style}>Item {index}</div>  // style positions the row absolutely
);

const BigList = ({ items }) => (
  <FixedSizeList
    height={600}      // viewport height in px
    itemCount={items.length}  // total items (10,000)
    itemSize={50}     // each row is 50px tall
    width='100%'
  >
    {Row}
  </FixedSizeList>
  // Only ~12 rows exist in the DOM at any time
);

// 5. Why premature useCallback/useMemo can hurt
// BAD: memoizing a trivial value costs more than recomputing it
const name = useMemo(() => user.firstName + ' ' + user.lastName, [user]);

// GOOD: just compute it — string concatenation is cheap
const name = user.firstName + ' ' + user.lastName;

// useCallback only pays off when the callback is passed to a React.memo child.
// Wrapping every function in useCallback adds overhead with no benefit.`,
      rw: {
        ex: [
          'Twitter/X uses virtualization for the timeline — rendering all tweets would crash the browser; only visible ones exist in the DOM',
          'Notion code-splits every block type — the PDF viewer, spreadsheet, and code editor are only downloaded when first inserted',
          'GitHub pull request diff view uses react-window to render large diffs without creating thousands of DOM nodes',
          'Google Maps React wrapper uses React.memo aggressively — map tiles and markers must not re-render on every parent state change',
        ],
        cs: 'Atlassian rebuilt Jira\'s board view with react-window after profiling showed the existing implementation created 2,000+ DOM nodes for a large sprint board. After virtualization, DOM node count dropped to ~60 and scroll performance improved from 15fps to 60fps on mid-range hardware.',
      },
    },
    interview: {
      q: 'Why does React.memo sometimes not work?',
      a: 'React.memo does a shallow comparison of props — it compares each prop by reference (===). It fails to prevent re-renders when a prop is a new object, array, or function created on every parent render. Objects ({color: "red"}) and arrays ([1,2,3]) are reference types — a new literal is a new reference even if the content is identical. Functions defined in render are also new objects every render. The fix is to stabilize those props: wrap computed objects and arrays in useMemo, and wrap callback functions in useCallback, so their references stay the same between renders unless their dependencies change. A common mistake is adding useCallback to a function but forgetting to update the dependency array — the stale closure then causes bugs that are harder to debug than the original re-render.',
      fu: [
        'What is virtualization and when do you need it?',
        'How do you diagnose performance issues in a React app?',
        'When does useMemo hurt rather than help performance?',
        'What is the difference between React.memo and useMemo?',
      ],
    },
  },

  // ─── REACT PATTERNS ──────────────────────────────────────────────────────────

  {
    id: 'react-patterns',
    cat: 'react',
    color: '#61dafb',
    icon: '🏗️',
    title: 'React Component Patterns',
    tag: 'Compound components, render props, HOCs — patterns for reusable and flexible React components',
    overview:
      'React component patterns are solutions to recurring composition problems. Compound components solve the "tightly-coupled group of components" problem — think Tabs with Tab.List and Tab.Panel — by sharing state through Context instead of prop drilling. Higher-Order Components (HOCs) were the primary reuse mechanism before hooks; they wrap a component to inject props or behaviour, but introduce wrapper hell and make component hierarchies hard to read. Render props pass a function as a prop so the parent can render whatever the child provides — flexible but verbose. Custom hooks have replaced both HOCs and render props for most logic-reuse cases because they extract logic without wrapping components. Error Boundaries are the one pattern that must remain a class component — they use componentDidCatch and getDerivedStateFromError lifecycle methods that have no hook equivalent. Portals render children into a different DOM node, solving the z-index and overflow problem for modals and tooltips.',
    components: [
      {
        name: 'Compound Components',
        icon: '🔗',
        role: 'Group of components that share implicit state through Context.',
        detail:
          'Instead of a single monolithic Tabs component with tabs and panels as props, compound components (Tabs, Tabs.List, Tabs.Tab, Tabs.Panel) each access shared state via useContext. The API is declarative and composable — consumers arrange components however they want without prop drilling.',
      },
      {
        name: 'Render Props',
        icon: '🎁',
        role: 'Pass a function as a prop to share stateful logic without HOC wrapping.',
        detail:
          'The component calls the prop function with its internal state, giving the consumer control over what to render. Once the primary pattern for logic reuse; largely superseded by custom hooks. Still useful in third-party libraries (react-table, react-final-form).',
      },
      {
        name: 'Higher-Order Components (HOC)',
        icon: '🎭',
        role: 'Wrap a component to inject props or cross-cutting behaviour.',
        detail:
          'A HOC is a function that takes a component and returns a new component with enhanced behaviour (withAuth, withLogger, withTheme). Causes wrapper hell (deeply nested component trees in DevTools) and makes it hard to know which HOC added which prop. Custom hooks are preferred for new code.',
      },
      {
        name: 'Controlled vs Uncontrolled Inputs',
        icon: '🎛️',
        role: 'Who owns the input value — React state or the DOM?',
        detail:
          'Controlled: React state is the source of truth; value and onChange are both provided. Uncontrolled: the DOM owns the value; accessed via ref. Controlled inputs enable validation, formatting, and synchronisation but re-render on every keystroke. Uncontrolled inputs are simpler and faster but harder to validate in real time.',
      },
      {
        name: 'Portals',
        icon: '🚪',
        role: 'Render children into a DOM node outside the parent component tree.',
        detail:
          'ReactDOM.createPortal(children, domNode) renders children at domNode in the real DOM while keeping them logically inside the parent in the React tree (event bubbling and context work normally). Solves z-index and overflow:hidden problems for modals, tooltips, and dropdowns.',
      },
      {
        name: 'Error Boundaries',
        icon: '🛡️',
        role: 'Catch render errors in a subtree and display a fallback UI.',
        detail:
          'A class component that implements componentDidCatch (side effects after error) and static getDerivedStateFromError (return state to trigger fallback render). There is no hook equivalent — this is the only pattern that requires a class component in modern React. Place them strategically around major UI sections.',
      },
    ],
    a: {
      v: 'Lego building system',
      t: 'Lego bricks are compound components — a Technic set gives you gears, axles, and frames that snap together in a defined but flexible way. HOCs are pre-assembled subsets you buy complete. Render props are a special brick with an open slot — you choose what goes in. Error Boundaries are the base plate — it cannot be replaced but it catches pieces that fall.',
      tx: 'The power is composability. Any brick that follows the Lego interface (the stud pattern) works with any other. React patterns achieve the same: any component following the compound component interface integrates without prop changes.',
      s: 'Custom hooks are invisible Lego tools — they do not appear in the final model but they make assembly easier and cleaner.',
    },
    te: {
      def: 'React component patterns are reusable solutions to composition and logic-sharing problems. They trade off flexibility, explicitness, and component tree complexity against each other. Modern React favours custom hooks for logic reuse and compound components for flexible UI composition.',
      types: [
        {
          n: 'Composition Patterns',
          d: 'Compound components, children as functions, slot-based rendering — control how components nest and share state without tight coupling.',
        },
        {
          n: 'Logic Reuse Patterns',
          d: 'Custom hooks (preferred), HOCs, render props — extract stateful logic so multiple components can share it without code duplication.',
        },
        {
          n: 'Escape Hatch Patterns',
          d: 'Portals (render outside DOM tree), Error Boundaries (catch render errors), uncontrolled inputs (let DOM own state) — for cases where the normal React model does not fit.',
        },
      ],
      when: 'Use compound components when a set of components must share state and you want a declarative, composable API. Use custom hooks for logic reuse. Reach for HOCs only when integrating with legacy code or a library that requires it. Error Boundaries belong around every major UI section in production.',
      trade:
        'Compound components add Context overhead and require consumers to use all parts together. HOCs create wrapper hell and prop name collisions. Render props are verbose. Custom hooks cannot replace Error Boundaries (class component limitation). Portals require a DOM node to render into, adding setup complexity. Every pattern involves a tradeoff — choose based on the specific composition problem, not convention.',
      code: `// 1. Compound component — Tabs with Context-based state sharing
const TabsContext = createContext(null);

const Tabs = ({ children, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className='tabs'>{children}</div>
    </TabsContext.Provider>
  );
};

Tabs.List = ({ children }) => <div className='tab-list'>{children}</div>;

Tabs.Tab = ({ id, children }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button
      className={activeTab === id ? 'active' : ''}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
};

Tabs.Panel = ({ id, children }) => {
  const { activeTab } = useContext(TabsContext);
  return activeTab === id ? <div className='tab-panel'>{children}</div> : null;
};

// Usage — fully declarative, no prop drilling
const App = () => (
  <Tabs defaultTab='profile'>
    <Tabs.List>
      <Tabs.Tab id='profile'>Profile</Tabs.Tab>
      <Tabs.Tab id='settings'>Settings</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel id='profile'><ProfilePanel /></Tabs.Panel>
    <Tabs.Panel id='settings'><SettingsPanel /></Tabs.Panel>
  </Tabs>
);

// 2. HOC — withAuth
const withAuth = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const { user } = useAuth();
    if (!user) return <Redirect to='/login' />;
    return <WrappedComponent {...props} user={user} />;
  };
};
const ProtectedDashboard = withAuth(Dashboard);
// Prefer: a custom useAuth hook + conditional render in the component itself

// 3. Render prop — mouse position tracker
const MouseTracker = ({ render }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>
      {render(pos)}  // consumer decides what to render with the position
    </div>
  );
};
// Usage: <MouseTracker render={({ x, y }) => <Cursor x={x} y={y} />} />

// 4. Error Boundary — must be a class component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };  // trigger fallback render
  }

  componentDidCatch(error, info) {
    // Log to Sentry, Datadog, etc.
    console.error('Render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}

// 5. Portal — modal rendered outside parent DOM, inside React tree
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.getElementById('modal-root')  // renders here in real DOM
    // but stays inside React tree — context and events work normally
  );
};

// 6. Controlled vs uncontrolled input
// Controlled — React owns the value
const ControlledInput = () => {
  const [value, setValue] = useState('');
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
};

// Uncontrolled — DOM owns the value, accessed via ref
const UncontrolledInput = () => {
  const inputRef = useRef(null);
  const handleSubmit = () => console.log(inputRef.current.value);
  return <input ref={inputRef} defaultValue='' />;
};`,
      rw: {
        ex: [
          'Radix UI (Headless UI) uses compound components extensively — Dialog.Root, Dialog.Trigger, Dialog.Content follow the exact compound component pattern',
          'React Table uses render props to give consumers full control over how cells, headers, and rows are rendered',
          'Next.js App Router uses the Error Boundary pattern via error.tsx files as co-located error boundaries per route segment',
          'React Hook Form uses a Controller compound component + render prop to integrate controlled inputs with any UI library',
        ],
        cs: 'Reach UI (now merged into Radix) pioneered accessible compound components in the React ecosystem. Their Tabs, Menu, and Dialog components use Context-based compound patterns with built-in ARIA attributes, demonstrating that compound components can encapsulate both state management and accessibility concerns without sacrificing the declarative API that makes React compelling.',
      },
    },
    interview: {
      q: 'What is a compound component pattern?',
      a: 'A compound component is a group of components that work together and share implicit state through React Context, rather than through explicit prop drilling. The parent component (like Tabs) creates a Context with shared state (which tab is active) and a Provider. Each child component (Tabs.List, Tabs.Tab, Tabs.Panel) reads from the Context to coordinate behaviour. The result is a declarative, composable API: consumers can arrange the child components in any order and nest other elements between them without the parent needing to know. The key benefit over a monolithic component (one big Tabs with a tabs={[...]} prop) is that consumers have full control over rendering — they can add icons, badges, or custom wrappers to Tab components without the parent component needing to support every possible variation.',
      fu: [
        'When would you use a HOC vs a custom hook?',
        'How do error boundaries work and why must they be class components?',
        'What is the difference between controlled and uncontrolled inputs?',
        'How do portals maintain event bubbling and context despite rendering outside the parent DOM node?',
      ],
    },
  },
];

import { Concept } from '../types';

export const JS_CONCEPTS: Concept[] = [
  // ─── EVENT LOOP & CONCURRENCY ─────────────────────────────────────────────

  {
    id: 'js-event-loop',
    cat: 'javascript',
    color: '#f7df1e',
    icon: '🔄',
    title: 'Event Loop & Concurrency',
    tag: 'JavaScript is single-threaded — the event loop is how it handles async without blocking',
    overview:
      'JavaScript runs on a single thread — only one piece of code executes at a time. The event loop is the mechanism that enables non-blocking behavior by delegating async operations (timers, network requests, DOM events) to Web APIs (browser) or libuv (Node.js). When an async operation completes, its callback is placed in a queue. The event loop continuously checks if the call stack is empty, then pulls the next callback from the queue to execute. There are two queues that matter: the macrotask queue (setTimeout, setInterval, I/O) and the microtask queue (Promise.then, queueMicrotask). Microtasks always drain completely before the next macrotask runs.',
    components: [
      {
        name: 'Call Stack',
        icon: '📚',
        role: 'LIFO stack of currently executing function frames.',
        detail:
          'Every function call pushes a frame onto the call stack. When the function returns, the frame is popped. The event loop only picks up the next queued task when the call stack is completely empty. A long synchronous operation keeps the stack busy and blocks everything — this is why heavy computation freezes the UI.',
      },
      {
        name: 'Web APIs / libuv',
        icon: '🌐',
        role: 'Handles async operations off the main thread.',
        detail:
          'When you call setTimeout, fetch, or addEventListener, the browser (or libuv in Node.js) handles the operation in the background using system threads or OS APIs. The JS thread is free to continue executing. When the operation finishes, the callback is placed in the appropriate queue — macrotask for timers and I/O, microtask for resolved Promises.',
      },
      {
        name: 'Microtask Queue',
        icon: '⚡',
        role: 'High-priority queue — drains completely after each task.',
        detail:
          'Promise.then(), Promise.catch(), Promise.finally(), and queueMicrotask() add to the microtask queue. After each task completes (and after each render in browsers), the engine drains the entire microtask queue before moving to the next macrotask. This means Promise.resolve().then() always runs before setTimeout(fn, 0).',
      },
      {
        name: 'Macrotask Queue',
        icon: '📋',
        role: 'Lower-priority queue — one task per event loop tick.',
        detail:
          'setTimeout, setInterval, setImmediate (Node.js), and I/O callbacks are macrotasks. After each macrotask, the microtask queue is fully drained before the next macrotask starts. Setting setTimeout(fn, 0) does not mean "run immediately" — it means "run in the next available macrotask slot after at least 0ms".',
      },
    ],
    a: {
      v: 'Restaurant with a single waiter',
      t: 'The call stack is a waiter serving one table at a time. When a customer orders food (async operation), the waiter hands the ticket to the kitchen (Web API) and moves on to other tables. When food is ready (callback queued), the waiter delivers it between other tasks. VIP orders (microtasks/Promises) are always delivered before new table orders (macrotasks/setTimeout).',
      tx: 'The waiter never stands in the kitchen waiting — they always keep moving. That is non-blocking I/O. The kitchen notification system is the queue, and the waiter checking the pass is the event loop. Priority customers (Promises) get served before regular queued tables.',
      s: 'In your UI, "await fetch(url)" releases the call stack so the browser can handle user clicks and re-renders while the network request is in-flight. When the response arrives, the next line of your async function re-enters the microtask queue and resumes.',
    },
    te: {
      def: 'The JavaScript event loop is a runtime mechanism that pulls callbacks from task queues onto the call stack when the stack is empty. Microtasks (Promises) drain completely after each task before the next macrotask (setTimeout, I/O) runs.',
      types: [
        {
          n: 'Microtask Queue',
          d: 'Promise.then/catch/finally, queueMicrotask. Drains fully after each task — always runs before the next setTimeout.',
        },
        {
          n: 'Macrotask Queue',
          d: 'setTimeout, setInterval, I/O callbacks, UI events. One task per event loop tick, then microtasks drain.',
        },
        {
          n: 'Render Steps (browser)',
          d: 'Between macrotasks, the browser may run layout/paint. Microtasks run before render, which is why Promise chains can delay rendering.',
        },
      ],
      when: 'Understanding the event loop matters when: debugging unexpected async ordering, explaining why UI freezes during heavy computation, choosing between Promise.then and setTimeout for deferral, and writing performant animations that avoid blocking the render pipeline.',
      trade:
        'Single-threaded simplicity means no race conditions or mutex locks in JS — a major advantage. The cost is that any long synchronous operation (> ~16ms) blocks rendering and input handling. The solution is breaking work into chunks using setTimeout/requestAnimationFrame or offloading to Web Workers.',
      code: `// ── Execution order: the classic interview puzzle ────────────────────────────

console.log('1 - start');                        // sync: runs immediately

setTimeout(() => console.log('5 - setTimeout 0'), 0); // macrotask queue

Promise.resolve()
  .then(() => console.log('3 - promise 1'))      // microtask queue
  .then(() => console.log('4 - promise 2'));     // chained microtask

console.log('2 - end');                          // sync: runs immediately

// Output order: 1, 2, 3, 4, 5
// Why: sync runs first, then microtasks drain (3, 4), then macrotask (5)

// ── Nested microtask vs macrotask ordering ────────────────────────────────────

setTimeout(() => {
  console.log('A - setTimeout callback');
  Promise.resolve().then(() => console.log('B - promise inside setTimeout'));
}, 0);

Promise.resolve().then(() => console.log('C - outer promise'));

// Output: C, A, B
// Outer promise (microtask) beats the setTimeout (macrotask).
// The promise INSIDE setTimeout runs as a microtask after 'A' but before
// any other macrotasks.

// ── Blocking the event loop ───────────────────────────────────────────────────

// BAD: synchronous heavy computation blocks all I/O and rendering
function blockingWork() {
  const start = Date.now();
  while (Date.now() - start < 2000) {}  // blocks for 2 seconds
}

// GOOD: yield back to the event loop between chunks
function chunkedWork(items, onDone) {
  let i = 0;
  function processChunk() {
    const end = Math.min(i + 100, items.length);
    while (i < end) { /* process items[i] */ i++; }
    if (i < items.length) setTimeout(processChunk, 0); // yield then resume
    else onDone();
  }
  processChunk();
}`,
      rw: {
        ex: [
          'React batches setState calls in event handlers into one re-render using the microtask queue in React 18+',
          'async/await is syntactic sugar — every await point is a microtask queue entry for the continuation',
          'requestAnimationFrame callbacks run after microtasks but before the next macrotask, in sync with display refresh',
          'IndexedDB callbacks are macrotasks — a pending transaction will not complete until the current JS finishes',
        ],
        cs: 'React\'s concurrent mode uses scheduler.postTask() and MessageChannel to yield control back to the browser between render work chunks — the same event loop principle applied to prevent long renders from blocking user input.',
      },
    },
    interview: {
      q: 'What is the output order of: console.log start, setTimeout(fn, 0), Promise.resolve().then(fn), console.log end? Why does Promise run before setTimeout?',
      a: 'Output: start, end, Promise callback, setTimeout callback. Synchronous code runs first (start, end). Then the microtask queue drains — Promise.resolve().then() was queued as a microtask. Only after the microtask queue is empty does the event loop pick the next macrotask (setTimeout). setTimeout(fn, 0) schedules a macrotask — it runs after all pending microtasks, even if the delay is 0ms. The event loop rule: after each task, drain all microtasks before moving to the next task.',
      fu: [
        'What happens if a Promise.then callback itself schedules another Promise? When does it run?',
        'How does async/await relate to the microtask queue?',
        'What is the difference between queueMicrotask and Promise.resolve().then?',
        'How do you prevent blocking the event loop with heavy computation?',
      ],
    },
  },

  // ─── CLOSURES & LEXICAL SCOPE ─────────────────────────────────────────────

  {
    id: 'js-closures',
    cat: 'javascript',
    color: '#f7df1e',
    icon: '🔒',
    title: 'Closures & Lexical Scope',
    tag: 'A closure is a function that remembers its lexical scope even when called outside it',
    overview:
      'A closure is created when a function is defined inside another function and the inner function references variables from the outer function\'s scope. Even after the outer function has returned, the inner function retains a live reference to those variables — they are not garbage collected. Lexical scope means the scope of a variable is determined by where it is written in the source code, not where it is called from. Every function in JavaScript creates a new scope. Closures are the foundation of: data encapsulation, factory functions, memoization, event listener cleanup, and the module pattern.',
    components: [
      {
        name: 'Scope Chain',
        icon: '⛓️',
        role: 'How JavaScript resolves variable names — inside out.',
        detail:
          'When a variable is accessed, JavaScript first checks the local scope, then the enclosing function scope, then the next enclosing scope, and so on up to the global scope. This chain of scopes is the scope chain. Closures work by capturing a reference to the outer scope — not a snapshot of the values, but a live reference to the scope itself.',
      },
      {
        name: 'IIFE (Immediately Invoked Function Expression)',
        icon: '🏃',
        role: 'Create a private scope immediately — used before ES modules.',
        detail:
          'An IIFE is a function that is defined and called immediately: (function() { ... })(). It creates a new scope, preventing variable leakage to the global scope. IIFEs were the standard way to create private scope before ES modules and let/const. Still useful for wrapping initialization code that should not pollute the module scope.',
      },
      {
        name: 'var-in-loop Bug',
        icon: '🐛',
        role: 'Classic closure pitfall — all callbacks share the same var.',
        detail:
          'When using var inside a for loop, there is only one variable shared across all iterations — var is function-scoped, not block-scoped. Closures created in the loop all capture the same variable, which has the final loop value by the time the callbacks execute. Fix with let (block-scoped, one per iteration) or a factory function wrapping each callback.',
      },
    ],
    a: {
      v: 'Backpack from a camping trip',
      t: 'Imagine packing a backpack at a campsite (outer function). You take the backpack home (inner function returned). The campsite is gone (outer function finished), but everything you packed (closed-over variables) is still in the backpack and accessible. The backpack "closes over" the items from the campsite.',
      tx: 'The function is the backpack. The outer scope is the campsite. Closed-over variables are items you packed. Even though the campsite no longer exists in memory, the items you brought back are still live references — if the campsite had a mutable ledger, your backpack references it and both see updates.',
      s: 'A React useState setter function is a closure — it captures the component\'s state slot and knows which state to update even when called from an event handler defined elsewhere. The handler closes over the setter from when the component rendered.',
    },
    te: {
      def: 'A closure is a function paired with its lexical environment — the scope chain that was active when the function was defined. Closed-over variables are live references, not copies, and persist as long as any closure referencing them is reachable.',
      types: [
        {
          n: 'Data Encapsulation',
          d: 'Closures create private state that is inaccessible from outside — the foundation of the module pattern and factory functions.',
        },
        {
          n: 'Partial Application / Currying',
          d: 'A function that returns a function, pre-loading some arguments via closure — enables reusable, composable behavior.',
        },
        {
          n: 'Event Listener Cleanup',
          d: 'Closures that capture a reference to DOM elements or timers, then clean up in a returned teardown function (React useEffect return).',
        },
      ],
      when: 'Use closures for: factory functions that create configured instances, memoization caches, maintaining state without classes, the module pattern (encapsulating private state), and partial application. Be aware of closures in loops (var bug) and long-lived closures that hold large objects in memory.',
      trade:
        'Closures hold a reference to the entire outer scope — if the outer scope contains large objects, they cannot be garbage collected while any closure referencing them is alive. This is a common source of memory leaks in long-lived event listeners. Solution: nullify references or remove event listeners when done.',
      code: `// ── Counter factory — closure for private state ───────────────────────────────

function makeCounter(start = 0) {
  let count = start;            // private — not accessible from outside
  return {
    increment() { count++; },
    decrement() { count--; },
    value() { return count; },
  };
}
const counter = makeCounter(10);
counter.increment();
counter.increment();
console.log(counter.value());  // 12
console.log(counter.count);    // undefined — private!

// ── var-in-loop bug vs fix with let ──────────────────────────────────────────

// BUG: var is function-scoped — all callbacks share the same 'i'
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log('var i:', i), 0);
}
// Prints: 3, 3, 3  (not 0, 1, 2)
// Why: by the time setTimeout fires, the loop is done and i === 3

// FIX 1: use let — block-scoped, one new 'i' per iteration
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log('let i:', i), 0);
}
// Prints: 0, 1, 2

// FIX 2: IIFE to capture current value (pre-ES6 pattern)
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => console.log('IIFE j:', j), 0);
  })(i);
}
// Prints: 0, 1, 2

// ── Module pattern: private state via closure ────────────────────────────────

const bankAccount = (function() {
  let balance = 0;             // private — closure over IIFE scope
  const history = [];

  return {
    deposit(amount) {
      balance += amount;
      history.push('+' + amount);
    },
    withdraw(amount) {
      if (amount > balance) throw new Error('Insufficient funds');
      balance -= amount;
      history.push('-' + amount);
    },
    getBalance() { return balance; },
    getHistory() { return [...history]; },  // return copy — history is private
  };
})();

bankAccount.deposit(100);
bankAccount.withdraw(30);
console.log(bankAccount.getBalance()); // 70
console.log(bankAccount.balance);      // undefined — truly private`,
      rw: {
        ex: [
          'React useCallback returns a memoized callback that closes over dependencies — the deps array controls when a new closure is created',
          'Express middleware chain: each middleware closes over the request lifecycle, allowing earlier middleware to set state later ones read',
          'Memoize functions use a closure over a cache Map — each memoized function has its own private cache',
          'setTimeout in React event handlers captures stale state if dependencies are not correctly listed — a classic closure staleness bug',
        ],
        cs: 'Redux reducers are pure functions, but Redux middleware (like redux-thunk) relies on closures — the thunk middleware closes over the store\'s dispatch and getState, making them available to async action creators without passing them explicitly.',
      },
    },
    interview: {
      q: 'What is a closure? What is the classic var-in-loop bug and how do you fix it? What is a practical use case for closures?',
      a: 'A closure is a function that retains access to its lexical scope even after the outer function has returned. The function and its surrounding scope form a "closed" unit. The var-in-loop bug: var is function-scoped, so all loop iterations share the same variable. By the time async callbacks (setTimeout, event listeners) execute, the loop is done and the variable holds its final value — all callbacks log the same number. Fix with let (creates a new binding per iteration) or an IIFE that captures the current value. Practical use case: factory functions that return objects with private state. A makeCounter() function returns increment/decrement/value methods that all close over the same private count variable, which is inaccessible from outside.',
      fu: [
        'How can closures cause memory leaks? How do you fix them?',
        'What is the difference between a closure and a scope?',
        'How does React useCallback use closures? What is a stale closure?',
        'How does the module pattern use closures to simulate private methods?',
      ],
    },
  },

  // ─── PROMISES & ASYNC/AWAIT ───────────────────────────────────────────────

  {
    id: 'js-async',
    cat: 'javascript',
    color: '#f7df1e',
    icon: '⏳',
    title: 'Promises & Async/Await',
    tag: 'From callback hell to async/await — how JavaScript handles asynchronous operations',
    overview:
      'JavaScript handles asynchronous operations through a progression of patterns: callbacks (pass a function to call when done), Promises (a chainable object representing a future value), and async/await (syntactic sugar over Promises that reads like synchronous code). Promises have three states: pending (operation in-progress), fulfilled (succeeded with a value), or rejected (failed with a reason). Once settled, a Promise cannot change state. Promise.all runs multiple Promises in parallel and waits for all to complete. Promise.allSettled waits for all regardless of success/failure. Promise.race resolves with the first to settle.',
    components: [
      {
        name: 'Promise States',
        icon: '🔮',
        role: 'Pending, fulfilled, or rejected — immutable once settled.',
        detail:
          'A Promise starts in the pending state. It transitions to fulfilled (with a value) when the async operation succeeds, or rejected (with a reason/error) when it fails. State transitions are one-way and permanent — you cannot un-reject or un-fulfill a Promise. Handlers registered after settlement still run (Promises are not one-shot event emitters).',
      },
      {
        name: 'Promise Chaining',
        icon: '🔗',
        role: 'Compose async operations without nesting.',
        detail:
          '.then() returns a new Promise, enabling flat chaining instead of nested callbacks. If a .then() handler returns a value, the next .then() receives it. If it returns a Promise, the chain waits for that Promise to settle. .catch() is shorthand for .then(undefined, onRejected) and catches any rejection in the chain above it.',
      },
      {
        name: 'async/await',
        icon: '⏸️',
        role: 'Write async code that reads synchronously.',
        detail:
          'An async function always returns a Promise. Inside it, await pauses execution until the awaited Promise settles, then resumes with the resolved value. If the Promise rejects, await throws, which can be caught with try/catch. Under the hood, each await is a microtask queue yield point — the function resumes as a microtask continuation when the awaited Promise settles.',
      },
      {
        name: 'Promise combinators',
        icon: '🧩',
        role: 'Coordinate multiple Promises running in parallel.',
        detail:
          'Promise.all([p1, p2, p3]) — fulfills when all fulfill, rejects immediately if any rejects. Promise.allSettled([p1, p2, p3]) — always fulfills with an array of result objects ({status, value/reason}), never rejects. Promise.race([p1, p2]) — settles with the first Promise to settle, fulfilled or rejected. Promise.any([p1, p2]) — fulfills with the first to fulfill, rejects only if all reject.',
      },
    ],
    a: {
      v: 'Restaurant order ticket',
      t: 'A Promise is like an order ticket at a restaurant. When you order, the ticket (Promise) is created in "pending" state. When food is ready, the ticket is "fulfilled" with the dish. If the kitchen runs out of ingredients, the ticket is "rejected" with an explanation. async/await is like a waiter who politely waits at your table (pauses the function) until the kitchen is ready, then brings the food (resumes with the value).',
      tx: 'The ticket can only transition once — fulfilled or rejected, never back to pending. .then() is like a conveyor belt: each step processes what the previous step produced. Promise.all is ordering food for the whole table and waiting until everyone\'s meal arrives before eating.',
      s: 'In your data fetching code, "const [users, orders] = await Promise.all([fetchUsers(), fetchOrders()])" fires both requests simultaneously. If you awaited them sequentially, the total time would be their sum; in parallel it is just the max of the two.',
    },
    te: {
      def: 'A Promise is a proxy for an eventual value. Promises chain with .then()/.catch(), compose with combinators (all, allSettled, race, any), and integrate with async/await syntax for sequential async logic. All Promise callbacks run as microtasks.',
      types: [
        {
          n: 'Promise.all',
          d: 'All must succeed. Rejects fast on first failure. Use for parallel operations where all results are required.',
        },
        {
          n: 'Promise.allSettled',
          d: 'Waits for all regardless of outcome. Returns results with status. Use when you need all results even if some fail.',
        },
        {
          n: 'Promise.race / Promise.any',
          d: 'race: first to settle wins (including rejection). any: first to fulfill wins, rejects only if all reject. Use for timeouts and fallbacks.',
        },
      ],
      when: 'Use async/await for sequential async logic (readability). Use Promise.all for parallel independent operations (performance). Use Promise.allSettled when partial failure is acceptable. Use Promise.race to implement timeouts. Always handle rejections — unhandled Promise rejections crash Node.js processes.',
      trade:
        'async/await makes error handling natural (try/catch) but makes parallel execution less obvious — forgetting to use Promise.all and sequentially awaiting makes code slower. Promise chains can swallow errors silently if .catch() is missing. Always end chains with .catch() or use try/catch with async/await.',
      code: `// ── Callback hell → Promise chain → async/await refactor ─────────────────────

// CALLBACK HELL: deeply nested, error handling at every level
function getUser(id, callback) {
  fetchUser(id, (err, user) => {
    if (err) return callback(err);
    fetchOrders(user.id, (err, orders) => {
      if (err) return callback(err);
      fetchProducts(orders[0].id, (err, products) => {
        if (err) return callback(err);
        callback(null, products);
      });
    });
  });
}

// PROMISE CHAIN: flat, but still verbose
function getUserPromise(id) {
  return fetchUser(id)
    .then(user => fetchOrders(user.id))
    .then(orders => fetchProducts(orders[0].id))
    .catch(err => { console.error(err); throw err; });
}

// ASYNC/AWAIT: reads like synchronous code
async function getUserAsync(id) {
  try {
    const user = await fetchUser(id);
    const orders = await fetchOrders(user.id);
    const products = await fetchProducts(orders[0].id);
    return products;
  } catch (err) {
    console.error('Failed to fetch user data:', err);
    throw err;
  }
}

// ── Parallel requests with Promise.all ───────────────────────────────────────

async function getDashboard(userId) {
  // Sequential: slow — total time = sum of all requests
  // const user = await fetchUser(userId);
  // const posts = await fetchPosts(userId);
  // const friends = await fetchFriends(userId);

  // Parallel: fast — total time = slowest request
  const [user, posts, friends] = await Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
    fetchFriends(userId),
  ]);
  return { user, posts, friends };
}

// ── Promise.allSettled: partial failure is OK ─────────────────────────────────

async function loadWidgets(widgetIds) {
  const results = await Promise.allSettled(widgetIds.map(id => fetchWidget(id)));
  return results.map(result => {
    if (result.status === 'fulfilled') return result.value;
    console.warn('Widget failed to load:', result.reason);
    return null;
  });
}

// ── Timeout with Promise.race ─────────────────────────────────────────────────

function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out after ' + ms + 'ms')), ms)
  );
  return Promise.race([promise, timeout]);
}
const result = await withTimeout(fetchData(), 5000);`,
      rw: {
        ex: [
          'fetch() returns a Promise — always handle both .json() (another Promise) and network errors in a single try/catch',
          'React Query wraps async functions and manages loading/error/success states using Promise lifecycle',
          'Node.js fs.promises exposes the file system API as Promises — enabling clean async/await file operations',
          'Express does not catch async errors by default — wrap async route handlers or use express-async-errors to propagate rejections',
        ],
        cs: 'Stripe\'s checkout flow uses Promise.all to pre-fetch payment methods and customer data in parallel on page load — cutting the checkout initiation time by running independent API calls simultaneously instead of sequentially.',
      },
    },
    interview: {
      q: 'What are the three states of a Promise? What is the difference between Promise.all and Promise.allSettled? What is the difference between sequential awaits and Promise.all?',
      a: 'Promise states: pending (operation running), fulfilled (succeeded with a value), rejected (failed with a reason). Once settled, state is permanent. Promise.all vs Promise.allSettled: Promise.all rejects immediately when any Promise rejects — you get the first error but lose the other results. Promise.allSettled always waits for all Promises and returns an array of {status: "fulfilled", value} or {status: "rejected", reason} objects — use it when you need all results even if some fail. Sequential awaits vs Promise.all: sequential awaits run one after another — total time is the sum of all durations. Promise.all fires all Promises simultaneously — total time is the duration of the slowest. For independent operations, always use Promise.all to avoid unnecessary serialization.',
      fu: [
        'What happens if you do not catch a rejected Promise in Node.js?',
        'How does async/await work under the hood — what does it compile to?',
        'What is Promise.any and how is it different from Promise.race?',
        'How do you cancel a Promise or an async operation in JavaScript?',
      ],
    },
  },

  // ─── PROTOTYPAL INHERITANCE ───────────────────────────────────────────────

  {
    id: 'js-prototypes',
    cat: 'javascript',
    color: '#f7df1e',
    icon: '🧬',
    title: 'Prototypal Inheritance',
    tag: 'JavaScript inheritance is prototype-based — classes are syntactic sugar over prototype chains',
    overview:
      'JavaScript uses prototypal inheritance — every object has an internal [[Prototype]] link (exposed as __proto__) pointing to another object. Property lookups walk the prototype chain: if a property is not found on the object, the engine checks its prototype, then its prototype\'s prototype, and so on until null is reached. The class syntax introduced in ES6 is purely syntactic sugar — it compiles to the same prototype chain mechanics. Object.create(proto) creates a new object with a specified prototype. Constructor functions called with new also set up prototype chains. instanceof checks if a constructor\'s prototype property appears anywhere in an object\'s prototype chain.',
    components: [
      {
        name: 'Prototype Chain',
        icon: '⛓️',
        role: 'The linked chain of objects searched during property lookup.',
        detail:
          'Every object has a hidden [[Prototype]] reference. When you access obj.method, JavaScript first checks obj itself, then obj.__proto__, then obj.__proto__.__proto__, until the property is found or null is reached (throwing TypeError). This chain is set up at object creation time and can be inspected via Object.getPrototypeOf(obj).',
      },
      {
        name: 'Object.create()',
        icon: '🏗️',
        role: 'Create an object with an explicit prototype.',
        detail:
          'Object.create(proto) returns a new object whose [[Prototype]] is proto. This is the fundamental prototype chain building tool. Object.create(null) creates an object with no prototype — useful for pure dictionaries with no inherited properties like toString or hasOwnProperty.',
      },
      {
        name: 'Constructor Functions & new',
        icon: '🔨',
        role: 'Pre-class way to create objects sharing a prototype.',
        detail:
          'When called with new, a constructor function: creates a new empty object, sets its [[Prototype]] to ConstructorFn.prototype, sets this to the new object, executes the function body, and returns the new object. Shared methods on ConstructorFn.prototype are shared across all instances — they are not copied to each object.',
      },
      {
        name: 'class syntax',
        icon: '🎭',
        role: 'Syntactic sugar — compiles to the same prototype chain.',
        detail:
          'class Foo extends Bar {} is equivalent to setting up Foo.prototype with Bar.prototype as its prototype. Methods defined in the class body are added to the prototype, not to each instance. The extends keyword handles both instance prototype chaining and static method inheritance. super() calls the parent constructor to set up inherited instance properties.',
      },
    ],
    a: {
      v: 'Family recipe book',
      t: 'Think of the prototype chain as a family recipe book. When you need a recipe, you first check your own cookbook. If it is not there, you check your parent\'s cookbook, then your grandparent\'s, and so on up the family line. Each family member can override a recipe (shadow the property) or add new ones without affecting the originals.',
      tx: 'Overriding a method on an instance shadows the prototype method — like writing in your own cookbook. The prototype method still exists and is unchanged for other instances. delete obj.method will reveal the inherited prototype method again — like removing your own copy.',
      s: 'In your JavaScript library, putting shared methods on the prototype means 1000 instances share one copy of each method in memory, rather than 1000 * methods copies. This is why class methods should be on the class body (prototype), not defined with arrow functions in the constructor (which creates a new function per instance).',
    },
    te: {
      def: 'JavaScript uses prototype-based inheritance — objects have a [[Prototype]] chain that is traversed during property lookup. The class syntax is syntactic sugar that sets up the same prototype relationships using more familiar OOP syntax.',
      types: [
        {
          n: 'Prototype Chain',
          d: 'Linked [[Prototype]] objects traversed during property lookup. Ends at Object.prototype (which has null as prototype).',
        },
        {
          n: 'Object.create()',
          d: 'Creates objects with explicit prototype — the most direct way to set up prototype chains without constructor functions.',
        },
        {
          n: 'class/extends',
          d: 'Syntactic sugar over prototype chaining. Compiles to constructor functions with prototype property wiring. Same runtime behavior.',
        },
      ],
      when: 'Understanding prototypes matters when: debugging inherited property issues, using Object.create for efficient object patterns, understanding why class methods are shared (prototype) vs instance arrow functions (not shared), and using instanceof correctly. Prefer class syntax for new code — it is clearer and handles edge cases better.',
      trade:
        'Prototype chains enable efficient memory sharing — methods on the prototype are shared by all instances. The cost is dynamic lookups at runtime and potential confusion when properties are mutated on the prototype (affecting all instances). Classes provide clearer syntax but hide the prototype model — engineers should understand both.',
      code: `// ── Prototype chain manually ──────────────────────────────────────────────────

const animal = {
  breathe() { return this.name + ' breathes'; },
};

const dog = Object.create(animal);   // dog.__proto__ === animal
dog.name = 'Rex';
dog.bark = function() { return 'Woof!'; };

console.log(dog.bark());             // 'Woof!'     — own property
console.log(dog.breathe());          // 'Rex breathes' — found on prototype
console.log(dog.hasOwnProperty('bark'));    // true
console.log(dog.hasOwnProperty('breathe')); // false — inherited

// Prototype chain: dog -> animal -> Object.prototype -> null
console.log(Object.getPrototypeOf(dog) === animal); // true

// ── Same thing with class syntax ──────────────────────────────────────────────

class Animal {
  constructor(name) { this.name = name; }
  breathe() { return this.name + ' breathes'; }  // on Animal.prototype
}

class Dog extends Animal {
  bark() { return 'Woof!'; }                      // on Dog.prototype
}

const rex = new Dog('Rex');
console.log(rex.breathe());          // 'Rex breathes' — inherited from Animal.prototype
console.log(rex instanceof Dog);     // true
console.log(rex instanceof Animal);  // true — chain includes Animal.prototype

// They are equivalent — class compiles to the same prototype chain:
console.log(Object.getPrototypeOf(Dog.prototype) === Animal.prototype); // true

// ── instanceof walks the chain ────────────────────────────────────────────────

console.log(rex instanceof Dog);      // true: Dog.prototype in chain
console.log(rex instanceof Animal);   // true: Animal.prototype in chain
console.log(rex instanceof Object);   // true: Object.prototype in chain

// ── Arrow functions in constructors — not shared! ────────────────────────────

class Counter {
  constructor() {
    this.count = 0;
    // BAD: new function created per instance — wastes memory
    this.badIncrement = () => { this.count++; };
  }
  // GOOD: on prototype — shared by all instances
  increment() { this.count++; }
}`,
      rw: {
        ex: [
          'Array.prototype.map, .filter, .reduce — all instances of Array share these methods via the prototype chain',
          'React class components extend React.Component — lifecycle methods (componentDidMount) are inherited via the prototype chain',
          'Mongoose models inherit query methods (find, save, validate) through prototype chain from Model.prototype',
          'Object.prototype.toString.call(value) is used to reliably detect types — it walks up to Object.prototype to call toString',
        ],
        cs: 'V8 engine uses "hidden classes" (called shapes internally) to optimize prototype chain lookups — when objects have the same structure, V8 compiles optimized machine code for property access. Adding properties in different orders in constructors creates different hidden classes and deoptimizes property access — a key V8 performance pattern.',
      },
    },
    interview: {
      q: 'How does JavaScript prototype chain work? How is class syntax related to prototypes? What does instanceof check?',
      a: 'Every JavaScript object has an internal [[Prototype]] reference to another object (or null). When you access a property, JavaScript checks the object itself first, then walks the [[Prototype]] chain until the property is found or null is reached. class syntax is syntactic sugar — it compiles to constructor functions with prototype wiring. "class Dog extends Animal" sets Dog.prototype.__proto__ = Animal.prototype and super() calls Animal\'s constructor. Methods in the class body are placed on the prototype, not on each instance. instanceof checks whether a constructor\'s .prototype property appears anywhere in the object\'s prototype chain — rex instanceof Animal returns true because Animal.prototype is in rex\'s chain, even though rex was created with new Dog.',
      fu: [
        'What is the difference between __proto__ and prototype?',
        'Why are class methods more memory-efficient than arrow functions in constructors?',
        'What does Object.create(null) do and when would you use it?',
        'How does super() work in a subclass constructor?',
      ],
    },
  },

  // ─── THE THIS KEYWORD ─────────────────────────────────────────────────────

  {
    id: 'js-this',
    cat: 'javascript',
    color: '#f7df1e',
    icon: '👉',
    title: 'The this Keyword',
    tag: 'The value of this is determined at call time, not definition time — except for arrow functions',
    overview:
      'this is a special keyword whose value is determined by how a function is called, not where it is defined (with one exception: arrow functions). There are four binding rules in order of precedence: new binding (called with new — this is the new object), explicit binding (called with call/apply/bind — this is the specified object), implicit binding (called as a method on an object — this is that object), and default binding (called as a plain function — this is undefined in strict mode, global object otherwise). Arrow functions do not have their own this — they lexically inherit this from the enclosing scope at definition time.',
    components: [
      {
        name: 'Default Binding',
        icon: '🌐',
        role: 'Plain function call — this is undefined (strict) or global.',
        detail:
          'A function called without any context (fn()) uses default binding. In strict mode ("use strict"), this is undefined. In non-strict mode, this is the global object (window in browsers, global in Node.js). This is the most common source of accidental this bugs — forgetting that extracting a method from an object loses its implicit binding.',
      },
      {
        name: 'Implicit Binding',
        icon: '🔗',
        role: 'Method call — this is the object before the dot.',
        detail:
          'When a function is called as a property of an object (obj.fn()), this is bound to that object. The binding is determined by the call site, not the definition. If you copy the method to another variable and call it without the object, implicit binding is lost — a classic bug.',
      },
      {
        name: 'Explicit Binding',
        icon: '📌',
        role: 'call/apply/bind — this is explicitly specified.',
        detail:
          'call(thisArg, ...args) and apply(thisArg, argsArray) call the function immediately with a specific this. bind(thisArg) returns a new function permanently bound to thisArg — calling it again with call/apply cannot override the binding. bind is useful for creating stable callbacks that always run with the correct this.',
      },
      {
        name: 'new Binding',
        icon: '🏗️',
        role: 'Constructor call — this is the newly created object.',
        detail:
          'When a function is called with new, JavaScript creates a new empty object, sets this to it, runs the constructor body, and returns the new object. new binding has the highest precedence — it overrides even explicit binding.',
      },
      {
        name: 'Arrow Function Lexical this',
        icon: '➡️',
        role: 'Arrow functions inherit this from enclosing scope — no own this.',
        detail:
          'Arrow functions do not have their own this binding. They capture this from the lexical scope where they are defined (not called). This makes them ideal for callbacks and nested functions that need to preserve the outer this. However, using arrow functions as object methods is wrong — they capture this from the outer scope (often undefined), not the object.',
      },
    ],
    a: {
      v: 'Name badge at a conference',
      t: 'Think of this as a name badge that says "I represent [company]". When you speak as a company representative (implicit binding — called on the object), the badge says your company. If you leave the company and speak alone (default binding — plain function call), the badge is blank. You can also guest-badge someone else (explicit binding — call/apply/bind). Arrow functions never get a badge of their own — they borrow whoever is badged around them.',
      tx: 'The badge value is determined at call time. The same speech (function body) can be delivered by different companies (different this values) depending on who calls it. Arrow functions permanently inherit the badge of the room they were created in — it cannot be changed.',
      s: 'In your React class component, "this.handleClick = this.handleClick.bind(this)" in the constructor creates a bound function — when the button fires the event listener, this correctly refers to the component instance even though the call site (the browser event system) has no component context.',
    },
    te: {
      def: 'this is a runtime binding whose value depends on the call site. Four rules determine it in precedence order: new > explicit (call/apply/bind) > implicit (obj.fn()) > default (plain fn()). Arrow functions are the exception — they lexically capture this from their surrounding scope.',
      types: [
        {
          n: 'Default Binding',
          d: 'Plain function call. undefined in strict mode, global object otherwise. Lowest precedence.',
        },
        {
          n: 'Implicit Binding',
          d: 'Method call on an object (obj.fn()). this is the object. Lost when method is extracted to a variable.',
        },
        {
          n: 'Explicit Binding',
          d: 'call/apply/bind. Overrides implicit. bind() creates a permanently bound function.',
        },
        {
          n: 'new Binding',
          d: 'Constructor call with new. this is the newly created instance. Highest precedence.',
        },
      ],
      when: 'Know this rules when: debugging "undefined is not an object" errors (lost implicit binding), writing event listener callbacks (need bind or arrow function), using setTimeout with methods (default binding — use arrow or bind), and writing constructors with new.',
      trade:
        'Dynamic this is powerful (the same function works as a method on many objects) but confusing (the same function behaves differently at different call sites). Arrow functions solve the callback this problem but introduce a new one — they are wrong as object methods. TypeScript\'s strict mode and the "this" parameter annotation help catch these bugs at compile time.',
      code: `// ── Rule 1: Default binding ───────────────────────────────────────────────────

function greet() {
  console.log('Hello from', this);
}
greet(); // undefined (strict) or global (sloppy) — no object context

// ── Rule 2: Implicit binding ──────────────────────────────────────────────────

const user = {
  name: 'Alice',
  greet() { console.log('Hello from', this.name); },
};
user.greet();        // 'Hello from Alice' — this is user

const fn = user.greet;
fn();                // 'Hello from undefined' — implicit binding LOST!

// ── Rule 3: Explicit binding ──────────────────────────────────────────────────

function introduce(greeting) {
  console.log(greeting + ', I am ' + this.name);
}
const bob = { name: 'Bob' };

introduce.call(bob, 'Hi');       // 'Hi, I am Bob' — call: immediate, spread args
introduce.apply(bob, ['Hey']);   // 'Hey, I am Bob' — apply: immediate, array args

const boundFn = introduce.bind(bob); // bind: returns new function, not called yet
boundFn('Hello');                // 'Hello, I am Bob' — binding is permanent

// ── Rule 4: new binding ───────────────────────────────────────────────────────

function Person(name) {
  this.name = name;              // this is the new object
}
const alice = new Person('Alice');
console.log(alice.name);         // 'Alice'

// ── Arrow function: lexical this ──────────────────────────────────────────────

const timer = {
  seconds: 0,
  // WRONG: arrow function as method — 'this' is NOT the timer object
  badStart: () => {
    setInterval(() => console.log(this.seconds), 1000); // 'this' is outer scope (undefined/global)
  },
  // CORRECT: regular function as method — 'this' IS the timer object
  start() {
    setInterval(() => {
      this.seconds++;           // arrow function inherits 'this' from start()
      console.log(this.seconds);
    }, 1000);
  },
};
timer.start();                   // correctly increments timer.seconds

// ── bind() for stable event listener callbacks ────────────────────────────────

class Button {
  constructor(label) {
    this.label = label;
    // Without bind, 'this' inside handleClick would be the DOM element
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    console.log('Clicked:', this.label); // 'this' is the Button instance
  }
  mount(element) {
    element.addEventListener('click', this.handleClick);
  }
}`,
      rw: {
        ex: [
          'React class components require binding or arrow class fields for event handlers — without it, this inside the handler is undefined',
          'Array.prototype.forEach accepts a thisArg second argument — forEach(fn, thisArg) binds this for each callback call',
          'Mocha test framework sets this to the test context object — arrow function test callbacks lose access to this.timeout()',
          'Vue 2 options API relies heavily on implicit binding — methods defined in the "methods" option have this bound to the Vue instance',
        ],
        cs: 'React Hooks (useCallback, useEffect) were designed partly to avoid the class component this binding problem. In function components, there is no this — closures capture the exact values from the render, eliminating an entire category of this-related bugs that plagued class components.',
      },
    },
    interview: {
      q: 'What are the four rules for determining this? What does bind() return? Why should you not use arrow functions as object methods?',
      a: 'Four rules in precedence order: (1) new binding — called with new, this is the new object. (2) Explicit binding — called with call/apply/bind, this is the specified value. (3) Implicit binding — called as a method (obj.fn()), this is the object before the dot. (4) Default binding — plain function call, this is undefined (strict) or global. bind(thisArg) returns a new function permanently bound to thisArg — calling the returned function with call or apply cannot override the binding. Arrow functions as object methods are wrong because arrow functions capture this lexically from where they are defined, not from the call site. For an object literal, the surrounding scope is usually the module or global scope, not the object — so this.property fails. Regular methods correctly receive the object as this via implicit binding when called as obj.method().',
      fu: [
        'What is the precedence order of the four this binding rules?',
        'How does this behave inside a setTimeout callback? How do you fix it?',
        'What is the difference between call and apply?',
        'How does React handle this in class components vs function components?',
      ],
    },
  },
];

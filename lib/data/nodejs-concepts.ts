import { Concept } from '../types';

export const NODEJS_CONCEPTS: Concept[] = [
  // ─── NODE.JS EVENT LOOP ──────────────────────────────────────────────────────

  {
    id: 'node-event-loop',
    cat: 'nodejs',
    color: '#68a063',
    icon: '🔄',
    title: 'Node.js Event Loop Phases',
    tag: 'Node.js event loop has 6 phases — understanding them is key to async ordering',
    overview:
      'The Node.js event loop is powered by libuv, a C library that handles asynchronous I/O. It runs in a continuous cycle through 6 phases: timers (executes setTimeout/setInterval callbacks whose delay has elapsed), pending callbacks (I/O callbacks deferred to next iteration), idle/prepare (internal use), poll (retrieves new I/O events and executes their callbacks — this is where Node spends most of its time), check (executes setImmediate callbacks), and close callbacks (fires close events like socket.on("close")). Between each phase, Node.js drains two microtask queues: process.nextTick callbacks first, then Promise microtasks. Understanding phase ordering is critical for debugging async race conditions and interview questions about execution order.',
    components: [
      {
        name: 'Timers Phase',
        icon: '⏱️',
        role: 'Executes setTimeout and setInterval callbacks.',
        detail:
          'Runs callbacks whose minimum delay threshold has been reached. The delay is a minimum guarantee, not a precise time — if the poll phase is busy, timers fire late. setTimeout(fn, 0) and setTimeout(fn, 1) behave identically at the OS level; both may fire after setImmediate in certain contexts.',
      },
      {
        name: 'Poll Phase',
        icon: '📡',
        role: 'Retrieves and executes I/O callbacks.',
        detail:
          'The poll phase fetches new I/O events from the OS and executes their callbacks. If no timers are scheduled and no setImmediate is queued, the poll phase will block here waiting for events — this is how Node.js stays alive without spinning the CPU. Once setImmediate is queued or a timer threshold is reached, Node.js moves on.',
      },
      {
        name: 'Check Phase (setImmediate)',
        icon: '✅',
        role: 'Executes setImmediate callbacks immediately after poll.',
        detail:
          'setImmediate callbacks always run in the check phase, immediately after the poll phase completes. This means inside an I/O callback, setImmediate always fires before setTimeout(fn, 0) because the event loop is already past the timers phase when the I/O callback executes.',
      },
      {
        name: 'process.nextTick',
        icon: '⚡',
        role: 'Runs after current operation, before the next event loop phase.',
        detail:
          'process.nextTick is not technically part of the event loop — it runs after the current operation completes and before the event loop moves to the next phase. It drains completely before any I/O, timers, or setImmediate callbacks. Recursive calls to process.nextTick can starve the event loop.',
      },
      {
        name: 'Promise Microtasks',
        icon: '🔮',
        role: 'Resolved promise callbacks run after nextTick queue.',
        detail:
          'Promise.resolve().then() callbacks are queued as microtasks and processed after the nextTick queue is drained. In Node.js v11+, microtasks run between each phase of the event loop, not just at the top. The order within microtasks: nextTick queue first, then Promise microtask queue.',
      },
    ],
    a: {
      v: 'Airport security checkpoint',
      t: 'Think of the event loop as an airport with dedicated security lanes. VIP (process.nextTick) always goes first. Business class (Promise microtasks) goes next. Then economy passengers board in order: timers, I/O callbacks, setImmediate. The checkpoint never sleeps — it keeps cycling through lanes looking for passengers.',
      tx: 'Each phase is a lane that drains completely before moving to the next. process.nextTick cuts to the front of every lane transition. This ordering is deterministic — knowing the rules lets you predict exactly when each async callback fires.',
      s: 'In your Node.js server, "await db.query()" releases the event loop to handle other requests during the poll phase. When the query resolves, the callback re-enters the queue — your server stays responsive because the event loop never blocks.',
    },
    te: {
      def: 'The Node.js event loop is a single-threaded loop powered by libuv that processes asynchronous callbacks in a defined phase order. It enables non-blocking I/O on a single thread by deferring callbacks until their associated operations complete.',
      types: [
        {
          n: 'Macro-task Queue',
          d: 'setTimeout, setInterval, setImmediate callbacks — processed one per event loop tick, interleaved with microtasks in Node.js v11+.',
        },
        {
          n: 'Microtask Queue',
          d: 'process.nextTick and Promise callbacks — drained completely after each operation and between each event loop phase.',
        },
        {
          n: 'I/O Poll Phase',
          d: 'The phase where Node.js blocks waiting for OS events when idle — the foundation of efficient async I/O without CPU spinning.',
        },
      ],
      when: 'Understanding event loop phases matters when: debugging unexpected async ordering, deciding between setImmediate vs process.nextTick, avoiding nextTick starvation in recursive code, and writing libraries that must not block the event loop.',
      trade:
        'Single-threaded event loop means CPU-intensive synchronous code blocks all I/O — a long synchronous computation prevents the server from handling other requests. The tradeoff is simplicity (no thread-safety concerns, no mutex locks) against CPU parallelism limitations (solved by worker_threads and cluster).',
      code: `// Execution order demonstration
console.log('1 - sync');

setTimeout(() => console.log('5 - setTimeout 0'), 0);

setImmediate(() => console.log('4 - setImmediate'));

Promise.resolve().then(() => console.log('3 - Promise microtask'));

process.nextTick(() => console.log('2 - nextTick'));

console.log('1b - sync end');
// Output order: 1, 1b, 2, 3, 4, 5

// ── setImmediate ALWAYS beats setTimeout inside I/O callback ─────────────────

const fs = require('fs');
fs.readFile(__filename, () => {
  // Inside I/O callback: loop is past timers phase, so check phase (setImmediate) runs first
  setTimeout(() => console.log('setTimeout'), 0);
  setImmediate(() => console.log('setImmediate - ALWAYS FIRST in I/O'));
});

// ── nextTick starvation danger ───────────────────────────────────────────────

function recursiveNextTick(count) {
  if (count === 0) return;
  process.nextTick(() => {
    console.log('nextTick ' + count);
    recursiveNextTick(count - 1); // DANGER: starves I/O and timers
  });
}
// Use setImmediate for recursive async to yield to the event loop:
function safeRecursive(count) {
  if (count === 0) return;
  setImmediate(() => {
    console.log('setImmediate ' + count);
    safeRecursive(count - 1); // yields after each iteration
  });
}

// ── async_hooks for tracking async context ───────────────────────────────────

const { createHook, executionAsyncId } = require('async_hooks');
const hook = createHook({
  init(asyncId, type, triggerAsyncId) {
    console.log('async op started: ' + type + ' asyncId=' + asyncId);
  },
  destroy(asyncId) {
    console.log('async op completed: asyncId=' + asyncId);
  },
});
hook.enable();
// Use AsyncLocalStorage (built on async_hooks) for request-scoped context
const { AsyncLocalStorage } = require('async_hooks');
const requestStore = new AsyncLocalStorage();
requestStore.run({ requestId: 'req-123' }, async () => {
  await someAsyncOperation();
  console.log(requestStore.getStore().requestId); // 'req-123' preserved across awaits
});`,
      rw: {
        ex: [
          'Express.js middleware runs synchronously in the current tick — never call a slow sync function inside middleware',
          'Node.js HTTP server uses the poll phase to wait for incoming connections — zero CPU when idle',
          'Redis client batches commands and flushes them in the poll phase — understanding this helps optimize command pipelining',
          'async_hooks (and AsyncLocalStorage) enables distributed tracing by preserving context across async boundaries in the event loop',
        ],
        cs: 'Cloudflare Workers uses a similar event loop model — a single JS context processes requests with async I/O. Understanding Node.js event loop phases directly maps to understanding why Workers performs at the edge with minimal overhead.',
      },
    },
    interview: {
      q: 'What is the order of: setTimeout(0), setImmediate, process.nextTick, and Promise.resolve()? When does setImmediate always run before setTimeout?',
      a: 'Outside any I/O callback, the execution order is: synchronous code → process.nextTick → Promise microtasks → setTimeout(0) → setImmediate (roughly — setTimeout vs setImmediate at the top level is non-deterministic due to OS timer resolution). Inside an I/O callback (e.g., inside fs.readFile), setImmediate ALWAYS runs before setTimeout(0) because by the time the I/O callback executes, the event loop has already passed the timers phase and will hit the check phase (setImmediate) before looping back to timers. process.nextTick and Promise microtasks always run before any macro-task, between every phase transition.',
      fu: [
        'What happens if you call process.nextTick recursively? How do you fix it?',
        'Why does setImmediate beat setTimeout inside an I/O callback?',
        'What is AsyncLocalStorage and how does it use the event loop?',
        'How does the event loop stay alive when there are no pending operations?',
      ],
    },
  },

  // ─── STREAMS & BACKPRESSURE ──────────────────────────────────────────────────

  {
    id: 'node-streams',
    cat: 'nodejs',
    color: '#68a063',
    icon: '🌊',
    title: 'Streams & Backpressure',
    tag: 'Streams process data chunk by chunk — critical for memory-efficient file and network I/O',
    overview:
      'Node.js streams are objects that let you read or write data piece by piece (chunk by chunk) rather than loading the entire dataset into memory. There are 4 types: Readable (source of data — fs.createReadStream, HTTP request body), Writable (destination — fs.createWriteStream, HTTP response), Duplex (both readable and writable — TCP sockets), and Transform (duplex that transforms data as it passes through — zlib compression, encryption). Streams implement the EventEmitter interface and expose a pipe() method for chaining. Backpressure is the mechanism that prevents a fast producer from overwhelming a slow consumer — when the writable buffer is full, the readable pauses automatically.',
    components: [
      {
        name: 'Readable Stream',
        icon: '📖',
        role: 'Source of data consumed in chunks.',
        detail:
          'Readable streams operate in two modes: flowing (data events fire automatically) and paused (you call read() manually). Pipe() and async iteration switch a stream to flowing mode. Key events: "data" (chunk received), "end" (no more data), "error" (something went wrong). Created via fs.createReadStream(), http.IncomingMessage, process.stdin, or by extending Readable.',
      },
      {
        name: 'Writable Stream',
        icon: '✍️',
        role: 'Destination that consumes data chunks.',
        detail:
          'Writable streams expose write(chunk) which returns false when the internal buffer is full (highWaterMark exceeded) — this is the backpressure signal. The "drain" event fires when the buffer has emptied and more data can be written. Key events: "drain", "finish" (all data flushed), "error". Created via fs.createWriteStream(), http.ServerResponse, process.stdout.',
      },
      {
        name: 'Transform Stream',
        icon: '🔄',
        role: 'Duplex stream that modifies data passing through.',
        detail:
          'Transform streams implement _transform(chunk, encoding, callback) where you process each chunk and push transformed output. Examples: zlib.createGzip() compresses chunks, crypto.createCipheriv() encrypts, custom transforms can parse CSV line by line. Transform streams are the building blocks of data processing pipelines.',
      },
      {
        name: 'pipe() and stream.pipeline()',
        icon: '🔗',
        role: 'Connect streams and handle backpressure automatically.',
        detail:
          'pipe() connects a readable to a writable and handles backpressure — it pauses the readable when the writable buffer is full. However, pipe() does not handle errors well. stream.pipeline() (Node 10+) is the modern replacement: it properly destroys all streams on error and accepts a callback or returns a Promise with stream.promises.pipeline().',
      },
      {
        name: 'Backpressure',
        icon: '🛑',
        role: 'Flow control preventing buffer overflow.',
        detail:
          'When writable.write() returns false, the readable should pause sending data. highWaterMark is the buffer size threshold (default 16KB for byte streams, 16 objects for object mode streams). Ignoring backpressure leads to unbounded memory growth — the readable keeps pushing data into the writable buffer until the process crashes.',
      },
      {
        name: 'highWaterMark',
        icon: '📏',
        role: 'Buffer size threshold that triggers backpressure.',
        detail:
          'highWaterMark is the soft limit on how many bytes (or objects in object mode) can accumulate in a stream buffer before backpressure kicks in. Setting it too high wastes memory; too low increases overhead from frequent pause/resume cycles. For file copying, 64KB is a common sweet spot.',
      },
    ],
    a: {
      v: 'Garden hose and bucket',
      t: 'Imagine filling buckets from a fire hose. If you fill faster than someone can carry buckets away, they overflow. Backpressure is the signal to turn down the hose — slow the source to match the consumer. Streams do this automatically so your server never runs out of memory.',
      tx: 'The fire hose is the Readable. The bucket carrier is the Writable. The "bucket full, slow down" signal is backpressure. pipe() is the mechanism that coordinates the flow rate between producer and consumer.',
      s: 'In your Node.js API, streaming a 10GB CSV export to a client means the server uses only ~64KB of memory at a time. Without streams, you would load 10GB into RAM, exhaust memory, and crash.',
    },
    te: {
      def: 'Node.js streams are an EventEmitter-based abstraction for processing data incrementally. They decouple production rate from consumption rate via backpressure, enabling memory-efficient processing of arbitrarily large datasets.',
      types: [
        {
          n: 'Readable Stream',
          d: 'Data source — file, HTTP request, database cursor. Emits chunks via "data" events or async iteration.',
        },
        {
          n: 'Writable Stream',
          d: 'Data sink — file, HTTP response, database insert. Signals backpressure via write() return value and "drain" event.',
        },
        {
          n: 'Transform Stream',
          d: 'Inline data processor — compression, encryption, parsing. Sits between readable and writable in a pipeline.',
        },
      ],
      when: 'Use streams for: reading/writing large files, HTTP request/response bodies, real-time data processing, inter-process data transfer, any operation where the dataset might exceed available RAM. Do not use streams for small in-memory transformations where the overhead outweighs the benefit.',
      trade:
        'Streams add complexity — error handling requires attaching listeners to every stream or using pipeline(). Debugging is harder because data flows through multiple stages. The payoff is constant memory usage regardless of dataset size and better throughput through parallelism (reading chunk N+1 while writing chunk N).',
      code: `const fs = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

// ── File processing: streams vs whole-file (memory comparison) ───────────────

// BAD: loads entire file into memory
async function badWay(filePath) {
  const data = await fs.promises.readFile(filePath); // could be GBs in RAM
  return data.toString().toUpperCase();
}

// GOOD: constant memory usage regardless of file size
async function goodWay(inputPath, outputPath) {
  await pipeline(
    fs.createReadStream(inputPath, { highWaterMark: 64 * 1024 }), // 64KB chunks
    new Transform({
      transform(chunk, encoding, callback) {
        callback(null, chunk.toString().toUpperCase());
      }
    }),
    fs.createWriteStream(outputPath),
  );
  // memory usage: ~64KB regardless of file size
}

// ── HTTP response as a stream ────────────────────────────────────────────────

const http = require('http');
http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  const fileStream = fs.createReadStream('./large-file.txt');
  fileStream.pipe(res); // backpressure handled automatically
}).listen(3000);

// ── Transform stream: compress data ─────────────────────────────────────────

async function compressFile(input, output) {
  await pipeline(
    fs.createReadStream(input),
    zlib.createGzip(),           // Transform stream: compress
    fs.createWriteStream(output),
  ); // pipeline() properly destroys all streams on error
}

// ── stream.pipeline() with error handling ────────────────────────────────────

const { pipeline: pipelineCallback } = require('stream');
pipelineCallback(
  fs.createReadStream('input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('output.gz'),
  (err) => {
    if (err) console.error('Pipeline failed:', err);
    else console.log('Pipeline succeeded');
    // All streams automatically destroyed on error
  }
);

// ── Async iteration over readable stream ─────────────────────────────────────

async function processLines(filePath) {
  const readable = fs.createReadStream(filePath, { encoding: 'utf8' });
  let buffer = '';
  for await (const chunk of readable) {
    buffer += chunk;
    const lines = buffer.split('\\n');
    buffer = lines.pop(); // incomplete last line
    for (const line of lines) {
      console.log('Line:', line);
    }
  }
}`,
      rw: {
        ex: [
          'Express body-parser streams request body chunks and assembles them — this is why req.body is populated asynchronously',
          'Node.js http.ServerResponse is a Writable stream — res.write() and res.end() feed chunks directly to the TCP socket',
          'Multer uses Busboy (a Transform stream) to parse multipart/form-data file uploads without writing to disk unnecessarily',
          'Bull/BullMQ uses Redis streams under the hood for job queues — the same backpressure concept applies at the queue level',
        ],
        cs: 'AWS S3 streaming uploads with the AWS SDK use streams to upload multi-GB files in 5MB parts without loading the entire file into memory — the SDK pipes a Readable stream through a Transform that splits it into parts and uploads each part in parallel.',
      },
    },
    interview: {
      q: 'What is backpressure in streams? Why use streams instead of reading the entire file into memory? What is the difference between pipe() and pipeline()?',
      a: 'Backpressure is the flow-control mechanism where a slow consumer signals a fast producer to slow down. In Node.js streams, when writable.write() returns false, it means the internal buffer has hit the highWaterMark threshold — the producer should pause sending data and wait for the "drain" event before resuming. Without backpressure, the writable buffer grows unboundedly and the process crashes with OOM. Streams vs whole-file: reading a large file fully into memory uses memory proportional to file size — a 4GB file requires 4GB of RAM. Streams use constant memory (size of the highWaterMark buffer) regardless of file size. pipe() vs pipeline(): pipe() connects streams and handles backpressure, but does NOT properly clean up streams on error — if an error occurs mid-pipe, the other streams are left open and you have resource leaks. pipeline() (from the "stream/promises" module in modern Node.js) properly destroys all streams in the pipeline on error and accepts a callback or Promise.',
      fu: [
        'What is highWaterMark and how do you choose the right value?',
        'How do you implement a custom Transform stream?',
        'What is object mode in streams and when would you use it?',
        'How does async iteration (for await...of) interact with streams?',
      ],
    },
  },

  // ─── CLUSTER & WORKER THREADS ────────────────────────────────────────────────

  {
    id: 'node-cluster',
    cat: 'nodejs',
    color: '#68a063',
    icon: '⚙️',
    title: 'Cluster & Worker Threads',
    tag: 'Node.js is single-threaded — cluster and worker_threads let you use multiple CPU cores',
    overview:
      'Node.js runs JavaScript on a single thread, meaning a default Node.js process can use only one CPU core. Two built-in modules address this: cluster spawns multiple Node.js processes (each with its own event loop and memory) that share a server port, distributing incoming connections across all CPU cores — ideal for scaling HTTP servers. worker_threads runs JavaScript in separate threads within the same process, sharing memory via SharedArrayBuffer and MessageChannel — ideal for CPU-intensive work that would otherwise block the event loop. child_process provides a third option: spawning any executable as a child process with IPC communication.',
    components: [
      {
        name: 'cluster module',
        icon: '🔀',
        role: 'Fork multiple Node.js processes sharing one server port.',
        detail:
          'The master process forks worker processes using cluster.fork(). The OS or Node.js distributes incoming connections to worker processes. Workers are independent processes with separate memory — a crash in one worker does not affect others. The master can restart crashed workers automatically. Best for scaling stateless HTTP servers across all CPU cores.',
      },
      {
        name: 'worker_threads',
        icon: '🧵',
        role: 'CPU-intensive work in separate threads within same process.',
        detail:
          'Worker threads share the same process memory space and can use SharedArrayBuffer for zero-copy data sharing. Communication uses postMessage/onmessage (similar to browser Web Workers). Unlike child processes, threads are lighter to spawn (~1ms vs ~30ms) and share memory. Use for CPU-bound tasks: image processing, encryption, compression, ML inference.',
      },
      {
        name: 'child_process',
        icon: '👶',
        role: 'Spawn arbitrary executables as child processes.',
        detail:
          'exec() runs a shell command and buffers output (good for simple scripts). spawn() streams output (good for long-running or large-output commands). fork() spawns a new Node.js process with an IPC channel for message passing. Use child_process when you need to run non-JavaScript code, shell commands, or completely isolated processes.',
      },
      {
        name: 'IPC (Inter-Process Communication)',
        icon: '📨',
        role: 'Message passing between master and worker processes.',
        detail:
          'In cluster, process.send(message) and process.on("message") enable the master to communicate with workers over a Unix socket or Windows named pipe. Workers can send stats, the master can broadcast config changes. IPC is slower than shared memory (worker_threads with SharedArrayBuffer) but safer — no race conditions.',
      },
      {
        name: 'SharedArrayBuffer',
        icon: '🧠',
        role: 'Share raw memory between worker threads.',
        detail:
          'SharedArrayBuffer allows multiple worker threads to read and write the same memory block. Atomics provides atomic operations (compare-and-swap, add) to prevent race conditions. Required COOP/COEP HTTP headers in browsers; in Node.js it works without headers. Use for high-performance data sharing (e.g., sharing a cache between workers without serialization overhead).',
      },
      {
        name: 'PM2',
        icon: '🚀',
        role: 'Production process manager with cluster mode.',
        detail:
          'PM2 wraps the cluster module and adds process monitoring, auto-restart on crash, log management, and zero-downtime reloads (pm2 reload). In cluster mode it spawns one worker per CPU core. pm2.config.js lets you configure instances, env vars, and memory limits declaratively. The de facto standard for running Node.js in production without Kubernetes.',
      },
    ],
    a: {
      v: 'Restaurant kitchen',
      t: 'One chef (single-threaded Node.js) can only cook one dish at a time. cluster is like hiring multiple chefs who each work independently at their own station but all serve the same dining room. worker_threads is like one chef having assistants who chop vegetables simultaneously — faster prep, one kitchen.',
      tx: 'cluster scales by duplication — separate processes, separate memory, separate event loops. worker_threads scales by parallelism — shared memory, separate threads, one process. The right tool depends on whether you are bottlenecked by I/O throughput (cluster) or CPU computation (worker_threads).',
      s: 'Your Express.js API is I/O bound (waiting on databases) — use cluster to handle more concurrent requests. Your image-processing endpoint is CPU bound — use worker_threads to offload compression without blocking the event loop.',
    },
    te: {
      def: 'Node.js overcomes single-thread limitations via cluster (multiple processes sharing a port) for I/O concurrency and worker_threads (multiple threads in one process) for CPU parallelism. child_process handles arbitrary subprocess management.',
      types: [
        {
          n: 'Cluster',
          d: 'Multiple Node.js processes, separate memory, shared port. Best for HTTP server scaling. Master restarts crashed workers.',
        },
        {
          n: 'Worker Threads',
          d: 'Multiple threads in one process, shared memory via SharedArrayBuffer. Best for CPU-intensive work that would block the event loop.',
        },
        {
          n: 'Child Process',
          d: 'Arbitrary child processes with IPC. Best for running shell commands, Python scripts, or completely isolated workloads.',
        },
      ],
      when: 'Use cluster for scaling stateless HTTP servers across cores. Use worker_threads for CPU-intensive operations (parsing, encryption, ML). Use child_process for shell commands or non-Node.js executables. Use PM2 cluster mode in production instead of rolling your own cluster management.',
      trade:
        'Cluster processes have independent memory — you cannot share in-memory cache between workers (use Redis). worker_threads share memory but require careful synchronization with Atomics. Both add complexity: health checks, graceful shutdown, shared state management, and debugging across processes/threads is harder than single-process debugging.',
      code: `const cluster = require('cluster');
const os = require('os');
const http = require('http');

// ── cluster.fork() HTTP server ───────────────────────────────────────────────

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log('Master PID: ' + process.pid + ', forking ' + numCPUs + ' workers');
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code) => {
    console.log('Worker ' + worker.process.pid + ' died, restarting...');
    cluster.fork(); // auto-restart crashed workers
  });
} else {
  http.createServer((req, res) => {
    res.end('Handled by worker PID: ' + process.pid);
  }).listen(3000);
  console.log('Worker ' + process.pid + ' started');
}

// ── worker_threads for CPU-intensive work (hashing) ─────────────────────────

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const crypto = require('crypto');

if (isMainThread) {
  function hashInWorker(data) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, { workerData: data });
      worker.on('message', resolve);
      worker.on('error', reject);
    });
  }
  // Does NOT block the event loop — other requests are handled while hashing
  hashInWorker('password123').then(hash => console.log('Hash:', hash));
} else {
  const hash = crypto.pbkdf2Sync(workerData, 'salt', 100000, 64, 'sha512');
  parentPort.postMessage(hash.toString('hex'));
}

// ── child_process: exec vs spawn vs fork ────────────────────────────────────

const { exec, spawn, fork } = require('child_process');

// exec: buffers output, good for short commands
exec('ls -la', (err, stdout) => console.log(stdout));

// spawn: streams output, good for long-running commands
const ls = spawn('ls', ['-la']);
ls.stdout.on('data', (data) => process.stdout.write(data));

// fork: Node.js child with IPC channel
const child = fork('./worker-script.js');
child.send({ task: 'process-data', payload: [1, 2, 3] });
child.on('message', (result) => console.log('Result:', result));

// ── SharedArrayBuffer with Atomics ───────────────────────────────────────────

const { Worker: W, isMainThread: isMT } = require('worker_threads');
if (isMT) {
  const shared = new SharedArrayBuffer(4); // 4 bytes = 1 int32
  const counter = new Int32Array(shared);
  for (let i = 0; i < 4; i++) {
    new W(__filename, { workerData: shared });
  }
  setTimeout(() => console.log('Counter:', Atomics.load(counter, 0)), 1000);
} else {
  const counter = new Int32Array(workerData);
  Atomics.add(counter, 0, 1); // atomic increment — no race condition
}`,
      rw: {
        ex: [
          'PM2 cluster mode is the standard way to utilize all CPU cores in Node.js production deployments without custom cluster code',
          'Next.js uses worker_threads for parallel route compilation — each page is built in a separate thread',
          'Sharp (image processing) uses worker_threads internally to run libvips operations without blocking the event loop',
          'Jest uses child_process workers to run test files in parallel — each test file gets an isolated Node.js process',
        ],
        cs: 'Vercel Edge Functions run on a V8 isolate model similar to worker threads — each request gets an isolated JavaScript context on a shared runtime, achieving massive concurrency without the overhead of full processes. Understanding Node.js cluster and worker_threads concepts directly translates to understanding how serverless platforms scale JavaScript.',
      },
    },
    interview: {
      q: 'When do you use cluster vs worker_threads? How does Node.js cluster module distribute incoming connections? What is the master-worker pattern?',
      a: 'Use cluster when you want to scale a stateless HTTP server across multiple CPU cores — each worker process handles its own requests with a completely separate event loop and memory space. Use worker_threads when you have a CPU-intensive task (hashing, image processing, data parsing) that would block the event loop — threads share memory so you can pass large datasets without serialization overhead. The cluster module distributes connections in two ways: on Linux/macOS, the master process accepts connections and distributes them to workers via round-robin (the default in Node.js); alternatively, the OS can distribute connections directly to workers that are all listening on the same port. The master-worker pattern: the master process is responsible for spawning workers, monitoring their health, and restarting them on crash. Workers handle the actual work (serving HTTP, processing jobs). The master never handles requests directly — it is purely an orchestrator. This separation of concerns means a worker crash does not bring down the entire server.',
      fu: [
        'How do you share state (like a rate-limit counter) between cluster workers?',
        'What is the difference between process.fork() and cluster.fork()?',
        'How do you implement graceful shutdown in a cluster?',
        'Can worker_threads access the file system directly?',
      ],
    },
  },

  // ─── MODULE SYSTEM ───────────────────────────────────────────────────────────

  {
    id: 'node-modules',
    cat: 'nodejs',
    color: '#68a063',
    icon: '📦',
    title: 'CommonJS vs ESM Modules',
    tag: 'Node.js supports both CommonJS (require) and ES Modules (import) — they have subtle but important differences',
    overview:
      'Node.js has two module systems: CommonJS (CJS), the original system using require() and module.exports, and ES Modules (ESM), the standardized system using import and export. CJS loads modules synchronously and caches them after first load — require() is blocking and can appear anywhere in code. ESM is the JavaScript standard, loads asynchronously, supports static analysis for tree shaking, and uses live bindings (exported values update when the original changes). The two systems have important interoperability rules: CJS can dynamically import() ESM, but ESM cannot require() CJS directly. Understanding both is essential for writing packages that work everywhere and for migrating existing projects.',
    components: [
      {
        name: 'CommonJS (require/module.exports)',
        icon: '📜',
        role: 'Original Node.js module system — synchronous, cached.',
        detail:
          'require() is synchronous — it blocks while loading and executing the module file. Modules are cached after first load (require.cache) — subsequent requires return the same object. module.exports is a plain object you can replace or augment. The __dirname and __filename globals provide the current file path.',
      },
      {
        name: 'ES Modules (import/export)',
        icon: '🌐',
        role: 'JavaScript standard module system — async, static, live bindings.',
        detail:
          'ESM uses import/export syntax, is parsed statically before execution (enabling tree shaking), and loads asynchronously. Named exports and default exports. Cannot use require(), __dirname, or __filename directly (use import.meta.url instead). Files must have .mjs extension or "type": "module" in package.json.',
      },
      {
        name: 'Module Cache',
        icon: '💾',
        role: 'Prevents re-executing modules on repeated requires.',
        detail:
          'Node.js caches every required module in require.cache keyed by resolved filename. The same module instance is returned for all require() calls to the same path within a process. This is why singletons work in Node.js without extra effort — and why clearing the cache (delete require.cache[key]) is needed in some hot-reload scenarios.',
      },
      {
        name: 'Circular Dependencies',
        icon: '🔁',
        role: 'When modules require each other — handled differently in CJS vs ESM.',
        detail:
          'In CJS, circular dependencies are resolved by returning a partially-constructed module.exports — the circularly-required module gets an incomplete snapshot of the other module. In ESM, circular imports use live bindings — bindings exist but may be undefined at the time of first access if the module has not finished executing yet.',
      },
      {
        name: '__dirname/__filename vs import.meta.url',
        icon: '📍',
        role: 'Current file path in CJS vs ESM.',
        detail:
          'CJS provides __dirname (directory) and __filename (full path) as globals. In ESM these do not exist — use import.meta.url and the URL/path modules: const __dirname = new URL(".", import.meta.url).pathname. This is a common gotcha when migrating from CJS to ESM.',
      },
      {
        name: 'dynamic import()',
        icon: '⚡',
        role: 'Lazy-load modules at runtime — works in both CJS and ESM.',
        detail:
          'import() is a function that returns a Promise resolving to the module namespace object. It works in both CJS and ESM files, enabling lazy loading and code splitting. It is the only way to import ESM from CJS. Use it for optional dependencies, route-based code splitting, and loading modules conditionally.',
      },
    ],
    a: {
      v: 'Library checkout system',
      t: 'CommonJS is like a library where books are photocopied on checkout — you get a snapshot of the book at checkout time and changes to the original do not affect your copy. ESM is like a live digital document — everyone always sees the current version. If the author updates a chapter, all readers see the update immediately.',
      tx: 'CJS exports are copied values — if a module exports a counter variable, other modules get the value at require() time. ESM exports are live bindings — if the exporting module changes the variable, all importers see the new value automatically.',
      s: 'In your Node.js library, ESM live bindings mean a circular-dependency bug that is silently ignored in CJS will throw a ReferenceError in ESM — a feature, not a bug. ESM forces you to fix circular dependencies properly.',
    },
    te: {
      def: 'Node.js supports two module systems: CommonJS (synchronous require/exports, cached snapshots) and ES Modules (asynchronous import/export, live bindings, statically analyzable). They have different semantics for circular dependencies, top-level await, and interoperability.',
      types: [
        {
          n: 'CommonJS',
          d: 'require() is synchronous and cached. module.exports is a mutable object. Supports __dirname/__filename. Default in .js files without "type": "module".',
        },
        {
          n: 'ES Modules',
          d: 'import/export are static declarations. Supports top-level await. Uses live bindings. Requires .mjs or "type": "module". Enables tree shaking.',
        },
        {
          n: 'Dynamic import()',
          d: 'Async function available in both systems. Returns a Promise. Enables code splitting and lazy loading. Only way to import ESM from CJS.',
        },
      ],
      when: 'Use ESM for new projects and packages — it is the future standard and enables tree shaking. Use CJS when: maintaining existing libraries, depending on CJS-only packages, or needing synchronous module loading. Use dynamic import() for optional dependencies and code splitting in both systems.',
      trade:
        'ESM cannot require() CJS easily — interop requires dynamic import(). ESM files cannot use __dirname/__filename without workarounds. ESM is asynchronous — you cannot call import() synchronously. CJS is simpler and universal but does not enable tree shaking and has worse support in browser environments.',
      code: `// ── CommonJS circular dependency behavior ────────────────────────────────────

// a.cjs
const b = require('./b.cjs');
console.log('In A, b.value =', b.value); // may be undefined if B not done loading
module.exports = { value: 'A' };

// b.cjs
const a = require('./a.cjs');
console.log('In B, a.value =', a.value); // undefined — A not finished yet
module.exports = { value: 'B' };

// ── ESM live bindings ────────────────────────────────────────────────────────

// counter.mjs
export let count = 0;
export function increment() { count++; }

// main.mjs
import { count, increment } from './counter.mjs';
console.log(count); // 0
increment();
console.log(count); // 1 — live binding, sees the update!

// ── package.json: type module ────────────────────────────────────────────────
// package.json
// { "type": "module" }  — all .js files treated as ESM
// Rename to .cjs for CommonJS files that need to stay CJS

// ── __dirname equivalent in ESM ───────────────────────────────────────────────

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configPath = join(__dirname, 'config.json');

// ── Dynamic import() for code splitting ──────────────────────────────────────

// Load a heavy module only when needed
async function processImage(buffer) {
  const { default: sharp } = await import('sharp'); // lazy-load
  return sharp(buffer).resize(800, 600).toBuffer();
}

// Load ESM from CJS using dynamic import
async function loadESMModule() {
  const { namedExport } = await import('./esm-module.mjs');
  return namedExport;
}

// ── Conditional exports in package.json ─────────────────────────────────────
// {
//   "exports": {
//     ".": {
//       "import": "./dist/index.mjs",    -- ESM consumers
//       "require": "./dist/index.cjs",   -- CJS consumers
//       "types": "./dist/index.d.ts"     -- TypeScript
//     }
//   }
// }`,
      rw: {
        ex: [
          'TypeScript compiles to CJS by default (module: "commonjs") — set module: "node16" or "nodenext" for proper ESM output',
          'Jest historically required CJS — modern Jest (v29+) supports ESM natively via --experimental-vm-modules',
          'Vite uses ESM for dev (native browser ESM) and Rollup/CJS for production builds — understanding both is essential',
          'The "exports" field in package.json enables dual CJS/ESM packages — the pattern used by all modern Node.js libraries',
        ],
        cs: 'The Node.js ecosystem transition to ESM has been slow due to the "dual package hazard" — a package exporting both CJS and ESM can have two instances in the same process, breaking singletons. Libraries like got and chalk went ESM-only in major versions, forcing ecosystem-wide updates. Understanding both module systems is critical for any Node.js library author.',
      },
    },
    interview: {
      q: 'What is the difference between CommonJS and ES Modules? How does Node.js handle circular dependencies differently in CJS vs ESM? What are live bindings in ESM?',
      a: 'CommonJS uses require() (synchronous), exports copies of values, and caches modules after first load. ES Modules use import/export (parsed statically, loaded asynchronously), export live bindings, and support top-level await. For circular dependencies: in CJS, when module A requires module B which requires module A, Node.js returns whatever has been exported from A so far — an incomplete object. This silently succeeds but leads to undefined values. In ESM, circular imports use live bindings — the import binding exists from the start, but accessing it before the module finishes executing throws a ReferenceError, making the problem visible. Live bindings in ESM mean that exported variables are references to the original binding, not copies — if the exporting module changes an exported variable after import, all importers immediately see the new value. This is different from CJS where you get a snapshot of the value at require() time.',
      fu: [
        'How do you import an ESM module from a CJS file?',
        'What is tree shaking and why does it require ESM?',
        'What is the dual package hazard?',
        'How do you configure TypeScript to output ESM?',
      ],
    },
  },

  // ─── NODE.JS SECURITY ────────────────────────────────────────────────────────

  {
    id: 'node-security',
    cat: 'nodejs',
    color: '#68a063',
    icon: '🔐',
    title: 'Node.js Security Best Practices',
    tag: 'Security in Node.js — from OWASP top 10 to production hardening',
    overview:
      'Node.js security spans multiple layers: HTTP hardening (Helmet.js sets security headers), rate limiting (preventing brute-force and DDoS), input validation and sanitization (preventing injection attacks), dependency security (npm audit, Snyk), environment variable management (secrets out of code), and application-layer protection (CORS, HTTPS, CSRF). The OWASP Top 10 maps directly to Node.js: injection (A03) via unsanitized DB queries, broken authentication (A07) via weak JWT handling, and SSRF (A10) via unchecked outbound requests. Security is not a single library but a defense-in-depth mindset applied at every layer of the stack.',
    components: [
      {
        name: 'Helmet.js',
        icon: '⛑️',
        role: 'Sets HTTP security headers to prevent common attacks.',
        detail:
          'Helmet is a collection of middleware that sets security-relevant HTTP headers: Content-Security-Policy (prevents XSS), X-Frame-Options (prevents clickjacking), X-Content-Type-Options (prevents MIME sniffing), Strict-Transport-Security (enforces HTTPS), and more. It does not prevent all attacks but eliminates an entire class of browser-level vulnerabilities with a single line.',
      },
      {
        name: 'Rate Limiting',
        icon: '🚦',
        role: 'Prevents brute-force attacks and API abuse.',
        detail:
          'express-rate-limit limits requests per IP per time window. Essential for login endpoints (prevent password brute-force), registration (prevent spam accounts), and any expensive operation. Combine with Redis (rate-limit-flexible) for distributed rate limiting across cluster workers. Always return 429 Too Many Requests with a Retry-After header.',
      },
      {
        name: 'Input Validation',
        icon: '✅',
        role: 'Reject malformed input before it reaches your business logic.',
        detail:
          'Validate all input at the boundary — HTTP request bodies, query params, headers, file uploads. Use validator.js for string validation (isEmail, isURL, escape) or Zod/Joi for schema validation. Never trust client-provided data. Validation and sanitization are different: validation rejects bad input, sanitization cleans it — do both.',
      },
      {
        name: 'SQL/NoSQL Injection Prevention',
        icon: '💉',
        role: 'Parameterized queries prevent injection attacks.',
        detail:
          'Never concatenate user input into SQL queries. Use parameterized queries (pg: query("SELECT * FROM users WHERE id = $1", [userId])) or ORM query builders. For NoSQL (MongoDB), validate that operator keys ($where, $regex) cannot be injected via user input — use schema validation (Mongoose schemas, Joi) to strip unexpected keys.',
      },
      {
        name: 'SSRF Prevention',
        icon: '🌐',
        role: 'Prevent attackers from making your server fetch internal resources.',
        detail:
          'Server-Side Request Forgery occurs when user-controlled URLs are fetched by your server — attackers can reach internal services (169.254.169.254 AWS metadata, internal APIs). Prevent by: allowlisting domains, blocking private IP ranges, using a dedicated fetch sandbox, and never passing user input directly to fetch/axios/http.request.',
      },
      {
        name: 'Dependency Auditing',
        icon: '🔍',
        role: 'Scan for known vulnerabilities in npm packages.',
        detail:
          'npm audit scans your dependency tree against the npm advisory database. Snyk provides continuous monitoring and auto-PRs for vulnerability fixes. Run npm audit in CI/CD pipelines and fail builds on high/critical vulnerabilities. Use npm audit fix --force carefully — major version bumps may introduce breaking changes.',
      },
      {
        name: 'Environment Variables & Secrets',
        icon: '🗝️',
        role: 'Keep secrets out of source code and logs.',
        detail:
          'Never hardcode secrets in source code. Use .env files for local development (dotenv) and proper secret management in production (AWS Secrets Manager, Vault, environment variables). Validate required env vars at startup using a library like envalid or Zod — fail fast with a clear error rather than a cryptic undefined error at runtime.',
      },
      {
        name: 'CORS',
        icon: '🔒',
        role: 'Control which origins can make cross-origin requests to your API.',
        detail:
          'CORS headers tell browsers which origins are allowed to call your API. The cors() middleware configures Access-Control-Allow-Origin, methods, and headers. Never use origin: "*" for APIs that handle authentication — this allows any website to make credentialed requests to your API from a user\'s browser. Allowlist specific origins explicitly.',
      },
    ],
    a: {
      v: 'Building security system',
      t: 'A secure building has multiple layers: a fence (rate limiting — limits how many people approach), security guard checking IDs (input validation), badge readers on every door (authentication), security cameras (logging/monitoring), and sealed internal systems (SSRF prevention — visitors cannot reach the server room). No single measure is enough — defense in depth.',
      tx: 'Security is not one lock but layered defenses. Each layer has a different threat model: Helmet stops browser-level attacks, rate limiting stops automated attacks, input validation stops injection, CORS stops cross-site attacks. An attacker who bypasses one layer should be stopped by the next.',
      s: 'Your Express.js API should apply Helmet globally, rate-limit auth endpoints, validate all request bodies with Zod before they reach your controllers, use parameterized queries in all DB calls, and scan dependencies in CI — each is a different defensive layer.',
    },
    te: {
      def: 'Node.js application security requires defense-in-depth: HTTP header hardening, rate limiting, input validation, injection prevention, SSRF protection, dependency auditing, and secrets management. No single measure is sufficient — apply security at every layer.',
      types: [
        {
          n: 'Transport Security',
          d: 'HTTPS (TLS), HSTS headers, certificate pinning. Prevents eavesdropping and man-in-the-middle attacks.',
        },
        {
          n: 'Application Security',
          d: 'Input validation, injection prevention, authentication/authorization, CSRF protection. Prevents application-level attacks.',
        },
        {
          n: 'Infrastructure Security',
          d: 'Dependency auditing, secrets management, rate limiting, SSRF prevention. Prevents supply-chain and infrastructure attacks.',
        },
      ],
      when: 'Apply security from day one — retrofitting security is expensive. Add Helmet and rate limiting when creating the Express app. Add input validation when creating any route handler. Run npm audit in CI from the first commit. Never skip security for "prototype" code that might reach production.',
      trade:
        'Security adds latency (rate limit checks, input validation) and development overhead (writing validation schemas, managing secrets). The tradeoff is non-negotiable — a single SQL injection vulnerability can expose your entire database. Input validation also improves reliability by catching bugs early, so security and correctness are aligned.',
      code: `const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// ── Helmet middleware: sets 14+ security headers ─────────────────────────────

app.use(helmet()); // enables all defaults
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", 'https://fonts.googleapis.com'],
  },
}));

// ── CORS configuration ───────────────────────────────────────────────────────

app.use(cors({
  origin: ['https://myapp.com', 'https://staging.myapp.com'], // never '*' for auth APIs
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// ── express-rate-limit: brute-force protection ───────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts per IP per window
  message: { error: 'Too many login attempts, try again in 15 minutes' },
  standardHeaders: true,     // sends RateLimit-* headers
  legacyHeaders: false,
});
app.use('/auth/login', loginLimiter);

// ── Input validation with express-validator ──────────────────────────────────

app.post('/users',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).trim(),
  body('age').isInt({ min: 0, max: 120 }).optional(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // req.body is now validated and sanitized
  }
);

// ── Parameterized queries: SQL injection prevention ──────────────────────────

const pool = new Pool();
async function getUserById(userId) {
  // SAFE: parameterized query — userId never touches SQL string
  const { rows } = await pool.query(
    'SELECT id, email, name FROM users WHERE id = $1',
    [userId] // parameter, not string concatenation
  );
  return rows[0];
}

// NEVER do this:
// pool.query('SELECT * FROM users WHERE id = ' + userId); -- SQL injection!

// ── SSRF prevention ──────────────────────────────────────────────────────────

const { URL } = require('url');
const ALLOWED_DOMAINS = new Set(['api.example.com', 'cdn.example.com']);

async function safeFetch(urlString) {
  const url = new URL(urlString);
  // Block private IP ranges and non-allowlisted domains
  if (!ALLOWED_DOMAINS.has(url.hostname)) {
    throw new Error('Domain not allowlisted: ' + url.hostname);
  }
  return fetch(urlString);
}

// ── Environment variables with validation ────────────────────────────────────

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error('Missing required env var: ' + envVar); // fail fast at startup
  }
}`,
      rw: {
        ex: [
          'GitHub Actions runs npm audit --audit-level=high in CI — builds fail on any high or critical vulnerability',
          'Stripe validates all webhook payloads with HMAC-SHA256 signatures — prevents attackers from forging payment events',
          'Express.js stores session IDs in httpOnly, secure, sameSite=strict cookies — prevents XSS from stealing session tokens',
          'AWS Lambda function URLs support CORS configuration and can be put behind WAF rules for rate limiting at the infrastructure level',
        ],
        cs: 'The 2021 Log4Shell vulnerability showed that even well-audited Java libraries can have critical security flaws. For Node.js, the 2022 node-ipc supply chain attack — a maintainer deliberately added malicious code to delete files on Russian/Belarusian systems — demonstrated why npm audit and dependency pinning (package-lock.json, lockfile integrity) are critical. Never skip dependency auditing even for "trusted" packages.',
      },
    },
    interview: {
      q: 'How do you prevent SQL injection in Node.js? What does Helmet.js do? How do you protect against SSRF attacks?',
      a: 'SQL injection prevention: always use parameterized queries — pass user input as a separate parameter array, never concatenate it into the SQL string. With pg: query("SELECT * FROM users WHERE id = $1", [userId]). With TypeORM/Prisma, the query builders parameterize automatically. Never use raw string concatenation or template literals to build SQL. Helmet.js sets security-relevant HTTP response headers that browsers enforce: Content-Security-Policy prevents XSS by controlling which scripts/styles can execute, X-Frame-Options prevents clickjacking by disabling your page from being embedded in iframes, X-Content-Type-Options prevents MIME type sniffing, Strict-Transport-Security forces HTTPS for future requests, and several others. It is a thin middleware that provides significant browser-level protection with one line. SSRF prevention: never pass user-controlled URLs directly to fetch(), axios, or http.request. Validate URLs against an allowlist of permitted domains, block requests to private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x, 169.254.x.x), and consider using a dedicated HTTP proxy sandbox. SSRF is particularly dangerous in cloud environments where the metadata endpoint (169.254.169.254) can expose AWS credentials.',
      fu: [
        'What is the difference between input validation and input sanitization?',
        'How do you implement secure JWT authentication in Node.js?',
        'What is the OWASP Top 10 and which items are most relevant to Node.js APIs?',
        'How do you audit and update vulnerable dependencies without breaking your app?',
      ],
    },
  },
];

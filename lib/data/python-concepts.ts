import { Concept } from '../types';

export const PYTHON_CONCEPTS: Concept[] = [
  // ─── GLOBAL INTERPRETER LOCK ─────────────────────────────────────────────────

  {
    id: 'py-gil',
    cat: 'python',
    color: '#3776ab',
    icon: '🔒',
    title: 'Global Interpreter Lock (GIL)',
    tag: 'The GIL prevents true CPU parallelism in CPython — use multiprocessing for CPU-bound work',
    overview:
      'The Global Interpreter Lock (GIL) is a mutex in CPython that allows only one thread to execute Python bytecode at a time. It exists because CPython uses reference counting for memory management — without a lock, concurrent threads could corrupt reference counts, causing use-after-free bugs. The practical consequence: CPU-bound work does not parallelize across threads. However, I/O-bound work (network requests, file reads) releases the GIL while waiting, so threading is still effective for concurrency. For true CPU parallelism, use multiprocessing (separate processes, each with their own GIL) or C extensions that release the GIL (NumPy, Pillow).',
    components: [
      {
        name: 'GIL',
        icon: '🔒',
        role: 'Mutex ensuring one thread executes Python bytecode at a time.',
        detail:
          'The GIL is re-acquired every 100 bytecode instructions (sys.getswitchinterval, default 5ms in Python 3.2+). It is released during I/O operations, time.sleep(), and calls into C extensions that explicitly drop it. Python 3.12+ introduces per-interpreter GILs (PEP 684) and Python 3.13 adds an experimental no-GIL build.',
      },
      {
        name: 'threading (I/O-bound OK)',
        icon: '🧵',
        role: 'OS threads — concurrent for I/O, not parallel for CPU.',
        detail:
          'threading.Thread runs OS threads. For I/O-bound tasks (HTTP requests, database queries, file reads), threads are effective because the GIL is released during I/O waits. Multiple threads can make progress concurrently. For CPU-bound tasks, threads compete for the GIL and may be slower than a single thread due to lock contention overhead.',
      },
      {
        name: 'multiprocessing (CPU-bound)',
        icon: '⚙️',
        role: 'Separate processes, each with their own GIL — true parallelism.',
        detail:
          'multiprocessing.Process spawns separate OS processes. Each has its own Python interpreter and GIL, enabling true CPU parallelism. Data is shared via pickling over IPC (slower than shared memory). Use Pool.map() for parallel work distribution. The main cost is process spawn time (~50ms) and serialization overhead.',
      },
      {
        name: 'concurrent.futures',
        icon: '🚀',
        role: 'High-level API for ThreadPoolExecutor and ProcessPoolExecutor.',
        detail:
          'concurrent.futures provides a unified interface: ThreadPoolExecutor for I/O-bound concurrency and ProcessPoolExecutor for CPU-bound parallelism. submit() returns a Future; map() runs tasks in parallel and yields results in order. Use executor.shutdown(wait=True) for graceful cleanup.',
      },
      {
        name: 'GIL-releasing C extensions',
        icon: '🔬',
        role: 'NumPy, Pillow, and others release the GIL during computation.',
        detail:
          'Well-written C extensions call Py_BEGIN_ALLOW_THREADS before CPU-intensive C code and Py_END_ALLOW_THREADS after, releasing the GIL during the C computation. NumPy array operations, Pillow image processing, and cryptography routines all do this — meaning Python threads CAN achieve CPU parallelism through these libraries.',
      },
    ],
    a: {
      v: 'Single-key office building',
      t: 'The GIL is like a building with one master key. Multiple workers (threads) can be inside doing tasks, but only the person with the key can use the main workstation (execute Python bytecode). Workers waiting for deliveries (I/O) hand back the key so others can work. To have multiple workstations running simultaneously, you need separate buildings (processes).',
      tx: 'The key-passing overhead explains why CPU-bound threading is slower than single-threaded — workers spend time fighting over the key instead of working. I/O-bound workers voluntarily hand the key back while waiting, so key contention is minimal.',
      s: 'Your web scraper spawning 50 threads to fetch URLs works well despite the GIL — each thread releases the GIL while waiting for HTTP responses, giving other threads time to run. Your image resizing pipeline needs multiprocessing — CPU-heavy work never releases the GIL.',
    },
    te: {
      def: 'The GIL is a CPython-specific mutex that serializes Python bytecode execution across threads. It protects the reference counting memory model but limits CPU-bound thread parallelism. Workarounds: multiprocessing for CPU-bound work, threading for I/O-bound work, GIL-releasing C extensions for both.',
      types: [
        {
          n: 'I/O-bound concurrency',
          d: 'Threading works well — GIL is released during I/O waits. ThreadPoolExecutor handles hundreds of concurrent requests efficiently.',
        },
        {
          n: 'CPU-bound parallelism',
          d: 'Requires multiprocessing (separate GILs) or GIL-releasing C extensions (NumPy). Threading adds overhead without benefit.',
        },
        {
          n: 'No-GIL Python (3.13+)',
          d: 'Experimental build removes the GIL — true thread parallelism for CPU-bound work. Requires careful C extension compatibility.',
        },
      ],
      when: 'Use threading or asyncio for I/O-bound concurrency (HTTP, DB, file I/O). Use multiprocessing for CPU-bound parallelism (data crunching, image processing, ML inference). Use concurrent.futures as the unified high-level API. Profile before optimizing — most web services are I/O-bound and threading/asyncio suffices.',
      trade:
        'multiprocessing achieves CPU parallelism but has higher spawn cost (~50ms vs ~1ms for threads), higher memory usage (separate process per worker), and serialization overhead for passing data between processes. Threads are cheap and share memory but are limited by the GIL for CPU work. Choose based on your bottleneck, not assumption.',
      code: `import concurrent.futures
import requests
import time

urls = [
    'https://httpbin.org/delay/1',
    'https://httpbin.org/delay/1',
    'https://httpbin.org/delay/1',
    'https://httpbin.org/delay/1',
]

# ── Threading for I/O-bound: GIL released during HTTP wait ───────────────────

def fetch(url):
    return requests.get(url).status_code

start = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(fetch, urls))
print(f'Thread I/O: {time.time() - start:.1f}s')  # ~1s (parallel I/O)

# ── ProcessPoolExecutor for CPU-bound: each process has own GIL ──────────────

def cpu_task(n):
    # Pure Python math — GIL never released, threading would be ~4x serial time
    return sum(i * i for i in range(n))

with concurrent.futures.ProcessPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(cpu_task, 10_000_000) for _ in range(4)]
    results = [f.result() for f in futures]
# Each process runs on a separate CPU core — true parallelism

# ── NumPy releases the GIL: threads CAN parallelize NumPy ops ────────────────

import numpy as np
import threading

def numpy_work(arr):
    return np.dot(arr, arr)  # releases GIL during C-level computation

arr = np.random.rand(1000, 1000)
threads = [threading.Thread(target=numpy_work, args=(arr,)) for _ in range(4)]
for t in threads: t.start()
for t in threads: t.join()
# All 4 threads run in parallel — GIL released in NumPy C code`,
      rw: {
        ex: [
          'Django and Flask web servers handle concurrent requests via threading (gunicorn --threads) — each request thread releases the GIL during database I/O',
          'Celery worker processes (not threads) are used for CPU-bound background tasks — separate processes bypass the GIL',
          'NumPy, Pandas, and scikit-learn release the GIL during heavy computation — threading can achieve parallelism through these libraries',
          'Python 3.13 ships with an experimental free-threaded (no-GIL) build — may change the landscape for CPU-bound threading',
        ],
        cs: 'Gunicorn uses a pre-fork worker model (multiprocessing) to handle web traffic — each worker is a separate process with its own GIL. For a Django app serving CPU-heavy ML inference, you would run 4 Gunicorn workers on a 4-core machine, achieving full CPU utilization despite the GIL.',
      },
    },
    interview: {
      q: 'What is the GIL and when does it matter? Why is threading still useful in Python despite the GIL?',
      a: 'The GIL (Global Interpreter Lock) is a mutex in CPython that ensures only one thread executes Python bytecode at a time. It exists to protect CPython\'s reference-counting garbage collector from race conditions. It matters for CPU-bound work: Python threads cannot achieve true parallelism for pure Python computation — they take turns on the GIL, so 4 threads running CPU-bound code may be no faster (or slower) than 1 thread. Threading is still useful because the GIL is released during I/O operations — file reads, network requests, database queries. While one thread waits for a network response, another thread acquires the GIL and runs. For an HTTP-heavy application, threading gives genuine concurrency. For CPU-bound work, use multiprocessing or a C extension that releases the GIL.',
      fu: [
        'How would you parallelize a CPU-intensive image-processing task in Python?',
        'What is the difference between multiprocessing.Pool and concurrent.futures.ProcessPoolExecutor?',
        'Does asyncio bypass the GIL?',
        'What is Python 3.13 free-threaded mode?',
      ],
    },
  },

  // ─── GENERATORS & ITERATORS ──────────────────────────────────────────────────

  {
    id: 'py-generators',
    cat: 'python',
    color: '#3776ab',
    icon: '🔁',
    title: 'Generators & Iterators',
    tag: 'Generators produce values lazily — process large data without loading it all into memory',
    overview:
      'An iterator is any object implementing __iter__() and __next__(). A generator is a function that uses yield to produce values one at a time, pausing execution between yields. Generator functions return a generator object (which is itself an iterator). Generator expressions (similar to list comprehensions but with parentheses) produce values lazily. yield from delegates to a sub-generator and propagates send/throw. Generators enable memory-efficient pipelines: reading a 10GB file line by line without loading it into RAM, infinite sequences, and composable data processing steps.',
    components: [
      {
        name: 'yield',
        icon: '⏸️',
        role: 'Suspends function execution and yields a value to the caller.',
        detail:
          'yield turns a function into a generator function. When called, the function body does not execute — it returns a generator object. Each call to next() on the generator resumes execution until the next yield or return. On StopIteration, the for loop exits automatically.',
      },
      {
        name: 'Generator function',
        icon: '🏭',
        role: 'Function using yield — returns a generator object.',
        detail:
          'A generator function\'s body is not executed on call. It runs lazily, one yield at a time. The generator maintains its local state (variables, call stack frame) between yields — no external state object needed. Memory usage is constant regardless of total items produced.',
      },
      {
        name: 'Generator expression',
        icon: '✨',
        role: 'Lazy equivalent of a list comprehension.',
        detail:
          'Syntax: (expr for item in iterable if condition). Like a list comprehension but produces one item at a time instead of building a full list. Use when you only need to iterate once and do not need random access. sum(x*x for x in range(1_000_000)) uses constant memory vs list comprehension which allocates a million-element list.',
      },
      {
        name: 'send()',
        icon: '📨',
        role: 'Send a value into a generator — turns it into a coroutine.',
        detail:
          'gen.send(value) resumes the generator and makes yield evaluate to value. On the first call, use send(None) or next(). This turns generators into coroutines that communicate bidirectionally. asyncio\'s original coroutine model was built on generator send() before async/await syntax.',
      },
      {
        name: 'yield from',
        icon: '🔗',
        role: 'Delegate to a sub-generator — transparently forwards values.',
        detail:
          'yield from iterable pulls all values from the iterable and yields them one by one. For generator sub-delegation, it also forwards send() and throw() to the sub-generator and captures its return value. Much cleaner than manually iterating a sub-generator.',
      },
      {
        name: 'itertools',
        icon: '🧰',
        role: 'Standard library of memory-efficient iterator building blocks.',
        detail:
          'itertools.chain() concatenates iterables without copying. islice() takes a slice without materializing the whole iterable. takewhile()/dropwhile() filter lazily. cycle() repeats infinitely. product()/combinations()/permutations() generate combinations without building full lists. All return iterators, not lists.',
      },
    ],
    a: {
      v: 'Vending machine vs warehouse',
      t: 'A list is like a warehouse — all items are stored upfront, ready to grab at any time. A generator is like a vending machine that manufactures each item on demand — you press the button (call next()), it produces one item, then waits. If you only want 5 items from a million-item sequence, the warehouse wastes space on 999,995 items. The vending machine uses constant space.',
      tx: 'The warehouse analogy shows why generators shine for large or infinite sequences: they never build the full collection. The tradeoff: you can only go forward (no indexing), and you can only iterate once (the generator is exhausted after one pass).',
      s: 'Your ETL pipeline reads a 10GB CSV file. With a list: 10GB in RAM, probably crashes. With a generator: each line is read, processed, and discarded before the next is read — constant ~1KB of memory usage regardless of file size.',
    },
    te: {
      def: 'A generator is a function that uses yield to produce values lazily, suspending execution state between calls. It implements the iterator protocol (__iter__/__next__) automatically. Generator expressions provide concise syntax for simple lazy sequences.',
      types: [
        {
          n: 'Generator function',
          d: 'Uses yield. Returns a generator object. Maintains local state between yields. Memory: O(1) regardless of total values.',
        },
        {
          n: 'Generator expression',
          d: '(expr for item in iterable). Lazy list comprehension. Best for one-pass iteration where you do not need a list.',
        },
        {
          n: 'yield from',
          d: 'Delegates to sub-generator. Forwards send/throw/return. Essential for recursive generators and coroutine delegation.',
        },
      ],
      when: 'Use generators when: the full sequence would not fit in memory, you only need to iterate once, producing values is expensive and you may not need all of them, or you are building a composable data pipeline. Use lists when you need random access, multiple passes, or len().',
      trade:
        'Generators can only be iterated once — they are exhausted after one pass and cannot be reset (create a new generator instead). No random access by index. Cannot use len() without exhausting the generator. These constraints are acceptable for streaming/pipeline use cases and eliminate the need to hold the entire dataset in memory.',
      code: `import itertools

# ── Generator for large file processing ──────────────────────────────────────

def read_lines(filepath):
    '''Yields one line at a time — constant memory regardless of file size.'''
    with open(filepath, encoding='utf-8') as f:
        for line in f:
            yield line.rstrip('\\n')

# Only lines matching the filter are processed
for line in read_lines('huge.log'):
    if 'ERROR' in line:
        print(line)

# ── Infinite counter generator ────────────────────────────────────────────────

def counter(start=0, step=1):
    n = start
    while True:
        yield n
        n += step

gen = counter(start=10, step=5)
print(next(gen))   # 10
print(next(gen))   # 15
print(next(gen))   # 20
# Never runs out — produces values on demand

# ── yield from: delegate to sub-generator ────────────────────────────────────

def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)   # recursively delegate
        else:
            yield item

print(list(flatten([1, [2, [3, 4]], 5])))  # [1, 2, 3, 4, 5]

# ── Generator pipeline: filter -> transform -> consume ────────────────────────

def parse_csv(filepath):
    with open(filepath) as f:
        for line in f:
            yield line.strip().split(',')

def filter_rows(rows, column, value):
    for row in rows:
        if row[column] == value:
            yield row

def extract_field(rows, column):
    for row in rows:
        yield row[column]

# Pipeline — nothing materializes until list() forces evaluation
raw = parse_csv('data.csv')
filtered = filter_rows(raw, column=2, value='active')
names = extract_field(filtered, column=0)
result = list(names)  # only here does data flow through all stages

# ── Generator expression vs list comprehension ────────────────────────────────

total = sum(x * x for x in range(1_000_000))  # constant memory
# vs: sum([x * x for x in range(1_000_000)])  -- builds full list first`,
      rw: {
        ex: [
          'Django querysets are lazy iterators — .filter() builds a query but does not hit the database until iteration',
          'Python\'s csv.reader returns an iterator — reading CSV files never loads the entire file into memory',
          'itertools.islice() is used to paginate generators — taking N items from an infinite sequence',
          'pytest\'s fixture system uses generators with yield for setup/teardown — code before yield is setup, after is teardown',
        ],
        cs: 'Apache Kafka consumer clients use a generator-like pull model: the consumer.poll() loop yields batches of messages one at a time, never buffering the entire topic in memory. This is the same mental model as Python generators — process data as it arrives, backpressure naturally applied.',
      },
    },
    interview: {
      q: 'What is the difference between a generator and an iterator? How would you process a 10GB file with a generator?',
      a: 'An iterator is any object with __iter__() and __next__() methods that produces values one at a time. A generator is a special, easy way to create an iterator using a function with yield — Python automatically creates the __iter__/__next__ methods. Every generator is an iterator, but not every iterator is a generator. For a 10GB file: open it and yield one line at a time. The key is never calling .read() or .readlines() which would load the whole file. Use "for line in file:" which iterates line by line using the file object\'s built-in iterator, or wrap it in a generator function with yield. Compose multiple generators as a pipeline — filter, transform, and consume — with each stage processing one record at a time. Memory usage stays constant (a few KB for the current line) regardless of file size.',
      fu: [
        'What happens when you call next() on an exhausted generator?',
        'How does yield from differ from "for item in sub: yield item"?',
        'How would you implement a generator that can be reset?',
        'What is the send() method and when would you use it?',
      ],
    },
  },

  // ─── DECORATORS & METAPROGRAMMING ────────────────────────────────────────────

  {
    id: 'py-decorators',
    cat: 'python',
    color: '#3776ab',
    icon: '🎨',
    title: 'Decorators & Metaprogramming',
    tag: 'Decorators are higher-order functions that wrap callables to add behavior',
    overview:
      'A decorator is a callable that takes a function (or class) and returns a replacement. The @syntax is syntactic sugar: @timer above def fn() is equivalent to fn = timer(fn). Decorators add behavior (logging, caching, retries, access control) without modifying the original function body. @functools.wraps preserves the wrapped function\'s metadata (__name__, __doc__). Parameterized decorators add another layer of nesting. Class decorators modify or replace a class. @property, @classmethod, and @staticmethod are built-in descriptors that behave like decorators.',
    components: [
      {
        name: 'Function decorators',
        icon: '🎁',
        role: 'Wrap a function to add behavior before or after its execution.',
        detail:
          'The pattern: def decorator(fn): def wrapper(*args, **kwargs): ... return fn(*args, **kwargs); return wrapper. *args/**kwargs ensures the wrapper accepts any signature. The decorator replaces the original function reference with wrapper in the module namespace.',
      },
      {
        name: '@wraps',
        icon: '🏷️',
        role: 'Preserves the wrapped function\'s __name__, __doc__, and __annotations__.',
        detail:
          'Without @wraps, the decorated function\'s name becomes "wrapper", breaking introspection, logging, and help(). functools.wraps(fn) copies __module__, __name__, __qualname__, __doc__, __dict__, and __wrapped__ from fn to wrapper. Always use it in production decorators.',
      },
      {
        name: '@property',
        icon: '🏠',
        role: 'Turns a method into a computed attribute with optional setter.',
        detail:
          '@property lets you access a method call as an attribute (no parentheses). Define a getter with @property, setter with @name.setter, and deleter with @name.deleter. Used for computed attributes, validation on assignment, and lazy initialization.',
      },
      {
        name: '@classmethod',
        icon: '🏭',
        role: 'Method that receives the class (cls) instead of the instance (self).',
        detail:
          '@classmethod receives cls as first argument — the class itself, not an instance. Used for alternative constructors (e.g., User.from_dict(data)), factory methods, and methods that need to create instances of subclasses correctly. Can be called on the class or an instance.',
      },
      {
        name: '@staticmethod',
        icon: '📦',
        role: 'Method that receives neither self nor cls — a plain function in class namespace.',
        detail:
          '@staticmethod receives no implicit first argument. It is a regular function that happens to live in the class namespace for organizational purposes. Use when the function is logically related to the class but does not need access to instance or class state.',
      },
      {
        name: 'Stacking decorators (bottom-up)',
        icon: '🥞',
        role: 'Multiple decorators apply in bottom-up order.',
        detail:
          'When stacking @a @b @c above def fn(), Python applies them bottom-up: fn = a(b(c(fn))). The bottom decorator (c) is applied first, then b, then a. This means the outermost decorator (a) runs first when the function is called. Order matters — for example, @login_required must be outside @cache so that caching only happens after authentication.',
      },
    ],
    a: {
      v: 'Gift wrapping',
      t: 'A decorator is like wrapping a gift. The gift (original function) is inside. The wrapping paper (decorator) adds presentation without changing the gift. You can add multiple layers: tissue paper (logging), a box (timing), a bow (caching). Each layer adds something. When the recipient opens it (calls the function), they go through each layer in order.',
      tx: 'The layers analogy explains stacking order: @a @b def fn() means fn is wrapped in b first, then in a. When called, a\'s wrapper runs first (outermost), then b\'s wrapper, then the original fn. On return, the layers unwind in reverse.',
      s: 'Your Flask routes use @login_required and @cache. Stack them as @login_required @cache — authentication check runs first (outer), and only if authenticated does the caching layer run (inner). Reversing them would cache the "unauthorized" response.',
    },
    te: {
      def: 'Decorators are callables that transform functions or classes by wrapping them. They implement the higher-order function pattern: accepting a callable and returning a new callable with added behavior. @functools.wraps preserves metadata across the wrapping.',
      types: [
        {
          n: 'Function decorator',
          d: 'Wraps a function. Uses *args/**kwargs to be signature-agnostic. @wraps preserves metadata. Common uses: timing, logging, retry, caching, auth.',
        },
        {
          n: 'Parameterized decorator',
          d: 'Factory that accepts arguments and returns a decorator. Three levels of nesting: factory -> decorator -> wrapper.',
        },
        {
          n: 'Class decorator',
          d: 'Takes a class and returns a modified or replaced class. @dataclass is a class decorator. Less common than function decorators.',
        },
      ],
      when: 'Use decorators for cross-cutting concerns that apply to many functions: logging, timing, authentication, retry logic, caching, rate limiting, validation. Avoid decorators that are used on only one function — just write the logic inline. Avoid decorators that make debugging hard by obscuring the call stack.',
      trade:
        'Decorators can make debugging harder — tracebacks show the wrapper, not the original function (mitigated by @wraps). Stacking many decorators creates performance overhead (each call passes through all wrappers). Parameterized decorators require understanding three levels of nesting which can be confusing.',
      code: `import functools
import time

# ── Timing decorator with @wraps ──────────────────────────────────────────────

def timer(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f'{fn.__name__} took {elapsed:.3f}s')
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(0.1)

slow_function()  # 'slow_function took 0.100s'
print(slow_function.__name__)  # 'slow_function' (not 'wrapper' -- thanks to @wraps)

# ── Parameterized @retry with backoff ─────────────────────────────────────────

def retry(attempts=3, delay=1.0):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(1, attempts + 1):
                try:
                    return fn(*args, **kwargs)
                except Exception as e:
                    if attempt == attempts:
                        raise
                    time.sleep(delay * attempt)
        return wrapper
    return decorator

@retry(attempts=3, delay=0.5)
def flaky_api_call():
    ...  # may raise requests.Timeout

# ── @lru_cache from functools ─────────────────────────────────────────────────

@functools.lru_cache(maxsize=128)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# ── Parameterized @requires_role ──────────────────────────────────────────────

def requires_role(role):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(user, *args, **kwargs):
            if user.role != role:
                raise PermissionError(f'Requires role: {role}')
            return fn(user, *args, **kwargs)
        return wrapper
    return decorator

@requires_role('admin')
def delete_user(user, user_id):
    ...

# ── Stacking: bottom-up application order ────────────────────────────────────

@timer           # applied third (outermost -- runs first on call)
@retry(3)        # applied second
@requires_role('admin')  # applied first (innermost -- closest to fn)
def admin_action(user, data):
    ...
# Equivalent to: admin_action = timer(retry(3)(requires_role('admin')(admin_action)))`,
      rw: {
        ex: [
          'Flask\'s @app.route() is a parameterized class decorator that registers the function in the URL routing table',
          'Django\'s @login_required and @permission_required are stacked on view functions for access control',
          '@functools.lru_cache is used throughout Python\'s stdlib — re.compile uses it internally to cache compiled regex patterns',
          'pytest\'s @pytest.fixture and @pytest.mark.parametrize are decorators that modify test collection behavior',
        ],
        cs: 'FastAPI\'s entire routing system is built on decorators: @app.get("/users") registers the function as an HTTP handler, automatically generates OpenAPI documentation from type annotations, and injects dependency-injected parameters. Understanding decorators is prerequisite knowledge for working with FastAPI.',
      },
    },
    interview: {
      q: 'Why use @functools.wraps? What is the difference between @classmethod and @staticmethod? How does decorator stacking work?',
      a: '@functools.wraps copies the wrapped function\'s __name__, __qualname__, __doc__, and __annotations__ onto the wrapper function. Without it, every decorated function\'s name becomes "wrapper" — breaking logging, debugging, help(), and introspection tools. It is a one-line fix that prevents confusing bugs in production.\n\n@classmethod receives the class (cls) as the first argument. It can create instances of the class or subclasses correctly — useful for alternative constructors like User.from_json(). @staticmethod receives no implicit first argument — it is a plain function in the class namespace for organizational purposes. Use @classmethod when you need access to the class itself; use @staticmethod when the function is logically part of the class but does not need self or cls.\n\nDecorator stacking applies bottom-up. @a @b @c def fn() is equivalent to fn = a(b(c(fn))). The bottommost decorator (c) wraps fn first. On a function call, the outermost wrapper (a) runs first and calls b\'s wrapper which calls c\'s wrapper which calls fn. This means the order in which you stack decorators controls execution order.',
      fu: [
        'How do you write a decorator that can be used with or without arguments (@decorator vs @decorator())?',
        'What is the descriptor protocol and how does @property use it?',
        'How does @dataclass work as a class decorator?',
        'What is functools.wraps doing under the hood?',
      ],
    },
  },

  // ─── ASYNCIO & ASYNC/AWAIT ───────────────────────────────────────────────────

  {
    id: 'py-async',
    cat: 'python',
    color: '#3776ab',
    icon: '⚡',
    title: 'Asyncio & Async/Await',
    tag: 'asyncio is single-threaded concurrency for I/O-bound work — not parallel, but concurrent',
    overview:
      'asyncio is Python\'s standard library for asynchronous programming using coroutines. async def defines a coroutine function; await suspends it until the awaited coroutine or future completes, yielding control back to the event loop. The event loop runs one coroutine at a time (single-threaded) but switches between them during await points — achieving concurrency without parallelism. asyncio.gather() runs multiple coroutines concurrently. asyncio.Semaphore limits the number of concurrent operations. run_in_executor() runs synchronous blocking code in a thread pool without blocking the event loop.',
    components: [
      {
        name: 'async def / await',
        icon: '⏸️',
        role: 'Define coroutines and yield control during I/O waits.',
        detail:
          'async def creates a coroutine function — calling it returns a coroutine object (not a result). await suspends the current coroutine and schedules the awaited coroutine. Control returns to the event loop which can run other coroutines. A coroutine must be awaited or scheduled with create_task() to actually run.',
      },
      {
        name: 'asyncio.gather()',
        icon: '🔀',
        role: 'Run multiple coroutines concurrently — waits for all.',
        detail:
          'asyncio.gather(*coros) schedules all coroutines concurrently and returns their results as a list in the same order. If any coroutine raises an exception, gather() raises it (use return_exceptions=True to get exceptions as results instead). This is the primary tool for I/O fan-out.',
      },
      {
        name: 'asyncio.create_task()',
        icon: '📋',
        role: 'Schedule a coroutine to run concurrently without awaiting immediately.',
        detail:
          'create_task() wraps a coroutine in a Task and schedules it on the event loop immediately. Unlike gather(), you can create tasks and do other work before awaiting them. Tasks run in the background until awaited or until the event loop is done. Use for fire-and-forget background work.',
      },
      {
        name: 'asyncio.Semaphore',
        icon: '🚦',
        role: 'Limit the number of concurrent coroutines.',
        detail:
          'asyncio.Semaphore(n) allows at most n coroutines to run inside its async with block simultaneously. Others wait. Essential when making many requests to an API with rate limits or when preventing resource exhaustion (too many open DB connections). Use as async with semaphore: inside each coroutine.',
      },
      {
        name: 'aiohttp',
        icon: '🌐',
        role: 'Async HTTP client/server for asyncio — replaces requests in async code.',
        detail:
          'requests is synchronous and blocks the event loop — never use it inside async def. aiohttp provides async HTTP with aiohttp.ClientSession() as the async context manager. Use async with session.get(url) as resp: for non-blocking HTTP. A single ClientSession should be reused across requests for connection pooling.',
      },
      {
        name: 'run_in_executor()',
        icon: '🔄',
        role: 'Run blocking synchronous code in a thread pool without blocking event loop.',
        detail:
          'asyncio.get_event_loop().run_in_executor(None, sync_fn, args) runs sync_fn in a ThreadPoolExecutor and returns an awaitable. Use when you must call a blocking library (database driver, file I/O) from async code. Pass None to use the default executor. Returns a Future that resolves when the thread completes.',
      },
    ],
    a: {
      v: 'Single waiter at a restaurant',
      t: 'asyncio is like a single exceptionally efficient waiter. They take order 1, walk to the kitchen (I/O wait), while the kitchen cooks they take order 2, walk back to check on order 1, deliver order 1, take order 3... The waiter never stands idle waiting for the kitchen. With threading, you hire multiple waiters — more expensive, potential coordination problems. asyncio is one waiter who never blocks.',
      tx: 'The waiter analogy shows why asyncio excels for I/O: the waiting (network, disk) is done by the OS, not the waiter. The waiter (event loop) switches tasks at every await point. If the waiter does CPU-heavy work (long synchronous code), they block and all other orders wait.',
      s: 'Your API needs to call 100 external services to build a response. With asyncio.gather(), all 100 HTTP requests start simultaneously — total time is max(individual times), not sum. With synchronous code, total time is sum(individual times). asyncio gives you request parallelism on a single thread.',
    },
    te: {
      def: 'asyncio is Python\'s event-loop-based concurrency framework. Coroutines (async def) run on a single thread and yield control at await points, allowing the event loop to run other coroutines during I/O waits. It enables high-concurrency I/O without threads or processes.',
      types: [
        {
          n: 'Coroutine',
          d: 'async def function. Must be awaited or scheduled. Suspends at await points. Memory efficient — one call stack per coroutine.',
        },
        {
          n: 'Task',
          d: 'asyncio.create_task() wraps a coroutine. Runs concurrently in the background. Can be awaited or cancelled.',
        },
        {
          n: 'Future',
          d: 'Low-level awaitable representing a result that will be available later. Tasks wrap Futures. run_in_executor returns a Future.',
        },
      ],
      when: 'Use asyncio for I/O-bound concurrency: HTTP requests, database queries, file I/O, message queues. Use when you need thousands of concurrent connections with low memory overhead. Do NOT use for CPU-bound work — asyncio does not bypass the GIL and long synchronous code blocks all other coroutines. Use run_in_executor() to offload blocking code.',
      trade:
        'asyncio requires the entire call stack to be async — one synchronous blocking call blocks the whole event loop (no other coroutines run). "Async contagion": if a function needs to await something, it must be async, and its caller must be async, all the way up. Debugging is harder — tracebacks look different. Error handling requires care with gather(return_exceptions=True).',
      code: `import asyncio
import aiohttp

# ── Parallel HTTP requests with aiohttp + asyncio.gather() ───────────────────

async def fetch(session, url):
    async with session.get(url) as resp:
        return await resp.json()

async def fetch_all(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
    return results

urls = ['https://api.example.com/user/1', 'https://api.example.com/user/2']
results = asyncio.run(fetch_all(urls))  # all requests run concurrently

# ── Semaphore: limit to 10 concurrent requests ────────────────────────────────

async def fetch_with_limit(session, url, semaphore):
    async with semaphore:      # blocks if 10 requests already in flight
        async with session.get(url) as resp:
            return await resp.text()

async def fetch_limited(urls):
    semaphore = asyncio.Semaphore(10)  # at most 10 concurrent
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_with_limit(session, url, semaphore) for url in urls]
        return await asyncio.gather(*tasks)

# ── run_in_executor: call blocking sync code from async context ───────────────

import time

def blocking_db_call(query):
    time.sleep(0.5)  # simulates a synchronous DB driver
    return {'result': query}

async def async_handler():
    loop = asyncio.get_event_loop()
    # Runs in ThreadPoolExecutor -- event loop stays free for other coroutines
    result = await loop.run_in_executor(None, blocking_db_call, 'SELECT 1')
    return result

# ── Async context manager ─────────────────────────────────────────────────────

class AsyncDB:
    async def __aenter__(self):
        self.conn = await connect_db()
        return self.conn

    async def __aexit__(self, exc_type, exc, tb):
        await self.conn.close()

async def main():
    async with AsyncDB() as db:
        result = await db.query('SELECT 1')`,
      rw: {
        ex: [
          'FastAPI is built on asyncio — async def route handlers run concurrently, handling thousands of simultaneous requests on a single process',
          'aioredis provides async Redis client — critical for using Redis in async applications without blocking the event loop',
          'SQLAlchemy 2.0 supports async sessions (async_session) for non-blocking database access in asyncio applications',
          'Celery 5+ integrates with asyncio via asyncio task executor for async task functions',
        ],
        cs: 'Discord\'s Python bot framework (discord.py) is built entirely on asyncio — a single bot instance handles thousands of concurrent Discord events using one thread and one event loop. The bot listens for events (messages, reactions) and dispatches them as coroutines. Understanding asyncio is essential to writing Discord bots that do not freeze when one event handler is slow.',
      },
    },
    interview: {
      q: 'What is the difference between asyncio and threading? How do you limit concurrency in asyncio? How do you call a sync function from async context?',
      a: 'asyncio vs threading: both provide concurrency for I/O-bound work, but with different mechanisms. asyncio is single-threaded — coroutines cooperatively yield control at await points on a single OS thread. threading uses multiple OS threads that the OS preemptively schedules. asyncio is more memory-efficient (coroutines are cheaper than threads), handles thousands of concurrent tasks easily, and avoids race conditions (single-threaded). Threading is simpler to add to existing synchronous code and works with synchronous libraries without modification. asyncio requires "async all the way down" — you cannot await from synchronous code.\n\nLimiting concurrency: use asyncio.Semaphore(n). Create the semaphore once, then use "async with semaphore:" inside each coroutine. At most n coroutines will be inside the block simultaneously; others await the semaphore release.\n\nCalling sync from async: use await loop.run_in_executor(None, sync_fn, args). This runs the sync function in a ThreadPoolExecutor (default executor when None is passed) and returns an awaitable. The event loop continues running other coroutines while the thread executes the blocking code.',
      fu: [
        'What happens if you call a blocking function (like requests.get) inside an async function?',
        'What is the difference between asyncio.gather() and asyncio.wait()?',
        'How do you handle exceptions from asyncio.gather()?',
        'What is an async generator and when would you use one?',
      ],
    },
  },

  // ─── PYTHON DATA MODEL ───────────────────────────────────────────────────────

  {
    id: 'py-data-model',
    cat: 'python',
    color: '#3776ab',
    icon: '🐍',
    title: 'Python Data Model',
    tag: 'Dunder methods let your objects work with Python\'s built-in operators and protocols',
    overview:
      'The Python data model is the set of protocols (interfaces defined by dunder/magic methods) that allow user-defined objects to integrate with Python\'s built-in operations. __repr__ and __str__ control string representation. __len__ and __getitem__ implement the sequence protocol — which also makes the object iterable for free. __enter__ and __exit__ implement the context manager protocol (with statement). __call__ makes instances callable. __eq__ and __hash__ control equality and dictionary key behavior. __slots__ replaces the per-instance __dict__ with a fixed set of attributes, significantly reducing memory usage for many-instance objects.',
    components: [
      {
        name: '__repr__ / __str__',
        icon: '🖨️',
        role: '__repr__ for unambiguous representation; __str__ for human-readable output.',
        detail:
          '__repr__ should return a string that (ideally) could recreate the object: "Point(x=1, y=2)". Used in the REPL, repr(), and as fallback when __str__ is absent. __str__ is for end-user display: "Point at (1, 2)". str() and print() call __str__ first, then fall back to __repr__. Always define __repr__ — it is the minimum useful representation.',
      },
      {
        name: '__len__ / __getitem__ (sequence protocol)',
        icon: '📏',
        role: 'Implement len() and indexing — also makes the object iterable.',
        detail:
          'Implementing __len__(self) and __getitem__(self, index) gives you len(), indexing (obj[0]), and automatic iteration (for x in obj) without implementing __iter__. Python calls __getitem__ with sequential integers starting at 0 until IndexError is raised. Also enables slicing if you handle slice objects in __getitem__.',
      },
      {
        name: '__enter__ / __exit__ (context manager)',
        icon: '🔐',
        role: 'Implement the with statement protocol — guaranteed cleanup.',
        detail:
          '__enter__ runs at the start of the with block and its return value is bound to the as variable. __exit__(self, exc_type, exc_val, tb) runs on exit, even if an exception occurred. Return True from __exit__ to suppress the exception; return None/False to let it propagate. Prefer @contextlib.contextmanager for simple cases.',
      },
      {
        name: '__call__',
        icon: '📞',
        role: 'Makes instances callable like functions.',
        detail:
          'Implementing __call__ allows instances to be used as fn(args). Useful for classes that maintain state between calls (like a stateful function), decorators implemented as classes, and callable objects that benefit from being configurable (e.g., a configured validator). callable(obj) returns True if obj has __call__.',
      },
      {
        name: '__slots__',
        icon: '💾',
        role: 'Replaces per-instance __dict__ — reduces memory significantly.',
        detail:
          'By default, each Python instance has a __dict__ (a dict) storing its attributes — overhead of ~200-400 bytes even for simple objects. __slots__ = ("x", "y") tells Python to use a fixed array instead of a dict, eliminating the per-instance __dict__. Result: 40-50% less memory per instance. Trade-off: cannot add attributes not in __slots__; no __dict__, so no dynamic attribute assignment.',
      },
      {
        name: '__eq__ / __hash__ (equality and hashing)',
        icon: '🔑',
        role: 'Control equality comparison and use as dictionary keys or set members.',
        detail:
          '__eq__ defines == behavior. Defining __eq__ without __hash__ causes Python to set __hash__ = None, making instances unhashable (cannot be dict keys or set members). If two objects are equal (__eq__), they must have the same hash. When you define __eq__, always consider defining __hash__ = hash of the same fields used for equality.',
      },
    ],
    a: {
      v: 'Universal power adapter',
      t: 'Dunder methods are like adapter pins on a universal power adapter. Python\'s built-in operations (len, print, with, in, +) are the sockets. Dunder methods are the pins that let your custom object plug into any socket. A class with __len__ plugs into the len() socket. A class with __add__ plugs into the + socket. You choose which sockets to support.',
      tx: 'The adapter analogy explains why Python feels so uniform — str, list, dict, and your custom class all plug into the same sockets. Protocol-based design (duck typing) means anything that has the right pins works, regardless of inheritance hierarchy.',
      s: 'Your custom DataFrame-like class implements __len__ and __getitem__, so it automatically works with len(), indexing, for loops, and any function that accepts iterables — without inheriting from list or implementing __iter__ separately.',
    },
    te: {
      def: 'The Python data model is a system of protocols defined by dunder (__x__) methods. Implementing these methods integrates user-defined objects with Python\'s built-in operators, functions, and statements. It is the foundation of Python\'s duck typing: if your object has the right dunder methods, it works anywhere that protocol is expected.',
      types: [
        {
          n: 'Sequence protocol',
          d: '__len__ + __getitem__ — enables len(), indexing, slicing, and iteration. Optionally add __contains__ for "in" operator and __reversed__.',
        },
        {
          n: 'Context manager protocol',
          d: '__enter__ + __exit__ — enables with statement, guaranteed cleanup, exception handling in __exit__.',
        },
        {
          n: 'Numeric protocol',
          d: '__add__, __mul__, __sub__, __truediv__, __radd__ (reflected operations) — enables arithmetic operators with custom types.',
        },
      ],
      when: 'Implement dunder methods when: you want your class to feel like a native Python type, you need guaranteed resource cleanup (context manager), you want to reduce memory for many instances (__slots__), or you need correct equality/hashing for use in dicts and sets.',
      trade:
        '__slots__ saves memory but removes flexibility — you cannot add arbitrary attributes or use __weakref__ (add "__weakref__" to __slots__ explicitly if needed). Subclasses of __slots__ classes must also define __slots__ to benefit. __eq__ without __hash__ makes objects unhashable — if you define __eq__, always explicitly decide on __hash__ (set it or implement it).',
      code: `# ── Custom container: __len__ + __getitem__ gives iteration for free ──────────

class ReadOnlyList:
    __slots__ = ('_data',)      # no __dict__ -- memory efficient

    def __init__(self, data):
        self._data = list(data)

    def __repr__(self):
        return f'ReadOnlyList({self._data!r})'

    def __len__(self):
        return len(self._data)

    def __getitem__(self, index):
        return self._data[index]   # slice support comes free from list

rol = ReadOnlyList([1, 2, 3])
print(len(rol))          # 3  -- __len__
print(rol[1])            # 2  -- __getitem__
for x in rol: print(x)  # iteration free from __getitem__ + __len__
print(2 in rol)          # True -- __contains__ falls back to iteration

# ── Context manager: __enter__ / __exit__ ────────────────────────────────────

class Timer:
    def __enter__(self):
        import time
        self._start = time.perf_counter()
        return self   # bound to 'as t'

    def __exit__(self, exc_type, exc_val, tb):
        import time
        self.elapsed = time.perf_counter() - self._start
        print(f'Elapsed: {self.elapsed:.3f}s')
        return False  # do not suppress exceptions

with Timer() as t:
    sum(range(1_000_000))
print(t.elapsed)   # access elapsed after the block

# ── __slots__ reducing memory ─────────────────────────────────────────────────

import sys

class PointDict:          # default: has __dict__
    def __init__(self, x, y):
        self.x = x
        self.y = y

class PointSlots:         # with __slots__: no __dict__
    __slots__ = ('x', 'y')
    def __init__(self, x, y):
        self.x = x
        self.y = y

print(sys.getsizeof(PointDict(1, 2)))   # ~48 bytes + __dict__ ~200 bytes
print(sys.getsizeof(PointSlots(1, 2)))  # ~56 bytes total

# ── __eq__ + __hash__: the rule ───────────────────────────────────────────────

class Point:
    __slots__ = ('x', 'y')

    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __hash__(self):
        # Must hash same fields as __eq__ -- equal objects need equal hashes
        return hash((self.x, self.y))

p1 = Point(1, 2)
p2 = Point(1, 2)
print(p1 == p2)           # True
print(p1 is p2)           # False (different objects)
seen = {p1}
print(p2 in seen)         # True -- works because __hash__ matches __eq__`,
      rw: {
        ex: [
          'pandas DataFrame implements __len__, __getitem__, and __iter__ — that\'s why it works with len(), df[col], and for col in df',
          'pathlib.Path implements __truediv__ for the / operator — Path("/usr") / "bin" / "python" works via __truediv__',
          'contextlib.contextmanager decorator turns a generator into a context manager without defining a class',
          '@dataclass automatically generates __repr__, __eq__, and optionally __hash__ and __slots__ from class fields',
        ],
        cs: 'SQLAlchemy\'s ORM model classes use descriptors (the descriptor protocol) to turn class-level Column() objects into per-instance attribute accessors. When you write user.name, Python calls Column.__get__(user, User) which intercepts the attribute access and builds SQL. Understanding __get__/__set__/__delete__ (the descriptor protocol) is how Python implements @property, @classmethod, and ORMs like SQLAlchemy.',
      },
    },
    interview: {
      q: 'What happens if you define __eq__ but not __hash__? What are __slots__? What is the descriptor protocol?',
      a: 'If you define __eq__ without __hash__, Python sets __hash__ = None on your class, making instances unhashable. This means you cannot use them as dictionary keys or add them to sets — you\'ll get TypeError: unhashable type. The reason: if two objects are equal, they must have the same hash (mathematical requirement for hash-based data structures). If you define custom equality but not hashing, Python cannot guarantee this invariant, so it errs on the side of safety. Fix: define __hash__ using the same fields you use in __eq__ (e.g., hash(self.id)).\n\n__slots__ is a class variable that replaces the per-instance __dict__ with a fixed-slot array. By default, every Python instance carries a __dict__ (a dictionary) to store its attributes — overhead of ~200-400 bytes. __slots__ = ("x", "y") tells Python to use a compact C array instead. Result: 40-50% memory reduction per instance. Cost: you cannot add attributes not listed in __slots__; no __dict__ means no dynamic attribute assignment or __weakref__ by default.\n\nThe descriptor protocol: an object that defines __get__, __set__, or __delete__ is a descriptor. When a descriptor is a class attribute, Python calls __get__(instance, owner) instead of returning the descriptor object itself. @property, @classmethod, @staticmethod, and ORM Column objects are all descriptors. It is the mechanism Python uses to intercept attribute access at the class level and customize it per instance.',
      fu: [
        'How would you make a class that is hashable and mutable?',
        'What is __init_subclass__ and when would you use it?',
        'How does @dataclass generate __hash__ — when is frozen=True needed?',
        'What is __missing__ in dict subclasses?',
      ],
    },
  },
];

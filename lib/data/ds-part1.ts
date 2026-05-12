import { Concept } from '../types';

export const DS_PART1: Concept[] = [
  // ─────────────────────────────────────────────────────────────────
  // 1. ARRAYS & DYNAMIC ARRAYS
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ds-array',
    cat: 'dsa',
    color: '#10b981',
    icon: '📊',
    title: 'Arrays & Dynamic Arrays',
    tag: 'Contiguous memory — the foundation every other structure builds on',
    overview:
      'Arrays are the most fundamental data structure — a contiguous block of memory where every element sits at a fixed offset from the base address. Random access is O(1) because address = base + index × element_size. Dynamic arrays (JavaScript\'s Array, Python\'s list, Java\'s ArrayList) grow by doubling capacity when full — amortized O(1) append despite occasional O(n) copy. Understanding the memory model is what separates engineers who use arrays from those who design systems around them.',
    components: [
      {
        name: 'Memory Layout',
        icon: '🧱',
        role: 'Contiguous allocation — the source of O(1) access and cache dominance.',
        detail:
          'Contiguous allocation means cache lines are fully utilised. Iterating an array is 10-100× faster than a linked list of the same size because CPU prefetching works perfectly. Element at index i: address = base_ptr + i * sizeof(element). For JS, V8 uses typed arrays for numeric arrays (PACKED_SMI_ELEMENTS) and falls back to HOLEY_ELEMENTS when holes appear — hole creation via delete arr[i] kills this optimisation permanently.',
      },
      {
        name: 'Dynamic Resizing',
        icon: '📈',
        role: 'Amortized O(1) append via doubling strategy.',
        detail:
          'When capacity is exhausted, allocate 2× buffer, copy all elements, free old buffer. Total copies after n insertions = n/2 + n/4 + ... + 1 < n. Amortized cost per insert = O(1). The growth factor matters: 1.5× wastes less memory than 2× but copies more often. Java\'s ArrayList uses 1.5×; most others use 2×.',
      },
      {
        name: 'Slice & Splice Internals',
        icon: '✂️',
        role: 'The hidden O(n) operations that surprise engineers at scale.',
        detail:
          'Array.slice creates a shallow copy in O(k). Array.splice at index i shifts n-i elements — O(n). Unshift shifts every element right — O(n). This is why prepend-heavy workloads should use a deque or linked list.',
      },
      {
        name: 'TypedArrays',
        icon: '🔢',
        role: 'Fixed-type, zero-boxing buffers for numerical workloads.',
        detail:
          'Float64Array, Int32Array, Uint8Array: fixed-size, fixed-type, backed by ArrayBuffer. No boxing overhead. WebAssembly interop. SIMD-friendly. Use for numerical computation, image processing, binary protocol parsing.',
      },
    ],
    howItWorks:
      'At the hardware level, array access is a single address computation: base_ptr + index × element_size. On a 64-bit system with 8-byte values, element 4 is always at base + 32. The CPU\'s L1 cache line is typically 64 bytes — an array of 8 doubles fills exactly one cache line. When you iterate sequentially, the hardware prefetcher detects the stride and loads the next cache line before you need it. A linked list of the same size forces a pointer dereference at every node, each potentially a cache miss costing 100-300 ns.\n\nThe amortized O(1) proof for dynamic array growth: define the potential Φ = 2 * (size - capacity/2) after each operation. The actual cost of a non-resizing push is 1; the amortized cost is 1 + ΔΦ = 1 + 2 = 3 = O(1). For a resizing push: actual cost is n (copy) + 1 (insert); after resize, size = n+1, capacity = 2n, so Φ drops from 2*(n - n/2) = n to 2*((n+1) - n) = 2. Amortized = (n+1) + (2 - n) = 3 = O(1). The doubling strategy ensures each element is copied at most O(log n) times across the lifetime of the array.\n\nV8\'s element kind system has a one-way degradation path: PACKED_SMI_ELEMENTS (all small integers, densely packed) → PACKED_DOUBLE_ELEMENTS (floating point added) → PACKED_ELEMENTS (objects mixed in) → HOLEY_SMI_ELEMENTS → HOLEY_DOUBLE_ELEMENTS → HOLEY_ELEMENTS. Each step right disables optimisations. The critical failure mode: once you create holes (delete arr[i], or arr[100] = x with nothing in between), V8 switches to HOLEY mode permanently for that array — all operations slow 3-10×. Use arr[i] = undefined instead of delete to avoid holes while still clearing the value.\n\nFor copying arrays: arr.slice(0) and [...arr] are both O(n) shallow copies. Array.from(arr) is slightly slower due to generic iteration protocol overhead. For numeric data, TypedArray.from(arr) outperforms all of them by 5-10× because it avoids boxing each number into a JS heap object.',
    decision: {
      choose: [
        'Random access by index — O(1) lookups required',
        'Iteration-heavy algorithms where cache locality dominates runtime',
        'When you know the upper bound upfront — pre-allocate and avoid resize overhead',
        'TypedArrays for numeric data pipelines, WebGL buffers, binary protocol parsing',
        'Cache-friendly sequential processing (matrix operations, sorting algorithms)',
      ],
      avoid: [
        'Frequent insertion or deletion in the middle — every op is O(n) element shift',
        'Prepend-heavy workloads — unshift is O(n); use a deque or circular buffer',
        'When keys are non-integer or sparse — use Map or object as a dictionary',
        'When worst-case latency matters and O(n) resize spikes are unacceptable — use pre-sized arrays',
      ],
      vs: [
        {
          name: 'Array vs LinkedList',
          when: 'Array wins on iteration speed (10-100×) and random access (O(1) vs O(n)). LinkedList wins only on O(1) insert/delete at a known pointer position — which is rare in practice.',
        },
        {
          name: 'Array vs Map',
          when: 'Use Array when keys are sequential integers and the range is bounded. Use Map for arbitrary key types, sparse mappings, or when key ordering is not required.',
        },
      ],
    },
    failures: [
      {
        name: 'HOLEY array performance cliff',
        cause: 'delete arr[i] or sparse initialisation (arr[1000] = x with no prior elements) triggers HOLEY_ELEMENTS in V8.',
        symptom: 'Array operations are 3-10× slower than equivalent dense arrays; devtools shows ElementsKind as HOLEY.',
        fix: 'Use arr[i] = undefined instead of delete to preserve density. If building from scratch, always push() sequentially. Use Array.from({length: n}, () => defaultVal) for pre-allocated dense arrays.',
        severity: 'high',
      },
      {
        name: 'Off-by-one in slice-based windows',
        cause: 'arr.slice(i, j) is [i, j) — j is exclusive. Engineers porting from inclusive-range languages (Ruby, Lua) write slice(i, j+1) inconsistently.',
        symptom: 'Sliding window or subarray results are one element short or include an extra element; boundary test cases fail silently.',
        fix: 'Establish consistent slice semantics in the codebase. Document [inclusive, exclusive) at every call site. Write unit tests explicitly at boundary indices 0, 1, n-2, n-1.',
        severity: 'medium',
      },
      {
        name: 'Mutation during iteration',
        cause: 'Calling arr.splice() inside a forEach or for...of loop changes indices mid-iteration.',
        symptom: 'Some elements are skipped or processed twice; bugs are timing-sensitive and hard to reproduce.',
        fix: 'Collect indices to remove, then splice in reverse order after iteration. Or iterate over a shallow copy (arr.slice()). Or use arr.filter() to build a new array instead of mutating.',
        severity: 'high',
      },
    ],
    a: {
      v: 'A street of numbered houses',
      t: 'A city block',
      tx: 'Every house on the block has an address calculated from the block\'s start: house 0 is at the corner, house i is exactly i doors down. The postman never has to search — he computes the address instantly. Adding a new house means the whole block relocates to a bigger street (dynamic resize). Tearing one house down and leaving a gap (delete) makes the numbering system break — the postman still goes to the gap and finds nothing.',
      s: 'Contiguous memory = instant index lookup + cache perfection',
    },
    te: {
      def: 'An array is a contiguous block of memory divided into equal-size slots, each accessible by index in O(1) via address arithmetic. A dynamic array wraps a fixed array with an auto-resize policy (typically 2× growth) to support unbounded append at amortized O(1).',
      types: [
        { n: 'Static Array', d: 'Fixed-capacity, fixed-type. Size declared at creation. Used when upper bound is known — stack frames, ring buffers, lookup tables.' },
        { n: 'Dynamic Array', d: 'Resizable. Backed by a static array that doubles when full. JS Array, Python list, Java ArrayList. Amortized O(1) append.' },
        { n: 'Circular Buffer', d: 'Fixed array with head/tail indices that wrap around. O(1) push/pop at both ends without shifting. Used for queues, sliding windows, audio buffers.' },
        { n: 'TypedArray', d: 'Float64Array, Int32Array, Uint8Array etc. Backed by ArrayBuffer. Fixed element type, no boxing overhead. 5-10× faster than JS Array for numeric work.' },
        { n: '2D Array (row-major vs col-major)', d: 'Row-major: matrix[r][c] = base + (r * cols + c) * size. Col-major (Fortran/Julia): matrix[r][c] = base + (c * rows + r) * size. Iterating against the storage order causes cache thrashing — a 1000×1000 matrix transposed col-by-col vs row-by-row can differ 10× in time.' },
      ],
      when: 'Default choice for ordered collections. Use whenever you need O(1) random access, sequential iteration, or cache-friendly processing. Switch to a different structure only when profiling reveals a bottleneck specific to shifting, prepending, or non-integer keying.',
      trade: 'O(1) access and iteration speed are unmatched. The cost: O(n) insert/delete in the middle (element shift), O(n) worst-case resize (amortized O(1)), and no support for non-integer keys. Memory is contiguous — great for cache, bad if you need to grow without a contiguous block available.',
      code: `// ─── Dynamic Array — explicit resize logic ───────────────────────────────────
// Shows exactly what JS Array.push does under the hood.
// Production code uses the native Array, but understanding this is essential.

class DynamicArray {
  constructor() {
    this._capacity = 4;        // start small — resize will happen fast in tests
    this._size = 0;
    // Typed storage: Float64Array for zero-boxing overhead on numbers.
    // For a generic version, use a plain Array and accept boxing cost.
    this._buf = new Float64Array(this._capacity);
  }

  get size() { return this._size; }
  get capacity() { return this._capacity; }

  // O(1) amortized — resize is O(n) but triggered at most every 2^k pushes
  push(val) {
    if (this._size === this._capacity) this._resize();
    this._buf[this._size++] = val;
  }

  // O(1) — no deallocation needed; just decrement size
  pop() {
    if (this._size === 0) throw new RangeError('pop from empty array');
    return this._buf[--this._size];
  }

  // O(1) — direct index arithmetic: base_ptr + index * 8 (Float64 = 8 bytes)
  get(i) {
    if (i < 0 || i >= this._size) throw new RangeError(\`index \${i} out of bounds\`);
    return this._buf[i];
  }

  set(i, val) {
    if (i < 0 || i >= this._size) throw new RangeError(\`index \${i} out of bounds\`);
    this._buf[i] = val;
  }

  // O(n) — must shift all elements after i to the right
  insert(i, val) {
    if (i < 0 || i > this._size) throw new RangeError(\`index \${i} out of bounds\`);
    if (this._size === this._capacity) this._resize();
    // copyWithin is faster than a manual loop: uses memmove internally
    this._buf.copyWithin(i + 1, i, this._size);
    this._buf[i] = val;
    this._size++;
  }

  // O(n) — must shift all elements after i to the left
  delete(i) {
    if (i < 0 || i >= this._size) throw new RangeError(\`index \${i} out of bounds\`);
    const val = this._buf[i];
    this._buf.copyWithin(i, i + 1, this._size);
    this._size--;
    return val;
  }

  // O(n) — allocate 2x, copy, discard old buffer
  // The critical invariant: total copy work across ALL resizes < 2n (geometric series)
  _resize() {
    this._capacity *= 2;
    const next = new Float64Array(this._capacity);
    next.set(this._buf);     // typed array bulk copy — faster than element-by-element
    this._buf = next;
    // old buffer is eligible for GC; no manual free needed in JS
  }

  toArray() {
    return Array.from(this._buf.subarray(0, this._size));
  }
}

// ─── V8 element kind demo — DO NOT create holes ──────────────────────────────

// GOOD: dense array, V8 uses PACKED_SMI_ELEMENTS (fastest)
const dense = [];
for (let i = 0; i < 10; i++) dense.push(i);

// BAD: hole creation permanently degrades to HOLEY_ELEMENTS
const holey = [1, 2, 3];
delete holey[1];       // now [1, empty, 3] — all future ops on holey are slower
// Fix: use undefined assignment instead
const correct = [1, 2, 3];
correct[1] = undefined; // [1, undefined, 3] — dense, no hole, still PACKED

// ─── Row-major iteration — cache-correct matrix traversal ────────────────────
// For a row-major layout (C, JS), always iterate row-outer, col-inner.
// Swapping the loops causes a cache miss on every inner iteration (stride = n).

function sumMatrix(matrix, rows, cols) {
  let total = 0;
  // Correct: inner loop moves through consecutive memory addresses
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      total += matrix[r * cols + c];
    }
  }
  return total;
}`,
      rw: {
        ex: [
          'V8 PACKED_SMI_ELEMENTS: numeric arrays built with push() are stored as unboxed integer arrays internally — no heap allocation per element, enabling vectorised JIT code.',
          'React\'s reconciler uses flat arrays of fiber nodes internally. Keyed lists are diffed with a Map<key, fiber> but the render order is maintained in array form for O(1) index access.',
          'Node.js Buffer is a Uint8Array backed by an ArrayBuffer — binary protocol parsing (HTTP/2 frames, protobuf) reads fixed-offset fields directly via index arithmetic at native speed.',
          'Databases store fixed-width column data as contiguous typed arrays (columnar storage engines like DuckDB, ClickHouse) — SIMD operations process 8-16 values per instruction cycle.',
        ],
        cs: 'V8\'s array optimisation story: when you write arr.push(42), V8 checks the element kind. If all elements so far are small integers (SMI — signed 31-bit), it keeps them in a compact unboxed representation and generates tight machine code for iteration. The moment you push a float, a string, or an object, V8 transitions to a wider element type — and the transition is one-way. Senior engineers audit their hot-path arrays with %DebugPrint(arr) in V8 debug builds or use the Node.js --allow-natives-syntax flag to verify element kinds stay packed and typed in performance-critical code.',
      },
    },
    interview: {
      q: 'Explain amortized O(1) insertion for a dynamic array and why the growth factor is typically 2×.',
      a: 'Each insert is O(1) when below capacity. On overflow, we copy n elements to a 2× buffer — O(n) actual cost. But after resize we have n free slots before the next resize. Amortized cost per insert = total work / total inserts. Using the potential method: define Φ = 2*(size - capacity/2). Each cheap insert raises Φ by 2; the expensive resize consumes that accumulated potential. Amortized cost = 3 = O(1). Growth factor 2× is chosen because the geometric series n/2 + n/4 + ... converges to n, bounding total copy work. Factor 1 would be O(n²) total; factor 1.5 reduces memory waste at the cost of more frequent copies — Java uses 1.5× as a deliberate memory-performance tradeoff.',
      fu: [
        'What are V8\'s element kinds and how does creating a hole degrade performance? (PACKED_SMI → HOLEY transition, permanent, 3-10× slowdown)',
        'When would you use a Float64Array over a regular JS Array? (numeric pipelines, zero boxing, ArrayBuffer interop, WebGL/WASM)',
        'Explain the cache performance difference between row-major and column-major iteration on a 1000×1000 matrix. (L1 cache line = 64B, stride-1 vs stride-n access patterns)',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 2. LINKED LISTS
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ds-linked-list',
    cat: 'dsa',
    color: '#10b981',
    icon: '🔗',
    title: 'Linked Lists',
    tag: 'Pointer chains — O(1) insert anywhere, O(n) to find it',
    overview:
      'A linked list stores elements in nodes scattered across heap memory, each node holding a value and a pointer to the next node. There is no contiguous layout — the CPU prefetcher is blind. Random access is O(n). But insertion and deletion at a known pointer position is O(1) — no element shifting. The tradeoff between linked lists and arrays is fundamentally a tradeoff between pointer-following cost and element-shifting cost. In modern CPUs with deep cache hierarchies, pointer-following is expensive — linked lists are often slower than arrays in practice even when their asymptotic complexity looks better.',
    components: [
      {
        name: 'Singly Linked List',
        icon: '➡️',
        role: 'Forward-only chain — minimum memory per node.',
        detail:
          'Each node: { value, next }. Head pointer only. Traversal: O(n) always. Insert at head: O(1). Delete at head: O(1). Insert/delete at tail: O(n) without tail pointer, O(1) with. Reverse: classic three-pointer algorithm, O(n) time, O(1) space.',
      },
      {
        name: 'Doubly Linked List',
        icon: '↔️',
        role: 'Bidirectional chain — enables O(1) delete given any node reference.',
        detail:
          'Each node: { value, next, prev }. O(1) delete given any node reference (no need to find predecessor). Bidirectional traversal. Used in LRU cache (O(1) move-to-front), browser history, text editors. 2× memory per node vs singly linked.',
      },
      {
        name: 'Sentinel / Dummy Nodes',
        icon: '🛡️',
        role: 'Eliminates null-check edge cases at head and tail.',
        detail:
          'A dummy head and dummy tail node eliminate all the null-check special cases for empty list, insert-at-head, insert-at-tail. Code is dramatically cleaner. Every production linked list implementation should use sentinels.',
      },
      {
        name: 'Memory & Cache Reality',
        icon: '🐌',
        role: 'The practical performance gap no asymptotic analysis captures.',
        detail:
          'A linked list of 1M integers uses ~24 bytes/node (value 8 + next 8 + malloc overhead 8) = ~24 MB vs 8 MB for an array. Each pointer dereference can be a cache miss (100-300 ns). Traversal of a 1M linked list is often 10-50× slower than the same array despite identical O(n) complexity on paper.',
      },
    ],
    howItWorks:
      'Each node is a separate heap allocation. The "linked" part is just a pointer stored inside the node: head.next points to the second node, second.next to the third, and so on. The list has no base address — finding element k requires following k pointers from head. This is why linked lists are cache-hostile: each node can be anywhere in the heap, and each next-pointer dereference is likely a cache miss on a warm-cache machine.\n\nThe doubly linked list + hash map combination is the canonical O(1) LRU cache. The list maintains access order (most-recent at head, least-recent at tail). The map holds key → node references for O(1) lookup. On a get: look up the node in O(1), splice it out of its current position in O(1) (prev.next = node.next; node.next.prev = node.prev), and re-insert at head in O(1). On capacity overflow: delete the tail node in O(1) and remove its key from the map. Both get and put are truly O(1) — no traversal anywhere.\n\nFloyd\'s cycle detection (tortoise and hare): run two pointers, slow moving one step at a time and fast moving two steps. If a cycle exists, fast will eventually be inside the cycle while slow enters it. At that point, they are both in the cycle and fast is gaining one step per iteration — they will meet in at most cycle_length iterations. Proof of meeting: when slow enters the cycle, fast is k steps ahead inside the cycle (for some k). Each step reduces the gap by 1 (fast gains 1 step on slow). They meet after exactly (cycle_length - k % cycle_length) steps. Space complexity is O(1) — no visited set required.\n\nThe cache argument in concrete terms: a benchmark traversing a 1M-element linked list vs array on a modern CPU (L1=32KB, L2=256KB, L3=8MB, RAM latency=80ns) shows the array at ~1ns per element (L1 prefetch) and the linked list at ~50ns per element (each node a random heap address, mostly L3 or RAM hits). For 10M elements: array ~10ms, linked list ~500ms — 50× difference at the same O(n) complexity.',
    decision: {
      choose: [
        'O(1) insert/delete at a known node reference — LRU cache, OS scheduler run queue, undo history',
        'Splicing two lists together in O(1) — list concatenation is just tail.next = other.head',
        'When element count is highly variable and memory allocation fragmentation is acceptable',
        'Implementing stacks and queues when array resizing overhead is unacceptable',
      ],
      avoid: [
        'When random access is needed — O(n) traversal kills you at scale',
        'When iteration performance matters — cache misses make O(n) linked list 10-50× slower than O(n) array in practice',
        'In most application code — a plain array is almost always faster and simpler',
        'When memory is constrained — per-node overhead is 2-3× compared to an array',
      ],
      vs: [
        {
          name: 'vs Array',
          when: 'Array wins on access speed (O(1) vs O(n)), cache locality (sequential vs random heap), and memory efficiency. LinkedList wins only when O(1) insert/delete at a specific pointer matters more than everything else.',
        },
        {
          name: 'vs Deque',
          when: 'A deque gives O(1) push/pop at both ends with better cache performance than a doubly linked list. Use deque for queue/stack workloads; use linked list only when you need O(1) insert/delete in the middle.',
        },
      ],
    },
    failures: [
      {
        name: 'Losing the head pointer during reverse',
        cause: 'Assigning head = head.next before saving the old head — the reference to the original list is gone.',
        symptom: 'List is truncated to the last node seen; all previous nodes are leaked (or GC\'d if no other references).',
        fix: 'Always draw the before/after pointer diagram before writing the swap. Maintain three pointers explicitly: prev = null, curr = head, next = null. The standard three-pointer reverse is the only safe pattern.',
        severity: 'critical',
      },
      {
        name: 'Cycle causing infinite traversal',
        cause: 'Corrupted next pointer (double-free simulation, bug in delete, incomplete splice) creates a cycle; naive while (node) loops forever.',
        symptom: 'Process hangs; 100% CPU on the traversal thread; stack eventually OOMs if recursive.',
        fix: 'Use Floyd\'s tortoise-and-hare for detection before production traversal of untrusted lists. Always set node.next = null on the last node when building. In delete operations, null out removed node\'s next/prev before discarding.',
        severity: 'critical',
      },
      {
        name: 'Memory leak via stale references',
        cause: 'Removed nodes still hold references in external code (cached node references in the LRU map after eviction) — GC cannot collect.',
        symptom: 'Heap grows unboundedly; heap snapshots show linked list nodes that should have been freed still in old-gen.',
        fix: 'On node removal, null out node.next and node.prev. Delete the map entry simultaneously with list eviction in LRU. Treat node lifecycle as the canonical reference — when the node leaves the list, all external references should be dropped.',
        severity: 'high',
      },
    ],
    a: {
      v: 'A treasure hunt with clues',
      t: 'A scavenger hunt',
      tx: 'Each clue tells you where the next clue is hidden — you cannot jump to clue 7 without following the chain from clue 1. But taping a new clue anywhere in the chain just requires changing two pieces of paper, not rewriting all of them. Arrays are the address book where you look up any name directly; linked lists are the scavenger hunt where you always start at the beginning.',
      s: 'O(1) insert at pointer; O(n) access — cache-hostile',
    },
    te: {
      def: 'A linked list is a sequence of heap-allocated nodes where each node stores a value and one or two pointers to adjacent nodes. No contiguous memory, no index arithmetic — traversal is always pointer-following from the head.',
      types: [
        { n: 'Singly Linked', d: 'Each node has value + next. O(1) head insert/delete. O(n) tail access without tail pointer. Minimum memory.' },
        { n: 'Doubly Linked', d: 'Each node has value + next + prev. O(1) delete given any node. Required for LRU cache. 2× memory per node.' },
        { n: 'Circular', d: 'Last node\'s next points to head (and/or head\'s prev points to tail). No null terminator. Used in round-robin schedulers. Traversal needs a sentinel or visited check.' },
        { n: 'Skip List', d: 'Probabilistic multi-level linked list. O(log n) average search/insert/delete. Used in Redis sorted sets. Comparable to balanced BST but simpler to implement lock-free.' },
      ],
      when: 'When you need O(1) insert/delete at a specific position given a node reference, and you can afford O(n) access. The canonical use case is the LRU cache backbone. In all other cases, profile before choosing over an array.',
      trade: 'Pointer-following is cache-hostile — each node access is potentially a cache miss. Memory overhead is 2-3× compared to arrays. But splice and delete at a known pointer are O(1) without element shifting. The real cost is not in the O notation — it\'s in the constant factor from cache misses.',
      code: `// ─── Doubly Linked List with sentinel nodes ──────────────────────────────────
// Sentinels eliminate ALL null-check branches: head.next is always valid,
// tail.prev is always valid. This is how production implementations look.

class ListNode {
  constructor(val) {
    this.val = val;
    this.next = null;
    this.prev = null;
  }
}

class DoublyLinkedList {
  constructor() {
    // Sentinel nodes: never hold real data, never removed
    this.head = new ListNode(null); // dummy head
    this.tail = new ListNode(null); // dummy tail
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.size = 0;
  }

  // Insert node immediately after a given node — O(1)
  // This is the core primitive that all other operations use
  _insertAfter(node, newNode) {
    newNode.prev = node;
    newNode.next = node.next;
    node.next.prev = newNode;
    node.next = newNode;
    this.size++;
  }

  // Remove a node — O(1) given the node reference (no traversal needed)
  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    // Null out pointers to help GC and prevent dangling reference bugs
    node.next = null;
    node.prev = null;
    this.size--;
    return node.val;
  }

  push(val) { this._insertAfter(this.tail.prev, new ListNode(val)); }
  pop()      { if (this.size === 0) return undefined; return this._remove(this.tail.prev); }
  unshift(val) { this._insertAfter(this.head, new ListNode(val)); }
  shift()    { if (this.size === 0) return undefined; return this._remove(this.head.next); }

  toArray() {
    const result = [];
    let cur = this.head.next;
    while (cur !== this.tail) { result.push(cur.val); cur = cur.next; }
    return result;
  }
}

// ─── LRU Cache — the canonical O(1) get+put implementation ───────────────────
// Uses DoublyLinkedList (above) as the order backbone + Map for O(1) lookup.
// Most-recently-used = head.next side; least-recently-used = tail.prev side.

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();   // key → ListNode
    this.list = new DoublyLinkedList();
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    // Move to front = remove from current position + insert at head
    this.list._remove(node);
    this.list._insertAfter(this.list.head, node);
    this.list.size++; // _remove decremented, _insertAfter incremented — net zero
    return node.val.value;
  }

  put(key, value) {
    if (this.map.has(key)) {
      // Update existing: move to front and update value
      const node = this.map.get(key);
      node.val = { key, value };
      this.list._remove(node);
      this.list._insertAfter(this.list.head, node);
      this.list.size++;
      return;
    }
    // Evict LRU if at capacity
    if (this.list.size === this.capacity) {
      const lru = this.list.tail.prev;
      this.map.delete(lru.val.key);
      this.list._remove(lru);
    }
    const node = new ListNode({ key, value });
    this.list._insertAfter(this.list.head, node);
    this.map.set(key, node);
  }
}

// ─── Floyd's cycle detection ──────────────────────────────────────────────────
// O(n) time, O(1) space — no visited Set needed.
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    // fast gains 1 step on slow per iteration; they meet iff a cycle exists
    if (slow === fast) return true;
  }
  return false; // fast hit null — no cycle
}`,
      rw: {
        ex: [
          'LRU Cache: every major caching system (Redis, CPU L1/L2 eviction, browser cache) implements LRU with a doubly linked list + hash map for O(1) get and put.',
          'Browser history: doubly linked list with current-page pointer. Back = prev, Forward = next. New navigation truncates the forward list.',
          'Text editor rope structure: a doubly linked list of text chunks enables O(1) cursor movement and O(1) character insert/delete at cursor position.',
          'Node.js event emitter listener list: listeners for each event are stored in a singly linked list — O(1) add listener, O(n) remove (must find and splice).',
        ],
        cs: 'The Linux kernel\'s list_head is an intrusive doubly linked list: instead of wrapping your data in a node struct, you embed a list_head struct inside your own struct and use container_of() macro to recover the parent. This means one data structure can be simultaneously on multiple lists with no allocation overhead — a process can be on the run queue, the wait queue, and the children list all at once using embedded list_head fields. This is the canonical example of a production intrusive linked list.',
      },
    },
    interview: {
      q: 'Implement an LRU cache with O(1) get and O(1) put. Walk me through your data structure choice.',
      a: 'Use a doubly linked list for O(1) move-to-front (requires knowing prev pointer — singly linked needs O(n) traversal to find predecessor). Use a hash map from key to node for O(1) lookup. get(key): map lookup in O(1), splice node from current position in O(1) via prev/next pointers, re-insert at head in O(1). put(key, value): if key exists, same as get but update value. If at capacity, delete tail.prev (the LRU node) in O(1) and remove its map entry. If not at capacity, create new node, insert at head, add to map. Both operations are O(1) with no traversal anywhere.',
      fu: [
        'Walk through Floyd\'s cycle detection algorithm. Prove that fast and slow pointers always meet if a cycle exists. (gap reduction argument: fast gains 1 step on slow per iteration inside the cycle)',
        'What is a skip list and why does Redis use it for sorted sets instead of a balanced BST? (O(log n) average with simpler lock-free implementation than AVL/red-black)',
        'Why would you choose a doubly linked list over a singly linked list in an LRU cache, even though it costs 2× memory per node? (O(1) delete requires prev pointer — without it you need O(n) traversal to find predecessor)',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 3. STACKS
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ds-stack',
    cat: 'dsa',
    color: '#10b981',
    icon: '📚',
    title: 'Stacks',
    tag: 'LIFO discipline — last in, first out, with surprising depth',
    overview:
      'A stack enforces Last-In-First-Out (LIFO) access. Push adds to top, pop removes from top, peek reads top without removing — all O(1). Simple to implement (array or linked list) but the constraint is the power: LIFO maps directly to how call stacks, expression evaluation, undo systems, DFS traversal, and compiler parsing work. Every recursive algorithm is implicitly using the call stack — making the recursion explicit with your own stack is often the key to eliminating stack overflow on deep inputs.',
    components: [
      {
        name: 'Array-backed Stack',
        icon: '📋',
        role: 'O(1) push/pop with excellent cache locality.',
        detail:
          'Push: arr[++top] = val. Pop: return arr[top--]. Peek: return arr[top]. O(1) all operations, excellent cache locality. Drawback: fixed capacity (or dynamic resize for dynamic array backing). JavaScript\'s Array naturally works as a stack via push/pop.',
      },
      {
        name: 'Linked-list Stack',
        icon: '🔗',
        role: 'Unbounded stack with O(1) push/pop — no resize, worse cache.',
        detail:
          'Head of the linked list is the top of the stack. Push: prepend node (O(1)). Pop: remove head (O(1)). No capacity limit. Worse cache performance than array-backed. Use only when the stack size is highly unpredictable and memory efficiency matters.',
      },
      {
        name: 'Monotonic Stack',
        icon: '📉',
        role: 'Maintains a sorted invariant — next-greater and histogram problems.',
        detail:
          'A stack that maintains a monotonically increasing or decreasing sequence. On push, pop everything from the top that violates the monotonic property before pushing. Used for: next greater element, largest rectangle in histogram, daily temperatures. O(n) total for n pushes — each element pushed and popped exactly once.',
      },
      {
        name: 'Call Stack',
        icon: '🖥️',
        role: 'The OS-managed stack behind every function call — the original LIFO.',
        detail:
          'Every function invocation pushes a stack frame (return address, local variables, parameters). Stack pointer moves down (stacks grow toward lower addresses on x86). Stack overflow = stack pointer crosses stack size limit (typically 1-8 MB). Tail call optimisation (TCO) reuses the current frame instead of pushing a new one — JavaScript engines rarely implement TCO fully.',
      },
    ],
    howItWorks:
      'An array-backed stack maintains a top index. Push increments top and writes to that index; pop reads from top and decrements. No element shifting, no traversal — purely index arithmetic. For JS, native Array.push/pop are implemented as exactly this in V8, with the underlying typed array upgraded to PACKED_ELEMENTS as needed.\n\nA monotonic stack works by maintaining a stricter invariant than "just a stack." For next-greater-element: iterate left to right; for each element, pop everything from the stack that is smaller than the current element — each popped element has found its next-greater (the current element). Push the current element. At the end, everything remaining in the stack has no next-greater. The total number of push+pop operations is exactly 2n (each element pushed once, popped at most once), giving O(n) overall despite the nested loop appearance.\n\nConverting DFS from recursive to iterative requires only replacing the call stack with an explicit stack data structure. Push the root; while the stack is not empty, pop a node, process it, and push its unvisited neighbors. The LIFO order of the explicit stack mirrors what the call stack would have done. This is how you avoid stack overflow on trees/graphs with depth > Node.js\'s default ~10k frame limit (configurable with --stack-size=65536, measured in KB).\n\nBalanced parentheses validation is the simplest canonical example: for each character, if it is an opening bracket, push it. If it is a closing bracket, check that the stack top matches. If it does not, or the stack is empty, the string is invalid. If the stack is empty at the end, valid. This exact pattern — push context on open, validate on close — generalises to XML/HTML parsing, expression evaluation, and compiler syntax checking.',
    decision: {
      choose: [
        'Expression evaluation: infix to postfix conversion, evaluating postfix (RPN calculator)',
        'Balanced parentheses/bracket/tag validation — the stack-open/close pattern is universal',
        'DFS graph traversal iteratively — to avoid call stack overflow on deep graphs',
        'Undo/redo systems — push operations to undo stack, pop and reverse on undo',
        'Backtracking algorithms where you need to unwind state to a previous checkpoint',
        'Monotonic stack for next-greater-element class problems in O(n)',
      ],
      avoid: [
        'When FIFO semantics are needed — use a queue',
        'When random access to middle elements is required — use an array directly',
        'When the "stack" needs push/pop at both ends — that\'s a deque',
      ],
      vs: [
        {
          name: 'vs Queue',
          when: 'Stack is LIFO (depth-first, undo, recursion). Queue is FIFO (breadth-first, scheduling, fairness). Choosing the wrong one for DFS/BFS is the most common interview mistake.',
        },
        {
          name: 'vs Deque',
          when: 'A deque generalises both stack and queue with O(1) push/pop at both ends. Use a deque if you need both-end access; stack if you only need one end.',
        },
      ],
    },
    failures: [
      {
        name: 'Stack overflow from deep recursion',
        cause: 'No base case, or input depth exceeds the OS-provided stack size limit. Node.js defaults to ~10k frames (~984 KB). Tree DFS on a 100k-node degenerate (linked-list-shaped) tree will overflow.',
        symptom: 'RangeError: Maximum call stack size exceeded. Process crashes, not catchable with try/catch at scale.',
        fix: 'Convert recursion to iterative with explicit stack. Alternatively: --stack-size=65536 (Node.js, in KB) for one-off large inputs. Trampolining (CPS transform) works for mutual recursion but adds overhead.',
        severity: 'critical',
      },
      {
        name: 'Monotonic stack direction confusion',
        cause: 'Using increasing when decreasing is needed (or vice versa), or popping on > instead of >= — produces subtly wrong answers.',
        symptom: 'Off-by-one results in next-greater-or-equal vs next-strictly-greater; histogram area calculations wrong by one bar.',
        fix: 'Name the stack by its invariant: decreasingStack, strictlyIncreasing. Trace through a 5-element example by hand before submitting. The pop condition (> vs >=) determines whether ties are handled as "same" or "greater."',
        severity: 'medium',
      },
      {
        name: 'Pop on empty stack returns undefined silently',
        cause: 'JS Array.pop() returns undefined on an empty array — no exception thrown. The undefined propagates through downstream arithmetic as NaN.',
        symptom: 'Calculation results are NaN; no error thrown; hard to trace back to the empty-pop source.',
        fix: 'Wrap in a Stack class that throws on empty pop. Always guard with if (stack.length === 0) before pop. Write a helper: safeTop(stack) — throws RangeError rather than returning undefined.',
        severity: 'high',
      },
    ],
    a: {
      v: 'A stack of plates',
      t: 'A cafeteria',
      tx: 'Plates are stacked — the last plate put on is the first one taken. You cannot reach the bottom plate without removing all plates above it. The call stack works the same way: when main() calls foo() which calls bar(), bar\'s frame sits on top. When bar returns, its plate is removed and foo\'s frame is back on top. Recursive algorithms are just a chef stacking plates; iterative DFS is the same chef stacking them manually.',
      s: 'LIFO: push/pop/peek all O(1), maps directly to recursion and parsing',
    },
    te: {
      def: 'A stack is a LIFO (Last-In-First-Out) abstract data type supporting push (add to top), pop (remove from top), and peek (read top) in O(1). Implemented as an array (cache-friendly, possibly bounded) or linked list (unbounded, cache-hostile).',
      types: [
        { n: 'Array Stack', d: 'JS Array.push/pop is a native O(1) stack. Best cache performance. Amortized O(1) on resize. Default choice.' },
        { n: 'Linked Stack', d: 'ListNode prepend/remove-head. Unbounded, O(1) push/pop, no resize. Cache-hostile. Use when size variance is extreme.' },
        { n: 'Monotonic Increasing Stack', d: 'Maintains ascending order from bottom to top. Pop on push if top >= new element. Used for next-smaller-element problems.' },
        { n: 'Monotonic Decreasing Stack', d: 'Maintains descending order. Pop on push if top <= new element. Used for next-greater-element, largest rectangle.' },
        { n: 'Persistent Stack', d: 'Functional / immutable stack where push returns a new stack sharing the old tail. O(1) push, O(1) pop, O(n) space total. Used in functional languages and version control data structures.' },
      ],
      when: 'Whenever the problem has a "most recent context" pattern: function calls, undo operations, expression parsing, DFS traversal. If you find yourself using recursion, you are using a stack — make it explicit when depth might exceed OS limits.',
      trade: 'O(1) push/pop/peek with no complexity caveats. The only tradeoff is capacity (array-backed: potential O(n) resize, linked: per-node allocation). The monotonic variant runs O(n) total for n elements — linear amortized despite pop loops inside the push.',
      code: `// ─── ArrayStack — explicit implementation showing the mechanics ──────────────
class ArrayStack {
  constructor() {
    this._arr = [];
  }

  push(val)  { this._arr.push(val); }
  pop()      {
    if (this._arr.length === 0) throw new RangeError('pop from empty stack');
    return this._arr.pop();
  }
  peek()     {
    if (this._arr.length === 0) throw new RangeError('peek at empty stack');
    return this._arr[this._arr.length - 1];
  }
  isEmpty()  { return this._arr.length === 0; }
  get size() { return this._arr.length; }
}

// ─── Monotonic Decreasing Stack — next greater element ───────────────────────
// For each element, find the next element to the right that is strictly greater.
// Total time: O(n) — each element pushed and popped exactly once.
//
// Invariant: stack is strictly decreasing from bottom to top.
// When we push x, we first pop everything <= x (those elements found their
// next-greater in x).

function nextGreaterElement(nums) {
  const result = new Array(nums.length).fill(-1);
  // Stack stores indices (not values) so we can write into result[i]
  const stack = []; // decreasing by value: nums[stack[bottom]] > nums[stack[top]]

  for (let i = 0; i < nums.length; i++) {
    // Pop all elements that are smaller than nums[i]:
    // nums[i] is their next greater element
    while (stack.length > 0 && nums[stack[stack.length - 1]] < nums[i]) {
      const idx = stack.pop();
      result[idx] = nums[i];
    }
    stack.push(i);
  }
  // Remaining indices in stack have no greater element to the right → -1 (default)
  return result;
}
// Trace: [2, 1, 2, 4, 3]
// i=0: stack=[0]
// i=1: nums[1]=1 < nums[0]=2 → push. stack=[0,1]
// i=2: nums[2]=2 >= nums[1]=1 → pop 1, result[1]=2. nums[0]=2 not < 2 → stop. push 2. stack=[0,2]
// i=3: 4>2 → pop 2 result[2]=4, pop 0 result[0]=4. stack=[3]
// i=4: 3<4 → push. stack=[3,4]
// Final: result=[4,-1,4,-1,-1] ✓

// ─── Iterative DFS — convert recursion to explicit stack ─────────────────────
// This eliminates stack overflow on 100k-node deep trees.
// Identical traversal order to the recursive version.

function dfsIterative(root) {
  if (!root) return [];
  const result = [];
  const stack = [root]; // explicit stack replaces the call stack

  while (stack.length > 0) {
    const node = stack.pop(); // LIFO = depth-first
    result.push(node.val);

    // Push right before left so left is processed first (matches recursive preorder)
    if (node.right) stack.push(node.right);
    if (node.left)  stack.push(node.left);
  }
  return result;
}

// ─── Balanced brackets validator ─────────────────────────────────────────────
// The "push on open, validate on close" pattern generalises to XML/HTML parsing.
function isBalanced(s) {
  const matching = { ')': '(', '}': '{', ']': '[' };
  const stack = [];
  for (const ch of s) {
    if ('({['.includes(ch)) {
      stack.push(ch);
    } else if (')]}'.includes(ch)) {
      if (stack.length === 0 || stack[stack.length - 1] !== matching[ch]) {
        return false;
      }
      stack.pop();
    }
  }
  return stack.length === 0; // non-empty = unmatched opening brackets remain
}`,
      rw: {
        ex: [
          'Browser back/forward: each page visit pushes to a back-stack. Back button pops from back-stack and pushes to forward-stack. New navigation clears the forward-stack.',
          'VS Code undo/redo: every document change pushes an inverse operation onto the undo stack. Ctrl+Z pops and applies. Ctrl+Y pops from the redo stack.',
          'Expression evaluation in compilers: the shunting-yard algorithm uses two stacks (operator stack, operand stack) to convert infix to postfix and evaluate it — used in every calculator, spreadsheet formula engine, and SQL expression parser.',
          'Node.js async call stack: V8\'s async/await internally unwinds and re-creates stack frames; DevTools shows the async call stack by stitching together frame snapshots captured at each await boundary.',
        ],
        cs: 'V8\'s call stack is a fixed-size region of the process address space (default 984 KB on Node.js, adjustable via --stack-size in KB). Each function call allocates a stack frame containing the return address, saved registers, and local variables. V8 checks the stack pointer against a limit on every function entry — when exceeded, it throws RangeError without actually overflowing memory (a controlled limit check, not a segfault). TCO (tail call optimisation) would reuse the current frame for tail-position calls, but V8 only implements TCO in strict mode and only for direct tail-recursive calls — in practice, most recursive code still blows the stack at depth ~10k.',
      },
    },
    interview: {
      q: 'You have a recursive DFS that stack-overflows on trees with 100k nodes. How do you fix it?',
      a: 'The call stack limit in Node.js is ~10k frames by default (984 KB). A 100k-deep tree exhausts it. The fix: convert the recursion to iterative using an explicit stack data structure. Instead of function calls, push node onto a JS array stack. The iterative version uses heap memory for the stack (essentially unlimited) rather than the OS-managed call stack. Implementation: push root; while stack not empty, pop node, process, push children. The LIFO property of the explicit stack preserves depth-first traversal order identically to the recursive version. Alternatively, for breadth-first, swap the stack for a queue.',
      fu: [
        'Explain the monotonic stack pattern for "next greater element" and prove its O(n) complexity. (each element enters/exits the stack exactly once — 2n operations total)',
        'What is tail call optimisation and why doesn\'t it help with most recursive JavaScript code? (V8 only applies TCO in strict mode for direct tail calls; most recursive DFS is not tail-recursive)',
        'How does an undo system differ from a simple stack? What happens to the redo stack when the user makes a new edit after undoing? (new edit clears the redo stack — future redo is undefined)',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 4. QUEUES & DEQUES
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ds-queue',
    cat: 'dsa',
    color: '#10b981',
    icon: '🚶',
    title: 'Queues & Deques',
    tag: 'FIFO ordering — fair scheduling and breadth-first exploration',
    overview:
      'A queue enforces First-In-First-Out (FIFO) — enqueue at tail, dequeue at head. Deques (double-ended queues) allow O(1) push/pop at both ends. These constraints map directly to: BFS graph traversal, process scheduling, rate limiting token buckets, sliding window algorithms, and producer-consumer pipelines. Implementing a correct O(1) dequeue from an array-backed queue requires the circular buffer trick — naive array.shift() is O(n) and kills performance at scale.',
    components: [
      {
        name: 'Circular Buffer Queue',
        icon: '🔄',
        role: 'O(1) enqueue and dequeue without memory allocation after init.',
        detail:
          'Fixed capacity array with head and tail indices. Enqueue: arr[tail++ % capacity] = val. Dequeue: return arr[head++ % capacity]. O(1) both operations. Full when (tail - head) === capacity. Used in OS ring buffers, audio processing, network packet queues. No memory allocation after initialization.',
      },
      {
        name: 'Linked-list Queue',
        icon: '🔗',
        role: 'Unbounded O(1) enqueue/dequeue for variable-size workloads.',
        detail:
          'Head pointer for dequeue (O(1) remove first), tail pointer for enqueue (O(1) append last). Unlimited capacity. One allocation per enqueue. Good for unbounded workloads where circular buffer would need resizing.',
      },
      {
        name: 'Deque (Double-Ended Queue)',
        icon: '↔️',
        role: 'O(1) push/pop at both ends — generalises stack and queue.',
        detail:
          'Push/pop at both front and back. Implemented as a doubly linked list or a dynamic array of fixed-size chunks (like Python\'s collections.deque — a linked list of 64-element arrays, trading pointer-following for reduced allocations). JS has no built-in deque — fake it with an array and head/tail pointers, or use a doubly linked list.',
      },
      {
        name: 'Monotonic Deque',
        icon: '📊',
        role: 'Sliding window maximum/minimum in O(n) total.',
        detail:
          'A deque maintaining a monotonic property used for sliding window maximum/minimum in O(n) total. On push: remove from back all elements that violate the monotonic property. On slide: remove from front if it\'s outside the window. Each element enters and exits the deque exactly once — O(n) for n pushes.',
      },
    ],
    howItWorks:
      'Array.shift() is O(n) because it physically moves every element one position left in the underlying buffer. A circular buffer avoids this by treating the array as a ring: head and tail are integer indices that wrap modulo capacity. Dequeue increments head (discarding the old slot logically — the slot can be overwritten by future enqueues). No element movement ever happens. The buffer is full when (tail - head) === capacity; empty when tail === head. This is the implementation behind OS ring buffers, V8\'s internal message queue, and audio processing pipelines.\n\nThe two-stack queue is an elegant alternative for unbounded workloads: maintain an inbox stack and an outbox stack. Enqueue pushes to inbox. Dequeue pops from outbox; if outbox is empty, pour all of inbox into outbox (reverse it). Amortized analysis: each element is pushed to inbox once, popped from inbox once (during pour), pushed to outbox once, and popped from outbox once — 4 operations total. O(1) amortized per operation, O(n) worst case for a single dequeue that triggers a pour.\n\nThe monotonic deque for sliding window maximum: maintain a deque of indices, where the values at those indices form a strictly decreasing sequence from front to back. For each new element: 1) Remove from the back all indices whose values are less than the new element (they can never be the maximum of any future window containing the new element). 2) Push the new index. 3) Remove from the front any index that is outside the current window (index < i - k + 1). 4) The front of the deque is the current window maximum. Each index is added and removed at most once — O(n) total.\n\nBFS requires a queue because it must process all nodes at depth d before any node at depth d+1. The FIFO property enforces this: nodes enqueued at depth d are dequeued before nodes enqueued at depth d+1. Using a stack (LIFO) gives DFS — it processes the most recently discovered node first, going deep immediately. This is not a subtle distinction: swapping stack for queue in a traversal changes the fundamental algorithm.',
    decision: {
      choose: [
        'BFS graph/tree traversal — always queue, never stack',
        'Level-order tree traversal — process one depth level at a time',
        'Producer-consumer pipelines with bounded buffers (circular queue)',
        'Sliding window max/min in O(n) — monotonic deque',
        'Rate limiting: token bucket and leaky bucket implementations',
        'Task scheduling where order-of-arrival fairness matters',
      ],
      avoid: [
        'When LIFO semantics are needed — use stack',
        'When random access is needed — use array',
        'Using JS Array.shift() for high-throughput queues — O(n) shift is quadratic at scale',
        'Monotonic deque when window contains duplicate maxima and you need all of them',
      ],
      vs: [
        {
          name: 'vs Stack',
          when: 'Queue (FIFO) for BFS, scheduling, fairness. Stack (LIFO) for DFS, undo, recursion. The choice between them is not an optimisation — it changes the algorithm\'s fundamental behaviour.',
        },
        {
          name: 'vs Priority Queue',
          when: 'Queue serves elements in arrival order. Priority queue serves the highest-priority element regardless of arrival. Use priority queue for Dijkstra, heap sort, event simulation; use queue for fair FIFO scheduling.',
        },
      ],
    },
    failures: [
      {
        name: 'Using Array.shift() as a queue in a hot path',
        cause: 'Array.shift() is O(n) — it memmoves every element one slot left. Called n times = O(n²) total for a queue processing n elements.',
        symptom: 'BFS on a 100k-node graph takes 30 seconds instead of 30ms. CPU profiles show Array.shift inside the tight loop consuming 99% of time.',
        fix: 'Implement a circular buffer with head/tail indices, or use a head-pointer trick (track head index, never call shift, GC the array when head > capacity/2). For small queues (< 1000 elements), shift is fine — profile before optimising.',
        severity: 'critical',
      },
      {
        name: 'Using a stack instead of a queue for BFS',
        cause: 'Naming the data structure "frontier" or "toVisit" instead of "queue" — easy to accidentally swap to a stack (pop vs shift).',
        symptom: 'The algorithm visits nodes depth-first instead of breadth-first; shortest-path BFS returns wrong distances; level-order traversal is out of order.',
        fix: 'Name the variable explicitly: const queue = []. Enforce the abstraction: only use enqueue (push to back) and dequeue (pop from front). Never pop() in BFS — that\'s stack semantics.',
        severity: 'high',
      },
      {
        name: 'Monotonic deque — stale front not removed',
        cause: 'Window slides forward but the deque front still holds an index from before the window start.',
        symptom: 'Sliding window maximum returns the maximum of a larger window than requested — values from outside the window are included.',
        fix: 'Always remove from front while deque.front <= currentIndex - windowSize. The check must happen before reading the front as the current maximum. Test with a window that slides past a large value.',
        severity: 'high',
      },
    ],
    a: {
      v: 'A queue at a bank',
      t: 'A bank teller line',
      tx: 'Everyone joins the line at the back; the teller serves from the front. The first person in is the first served. A deque is a line where people can also join at the front (priority entry) and leave from the back (changed their mind). BFS uses a queue because it processes all neighbors at the current depth before going deeper — just like a teller serving all people who arrived before serving the next batch.',
      s: 'FIFO: enqueue at tail, dequeue at head — circular buffer for O(1) both',
    },
    te: {
      def: 'A queue is a FIFO (First-In-First-Out) abstract data type. Enqueue adds to tail, dequeue removes from head. A deque (double-ended queue) generalises this to O(1) push/pop at both ends. Correct O(1) implementation requires a circular buffer (array-backed) or linked list — not a plain array with shift().',
      types: [
        { n: 'Circular Buffer Queue', d: 'Fixed array, head/tail indices, modulo wrap. O(1) enqueue/dequeue, no allocation. Used in OS buffers, audio, network I/O.' },
        { n: 'Linked Queue', d: 'Tail pointer for O(1) enqueue; head pointer for O(1) dequeue. Unbounded. One alloc per element.' },
        { n: 'Deque', d: 'O(1) push/pop at both ends. JS: simulate with doubly linked list or head/tail index trick. Python: collections.deque (chunked linked list).' },
        { n: 'Monotonic Deque', d: 'Deque maintaining sorted invariant. Used for sliding window max/min in O(n). Each element enters/exits once.' },
        { n: 'Priority Queue', d: 'Not FIFO — serves highest priority first. Backed by a heap. O(log n) enqueue/dequeue. Preview: see heap concepts.' },
      ],
      when: 'BFS always; any first-come-first-served scheduling; producer-consumer bounded buffers; sliding window max/min. Replace JS Array.shift() with a proper queue implementation whenever the queue size exceeds ~1000 and throughput matters.',
      trade: 'Circular buffer: O(1) both ends, zero allocation, but fixed capacity (resize = O(n) rehash). Linked queue: O(1) both ends, unbounded, but one allocation per enqueue and cache-hostile. Deque generalises both but adds complexity. Monotonic deque is O(n) amortized — appears O(n²) due to inner loops but each element is enqueued/dequeued at most once.',
      code: `// ─── CircularQueue — O(1) enqueue/dequeue without Array.shift() ──────────────
class CircularQueue {
  constructor(capacity) {
    this.capacity = capacity + 1; // +1 to distinguish full from empty
    this._buf = new Array(this.capacity);
    this._head = 0; // index of the next element to dequeue
    this._tail = 0; // index of the next slot to enqueue into
  }

  // Full when advancing tail would reach head
  isFull()  { return (this._tail + 1) % this.capacity === this._head; }
  isEmpty() { return this._head === this._tail; }
  get size() {
    return (this._tail - this._head + this.capacity) % this.capacity;
  }

  // O(1) — write to tail slot, advance tail with wrap
  enqueue(val) {
    if (this.isFull()) throw new RangeError('queue is full');
    this._buf[this._tail] = val;
    this._tail = (this._tail + 1) % this.capacity;
  }

  // O(1) — read from head slot, advance head with wrap (slot logically freed)
  dequeue() {
    if (this.isEmpty()) throw new RangeError('queue is empty');
    const val = this._buf[this._head];
    this._buf[this._head] = undefined; // help GC release object references
    this._head = (this._head + 1) % this.capacity;
    return val;
  }

  peek() {
    if (this.isEmpty()) throw new RangeError('queue is empty');
    return this._buf[this._head];
  }
}

// ─── Two-stack queue — amortized O(1) dequeue using two stacks ───────────────
// Proof: each element is pushed/popped twice (once per stack) = O(1) amortized.
// Worst-case single dequeue is O(n) — use circular buffer if worst-case matters.

class TwoStackQueue {
  constructor() {
    this._inbox  = [];  // enqueue target
    this._outbox = [];  // dequeue source
  }

  enqueue(val) {
    this._inbox.push(val);
  }

  dequeue() {
    if (this._outbox.length === 0) {
      // Pour inbox into outbox, reversing the order (LIFO → FIFO)
      while (this._inbox.length > 0) {
        this._outbox.push(this._inbox.pop());
      }
    }
    if (this._outbox.length === 0) throw new RangeError('queue is empty');
    return this._outbox.pop();
  }

  get size() { return this._inbox.length + this._outbox.length; }
}

// ─── BFS level-order traversal ────────────────────────────────────────────────
// Uses a queue — FIFO ensures all nodes at depth d are processed before depth d+1.
// Swapping queue for a stack gives DFS — a fundamental algorithm change.

function levelOrder(root) {
  if (!root) return [];
  const levels = [];
  const queue = [root]; // Array used as queue — enqueue=push, dequeue=shift
  // WARNING: Array.shift() is O(n). Fine here for interview; use CircularQueue
  // in production if BFS is called in a hot path.

  while (queue.length > 0) {
    const levelSize = queue.length; // snapshot: nodes at the current depth
    const level = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left)  queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    levels.push(level);
  }
  return levels;
}

// ─── Sliding window maximum — monotonic deque ────────────────────────────────
// For each window of size k, find the maximum element in O(n) total.
// Deque stores indices; front is always the index of the current window maximum.

function slidingWindowMax(nums, k) {
  const result = [];
  const deque = []; // indices, decreasing by nums[i] from front to back

  for (let i = 0; i < nums.length; i++) {
    // 1. Remove front if it's outside the current window [i-k+1, i]
    while (deque.length > 0 && deque[0] < i - k + 1) {
      deque.shift();
    }

    // 2. Maintain decreasing invariant: pop back while back value <= nums[i]
    //    (those indices can never be the max of any window that includes i)
    while (deque.length > 0 && nums[deque[deque.length - 1]] <= nums[i]) {
      deque.pop();
    }

    deque.push(i);

    // 3. Window is complete once i >= k-1; front is the max index
    if (i >= k - 1) {
      result.push(nums[deque[0]]);
    }
  }
  return result;
}
// Trace: nums=[1,3,-1,-3,5,3,6,7], k=3
// i=0: deque=[0]
// i=1: 3>1 → pop 0. deque=[1]
// i=2: -1<3. deque=[1,2]. window [1,3,-1] → max=nums[1]=3
// i=3: -3<-1. deque=[1,2,3]. window [3,-1,-3] → max=3
// i=4: 5>-3,>-1,>3 → pop all. deque=[4]. window [-1,-3,5] → max=5
// ... result=[3,3,5,5,6,7] ✓`,
      rw: {
        ex: [
          'Node.js event loop: callbacks from I/O completion, setTimeout(fn,0), and Promise microtasks sit in separate FIFO queues. The event loop drains the microtask queue completely between each macrotask — a subtle priority ordering that causes surprises when mixing Promise.resolve() and setTimeout.',
          'Kubernetes scheduler: pending pods are queued in a priority FIFO queue. The scheduler dequeues one pod at a time, attempts to bind it to a node, and requeues if no node fits — a classic producer-consumer queue pattern.',
          'TCP send/receive buffers: the kernel maintains a circular buffer for each TCP socket. Producer (application) writes to tail; consumer (NIC / remote peer) reads from head. Full buffer = backpressure (send blocks). Empty buffer = no data to send.',
          'React\'s reconciler work loop: units of work (fibers) are enqueued in a work queue. The scheduler processes them in priority order, yielding back to the browser between frames — a priority queue layered on top of FIFO within each priority band.',
        ],
        cs: 'Node.js\'s event loop has six phases, each with its own FIFO queue: timers, pending callbacks, idle/prepare, poll, check (setImmediate), and close callbacks. Between each phase, Node.js drains the microtask queue (Promise callbacks + queueMicrotask) and the nextTick queue. Understanding this queue hierarchy is essential for debugging race conditions in async Node.js code — the order in which callbacks fire is determined entirely by which queue they land in and when each queue is drained.',
      },
    },
    interview: {
      q: 'Implement a queue using two stacks. Prove the amortized O(1) complexity.',
      a: 'Maintain inbox (for enqueue) and outbox (for dequeue). Enqueue always pushes to inbox — O(1). Dequeue pops from outbox; if outbox is empty, pour all of inbox into outbox (reverse order). Amortized proof: define the cost as the number of push/pop operations. Each element is: pushed to inbox once (cost 1), popped from inbox once during pour (cost 1), pushed to outbox once (cost 1), popped from outbox once on dequeue (cost 1) — exactly 4 operations per element over its lifetime. Total cost for n operations = 4n = O(n). Amortized cost per operation = O(1). Worst case for a single dequeue that triggers pour = O(n), but this cannot happen again until more elements are enqueued.',
      fu: [
        'When would you choose a circular buffer over a linked-list queue? (bounded workloads with known max size, zero allocation after init, cache-friendly, no GC pressure — vs unbounded workload with variable size)',
        'Explain the monotonic deque pattern for sliding window maximum. What is its actual time complexity and why does it appear O(n²)? (O(n) amortized — each element enqueued and dequeued exactly once; the inner while loop is paid for by the dequeue operations, not the outer loop)',
        'Why is BFS guaranteed to find the shortest path in an unweighted graph, and what property of the queue makes this work? (FIFO ensures nodes are processed in non-decreasing distance order from source — no node at distance d+1 is dequeued before all nodes at distance d)',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 5. HASH TABLES
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ds-hash-table',
    cat: 'dsa',
    color: '#10b981',
    icon: '#️⃣',
    title: 'Hash Tables',
    tag: 'O(1) average lookup — and the collision story that makes or breaks it',
    overview:
      'A hash table maps arbitrary keys to values in O(1) average time. The hash function converts a key to an integer index; the table stores the value at that index. Collisions — two keys hashing to the same slot — are inevitable (birthday paradox: in a table of 365 slots, you need only 23 keys for a 50% collision probability). The collision resolution strategy defines the table\'s real-world performance: separate chaining (linked lists per slot) vs open addressing (probe for next empty slot). JavaScript\'s Map and object literals are hash tables. Understanding what makes a good hash function and when the O(1) guarantee degrades to O(n) is essential for avoiding hash-based DoS attacks and pathological performance.',
    components: [
      {
        name: 'Hash Function',
        icon: '🔀',
        role: 'Maps key → array index — the entire table\'s correctness and performance depends on it.',
        detail:
          'Properties of a good hash: uniform distribution (minimises collision probability), deterministic (same key → same hash always), fast to compute (should not dominate lookup time). Polynomial rolling hash for strings: hash = Σ char[i] * p^i mod M (p=31, M=large prime). Avalanche effect: single bit change in input → ~half the output bits flip. Bad hash: sum of char codes (anagrams collide). Cryptographic hashes (SHA) are too slow for hash tables.',
      },
      {
        name: 'Separate Chaining',
        icon: '⛓️',
        role: 'Linked list per slot — simple, robust under high load factors.',
        detail:
          'Each slot holds a linked list of (key, value) pairs that hashed to that slot. Lookup: hash key → follow chain until key matches. Worst case O(n) if all keys collide into one chain. Load factor α = n/m (n=keys, m=slots). Average chain length = α. Keep α < 0.75 by resizing. Used in Java\'s HashMap, JavaScript\'s Map (V8 implementation).',
      },
      {
        name: 'Open Addressing',
        icon: '🔍',
        role: 'All entries in the table array — cache-friendly, deletion-complex.',
        detail:
          'All entries stored in the table array itself (no external lists). On collision, probe for next available slot. Strategies: Linear probing (next slot: +1, +2, ...) — simple but causes primary clustering. Quadratic probing (+1², +2², ...) — reduces clustering. Double hashing (step = h2(key)) — nearly random probing. Deletion requires tombstone markers (cannot just clear slot or future probes break). Load factor must stay < 0.7 to avoid catastrophic clustering.',
      },
      {
        name: 'Resize (Rehash)',
        icon: '📦',
        role: 'Maintains O(1) amortized by keeping load factor bounded.',
        detail:
          'When load factor exceeds threshold, allocate 2× table, rehash every key into the new table. O(n) cost amortized across all insertions. All existing keys get new positions (hash is computed mod new capacity). Failing to resize means chains grow to O(n) lookup.',
      },
    ],
    howItWorks:
      'Full lookup flow for separate chaining: compute hash = hashFn(key) % capacity to get the slot index; walk the linked list at that slot comparing keys (using ===, not ==, for correctness); return value if found, undefined if the chain is exhausted. Insert: compute slot, walk chain to check for existing key (update value) or append new node. Delete: walk chain, splice node, decrement count. Average case: chain length = load factor α ≈ constant (you keep α < 0.75). Worst case: all n keys collide into one chain — O(n) per operation.\n\nOpen addressing with linear probing: on insert, compute slot = hash(key) % capacity. If occupied, try (slot + 1) % capacity, (slot + 2) % capacity, etc. This is simple but creates primary clustering: occupied slots near each other accumulate more hits, making clusters grow faster than random. Quadratic probing uses slot + 1², + 2², +3²... — breaks primary clusters but creates secondary clustering. Double hashing uses a second hash function for the step size — distributes probes near-randomly. Deletion in open addressing cannot simply clear the slot: the probe sequence for other keys may have passed through this slot, and clearing it would break their lookup. Instead, mark with a tombstone sentinel. Tombstones count toward load factor and slow probing — periodic rehash clears them.\n\nV8\'s object property storage has three modes: "fast properties" (linear array + descriptor array — O(1) access by slot number, compiled by JIT), "slow/dictionary mode" (hash table with string keys — triggered when too many properties are added/deleted dynamically), and "elements" (numeric keys stored separately). When you do obj.x = val, V8 tries to keep the object in fast mode with a hidden class. When you do delete obj.x, V8 may demote to dictionary mode permanently for that object — all subsequent property accesses are hash table lookups, not compiled index accesses.\n\nHash DoS attack: an attacker crafts input strings that all produce the same hash (known as a hash collision attack, exploiting non-randomized hash functions). If your server parses user-supplied JSON and stores fields in a plain object/hash table, and all field names hash to slot 0, every insert and lookup is O(n). With 10k crafted keys, a single request can peg a CPU core for minutes. Defence: randomise the hash seed at startup (V8 does this for string keys since Node.js 0.10 — the seed is random per-process). For your own hash tables, use a keyed hash like SipHash-2-4 with a secret seed.',
    decision: {
      choose: [
        'O(1) average key-value lookup, insert, delete — the canonical use case',
        'Counting element frequencies — Map<element, count>',
        'Grouping records by key — Map<key, []> with push',
        'Deduplication — Set backed by hash table',
        'Implementing caches, indexes, and lookup tables',
        'Two-sum / subarray problems where you need O(1) complement lookup',
      ],
      avoid: [
        'When ordered iteration is needed (ascending/descending keys) — use a BST or sorted array',
        'When worst-case O(1) is hard required — use perfect hashing or cuckoo hashing',
        'When keys are small contiguous integers — a plain array is a direct-address table at O(1) with better constants',
        'When key equality requires deep/structural comparison — JS Map uses object identity for non-primitive keys',
      ],
      vs: [
        {
          name: 'vs Array',
          when: 'Array if keys are sequential integers (direct address table, best cache). Hash table if keys are arbitrary strings, objects, or sparse integers.',
        },
        {
          name: 'vs BST (sorted map)',
          when: 'Hash table for O(1) average lookup with no ordering. BST (or JS Map with sorted iteration via [...m].sort()) for O(log n) lookup with sorted key traversal, range queries, predecessor/successor.',
        },
        {
          name: 'vs Trie',
          when: 'Hash table for exact key lookup. Trie for prefix matching, autocomplete, longest common prefix — operations that require decomposing the key character by character.',
        },
      ],
    },
    failures: [
      {
        name: 'Hash collision DoS attack',
        cause: 'Attacker crafts keys that all map to the same hash slot. A non-randomised hash function is deterministic — an attacker who knows the algorithm can pre-compute collisions. All n keys land in one chain — every operation is O(n).',
        symptom: 'Single HTTP request with crafted JSON/form body causes 100% CPU for seconds. Server throughput collapses. Classic in Ruby on Rails (2011), Java HashMap (2011), PHP, Python before randomized hashing.',
        fix: 'V8 randomises string hash seeds per process — JS Map and object keys are protected. For custom hash tables: use SipHash-2-4 with a random seed generated at startup. Never use sum-of-chars or non-seeded polynomial hash for user-supplied keys.',
        severity: 'critical',
      },
      {
        name: 'Using object literals as hash tables with untrusted keys',
        cause: 'obj[key] where key is user-supplied can be "__proto__", "constructor", "hasOwnProperty", "toString" etc. — prototype chain pollution.',
        symptom: 'obj["__proto__"] = {isAdmin: true} pollutes Object.prototype — every {} in the process inherits isAdmin. Security vulnerability and unpredictable behaviour.',
        fix: 'Use Map for all hash-table-style code. Or use Object.create(null) — no prototype chain. Never use a plain {} with untrusted string keys.',
        severity: 'critical',
      },
      {
        name: 'Mutable object as Map key (reference vs value equality)',
        cause: 'map.set({id: 1}, "foo") stores the entry under the specific object reference. A new object {id: 1} is a different reference — map.get({id: 1}) returns undefined.',
        symptom: 'Cache misses on every lookup despite "matching" keys. Map grows unboundedly as new object literals are created for each lookup.',
        fix: 'Use primitive keys: map.set(JSON.stringify({id: 1}), "foo") or map.set(item.id, "foo"). Or use a purpose-built key class with a canonical string representation. Understand that JS Map uses SameValueZero for key comparison — same as === for objects (identity, not structural equality).',
        severity: 'high',
      },
    ],
    a: {
      v: 'A library filing system',
      t: 'A university library',
      tx: 'Instead of searching every shelf for a book, the librarian computes a code from the title (hash function) that tells them exactly which shelf to check. Two books with the same code go in the same slot (collision) — the librarian checks each book on that shelf until they find the right title (chaining). If too many books pile up on one shelf (high load factor), the library reorganises into a bigger building (resize/rehash).',
      s: 'Hash function maps key to slot; collision resolution makes or breaks real-world O(1)',
    },
    te: {
      def: 'A hash table is a data structure that maps keys to values using a hash function to compute an array index. O(1) average-case lookup, insert, and delete. Worst case O(n) when all keys collide. Performance depends on hash quality, load factor management, and collision resolution strategy.',
      types: [
        { n: 'Separate Chaining', d: 'Each slot holds a linked list of colliding entries. Robust under high load. O(1 + α) average where α = load factor. Used in Java HashMap, V8 Map.' },
        { n: 'Open Addressing — Linear Probing', d: 'On collision, scan linearly for next empty slot. Simple. Primary clustering degrades performance at α > 0.7.' },
        { n: 'Open Addressing — Quadratic Probing', d: 'Probe at +1², +2², +3²... Breaks primary clustering. Requires power-of-two table size for guaranteed coverage.' },
        { n: 'Open Addressing — Double Hashing', d: 'Step size = h2(key). Near-random probe sequence. Best distribution among open addressing variants.' },
        { n: 'Robin Hood Hashing', d: 'Variant of open addressing: on collision, if the new element is "richer" (farther from its ideal slot) than the current occupant, swap them. Reduces variance in probe length. Used in Rust\'s HashMap.' },
        { n: 'Cuckoo Hashing', d: 'Two hash functions, two tables. Element goes in one of two possible slots. On conflict, evict occupant to its other slot (ripple). O(1) worst-case lookup. Amortized O(1) insert (with occasional rehash).' },
        { n: 'Perfect Hashing', d: 'Static key set known in advance. Construct a collision-free hash function. O(1) worst-case lookup. Used in compilers (keyword tables), network packet classifiers.' },
      ],
      when: 'Default choice for key-value association, frequency counting, deduplication, and O(1) lookup. Use JS Map (not plain object) for new code. Switch to a sorted structure when you need ordered iteration or range queries.',
      trade: 'O(1) average for all operations — unmatched. But worst case is O(n) (all keys collide), hash function computation is a real constant-factor cost, and iteration order is undefined (Map preserves insertion order in JS, but that\'s a language spec choice, not a hash table property). Memory overhead: each slot holds a pointer (separate chaining) or the entry itself with tombstone complexity (open addressing).',
      code: `// ─── HashTable from scratch — separate chaining with polynomial string hash ───
// This is what every interview question about hash tables expects you to know.

class HashTable {
  constructor(initialCapacity = 16) {
    this._capacity = initialCapacity;
    this._size = 0;
    // Array of buckets; each bucket is an array of [key, value] pairs (chaining)
    this._buckets = new Array(this._capacity).fill(null).map(() => []);
    // Load factor threshold: resize when size / capacity > 0.75
    this._loadFactorThreshold = 0.75;
  }

  // Polynomial rolling hash — good distribution for string keys
  // p=31 (prime close to lowercase letter count), M=large prime to reduce mod bias
  _hash(key) {
    const str = String(key);
    const p = 31;
    const M = 1_000_000_007; // large prime
    let hash = 0;
    let pPow = 1;
    for (let i = 0; i < str.length; i++) {
      // charCodeAt is faster than codePointAt for ASCII keys
      hash = (hash + str.charCodeAt(i) * pPow) % M;
      pPow = (pPow * p) % M;
    }
    // Map to bucket index
    return Math.abs(hash) % this._capacity;
  }

  set(key, value) {
    const idx = this._hash(key);
    const bucket = this._buckets[idx];
    // Update if key already exists — walk the chain
    for (const pair of bucket) {
      if (pair[0] === key) { pair[1] = value; return; }
    }
    // New key — append to chain
    bucket.push([key, value]);
    this._size++;
    // Resize if load factor exceeded — keeps chain length near O(1)
    if (this._size / this._capacity > this._loadFactorThreshold) {
      this._rehash();
    }
  }

  get(key) {
    const bucket = this._buckets[this._hash(key)];
    for (const [k, v] of bucket) {
      if (k === key) return v;
    }
    return undefined;
  }

  has(key) { return this.get(key) !== undefined; }

  delete(key) {
    const idx = this._hash(key);
    const bucket = this._buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1); // O(chain length) = O(1) amortized
        this._size--;
        return true;
      }
    }
    return false;
  }

  // O(n) — rebuild entire table with 2x capacity
  // All keys get new indices because index = hash % new_capacity
  _rehash() {
    const oldBuckets = this._buckets;
    this._capacity *= 2;
    this._size = 0;
    this._buckets = new Array(this._capacity).fill(null).map(() => []);
    for (const bucket of oldBuckets) {
      for (const [k, v] of bucket) {
        this.set(k, v); // recomputes hash % new_capacity
      }
    }
  }

  *keys() {
    for (const bucket of this._buckets) {
      for (const [k] of bucket) yield k;
    }
  }

  *values() {
    for (const bucket of this._buckets) {
      for (const [, v] of bucket) yield v;
    }
  }

  *entries() {
    for (const bucket of this._buckets) {
      for (const pair of bucket) yield pair;
    }
  }

  get size() { return this._size; }
}

// ─── JS Map API for comparison — always use this in production ────────────────
// Map handles all key types correctly, preserves insertion order, and uses
// SameValueZero equality (NaN === NaN, -0 === 0).

const freq = new Map();
const words = ['the', 'quick', 'the', 'fox', 'the'];
for (const word of words) {
  freq.set(word, (freq.get(word) ?? 0) + 1);
}
// freq: Map { 'the' => 3, 'quick' => 1, 'fox' => 1 }

// SAFE: Map with object keys uses reference equality — predictable
const nodeMap = new Map();
const nodeA = { id: 1 };
nodeMap.set(nodeA, 'visited');
nodeMap.get(nodeA); // 'visited' — same reference ✓
nodeMap.get({ id: 1 }); // undefined — different reference, as expected

// DANGEROUS: plain object with untrusted keys
// const obj = {};
// obj[userInput] = value; // if userInput === '__proto__', prototype pollution!
// Fix: use Map, or Object.create(null) for a prototype-free object`,
      rw: {
        ex: [
          'DNS cache: maps hostname → IP address. Hash table with TTL expiry. O(1) lookup for cached domains is why repeated DNS lookups are nearly free — the OS resolver maintains this table in memory.',
          'React reconciler keyed diffing: when rendering a list with keys, React builds a Map<key, fiber> for the old list. For each new list element, it does Map.get(key) in O(1) to find the matching old fiber to reuse — avoiding O(n²) naive comparison.',
          'Database query plan cache: PostgreSQL caches parsed + planned queries indexed by a hash of the query text. O(1) lookup on repeat queries — avoids replanning cost (can be hundreds of ms for complex queries).',
          'Python\'s dict interning: short strings and string literals are interned (deduplicated) in a global hash table — all references to "hello" in Python code point to the same object. Hash comparison (id check) is O(1) instead of O(len).',
        ],
        cs: 'V8\'s object property storage: when you create an object with a fixed set of properties, V8 assigns it a "hidden class" (also called a "shape" or "map") and stores properties in a fixed-layout array — lookups are compiled to array index accesses by the JIT, not hash table lookups. This is fast-properties mode. When properties are added/deleted dynamically or in inconsistent order across instances, V8 demotes the object to "dictionary mode" — a genuine hash table with string keys. The transition is one-way per object. This is why initialising all object properties in the constructor (rather than adding them lazily) is not just stylistic — it keeps the object in fast-properties mode throughout its lifetime.',
      },
    },
    interview: {
      q: 'How does a hash table achieve O(1) average lookup and when does it degrade to O(n)?',
      a: 'A hash function maps the key to an array index in O(1). Average-case O(1) lookup holds when: (1) the hash function distributes keys uniformly so chain length stays near the load factor α ≈ constant, and (2) the load factor is kept below 0.75 via resizing. Degrades to O(n) when: all keys collide into one slot — average chain length = n. This happens with a bad hash function (e.g., sum of char codes, which maps all anagrams to the same slot), or with a hash DoS attack where an adversary crafts keys that all produce the same hash. The fix for DoS is a randomised seed per process (V8 does this for string keys). The fix for bad distribution is a better hash function with the avalanche property.',
      fu: [
        'Explain how open addressing handles deletion and why you cannot simply clear the deleted slot. (Probe sequences for other keys pass through this slot — clearing it breaks their lookup. Tombstone markers preserve the probe chain while marking the slot as reusable.)',
        'How does consistent hashing extend the hash table concept to distributed systems? (Virtual nodes on a hash ring; adding/removing a server migrates only 1/n keys on average, vs remapping all keys with a plain modulo hash.)',
        'What is prototype pollution in JavaScript and how does it relate to using objects as hash tables? (Setting __proto__ or constructor on a plain object modifies Object.prototype — affects all objects in the process. Fix: use Map or Object.create(null).)',
      ],
    },
  },
];

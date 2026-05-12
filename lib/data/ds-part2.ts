import { Concept } from '../types';

export const DS_PART2: Concept[] = [
  // ─────────────────────────────────────────────────────────────────
  // 6. BINARY SEARCH TREES
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ds-bst',
    cat: 'dsa',
    color: '#10b981',
    icon: '🌳',
    title: 'Binary Search Trees',
    tag: 'Sorted structure — O(log n) search, insert, delete when balanced',
    overview:
      'A Binary Search Tree maintains the BST invariant: every node\'s left subtree contains only keys less than the node\'s key; every node\'s right subtree contains only keys greater. This invariant enables O(log n) search, insert, and delete — but only when the tree is balanced. An unbalanced BST degrades to O(n) on sorted input (becomes a linked list). Self-balancing BSTs (AVL, Red-Black) maintain O(log n) worst case. In-order traversal of a BST yields sorted output in O(n). Real databases (B-trees, B+ trees) are direct descendants of this idea, extended to disk-friendly branching factors.',
    components: [
      {
        name: 'BST Invariant & Traversals',
        icon: '📐',
        role: 'The structural rule that enables binary search, plus the four traversal orders.',
        detail:
          'Left < Root < Right at every node. In-order (left-root-right) = sorted order. Pre-order (root-left-right) = serialize/deserialize. Post-order (left-right-root) = delete/free tree bottom-up. Level-order (BFS) = build balanced BST from sorted array. The height h determines all operation complexities. Balanced: h = O(log n). Degenerate (sorted insertions): h = O(n).',
      },
      {
        name: 'Insert & Delete',
        icon: '✏️',
        role: 'The two mutating operations and why deletion has three distinct cases.',
        detail:
          'Insert: traverse left/right by comparison until null, insert there. O(h). Delete has three cases — leaf (just remove), one child (bypass), two children (replace with in-order successor = leftmost node in right subtree, then delete successor from right subtree). The two-child case is the subtle one: after swapping the value, you must recurse into the right subtree to delete the successor, not blindly null it out.',
      },
      {
        name: 'AVL Trees',
        icon: '⚖️',
        role: 'Height-balanced BST guaranteeing O(log n) worst case via rotations after every mutation.',
        detail:
          'Height-balanced BST: |height(left) - height(right)| ≤ 1 at every node. Rebalanced via rotations (left-rotate, right-rotate, left-right, right-left) after insert/delete. Strictly balanced (h ≤ 1.44 log n) — faster lookups than Red-Black but more rotations on insert/delete. Used in Linux\'s epoll and some DB indexes.',
      },
      {
        name: 'Red-Black Trees',
        icon: '🔴',
        role: 'Relaxed-balance BST trading lookup speed for fewer rotations on mutation.',
        detail:
          'Balanced BST with 5 invariants ensuring h ≤ 2 log(n+1). Fewer rotations than AVL on insert/delete (at most 2 for insert, 3 for delete). Used in C++ std::map, Java\'s TreeMap, Linux\'s completely fair scheduler (CFS). JavaScript\'s Map is NOT a Red-Black tree (it\'s a hash table); for sorted iteration you need a library.',
      },
    ],
    howItWorks:
      'Insert walks the tree from root, turning left for smaller keys and right for larger, until it finds a null slot — the new node goes there. This is O(h) where h is the tree height. The three-case deletion algorithm is where most implementations get subtly wrong: deleting a leaf is trivial (null the parent pointer). Deleting a node with one child is a bypass. Deleting a node with two children requires finding the in-order successor — the minimum of the right subtree — copying its value up, then recursively deleting the successor from the right subtree. The successor itself can only have zero or one child (if it had a left child, it wouldn\'t be the minimum), so that recursive deletion uses one of the simpler two cases. Without balancing, inserting [1, 2, 3, 4, 5, ..., n] in sorted order produces a tree that degenerates to a rightward-slanting linked list — every "left" pointer is null, the tree has height n, and search becomes O(n). Any near-sorted data (timestamps inserted in order, auto-increment IDs) triggers this. Self-balancing BSTs prevent this via rotations. An AVL rotation corrects a height imbalance at a node by restructuring a 3-node subtree. A single right-rotation on a left-left case pivots the left child up to become the new subtree root, the old root becomes its right child, and the left child\'s right subtree becomes the old root\'s left child. This restores the height invariant in O(1). Double rotations (left-right and right-left cases) chain two single rotations. After every insert or delete, AVL trees walk back up to the root checking and correcting balance — O(log n) rotations in the worst case. Red-Black trees relax the balance invariant (allow height up to 2 log n) to reduce the number of rotations needed. Their five invariants — every node is red or black; root is black; leaves (null) are black; red nodes have black children; all paths from any node to its null descendants have the same number of black nodes — together guarantee O(log n) height without requiring AVL\'s strict per-node balance checks. The real-world descendant of BSTs is the B-tree: instead of branching factor 2, a B-tree of order t has branching factor up to 2t. A B-tree node stores up to 2t-1 keys and up to 2t children. All leaves are at the same depth (unlike a BST). This is critical for disk-based storage: a single node maps to one disk page (typically 4KB or 16KB), and each level of the tree requires one disk read. With branching factor 100, a B-tree of height 3 can index 100³ = 1 million rows with at most 3 disk reads. PostgreSQL, MySQL InnoDB, and virtually every RDBMS use B+ trees (a variant where all data lives in leaves, with leaves linked in a doubly-linked list for efficient range scans).',
    decision: {
      choose: [
        'Need sorted order + O(log n) insert/delete/search (range queries, ordered iteration, floor/ceiling)',
        'Database indexes on columns with range queries (use B-tree variant)',
        'Event scheduling by timestamp where you need to delete/update events efficiently',
        'When hash table\'s lack of ordering is the bottleneck — e.g., need "all entries between X and Y"',
        'When you need predecessor/successor/rank queries — not possible in O(1) with hash tables',
      ],
      avoid: [
        'When only exact lookups are needed and ordering doesn\'t matter — hash table is O(1) vs O(log n)',
        'When dataset is static — sorted array + binary search is simpler and cache-friendlier (contiguous memory)',
        'Very small n — linear search is faster due to pointer-chasing overhead vs simple array scan',
        'When you need BST operations but cannot control input order and won\'t use a self-balancing variant',
      ],
      vs: [
        {
          name: 'BST vs Hash Table',
          when: 'Hash table wins for pure lookups (O(1) vs O(log n)). BST wins when you need range queries, floor/ceiling, sorted iteration, or predecessor/successor. Pick BST when ordering is part of the contract.',
        },
        {
          name: 'BST vs Sorted Array',
          when: 'Sorted array wins when data is static or append-only — binary search is O(log n) with better cache behaviour (contiguous memory). BST wins when inserts and deletes must remain O(log n) on dynamic data.',
        },
      ],
    },
    failures: [
      {
        name: 'Degenerate Tree on Sorted Input',
        cause: 'Inserting keys in sorted (or reverse-sorted) order into a plain BST — each insertion always goes to the same side, creating a rightward-skewing linked list of height n.',
        symptom: 'O(n) search, insert, and delete on what was supposed to be an O(log n) structure. Stack overflow on deep recursive traversal.',
        fix: 'Use a self-balancing BST (AVL or Red-Black) in any production code path. Alternatively, shuffle input before building a static tree. Never use a plain BST on user-controlled or timestamp-sequential input.',
        severity: 'critical',
      },
      {
        name: 'Incorrect Two-Child Delete Implementation',
        cause: 'Finding the in-order successor\'s value and copying it to the deleted node, then nulling the successor\'s pointer directly instead of recursively deleting the successor via the normal delete path.',
        symptom: 'Duplicate keys appear, or a node with one child is orphaned — breaking the BST invariant silently. Subsequent searches return wrong results.',
        fix: 'After copying the successor\'s value, call delete recursively on the right subtree targeting the successor\'s key. Write exhaustive tests: insert [5,3,7,1,4,6,8], delete 5 (two-child case), verify in-order output is [1,3,4,6,7,8].',
        severity: 'critical',
      },
      {
        name: 'Integer Overflow in Mid Calculation',
        cause: 'Computing midpoint as `Math.floor((low + high) / 2)` when both are large — in 32-bit signed int languages this overflows; in JavaScript it loses integer precision at Number.MAX_SAFE_INTEGER.',
        symptom: 'Binary search over large index ranges returns wrong positions. Subtle and rare — only manifests near array sizes of 2^31 or 2^53.',
        fix: 'Always compute `mid = low + Math.floor((high - low) / 2)`. Not a BST-specific bug but appears in every binary-search derivation including BST index calculations.',
        severity: 'medium',
      },
    ],
    a: {
      v: 'A library organised by Dewey Decimal where each aisle forks left (smaller) and right (larger)',
      t: 'A library',
      tx: 'You stand at the main entrance (root). The sign says 500s are to the left, 600s to the right. You go right, reach another fork: 650s left, 680s right. Each step cuts the search space in half. But if the librarian organised the collection by adding books in alphabetical order of purchase date (already sorted), the library becomes one impossibly long corridor with all the forks pointing right — no different from walking the whole thing linearly. Self-balancing is the librarian who periodically reorganises the aisles so each fork divides the collection evenly.',
      s: 'O(log n) when balanced; O(n) when degenerate — balancing is non-negotiable in production',
    },
    te: {
      def: 'A BST is a binary tree where every node\'s left subtree has smaller keys and right subtree has larger keys. This invariant enables binary search — O(log n) when balanced, O(n) when degenerate. Self-balancing variants (AVL, Red-Black) maintain O(log n) worst-case automatically.',
      types: [
        { n: 'Unbalanced BST', d: 'Simple invariant, no rotation logic. O(log n) average on random input; O(n) worst case on sorted input. Good for illustrating the concept, dangerous in production.' },
        { n: 'AVL Tree', d: 'Strictly balanced (|left height - right height| ≤ 1). Faster lookups than Red-Black. More rotations on insert/delete. Preferred when reads dominate.' },
        { n: 'Red-Black Tree', d: 'Relaxed balance (height ≤ 2 log n). Fewer rotations on write. Used in C++ std::map, Java TreeMap, Linux CFS. Preferred when writes are frequent.' },
        { n: 'B-Tree', d: 'BST generalised to branching factor t >> 2. Nodes map to disk pages. Used by every RDBMS. Height = O(log_t n) — a B-tree of order 100 indexes a million rows in 3 levels.' },
        { n: 'B+ Tree', d: 'B-Tree variant where all data lives in leaves; leaves are linked in a list. Enables efficient range scans. Used by PostgreSQL, MySQL InnoDB, most filesystems.' },
      ],
      when: 'Use when you need O(log n) insert/delete/search AND ordered operations (range queries, floor/ceil, sorted iteration). Switch to hash table when ordering is not needed. Switch to B-tree when data lives on disk.',
      trade: 'BST gives O(log n) for dynamic ordered data but trades O(1) lookup for O(log n), and requires balancing logic to avoid worst-case degradation. The complexity of self-balancing (AVL rotations, Red-Black recolouring) is non-trivial — prefer a well-tested library implementation over rolling your own.',
      code: `// Production-quality BST with all three delete cases,
// floor, ceil, min, max, and in-order traversal.
// No TypeScript types — clean, runnable JavaScript.

class BSTNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BST {
  constructor() {
    this.root = null;
  }

  // O(h) — follow BST invariant to the correct null slot
  insert(key, value) {
    this.root = this._insert(this.root, key, value);
  }

  _insert(node, key, value) {
    if (!node) return new BSTNode(key, value);
    if (key < node.key) {
      node.left = this._insert(node.left, key, value);
    } else if (key > node.key) {
      node.right = this._insert(node.right, key, value);
    } else {
      // Duplicate key: update value in place
      node.value = value;
    }
    return node;
  }

  // O(h) — binary search by key
  search(key) {
    let node = this.root;
    while (node) {
      if (key === node.key) return node.value;
      node = key < node.key ? node.left : node.right;
    }
    return undefined;
  }

  // O(h) — find the leftmost (minimum) node in a subtree
  _min(node) {
    while (node.left) node = node.left;
    return node;
  }

  min() {
    if (!this.root) return undefined;
    return this._min(this.root).key;
  }

  max() {
    if (!this.root) return undefined;
    let node = this.root;
    while (node.right) node = node.right;
    return node.key;
  }

  // Largest key <= the given key
  floor(key) {
    const node = this._floor(this.root, key);
    return node ? node.key : undefined;
  }

  _floor(node, key) {
    if (!node) return null;
    if (key === node.key) return node;
    if (key < node.key) return this._floor(node.left, key);
    // key > node.key: node is a candidate; maybe there's a better one in the right subtree
    const candidate = this._floor(node.right, key);
    return candidate || node;
  }

  // Smallest key >= the given key
  ceil(key) {
    const node = this._ceil(this.root, key);
    return node ? node.key : undefined;
  }

  _ceil(node, key) {
    if (!node) return null;
    if (key === node.key) return node;
    if (key > node.key) return this._ceil(node.right, key);
    const candidate = this._ceil(node.left, key);
    return candidate || node;
  }

  // Delete with all three cases handled correctly.
  // Two-child case: replace with in-order successor, then
  // recursively delete the successor from the right subtree.
  delete(key) {
    this.root = this._delete(this.root, key);
  }

  _delete(node, key) {
    if (!node) return null;

    if (key < node.key) {
      node.left = this._delete(node.left, key);
    } else if (key > node.key) {
      node.right = this._delete(node.right, key);
    } else {
      // Found the node to delete
      if (!node.left) return node.right; // Case 1 & 2: no left child
      if (!node.right) return node.left; // Case 2: no right child

      // Case 3: two children — replace with in-order successor.
      // Successor is the minimum of the right subtree.
      const successor = this._min(node.right);
      node.key = successor.key;
      node.value = successor.value;
      // Now delete the successor from the right subtree.
      // Successor has at most one child (no left child by definition of minimum),
      // so this recursive call will hit case 1 or 2 — not case 3 again.
      node.right = this._delete(node.right, successor.key);
    }
    return node;
  }

  // In-order traversal yields sorted keys — O(n)
  inOrder() {
    const result = [];
    this._inOrder(this.root, result);
    return result;
  }

  _inOrder(node, result) {
    if (!node) return;
    this._inOrder(node.left, result);
    result.push(node.key);
    this._inOrder(node.right, result);
  }
}

// Iterative binary search on a sorted array — for reference.
// Uses safe midpoint to avoid 32-bit overflow.
function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    // Safe midpoint: avoids (low + high) overflow in fixed-width int languages
    const mid = low + Math.floor((high - low) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}

// Usage
const tree = new BST();
[5, 3, 7, 1, 4, 6, 8].forEach(k => tree.insert(k, k * 10));
console.log(tree.inOrder());      // [1, 3, 4, 5, 6, 7, 8]
console.log(tree.floor(4.5));     // 4
console.log(tree.ceil(4.5));      // 5
tree.delete(5);                   // two-child delete
console.log(tree.inOrder());      // [1, 3, 4, 6, 7, 8]`,
      rw: {
        ex: [
          'PostgreSQL B-tree index: every non-hash index defaults to B-tree; supports =, <, >, BETWEEN, and ORDER BY efficiently',
          'Linux CFS scheduler: per-CPU Red-Black tree keyed by virtual runtime — O(log n) to pick the next runnable task, O(log n) to insert a woken task',
          'C++ std::map and std::set: Red-Black tree guaranteeing O(log n) insert/find/erase; std::unordered_map is the hash-table alternative',
          "Git's object store: packfile index uses a sorted list with binary search; the in-memory ref store is a BST for O(log n) ref lookup",
        ],
        cs: 'PostgreSQL\'s B-tree index keeps all leaf pages at the same depth and links them left-to-right as a doubly-linked list. This lets a range scan (WHERE ts BETWEEN x AND y) descend once to the start leaf in O(log n), then follow leaf-page links in O(result_size) without re-traversing the tree — the key insight behind why B+ trees dominate relational DB indexes.',
      },
    },
    interview: {
      q: 'Why do real databases use B-trees instead of binary search trees?',
      a: 'The fundamental bottleneck in a database is disk I/O, not CPU cycles. A disk read fetches a full page (typically 4KB or 16KB) regardless of how few bytes you actually need. A binary tree node holds one key and has two children, so a search touching 30 nodes requires 30 disk reads. A B-tree of order 100 stores up to 199 keys per node and has up to 200 children — each node maps to one disk page, and a search reads at most one page per level. With branching factor 100, a three-level B-tree covers 100³ = 1 million entries with just 3 disk reads. AVL and Red-Black trees are optimised for in-memory access where pointer-chasing is cheap; their height is O(log₂ n), which is fine for RAM but brutal for disk. B-trees have height O(log_t n) where t is the branching factor — orders of magnitude shallower. B+ trees additionally link all leaf nodes in a doubly-linked list, enabling range scans to follow leaf pointers after the initial descent rather than re-traversing the tree.',
      fu: [
        'AVL vs Red-Black: AVL maintains stricter balance (height difference ≤ 1) so lookups are faster; Red-Black allows height up to 2 log n but requires at most 2 rotations on insert and 3 on delete vs AVL\'s O(log n) rotations. Pick Red-Black when writes are frequent, AVL when reads dominate.',
        'In-order traversal for range queries: once you descend to the lower bound of the range, in-order traversal visits each subsequent node in O(1) amortised — total range query cost is O(log n + k) where k is result size. This is why SQL range queries on B+ tree indexes are efficient.',
        'Sorted insertion degrades BST: each new key is larger than all existing keys, so every insert goes right — the "left" child pointer is always null. The tree is a right-skewed linked list of height n. Fix: insert in random order, or shuffle first, or use a self-balancing variant.',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 7. HEAPS & PRIORITY QUEUES
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ds-heap',
    cat: 'dsa',
    color: '#10b981',
    icon: '⛰️',
    title: 'Heaps & Priority Queues',
    tag: 'Always O(log n) insert and O(1) peek at the minimum — guaranteed',
    overview:
      'A binary heap is a complete binary tree stored in an array where every parent ≤ both children (min-heap) or ≥ both children (max-heap). The array-based storage is elegant: for node at index i, left child is at 2i+1, right child is at 2i+2, parent is at floor((i-1)/2). No pointers needed. The heap property gives O(1) min/max peek and O(log n) insert/extract. This makes heaps the ideal backing structure for priority queues — used in Dijkstra\'s shortest path, A* search, task schedulers, and the heap sort algorithm.',
    components: [
      {
        name: 'Heap Array Representation',
        icon: '📦',
        role: 'Complete binary tree stored contiguously in an array — cache-friendly, pointer-free.',
        detail:
          'Complete binary tree stored level by level in an array. Index math: parent(i) = ⌊(i-1)/2⌋, left(i) = 2i+1, right(i) = 2i+2. The complete binary tree property (all levels full except possibly the last, filled left-to-right) ensures the array has no holes. This gives excellent cache locality — all nodes in a subtree are stored near each other.',
      },
      {
        name: 'Heapify (Sift-Up & Sift-Down)',
        icon: '🔄',
        role: 'The two bubble operations that restore the heap property after mutation.',
        detail:
          'Insert: place at end of array (next position), sift-up: swap with parent while parent > child (min-heap). O(log n). Extract-min: swap root with last element, remove last, sift-down root: swap with smaller child while child < parent. O(log n). Sift-down is the key operation — used in both extract and heapify. Sift-up is only used during insert.',
      },
      {
        name: 'Build-Heap in O(n)',
        icon: '⚡',
        role: 'Convert an arbitrary array into a valid heap in linear time — crucial for heap sort and indexed priority queues.',
        detail:
          'Naively inserting n elements: O(n log n). But starting from the middle (last non-leaf = ⌊n/2⌋-1) and sifting down toward index 0: O(n). Proof: most nodes are near the leaves and travel short distances. The total work = Σ h * n/2^h ≈ 2n = O(n). This O(n) build is why heap sort doesn\'t need O(n log n) extra time for the build phase.',
      },
      {
        name: 'd-ary Heaps & Fibonacci Heaps',
        icon: '🔬',
        role: 'Variants that trade different operation costs for specific workloads.',
        detail:
          'd-ary heap (branching factor d): extract-min is O(d log_d n) but decrease-key (used in Dijkstra) is O(log_d n) — faster decrease-key. Fibonacci heap: amortized O(1) insert and decrease-key, O(log n) extract-min. Used in theoretical optimal Dijkstra. Complex to implement — rarely used in practice over binary heap.',
      },
    ],
    howItWorks:
      'Sift-up traces the path from a newly inserted node to the root. At each step, compare the current node with its parent; if the current node is smaller (min-heap), swap. Continue until the heap property is restored or the root is reached. The path length is at most log₂ n, so sift-up is O(log n). Sift-down starts at a node that may violate the heap property relative to its children. Compare the node with both children; if either child is smaller, swap with the smaller child (swapping with the larger would create a new violation). Continue until neither child is smaller or a leaf is reached. Extract-min is the only way to remove the minimum: swap root with the last array element, shrink the array, then sift-down the new root. The O(n) build-heap proof is illuminating: n/2 nodes are leaves (sift distance 0), n/4 are one level up (sift distance ≤ 1), n/8 two levels up (distance ≤ 2). Total work: Σₖ₌₁^{log n} k * n/2^k = n * Σ k/2^k = 2n. So build-heap is O(n) — not O(n log n). For Dijkstra, the classic approach re-pushes (vertex, new_distance) entries when a shorter path is found, and skips any extraction where the extracted distance is greater than the known shortest distance for that vertex (lazy deletion). This avoids implementing decrease-key but wastes O(E) extra space. The alternative — an indexed priority queue that tracks each element\'s position in the heap array — enables O(log n) decrease-key at the cost of maintaining a position map. For dense graphs (E ≈ V²), the benefit rarely justifies the complexity. The two-heap technique for streaming median: maintain a max-heap for the lower half of values and a min-heap for the upper half. After each insert, rebalance so the heaps differ in size by at most 1. The median is the root of the larger heap (odd count) or the average of both roots (even count). Both insertions and median queries are O(log n).',
    decision: {
      choose: [
        'Priority queue semantics — always extract min/max from a dynamic set',
        'Top-K elements from a data stream: maintain a max-heap of size K; if new element < heap.top(), pop and push',
        'Merging k sorted lists: push the first element of each list into a min-heap; extract-min and push the next from that list',
        'Dijkstra / A* / Prim\'s algorithm — all require efficient extract-min and insert',
        'Median maintenance from a data stream — two-heap approach',
      ],
      avoid: [
        'When you need arbitrary key lookup or delete — heap does not support finding a specific key in less than O(n)',
        'When order of retrieval doesn\'t matter — use a plain queue or stack',
        'When k=1 — just track a running min/max variable in O(1)',
        'When you need sorted output for a static array — O(n log n) sort is cleaner and cache-friendlier',
      ],
      vs: [
        {
          name: 'Heap vs BST',
          when: 'Heap gives O(1) min/max peek and O(log n) insert/extract with simpler code. BST gives O(log n) arbitrary lookup, floor/ceil, and full sorted iteration. Pick heap for priority queue semantics; BST when you need the full ordered map interface.',
        },
        {
          name: 'Heap vs Sorted Array',
          when: 'Sorted array gives O(1) min access but O(n) insert (must maintain order). Heap gives O(log n) insert with O(1) peek. Heap wins for dynamic priority queues; sorted array wins when insertions are rare.',
        },
      ],
    },
    failures: [
      {
        name: 'Decrease-Key is O(n) in Binary Heap',
        cause: 'The heap has no index from key to position — finding an element to update its priority requires O(n) scan.',
        symptom: 'Dijkstra with lazy deletion works but wastes memory; a proper decrease-key implementation is O(n) without an index map, silently degrading to O(n²) overall.',
        fix: 'For decrease-key-heavy workloads, maintain a Map from element identity to heap index, updating the index on every swap. This is the indexed priority queue pattern. Or use lazy deletion (re-push with new priority, skip stale extracts).',
        severity: 'high',
      },
      {
        name: 'Max-Heap Where Min-Heap is Needed (Top-K Inversion)',
        cause: 'For top-K smallest elements, the intuitive choice is a min-heap — extract the K smallest. But the correct approach is a max-heap of size K: if the new element is smaller than the max, it belongs in the top-K set.',
        symptom: 'Top-K returns the wrong K elements. Off by a factor of n in time complexity.',
        fix: 'Reason carefully about which end of the heap you need to access. For top-K smallest: max-heap of size K, because you need to quickly determine if a new element beats the current worst-in-K. The heap root must be the element you\'re most willing to evict.',
        severity: 'high',
      },
      {
        name: 'Index Arithmetic Off-by-One (0-based vs 1-based)',
        cause: 'Classic heap textbooks use 1-based indexing (parent = i/2, left = 2i, right = 2i+1). JavaScript arrays are 0-based. Mixing the two formulas produces silent wrong-index access without an out-of-bounds error.',
        symptom: 'Heap property is subtly violated; heap sort produces incorrect output; Dijkstra returns wrong distances with no error thrown.',
        fix: 'Pick one convention at the start and be explicit. For 0-based: parent(i) = Math.floor((i-1)/2), left(i) = 2*i+1, right(i) = 2*i+2. Test with a 3-element heap and verify the index formulas manually.',
        severity: 'medium',
      },
    ],
    a: {
      v: 'A hospital emergency room triage system',
      t: 'An emergency room',
      tx: 'Patients are triaged by severity — the most critical patient always goes to the top of the queue regardless of arrival order. The triage nurse (heap property) ensures this invariant at all times. Adding a new patient (insert): start them at the back, bump them up if more critical than those above (sift-up). Discharging the most critical (extract-min): the next patient in line moves to the front, then gets properly re-positioned (sift-down). The ER never searches the entire waiting room — O(log n) to restore order, O(1) to see who is next.',
      s: 'O(1) peek min/max; O(log n) insert/extract; O(n) build — array-based complete binary tree',
    },
    te: {
      def: 'A binary heap is a complete binary tree in array form satisfying the heap property: every parent ≤ both children (min-heap). Enables O(1) peek and O(log n) insert/extract. The canonical backing structure for priority queues.',
      types: [
        { n: 'Min-Heap', d: 'Root is always the minimum. Extract yields elements in ascending order. Used in Dijkstra, merge k sorted lists, scheduling.' },
        { n: 'Max-Heap', d: 'Root is always the maximum. Used in top-K smallest (keep a max-heap of size K), heap sort.' },
        { n: 'd-ary Heap', d: 'Branching factor d. Decrease-key is O(log_d n) — faster for Dijkstra on dense graphs. Slower extract-min O(d log_d n).' },
        { n: 'Fibonacci Heap', d: 'Amortised O(1) insert and decrease-key, O(log n) extract-min. Theoretically optimal for Dijkstra. Too complex for most production uses.' },
        { n: 'Indexed Priority Queue', d: 'Binary heap augmented with a position map (key → heap index). Enables O(log n) decrease-key. Used in Prim\'s MST and sophisticated Dijkstra implementations.' },
      ],
      when: 'Use when you need repeated extract-min/max, and insertions happen dynamically. Ideal for priority queues, schedulers, graph algorithms (Dijkstra, A*, Prim\'s), and streaming statistics (top-K, median).',
      trade: 'Heaps give O(1) peek and O(log n) insert/extract with excellent cache locality (array-based). The cost: no O(log n) arbitrary lookup or delete (need index map), and no sorted iteration without extracting all elements in O(n log n).',
      code: `// Complete MinHeap with O(n) buildHeap, push, pop, peek.
// IndexedPriorityQueue for Dijkstra with O(log n) decrease-key.
// Two-heap MedianFinder for streaming median.

class MinHeap {
  constructor() {
    this.heap = [];
  }

  // 0-based index arithmetic — derive once and never recalculate
  _parent(i) { return Math.floor((i - 1) / 2); }
  _left(i)   { return 2 * i + 1; }
  _right(i)  { return 2 * i + 2; }

  _swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  // Restore heap property bottom-up after insert
  _siftUp(i) {
    while (i > 0) {
      const p = this._parent(i);
      if (this.heap[p] <= this.heap[i]) break;
      this._swap(i, p);
      i = p;
    }
  }

  // Restore heap property top-down after extract or buildHeap
  _siftDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = this._left(i);
      const r = this._right(i);
      if (l < n && this.heap[l] < this.heap[smallest]) smallest = l;
      if (r < n && this.heap[r] < this.heap[smallest]) smallest = r;
      if (smallest === i) break;
      this._swap(i, smallest);
      i = smallest;
    }
  }

  push(val) {
    this.heap.push(val);
    this._siftUp(this.heap.length - 1);
  }

  // Swap root with last, shrink, sift-down the new root
  pop() {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._siftDown(0);
    }
    return min;
  }

  peek() { return this.heap[0]; }
  size() { return this.heap.length; }

  // Convert arbitrary array to valid heap in O(n).
  // Start at last non-leaf (floor(n/2) - 1) and sift down toward 0.
  // Leaves don't need sifting. Total work: O(n) by the geometric series proof.
  static buildHeap(arr) {
    const h = new MinHeap();
    h.heap = arr.slice(); // copy
    for (let i = Math.floor(h.heap.length / 2) - 1; i >= 0; i--) {
      h._siftDown(i);
    }
    return h;
  }
}

// IndexedPriorityQueue: tracks element positions for O(log n) decrease-key.
// Used in Dijkstra where we need to update distances of already-queued vertices.
class IndexedPriorityQueue {
  constructor() {
    this.heap = [];    // [{key, priority}]
    this.index = new Map(); // key → position in heap
  }

  _parent(i) { return Math.floor((i - 1) / 2); }
  _left(i)   { return 2 * i + 1; }
  _right(i)  { return 2 * i + 2; }

  _swap(i, j) {
    // Update the position index before swapping
    this.index.set(this.heap[i].key, j);
    this.index.set(this.heap[j].key, i);
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  _siftUp(i) {
    while (i > 0) {
      const p = this._parent(i);
      if (this.heap[p].priority <= this.heap[i].priority) break;
      this._swap(i, p);
      i = p;
    }
  }

  _siftDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = this._left(i);
      const r = this._right(i);
      if (l < n && this.heap[l].priority < this.heap[smallest].priority) smallest = l;
      if (r < n && this.heap[r].priority < this.heap[smallest].priority) smallest = r;
      if (smallest === i) break;
      this._swap(i, smallest);
      i = smallest;
    }
  }

  push(key, priority) {
    if (this.index.has(key)) {
      this.decreaseKey(key, priority);
      return;
    }
    this.heap.push({ key, priority });
    const i = this.heap.length - 1;
    this.index.set(key, i);
    this._siftUp(i);
  }

  // O(log n) — the whole point of the index map
  decreaseKey(key, newPriority) {
    const i = this.index.get(key);
    if (i === undefined) throw new Error('Key not in queue');
    if (newPriority >= this.heap[i].priority) return; // not a decrease
    this.heap[i].priority = newPriority;
    this._siftUp(i);
  }

  pop() {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    this.index.delete(min.key);
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.index.set(last.key, 0);
      this._siftDown(0);
    }
    return min;
  }

  peek() { return this.heap[0]; }
  has(key) { return this.index.has(key); }
  size() { return this.heap.length; }
}

// Streaming median: two heaps.
// maxHeap holds the lower half; minHeap holds the upper half.
// Invariant: maxHeap.size >= minHeap.size, diff <= 1.
class MedianFinder {
  constructor() {
    // MaxHeap simulated by negating values in a MinHeap
    this.lower = new MinHeap(); // max-heap (negated) — lower half
    this.upper = new MinHeap(); // min-heap — upper half
  }

  addNum(num) {
    // Always push to lower first (negate for max-heap simulation)
    this.lower.push(-num);

    // Ensure max(lower) <= min(upper) — cross-partition invariant
    if (this.upper.size() > 0 && -this.lower.peek() > this.upper.peek()) {
      this.upper.push(-this.lower.pop());
    }

    // Balance sizes: lower can be at most 1 larger than upper
    if (this.lower.size() > this.upper.size() + 1) {
      this.upper.push(-this.lower.pop());
    } else if (this.upper.size() > this.lower.size()) {
      this.lower.push(-this.upper.pop());
    }
  }

  findMedian() {
    if (this.lower.size() > this.upper.size()) {
      return -this.lower.peek();
    }
    return (-this.lower.peek() + this.upper.peek()) / 2;
  }
}

// Usage
const h = MinHeap.buildHeap([5, 3, 8, 1, 2, 7]);
console.log(h.pop()); // 1
console.log(h.pop()); // 2

const mf = new MedianFinder();
[1, 2, 3, 4, 5].forEach(n => mf.addNum(n));
console.log(mf.findMedian()); // 3`,
      rw: {
        ex: [
          "Dijkstra's shortest path: min-heap on (distance, vertex) extracts the closest unvisited vertex in O(log V); each edge relaxation is O(log V) push — total O((V+E) log V)",
          'k-way merge for external sort: push the first element of each of k sorted runs into a min-heap; each extract-min followed by a push from the same run — O(n log k) total',
          "Node.js timer queue: libuv uses a min-heap (keyed by expiry timestamp) to efficiently find the next timer to fire — O(log n) schedule/cancel, O(1) peek at the next expiry",
          'OS process scheduler: Linux O(1) and CFS schedulers use heap-like structures; embedded RTOSes use fixed-size binary heaps for deterministic interrupt latency',
        ],
        cs: "Node.js's libuv uses a binary min-heap for its timer implementation (deps/uv/src/timer.c). When you call setTimeout(fn, ms), libuv inserts (expiry_time, callback) into the heap. The event loop's I/O polling timeout is computed as heap.peek().expiry - now — so the loop wakes up exactly when the next timer fires. This gives O(log n) timer registration and O(log n) cancellation while keeping O(1) peek for the polling timeout calculation.",
      },
    },
    interview: {
      q: 'Walk me through how you\'d find the median of a data stream in O(log n) per insert.',
      a: 'Maintain two heaps: a max-heap for the lower half of values and a min-heap for the upper half. After each insertion, enforce two invariants: (1) every element in the lower half is ≤ every element in the upper half, and (2) the sizes differ by at most 1. To insert x: push to the lower heap first. If the lower heap\'s max exceeds the upper heap\'s min, move the max to the upper heap. Then rebalance sizes if they differ by more than 1. The median is the root of the larger heap (odd count) or the average of both roots (even count). Both insert and query are O(log n). Edge cases: empty stream (undefined median), single element (that element), even vs odd count.',
      fu: [
        'O(n) build-heap proof: there are n/2 leaves (sift distance 0), n/4 nodes at height 1 (distance ≤ 1), n/8 at height 2 (distance ≤ 2). Total: Σₖ k·n/2^k = n·Σ k/2^k = 2n — the geometric series telescopes to O(n). This is why heap sort is O(n log n) overall despite the O(n) build.',
        'Lazy deletion for Dijkstra: instead of decrease-key, push a new (distance, vertex) entry when a shorter path is found. On extraction, check if the extracted distance equals the known shortest distance for that vertex — if not, it\'s stale, skip it. Uses O(E) extra space in the heap but avoids index map complexity.',
        'Top-K with a heap: use a max-heap of size K for top-K smallest. For each new element, if it\'s smaller than the heap root, pop the root and push the new element. After processing n elements, the heap contains the K smallest. Time: O(n log K). The max-heap (not min-heap) is correct because you want to eject the current worst element in your K-set when a better one arrives.',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 8. GRAPHS
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ds-graph',
    cat: 'dsa',
    color: '#10b981',
    icon: '🕸️',
    title: 'Graphs',
    tag: 'Vertices and edges — modelling every relationship in computing',
    overview:
      'A graph G = (V, E) is a set of vertices (nodes) connected by edges. Directed or undirected. Weighted or unweighted. Cyclic or acyclic. Trees are a special case (connected, acyclic, undirected). Graphs model: network topology, social relationships, dependency resolution, state machines, web page link structure, road maps, and the call graph of a program. Every major graph algorithm — BFS, DFS, Dijkstra, Bellman-Ford, topological sort, Kruskal\'s, Prim\'s — is a tool for answering one of: is there a path? what\'s the shortest path? what\'s the minimum spanning tree? is there a cycle?',
    components: [
      {
        name: 'Adjacency List vs Matrix',
        icon: '📋',
        role: 'The two canonical representations — trade space for O(1) edge lookup or save space at the cost of O(degree) lookup.',
        detail:
          'Adjacency list: array of lists, list[u] contains all vertices v such that edge (u,v) exists. Space: O(V+E). Edge lookup: O(degree(u)). Adjacency matrix: V×V boolean/weight matrix. Space: O(V²). Edge lookup: O(1). Use list for sparse graphs (E << V²); matrix for dense graphs or when O(1) edge lookup is needed. Most real graphs are sparse (social networks, road maps) — adjacency list dominates.',
      },
      {
        name: 'BFS (Breadth-First Search)',
        icon: '🌊',
        role: 'Layer-by-layer exploration — finds shortest path by edge count in unweighted graphs.',
        detail:
          'Explores vertices layer by layer. Uses a queue. Finds shortest path in terms of edge count (unweighted). Marks visited to avoid cycles. Time: O(V+E). Space: O(V) for the queue and visited set. Used for: shortest unweighted path, connected components, bipartite check, level-order tree traversal.',
      },
      {
        name: 'DFS (Depth-First Search)',
        icon: '🔍',
        role: 'Deep-first exploration — discovers structure (cycles, SCCs, topological order) via discovery/finish times.',
        detail:
          'Explores as deep as possible before backtracking. Uses a stack (implicit recursion or explicit). Discovers finish times used in topological sort and strongly connected components (Kosaraju/Tarjan). Time: O(V+E). Space: O(V) recursion depth. Used for: cycle detection, topological sort, SCC, maze solving, path existence.',
      },
      {
        name: 'Topological Sort',
        icon: '📐',
        role: 'Linear ordering of a DAG where every edge u→v places u before v — the foundation of build systems and package managers.',
        detail:
          'Linear ordering of vertices such that for every directed edge u→v, u comes before v. Only possible in DAGs (Directed Acyclic Graphs). Kahn\'s algorithm: repeatedly remove nodes with in-degree 0 using a queue. DFS-based: push to result in post-order, reverse. If a cycle exists, Kahn\'s detects it (not all nodes processed). Used for: build systems, task dependency resolution, course scheduling, package management.',
      },
    ],
    howItWorks:
      'BFS shortest path works by maintaining a parent map: when you enqueue vertex v because you reached it from u, record parent[v] = u. After BFS terminates, reconstruct the path by walking parent pointers from the target back to the source and reversing. This gives the shortest path by edge count because BFS processes all distance-k vertices before any distance-(k+1) vertex — the queue enforces this layer-by-layer property. For weighted graphs, BFS gives wrong answers because it treats all edges equally. Dijkstra fixes this with a greedy invariant: once a vertex is extracted from the priority queue with distance d, d is provably the shortest path distance from the source. The relaxation step: for each neighbour v of u, if dist[u] + weight(u,v) < dist[v], update dist[v] and push (new_distance, v) into the priority queue. This works because edge weights are non-negative — a later-discovered path through a new vertex cannot shorten an already-settled vertex\'s distance. Negative edges break this: a negative-weight edge means a "later" path to a settled vertex can be shorter, invalidating the settled distance. Use Bellman-Ford (relax all edges V-1 times) for negative weights; after V-1 passes, a V-th pass that still finds relaxation indicates a negative cycle. DFS timestamps (discovery time d[v] and finish time f[v]) reveal graph structure. In a DFS of a directed graph, an edge u→v is a back-edge (v is an ancestor of u) if and only if d[v] < d[u] < f[u] < f[v] — i.e., v was discovered before u and finished after u. Back edges are exactly the edges that create cycles. For topological sort via DFS: push a vertex to the result stack when it finishes (all its descendants have been explored). Reverse the stack at the end. This works because a vertex finishes only after all vertices it can reach have finished — so earlier-finishing vertices must come later in topological order. Kahn\'s algorithm is often preferred in practice because it naturally detects cycles (result length < V means a cycle prevented some nodes from reaching in-degree 0), and it\'s iterative (no recursion depth concerns).',
    decision: {
      choose: [
        'BFS: shortest unweighted path, level-order exploration, connected components, bipartite detection',
        'DFS: cycle detection, topological sort, SCCs (Kosaraju/Tarjan), path existence, generating permutations/subsets',
        'Dijkstra: single-source shortest path with non-negative edge weights',
        'Bellman-Ford: shortest path with negative edge weights, or when you need to detect negative cycles',
        'Topological sort: any dependency resolution — build systems, package managers, course prerequisites, task scheduling',
      ],
      avoid: [
        'Adjacency matrix for sparse graphs — O(V²) space wastes memory and makes iteration O(V) per vertex instead of O(degree)',
        'Recursive DFS without an explicit stack depth limit on graphs with millions of vertices — stack overflow',
        'Dijkstra with negative edge weights — gives silently wrong answers without erroring',
        'Topological sort on a graph you haven\'t verified is a DAG — Kahn\'s won\'t error, it silently returns partial results',
      ],
      vs: [
        {
          name: 'BFS vs DFS',
          when: 'BFS for shortest unweighted path and level-order; DFS for structural discovery (cycles, SCCs, topological order). BFS uses O(V) queue space proportional to graph width; DFS uses O(V) stack space proportional to graph depth.',
        },
        {
          name: 'Dijkstra vs Bellman-Ford',
          when: 'Dijkstra: O((V+E) log V) with binary heap, non-negative weights only. Bellman-Ford: O(VE), handles negative weights, detects negative cycles. Use Dijkstra when possible; fall back to Bellman-Ford for negative weights or SPFA heuristic for practical speedup.',
        },
      ],
    },
    failures: [
      {
        name: 'Missing Visited Set on Cyclic Graph',
        cause: 'BFS or DFS without a visited set on a graph containing a cycle — the traversal re-enqueues/re-visits already-processed vertices indefinitely.',
        symptom: 'Infinite loop or infinite recursion. Node.js process hangs; browser tab freezes. Immediate and reproducible once a cycle exists.',
        fix: 'Always initialise a visited Set before traversal. Add the visited check as the FIRST thing when dequeuing (BFS) or entering (DFS) a vertex, not after processing. For directed graphs, use three-colour marking (white/grey/black) to also distinguish tree edges from back edges.',
        severity: 'critical',
      },
      {
        name: 'Dijkstra with Negative Edge Weights',
        cause: 'Dijkstra\'s greedy assumption: once a vertex is settled (extracted from the priority queue), its shortest distance is final. A negative edge can later provide a cheaper route to a "settled" vertex, invalidating this assumption.',
        symptom: 'Dijkstra terminates successfully but returns wrong shortest path distances. The bug is silent — no exception, no NaN, just incorrect numbers. Often manifests only on specific graph topologies.',
        fix: 'Detect negative edges before running Dijkstra; if any exist, use Bellman-Ford. Never run Dijkstra on graphs with negative weights — it gives wrong answers confidently.',
        severity: 'critical',
      },
      {
        name: 'Topological Sort on a Cyclic Graph',
        cause: 'Kahn\'s algorithm enqueues only vertices with in-degree 0. Vertices in a cycle always have in-degree ≥ 1 (their predecessor is in the same cycle), so they are never enqueued.',
        symptom: 'Kahn\'s returns a result with fewer than V vertices — the missing vertices are involved in cycles. If not checked, the partial result is silently used as if it were a valid topological order.',
        fix: 'After Kahn\'s algorithm, assert result.length === V. If not, a cycle exists — report the offending nodes (they are the ones not in the result). npm displays "circular dependency detected" using exactly this check.',
        severity: 'high',
      },
    ],
    a: {
      v: 'A city road map',
      t: 'A city',
      tx: 'Intersections are vertices, roads are edges. BFS from your hotel finds the nearest coffee shop (fewest turns). Dijkstra finds the fastest route (weighted by travel time). DFS explores every alley before backtracking — useful for finding if any path exists at all. Topological sort answers: given that road A must be built before road B (which needs A\'s bridge), what\'s a valid build order? A cycle in the dependencies (A needs B, B needs A) is a deadlock — topological sort detects it before ground is broken.',
      s: 'Model: adjacency list. Explore: BFS (shortest), DFS (structure). Weight: Dijkstra. Dependency: topo sort.',
    },
    te: {
      def: 'A graph G = (V, E) models pairwise relationships between entities. Operations: traversal (BFS/DFS), shortest path (Dijkstra/Bellman-Ford), cycle detection, topological sort, connected components, minimum spanning tree. The correct algorithm depends on directedness, weights, and whether cycles are present.',
      types: [
        { n: 'Undirected Graph', d: 'Edges have no direction. Connectivity is symmetric. Used for: network topology, social relationships, road maps.' },
        { n: 'Directed Graph (Digraph)', d: 'Edges have direction. u→v does not imply v→u. Used for: dependency resolution, web page links, call graphs.' },
        { n: 'DAG (Directed Acyclic Graph)', d: 'Directed, no cycles. Enables topological sort. Used for: build systems, task scheduling, spreadsheet dependency evaluation.' },
        { n: 'Weighted Graph', d: 'Edges carry numeric weights. Shortest path requires Dijkstra (non-negative) or Bellman-Ford (negative allowed).' },
        { n: 'Bipartite Graph', d: 'Vertices can be divided into two disjoint sets with edges only between sets. Detectable via BFS 2-colouring. Used in matching problems.' },
      ],
      when: 'Use graph algorithms when modelling pairwise relationships where the structure itself (connectivity, cycles, order) is the problem. BFS for shortest unweighted path; DFS for structural analysis; Dijkstra for weighted shortest path; topological sort for ordering with dependencies.',
      trade: 'Adjacency list: O(V+E) space, O(degree) edge lookup — correct for sparse graphs. Adjacency matrix: O(V²) space, O(1) edge lookup — only justified for dense graphs or frequent edge-existence checks. Graph algorithms are typically O(V+E) time; shortest path adds log V for the priority queue.',
      code: `// Graph with adjacency list, BFS shortest-path reconstruction,
// DFS cycle detection (3-colour), Kahn's topological sort, and Dijkstra.

class Graph {
  constructor(directed = false) {
    this.directed = directed;
    this.adj = new Map(); // vertex → [{to, weight}]
  }

  addVertex(v) {
    if (!this.adj.has(v)) this.adj.set(v, []);
  }

  addEdge(u, v, weight = 1) {
    this.addVertex(u);
    this.addVertex(v);
    this.adj.get(u).push({ to: v, weight });
    if (!this.directed) this.adj.get(v).push({ to: u, weight });
  }

  // BFS: returns shortest path (by edge count) from src to dst.
  // Returns [] if no path exists.
  bfsShortestPath(src, dst) {
    const visited = new Set([src]);
    const parent = new Map([[src, null]]);
    const queue = [src];

    while (queue.length > 0) {
      const u = queue.shift();
      if (u === dst) break;
      for (const { to: v } of (this.adj.get(u) || [])) {
        if (!visited.has(v)) {
          visited.add(v);
          parent.set(v, u);
          queue.push(v);
        }
      }
    }

    if (!parent.has(dst)) return []; // no path
    // Reconstruct path by following parent pointers back from dst
    const path = [];
    let cur = dst;
    while (cur !== null) {
      path.push(cur);
      cur = parent.get(cur);
    }
    return path.reverse();
  }

  // DFS cycle detection for directed graphs using 3-colour marking.
  // WHITE (0) = unvisited, GREY (1) = in current DFS path, BLACK (2) = done.
  // A back edge (grey → grey) indicates a cycle.
  hasCycle() {
    const WHITE = 0, GREY = 1, BLACK = 2;
    const colour = new Map();
    for (const v of this.adj.keys()) colour.set(v, WHITE);

    const dfs = (u) => {
      colour.set(u, GREY);
      for (const { to: v } of (this.adj.get(u) || [])) {
        if (colour.get(v) === GREY) return true; // back edge = cycle
        if (colour.get(v) === WHITE && dfs(v)) return true;
      }
      colour.set(u, BLACK);
      return false;
    };

    for (const v of this.adj.keys()) {
      if (colour.get(v) === WHITE && dfs(v)) return true;
    }
    return false;
  }

  // Kahn's topological sort for DAGs.
  // Returns [] if a cycle is detected (result.length < V).
  topologicalSort() {
    const inDegree = new Map();
    for (const v of this.adj.keys()) inDegree.set(v, 0);
    for (const [, edges] of this.adj) {
      for (const { to: v } of edges) {
        inDegree.set(v, (inDegree.get(v) || 0) + 1);
      }
    }

    // Start with all vertices that have no incoming edges
    const queue = [];
    for (const [v, deg] of inDegree) {
      if (deg === 0) queue.push(v);
    }

    const result = [];
    while (queue.length > 0) {
      const u = queue.shift();
      result.push(u);
      for (const { to: v } of (this.adj.get(u) || [])) {
        inDegree.set(v, inDegree.get(v) - 1);
        if (inDegree.get(v) === 0) queue.push(v);
      }
    }

    // If result doesn't contain all vertices, a cycle prevented some from reaching in-degree 0
    if (result.length !== this.adj.size) {
      throw new Error(\`Cycle detected — topological sort impossible. Processed \${result.length}/\${this.adj.size} vertices.\`);
    }
    return result;
  }

  // Dijkstra's single-source shortest path.
  // Requires non-negative weights — silently wrong with negative edges.
  dijkstra(src) {
    const dist = new Map();
    const prev = new Map();
    for (const v of this.adj.keys()) dist.set(v, Infinity);
    dist.set(src, 0);

    // Simple min-heap via sorted array for clarity;
    // replace with a proper MinHeap in production for O((V+E) log V)
    const pq = [{ v: src, d: 0 }];

    while (pq.length > 0) {
      pq.sort((a, b) => a.d - b.d); // O(n log n) — use MinHeap in prod
      const { v: u, d: du } = pq.shift();

      // Lazy deletion: skip stale entries
      if (du > dist.get(u)) continue;

      for (const { to: v, weight: w } of (this.adj.get(u) || [])) {
        const alt = dist.get(u) + w;
        if (alt < dist.get(v)) {
          dist.set(v, alt);
          prev.set(v, u);
          pq.push({ v, d: alt });
        }
      }
    }

    return { dist, prev };
  }

  // Reconstruct path from Dijkstra's prev map
  getPath(prev, dst) {
    const path = [];
    let cur = dst;
    while (cur !== undefined) {
      path.push(cur);
      cur = prev.get(cur);
    }
    return path.reverse();
  }
}

// Usage
const g = new Graph(true); // directed
['a','b','c','d','e'].forEach(v => g.addVertex(v));
g.addEdge('a', 'b', 4); g.addEdge('a', 'c', 2);
g.addEdge('c', 'b', 1); g.addEdge('b', 'd', 5);
g.addEdge('c', 'd', 8); g.addEdge('d', 'e', 2);

const { dist, prev } = g.dijkstra('a');
console.log(dist.get('d'));           // 8 (a→c→b→d)
console.log(g.getPath(prev, 'd'));    // ['a','c','b','d']

const dag = new Graph(true);
dag.addEdge('build', 'test');
dag.addEdge('test', 'deploy');
dag.addEdge('build', 'lint');
console.log(dag.topologicalSort()); // ['build', 'lint', 'test', 'deploy'] (order may vary)`,
      rw: {
        ex: [
          "npm dependency resolution: package.json dependencies form a DAG; npm uses topological sort to determine install order and Kahn's algorithm to detect circular dependencies",
          "Google Maps / routing engines: road network as a weighted directed graph; Dijkstra (or A* with geographic heuristic) for shortest/fastest path — Google Maps processes ~1 billion routing queries per day",
          'Social network friend-of-friend: BFS from a user vertex to find degree-2 connections (Facebook\'s "People You May Know"); shortest path between users as "degrees of separation"',
          "Kubernetes pod scheduling: the scheduler models node affinity/anti-affinity constraints as a graph; topological sort ensures dependent pods start in the correct order",
        ],
        cs: "npm uses Kahn's topological sort algorithm to determine the order in which packages must be installed (all of a package's dependencies must be installed before it). When npm detects a cycle (package A depends on B which depends on A), Kahn's algorithm surfaces this by terminating with fewer than V packages processed — npm then walks the remaining nodes to report which packages form the cycle. This is why npm's circular dependency error message lists the exact cycle: it comes directly from the unprocessed queue after Kahn's terminates.",
      },
    },
    interview: {
      q: "How does Dijkstra's algorithm work and why does it fail with negative edge weights?",
      a: "Dijkstra's is a greedy algorithm maintaining a set of 'settled' vertices whose shortest path from the source is known. It initialises dist[src] = 0, dist[v] = ∞ for all others, then repeatedly extracts the minimum-distance unsettled vertex u and relaxes its outgoing edges: for each neighbour v, if dist[u] + w(u,v) < dist[v], update dist[v] and push v into the priority queue. The greedy argument: when u is extracted with distance d, every path to u through an unprocessed vertex would have gone through u's already-extracted neighbours, each of which has a larger or equal distance. Adding non-negative edge weights to an already-larger-or-equal value cannot produce a smaller distance — so d is final. This argument breaks with a negative edge: a yet-to-be-processed vertex w might have edge w→u with weight -10, and dist[w] = d + 5, giving dist[w] + (-10) = d - 5 < d — cheaper than the 'settled' distance. Dijkstra already marked u as settled and will never revisit it.",
      fu: [
        "Bellman-Ford for negative weights: relax all E edges V-1 times. After V-1 iterations, all shortest paths of at most V-1 edges are correct. A V-th pass that still relaxes any edge indicates a negative cycle (impossible to determine 'shortest' path). O(VE) — slower than Dijkstra but handles negative weights.",
        "Topological sort cycle detection: Kahn's processes only vertices with in-degree 0. Vertices in a cycle maintain in-degree ≥ 1 permanently because their predecessor is in the same cycle. After Kahn's terminates, if result.length < V, the missing vertices are the cycle participants. You can identify the exact cycle by following predecessor pointers from any unprocessed vertex.",
        'BFS for unweighted shortest path: BFS explores all vertices at distance k before distance k+1. The first time BFS reaches the target, it has found a shortest path by edge count — because no shorter path exists (it would have been explored in an earlier BFS layer). Track parent pointers during BFS to reconstruct the path. Time: O(V+E). For weighted graphs, use Dijkstra.',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 9. TRIES (PREFIX TREES)
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ds-trie',
    cat: 'dsa',
    color: '#10b981',
    icon: '🔤',
    title: 'Tries (Prefix Trees)',
    tag: 'String keys stored character by character — O(m) search regardless of n',
    overview:
      'A Trie (prefix tree) stores strings by decomposing them into characters, with each edge representing one character and each path from root to a marked node representing a stored string. Search, insert, and delete are O(m) where m is the string length — independent of n (number of stored strings). This is asymptotically similar to a hash table for exact lookup, but the Trie wins on prefix queries: autocomplete, longest-prefix matching, and enumeration of all strings sharing a prefix are operations that hash tables simply cannot do in sub-O(n) time. DNS routing tables, IP routing (CIDR prefix matching), autocomplete systems, and spell checkers are all Trie applications.',
    components: [
      {
        name: 'TrieNode Structure',
        icon: '🔵',
        role: 'Each node holds character-to-child mappings and an end-of-word marker.',
        detail:
          'Each node holds: a Map of character → child TrieNode (or fixed array of 26 for lowercase letters), and a boolean isEnd marking whether this node completes a stored word. The root represents the empty prefix. Space: O(ALPHABET_SIZE × N × M) worst case — tries can be memory-heavy for large alphabets. Compressed tries (Patricia/Radix trees) merge chains of single-child nodes into one edge with a substring label.',
      },
      {
        name: 'Insert & Search',
        icon: '🔎',
        role: 'O(m) insert and exact-match search, plus prefix existence check (startsWith).',
        detail:
          'Insert "apple": start at root, follow \'a\'→\'p\'→\'p\'→\'l\'→\'e\', creating nodes as needed, mark last as isEnd=true. Search "apple": follow same path — if any character is missing, return false; if path exists but isEnd is false, the prefix exists but not the whole word. O(m) both. StartsWith (prefix search): same as search but don\'t check isEnd — just check if path exists.',
      },
      {
        name: 'Autocomplete',
        icon: '💡',
        role: 'Enumerate all words sharing a prefix via DFS from the prefix node.',
        detail:
          'Find all words with a given prefix: traverse to prefix node (O(m)), then DFS from that node collecting all paths to isEnd nodes. Used in: Google search suggestions, IDE code completion, spell checkers, phone keyboard suggestions. Can add word frequency to nodes and use a min-heap of size K to return top-K suggestions.',
      },
      {
        name: 'Compressed Trie / Radix Tree',
        icon: '🗜️',
        role: 'Merge single-child chains into multi-character edge labels to slash memory usage.',
        detail:
          'Standard Trie wastes memory on long shared prefixes (each char is a separate node). Radix tree: merge chains of single-child nodes into edges labelled with substrings. Patricia Trie: binary version. Used in Linux kernel\'s routing tables, nginx URL routing, Go\'s HTTP router. Reduces space from O(n×m) to O(n) nodes.',
      },
    ],
    howItWorks:
      'Insert traverses the trie character by character from the root. For each character, check if the current node has a child for that character; if not, create a new TrieNode and add it. After processing all characters, set isEnd = true on the final node. Search follows the same traversal but returns false immediately if any character is missing, and checks isEnd on the final node (to distinguish "app" as a prefix of "apple" from "app" as a stored word). Delete is the trickiest operation: after marking isEnd = false on the final node, walk back up and prune any orphaned nodes (nodes with no children and isEnd = false). Failing to prune leaves dead branches that consume memory without purpose. Autocomplete is where the Trie shines: traverse to the node corresponding to the given prefix in O(m), then DFS from that node, accumulating the suffix at each isEnd node (by passing a current-path string down the DFS). For top-K autocomplete, augment each isEnd node with an insertion frequency counter, and use a min-heap of size K during the DFS to track the highest-frequency completions seen so far — once the heap is full, only push if the new frequency beats the heap minimum (and pop the minimum). The DFS terminates early if no remaining subtree can improve the heap. For IP routing, a 32-bit IPv4 address is stored bit-by-bit in a binary trie (alphabet size = 2). A CIDR block like 192.168.1.0/24 stores 24 bits then marks isEnd. Longest prefix matching: traverse all 32 bits of an incoming packet\'s destination IP, recording the last isEnd node visited. The recorded node gives the longest matching prefix — the most specific route in the routing table. This is identical in structure to a standard string trie, just with a binary alphabet and fixed depth of 32.',
    decision: {
      choose: [
        'Autocomplete and prefix search — the canonical Trie use case; no alternative comes close',
        'IP/CIDR prefix matching (binary trie, bit-by-bit traversal)',
        'Spell checking and dictionary lookup with prefix suggestions',
        'When shared prefixes are common and memory can be saved via compression (Radix trie)',
        'Lexicographic sorting of a set of strings — in-order DFS yields sorted output',
      ],
      avoid: [
        'When no prefix operations are needed — a hash table is simpler and equally fast for exact lookup',
        'Very large alphabets (Unicode) without compression — 130k+ possible children per node via Map is expensive',
        'When n is very small — a flat array with linear search beats a Trie for < ~100 strings',
        'When strings are not the keys — Tries are exclusively for string (or bit-string) key spaces',
      ],
      vs: [
        {
          name: 'Trie vs HashMap',
          when: 'HashMap wins for exact lookup (O(1) average vs O(m)). Trie wins for prefix search, autocomplete, and enumeration of all keys sharing a prefix — impossible with HashMap in less than O(n) time. Trie also wins for lexicographic iteration without sorting.',
        },
        {
          name: 'Trie vs BST',
          when: 'BST on string keys compares full strings at each node — O(m log n) for search. Trie compares one character per level — O(m) regardless of n. Trie wins when n is large and m is modest. BST wins when you need floor/ceil/range on arbitrary data types, not just strings.',
        },
      ],
    },
    failures: [
      {
        name: 'Memory Explosion with Large Alphabet',
        cause: 'Using a fixed 26-element array per node for an application that processes Unicode strings — or allocating a Map per node but with extremely high fanout.',
        symptom: 'Memory usage far exceeds the size of the stored strings. A trie storing 10k URLs may consume more RAM than the raw strings themselves.',
        fix: 'Use Map (sparse) per node for large or variable alphabets — only allocate entries for characters that actually appear. For extreme memory constraints, use a Radix/Compressed trie or a Ternary Search Trie (each node stores one character + three children: less than, equal, greater than — reduces space while maintaining O(m) search).',
        severity: 'high',
      },
      {
        name: 'Missing isEnd Flag — Treating Prefix as Word',
        cause: 'Checking only whether the node exists at the end of a traversal, without checking isEnd — conflating prefix existence with word existence.',
        symptom: 'search("app") returns true because the path exists (as a prefix of "apple"), even though "app" was never inserted. False positives in spell checking, autocomplete returns partial words.',
        fix: 'Always check isEnd on the terminal node for exact-match search. Implement separate search() (checks isEnd) and startsWith() (does not) methods with explicit contracts.',
        severity: 'high',
      },
      {
        name: 'Delete Without Cleanup — Orphaned Nodes',
        cause: 'Deleting a word by only clearing isEnd on the final node, without pruning nodes that are now dead (no children, isEnd = false).',
        symptom: 'Memory leak proportional to the number of deleted words. In long-running processes (search engines updating their dictionary), memory grows without bound.',
        fix: 'Implement recursive delete that returns whether a node should be pruned: after recursing into a child, if the child has no remaining children and isEnd is false, set the parent\'s pointer to null (prune it). Work bottom-up so each pruned node potentially enables its parent to be pruned.',
        severity: 'medium',
      },
    ],
    a: {
      v: 'An index at the back of a textbook',
      t: 'A textbook index',
      tx: 'Instead of listing every word with its page, the index groups words by shared starting letters. You flip to "P", then "PR", then "PRE" — each step narrows the section. Finding all words starting with "pre" means finding the "pre" section and listing everything in it — impossible with a flat page-number lookup. The trie\'s tree structure makes prefix queries free; a hash table can tell you if "prefix" exists but cannot list all words starting with "pre" without scanning every entry.',
      s: 'O(m) search/insert; prefix queries free; memory trades off against branching factor',
    },
    te: {
      def: 'A Trie is a tree where each path from root to an isEnd node encodes a stored string, one character per edge. Search/insert/delete are O(m) (string length) regardless of n (number of stored strings). The killer feature: prefix search and autocomplete in O(m + output).',
      types: [
        { n: 'Standard Trie', d: 'One node per character. Simple to implement. Memory: O(ALPHABET × N × M) worst case. Best for small, fixed alphabets (a-z).' },
        { n: 'Compressed / Radix Trie', d: 'Merges single-child chains into multi-character edges. O(n) nodes regardless of string lengths. Used in nginx, Linux routing, Go HTTP router.' },
        { n: 'Patricia Trie', d: 'Binary radix tree where edges store bit-offsets, not substrings. Used for IP routing tables — traversal is bit manipulation, not string comparison.' },
        { n: 'Ternary Search Trie', d: 'Each node has three children: less-than, equal, greater-than. Space-efficient for large alphabets; O(m log n) search but with low constant. Better cache behaviour than standard Trie.' },
        { n: 'Binary Trie (for integers/IPs)', d: 'Bit-by-bit trie for fixed-width integers. Used for IP routing (longest prefix match), integer range queries, and XOR-trie problems (maximum XOR in array).' },
      ],
      when: 'Use when strings are the keys and prefix operations matter. Autocomplete, IP routing, spell check, URL routing. Switch to HashMap when only exact lookup is needed. Switch to Radix Trie when memory is constrained.',
      trade: 'Trie gives O(m) search/insert with built-in prefix support. Cost: memory overhead per node (especially with Map-based children), and more complex implementation than a HashMap. For pure exact lookup, HashMap is simpler and comparably fast. For prefix queries, there is no competitive alternative.',
      code: `// Trie with insert, search, startsWith, delete (with pruning),
// and autocomplete returning top-K by frequency using a min-heap.

class TrieNode {
  constructor() {
    this.children = new Map(); // char → TrieNode — sparse, handles any alphabet
    this.isEnd = false;
    this.frequency = 0; // for autocomplete ranking
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // O(m) — create nodes as needed, increment frequency on completion
  insert(word, freq = 1) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode());
      }
      node = node.children.get(ch);
    }
    node.isEnd = true;
    node.frequency += freq;
  }

  // O(m) — exact match: path must exist AND isEnd must be true
  search(word) {
    const node = this._traverse(word);
    return node !== null && node.isEnd;
  }

  // O(m) — prefix existence: path must exist, isEnd irrelevant
  startsWith(prefix) {
    return this._traverse(prefix) !== null;
  }

  // Walk the trie for the given string; return terminal node or null
  _traverse(str) {
    let node = this.root;
    for (const ch of str) {
      if (!node.children.has(ch)) return null;
      node = node.children.get(ch);
    }
    return node;
  }

  // O(m) delete with bottom-up pruning.
  // Returns true if the caller should delete the reference to this node.
  delete(word) {
    this._delete(this.root, word, 0);
  }

  _delete(node, word, depth) {
    if (!node) return false;
    if (depth === word.length) {
      // Found the word's terminal node — unmark it
      node.isEnd = false;
      node.frequency = 0;
      // Prune this node if it has no children
      return node.children.size === 0;
    }
    const ch = word[depth];
    if (!node.children.has(ch)) return false; // word not in trie

    const shouldDeleteChild = this._delete(node.children.get(ch), word, depth + 1);
    if (shouldDeleteChild) {
      node.children.delete(ch);
      // Prune this node if it has no remaining children and isn't a word end
      return node.children.size === 0 && !node.isEnd;
    }
    return false;
  }

  // Return top-k completions for prefix, ranked by insertion frequency.
  // O(m + T) where T is the size of the subtree under the prefix node.
  autocomplete(prefix, k = 5) {
    const prefixNode = this._traverse(prefix);
    if (!prefixNode) return [];

    // Min-heap of size k: [{word, freq}], keyed by freq.
    // When heap reaches size k, only push if new freq > heap minimum.
    const heap = [];
    const heapPush = (item) => {
      heap.push(item);
      heap.sort((a, b) => a.freq - b.freq); // prod: use a proper MinHeap
      if (heap.length > k) heap.shift(); // evict lowest frequency
    };

    // DFS from prefix node, collecting word completions
    const dfs = (node, current) => {
      if (node.isEnd) {
        heapPush({ word: prefix + current, freq: node.frequency });
      }
      for (const [ch, child] of node.children) {
        dfs(child, current + ch);
      }
    };
    dfs(prefixNode, '');

    return heap.sort((a, b) => b.freq - a.freq).map(e => e.word);
  }
}

// Binary Trie for IP prefix matching (longest prefix match).
// Stores CIDR blocks as 32-bit binary paths; lookup returns the
// most specific matching route for a destination IP.
class IPRoutingTrie {
  constructor() {
    this.root = { children: [null, null], route: null };
  }

  // Store a CIDR block: ip = 32-bit integer, prefix_len = e.g. 24 for /24
  addRoute(ip, prefixLen, route) {
    let node = this.root;
    for (let bit = 31; bit >= 32 - prefixLen; bit--) {
      const b = (ip >> bit) & 1;
      if (!node.children[b]) {
        node.children[b] = { children: [null, null], route: null };
      }
      node = node.children[b];
    }
    node.route = route;
  }

  // Longest prefix match: return the most specific route for a destination IP
  lookup(ip) {
    let node = this.root;
    let bestRoute = node.route;
    for (let bit = 31; bit >= 0; bit--) {
      const b = (ip >> bit) & 1;
      if (!node.children[b]) break;
      node = node.children[b];
      if (node.route !== null) bestRoute = node.route; // more specific match
    }
    return bestRoute;
  }
}

// Usage
const trie = new Trie();
trie.insert('apple', 10);
trie.insert('app', 5);
trie.insert('application', 8);
trie.insert('apply', 3);
trie.insert('banana', 7);

console.log(trie.search('app'));        // true
console.log(trie.search('ap'));         // false (not inserted as a word)
console.log(trie.startsWith('ap'));     // true
console.log(trie.autocomplete('app', 3)); // ['apple', 'application', 'app']

trie.delete('app');
console.log(trie.search('app'));        // false
console.log(trie.search('apple'));      // true — sibling unaffected`,
      rw: {
        ex: [
          "Google autocomplete: each keystroke queries a Trie (actually a distributed prefix index) returning top-K completions by search frequency — the trie traversal is O(m) per query regardless of index size",
          "Linux kernel routing table: uses Patricia trie (binary radix tree) keyed on 32-bit IP prefixes for longest-prefix-match in O(32) = O(1) time — the reason Linux can route packets at line rate",
          "nginx URL routing: uses a Radix trie to match request paths against configured location blocks — O(path_length) matching regardless of the number of configured routes",
          "Dictionary spell check (Hunspell, aspell): Trie stores the dictionary; prefix traversal generates suggestions within edit distance k using DFS with a running edit-distance budget",
        ],
        cs: "nginx stores its location block routes in a Radix trie (ngx_radix_tree_t). When a request arrives, nginx traverses the trie character by character using the URI path, following the longest matching prefix. Compressed edges mean the traversal skips over non-branching path segments in O(1) — the total lookup cost is O(path_length), not O(number_of_routes). This is why nginx can serve millions of requests per second with thousands of configured location blocks: routing cost is independent of routing table size.",
      },
    },
    interview: {
      q: 'Design an autocomplete system that returns the top 3 most searched queries for a prefix in O(m + output) time.',
      a: 'Use a Trie where each isEnd node stores a frequency count (increment on each search). To autocomplete for prefix p: traverse to the prefix node in O(m), then DFS from that node collecting all isEnd nodes. Maintain a max-heap of size 3 during DFS: push (frequency, word) for each completed word; if the heap exceeds size 3, pop the minimum-frequency entry. After DFS, the heap contains the 3 highest-frequency completions. Return them sorted descending by frequency. Total time: O(m) to reach prefix node + O(T) DFS over the prefix subtree + O(T log 3) heap operations = O(m + T). For the top-3 case, the heap operations are O(log 3) = O(1) constant. To optimise further, store the top-K results at every Trie node (propagated up on insert) — then autocomplete is strictly O(m) with no DFS needed, at the cost of O(K) extra space per node and O(K log K) per insert.',
      fu: [
        'Radix trie memory savings: instead of one node per character, compressed edges store a substring per edge. A string "application" in a trie with no sharing takes 11 nodes; as a Radix trie edge, it\'s 1 node with an 11-character edge label. For a dictionary of 100k words with long shared prefixes, a Radix trie uses ~10-100x fewer nodes than a standard Trie.',
        'Binary trie for IP routing: IPv4 addresses are 32-bit integers. Store each CIDR block by traversing 32 bits (MSB first), marking isEnd at the prefix length. For a /24 prefix, insert 24 bits. Lookup: traverse all 32 bits of the destination IP, recording the last isEnd node visited — that\'s the longest (most specific) matching prefix. Total lookup cost: O(32) = O(1) for IPv4.',
        'Aho-Corasick for multi-pattern matching: a Trie augmented with failure links (similar to KMP\'s failure function). Given k patterns and a text of length n, Aho-Corasick finds all occurrences of all patterns in O(n + total_matches) — after O(sum of pattern lengths) preprocessing. Used in antivirus scanners, network intrusion detection, DNA sequence search. A single Trie search finds one pattern; Aho-Corasick finds all k patterns in a single O(n) pass.',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 10. UNION-FIND (DISJOINT SET UNION)
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ds-union-find',
    cat: 'dsa',
    color: '#10b981',
    icon: '🔗',
    title: 'Union-Find (Disjoint Set Union)',
    tag: 'Near-O(1) connected components — the amortized miracle of path compression',
    overview:
      'Union-Find (Disjoint Set Union, DSU) tracks a collection of disjoint sets supporting two operations: Union (merge two sets) and Find (determine which set an element belongs to, represented by the set\'s root/representative). With path compression and union by rank (or size), Find and Union are both amortized O(α(n)) — where α is the inverse Ackermann function, effectively constant (α(n) ≤ 4 for any n that fits in the universe). This near-O(1) performance makes Union-Find the ideal structure for: dynamic connectivity queries, Kruskal\'s MST algorithm, cycle detection in undirected graphs, and network connectivity in distributed systems.',
    components: [
      {
        name: 'Parent Array',
        icon: '📦',
        role: 'The entire data structure is a single integer array — no nodes, no pointers, just parent references.',
        detail:
          'Each element points to its parent. Roots point to themselves (parent[i] === i). Find(x) follows parent pointers until root. Without optimisation: O(n) worst case (degenerate chain). The parent array is the entire data structure — no nodes, no pointers, just an integer array.',
      },
      {
        name: 'Path Compression',
        icon: '⚡',
        role: 'After finding a root, flatten the path so every node on it points directly to the root — future Finds are O(1).',
        detail:
          'During Find(x), after finding the root, set every node on the path from x to root to point directly to the root. Two-pass Find: first pass finds root, second pass compresses. One-pass variant: path halving (point to grandparent on the way up). After compression, future Find calls on any node in that path are O(1). This is the key optimisation — without it, Union-Find is just a tree.',
      },
      {
        name: 'Union by Rank / Size',
        icon: '⚖️',
        role: 'Always attach the smaller tree under the larger — prevents degenerate chains.',
        detail:
          'Naive union: make root of x the parent of root of y (or vice versa). Worst case: O(n) chain. Union by rank: attach the shorter tree under the taller tree (rank = upper bound on height). Union by size: attach the smaller set under the larger. Both give O(log n) tree height before path compression; combined with path compression: amortized O(α(n)).',
      },
      {
        name: 'Weighted Quick Union Applications',
        icon: '🔬',
        role: 'The canonical applications: Kruskal\'s MST, cycle detection, dynamic connectivity.',
        detail:
          'Kruskal\'s MST: sort edges by weight, add edge if endpoints are in different components (Find), Union them. Cycle detection: if two endpoints already in the same component (Find returns same root), adding the edge creates a cycle. Dynamic connectivity: offline queries (Tarjan\'s offline LCA), network link-cut trees.',
      },
    ],
    howItWorks:
      'Union-Find\'s mechanics are deceptively simple given their power. The parent array is initialised so parent[i] = i (every element is its own representative). Find(x) follows the parent chain until it reaches a root (parent[root] === root). Union(x, y) calls Find on both elements, then makes one root the parent of the other. Without optimisations, a sequence of n union operations on elements 0, 1, ..., n-1 (in order) creates a degenerate chain of height n — Find becomes O(n). Path compression attacks this by making every visited node on a Find path point directly to the root. Two-pass compression: first find the root, second re-traverse the path setting each node\'s parent to the root. Path halving (point to grandparent) achieves almost the same compression with a single pass. Union by rank prevents the chain from forming in the first place: when unioning two trees, the shorter one (lower rank) is attached under the taller one (higher rank). Rank only increases when two trees of equal rank are merged — otherwise the taller tree\'s rank is unchanged, guaranteeing tree height stays O(log n) even without path compression. Combined, the amortised complexity is O(α(n)) per operation. The inverse Ackermann function α grows slower than log*n (iterated logarithm) which grows slower than log log n — for all practical n, α(n) ≤ 4. Kruskal\'s MST algorithm exploits this: sort all E edges by weight (O(E log E)), then iterate, adding each edge only if its two endpoints are in different components (checked via Find — if same root, adding the edge would create a cycle). The Union operation merges the two components. The MST is complete when V-1 edges have been added. Total: O(E log E + E·α(V)) = O(E log E). Cycle detection in undirected graphs is a direct application: process each edge (u, v); if Find(u) === Find(v), the edge creates a cycle; otherwise, call Union(u, v). After processing all edges, the number of distinct roots equals the number of connected components.',
    decision: {
      choose: [
        'Dynamic connectivity as edges are added (not removed): online "are these connected?" queries',
        "Kruskal's MST algorithm — sort edges, add if not connected, Union — O(E log E + E·α(V))",
        'Cycle detection in undirected graphs — simpler than DFS 3-coloring, O(α(n)) per edge',
        'Grouping elements into equivalence classes dynamically as relationships are discovered',
        'Percolation simulation, network redundancy analysis, image segmentation',
      ],
      avoid: [
        'When edges are also removed (Union-Find doesn\'t support un-union) — use Link-Cut Trees for fully dynamic connectivity',
        'When you need the actual path between connected nodes — Union-Find only answers "same component?", not the route',
        'Directed graph connectivity — Union-Find is inherently undirected; use SCC algorithms for directed graphs',
        'When you need per-component data structures beyond just a representative — the DSU gives you one root per component, nothing more',
      ],
      vs: [
        {
          name: 'Union-Find vs BFS/DFS for Connectivity',
          when: 'BFS/DFS answers "are u and v connected?" in O(V+E) per query by re-exploring the graph. Union-Find answers the same query in O(α(n)) after O(E·α(n)) preprocessing. For many queries on a dynamic graph where edges are added, Union-Find dominates. For one-time connectivity queries on a static graph, BFS/DFS is simpler.',
        },
        {
          name: "Union-Find vs Adjacency List for Kruskal's",
          when: "Adjacency list stores the full graph structure. Union-Find only tracks which component each vertex belongs to — it has no knowledge of individual edges. Kruskal's needs both: the edge list (sorted) and Union-Find for component tracking. They\'re complementary, not alternatives.",
        },
      ],
    },
    failures: [
      {
        name: 'Omitting Path Compression',
        cause: 'Implementing Union-Find with union by rank but without path compression — or vice versa. Either alone is insufficient for the O(α(n)) guarantee.',
        symptom: 'O(log n) per operation instead of O(α(n)) — negligible for small n, significant for n = 10^7+ (graph problems in competitive programming and production systems).',
        fix: 'Always implement both path compression and union by rank/size. Path compression is 2-3 extra lines in Find. Union by rank/size adds a rank/size array. Together they give the O(α(n)) guarantee. Never ship Union-Find without both.',
        severity: 'high',
      },
      {
        name: 'Applying Union-Find to Directed Graphs',
        cause: 'Treating directed edges as undirected when building the DSU — merging u and v for edge u→v regardless of direction. Find then reports u and v as connected even if the only path is u→v (no v→u path exists).',
        symptom: 'False connectivity: Union-Find reports two nodes as "connected" when they\'re only reachable in one direction. Cycle detection reports false negatives (a directed cycle is treated as undirected connectivity).',
        fix: 'For directed graphs, use Tarjan\'s SCC (Strongly Connected Components) or Kosaraju\'s algorithm. Union-Find is strictly for undirected graphs or symmetric directed graphs.',
        severity: 'critical',
      },
      {
        name: 'Off-by-One in Initialisation',
        cause: 'Initialising parent[i] = 0 instead of parent[i] = i — making element 0 the root of every element from the start. Or initialising with wrong array size for 1-indexed elements.',
        symptom: 'All elements are initially in the same component (all find to root 0). Union operations appear to work but every connectivity query returns true. Subtle: tests with small n may not expose it if element 0 is always unioned with others early.',
        fix: 'Initialise parent[i] = i, rank[i] = 0, size[i] = 1 for every element. Verify with a 3-element example: after init, find(0) = 0, find(1) = 1, find(2) = 2, connected(0,1) = false.',
        severity: 'critical',
      },
    ],
    a: {
      v: 'University clubs sharing members',
      t: 'A university social scene',
      tx: 'Each student starts in their own friend group (a club of one). When two students become friends (Union), their entire friend groups merge. Later, someone asks "Are Alice and Bob in the same friend group?" — follow Alice\'s chain to her group leader, Bob\'s chain to his group leader, and compare (Find). Path compression is the social equivalent of updating everyone\'s "who is my group leader?" contact card directly when they ask, so the next time the chain is shorter. Union by rank ensures a large group never gets absorbed under a small one — the small group\'s leader reports to the large group\'s leader.',
      s: 'Union and Find both amortized O(α(n)) ≈ O(1) with path compression + union by rank',
    },
    te: {
      def: 'Union-Find (DSU) tracks which elements belong to the same disjoint set. Find(x) returns the representative (root) of x\'s set. Union(x, y) merges the sets of x and y. With path compression + union by rank, both operations are amortized O(α(n)) — practically O(1).',
      types: [
        { n: 'Quick Find', d: 'parent[i] always equals the root. Find: O(1). Union: O(n) — must update all elements. Only useful theoretically.' },
        { n: 'Quick Union', d: 'Naive union: make one root the parent of the other. Find: O(n) worst case (chain). Union: O(n) (dominated by Find).' },
        { n: 'Weighted Quick Union', d: 'Union by rank or size: smaller tree under larger. Find: O(log n). Union: O(log n). No path compression.' },
        { n: 'Path-Compressed Weighted DSU', d: 'Union by rank + path compression. Find and Union: amortized O(α(n)). The production-ready implementation.' },
        { n: 'Rollback DSU', d: 'Weighted DSU without path compression (to enable undo). Each Union is recorded; rollback reverses the last union. Used in offline algorithms where edges can be removed. O(log n) per operation.' },
      ],
      when: 'Use when edges are added dynamically and you need O(1) connectivity queries. Ideal for Kruskal\'s MST, cycle detection in undirected graphs, and any equivalence-class grouping problem. Switch to Link-Cut Trees if edges are also removed.',
      trade: 'Union-Find is the simplest data structure with near-O(1) dynamic connectivity. Constraints: undirected only, no edge deletion, no path retrieval. The entire implementation fits in ~30 lines. For problems where these constraints hold, there is no better alternative.',
      code: `// Production Union-Find with path compression (halving variant)
// and union by both rank and size.
// Kruskal's MST, cycle detection, and connected components included.

class UnionFind {
  constructor(n) {
    // parent[i] = i means i is its own root
    this.parent = Array.from({ length: n }, (_, i) => i);
    // rank = upper bound on tree height (used for union by rank)
    this.rank = new Array(n).fill(0);
    // size[i] = number of elements in i's component (valid only at roots)
    this.size = new Array(n).fill(1);
    this.components = n; // total number of disjoint sets
  }

  // Path compression via path halving: point to grandparent on the way up.
  // Single-pass; achieves almost identical compression to two-pass.
  find(x) {
    while (this.parent[x] !== x) {
      // Path halving: make x point to its grandparent
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }

  // Union by rank: attach the shorter tree under the taller tree.
  // When ranks are equal, arbitrarily pick one and increment its rank.
  union(x, y) {
    const rx = this.find(x);
    const ry = this.find(y);
    if (rx === ry) return false; // already in the same component

    // Merge smaller rank under larger rank
    if (this.rank[rx] < this.rank[ry]) {
      this.parent[rx] = ry;
      this.size[ry] += this.size[rx];
    } else if (this.rank[rx] > this.rank[ry]) {
      this.parent[ry] = rx;
      this.size[rx] += this.size[ry];
    } else {
      // Equal ranks: arbitrary choice; increment rank of new root
      this.parent[ry] = rx;
      this.size[rx] += this.size[ry];
      this.rank[rx]++;
    }
    this.components--;
    return true;
  }

  connected(x, y) {
    return this.find(x) === this.find(y);
  }

  componentSize(x) {
    return this.size[this.find(x)];
  }
}

// Kruskal's Minimum Spanning Tree.
// edges: [{u, v, weight}]. Returns MST edges in order added.
function kruskalMST(n, edges) {
  // Sort ascending by weight — the greedy criterion
  const sorted = [...edges].sort((a, b) => a.weight - b.weight);
  const uf = new UnionFind(n);
  const mst = [];
  let totalWeight = 0;

  for (const edge of sorted) {
    // Only add this edge if it connects two different components (no cycle)
    if (uf.union(edge.u, edge.v)) {
      mst.push(edge);
      totalWeight += edge.weight;
      if (mst.length === n - 1) break; // MST complete — early exit
    }
  }

  if (mst.length < n - 1) throw new Error('Graph is not connected — MST does not exist');
  return { mst, totalWeight };
}

// Cycle detection in undirected graph using Union-Find.
// Returns true if any edge creates a cycle.
function hasCycleUndirected(n, edges) {
  const uf = new UnionFind(n);
  for (const { u, v } of edges) {
    // If u and v are already connected, this edge creates a cycle
    if (uf.connected(u, v)) return true;
    uf.union(u, v);
  }
  return false;
}

// Count connected components in an undirected graph.
function countComponents(n, edges) {
  const uf = new UnionFind(n);
  for (const { u, v } of edges) uf.union(u, v);
  return uf.components;
}

// Usage: Kruskal's on a 4-vertex graph
const edges = [
  { u: 0, v: 1, weight: 10 },
  { u: 0, v: 2, weight: 6 },
  { u: 0, v: 3, weight: 5 },
  { u: 1, v: 3, weight: 15 },
  { u: 2, v: 3, weight: 4 },
];
const { mst, totalWeight } = kruskalMST(4, edges);
console.log('MST weight:', totalWeight); // 19
console.log('MST edges:', mst.map(e => \`\${e.u}-\${e.v}:\${e.weight}\`));
// ['2-3:4', '0-3:5', '0-1:10']

// Cycle detection
console.log(hasCycleUndirected(3, [{ u:0, v:1 }, { u:1, v:2 }, { u:2, v:0 }])); // true
console.log(hasCycleUndirected(3, [{ u:0, v:1 }, { u:1, v:2 }]));                // false`,
      rw: {
        ex: [
          "Kruskal's MST for network design: cable laying, fibre routing, and circuit design use Kruskal's to find the minimum total cable length connecting n sites — Union-Find makes each edge-acceptance check O(α(n))",
          'Image segmentation (superpixels): pixels are graph nodes, edges weighted by colour similarity. Union-Find merges adjacent pixels into regions, stopping when inter-region dissimilarity exceeds a threshold — Felzenszwalb\'s algorithm',
          'Distributed system cluster membership: when a node joins or a link is established, Union-Find tracks which partition each node belongs to — O(1) to answer "are these nodes in the same partition?"',
          'Percolation simulation (physics): random site percolation on an n×n grid — open adjacent sites and check if the top row connects to the bottom row. Directly implemented with Union-Find: O(n²·α(n)) to simulate the entire grid',
        ],
        cs: 'LeetCode\'s "Number of Islands II" (problem 305) is the canonical Union-Find problem: start with an empty m×n grid, add land cells one by one, and after each addition return the number of islands. BFS/DFS would re-explore the whole grid for each addition — O(k × m × n) total. Union-Find handles each addition in O(α(m×n)): add the cell, union it with any adjacent land cells, and return uf.components minus the number of water cells. Total: O(k × α(m×n)) — the difference is decisive for large grids.',
      },
    },
    interview: {
      q: 'How does path compression work in Union-Find and what is the amortized complexity with union by rank?',
      a: 'Path compression flattens the tree during Find operations. Without it, a sequence of unions can create a chain of height n, making each Find O(n). Two-pass compression: first, follow parent pointers from x to the root to find the root. Second, re-traverse from x to the root, setting every node\'s parent directly to the root. After this, any future Find on any node in that path is O(1). The path halving variant does it in one pass: while walking to the root, set parent[x] = parent[parent[x]] (point to grandparent) and advance x to the grandparent. Mathematically, path compression alone gives O(log n) amortized. Union by rank alone gives O(log n) per operation (tree height bounded at log n). Combined, they achieve O(α(n)) amortized — the inverse Ackermann function. α(n) ≤ 4 for any n up to 2^(2^(2^(2^16))) — effectively a constant in any real computation. This is provably optimal: any data structure supporting union and find requires Ω(α(n)) amortized per operation.',
      fu: [
        "Kruskal's vs Prim's MST: both find the minimum spanning tree. Kruskal's is edge-centric: sort all edges, add the cheapest that doesn't create a cycle. Uses Union-Find. O(E log E). Better for sparse graphs. Prim's is vertex-centric: start from any vertex, greedily add the cheapest edge extending the current MST. Uses a priority queue. O((V+E) log V) with a binary heap. Better for dense graphs or when the graph is given as an adjacency matrix.",
        "Union-Find can't handle edge deletions because unions are irreversible — merging two components is permanent. To support edge deletion (fully dynamic connectivity), you need Link-Cut trees: a forest of self-balancing trees supporting link (add edge), cut (remove edge), and connected queries — all in O(log n) amortized. Rollback DSU is a compromise for offline deletion: record each union, use DFS on the timeline, and undo unions by reverting to saved state — O(log n) per operation, no path compression (since undo is needed).",
        'Detecting cycles with Union-Find vs DFS: DFS uses O(V) additional space for the colour/visited array and O(V) recursion depth. Union-Find uses O(V) for the parent/rank arrays but no recursion. For very deep graphs (many vertices in a chain), DFS risks stack overflow; Union-Find does not. DFS also gives you the actual cycle (via the back-edge and parent map reconstruction); Union-Find only detects that a cycle exists (the edge whose endpoints are already connected). Pick DFS when you need the cycle itself; Union-Find when you only need cycle existence.',
      ],
    },
  },
];

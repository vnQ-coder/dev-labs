import { Concept } from '../types';

export const CONCEPTS_DESIGN_PATTERNS: Concept[] = [
  // ─── CREATIONAL ──────────────────────────────────────────────────────────────

  {
    id: 'singleton',
    cat: 'patterns',
    color: '#a78bfa',
    icon: '👑',
    title: 'Singleton',
    tag: "The one and only — like a country's president",
    overview:
      'Singleton ensures a class has exactly one instance and provides a global access point to it. It is one of the most recognised — and most misused — patterns in software. Used correctly it guarantees shared state (a connection pool, a logger, an app config) lives in exactly one place. Used carelessly it becomes global mutable state that poisons testability and hides dependencies.',
    components: [
      {
        name: 'Instance Manager',
        icon: '🗄️',
        role: 'Holds the single shared instance.',
        detail:
          'A private static field on the class stores the one-and-only instance once it is created. All callers share the same reference, guaranteeing no duplicate state exists across the process.',
      },
      {
        name: 'Private Constructor',
        icon: '🔒',
        role: 'Prevents direct instantiation.',
        detail:
          'Making the constructor private means no external code can call `new MySingleton()`. The only path to the instance is through the controlled access point, enforcing the one-instance guarantee.',
      },
      {
        name: 'Global Access Point',
        icon: '🚪',
        role: 'Static getInstance() method returned to callers.',
        detail:
          'The static `getInstance()` method checks whether the private instance field is null. If null it creates the instance; otherwise it returns the existing one. This lazy initialisation defers allocation until first use.',
      },
    ],
    howItWorks:
      'On first call to `getInstance()` the static field is null, so the constructor runs and the instance is stored. Every subsequent call short-circuits and returns the cached reference. In multithreaded environments both threads can simultaneously see null and each create an instance — the classic double-checked locking problem. The fix is to use language-level guarantees: a module-level constant in Node.js (module cache makes it a free Singleton), `Object.freeze` for config, or synchronised blocks in Java.',
    decision: {
      choose: [
        'You need exactly one shared resource: a DB connection pool, a logger, or an app-wide config object',
        'The cost of creating the object more than once is prohibitively expensive',
        'You need a single coordinator for a shared resource (e.g. a print spooler)',
      ],
      avoid: [
        'Unit-tested code — Singletons are extremely hard to mock or reset between tests',
        'Highly concurrent server environments without explicit thread-safety guards',
        'Any time "I just need one" is an assumption rather than a hard constraint — use DI instead',
        'When the Singleton starts to hold too much state and becomes a God Object',
      ],
      vs: [
        {
          name: 'DI Container',
          when:
            'Inject dependencies instead of using global access — better testability, explicit dependency graph, easier to swap in tests.',
        },
        {
          name: 'Module Singleton',
          when:
            "In Node.js, require() returns the same cached module object — a free Singleton without any pattern boilerplate. Prefer this for config and loggers.",
        },
      ],
    },
    failures: [
      {
        name: 'Thread-Safety Race',
        cause: 'Two threads both read `instance === null` simultaneously and each runs the constructor.',
        symptom: 'Two separate instances exist; shared state diverges silently.',
        fix: 'Use module-level constants (Node.js), static initialiser blocks (Java), or double-checked locking with volatile.',
        severity: 'critical',
      },
      {
        name: 'God Object',
        cause: 'Every developer adds a new field to the Singleton because it is globally accessible.',
        symptom: 'The class has hundreds of fields; every module imports it; changes break unrelated features.',
        fix: 'Extract bounded sub-objects (Config, Logger, MetricsClient) and inject them explicitly rather than reaching into a global bag.',
        severity: 'high',
      },
      {
        name: 'Test Pollution',
        cause: 'Singleton state persists across test runs; one test mutates state that another test depends on.',
        symptom: 'Tests pass individually but fail when run together; flaky suite order dependence.',
        fix: 'Expose a `reset()` method or use a DI container that creates a fresh instance per test.',
        severity: 'high',
      },
    ],
    a: {
      v: '👤 → 🌍',
      t: 'The President of a Country',
      tx: 'A country can only have one president at a time. No matter who calls the White House, they reach the same person — there is no second instance of the presidency running in parallel. If you tried to elect a second president simultaneously, the whole system would break down. The Singleton pattern works exactly like this: no matter how many times different parts of your code ask for the instance, they all get back a reference to the exact same object, not a copy.',
      s: 'One instance, shared globally, created once.',
    },
    te: {
      def: 'Singleton is a creational design pattern that restricts a class to a single instance and provides a global access point to that instance via a static factory method.',
      types: [
        { n: 'Eager Singleton', d: 'Instance created at class-load time — thread-safe by default but wastes memory if never used.' },
        { n: 'Lazy Singleton', d: 'Instance created on first call to getInstance() — conserves memory but requires thread-safety guards.' },
        { n: 'Module Singleton (Node.js)', d: "require() / import caches the module object — free Singleton without boilerplate, the idiomatic Node.js approach." },
      ],
      when: 'Use when you genuinely need exactly one shared resource — a connection pool, application config, or centralised logger — and duplicates would cause incorrect behaviour or excessive resource consumption.',
      trade:
        'Pro: controlled shared state, lazy initialisation, global access. Con: global state makes testing painful, hidden dependencies obscure the call graph, multithreaded safety requires care.',
      code: `// TypeScript Singleton — lazy, thread-safe via module cache
class DatabasePool {
  private static instance: DatabasePool | null = null;
  private connections: string[] = [];

  private constructor() {
    // expensive setup happens once
    this.connections = ['conn1', 'conn2', 'conn3'];
  }

  static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool();
    }
    return DatabasePool.instance;
  }

  getConnection(): string {
    return this.connections[Math.floor(Math.random() * this.connections.length)];
  }
}

const a = DatabasePool.getInstance();
const b = DatabasePool.getInstance();
console.log(a === b); // true — same instance`,
      rw: {
        ex: [
          'Database connection pool (pg-pool, mongoose connection)',
          'Application config object loaded once from env vars',
          'Winston / Pino logger instance shared across modules',
          'Feature-flag client initialised once at startup',
        ],
        cs: 'Node.js module system: every `require()` call for the same path returns the cached module export — a free Singleton. Teams at Stripe and GitHub rely on this for their logger and config objects without any explicit Singleton code.',
      },
    },
    interview: {
      q: 'When would you NOT use a Singleton?',
      a: "Avoid Singleton when testability matters — you can't easily mock a Singleton, so tests become order-dependent and fragile. Avoid it when it would accumulate unrelated state (God Object antipattern). Avoid it in scenarios requiring multiple isolated instances (e.g., separate DB pools for read vs write replicas). Hidden global state makes the dependency graph invisible: a function that silently depends on a Singleton is harder to reason about than one that receives its dependency explicitly. Prefer dependency injection for all of these cases.",
      fu: [
        'How do you make a Singleton thread-safe in Java vs Node.js?',
        "What's a better alternative to Singleton for managing application config?",
        'How would you refactor a God Object Singleton that has grown too large?',
      ],
    },
  },

  {
    id: 'factory-method',
    cat: 'patterns',
    color: '#a78bfa',
    icon: '🏭',
    title: 'Factory Method',
    tag: 'A car factory that produces different models without changing the assembly line',
    overview:
      'Factory Method defines an interface for creating an object but lets subclasses (or configuration) decide which concrete class to instantiate. The creator never knows the exact class it creates — only the abstract product type. This decouples the client from the concrete implementation, making it easy to add new product types without touching existing code.',
    components: [
      {
        name: 'Creator',
        icon: '🏗️',
        role: 'Declares the factory method and uses the product it returns.',
        detail:
          'The Creator class declares the `createProduct()` factory method as abstract or with a default implementation. Its business logic calls `createProduct()` and works only with the abstract Product interface — it never imports a concrete product class.',
      },
      {
        name: 'ConcreteCreator',
        icon: '🔧',
        role: 'Overrides the factory method to return a specific product type.',
        detail:
          'Each ConcreteCreator subclass overrides `createProduct()` to return a different ConcreteProduct. Adding a new product variant means adding a new ConcreteCreator subclass, not modifying existing code.',
      },
      {
        name: 'Product Interface',
        icon: '📦',
        role: 'The common contract all products must fulfil.',
        detail:
          'Declares the operations that every product must implement (e.g. `send()`, `process()`, `render()`). The Creator only ever uses this interface, so swapping the underlying product is transparent to the caller.',
      },
    ],
    howItWorks:
      'The client instantiates a ConcreteCreator and calls its business method. The business method internally calls `this.createProduct()`, which the subclass overrides to return the right concrete object. The client code only knows the Creator interface and the Product interface — never the concrete class. To add a new product, you write a new ConcreteCreator subclass and a new ConcreteProduct. Zero lines of existing code change.',
    decision: {
      choose: [
        "You don't know ahead of time what class you'll need to create — the product type is determined at runtime or by configuration",
        'You want to provide extension points for a framework without changing its core (e.g., a plugin system)',
        'The creation logic is complex and you want to encapsulate it away from business logic',
      ],
      avoid: [
        'Simple cases where a plain function or conditional is clearer — Factory Method adds class hierarchy overhead',
        'When the number of product types is fixed and small — a map of constructors or a switch statement is simpler',
      ],
      vs: [
        { name: 'Abstract Factory', when: 'Use when you need to create families of related products (e.g., Button + Checkbox + Modal) that must be consistent with each other.' },
        { name: 'Builder', when: 'Use when the product construction is a multi-step process with many optional parts, not a single factory call.' },
        { name: 'Simple Factory (not a GoF pattern)', when: 'A single static method with a switch/if is fine for simple cases with few product types and no extension requirements.' },
      ],
    },
    failures: [
      {
        name: 'God Factory',
        cause: 'Every new product type is added to a single factory class with a growing switch statement.',
        symptom: 'The factory class is modified for every new feature; a change to add ProductX can break ProductY instantiation.',
        fix: "Use the GoF Factory Method properly — each product type gets its own ConcreteCreator subclass. Or use a registry map: `{ 'stripe': () => new StripePayment() }`.",
        severity: 'high',
      },
      {
        name: 'Leaking Concrete Types',
        cause: 'The caller imports and references ConcreteProduct classes directly despite using a factory.',
        symptom: 'The factory is bypassed; changing the concrete class requires updating callers — the whole point of the pattern is lost.',
        fix: 'Ensure the factory is the only place that imports concrete classes. Callers receive and operate on the Product interface only.',
        severity: 'medium',
      },
    ],
    a: {
      v: '🚗 🏭 → 🚙🚕🚌',
      t: 'The Car Factory',
      tx: "A car factory knows how to assemble vehicles — weld the chassis, install the engine, paint the body. But Toyota's assembly line doesn't hard-code 'build a Corolla'. A different configuration (a different ConcreteCreator) produces a Camry or a Prius using the same process skeleton. The client (a dealership) orders 'a car' and receives whatever model the factory is configured to produce — without needing to know anything about the manufacturing specifics. Adding a new model means configuring a new production line, not redesigning the existing ones.",
      s: 'Decouple creation from use — let subclasses decide what to build.',
    },
    te: {
      def: 'Factory Method is a creational pattern that defines an interface for creating a single product but defers the decision of which concrete class to instantiate to subclasses or configuration, decoupling the creator from the concrete product.',
      types: [
        { n: 'Subclass-based', d: 'The classic GoF version — ConcreteCreator subclasses override the factory method.' },
        { n: 'Registry-based', d: 'A map from string keys to constructor functions. `registry["stripe"]()` — more flexible, avoids deep class hierarchies.' },
        { n: 'Parameterised Factory', d: 'A single creator with a type parameter: `createNotifier("email" | "sms")` — simple but grows into a God Factory if unchecked.' },
      ],
      when: 'Use when you need runtime flexibility over which object is created, when you want to isolate object creation in one place, or when building frameworks with extension points.',
      trade:
        'Pro: open/closed principle — new products without changing existing code; creation logic centralised. Con: can lead to a large class hierarchy; overkill for simple cases.',
      code: `interface Notifier { send(msg: string): void; }

class EmailNotifier implements Notifier {
  send(msg: string) { console.log(\`Email: \${msg}\`); }
}
class SMSNotifier implements Notifier {
  send(msg: string) { console.log(\`SMS: \${msg}\`); }
}

abstract class NotificationService {
  abstract createNotifier(): Notifier;

  notify(message: string) {
    const notifier = this.createNotifier(); // factory method
    notifier.send(message);
  }
}

class EmailService extends NotificationService {
  createNotifier(): Notifier { return new EmailNotifier(); }
}
class SMSService extends NotificationService {
  createNotifier(): Notifier { return new SMSNotifier(); }
}

const svc: NotificationService = new EmailService();
svc.notify('Your order shipped!'); // Email: Your order shipped!`,
      rw: {
        ex: [
          'React.createElement — creates different DOM or component types based on the first argument',
          'Payment provider factory: new StripeFactory() vs new PayPalFactory() behind a PaymentProcessor interface',
          'Logger factory: createLogger("winston") vs createLogger("pino") returning the same Logger interface',
        ],
        cs: "Passport.js uses the Factory Method pattern for authentication strategies: `passport.use(new GoogleStrategy(...))` — the Strategy is a ConcreteProduct, Passport is the Creator. Adding OAuth providers requires zero changes to Passport's core.",
      },
    },
    interview: {
      q: 'Factory vs Abstract Factory vs Builder — when do you choose each?',
      a: "Factory Method: you need to create one product and want to defer the concrete type to a subclass or configuration. Abstract Factory: you need to create families of related products that must be consistent (e.g., a macOS UI kit needs macOS-themed Button + macOS-themed Modal — mixing macOS Button with Windows Modal would look broken). Builder: the product is a complex object constructed step-by-step with many optional parts — think SQL query builders or HTTP request builders where you chain `.where()`, `.limit()`, `.orderBy()` before calling `.build()`.",
      fu: [
        'How would you implement a plugin system using Factory Method?',
        'What is the registry pattern and how does it improve on a traditional switch-based factory?',
        'How does Abstract Factory enforce consistency across product families?',
      ],
    },
  },

  {
    id: 'builder',
    cat: 'patterns',
    color: '#a78bfa',
    icon: '🍔',
    title: 'Builder',
    tag: 'Ordering a custom burger: bun, patty, toppings, sauce — in any combination',
    overview:
      'Builder separates the construction of a complex object from its representation. Instead of a constructor with 10 optional parameters, you use a Builder object where each method sets one part, and a final `build()` call returns the fully assembled, often immutable, product. It eliminates telescoping constructor antipatterns and makes complex object creation readable and safe.',
    components: [
      {
        name: 'Builder Interface',
        icon: '📋',
        role: 'Declares the step methods for constructing the product.',
        detail:
          'Defines methods like `setTitle()`, `setBody()`, `addTag()`, each returning the Builder itself to enable method chaining. The interface allows multiple concrete builders to produce different representations of the same construction process.',
      },
      {
        name: 'ConcreteBuilder',
        icon: '🔨',
        role: 'Implements the step methods and assembles the product.',
        detail:
          'Stores the product under construction as a private field, updating it step by step. Implements `build()` to validate completeness and return the final immutable product. Each ConcreteBuilder can produce a different output format from the same Director instructions.',
      },
      {
        name: 'Director',
        icon: '🎬',
        role: 'Orchestrates the build steps in a specific order.',
        detail:
          'The Director knows the recipe — which steps to call and in what order — but delegates the actual construction to the Builder. This separates the "what to build" (Director) from "how to build it" (Builder). Directors are optional; clients can call builder methods directly.',
      },
      {
        name: 'Product',
        icon: '📦',
        role: 'The complex object being constructed.',
        detail:
          'The final assembled object, typically immutable once returned from `build()`. Properties set by the Builder are frozen or encapsulated to prevent post-construction mutation, which would invalidate validation logic run in `build()`.',
      },
    ],
    howItWorks:
      "You instantiate a Builder, chain the setter methods for only the parts you need, then call `build()`. The Builder validates the configuration (e.g., required fields present) and returns the Product. The Product is often made immutable using `Object.freeze()` or private readonly fields. If `build()` is never called, you hold a Builder — not a Product — which is a common mistake to guard against with TypeScript's type system.",
    decision: {
      choose: [
        'Constructing objects with many optional parameters where most combinations are valid',
        'You want immutable value objects with mandatory validation before construction',
        'Step-by-step construction where intermediate states are meaningless or invalid',
        'Building the same logical object in multiple formats (HTML, Markdown, PDF)',
      ],
      avoid: [
        'Simple objects with 2–3 constructor parameters — a plain constructor or object literal is clearer',
        'When the construction order is trivial and the product is mutable anyway',
      ],
      vs: [
        { name: 'Factory Method', when: 'Use Factory Method when creation is a single step with different product types. Use Builder when creation is multi-step with one complex product type.' },
        { name: 'Object Literal / Spread', when: "In JavaScript/TypeScript, `{ ...defaults, ...overrides }` is idiomatic for simple option bags. Builder adds value when you need validation or method chaining on creation." },
      ],
    },
    failures: [
      {
        name: 'Forgetting to call build()',
        cause: 'Developer stores the Builder reference and passes it where a Product is expected.',
        symptom: 'Runtime type errors or silent failures when builder methods are called on what should be an immutable product.',
        fix: "Use TypeScript's type system: Builder and Product are distinct types. Never accept a Builder where a Product is expected.",
        severity: 'medium',
      },
      {
        name: 'Mutable Product',
        cause: 'build() returns the Builder\'s own internal mutable object instead of a frozen copy.',
        symptom: 'Callers mutate the product after construction, bypassing validation; shared builder state corrupts multiple products.',
        fix: 'Always return a new immutable object from `build()` — copy fields into a frozen object or use readonly TypeScript properties.',
        severity: 'high',
      },
      {
        name: 'Validation-Free Builder',
        cause: 'build() returns the product without checking required fields.',
        symptom: 'Invalid products (missing required URLs, null IDs) propagate deep into the system before failing.',
        fix: 'Treat build() as a factory + validator: throw early if required fields are absent.',
        severity: 'high',
      },
    ],
    a: {
      v: '🍔 🔨 → 🍔✅',
      t: 'Building a Custom Burger',
      tx: "When you order a custom burger you don't call one mega-function with 12 arguments. You tell the cook: whole wheat bun, double patty, no pickles, extra cheese, chipotle sauce. Each instruction is independent and optional. The cook (Builder) assembles your burger in a sensible order and hands you the finished result. You can't take a half-assembled burger home — `build()` is the moment the cook wraps it up and the construction is complete. Adding a 'vegan patty' option doesn't require changing the bun logic at all.",
      s: 'Separate complex construction from use — chain steps, validate, then build.',
    },
    te: {
      def: 'Builder is a creational pattern that separates the step-by-step construction of a complex object from its final representation, allowing the same construction process to produce different results and enabling validation before the product is returned.',
      types: [
        { n: 'Fluent Builder', d: 'Each setter returns `this`, enabling method chaining: `new QueryBuilder().select("*").from("users").where("id=1").build()`.' },
        { n: 'Director + Builder', d: 'A Director class encodes common build recipes (e.g., buildAdminUser(), buildGuestUser()) and delegates to a Builder. Reuses step sequences across multiple call sites.' },
        { n: 'Immutable Builder', d: 'Each setter returns a NEW builder instance rather than mutating `this` — pure functional style. Common in Java (Guava ImmutableList.Builder).' },
      ],
      when: 'Use when constructing objects that require many optional parts, have complex validation, or where intermediate representations are invalid or meaningless until construction is complete.',
      trade:
        'Pro: eliminates telescoping constructors, enforces validation at build time, produces immutable products. Con: more boilerplate than a simple constructor; overkill for simple objects.',
      code: `interface HttpRequest { url: string; method: string; headers: Record<string,string>; body?: string; }

class HttpRequestBuilder {
  private url = '';
  private method = 'GET';
  private headers: Record<string, string> = {};
  private body?: string;

  setUrl(url: string): this { this.url = url; return this; }
  setMethod(method: string): this { this.method = method; return this; }
  addHeader(key: string, value: string): this { this.headers[key] = value; return this; }
  setBody(body: string): this { this.body = body; return this; }

  build(): HttpRequest {
    if (!this.url) throw new Error('URL is required');
    return Object.freeze({ url: this.url, method: this.method, headers: { ...this.headers }, body: this.body });
  }
}

const req = new HttpRequestBuilder()
  .setUrl('https://api.example.com/users')
  .setMethod('POST')
  .addHeader('Content-Type', 'application/json')
  .setBody(JSON.stringify({ name: 'Alice' }))
  .build();`,
      rw: {
        ex: [
          'Knex.js query builder: knex("users").select("*").where("active", true).orderBy("name").limit(20)',
          'URLSearchParams — build a query string step by step',
          'Test fixture factories (factory-bot, fishery) — construct test objects with sensible defaults, override only what matters',
          'Hibernate Criteria API — build type-safe database queries step by step',
        ],
        cs: "Knex.js is a textbook Fluent Builder. Every chain call (`.where()`, `.join()`, `.orderBy()`) returns the same builder with accumulated state. Calling `.toSQL()` or `.then()` is the equivalent of `build()` — it compiles the accumulated steps into a SQL string and executes it.",
      },
    },
    interview: {
      q: 'How is Builder different from a constructor with many parameters?',
      a: "A constructor with many optional parameters leads to the telescoping constructor antipattern: you end up with overloads like `User(name)`, `User(name, email)`, `User(name, email, role)`, or worse, a single constructor with 8 nullable parameters where callers must pass `null` for fields they don't need. With 8 optional booleans you'd theoretically need 256 constructor overloads. A Builder lets you set only the fields you care about using readable named methods, in any order. Crucially, `build()` runs validation in one place and returns an immutable result — you can never have a half-constructed User floating around your system.",
      fu: [
        'How would you implement a type-safe Builder in TypeScript using the Step Builder pattern?',
        'What is the difference between a Fluent Builder and a Director-based Builder?',
        'How does the Builder pattern help with test data setup?',
      ],
    },
  },

  // ─── STRUCTURAL ──────────────────────────────────────────────────────────────

  {
    id: 'adapter',
    cat: 'patterns',
    color: '#c084fc',
    icon: '🔌',
    title: 'Adapter',
    tag: 'A travel plug adapter: same electricity, different socket',
    overview:
      "Adapter allows classes with incompatible interfaces to work together without modifying their source code. It wraps the incompatible class (the Adaptee) in a new class that speaks the interface the client expects (the Target). It's the go-to pattern for integrating third-party libraries, legacy systems, or external APIs into a codebase that expects a different interface.",
    components: [
      {
        name: 'Target Interface',
        icon: '🎯',
        role: 'The interface the client expects to work with.',
        detail:
          'Declares the methods the client code calls. The client is written against this interface exclusively — it has no knowledge of the Adaptee. This is typically the stable interface in your own codebase.',
      },
      {
        name: 'Adaptee',
        icon: '🗝️',
        role: 'The incompatible class that needs to be integrated.',
        detail:
          "The existing class (a legacy module, a third-party SDK, an external API) with a different interface than what the client expects. You typically can't or don't want to modify it — it might be a library you don't own.",
      },
      {
        name: 'Adapter',
        icon: '🔌',
        role: 'Translates Target calls into Adaptee calls.',
        detail:
          'Implements the Target interface, holds a reference to an Adaptee instance, and translates each Target method call into the appropriate Adaptee call. The translation should be pure interface mapping — no business logic.',
      },
    ],
    howItWorks:
      "The client calls a method on the Adapter thinking it's talking to a Target. The Adapter translates the call — possibly renaming arguments, converting data types, or reordering parameters — and forwards it to the Adaptee. The Adaptee's response is translated back to what the Target interface promises before being returned to the client. The client never knows the Adaptee exists.",
    decision: {
      choose: [
        'Integrating a third-party library or legacy code with a different interface than your system expects',
        'You want to swap one external dependency for another without touching client code',
        'Working with multiple providers (Stripe, PayPal, Braintree) behind a single payment interface',
      ],
      avoid: [
        'When you control both sides of the interface and can simply change the method signature directly',
        'Adapters that contain business logic — keep them as pure translators',
        'Deeply nested adapters wrapping adapters — a sign of architectural rot',
      ],
      vs: [
        { name: 'Facade', when: 'Facade simplifies a complex subsystem (many:1). Adapter makes two existing incompatible interfaces compatible (1:1 translation). Different problems.' },
        { name: 'Decorator', when: 'Decorator adds behaviour to an existing interface. Adapter converts one interface to another without adding behaviour.' },
        { name: 'Proxy', when: 'Proxy controls access to an object with the same interface. Adapter converts between different interfaces.' },
      ],
    },
    failures: [
      {
        name: 'Adapter Hell',
        cause: 'Multiple layers of adapters wrapping each other to bridge incompatibilities built up over time.',
        symptom: 'A single call travels through 4 adapter layers; stack traces are incomprehensible; bugs hide in translation.',
        fix: 'Consolidate with a single well-defined internal abstraction. If you need 3 adapters in a chain, redesign the internal interface.',
        severity: 'high',
      },
      {
        name: 'Logic-Laden Adapter',
        cause: 'Business rules creep into the Adapter because it is "a convenient place" to put them.',
        symptom: 'The Adapter is unit-tested for business rules; it is no longer a translator but a service; bugs are hard to isolate.',
        fix: 'Keep Adapters as dumb translators. Move business logic to a service layer that sits above the Adapter.',
        severity: 'medium',
      },
    ],
    a: {
      v: '🔌 🌍 → 🇺🇸',
      t: 'The Travel Plug Adapter',
      tx: 'A UK plug has three rectangular pins; a US socket expects two flat blades. The electricity flowing through the wall is identical — only the socket shape differs. A travel adapter slots onto your UK plug and presents the two-blade US face to the socket. Neither the plug nor the wall socket changes. The adapter handles the translation in between. In software, the Adaptee is your UK plug (existing class you cannot change), the Target is the US socket (interface your system expects), and the Adapter is the plastic translator in the middle.',
      s: 'Make incompatible interfaces compatible without changing either side.',
    },
    te: {
      def: 'Adapter is a structural pattern that converts the interface of one class into another interface that clients expect, enabling classes to work together that could not otherwise due to incompatible interfaces.',
      types: [
        { n: 'Object Adapter', d: 'Wraps the Adaptee via composition — holds a reference to an Adaptee instance. Preferred because it works in languages without multiple inheritance.' },
        { n: 'Class Adapter', d: 'Uses multiple inheritance to extend both Target and Adaptee. Only possible in languages supporting multiple inheritance (C++); rarely used in TypeScript/Java.' },
        { n: 'Two-Way Adapter', d: 'Implements both Target and Adaptee interfaces — allows an object to act as either. Useful when both sides need to be adaptable.' },
      ],
      when: "Use when you need to integrate a class whose interface doesn't match the rest of your system and you cannot (or should not) modify that class.",
      trade:
        'Pro: clean separation of concerns — the client stays isolated from third-party specifics; easy to swap providers. Con: extra indirection layer; adds boilerplate; can mask interface design problems.',
      code: `// Target interface our app expects
interface Logger { log(level: string, message: string): void; }

// Adaptee: third-party library with a different interface
class WinstonLogger {
  info(msg: string) { console.log('[INFO]', msg); }
  error(msg: string) { console.error('[ERROR]', msg); }
}

// Adapter: translates Logger → WinstonLogger
class WinstonAdapter implements Logger {
  constructor(private winston: WinstonLogger) {}

  log(level: string, message: string): void {
    if (level === 'error') this.winston.error(message);
    else this.winston.info(message);
  }
}

// Client only knows Logger interface
function processOrder(logger: Logger) {
  logger.log('info', 'Order processed');
}

processOrder(new WinstonAdapter(new WinstonLogger()));`,
      rw: {
        ex: [
          'Array.from() — adapts array-like objects and iterables to the Array interface',
          'Legacy REST API wrappers — adapts an old SOAP/XML API to a modern JSON interface',
          'Payment provider adapters — StripeAdapter and PayPalAdapter both implement a PaymentGateway interface',
          'ORM adapters — TypeORM and Prisma adapt different DB drivers to a common query interface',
        ],
        cs: "The AWS SDK v3 uses a middleware adapter pattern — each underlying HTTP client (fetch, node-http) is wrapped in an adapter that implements the SDK's HttpHandler interface. Switching from Axios to the native fetch client requires changing one adapter, not rewriting the SDK.",
      },
    },
    interview: {
      q: 'Adapter vs Facade — what is the difference?',
      a: "Adapter solves an interface incompatibility problem: you have an existing class with interface A, but your code expects interface B — the Adapter translates A to B. It is a 1:1 translation between two existing interfaces. Facade solves a complexity problem: you have a complex subsystem with 10 classes and 50 methods, and you want to expose a simple unified interface covering the common use cases — it is a many:1 simplification. You could use both together: a Facade that internally uses Adapters to talk to legacy subsystems.",
      fu: [
        'How would you use the Adapter pattern to support multiple third-party payment providers behind a single interface?',
        'What is the difference between an Object Adapter and a Class Adapter?',
        'When would you combine Adapter and Facade in the same design?',
      ],
    },
  },

  {
    id: 'facade',
    cat: 'patterns',
    color: '#c084fc',
    icon: '🏨',
    title: 'Facade',
    tag: 'A hotel concierge: one person, many services behind the scenes',
    overview:
      "Facade provides a simplified, unified interface to a complex subsystem. The subsystem's classes remain available for advanced users, but the Facade covers the common use cases with a clean, minimal API. It reduces the cognitive load on callers and decouples client code from subsystem internals — changing the subsystem's implementation does not break clients as long as the Facade API stays stable.",
    components: [
      {
        name: 'Facade Class',
        icon: '🏨',
        role: 'The single entry point for clients.',
        detail:
          'Exposes a simple, high-level API that covers the most common use cases. Internally it coordinates calls to the subsystem classes. Clients never need to know which subsystem classes exist or how they interact.',
      },
      {
        name: 'Subsystem Classes',
        icon: '⚙️',
        role: 'The complex internal components hidden by the Facade.',
        detail:
          'The real workers — authentication module, codec, file system, network client, etc. They remain fully functional and accessible for power users who need fine-grained control, but typical clients never touch them directly.',
      },
      {
        name: 'Client',
        icon: '👤',
        role: 'Calls the Facade exclusively.',
        detail:
          "Imports only the Facade, not the subsystem classes. The client's coupling is limited to the Facade's stable API — subsystem refactors are invisible to it.",
      },
    ],
    howItWorks:
      "The client calls a high-level Facade method (e.g. `videoConverter.convert(file, 'mp4')`). The Facade orchestrates a sequence of subsystem calls — initialise a codec, open the file, run the encoding pipeline, write the output — that the client would have had to chain manually. Error handling, ordering, and subsystem coordination all live inside the Facade, not scattered across every caller.",
    decision: {
      choose: [
        "You want to provide a simple interface over a complex, multi-class subsystem — the 80% use case needs 20% of the API",
        'You want to layer your system: public Facade API over a complex private implementation',
        'Reducing dependencies: clients import one class instead of ten',
      ],
      avoid: [
        'When the Facade becomes a God Object — if it grows to 100+ methods it is an antipattern, not a Facade',
        "When you're hiding complexity that callers legitimately need to control — the Facade becomes a leaky abstraction",
        'If the subsystem is already simple — adding a Facade is unnecessary indirection',
      ],
      vs: [
        { name: 'Adapter', when: 'Adapter converts between two incompatible existing interfaces (1:1). Facade creates a new simplified interface over a complex subsystem (many:1).' },
        { name: 'Mediator', when: 'Mediator manages communication between objects to reduce coupling between them. Facade only simplifies access — it does not coordinate peer objects bidirectionally.' },
      ],
    },
    failures: [
      {
        name: 'God Object Facade',
        cause: 'Every new feature in the subsystem adds a new method to the Facade because it is the only public entry point.',
        symptom: 'The Facade class has 100+ methods; it imports every subsystem class; it is a bottleneck for all changes.',
        fix: 'Split into multiple Facades aligned to bounded contexts: OrderFacade, PaymentFacade, NotificationFacade.',
        severity: 'high',
      },
      {
        name: 'Leaky Facade',
        cause: 'The Facade exposes subsystem types in its public API (e.g., returns a `StripeChargeObject` instead of a domain `PaymentResult`).',
        symptom: 'Clients import subsystem classes to handle Facade return values; the abstraction is broken.',
        fix: 'Facade methods should accept and return domain types only. Translate at the boundary inside the Facade.',
        severity: 'medium',
      },
    ],
    a: {
      v: '🏨 ← 🛎️🍽️🚕🎭',
      t: 'The Hotel Concierge',
      tx: 'A hotel concierge handles restaurant reservations, taxi bookings, theatre tickets, and wake-up calls. You talk to one person; they coordinate with a dozen departments you never see. You do not need to know which taxi company they use or how the kitchen staffing works. The concierge is the Facade — a single, friendly interface to a complex web of services. If the hotel switches from Uber to Lyft for taxis, you never notice because the interface ("arrange a taxi for 8 AM") did not change.',
      s: "One clean entry point hides a complex subsystem's internals.",
    },
    te: {
      def: 'Facade is a structural pattern that provides a simplified, unified interface to a complex subsystem, hiding internal implementation details and reducing the dependencies that client code has on the subsystem.',
      types: [
        { n: 'Simple Facade', d: 'A single class with static or instance methods wrapping a subsystem. The most common form.' },
        { n: 'Layered Facade', d: 'Multiple Facades at different abstraction levels: a high-level Facade for most callers and a mid-level Facade for power users who need more control.' },
        { n: 'Package/Module Facade', d: "A module's public index.ts that re-exports only the stable public API, hiding internal implementation modules. Common in TypeScript monorepos." },
      ],
      when: 'Use when a subsystem is complex and you want to reduce the surface area clients must understand, or when you want to decouple clients from subsystem internals to enable future refactoring.',
      trade:
        'Pro: reduces client complexity, decouples clients from subsystem, single place to change common orchestration. Con: can become a God Object if not bounded; can hide complexity that callers legitimately need.',
      code: `// Subsystem classes
class VideoDecoder { decode(file: string) { return \`decoded:\${file}\`; } }
class AudioProcessor { normalise(data: string) { return \`normalised:\${data}\`; } }
class VideoEncoder { encode(data: string, fmt: string) { return \`\${fmt}:\${data}\`; } }
class FileWriter { write(data: string, path: string) { console.log(\`Written to \${path}: \${data}\`); } }

// Facade — clients call this only
class VideoConverter {
  private decoder = new VideoDecoder();
  private audio = new AudioProcessor();
  private encoder = new VideoEncoder();
  private writer = new FileWriter();

  convert(inputFile: string, format: string, outputPath: string): void {
    const decoded = this.decoder.decode(inputFile);
    const normalised = this.audio.normalise(decoded);
    const encoded = this.encoder.encode(normalised, format);
    this.writer.write(encoded, outputPath);
  }
}

new VideoConverter().convert('movie.avi', 'mp4', '/output/movie.mp4');`,
      rw: {
        ex: [
          'axios — hides XMLHttpRequest / http.request complexity behind a clean promise-based API',
          "AWS SDK — each service client (S3, DynamoDB) is a Facade over HTTP signing, retries, and serialisation",
          "React's useState / useEffect — Facades over the Fiber scheduler and reconciler",
          'jQuery — a Facade over inconsistent browser DOM APIs',
        ],
        cs: 'The AWS S3 SDK is a textbook Facade. A single `s3.putObject({ Bucket, Key, Body })` call orchestrates request signing with SigV4, multipart upload decisions, retry logic with exponential backoff, and HTTP wire formatting — none of which the caller needs to know about.',
      },
    },
    interview: {
      q: 'When does a Facade become an antipattern?',
      a: "A Facade becomes an antipattern when it grows into a God Object. Signs: the Facade class has 50+ methods, every new feature in the application adds a new Facade method, developers joke about 'just adding it to the Facade'. At this point the Facade is coupling together unrelated concerns and becomes a bottleneck for all changes. The fix is to split it along bounded contexts — OrderFacade handles orders, PaymentFacade handles charging, NotificationFacade handles alerts. A second antipattern is the Leaky Facade: when the Facade returns raw subsystem types, clients depend on subsystem internals through the Facade, defeating its purpose.",
      fu: [
        'How would you design a Facade for a microservices system that aggregates calls to three backend services?',
        'What is the difference between a Facade and an API Gateway in a distributed system?',
        'How does module boundary encapsulation in TypeScript (barrel files) relate to the Facade pattern?',
      ],
    },
  },

  {
    id: 'decorator',
    cat: 'patterns',
    color: '#c084fc',
    icon: '🍦',
    title: 'Decorator',
    tag: 'Adding toppings to ice cream — each topping wraps the previous one',
    overview:
      "Decorator attaches additional behaviour to an object at runtime by wrapping it in a Decorator object that implements the same interface. Unlike inheritance — which is fixed at compile time — Decorators can be stacked in any order and combination. It's the pattern behind middleware chains, Java I/O streams, and Python function decorators.",
    components: [
      {
        name: 'Component Interface',
        icon: '📄',
        role: 'The common contract for both base components and decorators.',
        detail:
          "Declares the core operations (e.g. `cost()`, `handle()`, `send()`). Both the ConcreteComponent and every Decorator implement this interface, making them interchangeable to callers. This is the key to Decorator's open/closed principle compliance.",
      },
      {
        name: 'ConcreteComponent',
        icon: '🍦',
        role: 'The base object whose behaviour is being extended.',
        detail:
          'Provides the default implementation of the Component interface. It is the innermost layer — the vanilla ice cream before any toppings. It has no knowledge of any Decorator that might wrap it.',
      },
      {
        name: 'Decorator',
        icon: '🍫',
        role: 'Wraps a Component and adds behaviour before or after delegation.',
        detail:
          'Holds a reference to a Component (which may itself be another Decorator), implements the same interface, and delegates to the wrapped Component while adding its own behaviour. Multiple Decorators can be stacked in any order.',
      },
    ],
    howItWorks:
      'You create a ConcreteComponent and wrap it in one or more Decorators. Each Decorator adds its behaviour (logging, auth checking, caching) either before or after forwarding the call to the wrapped component. The outermost Decorator is what the client calls. The call propagates inward through the chain and the result bubbles back out, each layer adding its contribution. The order of wrapping determines the order of execution.',
    decision: {
      choose: [
        'You need to add behaviour to individual objects at runtime, not to all instances of a class',
        "You have multiple independent optional behaviours (logging, auth, rate-limiting) that should compose freely — Decorator avoids the 2^N subclass explosion",
        'You want to follow the open/closed principle — add new behaviours without modifying existing classes',
      ],
      avoid: [
        "When decorator order matters in non-obvious ways — document the required order or it becomes a maintenance nightmare",
        'When you need `instanceof` checks on the decorated object — decorated objects lose their original identity',
        'For simple cases with one or two fixed behaviours — a subclass or direct modification is clearer',
      ],
      vs: [
        { name: 'Inheritance', when: 'Inheritance is compile-time and static — every subclass bakes in its extra behaviour forever. Use Decorator when behaviour should be mixed and matched at runtime.' },
        { name: 'Proxy', when: "Proxy controls access to an object (same interface, caller may not know). Decorator adds features to an object the caller already holds. Proxy is about access control; Decorator is about augmentation." },
      ],
    },
    failures: [
      {
        name: 'Decorator Order Dependency',
        cause: 'LoggingDecorator wraps AuthDecorator — so every request is logged before auth runs, including unauthorised ones.',
        symptom: 'Sensitive data appears in logs; auth bypass goes undetected; order bugs are invisible until production.',
        fix: 'Document and enforce decorator order. Use a pipeline builder that assembles decorators in the correct sequence and tests that order in unit tests.',
        severity: 'high',
      },
      {
        name: 'Identity Confusion',
        cause: '`instanceof` checks on a Decorator return false for the original class.',
        symptom: 'Type guards and switch statements break; workarounds with `.unwrap()` methods add coupling.',
        fix: 'Design your system to rely on the Component interface, not on concrete types. If you need identity, expose it through the interface (e.g. `getType(): string`).',
        severity: 'medium',
      },
    ],
    a: {
      v: '🍦 → 🍫🍓🥜🍦',
      t: 'Ice Cream Toppings',
      tx: 'Start with a plain vanilla soft-serve. Want chocolate sauce? Wrap it. Want strawberry on top of that? Wrap the chocolate-wrapped vanilla in strawberry. Add crushed peanuts on top of that. Each topping wraps the previous result and adds its own contribution when you eat it (unwrap it from the outside in). You can compose any combination of toppings without the ice cream shop pre-making every permutation. In code, each topping is a Decorator and the soft-serve is the ConcreteComponent — they all implement the same "dessert" interface.',
      s: 'Stack behaviours at runtime without modifying the base class.',
    },
    te: {
      def: 'Decorator is a structural pattern that attaches additional responsibilities to an object dynamically by wrapping it in Decorator objects that implement the same interface, providing a flexible alternative to subclassing for extending functionality.',
      types: [
        { n: 'Classical Decorator', d: 'Implements the Component interface and delegates to a wrapped Component. The GoF textbook pattern.' },
        { n: 'Function Decorator (Python/JS)', d: 'A higher-order function that wraps another function, adding behaviour before/after. `@memoize`, `@retry`, `@authenticate` in Python/TypeScript.' },
        { n: 'Middleware Chain (Express)', d: 'A linear stack of decorator-like middleware functions, each calling `next()` to delegate to the next layer. The Decorator pattern adapted for request/response pipelines.' },
      ],
      when: 'Use when you need to add optional, composable behaviour to objects without modifying their class, especially when the number of combinations would make subclassing impractical.',
      trade:
        'Pro: composable at runtime, follows open/closed principle, avoids class explosion. Con: ordering can be non-obvious, identity checks break, many small wrapper objects can be hard to debug.',
      code: `interface Request { handle(url: string): string; }

class BaseHandler implements Request {
  handle(url: string): string { return \`Response from \${url}\`; }
}

class AuthDecorator implements Request {
  constructor(private inner: Request) {}
  handle(url: string): string {
    console.log('[Auth] Checking token...');
    return this.inner.handle(url);
  }
}

class LoggingDecorator implements Request {
  constructor(private inner: Request) {}
  handle(url: string): string {
    console.log(\`[Log] Request to \${url}\`);
    const result = this.inner.handle(url);
    console.log(\`[Log] Response: \${result}\`);
    return result;
  }
}

// Stack: Logging wraps Auth wraps Base
const handler = new LoggingDecorator(new AuthDecorator(new BaseHandler()));
handler.handle('/api/orders');`,
      rw: {
        ex: [
          "Express middleware: app.use(cors()), app.use(bodyParser.json()) — each middleware is a Decorator wrapping the next handler",
          "Java I/O streams: new BufferedReader(new InputStreamReader(new FileInputStream('file.txt')))",
          'Python @functools.lru_cache — a Decorator that adds memoisation to any function',
          'TypeScript/NestJS: @UseGuards(), @UseInterceptors() — method decorators that wrap controllers',
        ],
        cs: "Express.js middleware is the Decorator pattern made architectural. Each `app.use()` call adds a layer: cors() checks CORS, bodyParser() parses the body, authMiddleware() verifies the JWT — all before the route handler runs. Adding rate limiting means wrapping with one more middleware, with zero changes to route handlers. Netflix's Zuul API gateway uses a similar stacked filter (Decorator) model for routing, auth, and metrics.",
      },
    },
    interview: {
      q: 'How does Decorator differ from inheritance?',
      a: "Inheritance adds behaviour at compile time and is static — once you've subclassed, that behaviour is always present. With N independent behaviours you'd need 2^N subclasses to cover all combinations: LoggedAuthenticatedCachedHandler, LoggedCachedHandler, AuthenticatedCachedHandler... Decorator achieves the same with N Decorator classes you can stack in any combination at runtime. Decorator also respects the open/closed principle — you add a new CacheDecorator without touching the existing LoggingDecorator or the base class. The trade-off is that `instanceof` checks no longer work on decorated objects, and decorator ordering must be explicitly managed.",
      fu: [
        'How does the Express middleware chain implement the Decorator pattern?',
        'How would you ensure correct decorator ordering in a dependency-injection framework?',
        'What is the difference between a Decorator and a Proxy in terms of intent?',
      ],
    },
  },

  {
    id: 'proxy',
    cat: 'patterns',
    color: '#c084fc',
    icon: '🕵️',
    title: 'Proxy',
    tag: "A celebrity's manager: controls all access to the celebrity",
    overview:
      "Proxy provides a surrogate or placeholder for another object, controlling access to it. The Proxy and the RealSubject share the same interface, so clients can't tell the difference. The Proxy intercepts all calls and can add lazy initialisation, access control, caching, logging, or network indirection transparently. Three canonical variants: Virtual (deferred creation), Protection (access control), and Remote (hides network calls).",
    components: [
      {
        name: 'Subject Interface',
        icon: '📄',
        role: 'The common interface shared by RealSubject and Proxy.',
        detail:
          'Declares the operations the client uses. Because both the Proxy and the RealSubject implement this interface, the client cannot distinguish between them — it simply receives a Subject and calls its methods.',
      },
      {
        name: 'RealSubject',
        icon: '⭐',
        role: 'The actual object with the real implementation.',
        detail:
          'Contains the expensive, restricted, or remote resource. It is never accessed directly by clients — all access flows through the Proxy. The RealSubject may not even exist until the Proxy decides to create it (Virtual Proxy).',
      },
      {
        name: 'Proxy',
        icon: '🕵️',
        role: 'Controls access to the RealSubject.',
        detail:
          'Implements the Subject interface. On each method call the Proxy can check permissions, return a cached result, record the call, or forward the call to the RealSubject. For a Virtual Proxy it creates the RealSubject on first access.',
      },
    ],
    howItWorks:
      'The client receives a Proxy object (injected or created via a factory) and calls its methods. The Proxy intercepts each call and decides what to do: return a cached response, reject the call due to insufficient permissions, create the RealSubject lazily and delegate, or serialise the call and send it over the network. The RealSubject is never directly visible to the client.',
    decision: {
      choose: [
        'Virtual Proxy: delay expensive object creation until first use (lazy loading database connections, large images)',
        'Protection Proxy: check permissions before delegating to the real object',
        'Caching Proxy: return cached results without hitting the real subject on every call',
        'Remote Proxy: hide a network call behind a local interface (gRPC stubs, RMI)',
      ],
      avoid: [
        'Hot code paths — every proxy call adds an indirection hop; avoid for tight loops or microsecond-sensitive operations',
        'When transparency is critical and callers must know they are talking to a proxy',
      ],
      vs: [
        { name: 'Decorator', when: "Decorator adds behaviour to an object you already have. Proxy controls access to an object — callers may not know the real object exists. Different intents: augmentation vs access control." },
        { name: 'Adapter', when: 'Adapter converts one interface to another. Proxy keeps the same interface but gates access to the underlying object.' },
        { name: 'Facade', when: 'Facade simplifies a complex subsystem. Proxy manages access to a single object, not a system.' },
      ],
    },
    failures: [
      {
        name: 'Silent Error Swallowing',
        cause: 'The Proxy catches exceptions from the RealSubject and returns null or a default instead of surfacing the error.',
        symptom: 'Failures are invisible; the client believes the operation succeeded; data corruption downstream.',
        fix: 'Proxies should re-throw or translate exceptions — never swallow them silently. Log and rethrow at minimum.',
        severity: 'critical',
      },
      {
        name: 'Performance Proxy Overhead',
        cause: 'A caching or logging Proxy is added to a method called millions of times per second.',
        symptom: 'Latency increases; profiler shows proxy overhead dominating hot paths.',
        fix: 'Profile before adding Proxies to high-frequency calls. Use direct calls in hot paths; reserve Proxy for I/O-bound or infrequent calls.',
        severity: 'high',
      },
    ],
    a: {
      v: '🕵️ ↔️ ⭐',
      t: "The Celebrity's Manager",
      tx: "A celebrity has a manager who handles all communication: interview requests, appearance bookings, fan mail. Nobody talks directly to the celebrity — they go through the manager. The manager can decline requests outright (protection), say the celebrity is unavailable until tomorrow (virtual — defer until ready), or pull from a standard set of pre-approved responses (caching). The caller doesn't know or care whether the manager is forwarding the request or handling it themselves — they just hear back with an answer. The celebrity is the RealSubject; the manager is the Proxy.",
      s: 'Same interface, but access is controlled, deferred, or cached.',
    },
    te: {
      def: 'Proxy is a structural pattern that provides a surrogate object with the same interface as the real subject, controlling access to it in order to add lazy initialisation, access control, caching, logging, or network transparency.',
      types: [
        { n: 'Virtual Proxy', d: 'Defers expensive object creation until first use. Common for large assets (images, DB connections) that are costly to initialise.' },
        { n: 'Protection Proxy', d: 'Checks caller permissions before delegating. The Proxy enforces access control; the RealSubject only handles authorised calls.' },
        { n: 'Caching Proxy', d: 'Returns cached results for repeated identical calls. Transparent memoisation without modifying the RealSubject.' },
        { n: 'Remote Proxy', d: 'Represents an object in a different address space (another process, another machine). gRPC stubs and RMI are canonical remote proxies.' },
      ],
      when: 'Use when you need to add a controlled layer of indirection around an object: lazy creation of expensive resources, access control, transparent caching, or hiding a remote resource behind a local interface.',
      trade:
        'Pro: adds cross-cutting concerns (auth, caching, logging) transparently, enables lazy initialisation. Con: indirection adds latency, can hide errors if implemented carelessly, adds complexity.',
      code: `interface ImageLoader { load(url: string): string; }

class RealImageLoader implements ImageLoader {
  load(url: string): string {
    console.log(\`[Real] Loading from network: \${url}\`);
    return \`<img src="\${url}">\`;
  }
}

class CachingImageProxy implements ImageLoader {
  private cache = new Map<string, string>();
  constructor(private real: RealImageLoader) {}

  load(url: string): string {
    if (this.cache.has(url)) {
      console.log(\`[Proxy] Cache hit: \${url}\`);
      return this.cache.get(url)!;
    }
    const result = this.real.load(url);
    this.cache.set(url, result);
    return result;
  }
}

const loader: ImageLoader = new CachingImageProxy(new RealImageLoader());
loader.load('https://cdn.example.com/hero.png'); // network call
loader.load('https://cdn.example.com/hero.png'); // cache hit`,
      rw: {
        ex: [
          "JavaScript's Proxy object — intercepts property access, assignment, and function calls on any object",
          'Service workers — a network proxy intercepting fetch requests in the browser',
          'ORM lazy loading — Hibernate/TypeORM return proxy objects for related entities until first access',
          'API Gateway (Kong, AWS API GW) — a Remote Proxy in front of backend services',
        ],
        cs: "Hibernate's lazy loading is a canonical Virtual Proxy in production. `user.getOrders()` returns a Hibernate proxy, not a real collection. The first call to iterate triggers a SQL query. This defers N+1 queries until they're actually needed — but also causes the infamous LazyInitializationException when the session is closed before access. A Proxy that hides its errors silently is one of the most common bugs in Java enterprise applications.",
      },
    },
    interview: {
      q: "What's the difference between Proxy and Decorator?",
      a: 'Both patterns implement the same interface as the object they wrap, but their intents differ fundamentally. Proxy is about controlling access — the caller may not even know the real object exists (lazy creation, auth gate, remote stub). The Proxy owns the lifecycle or access rights to the RealSubject. Decorator is about augmenting behaviour — the caller already has a Component and wants to add logging, caching, or validation on top of it. The caller typically constructs the Decorator explicitly. A simple test: if you are adding new capabilities the caller opted into — Decorator. If you are intercepting access the caller does not control — Proxy.',
      fu: [
        "How does JavaScript's built-in Proxy object implement the Proxy pattern?",
        'How would you implement a rate-limiting Proxy for an API client?',
        'What is the risk of using a Virtual Proxy in a concurrent environment?',
      ],
    },
  },

  // ─── BEHAVIOURAL ─────────────────────────────────────────────────────────────

  {
    id: 'observer',
    cat: 'patterns',
    color: '#818cf8',
    icon: '📡',
    title: 'Observer',
    tag: 'YouTube subscriptions: one channel, millions of subscribers notified automatically',
    overview:
      'Observer defines a one-to-many dependency between objects so that when one object (the Subject) changes state, all its registered Observers are notified and updated automatically. It decouples the publisher from its subscribers — neither needs to know the other\'s concrete type. It is the backbone of event systems, reactive programming, and the DOM event model.',
    components: [
      {
        name: 'Subject / Observable',
        icon: '📡',
        role: 'Maintains a list of Observers and notifies them of state changes.',
        detail:
          'Provides `subscribe()`, `unsubscribe()`, and `notify()` methods. On state change it calls `notify()`, which iterates the subscriber list and calls `update()` on each. The Subject has no knowledge of the concrete Observer types.',
      },
      {
        name: 'Observer Interface',
        icon: '🔔',
        role: 'The contract every subscriber must implement.',
        detail:
          "Declares the `update(event)` method. The Subject calls this method on every registered Observer when its state changes. Defining this as an interface — not a base class — keeps subscribers loosely coupled.",
      },
      {
        name: 'ConcreteObserver',
        icon: '👤',
        role: 'Reacts to Subject state changes.',
        detail:
          "Implements the Observer interface. Each ConcreteObserver has its own reaction to the event — one sends an email, another updates a UI component, a third writes to a log. The Subject doesn't know or care how many ConcreteObservers exist.",
      },
    ],
    howItWorks:
      "Observers register themselves with the Subject by calling `subject.subscribe(this)`. When the Subject's state changes, it calls `notify()`, which iterates the internal list and calls each Observer's `update()` method, passing the new state or event data. Observers can also unsubscribe when they no longer need updates. In push-based implementations the Subject sends data to Observers. In pull-based ones the Subject sends a change notification and Observers pull the new state themselves.",
    decision: {
      choose: [
        'A change to one object must trigger updates in an unknown or open-ended number of other objects',
        'Objects should be able to subscribe and unsubscribe dynamically at runtime',
        'You want to decouple the event source from event handlers so each can vary independently',
      ],
      avoid: [
        'Observers that depend on each other — cascading update chains cause infinite loops or unpredictable execution orders',
        'Memory-constrained environments without guaranteed unsubscription — Observer is one of the most common sources of memory leaks',
        'High-frequency state changes (thousands per second) with many slow observers — push-based synchronous notification will bottleneck',
      ],
      vs: [
        { name: 'Event-Driven Architecture (EDA)', when: "Observer is in-process and synchronous. EDA uses a message broker (Kafka, SQS) across services and is async. Use Observer within a service; use EDA across services." },
        { name: 'Reactive Streams (RxJS)', when: "RxJS Observables extend the pattern with operators (map, filter, debounce) and backpressure. Use RxJS when you need to compose and transform event streams, not just forward raw notifications." },
      ],
    },
    failures: [
      {
        name: 'Memory Leak on Unsubscription',
        cause: 'Component subscribes to a Subject on mount but never calls `unsubscribe()` on unmount.',
        symptom: 'Memory grows linearly with navigation; callbacks fire on unmounted components; \"setState on unmounted component\" React warnings.',
        fix: 'Always pair subscribe() with unsubscribe() in a cleanup/destructor. In React, return a cleanup function from useEffect that unsubscribes.',
        severity: 'critical',
      },
      {
        name: 'Cascading Update Chain',
        cause: "Observer A's update triggers Subject B's state change, which notifies Observer C, which triggers Subject A again.",
        symptom: 'Stack overflow or infinite loop; UI flickers; events arrive in unpredictable order.',
        fix: 'Design event flows as a DAG (no cycles). Use async notification or a scheduler to break synchronous chains.',
        severity: 'high',
      },
    ],
    a: {
      v: '📺 📡 → 👥👥👥',
      t: 'YouTube Subscriptions',
      tx: "A YouTube channel (the Subject) doesn't know how many subscribers it has or what they'll do with a new video. When it publishes a new video (state change), YouTube's notification system calls every subscriber automatically — one person gets a push notification, another gets an email, a third sees it in their feed. The channel didn't write code for each subscriber type; it just fired a 'new video' event. Subscribers can unsubscribe anytime and the channel never notices. If a subscriber never unsubscribes after deleting their account, the notification system keeps their dead reference forever — the classic Observer memory leak.",
      s: "Subject notifies all subscribers automatically — neither side knows the other's concrete type.",
    },
    te: {
      def: "Observer is a behavioural pattern that defines a one-to-many dependency between objects so that when a Subject's state changes, all registered Observers are automatically notified and updated, enabling loosely coupled event-driven communication.",
      types: [
        { n: 'Push Observer', d: 'Subject passes the new state/event data directly to Observer.update(data). Simpler but couples Observers to the data shape.' },
        { n: 'Pull Observer', d: "Subject calls update() with a reference to itself; Observers pull the state they need. More flexible but requires Observers to know the Subject's interface." },
        { n: 'EventEmitter (Node.js)', d: "Node's built-in EventEmitter is a push-based Observer implementation. `emitter.on('data', handler)` subscribes; `emitter.emit('data', payload)` notifies." },
      ],
      when: "Use when one object's state changes should automatically trigger updates in other objects, when the number of dependent objects is open-ended, or when you want loose coupling between event producers and consumers.",
      trade:
        'Pro: decoupled event source and handlers, dynamic subscription at runtime. Con: memory leaks if unsubscription is not managed, unpredictable notification order, cascading updates hard to debug.',
      code: `type EventHandler<T> = (data: T) => void;

class EventEmitter<T> {
  private handlers: EventHandler<T>[] = [];

  subscribe(handler: EventHandler<T>): () => void {
    this.handlers.push(handler);
    return () => { this.handlers = this.handlers.filter(h => h !== handler); };
  }

  emit(data: T): void {
    this.handlers.forEach(h => h(data));
  }
}

const stockTicker = new EventEmitter<{ symbol: string; price: number }>();

const unsubDashboard = stockTicker.subscribe(e => console.log(\`Dashboard: \${e.symbol} = $\${e.price}\`));
const unsubAlert = stockTicker.subscribe(e => { if (e.price > 200) console.log(\`Alert: \${e.symbol} crossed $200!\`); });

stockTicker.emit({ symbol: 'AAPL', price: 215 });
unsubDashboard(); // cleanup — prevents memory leak
stockTicker.emit({ symbol: 'AAPL', price: 220 }); // only alert fires`,
      rw: {
        ex: [
          'DOM addEventListener / removeEventListener — the browser Observer implementation',
          "React's useState trigger re-renders — React's fiber scheduler is a push Observer for state changes",
          "Node.js EventEmitter — backbone of streams, HTTP servers, and every 'on(event)' API",
          'WebSocket broadcast: server Subject, multiple clients as Observers',
        ],
        cs: "Redux is a textbook Observer implementation at scale. The store is the Subject; React components `useSelector` to subscribe; `dispatch(action)` is the `notify()`. The store never knows how many components are subscribed or what they render. At Airbnb and Twitter, Redux stores manage millions of subscriptions per page — making unsubscription (handled automatically by useSelector cleanup) the critical detail that prevents memory leaks in large SPAs.",
      },
    },
    interview: {
      q: 'Observer vs Event-Driven Architecture — are they the same thing?',
      a: "Observer is an in-process design pattern: objects directly hold references to each other's callback functions, and notification is synchronous within the same memory space. Event-Driven Architecture (EDA) is a distributed architectural pattern: services communicate by publishing events to a broker (Kafka, RabbitMQ, SQS), which delivers them asynchronously to consumers. Observer is synchronous and in-process; EDA is asynchronous and cross-service. An Observer in service A cannot subscribe to Subject in service B — you'd need a message broker. That said, within a single service, the Observer pattern can be used to implement an internal event bus that decouples modules before they grow into separate microservices.",
      fu: [
        'How would you prevent memory leaks from Observers in a React single-page application?',
        'What is the difference between a push-based and pull-based Observer, and when would you choose each?',
        'How does RxJS extend the Observer pattern, and when would you use it instead of a plain EventEmitter?',
      ],
    },
  },

  {
    id: 'strategy',
    cat: 'patterns',
    color: '#818cf8',
    icon: '🗺️',
    title: 'Strategy',
    tag: 'GPS navigation: same trip, choose fastest/shortest/cheapest route',
    overview:
      "Strategy defines a family of algorithms, encapsulates each one, and makes them interchangeable. The client selects a strategy at runtime without knowing the algorithm's internals. It's the clean alternative to large switch statements — and the pattern underlying Passport.js auth strategies, compression codecs, sorting algorithms, and payment method selection.",
    components: [
      {
        name: 'Context',
        icon: '🗺️',
        role: 'Holds a reference to a Strategy and delegates algorithm execution to it.',
        detail:
          "The Context is the class the client uses. It stores a reference to whichever Strategy was configured. When the client calls the Context's main method, the Context delegates to `strategy.execute()`. The Context is coupled only to the Strategy interface, not any concrete implementation.",
      },
      {
        name: 'Strategy Interface',
        icon: '📋',
        role: 'Defines the algorithm contract all concrete strategies must implement.',
        detail:
          "Declares the method (e.g. `sort(data)`, `pay(amount)`, `compress(data)`) that every ConcreteStrategy must implement. The Context calls this method. Because all strategies share the same interface, they are interchangeable without changing the Context.",
      },
      {
        name: 'ConcreteStrategy',
        icon: '🔧',
        role: 'Implements one specific algorithm variant.',
        detail:
          'Each ConcreteStrategy encapsulates one algorithm or behaviour variant. `QuickSortStrategy`, `BubbleSortStrategy`, `StripePaymentStrategy`, `PayPalPaymentStrategy` — each is a separate class with no knowledge of the others or the Context.',
      },
    ],
    howItWorks:
      'The client creates a Context and either injects the chosen ConcreteStrategy via the constructor or calls a setter. The client then uses the Context as normal — it never calls the Strategy directly. The Context delegates algorithm execution to the Strategy. Swapping the strategy (e.g., from `FastestRoute` to `CheapestRoute`) changes the behaviour without modifying the Context or any other code.',
    decision: {
      choose: [
        'You have multiple variants of an algorithm and want to switch between them at runtime',
        'You want to eliminate large switch/if-else statements routing to different algorithm variants',
        'You want to isolate algorithm implementation details from the code that uses the algorithm',
        'Different users/tenants need different algorithm choices configured at startup',
      ],
      avoid: [
        "When you only have two or three strategies that never change — an if-else is simpler and the pattern is over-engineering",
        'When strategies need to share significant private state with the Context — a design smell, reconsider the boundary',
      ],
      vs: [
        { name: 'State', when: 'In Strategy, the client picks the algorithm. In State, the object transitions itself between states automatically. Both use polymorphism but for different reasons.' },
        { name: 'Template Method', when: "Template Method uses inheritance to vary specific steps of an algorithm. Strategy uses composition to replace the entire algorithm. Prefer Strategy (composition over inheritance) unless steps are inseparable." },
        { name: 'Command', when: 'Command encapsulates a request as an object (supports undo/queue). Strategy encapsulates an algorithm. A Command might use a Strategy internally to decide how to execute.' },
      ],
    },
    failures: [
      {
        name: 'Strategy Explosion',
        cause: 'A new ConcreteStrategy class is created for every minor algorithm variant, resulting in 30+ tiny classes.',
        symptom: 'The codebase has a `strategies/` folder with dozens of single-method classes; discovering the right one requires reading all of them.',
        fix: 'For simple, stateless algorithms, use a map of lambda functions: `const sorters = { quick: (a) => ..., bubble: (a) => ... }`. Full classes are only justified when strategies have state or complex logic.',
        severity: 'medium',
      },
      {
        name: 'Context Leakage into Strategy',
        cause: 'A Strategy needs to call back into the Context to read configuration or call other methods.',
        symptom: 'Strategy constructors accept Context references; circular imports appear; strategies cannot be reused outside this Context.',
        fix: "Pass all needed data as parameters to the strategy's `execute()` method. If the strategy needs too much context, the abstraction boundary is wrong.",
        severity: 'high',
      },
    ],
    a: {
      v: '🗺️ → 🚀🛣️💸',
      t: 'GPS Navigation Routes',
      tx: 'You want to drive from London to Edinburgh. Your GPS (the Context) can calculate the route using multiple strategies: fastest (motorway, tolls), shortest (rural roads), or cheapest (avoid tolls). The destination and the car do not change — only the routing algorithm does. You choose Fastest, and the GPS delegates to the FastestRoute strategy. Tomorrow you choose Cheapest, and the GPS delegates to the CheapestRoute strategy instead. The GPS does not know or care how each route is calculated — it just calls `strategy.calculate(origin, destination)` and displays the result.',
      s: 'Swap algorithms at runtime through a common interface — eliminate switch statements.',
    },
    te: {
      def: 'Strategy is a behavioural pattern that defines a family of algorithms, encapsulates each in a separate class, and makes them interchangeable by having the Context delegate algorithm execution to a Strategy interface, allowing the algorithm to vary independently from the clients that use it.',
      types: [
        { n: 'Class-based Strategy', d: 'Each algorithm is a class implementing the Strategy interface. Provides state and complex logic. The classic GoF approach.' },
        { n: 'Function-based Strategy', d: 'Each algorithm is a function. The Context stores a function reference: `this.sorter = (data) => data.sort(compareFn)`. Idiomatic in functional languages and JavaScript.' },
        { n: 'Registry Strategy', d: "A map from string keys to strategy functions/classes: `strategies['gzip']`. The client selects by name — useful for plugin systems and user-configurable behaviour." },
      ],
      when: 'Use when you have multiple algorithm variants for the same task, when you want to eliminate branching logic, or when you need to configure behaviour at runtime per user/tenant/request.',
      trade:
        'Pro: eliminates conditionals, algorithms are independently testable, open/closed principle. Con: clients must be aware that strategies exist; function-based strategies may be simpler for stateless algorithms.',
      code: `interface SortStrategy { sort(data: number[]): number[]; }

class QuickSort implements SortStrategy {
  sort(data: number[]): number[] {
    return [...data].sort((a, b) => a - b); // simplified
  }
}
class BubbleSort implements SortStrategy {
  sort(data: number[]): number[] {
    const arr = [...data];
    for (let i = 0; i < arr.length; i++)
      for (let j = 0; j < arr.length - i - 1; j++)
        if (arr[j] > arr[j+1]) [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
    return arr;
  }
}

class Sorter {
  constructor(private strategy: SortStrategy) {}
  setStrategy(s: SortStrategy) { this.strategy = s; }
  sort(data: number[]): number[] { return this.strategy.sort(data); }
}

const sorter = new Sorter(new QuickSort());
console.log(sorter.sort([5, 2, 8, 1])); // [1, 2, 5, 8]
sorter.setStrategy(new BubbleSort());
console.log(sorter.sort([5, 2, 8, 1])); // [1, 2, 5, 8] — same result, different algorithm`,
      rw: {
        ex: [
          "Passport.js: passport.use(new JWTStrategy(...)) — each auth mechanism is a Strategy, Passport is the Context",
          "Array.prototype.sort(compareFn) — the compare function is a function-based Strategy",
          'Payment processing: StripeStrategy, PayPalStrategy, ApplePayStrategy all implement a PaymentStrategy interface',
          'Compression: GzipStrategy, BrotliStrategy, ZstdStrategy behind a Compressor Context',
        ],
        cs: "Passport.js is one of the most widely deployed examples of Strategy. The passport.authenticate() middleware is the Context; LocalStrategy, GoogleOAuthStrategy, and JWTStrategy are ConcreteStrategies. Switching from username/password to OAuth requires adding a new strategy class and one line of configuration — zero changes to route handlers. This is Strategy's open/closed principle in production.",
      },
    },
    interview: {
      q: 'Strategy vs State — what is the difference?',
      a: "Strategy is about choosing between interchangeable algorithms: the client picks a strategy (fastest route, bubble sort, Stripe payment), and the Context uses it. The strategy is typically set once and is externally controlled. State is about an object changing its own behaviour as its internal state transitions: a traffic light automatically cycles Red → Green → Yellow; a TCP connection moves between CLOSED, LISTEN, ESTABLISHED, CLOSING. In State, the object knows about the transitions and drives itself; the client doesn't pick the next state. Both use polymorphism and a similar class structure — the difference is in who controls the transitions and why the behaviour varies.",
      fu: [
        "How would you implement Passport.js's strategy selection using the Strategy pattern?",
        'When is a map of lambda functions a better choice than a full Strategy class hierarchy?',
        'How does Strategy interact with the Dependency Injection principle?',
      ],
    },
  },

  {
    id: 'command',
    cat: 'patterns',
    color: '#818cf8',
    icon: '📋',
    title: 'Command',
    tag: 'A restaurant order ticket: the request written down, not spoken',
    overview:
      "Command turns a request into a standalone object containing all information needed to perform the action. This encapsulation enables queuing, logging, scheduling, and undo/redo. Instead of calling a method directly, the caller creates a Command object and passes it to an Invoker, decoupling the requester from the executor.",
    components: [
      {
        name: 'Command Interface',
        icon: '📋',
        role: 'Declares execute() and optionally undo().',
        detail:
          'The contract all concrete commands implement. `execute()` performs the action; `undo()` reverses it. Because all Commands share this interface, the Invoker can queue, execute, and reverse them without knowing what they do.',
      },
      {
        name: 'ConcreteCommand',
        icon: '🔧',
        role: 'Encapsulates a specific action and its parameters.',
        detail:
          'Binds a Receiver to a specific action with specific parameters at construction time. When `execute()` is called, it calls the appropriate Receiver method. When `undo()` is called, it reverses the effect (e.g., re-inserts deleted text, decrements a counter).',
      },
      {
        name: 'Invoker',
        icon: '⚡',
        role: 'Triggers commands and manages the command history.',
        detail:
          'Stores commands in an execution queue or history stack. It does not know what each Command does — it just calls `execute()` or `undo()`. This is where undo stacks, job queues, and macro recording live.',
      },
      {
        name: 'Receiver',
        icon: '🎯',
        role: 'The actual object that performs the work.',
        detail:
          "The domain object (a text editor, a bank account, a robot arm) that knows how to perform the operation. The ConcreteCommand holds a reference to the Receiver and delegates to it — the Receiver doesn't know it is being called via a Command.",
      },
    ],
    howItWorks:
      'The client creates a ConcreteCommand, passing it the Receiver and any parameters. The client hands the Command to the Invoker. The Invoker calls `command.execute()` at the appropriate time (immediately, after a delay, or from a queue). The ConcreteCommand calls the Receiver\'s method. For undo, the Invoker pops Commands from a history stack and calls `undo()` on each in reverse order.',
    decision: {
      choose: [
        'You need undo/redo functionality — Command is the canonical solution',
        'You need to queue, schedule, or delay operations (job queues, retry systems)',
        'You need an audit log of operations performed (each Command is a log entry)',
        'You want macro recording — a sequence of Commands that can be replayed',
      ],
      avoid: [
        'Simple one-shot function calls with no undo/queue requirements — Command adds significant boilerplate',
        "When commands can't be undone — design with irreversibility in mind from the start and consider whether Command is still the right choice",
      ],
      vs: [
        { name: 'Strategy', when: 'Strategy encapsulates an interchangeable algorithm. Command encapsulates a request (one-time action with undo). A Command might internally use a Strategy.' },
        { name: 'Memento', when: 'Memento stores the complete state snapshot for undo. Command stores the operation delta. Command undo is more memory-efficient; Memento is simpler when operations are hard to reverse.' },
      ],
    },
    failures: [
      {
        name: 'Undo Stack Memory Growth',
        cause: 'An undo history is kept indefinitely for a large document with thousands of operations.',
        symptom: 'Memory consumption grows unboundedly; the application runs out of heap after extended use.',
        fix: 'Cap the undo stack at a maximum size (e.g., 100 operations). For large data, store only deltas, not full snapshots.',
        severity: 'high',
      },
      {
        name: 'Non-Reversible Commands',
        cause: 'A DeleteUserCommand is added to the undo stack but its undo() does nothing because the data is gone.',
        symptom: 'Undo appears to succeed but has no effect; user loses work permanently despite seeing undo in the UI.',
        fix: 'Design Commands with reversibility in mind from the start. Destructive operations should soft-delete (mark as deleted) rather than hard-delete, making undo trivial.',
        severity: 'critical',
      },
    ],
    a: {
      v: '📋 → 🍳 → 🍽️',
      t: 'The Restaurant Order Ticket',
      tx: "In a restaurant, a waiter doesn't run to the kitchen and shout each order verbally. They write it on a ticket — the Command object. The ticket captures exactly what was ordered (the parameters). The waiter hands it to the kitchen (the Invoker). The kitchen can process it immediately, queue it behind other orders, or put it on hold. If the order is wrong, the kitchen still has the ticket and can reference it. The chef (the Receiver) actually cooks the dish without knowing who the waiter was or which table ordered it. The ticket decouples the request from its execution — and the kitchen can replay the ticket for a repeat order.",
      s: 'Encapsulate requests as objects to enable queuing, logging, and undo.',
    },
    te: {
      def: 'Command is a behavioural pattern that encapsulates a request as an object, decoupling the requester from the executor and enabling queuing, logging, undo/redo, and deferred execution.',
      types: [
        { n: 'Simple Command', d: 'A ConcreteCommand that wraps a single method call on a Receiver. No undo support needed — used for job queues and audit logging.' },
        { n: 'Reversible Command', d: 'Implements both execute() and undo(). Stores the state needed to reverse the operation (the delta, not the full snapshot).' },
        { n: 'Macro Command', d: 'A CompositeCommand that holds a list of Commands and executes them in sequence. Supports undo by reversing the sequence.' },
      ],
      when: 'Use when you need undo/redo, operation queuing, transactional sequences, audit logging, or deferred execution of operations.',
      trade:
        'Pro: undo/redo for free, decoupled requester/executor, easy audit logging, composable macro commands. Con: significant class count grows with operation count; non-reversible operations require careful design.',
      code: `interface Command { execute(): void; undo(): void; }

class TextEditor {
  private text = '';
  insert(str: string) { this.text += str; }
  delete(n: number) { this.text = this.text.slice(0, -n); }
  getText() { return this.text; }
}

class InsertCommand implements Command {
  constructor(private editor: TextEditor, private text: string) {}
  execute() { this.editor.insert(this.text); }
  undo() { this.editor.delete(this.text.length); }
}

class CommandHistory {
  private stack: Command[] = [];
  execute(cmd: Command) { cmd.execute(); this.stack.push(cmd); }
  undo() { this.stack.pop()?.undo(); }
}

const editor = new TextEditor();
const history = new CommandHistory();

history.execute(new InsertCommand(editor, 'Hello'));
history.execute(new InsertCommand(editor, ' World'));
console.log(editor.getText()); // "Hello World"
history.undo();
console.log(editor.getText()); // "Hello"`,
      rw: {
        ex: [
          'Text editor undo/redo — every keystroke is a Command on a history stack',
          'Bull / Sidekiq job queues — serialised Command objects persisted to Redis and executed by workers',
          'Database migration runners — each migration is a Command with up() and down() methods',
          'Git commits — each commit is a reversible Command; `git revert` is undo()',
        ],
        cs: "Bull (Node.js job queue) serialises Command objects to Redis. A `SendEmailJob` has a `process()` method (execute) and can be retried or failed independently of the caller that enqueued it. The Invoker (Bull worker) picks jobs from the queue and calls `process()` — it has no knowledge of what the job does. This decoupling allows Shopify to process millions of background jobs per day without coupling their web process to their email-sending logic.",
      },
    },
    interview: {
      q: 'How does Command enable undo/redo?',
      a: "Each ConcreteCommand stores both the execute() and undo() operations along with the data needed to reverse the action (the delta). An Invoker maintains an undo stack of executed Commands. When the user hits Ctrl+Z, the Invoker pops the top Command and calls undo(). For Ctrl+Y (redo), the Command is re-executed and pushed back. Without Command, undo requires capturing the full application state before every operation — expensive and complex. Command stores only the minimal delta (what changed and how to reverse it), making undo memory-efficient. The key design requirement: every Command's undo() must perfectly reverse its execute() — which means destructive operations (hard DELETE) must be redesigned as soft-delete to be reversible.",
      fu: [
        'How would you implement a transactional Command that rolls back all steps if one fails?',
        'How does the Command pattern apply to database migration frameworks like Flyway or Knex migrations?',
        'What is the Macro Command pattern and how would you implement it?',
      ],
    },
  },

  {
    id: 'iterator',
    cat: 'patterns',
    color: '#818cf8',
    icon: '📺',
    title: 'Iterator',
    tag: "A TV remote: channel-flip one at a time without knowing the schedule",
    overview:
      "Iterator provides a standard way to traverse the elements of a collection sequentially without exposing its internal structure. The client uses the iterator's `next()` and `hasNext()` interface regardless of whether the underlying collection is an array, a linked list, a tree, a database cursor, or a network stream. It is so fundamental that JavaScript, Python, Java, and C# have all formalised it into the language itself.",
    components: [
      {
        name: 'Iterator Interface',
        icon: '⏭️',
        role: 'Declares the traversal contract: hasNext() and next().',
        detail:
          'The standard interface every iterator must implement. `hasNext()` returns true if more elements remain. `next()` returns the next element and advances the cursor. In JavaScript, this is the iteration protocol: `{ next(): { value, done } }`.',
      },
      {
        name: 'ConcreteIterator',
        icon: '🎯',
        role: 'Tracks current position in the collection.',
        detail:
          'Maintains a cursor (index, pointer, or page token) into the collection. Each call to `next()` advances the cursor and returns the element at the previous position. Multiple ConcreteIterators can traverse the same collection independently.',
      },
      {
        name: 'Aggregate / Collection',
        icon: '📦',
        role: 'Creates and returns an Iterator over its elements.',
        detail:
          "The collection class (array, list, tree, paginated API) implements a factory method — `createIterator()` or `[Symbol.iterator]()` — that returns a ConcreteIterator initialised to the start of the collection. The collection's internal structure stays private.",
      },
    ],
    howItWorks:
      "The client calls `collection[Symbol.iterator]()` (or `createIterator()`) to get an Iterator. It then calls `iterator.next()` in a loop until `done: true` is returned. The iterator keeps track of the current position entirely within itself — the collection does not change. Multiple iterators over the same collection are independent, each with their own cursor. `for...of` in JavaScript calls this protocol automatically on any iterable object.",
    decision: {
      choose: [
        "You want to traverse a collection without exposing its internal structure (array indices, linked list pointers, tree node references)",
        "You need multiple independent traversals of the same collection simultaneously",
        "You want a unified traversal interface across different collection types (arrays, Sets, Maps, custom data structures)",
        "Paginated data sources that require maintaining state between fetches (database cursors, API pagination tokens)",
      ],
      avoid: [
        "When you only ever need `forEach` on a simple array — `for...of` already implements the pattern for you",
        "Modifying the collection during iteration — behaviour is undefined or throws in most implementations",
      ],
      vs: [
        { name: 'Visitor', when: "Visitor traverses a structure and applies operations. Iterator traverses and returns elements. Use Visitor when you want to run different operations on each element type without changing the element classes." },
        { name: 'Generator (JavaScript)', when: "A generator function is a language-native way to implement a ConcreteIterator — `yield` pauses execution and returns a value. Use generators for lazy sequences; use Iterator protocol when the collection already exists." },
      ],
    },
    failures: [
      {
        name: 'Modification During Iteration',
        cause: 'An element is added or removed from the collection while an iterator is traversing it.',
        symptom: "Items are skipped, visited twice, or the iterator throws ConcurrentModificationException (Java). In JavaScript, array mutation during for...of has undefined behaviour.",
        fix: 'Iterate over a snapshot copy (`[...collection]`) if modification is needed. Or use a fail-fast iterator that throws immediately on structural modification.',
        severity: 'high',
      },
      {
        name: 'Shared Mutable Iterator State',
        cause: 'Two consumers share the same Iterator instance and both call next() — each gets half the elements.',
        symptom: 'One consumer receives only even-indexed elements; both see incomplete data; race conditions in async code.',
        fix: 'Each consumer must get its own iterator via a fresh call to `[Symbol.iterator]()`. Never share an iterator instance.',
        severity: 'medium',
      },
    ],
    a: {
      v: '📺 ⏭️ → ch1 ch2 ch3...',
      t: 'The TV Remote',
      tx: "A TV remote lets you flip through channels one at a time by pressing Next. You do not need to know how the cable company organises their channel list — whether it's sorted by number, grouped by genre, or stored in a database. You just press Next and see what comes up. The remote (Iterator) maintains your current position in the schedule (collection). Two people with two remotes can flip through independently without interfering with each other's position. This is exactly what an Iterator does — it provides a `next()` interface to traverse any collection without knowing how it is stored internally.",
      s: "Traverse any collection with next() — internal structure stays private.",
    },
    te: {
      def: "Iterator is a behavioural pattern that provides a sequential access mechanism for the elements of a collection without exposing its underlying representation, enabling uniform traversal across different data structures.",
      types: [
        { n: 'External Iterator', d: 'The client controls iteration by calling next() explicitly. Provides flexibility (pause, skip, reverse). Standard in GoF and the JavaScript iteration protocol.' },
        { n: 'Internal Iterator', d: 'The collection controls iteration and calls a callback for each element. `Array.forEach(callback)` is an internal iterator — the client cannot pause or break without throwing.' },
        { n: 'Lazy Iterator / Generator', d: 'Computes the next element on demand rather than materialising the full collection. Essential for infinite sequences or large datasets (database cursors, network streams).' },
      ],
      when: "Use when you need standard sequential access to a collection without exposing its internals, or when you need multiple independent traversals, or when different collection types should be traversable via the same interface.",
      trade:
        'Pro: decouples traversal from collection structure, supports multiple simultaneous iterators, uniform interface across collection types. Con: less efficient than direct index access for random-access collections; stale iterators if the collection is modified.',
      code: `// Custom iterable — a Range of numbers
class Range {
  constructor(private start: number, private end: number) {}

  [Symbol.iterator](): Iterator<number> {
    let current = this.start;
    const end = this.end;
    return {
      next(): IteratorResult<number> {
        if (current <= end) {
          return { value: current++, done: false };
        }
        return { value: undefined as any, done: true };
      }
    };
  }
}

const range = new Range(1, 5);
for (const n of range) {
  console.log(n); // 1, 2, 3, 4, 5
}

// Works with spread and destructuring too
console.log([...new Range(1, 3)]); // [1, 2, 3]`,
      rw: {
        ex: [
          "JavaScript Symbol.iterator — Arrays, Maps, Sets, Strings, and NodeLists all implement the iteration protocol",
          "Database cursors — PostgreSQL and MongoDB cursors are server-side Iterators that stream rows without loading all into memory",
          "Pagination tokens — AWS SDK's paginate helpers return an async Iterator over pages of results",
          "Python generators — `yield` creates a lazy Iterator; used in Django's chunked_queryset for large dataset processing",
        ],
        cs: "MongoDB's cursor API is a production-scale Iterator. `db.collection.find({}).cursor()` returns a server-side cursor that fetches documents in batches — the driver implements the Iterator protocol on top. Processing 10M documents with a cursor uses kilobytes of memory vs gigabytes if you materialised the full result set. The AWS SDK v3 pagination helpers expose the same pattern: async iterators over API pages that fetch the next page only when the iterator is advanced.",
      },
    },
    interview: {
      q: "Why does JavaScript's for...of loop work on arrays, Maps, Sets, and custom objects?",
      a: "Because for...of calls [Symbol.iterator]() on any object it receives. If that method returns an iterator — an object with a next() method that returns `{ value, done }` — for...of can traverse it. This is the JavaScript Iterator protocol, and it is exactly the Iterator design pattern formalised into the language. Arrays, Maps, Sets, Strings, and NodeLists all implement [Symbol.iterator](). You can make any custom class iterable by implementing this method — the Range class example returns an iterator that yields numbers incrementally. Generators are syntactic sugar that produce iterator objects automatically via the `yield` keyword.",
      fu: [
        "How would you implement an async iterator for paginated API responses in TypeScript?",
        "What is the difference between an internal iterator (forEach) and an external iterator (for...of) in terms of control flow?",
        "How do generators in JavaScript/Python relate to the Iterator design pattern?",
      ],
    },
  },

  {
    id: 'template-method',
    cat: 'patterns',
    color: '#818cf8',
    icon: '📝',
    title: 'Template Method',
    tag: 'A recipe: same steps every time, but ingredients vary',
    overview:
      "Template Method defines the skeleton of an algorithm in a base class, deferring some steps to subclasses. The base class calls abstract methods that subclasses fill in — the invariant structure stays in one place while the variable parts are extension points. It's the pattern behind React's component lifecycle, JUnit test lifecycle, and Express route handlers.",
    components: [
      {
        name: 'AbstractClass',
        icon: '📝',
        role: 'Defines the template method and declares abstract steps.',
        detail:
          "Contains the template method — the final, non-overridable method that calls the algorithm's steps in order. Some steps have default implementations (hooks); others are declared abstract, forcing subclasses to implement them. The invariant algorithm skeleton lives here.",
      },
      {
        name: 'ConcreteClass',
        icon: '🔧',
        role: 'Implements the abstract steps for one specific variant.',
        detail:
          "Extends the AbstractClass and provides implementations for the abstract step methods. The ConcreteClass never overrides the template method itself — only the individual steps. Multiple ConcreteClasses can implement different variants of the same skeleton.",
      },
      {
        name: 'Invariant Steps',
        icon: '🔒',
        role: "The fixed parts of the algorithm that never change.",
        detail:
          "Steps implemented in the AbstractClass that are the same for all subclasses. They represent the invariant structure: parse the request, run the step, serialise the response. Subclasses only vary the specific business logic step, not the surrounding scaffolding.",
      },
    ],
    howItWorks:
      'The client instantiates a ConcreteClass and calls the template method (which is often simply `run()` or `execute()`). The template method runs the invariant steps in order, calling the abstract methods at the appropriate points. The ConcreteClass\'s implementation of those abstract methods provides the variable behaviour. The client never needs to know the algorithm skeleton — it just calls `run()` and gets the correct result for its variant.',
    decision: {
      choose: [
        "You have an algorithm with a fixed structure but variable steps — the common scaffolding should not be duplicated across subclasses",
        "You want to provide extension points in a framework without allowing subclasses to break the invariant structure",
        "Multiple classes share the same algorithm skeleton with only minor step-level differences — consolidate the skeleton in a base class",
      ],
      avoid: [
        "When the steps are not truly inseparable — if steps can vary independently, Strategy (composition) is more flexible",
        "Deep inheritance chains (3+ levels) — Template Method compounds the classic inheritance complexity",
        "When subclasses must override many abstract methods just to use one — the template is too fine-grained",
      ],
      vs: [
        { name: 'Strategy', when: "Strategy uses composition — inject the whole algorithm. Template Method uses inheritance — extend and fill in steps. Prefer Strategy when the steps are independent and you want runtime flexibility. Use Template Method when the steps are tightly coupled to the skeleton." },
        { name: 'Hook Method', when: "A Hook is an optional extension point in Template Method — a non-abstract method with a default (often empty) implementation that subclasses may override. It makes extension optional rather than mandatory." },
      ],
    },
    failures: [
      {
        name: 'Over-Abstract Template',
        cause: "The AbstractClass declares 10 abstract methods that every subclass must override even if 8 of them are irrelevant.",
        symptom: 'Subclasses are full of empty no-op method implementations; adding a new variant requires writing a lot of boilerplate.',
        fix: "Replace mandatory abstract methods with optional hooks (methods with default implementations). Only make steps abstract if every subclass genuinely needs to provide a different implementation.",
        severity: 'high',
      },
      {
        name: 'Deep Inheritance Chain',
        cause: "SubclassA extends AbstractA; SubclassB extends SubclassA; SubclassC extends SubclassB — three levels of template methods.",
        symptom: 'Tracing which `step3()` is actually called requires reading 4 files; a change in AbstractA breaks SubclassC in non-obvious ways.',
        fix: "Flatten the hierarchy. If you need 3+ levels of Template Method, consider refactoring to Strategy + composition instead.",
        severity: 'high',
      },
    ],
    a: {
      v: '📝 🍳 → 🍳🥘🍜',
      t: 'A Cooking Recipe',
      tx: "Every pasta recipe follows the same structure: boil water, cook the pasta, make the sauce, combine. The skeleton — the sequence of steps — is the Template Method. But the sauce step varies: carbonara uses eggs and guanciale, arrabbiata uses tomatoes and chilli, pesto uses basil and pine nuts. The recipe card (AbstractClass) defines the step order and marks 'make the sauce' as a variable step. Each specific recipe (ConcreteClass) fills in that step. You cannot change the order of steps — you always boil water before cooking pasta — but you can change what happens inside any variable step.",
      s: "Fixed algorithm skeleton in the base class, variable steps in subclasses.",
    },
    te: {
      def: "Template Method is a behavioural pattern that defines the skeleton of an algorithm in a base class, deferring some steps to subclasses via abstract methods, so the invariant structure stays in one place while variable steps are overridden in concrete subclasses.",
      types: [
        { n: 'Mandatory Template', d: "Abstract steps that subclasses must implement (abstract methods). Every ConcreteClass must provide an implementation — no default exists." },
        { n: 'Hook Template', d: "Optional extension points with default (often empty) implementations. Subclasses may override them to add behaviour without being forced to." },
        { n: 'Final Template Method', d: "The template method itself is marked `final` (or not overridable) to prevent subclasses from changing the invariant algorithm structure — only the individual steps can vary." },
      ],
      when: "Use when multiple classes share the same algorithm structure but differ in specific steps, when you want to eliminate code duplication of the shared skeleton, or when building a framework with defined extension points.",
      trade:
        "Pro: eliminates skeleton duplication, enforces a consistent algorithm structure, provides clear extension points. Con: inheritance coupling, hard to understand across deep hierarchies, over-abstract templates create empty-override boilerplate.",
      code: `abstract class DataProcessor {
  // Template method — final skeleton
  process(data: string[]): string[] {
    const parsed = this.parse(data);    // invariant
    const filtered = this.filter(parsed); // abstract
    const transformed = this.transform(filtered); // abstract
    return this.format(transformed);     // hook with default
  }

  private parse(data: string[]): number[] {
    return data.map(Number).filter(n => !isNaN(n));
  }

  protected abstract filter(data: number[]): number[];
  protected abstract transform(data: number[]): number[];

  // Hook — optional override
  protected format(data: number[]): string[] {
    return data.map(String);
  }
}

class PositiveEvenDoubler extends DataProcessor {
  protected filter(data: number[]): number[] {
    return data.filter(n => n > 0 && n % 2 === 0);
  }
  protected transform(data: number[]): number[] {
    return data.map(n => n * 2);
  }
}

const result = new PositiveEvenDoubler().process(['1','2','3','4','-1']);
console.log(result); // ['4', '8']`,
      rw: {
        ex: [
          "React class component lifecycle: render() is mandatory; componentDidMount / componentDidUpdate are hooks — all called by React's template method",
          "JUnit test lifecycle: setUp() → test() → tearDown() — the framework calls these in order; you implement the steps",
          "Express route handler pattern: req → middleware chain (invariant) → handler (variable) → response",
          "ORMs with Active Record: save() calls beforeSave() hook → validate() → persist() → afterSave() hook",
        ],
        cs: "JUnit 4's test lifecycle is a textbook Template Method. The framework (AbstractClass) defines the invariant skeleton: create test instance → call @Before methods → call @Test method → call @After methods → collect result. Developers only implement the @Test method (abstract step) and optionally @Before/@After (hooks). JUnit never exposes or allows overriding the outer skeleton — it is `final` by convention. This ensures test isolation and consistent lifecycle across all test classes.",
      },
    },
    interview: {
      q: "Template Method vs Strategy — both let you swap behaviour. What is the difference?",
      a: "Template Method uses inheritance: the base class defines the skeleton and calls abstract methods that subclasses must fill in. The variation is baked in at compile time when you choose which subclass to instantiate. Strategy uses composition: the client injects the algorithm (or a step of it) as an object at runtime, without any inheritance. Template Method is extends; Strategy is inject. The practical implication: Template Method is harder to test (you must subclass to test different variants), harder to change at runtime (no dynamic switching), and leads to inheritance coupling. Prefer Strategy (composition over inheritance) unless the steps are genuinely inseparable from the skeleton — for example, if the invariant steps share private state with the variable steps, Template Method may be more natural.",
      fu: [
        "How would you refactor a 5-level deep Template Method hierarchy to use Strategy instead?",
        "What is the difference between an abstract method and a hook method in Template Method?",
        "How does React's class component lifecycle use the Template Method pattern?",
      ],
    },
  },
];

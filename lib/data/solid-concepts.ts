import { Concept } from '../types';

export const SOLID_CONCEPTS: Concept[] = [
  // ─── SINGLE RESPONSIBILITY PRINCIPLE ─────────────────────────────────────────
  {
    id: 'solid-srp',
    cat: 'solid',
    color: '#34d399',
    icon: '🎯',
    title: 'Single Responsibility Principle',
    tag: 'A class should have only one reason to change — one job, one owner',
    overview:
      'The Single Responsibility Principle (SRP) states that a class should have exactly one reason to change. "Reason to change" is not about the number of methods — it is about the stakeholder or actor who would request that change. If both the finance team and the HR team could demand modifications to the same class, that class has two reasons to change and violates SRP. SRP prevents class bloat: a class that handles data access, business logic, email sending, and audit logging becomes impossible to test in isolation, changes ripple unexpectedly across features, and ownership becomes unclear. The fix is cohesion — grouping things that change together and separating things that change for different reasons.',
    components: [
      {
        name: 'Cohesion',
        icon: '🧲',
        role: 'Group things that belong together.',
        detail:
          'High cohesion means every method in a class serves the same single purpose. If you struggle to write a one-sentence description of what the class does without using the word "and", cohesion is low and SRP is likely violated.',
      },
      {
        name: 'Separation of Concerns',
        icon: '🗂️',
        role: 'Keep distinct responsibilities in distinct modules.',
        detail:
          'Each cross-cutting concern — persistence, authentication, notification, logging — should live in its own dedicated class. This makes each concern independently testable, replaceable, and understandable.',
      },
      {
        name: 'Module Boundaries',
        icon: '🏗️',
        role: 'Define clear ownership boundaries between modules.',
        detail:
          'SRP applies at every level: method, class, module, and service. A NestJS module that owns too many controllers and services is violating SRP at the module level. Clear boundaries mean a change in one area never cascades into another.',
      },
      {
        name: 'Service Layer',
        icon: '⚙️',
        role: 'Delegate specialised behaviour to focused services.',
        detail:
          'Rather than implementing every concern inside one service, delegate to specialised collaborators. An OrderService should call PaymentService, InventoryService, and EmailService — it should not contain their logic.',
      },
    ],
    a: {
      v: 'Swiss Army Knife vs Scalpel',
      t: 'One tool, one job',
      tx: 'A Swiss Army knife can do many things but does none of them perfectly and is hard to maintain. A surgeon uses a dedicated scalpel — one tool, one job, sharp and reliable. SRP pushes every class toward being a scalpel.',
      s: 'Each class should be like a specialist surgeon: called in for exactly one type of problem, expert at it, and done.',
    },
    te: {
      def: 'A class should have one, and only one, reason to change — meaning it is responsible to exactly one actor or stakeholder.',
      types: [
        {
          n: 'Actor-level SRP',
          d: 'Identify which stakeholder (finance, HR, operations) owns each piece of behaviour. Each actor maps to a separate class or module.',
        },
        {
          n: 'Method-level SRP',
          d: 'Methods should do one thing. A method named "processAndSaveAndNotify" is doing three things and should be split.',
        },
        {
          n: 'Module-level SRP',
          d: 'NestJS modules should encapsulate one bounded context. A "UserModule" that also handles billing and analytics has too many responsibilities.',
        },
      ],
      when: 'Apply SRP whenever a class has more than one actor requesting changes, when a class exceeds ~200 lines, when tests require complex setup mocking many unrelated dependencies, or when two different features must change the same file.',
      trade:
        'SRP increases the number of classes and files. This can feel like over-engineering on small projects. The trade-off is worth it when the codebase grows: more files with clear names beats fewer files with tangled responsibilities. Each additional class is a small navigation cost that pays for itself many times over in maintainability.',
      code: `// ─── BEFORE: SRP Violation ─────────────────────────────────────────
// UserService handles FIVE distinct responsibilities — five reasons to change
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private mailer: NodeMailer,
    private jwt: JwtService,
    private logger: Logger,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    // 1. Password hashing (security team owns this)
    const hash = await bcrypt.hash(dto.password, 12);

    // 2. Persistence (DB team owns this)
    const user = this.userRepo.create({ ...dto, password: hash });
    await this.userRepo.save(user);

    // 3. Email sending (marketing team owns this)
    await this.mailer.sendMail({
      to: user.email,
      subject: 'Welcome!',
      text: 'Thanks for signing up.',
    });

    // 4. JWT generation (auth team owns this)
    const token = this.jwt.sign({ sub: user.id });
    user['token'] = token;

    // 5. Audit logging (compliance team owns this)
    this.logger.log('audit', { event: 'USER_CREATED', userId: user.id });

    return user;
  }
}

// ─── AFTER: SRP Applied ─────────────────────────────────────────────
// Each class has exactly one reason to change

@Injectable()
export class UserRepository {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}
  async save(user: Partial<User>): Promise<User> {
    return this.repo.save(this.repo.create(user));
  }
  async findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }
}

@Injectable()
export class PasswordService {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 12);
  }
  async verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}

@Injectable()
export class EmailService {
  constructor(private mailer: MailerService) {}
  async sendWelcome(to: string): Promise<void> {
    await this.mailer.sendMail({ to, subject: 'Welcome!', text: 'Thanks for signing up.' });
  }
}

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}
  signToken(userId: string): string {
    return this.jwt.sign({ sub: userId });
  }
}

@Injectable()
export class AuditService {
  constructor(private logger: Logger) {}
  log(event: string, meta: Record<string, unknown>): void {
    this.logger.log('audit', { event, ...meta });
  }
}

// UserService is now a thin orchestrator — its only reason to change
// is the user-creation business flow itself
@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private passwordService: PasswordService,
    private emailService: EmailService,
    private authService: AuthService,
    private auditService: AuditService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<{ user: User; token: string }> {
    const password = await this.passwordService.hash(dto.password);
    const user = await this.userRepo.save({ ...dto, password });
    await this.emailService.sendWelcome(user.email);
    const token = this.authService.signToken(user.id);
    this.auditService.log('USER_CREATED', { userId: user.id });
    return { user, token };
  }
}`,
      rw: {
        ex: [
          'NestJS separates AuthModule, UserModule, MailModule — each with a single focused service',
          'React splits data-fetching hooks from presentational components',
          'Unix philosophy: each command does one thing well (grep, sed, awk)',
          'AWS Lambda functions are encouraged to do one thing per function',
        ],
        cs: 'A payments startup had a MonolithicOrderService with 1,200 lines handling inventory, payments, emails, and analytics. A single analytics change broke the payment flow because both lived in the same class. After SRP refactoring into four focused services, bug isolation dropped from hours to minutes and test coverage jumped from 20% to 85%.',
      },
    },
    interview: {
      q: 'How do you identify an SRP violation?',
      a: 'I look for three signals: (1) a class that is hard to name without using "and" — UserAndEmailService is a red flag; (2) a class whose tests require mocking many unrelated dependencies — if I need a mailer mock to test user creation validation, something is wrong; (3) a class that multiple different teams or feature requests touch frequently. When I find one, I map each method to its actor — who would request this change? — and group by actor into separate classes.',
      fu: [
        'Does SRP mean one method per class?',
        'How does SRP relate to cohesion and coupling?',
        'Can SRP be applied at the module level in NestJS?',
        'How do you avoid creating too many tiny classes when applying SRP?',
      ],
    },
  },

  // ─── OPEN/CLOSED PRINCIPLE ────────────────────────────────────────────────────
  {
    id: 'solid-ocp',
    cat: 'solid',
    color: '#34d399',
    icon: '🔓',
    title: 'Open/Closed Principle',
    tag: 'Open for extension, closed for modification — add behavior without changing existing code',
    overview:
      'The Open/Closed Principle (OCP), coined by Bertrand Meyer and popularised by Robert Martin, states that a software entity should be open for extension but closed for modification. In practice this means you should be able to add new behaviour without editing existing, tested code. OCP is motivated by the risk of regression: every time you modify a working class to add a new feature, you risk breaking existing behaviour. The solution is to design extension points — abstractions, interfaces, strategy patterns — so new behaviour is added by writing new code, not changing old code. OCP is closely connected to the Strategy pattern (swap algorithms via injection) and the Template Method pattern (define an algorithm skeleton, subclasses fill in steps).',
    components: [
      {
        name: 'Strategy Pattern',
        icon: '♟️',
        role: 'Encapsulate interchangeable algorithms behind an interface.',
        detail:
          'Define an interface for a behaviour (e.g. IPaymentProvider). Each concrete implementation (Stripe, PayPal) is a separate class. The host class depends on the interface, not any concrete type — adding a new provider means a new class, zero edits to the host.',
      },
      {
        name: 'Plugin Architecture',
        icon: '🔌',
        role: 'Allow new functionality to be added as independent modules.',
        detail:
          'Systems like NestJS modules, browser extensions, and VS Code plugins are OCP in action. The core system defines extension points (module registration, command palette API) and never changes when plugins are added.',
      },
      {
        name: 'Abstract Base',
        icon: '🏛️',
        role: 'Provide a stable contract that new types can implement.',
        detail:
          'Abstract classes or interfaces act as the closed part. They define what a type must do. New types implement the contract and slot into the system without modifying the consumer.',
      },
      {
        name: 'Decorators',
        icon: '🎀',
        role: 'Wrap existing behaviour to add new concerns without modification.',
        detail:
          'TypeScript/NestJS decorators and the classic Decorator pattern both let you add cross-cutting behaviour (logging, caching, retries) around existing code without editing the original class.',
      },
    ],
    a: {
      v: 'Power Strip vs Hard-Wired Outlet',
      t: 'Add without rewiring',
      tx: 'A hard-wired outlet is closed for extension — adding a new device means calling an electrician. A power strip is open for extension — plug in any device without touching the wiring. OCP designs your code like a power strip.',
      s: 'Write code that new features can plug into without a rewire.',
    },
    te: {
      def: 'Software entities (classes, modules, functions) should be open for extension but closed for modification — new behaviour is added by writing new code, not by editing existing, tested code.',
      types: [
        {
          n: 'Interface-based OCP',
          d: 'Define an interface; new types implement it. The consumer never changes when new types are added.',
        },
        {
          n: 'Inheritance-based OCP',
          d: 'A base class defines the algorithm skeleton. Subclasses override hook methods to specialise behaviour. Used in Template Method pattern.',
        },
        {
          n: 'Configuration-based OCP',
          d: 'Behaviour is controlled by data or config rather than code branches. Adding a new case means adding a new config entry, not a new if-else.',
        },
      ],
      when: 'Apply OCP when a class has a switch or if/else block that grows every time a new type is added, when adding a new feature routinely requires editing a core class, or when you are building a library or SDK that others will extend.',
      trade:
        'OCP requires upfront abstraction. Designing the right extension point before you know all the future cases is hard — this is where YAGNI (You Ain\'t Gonna Need It) creates tension. The pragmatic approach is to wait until you see the second or third similar case before extracting an abstraction. Premature OCP adds complexity without benefit.',
      code: `// ─── BEFORE: OCP Violation ──────────────────────────────────────────
// Every new payment provider requires editing PaymentService
@Injectable()
export class PaymentService {
  async charge(amount: number, provider: string): Promise<void> {
    if (provider === 'stripe') {
      // Stripe-specific logic...
      await stripeClient.charges.create({ amount });
    } else if (provider === 'paypal') {
      // PayPal-specific logic...
      await paypalClient.payment.create({ amount });
    } else if (provider === 'crypto') {
      // Crypto-specific logic...
      await cryptoGateway.send({ amount });
    }
    // Adding 'apple_pay' means editing this file — regression risk!
  }
}

// ─── AFTER: OCP Applied ─────────────────────────────────────────────
// Adding a new provider = new class, zero changes to PaymentService

// 1. Define the abstraction (the 'closed' contract)
export interface IPaymentProvider {
  charge(amount: number): Promise<{ transactionId: string }>;
  refund(transactionId: string): Promise<void>;
}

// 2. Concrete implementations (each 'open' for its own extension)
@Injectable()
export class StripeProvider implements IPaymentProvider {
  async charge(amount: number) {
    const charge = await stripeClient.charges.create({ amount, currency: 'usd' });
    return { transactionId: charge.id };
  }
  async refund(transactionId: string) {
    await stripeClient.refunds.create({ charge: transactionId });
  }
}

@Injectable()
export class PaypalProvider implements IPaymentProvider {
  async charge(amount: number) {
    const payment = await paypalClient.payment.create({ amount });
    return { transactionId: payment.id };
  }
  async refund(transactionId: string) {
    await paypalClient.payment.refund(transactionId);
  }
}

// Adding Apple Pay = new class, nothing else changes:
@Injectable()
export class ApplePayProvider implements IPaymentProvider {
  async charge(amount: number) { /* ... */ return { transactionId: 'ap_...' }; }
  async refund(transactionId: string) { /* ... */ }
}

// 3. PaymentService depends on the abstraction — never changes
export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_PROVIDER) private provider: IPaymentProvider,
  ) {}

  async charge(amount: number) {
    return this.provider.charge(amount);
  }
  async refund(transactionId: string) {
    return this.provider.refund(transactionId);
  }
}

// 4. Module wiring — swap provider via config, no code changes
@Module({
  providers: [
    PaymentService,
    { provide: PAYMENT_PROVIDER, useClass: StripeProvider },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}`,
      rw: {
        ex: [
          'NestJS Guards, Interceptors, and Pipes are OCP — add new guards without changing the framework',
          'Express/Koa middleware chain: add new middleware without editing existing handlers',
          'VS Code extensions: add language support without modifying the editor core',
          'Webpack loaders: add new file-type processing without changing the build pipeline',
        ],
        cs: 'An e-commerce platform had a PaymentService with 12 payment provider branches. Every new partnership required a risky edit to a critical class, causing regressions. Refactoring to an IPaymentProvider interface reduced payment-related bugs by 80% and new provider onboarding from 2 days to 4 hours.',
      },
    },
    interview: {
      q: 'How does NestJS\'s guard/interceptor system follow OCP?',
      a: 'NestJS is built around OCP at its core. The framework defines the CanActivate interface for guards and NestInterceptor for interceptors. These are the closed contracts. When I need new authentication logic — JWT check, role check, rate limiting — I create a new class implementing CanActivate without touching the framework or other guards. The NestJS pipeline discovers and executes guards in order. This is textbook OCP: the extension point (the interface) is stable, and new behaviour is added by writing new implementations.',
      fu: [
        'When does OCP conflict with YAGNI?',
        'How do you decide when to introduce an abstraction for OCP?',
        'What is the relationship between OCP and the Strategy pattern?',
        'Can over-applying OCP make code harder to understand?',
      ],
    },
  },

  // ─── LISKOV SUBSTITUTION PRINCIPLE ───────────────────────────────────────────
  {
    id: 'solid-lsp',
    cat: 'solid',
    color: '#34d399',
    icon: '🔄',
    title: 'Liskov Substitution Principle',
    tag: 'Subtypes must be substitutable for their base types — no surprise behavior',
    overview:
      'The Liskov Substitution Principle (LSP), defined by Barbara Liskov in 1987, states that if S is a subtype of T, then objects of type T may be replaced with objects of type S without altering any of the desirable properties of the program. In plain terms: anywhere you use a base type, you should be able to swap in a subtype and the code should still work correctly — no surprises, no exceptions, no silent behavioural changes. LSP is violated when a subclass overrides a method to throw an error ("not supported"), weakens postconditions (returns less than the contract promises), or strengthens preconditions (requires more than the base type). LSP is the foundation of reliable polymorphism: if you cannot trust that subtypes honour the contract, you cannot use them interchangeably.',
    components: [
      {
        name: 'Preconditions (cannot strengthen)',
        icon: '🚦',
        role: 'A subtype must accept at least what the base type accepts.',
        detail:
          'If the base type\'s method accepts any positive integer, a subtype cannot restrict it to only accept integers over 100. Callers should not need to know which subtype they are working with — strengthening preconditions forces them to do extra validation.',
      },
      {
        name: 'Postconditions (cannot weaken)',
        icon: '✅',
        role: 'A subtype must deliver at least what the base type promises.',
        detail:
          'If the base type\'s method promises to return a non-null User, the subtype cannot return null or a partial object. Weakening postconditions breaks caller code that relies on the guarantee.',
      },
      {
        name: 'Invariants',
        icon: '⚖️',
        role: 'Conditions that must always be true must be preserved by subtypes.',
        detail:
          'A collection class might have the invariant that size is never negative. Every subclass must maintain this invariant — overriding a method in a way that can make size negative violates LSP.',
      },
      {
        name: 'Covariance/Contravariance',
        icon: '↕️',
        role: 'Return types may be covariant; parameter types may be contravariant.',
        detail:
          'A subtype can return a more specific type (covariant return) but must accept a more general parameter type (contravariant input). TypeScript enforces this partially via strict mode. Violating these rules breaks safe substitution.',
      },
    ],
    a: {
      v: 'Electrical Outlet Standard',
      t: 'Any conforming plug works in any conforming socket',
      tx: 'Every country with a standard outlet guarantees: any conforming plug will work in any conforming socket — same voltage, same shape, same behaviour. If a socket manufacturer changed the voltage "just a little", every device plugged into it would break. LSP is that standard for your class hierarchy.',
      s: 'Any object claiming to be a "UserRepository" must behave exactly like one — no surprises, no thrown errors, no silent differences.',
    },
    te: {
      def: 'If S is a subtype of T, then objects of type T may be replaced with objects of type S without altering the correctness of the program. Subtypes must honour the full contract of the base type.',
      types: [
        {
          n: 'Behavioural Subtyping',
          d: 'Subtypes must preserve observable behaviour, not just type signatures. A subtype that throws where the base returns silently is a behavioural violation even if it compiles.',
        },
        {
          n: 'Design-by-Contract',
          d: 'Pre/postconditions and invariants form a formal contract. LSP says subtypes can only loosen preconditions (accept more) and tighten postconditions (deliver more).',
        },
        {
          n: 'Classic Square/Rectangle Problem',
          d: 'A Square that extends Rectangle seems logical mathematically, but violates LSP: setting width on a Square also changes height, which a caller working with a Rectangle does not expect.',
        },
      ],
      when: 'Check for LSP violations when a subclass overrides a method to throw an exception, when you see "if instanceof" checks in calling code, when a subclass ignores or no-ops a parent method, or when adding a subtype breaks existing tests.',
      trade:
        'Strict LSP compliance can constrain your inheritance hierarchy — sometimes the natural is-a relationship in the domain does not map to a safe substitution relationship in code. The pragmatic solution is to prefer composition over inheritance and use interfaces that model capability rather than identity. "ReadableRepository is-a Repository" may be wrong if the base Repository is writable.',
      code: `// ─── LSP VIOLATION ──────────────────────────────────────────────────
// ReadOnlyUserRepository extends UserRepository but throws on save —
// callers that depend on UserRepository will break unexpectedly

@Injectable()
export class UserRepository {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  async save(user: Partial<User>): Promise<User> {
    return this.repo.save(this.repo.create(user));
  }
}

// VIOLATION: subtype throws where base type would succeed
@Injectable()
export class ReadOnlyUserRepository extends UserRepository {
  async save(_user: Partial<User>): Promise<User> {
    throw new Error('ReadOnlyUserRepository does not support writes');
    // Any caller using UserRepository now has a runtime bomb
  }
}

// ─── LSP FIX: Composition over inheritance ───────────────────────────
// Split the interface — ReadOnly only implements what it can honour

export interface IReadableUserRepository {
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}

export interface IWritableUserRepository extends IReadableUserRepository {
  save(user: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}

@Injectable()
export class UserRepository implements IWritableUserRepository {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}
  async findById(id: string) { return this.repo.findOneBy({ id }); }
  async findAll() { return this.repo.find(); }
  async save(user: Partial<User>) { return this.repo.save(this.repo.create(user)); }
  async delete(id: string) { await this.repo.delete(id); }
}

// ReadOnlyUserRepository only promises what it can deliver — LSP satisfied
@Injectable()
export class ReadOnlyUserRepository implements IReadableUserRepository {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}
  async findById(id: string) { return this.repo.findOneBy({ id }); }
  async findAll() { return this.repo.find(); }
  // No save or delete — the interface does not promise them
}

// ─── PROPER LSP EXAMPLE: Extending without breaking the contract ─────
// AdminUserService overrides delete to add audit logging
// but fully honours the UserService contract — callers are safe

@Injectable()
export class UserService {
  constructor(private repo: IWritableUserRepository) {}

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}

@Injectable()
export class AdminUserService extends UserService {
  constructor(
    repo: IWritableUserRepository,
    private audit: AuditService,
  ) {
    super(repo);
  }

  // Overrides delete — same contract, extended behaviour (audit logging)
  // Callers using UserService can safely use AdminUserService
  async delete(id: string): Promise<void> {
    await this.audit.log('USER_DELETED', { userId: id });
    await super.delete(id); // honours the original postcondition
  }
}`,
      rw: {
        ex: [
          'TypeScript readonly arrays: ReadonlyArray does not extend Array because push/pop would violate LSP',
          'Java Collections: AbstractList enforces LSP-compliant contracts for all List implementations',
          'NestJS Exception Filters: any HttpException subtype can substitute HttpException in filters',
          'React: any component honouring the same props interface is safely substitutable in JSX',
        ],
        cs: 'A data pipeline team had a CachedRepository that extended their base Repository but returned stale data for a method the base type guaranteed was always fresh. Downstream code using the base type began returning incorrect reports. Diagnosing the bug took two days. Separating the ICachedRepository interface made the different contract explicit and the bug class was eliminated.',
      },
    },
    interview: {
      q: 'How do you detect an LSP violation?',
      a: 'The clearest signals are: (1) a subclass method that throws NotImplementedException or similar — if the subclass cannot honour the method contract, it should not inherit it; (2) "if instanceof SubClass" checks in calling code — callers should not need to know which concrete type they have; (3) a subclass that silently ignores or no-ops an inherited method. In code review I ask: "If I swap this subtype for the parent type in a test, do all assertions still pass?" If not, LSP is violated.',
      fu: [
        'What is the classic rectangle/square LSP problem?',
        'How does LSP relate to interface design?',
        'When should you prefer composition over inheritance to satisfy LSP?',
        'How does TypeScript\'s structural typing interact with LSP?',
      ],
    },
  },

  // ─── INTERFACE SEGREGATION PRINCIPLE ─────────────────────────────────────────
  {
    id: 'solid-isp',
    cat: 'solid',
    color: '#34d399',
    icon: '✂️',
    title: 'Interface Segregation Principle',
    tag: 'No client should depend on methods it doesn\'t use — split fat interfaces',
    overview:
      'The Interface Segregation Principle (ISP) states that clients should not be forced to depend on interfaces they do not use. A fat interface — one with many methods covering many concerns — forces every implementor and every consumer to know about methods they may not need. This creates unnecessary coupling: a change to the CSV export method in a giant IUserService interface forces a recompile of the controller that only reads users. ISP says to split fat interfaces into focused, role-based interfaces. TypeScript makes this particularly elegant: you can compose multiple small interfaces with intersection types, and classes can implement multiple focused interfaces. ISP complements SRP — SRP is about classes having one reason to change, ISP is about interfaces being narrow enough that consumers depend only on what they use.',
    components: [
      {
        name: 'Interface Splitting',
        icon: '✂️',
        role: 'Break fat interfaces into focused capability interfaces.',
        detail:
          'Identify distinct client roles (reader, writer, admin, exporter) and define one interface per role. Each client depends only on its role interface, decoupling it from all other roles.',
      },
      {
        name: 'Role Interfaces',
        icon: '🎭',
        role: 'Name interfaces after what clients do, not what objects are.',
        detail:
          '"IUserReader" is better than "IUserServiceForControllers". Role interfaces describe a capability. They are stable: adding a new capability adds a new interface without changing existing ones.',
      },
      {
        name: 'Mixin Interfaces',
        icon: '🧩',
        role: 'Compose multiple small interfaces for implementations that cover multiple roles.',
        detail:
          'A full UserService can implement IUserReader, IUserWriter, and IUserAdmin simultaneously using TypeScript intersection. Consumers inject only the role they need; the full implementation satisfies all roles.',
      },
      {
        name: 'Optional Methods Problem',
        icon: '❓',
        role: 'Avoid optional methods in interfaces — they signal a fat interface.',
        detail:
          'An interface with optional methods (sendEmail?: () => void) is a fat interface trying to look small. Consumers that check "if (service.sendEmail)" are coupling to knowledge they should not have. Split instead.',
      },
    ],
    a: {
      v: 'Restaurant Menu vs Prix Fixe',
      t: 'Order only what you want',
      tx: 'A prix fixe (fixed price) menu forces every diner to pay for every course whether they want it or not. A la carte menus let diners pick exactly what they want. ISP makes your interfaces a la carte — consumers depend only on the methods they actually order.',
      s: 'Give each client a menu with only what it needs. Nobody should pay for courses they do not eat.',
    },
    te: {
      def: 'Clients should not be forced to depend on interfaces they do not use. Split fat interfaces into smaller, focused interfaces so each client only depends on the methods it actually calls.',
      types: [
        {
          n: 'Role Interface',
          d: 'Define one interface per client role. IUserReader for controllers that only query. IUserWriter for command handlers that only mutate.',
        },
        {
          n: 'Header Interface',
          d: 'The anti-pattern: one interface per class listing all its public methods. This is a fat interface and usually violates ISP.',
        },
        {
          n: 'Composed Interface',
          d: 'TypeScript allows "type IFullUserService = IUserReader & IUserWriter & IUserAdmin". Implementations satisfy all three; consumers depend on just one.',
        },
      ],
      when: 'Apply ISP when a class implementing an interface leaves many methods empty or throwing, when mocking an interface in tests requires stubbing many irrelevant methods, when a change in one method of an interface forces recompilation of unrelated consumers, or when your interface has grown to 8+ methods.',
      trade:
        'ISP increases the number of interfaces in the codebase. In TypeScript this is low-cost since interfaces have no runtime footprint. The bigger risk is over-segregating — an interface with one or two methods per interface creates navigational complexity. The right granularity is role-based: one interface per distinct consumer role, not one interface per method.',
      code: `// ─── BEFORE: ISP Violation — Fat Interface ──────────────────────────
// Every consumer of IUserService depends on ALL methods
// even if it only calls one or two

export interface IUserService {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  create(dto: CreateUserDto): Promise<User>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
  block(id: string): Promise<void>;
  unblock(id: string): Promise<void>;
  resetPassword(id: string): Promise<void>;
  exportToCsv(): Promise<string>;
  sendWelcomeEmail(id: string): Promise<void>;
  // A change to exportToCsv forces recompile of UserController
  // even though UserController never calls exportToCsv
}

// ─── AFTER: ISP Applied — Focused Role Interfaces ────────────────────

// Each interface serves exactly one client role
export interface IUserReader {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
}

export interface IUserWriter {
  create(dto: CreateUserDto): Promise<User>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}

export interface IUserAdmin {
  block(id: string): Promise<void>;
  unblock(id: string): Promise<void>;
  resetPassword(id: string): Promise<void>;
}

export interface IUserExporter {
  exportToCsv(): Promise<string>;
}

export interface IUserNotifier {
  sendWelcomeEmail(id: string): Promise<void>;
}

// Full implementation satisfies all role interfaces
@Injectable()
export class UserService
  implements IUserReader, IUserWriter, IUserAdmin, IUserExporter, IUserNotifier
{
  async findAll() { /* ... */ return []; }
  async findById(id: string) { /* ... */ return null; }
  async create(dto: CreateUserDto) { /* ... */ return {} as User; }
  async update(id: string, dto: UpdateUserDto) { /* ... */ return {} as User; }
  async delete(id: string) { /* ... */ }
  async block(id: string) { /* ... */ }
  async unblock(id: string) { /* ... */ }
  async resetPassword(id: string) { /* ... */ }
  async exportToCsv() { return 'csv data'; }
  async sendWelcomeEmail(id: string) { /* ... */ }
}

// Each controller injects only the interface it needs
@Controller('users')
export class UserController {
  // Depends only on IUserReader — knows nothing about admin or export
  constructor(private readonly users: IUserReader) {}

  @Get()
  findAll() { return this.users.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.users.findById(id); }
}

@Controller('admin/users')
export class AdminUserController {
  // Depends only on IUserAdmin
  constructor(private readonly admin: IUserAdmin) {}

  @Post(':id/block')
  block(@Param('id') id: string) { return this.admin.block(id); }

  @Post(':id/reset-password')
  reset(@Param('id') id: string) { return this.admin.resetPassword(id); }
}

// Module wiring — one implementation, multiple interface tokens
@Module({
  providers: [
    UserService,
    { provide: 'IUserReader', useExisting: UserService },
    { provide: 'IUserWriter', useExisting: UserService },
    { provide: 'IUserAdmin', useExisting: UserService },
  ],
  controllers: [UserController, AdminUserController],
})
export class UserModule {}`,
      rw: {
        ex: [
          'Java Iterator/Iterable split from Collection — you can iterate without needing add/remove',
          'TypeScript\'s lib.dom.d.ts splits EventTarget from Node from Element — each with only relevant methods',
          'React\'s useState/useEffect/useContext are segregated hooks — import only what you need',
          'gRPC service definitions naturally apply ISP — each RPC method is an explicit contract',
        ],
        cs: 'A logistics platform had a 22-method IShipmentService. Every microservice that consumed it had to stub 20 irrelevant methods in tests. Test setup took longer than the assertions. After ISP refactoring into IShipmentTracker, IShipmentCreator, and IShipmentPricer, test setup dropped from 80 lines to 10 per test and mock drift bugs disappeared entirely.',
      },
    },
    interview: {
      q: 'How does ISP relate to the Interface Adapter in Clean Architecture?',
      a: 'Clean Architecture\'s Interface Adapter layer is ISP in architectural form. The use case layer defines the interfaces it needs — narrow, purpose-specific contracts like IOrderRepository or IEmailGateway. The infrastructure layer implements them. The use case never sees the full implementation with its database internals or HTTP client details. Each use case depends on exactly the interface it needs, nothing more. This is ISP applied at the architectural boundary: adapters translate between the fat external world and the lean interfaces the application core depends on.',
      fu: [
        'When is it OK to have a large interface?',
        'How do you handle interface segregation in a REST API client?',
        'How does ISP relate to module federation and micro-frontends?',
        'What is the difference between ISP and SRP?',
      ],
    },
  },

  // ─── DEPENDENCY INVERSION PRINCIPLE ──────────────────────────────────────────
  {
    id: 'solid-dip',
    cat: 'solid',
    color: '#34d399',
    icon: '🔀',
    title: 'Dependency Inversion Principle',
    tag: 'Depend on abstractions, not concretions — high-level modules shouldn\'t know about low-level details',
    overview:
      'The Dependency Inversion Principle (DIP) has two rules: (1) high-level modules should not depend on low-level modules — both should depend on abstractions; (2) abstractions should not depend on details — details should depend on abstractions. In concrete terms: your business logic (OrderService) should not directly import or instantiate infrastructure (SendGridEmailService, PostgresRepository). Instead, both should depend on an interface (IEmailService, IOrderRepository). DIP enables testability — swap real implementations for mocks in tests without changing business logic. It enables flexibility — swap SendGrid for Mailgun by changing one module registration. NestJS\'s DI container is a first-class implementation of DIP: injection tokens are the abstractions, providers are the details, and the container wires them together.',
    components: [
      {
        name: 'Injection Tokens',
        icon: '🏷️',
        role: 'Stable abstract identifiers that consumers depend on.',
        detail:
          'A NestJS injection token (a string, Symbol, or abstract class) is the abstraction. Consumers inject via @Inject(TOKEN) and never reference the concrete class. Swapping the implementation means changing one "provide" entry in the module.',
      },
      {
        name: 'Abstract Classes as Tokens',
        icon: '🏛️',
        role: 'Use abstract classes to co-locate the token and the interface.',
        detail:
          'In NestJS, an abstract class serves as both an injection token and a TypeScript interface. Consumers type their dependency as AbstractEmailService. Implementations extend the abstract class. No separate Symbol needed.',
      },
      {
        name: 'NestJS DI Container',
        icon: '🏗️',
        role: 'Resolves the dependency graph and injects the right implementation.',
        detail:
          'The NestJS container reads @Module providers, resolves the dependency graph, instantiates classes in the right order, and injects them into constructors. This is the mechanism that makes DIP practical at scale.',
      },
      {
        name: 'Factory Providers',
        icon: '🏭',
        role: 'Use useFactory for dynamic provider creation based on config or environment.',
        detail:
          'useFactory allows the container to create a provider dynamically — e.g. inject different email clients based on NODE_ENV. The consumer still depends on the abstract token; the factory handles the conditional logic.',
      },
      {
        name: 'Testing with Mocks',
        icon: '🧪',
        role: 'Swap real implementations for test doubles in module setup.',
        detail:
          'DIP makes unit testing trivial. Replace "useClass: SendGridEmailService" with "useValue: mockEmailService" in the test module. Business logic is tested in isolation without network calls or side effects.',
      },
    ],
    a: {
      v: 'Power Plug Standard',
      t: 'Your laptop does not know who makes the power station',
      tx: 'Your laptop charges via a standard plug interface. It does not know or care whether the power comes from a coal plant, solar panels, or a battery pack. You can swap the power source without touching your laptop. DIP designs code the same way: business logic plugs into an abstract socket; the infrastructure behind it can be swapped freely.',
      s: 'Business logic should plug into a standard socket. It should never know — or care — what is on the other end.',
    },
    te: {
      def: 'High-level modules should not depend on low-level modules; both should depend on abstractions. Abstractions should not depend on details; details should depend on abstractions.',
      types: [
        {
          n: 'Constructor Injection',
          d: 'Dependencies are declared in the constructor and provided by the container. The most explicit and testable form — all dependencies are visible at construction time.',
        },
        {
          n: 'Interface-based Injection',
          d: 'Consumers type their dependency as an interface or abstract class. The container resolves to the concrete implementation at runtime.',
        },
        {
          n: 'Factory Provider',
          d: 'useFactory in NestJS creates instances dynamically, enabling environment-based or config-driven implementation selection.',
        },
      ],
      when: 'Apply DIP whenever business logic imports a concrete infrastructure class directly (new X(), import from concrete file), when adding a test requires a real database or email server, when swapping a third-party dependency (e.g. Stripe to Braintree) requires editing business logic files, or when you want to run the same code against different backends.',
      trade:
        'DIP adds indirection. Tracing a dependency from token to implementation requires understanding the module configuration, which can confuse newcomers. The trade-off is worth it for any code that needs to be tested in isolation or may swap implementations. For truly stable, simple dependencies (a logger, a config object), DIP may be overkill — inject the concrete type and move on.',
      code: `// ─── WITHOUT DIP: Tight coupling kills testability ──────────────────
@Injectable()
export class OrderService {
  // Direct instantiation — cannot swap for tests, cannot change provider
  private emailService = new SendGridEmailService();

  async placeOrder(dto: CreateOrderDto): Promise<Order> {
    const order = await this.saveOrder(dto);
    // Test requires a real SendGrid API key — brittle!
    await this.emailService.sendOrderConfirmation(order);
    return order;
  }
}

// ─── WITH DIP: Full NestJS example ───────────────────────────────────

// 1. Define the abstraction (what high-level code depends on)
export interface IEmailService {
  sendOrderConfirmation(order: Order): Promise<void>;
  sendWelcomeEmail(email: string): Promise<void>;
}

// 2. Define the injection token (the abstract identifier)
export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');

// 3. High-level module depends only on the abstraction
@Injectable()
export class OrderService {
  constructor(
    @Inject(EMAIL_SERVICE) private emailService: IEmailService,
    private orderRepo: OrderRepository,
  ) {}

  async placeOrder(dto: CreateOrderDto): Promise<Order> {
    const order = await this.orderRepo.save(dto);
    await this.emailService.sendOrderConfirmation(order);
    return order;
  }
}

// 4. Low-level detail (depends on the abstraction, not the other way)
@Injectable()
export class SendGridEmailService implements IEmailService {
  constructor(private readonly config: ConfigService) {}

  async sendOrderConfirmation(order: Order): Promise<void> {
    // SendGrid-specific implementation
    await sgMail.send({
      to: order.customerEmail,
      subject: 'Your order is confirmed',
      text: 'Order #' + order.id + ' confirmed.',
    });
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    await sgMail.send({ to: email, subject: 'Welcome!', text: 'Thanks for joining.' });
  }
}

// 5. Module wiring — production
@Module({
  providers: [
    OrderService,
    OrderRepository,
    {
      provide: EMAIL_SERVICE,
      useClass: SendGridEmailService, // Swap to MailgunEmailService here
    },
  ],
  exports: [OrderService],
})
export class OrderModule {}

// 6. useFactory example — choose implementation based on environment
@Module({
  providers: [
    {
      provide: EMAIL_SERVICE,
      useFactory: (config: ConfigService): IEmailService => {
        if (config.get('NODE_ENV') === 'production') {
          return new SendGridEmailService(config);
        }
        return new ConsoleEmailService(); // logs to stdout in dev
      },
      inject: [ConfigService],
    },
  ],
})
export class EmailModule {}

// 7. Test setup — zero network calls, full control
describe('OrderService', () => {
  let orderService: OrderService;
  const mockEmailService: IEmailService = {
    sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: OrderRepository, useValue: { save: jest.fn() } },
        { provide: EMAIL_SERVICE, useValue: mockEmailService }, // mock injected here
      ],
    }).compile();

    orderService = module.get(OrderService);
  });

  it('should send confirmation email after placing order', async () => {
    const dto = { customerEmail: 'test@example.com', items: [] };
    await orderService.placeOrder(dto);
    expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledTimes(1);
  });
});`,
      rw: {
        ex: [
          'NestJS itself: every built-in service uses DI — JwtService, ConfigService, TypeORM repositories',
          'Angular\'s HttpClient: inject HttpClient, swap with HttpClientTestingModule in tests',
          'Spring Framework: @Autowired dependencies resolved by the Spring container — textbook DIP',
          'AWS SDK clients injected via DI so tests use localstack or mocks without code changes',
        ],
        cs: 'A fintech startup had OrderService directly importing StripeService. When they needed to support PayPal for EU customers, every payment-related file needed editing. After DIP refactoring with an IPaymentGateway token, adding PayPal required zero changes to OrderService and test coverage jumped to 95% because mocks replaced real Stripe calls.',
      },
    },
    interview: {
      q: 'How does NestJS\'s DI container implement DIP?',
      a: 'NestJS\'s DI container is a direct implementation of DIP. When you declare "provide: EMAIL_SERVICE, useClass: SendGridEmailService" in a module, you are registering a mapping from the abstraction (the token) to the detail (the concrete class). OrderService declares "@Inject(EMAIL_SERVICE) private emailService: IEmailService" — it depends only on the abstraction, never the concrete class. The container resolves this mapping at bootstrap time and injects the right implementation. In tests you override the mapping with "useValue: mockEmailService" — the business logic does not change at all. This is DIP made operational: the container owns the mapping between abstractions and details so that no application code has to.',
      fu: [
        'What is the difference between Dependency Injection and Dependency Inversion?',
        'How do you use abstract classes as injection tokens in NestJS?',
        'How does DIP enable testability?',
        'When would you use useFactory instead of useClass in a NestJS provider?',
      ],
    },
  },
];

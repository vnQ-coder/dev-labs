import { Concept } from '../types';

export const OOP_CONCEPTS: Concept[] = [
  // ─── ENCAPSULATION ───────────────────────────────────────────────────────────

  {
    id: 'oop-encapsulation',
    cat: 'oop',
    color: '#f472b6',
    icon: '🔒',
    title: 'Encapsulation',
    tag: 'Bundle data and behavior together — hide implementation details, expose a clean interface',
    overview:
      'Encapsulation is the practice of bundling related data and the methods that operate on that data into a single unit (a class or module), while restricting direct access to internal state. It is the first pillar of OOP and the foundation of every well-designed API. By controlling what is visible to the outside world, you reduce coupling between components — callers depend only on the public contract, not the internal wiring. This makes refactoring safe: you can completely replace the internals (swap Prisma for TypeORM, change a password-hashing algorithm, migrate from Redis to in-memory cache) without touching any caller. Controlled access via getters and setters also lets you add validation, logging, or lazy computation at the boundary without breaking the interface.',
    components: [
      {
        name: 'Private Fields',
        icon: '🔑',
        role: 'Hidden internal state.',
        detail:
          'Fields marked "private" are inaccessible outside the class. Callers cannot read or mutate them directly, preventing uncontrolled state changes and making invariants easier to enforce. In TypeScript, "private" fields are compile-time enforced; the "#field" syntax adds runtime enforcement.',
      },
      {
        name: 'Getters / Setters',
        icon: '🚪',
        role: 'Controlled access points to private state.',
        detail:
          'Rather than exposing a raw field, you expose a getter (read) and optionally a setter (write) method. The setter can validate input, trigger side-effects, or recompute derived state. TypeScript "get" / "set" accessors and NestJS DTO validation decorators both embody this idea.',
      },
      {
        name: 'Access Modifiers',
        icon: '🛡️',
        role: 'Declare visibility boundaries.',
        detail:
          '"public" — accessible everywhere. "private" — accessible only within the class. "protected" — accessible within the class and its subclasses. Choosing the right modifier is an explicit design decision about what is part of the public contract vs an implementation detail.',
      },
      {
        name: 'Modules as Encapsulation Units',
        icon: '📦',
        role: 'File/module-level visibility.',
        detail:
          'In NestJS, a Module groups related providers, controllers, and services into a cohesive unit. Only symbols listed in "exports" are available to other modules — everything else is module-private. This is encapsulation at the architectural level, not just the class level.',
      },
    ],
    howItWorks:
      'TypeScript enforces encapsulation at compile time via access modifiers. When you declare a field "private readonly userRepository", the compiler rejects any expression outside the class that attempts to access it. NestJS layers architectural encapsulation on top: a "UserService" marked "@Injectable()" lives inside a "UsersModule". The "userRepository" field is never exported — only the service methods ("createUser", "findById") are part of the public API. Controllers call the service; they never import or know about the repository. If you later swap Prisma for TypeORM, or add a Redis cache in front of the DB, you change "UserService" internals and zero controllers need to change. Private helper methods like "hashPassword()" keep business logic co-located with the data it operates on and ensure no other class can call it with incorrect arguments. The invariant "passwords must always be hashed before storage" is enforced structurally, not by convention.',
    decision: {
      choose: [
        'Use private fields when internal state must not be directly mutated by callers — enforce invariants structurally',
        'Expose state via a getter (not a public field) when you might need to add validation, logging, or lazy computation later',
        'Use module encapsulation in NestJS to prevent cross-module repository access — only the owning module should talk to its own DB table',
        'Mark helper methods private when they represent implementation details that callers should never depend on',
      ],
      avoid: [
        'God objects — classes with dozens of public fields and methods that mix unrelated responsibilities',
        'Exposing internal state directly via public fields; if you later need to validate or intercept access you will break all callers',
        'Leaking repository or ORM types in controller return types — that ties the HTTP contract to the DB schema',
      ],
      vs: [
        {
          name: 'Information Hiding',
          when:
            'A broader design principle: hide any decision that might change. Encapsulation is the OOP mechanism that implements information hiding inside a class.',
        },
        {
          name: 'Abstraction',
          when:
            'Abstraction hides complexity behind an interface; encapsulation hides the implementation behind access control. They work together but are distinct — you can have one without the other.',
        },
      ],
    },
    failures: [
      {
        name: 'Leaking Internal State',
        cause:
          'A method returns a reference to a mutable internal collection (e.g. returning the actual "List" field, not a copy). Callers mutate the internal state directly, bypassing all validation.',
        symptom:
          'Object invariants break silently. State changes appear in logs with no matching method call. Impossible-to-reproduce bugs under concurrent load.',
        fix: 'Return defensive copies, immutable views, or DTOs instead of raw internal references. Never return "this.items" — return "[...this.items]" or a read-only projection.',
        severity: 'high',
      },
      {
        name: 'Coupling to Implementation',
        cause:
          'A controller imports the Prisma client directly, or a service accepts a concrete "PrismaClient" type instead of a repository interface.',
        symptom:
          'Swapping the ORM requires changing dozens of files. Tests require a real database because there is no seam to inject a mock.',
        fix: 'Define a repository interface ("IUserRepository") and inject it. The service depends on the interface; the concrete Prisma implementation is an internal detail of the data layer.',
        severity: 'high',
      },
    ],
    a: {
      v: 'ATM machine',
      t: 'You interact with an ATM via the screen, keypad, and card slot. You never touch the cash cassette, the network module, or the ledger database. The bank encapsulates all of that behind a simple interface: insert card, enter PIN, withdraw cash.',
      tx: 'The ATM exposes exactly the operations the customer is authorised to perform. The internal state (cash count, network connection, encryption keys) is completely hidden. If the bank upgrades the internal hardware, your interaction does not change. This is encapsulation: a clean public interface over hidden, controlled internals.',
      s: 'Your NestJS "UserService" is the ATM. Controllers are the customers. "private readonly userRepository" and "private hashPassword()" are the cash cassette and the encryption module — callers never touch them directly.',
    },
    te: {
      def: 'Encapsulation bundles state and behaviour into a class while restricting access to internals via access modifiers ("private", "protected", "public"). The public interface is a stable contract; the internals are free to change.',
      types: [
        {
          n: 'Data Encapsulation',
          d: 'Private fields with getter/setter access. Callers read and write through controlled methods that can enforce invariants.',
        },
        {
          n: 'Behavioural Encapsulation',
          d: 'Private helper methods. Business logic stays inside the class that owns the data, preventing external code from bypassing rules.',
        },
        {
          n: 'Module Encapsulation',
          d: 'NestJS module exports — only explicitly exported providers are visible to importing modules. Everything else is module-private.',
        },
      ],
      when: 'Apply encapsulation everywhere, but especially at every module boundary. Be stricter as the scope of sharing increases — a private method on a service is low-stakes; a public method on a shared library is a contract you must maintain.',
      trade:
        'Strict encapsulation adds indirection — you write more code (interfaces, DTOs, mappers). The payoff is that refactoring is local, tests are isolated, and breaking changes are caught at compile time rather than at runtime across many callers.',
      code: `// UserService encapsulates all user-related DB logic.
// Controllers only see the public methods — never the repository or helpers.

import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  // Private: callers cannot access the repository directly.
  private readonly SALT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // private — hidden
  ) {}

  // Public API — the only surface callers depend on.
  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    await this.assertEmailIsUnique(dto.email);
    const hashedPassword = await this.hashPassword(dto.password);
    const user = this.userRepository.create({ ...dto, password: hashedPassword });
    const saved = await this.userRepository.save(user);
    return this.toResponseDto(saved); // Return DTO, never the raw entity
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user ? this.toResponseDto(user) : null;
  }

  // Private helpers — implementation details, never part of the public API.
  private async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.SALT_ROUNDS);
  }

  private async assertEmailIsUnique(email: string): Promise<void> {
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');
  }

  private toResponseDto(user: User): UserResponseDto {
    // Strip 'password' from response — never leak hashed passwords
    const { password, ...safe } = user;
    return safe as UserResponseDto;
  }
}

// UserController — only calls service methods, never touches the DB.
import { Controller, Post, Get, Param, Body } from '@nestjs/common';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto); // Clean interface
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}`,
      rw: {
        ex: [
          'NestJS modules export only the service — the repository is never exported, keeping DB access encapsulated',
          'TypeScript "private" fields on domain entities prevent controllers from writing directly to the DB through the entity',
          'DTOs as return types instead of raw Prisma/TypeORM entities — the DB schema stays hidden from the HTTP layer',
          'Passport.js strategy encapsulates token validation logic; NestJS guards call "canActivate()" without knowing the details',
        ],
        cs: 'Stripe SDK is a masterclass in encapsulation. You call "stripe.charges.create()" and never touch their HTTP client, retry logic, idempotency keys, or serialisation. Their internals change with every SDK version; your three lines of calling code stay identical.',
      },
    },
    interview: {
      q: 'How does NestJS enforce encapsulation, and what happens if you violate it?',
      a: 'NestJS provides two layers of encapsulation. At the class level, TypeScript access modifiers ("private", "protected") prevent direct field access at compile time — the compiler rejects any reference to "service.userRepository" from outside the class. At the module level, NestJS\'s module system enforces architectural encapsulation: a provider is only visible to other modules if it is explicitly listed in the "exports" array of its owning module. If you violate encapsulation — for example by injecting a repository from Module A directly into a service in Module B — NestJS throws a runtime "Nest can\'t resolve dependencies" error because the repository was never exported. The correct fix is to expose a service (the encapsulated API) from Module A and import Module A where needed.',
      fu: [
        'What is the difference between encapsulation and information hiding?',
        'Can you encapsulate without OOP? (Yes — modules, closures, and packages all provide encapsulation)',
        'How do you encapsulate error handling in NestJS? (Exception filters, interceptors)',
        'Why should a service return a DTO instead of the raw entity?',
      ],
    },
  },

  // ─── ABSTRACTION ─────────────────────────────────────────────────────────────

  {
    id: 'oop-abstraction',
    cat: 'oop',
    color: '#f472b6',
    icon: '🎭',
    title: 'Abstraction',
    tag: 'Show only what\'s necessary — hide complexity behind simple interfaces',
    overview:
      'Abstraction is the process of distilling a concept down to its essential operations, removing everything that is not relevant to the caller. In OOP this is achieved through abstract classes and interfaces, which define a contract (what something does) without committing to an implementation (how it does it). A well-designed abstraction lets you write code against the interface and swap implementations without changing a single line of calling code. Abstract classes are used when implementations share common logic; interfaces are used when multiple unrelated types should fulfil the same contract. TypeScript supports both; NestJS is built on a foundation of abstractions — guards, pipes, interceptors, and repositories are all interfaces that you implement.',
    components: [
      {
        name: 'Abstract Classes',
        icon: '🏗️',
        role: 'Partial implementation with mandatory extension points.',
        detail:
          'An abstract class can contain concrete methods (shared logic) and abstract methods (slots that subclasses must fill). It cannot be instantiated directly. Use it when multiple implementations share significant common logic but differ in a few key operations.',
      },
      {
        name: 'Interfaces',
        icon: '📋',
        role: 'Pure contract — zero implementation.',
        detail:
          'An interface defines method signatures and property types. Any class that satisfies the shape implements the interface. In TypeScript, interfaces are structural — if a class has the right shape, it is considered to implement the interface even without an explicit "implements" keyword. This enables duck typing.',
      },
      {
        name: 'Abstract Methods',
        icon: '🎯',
        role: 'Mandatory extension points on abstract classes.',
        detail:
          'Abstract methods declare a signature but provide no body. Subclasses are required to implement them. The abstract class can call them in concrete methods (Template Method Pattern) — defining the algorithm structure while delegating specific steps to subclasses.',
      },
      {
        name: 'Template Method Pattern',
        icon: '📐',
        role: 'Algorithm skeleton in abstract class, steps filled by subclasses.',
        detail:
          'The abstract class defines the sequence of operations (the invariant part of the algorithm) and calls abstract methods for the variable steps. This avoids code duplication across subclasses while allowing each to customise the steps it owns.',
      },
    ],
    howItWorks:
      'In TypeScript, you declare "abstract class BaseRepository<T>" and mark "findById", "save", and "delete" as abstract. Any class extending it must implement all three methods. The abstract class can still contain shared concrete methods like "findAll()" that reuse the abstract primitives. NestJS leverages abstraction extensively: "CanActivate" is an interface — you implement "canActivate(context)" and NestJS calls it, unaware of whether it is a JWT guard, an API-key guard, or a roles guard. Similarly, "PipeTransform" defines "transform(value, metadata)" — NestJS calls it on every incoming request parameter, polymorphically invoking whichever pipe is registered. Using "abstract class BaseGuard" lets you write shared token-parsing logic once and inject it into each concrete guard via the template method pattern.',
    decision: {
      choose: [
        'Use an interface when you want a pure contract with zero shared implementation, and when multiple unrelated classes should fulfil the contract',
        'Use an abstract class when implementations share significant logic but differ in a few key operations',
        'Use abstraction at every integration boundary — database, email, payment, cache — so you can swap providers without changing business logic',
        'Use the repository pattern (abstract interface over the DB) so services can be tested with in-memory fakes',
      ],
      avoid: [
        'Premature abstraction — do not create an interface for a class that will only ever have one implementation',
        'Abstract classes with too many abstract methods — that is just an interface with extra ceremony',
        'Exposing concrete types across module boundaries — abstract the interface, hide the implementation',
      ],
      vs: [
        {
          name: 'Encapsulation',
          when:
            'Encapsulation hides internal state using access control. Abstraction hides complexity by exposing only essential operations. You typically use both together.',
        },
        {
          name: 'Abstract Class vs Interface',
          when:
            'Use abstract class when you have shared implementation to reuse. Use interface when the contract is all you need and implementations are fully independent.',
        },
      ],
    },
    failures: [
      {
        name: 'Leaky Abstraction',
        cause:
          'The abstraction exposes implementation details — a repository method returns a Prisma-specific type, or an abstract method signature forces callers to handle DB-level errors.',
        symptom:
          'Changing the underlying implementation requires changing the abstraction itself and all callers. The abstraction provides no real isolation.',
        fix: 'Design interfaces in terms of the domain, not the technology. Return domain types, throw domain exceptions, and handle tech-specific details inside the implementation.',
        severity: 'high',
      },
      {
        name: 'Premature Abstraction',
        cause:
          'Developers create interfaces for every class "just in case" before there is a second implementation. This adds boilerplate with no benefit.',
        symptom:
          '"IUserService" interface and "UserServiceImpl" class that are always used together, never swapped. Adding any method requires changing three files.',
        fix: 'Wait for the second implementation before abstracting. Refactoring to an interface later is cheap; living with a wrong abstraction is expensive.',
        severity: 'medium',
      },
    ],
    a: {
      v: 'Car steering wheel',
      t: 'Every car has a steering wheel. You turn it left, the car goes left. You do not need to know whether it is hydraulic, electric, or rack-and-pinion — the abstract interface is "turn to steer". You can drive any car because they all implement the same contract.',
      tx: 'The steering wheel is the abstraction. The specific mechanism (hydraulic fluid, electric motor, cable) is the implementation. Abstraction lets you compose systems from interchangeable parts as long as each part honours the contract.',
      s: 'NestJS guards are the steering wheel. You always call "canActivate(context: ExecutionContext): boolean". Whether the guard checks a JWT, an API key, or a role list is the mechanism — hidden behind the abstract interface.',
    },
    te: {
      def: 'Abstraction distils a concept to its essential operations, expressed as an abstract class or interface, decoupling callers from implementation details. Callers program against the abstraction; implementations fulfil the contract.',
      types: [
        {
          n: 'Interface Abstraction',
          d: 'A pure contract. Any class with the right shape satisfies it. Used for cross-cutting concerns like guards, pipes, and repositories.',
        },
        {
          n: 'Abstract Class Abstraction',
          d: 'Shared implementation plus mandatory extension points. The Template Method Pattern lives here — define the algorithm, delegate the steps.',
        },
        {
          n: 'Generic Abstraction',
          d: 'TypeScript generics let you write "BaseRepository<T>" once and reuse it for every entity type. The abstraction is parameterised over the type it works with.',
        },
      ],
      when: 'Abstract at every integration boundary (DB, cache, email, payment). Abstract when there are or will be multiple implementations. Do not abstract prematurely — wait for the second implementation.',
      trade:
        'Abstractions add a layer of indirection. IDEs have to navigate through interfaces to find implementations; stack traces are less direct. The benefit — swappable implementations, testable code, and isolated modules — outweighs the cost at every integration boundary.',
      code: `// Abstract repository — callers depend on this interface, never on Prisma or TypeORM.
abstract class BaseRepository<T> {
  abstract findById(id: string): Promise<T | null>;
  abstract save(entity: T): Promise<T>;
  abstract delete(id: string): Promise<void>;

  // Shared concrete logic reusing abstract primitives.
  async findByIdOrThrow(id: string): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) throw new Error('Entity not found');
    return entity;
  }
}

// Concrete implementation — knows about TypeORM, no caller does.
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    private readonly orm: Repository<User>,
  ) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    return this.orm.findOne({ where: { id } });
  }

  async save(user: User): Promise<User> {
    return this.orm.save(user);
  }

  async delete(id: string): Promise<void> {
    await this.orm.delete(id);
  }
}

// ── Abstract guard with template method ──────────────────────────────────────

import { CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

abstract class BaseTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Token missing');
    return this.validateToken(token); // delegated to subclass
  }

  protected abstract extractToken(request: any): string | null;
  protected abstract validateToken(token: string): boolean;
}

@Injectable()
class JwtGuard extends BaseTokenGuard {
  protected extractToken(request: any): string | null {
    return request.headers.authorization?.replace('Bearer ', '') ?? null;
  }
  protected validateToken(token: string): boolean {
    // verify JWT signature...
    return true; // simplified
  }
}

@Injectable()
class ApiKeyGuard extends BaseTokenGuard {
  protected extractToken(request: any): string | null {
    return request.headers['x-api-key'] ?? null;
  }
  protected validateToken(token: string): boolean {
    return token === process.env.API_KEY;
  }
}

// Controller — does not know which guard is active. Abstraction at work.
import { Controller, Get, UseGuards } from '@nestjs/common';

@Controller('data')
@UseGuards(JwtGuard) // swap to ApiKeyGuard with zero controller changes
class DataController {
  @Get()
  getData() {
    return { data: 'protected' };
  }
}`,
      rw: {
        ex: [
          'NestJS "CanActivate" — every guard implements the same interface; the framework calls "canActivate()" without caring about the implementation',
          'NestJS "PipeTransform" — validation, transformation, and parsing pipes all share one abstract interface',
          'Repository pattern over TypeORM/Prisma — services never import ORM types; they use an abstract repository interface',
          'Abstract "BaseEntity" in TypeORM — "id", "createdAt", "updatedAt" fields shared via inheritance, eliminating repetition across all entities',
        ],
        cs: 'AWS SDK for Node.js abstracts S3, DynamoDB, and SQS behind a unified client interface. You call "client.send(command)" regardless of the underlying AWS service. Switching regions, retrying, or signing requests are handled inside the abstraction — you never see them.',
      },
    },
    interview: {
      q: 'When do you choose an abstract class over an interface in TypeScript?',
      a: 'Use an interface when you need a pure contract with no shared implementation — multiple unrelated classes should fulfil it and they share nothing in common. Use an abstract class when implementations share significant concrete logic but differ in a few key operations. In NestJS, "CanActivate" is an interface because guards (JWT, API key, roles) share nothing except the method signature. But a "BaseRepository<T>" is an abstract class because all repository implementations share "findByIdOrThrow()" logic that delegates to the abstract "findById()" — that is the template method pattern, only possible with abstract classes. The rule of thumb: if you have shared code, use an abstract class; if you only have a contract, use an interface.',
      fu: [
        'How does abstraction differ from encapsulation?',
        'Can a class implement multiple interfaces in TypeScript? Can it extend multiple abstract classes?',
        'What is a leaky abstraction, and how do you fix one?',
        'How does the repository pattern apply abstraction in NestJS?',
      ],
    },
  },

  // ─── INHERITANCE ─────────────────────────────────────────────────────────────

  {
    id: 'oop-inheritance',
    cat: 'oop',
    color: '#f472b6',
    icon: '🧬',
    title: 'Inheritance',
    tag: 'Derive new classes from existing ones — reuse and extend behavior',
    overview:
      'Inheritance is the mechanism by which a class (subclass) derives state and behaviour from another class (superclass). It is the oldest and most misunderstood reuse mechanism in OOP. Used correctly — for genuine "is-a" relationships, shallow hierarchies, and extension of stable base classes — it eliminates duplication and enables polymorphism. Used carelessly — for code reuse convenience, deep hierarchies, or when "has-a" is the real relationship — it creates brittle, tightly-coupled code. The fragile base class problem is real: a change to the base class can silently break every subclass. The modern consensus is to favour composition over inheritance, but there are scenarios where inheritance is the right tool: exception hierarchies, framework base classes, and CRUD service generics.',
    components: [
      {
        name: 'Base Class (Superclass)',
        icon: '🏛️',
        role: 'Defines common state and behaviour.',
        detail:
          'The parent class contains shared fields (typically protected or private), concrete methods shared by all subclasses, and optionally abstract methods that subclasses must implement. TypeScript allows only single-class inheritance ("extends" one class at a time).',
      },
      {
        name: 'Derived Class (Subclass)',
        icon: '🌿',
        role: 'Extends and specialises the base.',
        detail:
          'The child class inherits all non-private members of the base class. It can add new fields, override methods with more specific behaviour, and call base implementations via "super". It must call "super()" in its constructor before accessing "this".',
      },
      {
        name: 'Method Override',
        icon: '🔄',
        role: 'Replace or extend an inherited method.',
        detail:
          'A subclass declares a method with the same name and signature as the parent. TypeScript\'s "override" keyword (enabled with "noImplicitOverride") makes overrides explicit and catches accidental name collisions. The subclass can call the parent\'s version via "super.methodName()".',
      },
      {
        name: 'super()',
        icon: '⬆️',
        role: 'Invoke parent constructor or method.',
        detail:
          '"super()" in a subclass constructor runs the parent constructor, initialising inherited fields. "super.method()" in an overridden method calls the parent\'s version, enabling extension rather than replacement. Missing "super()" in a subclass constructor is a TypeScript compile error.',
      },
      {
        name: 'Protected Members',
        icon: '🔐',
        role: 'Accessible in subclasses but not externally.',
        detail:
          '"protected" fields and methods are invisible to external callers but visible to all subclasses. Use protected for state that subclasses genuinely need, but be aware that every protected member is implicitly part of the subclass API — a change can break all subclasses.',
      },
      {
        name: 'Mixin Pattern',
        icon: '🧩',
        role: 'Compose behaviour from multiple sources without deep inheritance.',
        detail:
          'TypeScript does not support multiple inheritance but supports mixins — small, focused classes that add one capability. Applied via intersection types and class factories, mixins let you compose "Serializable + Auditable + Validatable" without a three-level hierarchy.',
      },
    ],
    howItWorks:
      'TypeScript uses the "extends" keyword for single inheritance. The subclass\'s prototype chain delegates property lookups to the parent if not found locally — this is how JavaScript\'s prototype-based inheritance maps to class syntax. NestJS uses inheritance throughout: "HttpException" is the base for all HTTP errors; NestJS provides "BadRequestException", "NotFoundException", and "ForbiddenException" as concrete subclasses. You extend "HttpException" to create domain-specific exceptions ("PaymentDeclinedException extends HttpException"). A generic "CrudService<T, CreateDto, UpdateDto>" base class provides "findAll", "findOne", "create", "update", and "remove" using an injected TypeORM repository. Concrete services like "UserService extends CrudService<User, CreateUserDto, UpdateUserDto>" inherit all five methods and override only what needs specialising (e.g., hashing passwords before calling "super.create()"). Deep inheritance hierarchies — more than two or three levels — become fragile: a change in the root class ripples through all descendants, often with unintended side-effects.',
    decision: {
      choose: [
        'Exception hierarchies — subclass exceptions share error-code logic and HTTP status from a base exception class',
        'Framework integration — when a framework (NestJS, TypeORM) requires you to extend a base class to gain functionality',
        'Generic CRUD services — a "CrudService<T>" that provides standard operations, with each entity service extending and overriding as needed',
        'When the "is-a" relationship is genuine and stable — a "Dog" truly is an "Animal"',
      ],
      avoid: [
        'Using inheritance purely for code reuse when there is no conceptual "is-a" relationship — use composition',
        'Deep hierarchies (more than 2–3 levels) — each level increases coupling and reduces comprehensibility',
        'Overriding methods in ways that violate the Liskov Substitution Principle — callers of the base class must be able to use any subclass without knowing which one',
        'Inheriting from concrete classes you do not own — the fragile base class problem is worst when you cannot control the parent',
      ],
      vs: [
        {
          name: 'Composition',
          when:
            'Prefer composition when you want to reuse behaviour without the "is-a" commitment. "UserService has a UserRepository" is composition; it is more flexible and testable than "UserService extends BaseRepository".',
        },
        {
          name: 'Mixins',
          when:
            'Use mixins when you need behaviour from multiple sources. TypeScript mixins compose cleanly without inheritance chains.',
        },
      ],
    },
    failures: [
      {
        name: 'Fragile Base Class',
        cause:
          'A change to the base class (adding a method, changing a method signature, altering a protected field) breaks subclasses in non-obvious ways.',
        symptom:
          'A "safe" refactor of the base class causes production errors in subclasses that were never directly changed. CI fails with cryptic type errors across many files.',
        fix: 'Keep base classes small and stable. Treat every public and protected member as a permanent API commitment. Prefer "final" (sealed) classes when extension is not intended. Use composition when the base class is likely to evolve.',
        severity: 'high',
      },
      {
        name: 'LSP Violation',
        cause:
          'A subclass overrides a method in a way that violates the contract callers of the base class expect — throwing where the base does not, returning a narrower type, or requiring additional preconditions.',
        symptom:
          'Code that works with the base class breaks when passed a subclass instance. "instanceof" checks proliferate because callers cannot trust the base contract.',
        fix: 'Subclasses must honour the base class contract. If you cannot implement the base interface without weakening or strengthening it, the hierarchy is wrong — use composition instead.',
        severity: 'critical',
      },
    ],
    a: {
      v: 'Animal taxonomy',
      t: 'A Dog is an Animal. It inherits everything an Animal has (metabolism, reproduction, sensory organs) and adds or overrides specifics (barks instead of roars, four legs, fur). You do not re-implement "breathe" or "eat" for every animal — the base class handles common behaviour.',
      tx: 'Inheritance models "is-a" relationships. The parent class captures what is universal; subclasses capture what is specific. The power is that code written for "Animal" automatically works for "Dog", "Cat", and "Eagle" — this is the foundation of polymorphism.',
      s: '"AppException extends HttpException" means AppException IS an HttpException. NestJS exception filters that handle "HttpException" automatically handle all your custom exceptions — the framework wrote the code once, and your subclasses slot in.',
    },
    te: {
      def: 'Inheritance creates a subtype relationship where a derived class acquires all non-private members of its base class. Subclasses can override methods to specialise behaviour while inheriting shared implementations, enabling reuse and polymorphism simultaneously.',
      types: [
        {
          n: 'Single Inheritance',
          d: 'TypeScript supports only one "extends" target. A class has exactly one parent. Keeps hierarchy simple; forces you to choose the most important "is-a" relationship.',
        },
        {
          n: 'Method Overriding',
          d: 'Subclass redefines a parent method with the same signature. "override" keyword in TypeScript makes this explicit. Call "super.method()" to extend rather than replace.',
        },
        {
          n: 'Abstract Inheritance',
          d: 'A subclass extends an abstract class, providing implementations for all abstract methods. The abstract class provides the template; the subclass provides the specialisation.',
        },
      ],
      when: 'Use inheritance for exception hierarchies, framework-required base classes, and generic CRUD services. Limit to two or three levels. Any time you are using inheritance for convenience rather than semantics, switch to composition.',
      trade:
        'Inheritance couples the subclass to the parent\'s implementation. The parent class becomes a shared mutable "base" that every subclass depends on. Composition is looser — a class holds a reference to a collaborator but does not inherit its implementation, so the collaborator can be swapped or mocked freely.',
      code: `// Custom exception hierarchy — genuine "is-a" relationships.
import { HttpException, HttpStatus } from '@nestjs/common';

class AppException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus,
    public readonly errorCode: string,
  ) {
    super({ message, errorCode }, status);
  }
}

class NotFoundException extends AppException {
  constructor(resource: string) {
    super('Resource not found: ' + resource, HttpStatus.NOT_FOUND, 'NOT_FOUND');
  }
}

class ForbiddenException extends AppException {
  constructor(action: string) {
    super('Forbidden: ' + action, HttpStatus.FORBIDDEN, 'FORBIDDEN');
  }
}

// ── Generic CRUD service via inheritance ─────────────────────────────────────

import { Injectable } from '@nestjs/common';
import { Repository, FindOptionsWhere } from 'typeorm';

@Injectable()
abstract class CrudService<T extends { id: string }, CreateDto, UpdateDto> {
  constructor(protected readonly repository: Repository<T>) {}

  findAll(): Promise<T[]> {
    return this.repository.find();
  }

  findOne(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } as FindOptionsWhere<T> });
  }

  async create(dto: CreateDto): Promise<T> {
    const entity = this.repository.create(dto as any);
    return this.repository.save(entity);
  }

  async update(id: string, dto: UpdateDto): Promise<T> {
    await this.repository.update(id, dto as any);
    return this.findOne(id) as Promise<T>;
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

// UserService inherits all CRUD methods, overrides 'create' to hash password.
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
class UserService extends CrudService<User, CreateUserDto, UpdateUserDto> {
  constructor(@InjectRepository(User) repository: Repository<User>) {
    super(repository);
  }

  // Override 'create' to add password hashing before calling super.
  override async create(dto: CreateUserDto): Promise<User> {
    const hashed = await bcrypt.hash(dto.password, 12);
    return super.create({ ...dto, password: hashed }); // reuse parent logic
  }
}`,
      rw: {
        ex: [
          'NestJS "HttpException" hierarchy — "BadRequestException", "NotFoundException", "ForbiddenException" all extend "HttpException"',
          'TypeORM "BaseEntity" — entities extend it to inherit "save()", "find()", and "remove()" active-record methods',
          'NestJS "PassportStrategy" — you extend it with a specific strategy name and implement "validate()"',
          'Jest "extends" for custom matchers — "expect.extend()" adds domain-specific assertions to the base expect class',
        ],
        cs: 'React class components used inheritance ("class MyComponent extends React.Component"). React\'s "Component" base class provided lifecycle methods and "setState". Every React component is an "is-a" Component. Modern React replaced most of this with hooks and composition, demonstrating exactly when inheritance should give way to composition.',
      },
    },
    interview: {
      q: 'The community says "favour composition over inheritance" — when would you still use inheritance?',
      a: 'Three cases justify inheritance in modern TypeScript/NestJS. First, exception hierarchies: "NotFoundException extends AppException extends HttpException" is a genuine "is-a" chain, and inheriting the HTTP status and error-code logic from the parent is correct — there is no composition equivalent that is not more awkward. Second, framework contracts: NestJS\'s "PassportStrategy" requires "extends" to inject the strategy name at class-construction time via the "super()" call — the framework is designed around inheritance here. Third, generic CRUD services: a "CrudService<T>" base class with "findAll", "findOne", "create", "update", "remove" eliminates repetition across ten entity services, and the "is-a" relationship ("UserService is a CrudService for Users") is semantically sound. In all other cases, if you are reaching for "extends" purely to reuse a few methods, stop and reach for composition — inject a collaborator instead.',
      fu: [
        'What is the fragile base class problem and how do you avoid it?',
        'What is the Liskov Substitution Principle and how does it constrain inheritance?',
        'How do TypeScript mixins differ from inheritance?',
        'When would you make a class "sealed" (non-extensible)?',
      ],
    },
  },

  // ─── POLYMORPHISM ────────────────────────────────────────────────────────────

  {
    id: 'oop-polymorphism',
    cat: 'oop',
    color: '#f472b6',
    icon: '🦋',
    title: 'Polymorphism',
    tag: 'One interface, many implementations — write code that works with any subtype',
    overview:
      'Polymorphism means "many forms" — a single variable, parameter, or function can work with objects of many different types, as long as those types honour a common contract. Runtime polymorphism (the most important form) means the exact method that executes is determined at runtime based on the actual type of the object, not the declared type. This is the foundation of the Open/Closed Principle: you add new behaviour by adding new implementations, not by modifying existing switch statements or if-chains. TypeScript also supports compile-time polymorphism (function overloading) and structural polymorphism (duck typing — if it has the right shape, it qualifies). NestJS is deeply polymorphic: guards, pipes, interceptors, and filters are all interfaces that the framework calls polymorphically.',
    components: [
      {
        name: 'Method Overriding (Runtime Polymorphism)',
        icon: '🎯',
        role: 'Subclass substitutes its own behaviour for the parent\'s.',
        detail:
          'When you call a method on a variable typed as the base class/interface, the runtime dispatches to the overriding method on the actual concrete instance. Code written against the interface automatically works with any conforming implementation — present and future.',
      },
      {
        name: 'Interface Polymorphism',
        icon: '📋',
        role: 'Unrelated types fulfil the same contract.',
        detail:
          'Any class that implements an interface can be used wherever that interface is expected. Unlike inheritance polymorphism, the classes do not need to share a parent. TypeScript\'s structural typing means even a class that does not explicitly declare "implements NotificationProvider" qualifies if it has the right shape.',
      },
      {
        name: 'Union Types',
        icon: '🔀',
        role: 'TypeScript compile-time polymorphism for non-class values.',
        detail:
          '"string | number | boolean" is a union type. Functions that accept union types handle multiple shapes at once. Combined with type guards ("typeof", "instanceof", discriminated unions), you write code that safely branches on the actual type at runtime.',
      },
      {
        name: 'Type Guards',
        icon: '🔍',
        role: 'Narrow a union type to a specific member at runtime.',
        detail:
          '"instanceof" checks (for classes), "typeof" checks (for primitives), and custom type guard functions ("is" return type) let TypeScript narrow the type within a branch. This is the TypeScript equivalent of RTTI (runtime type information) in compiled languages.',
      },
      {
        name: 'Strategy Pattern via Polymorphism',
        icon: '♟️',
        role: 'Select algorithm at runtime by swapping implementations.',
        detail:
          'Store a reference typed as the interface. Assign different concrete implementations at runtime (or via dependency injection). Call the interface method — the selected strategy executes. Adding a new strategy never requires changing the code that uses it.',
      },
    ],
    howItWorks:
      'NestJS leverages polymorphism at every layer of the framework. Every guard implements "CanActivate" with a single method "canActivate(context: ExecutionContext): boolean | Promise<boolean>". The NestJS runtime calls "canActivate()" on each registered guard — it never checks what type the guard is. "JwtGuard", "RolesGuard", and "ApiKeyGuard" all have different implementations; the framework code that calls them never changes. The same pattern applies to pipes ("PipeTransform.transform()"), interceptors ("NestInterceptor.intercept()"), and exception filters ("ExceptionFilter.catch()"). In your own code, a "NotificationService" that holds "NotificationProvider[]" (an interface) and loops over them calling "provider.send(message)" is classic interface polymorphism — add "SlackProvider" and no other code changes.',
    decision: {
      choose: [
        'When you have multiple implementations of the same operation and callers should not care which one runs — use interface polymorphism',
        'When you want to add new behaviour without modifying existing code — define the interface once, add new implementations',
        'When you have a branching "if type === X ... else if type === Y" block — that is a sign polymorphism should replace the conditional',
        'When integrating with NestJS framework hooks — always program to the interface ("CanActivate", "PipeTransform"), not the concrete class',
      ],
      avoid: [
        'Polymorphism via "instanceof" everywhere — if you have ten "instanceof" checks, you have inverted polymorphism; the types should handle their own behaviour',
        'Forcing unrelated classes into a hierarchy just to get polymorphism — use interfaces, not inheritance, when the types are not genuinely related',
        'Over-engineering: do not introduce a polymorphic interface for a case that will only ever have one implementation',
      ],
      vs: [
        {
          name: 'Conditional Logic',
          when:
            'A switch or if-chain on a type tag is the procedural alternative to polymorphism. Switch statements require modification every time a new type is added; polymorphism does not.',
        },
        {
          name: 'Inheritance Polymorphism vs Interface Polymorphism',
          when:
            'Prefer interface polymorphism — it is less coupling and does not require a shared ancestor. Use inheritance polymorphism when the "is-a" relationship is genuine and shared implementation is valuable.',
        },
      ],
    },
    failures: [
      {
        name: 'Instanceof Sprawl',
        cause:
          'Instead of letting polymorphism route behaviour, every caller contains "if (obj instanceof TypeA) ... else if (obj instanceof TypeB)" chains.',
        symptom:
          'Adding a new type requires finding and updating every "instanceof" chain across the codebase. New types are easy to forget, causing silent fallthrough.',
        fix: 'Move the type-specific behaviour into the types themselves, behind a shared interface method. Callers call the method; types handle their own specialisation.',
        severity: 'high',
      },
      {
        name: 'LSP Violation in Polymorphic Hierarchy',
        cause:
          'A subclass overrides a method in a way that violates what callers of the base type expect — throwing an exception the base never throws, returning null when the base returns a value, or ignoring parameters the base honours.',
        symptom:
          'Code that works correctly with the base type breaks with a specific subtype. Debugging requires checking which concrete type is in use, defeating the point of polymorphism.',
        fix: 'Subclasses must fulfil the full contract of the base type. Strengthen postconditions (return more specific types) but never weaken them. Never throw exceptions the interface does not declare.',
        severity: 'critical',
      },
    ],
    a: {
      v: 'Universal remote control',
      t: 'A universal remote has one button: "power". It does not matter if you point it at a TV, a projector, or a soundbar — pressing power turns on whatever device is in range. The remote is polymorphic: one interface, many implementations of the "power on" behaviour.',
      tx: 'The remote is typed as "RemoteTarget" (the interface). The TV, projector, and soundbar are concrete implementations. The person pressing the button does not write different code for each device — they call "powerOn()" and polymorphism routes the call to the right implementation.',
      s: 'Your "NotificationService" is the remote. "EmailProvider", "SmsProvider", and "PushProvider" are the devices. Calling "provider.send(message)" on each is pressing the power button — the right implementation runs automatically.',
    },
    te: {
      def: 'Polymorphism is the ability of a single interface or method call to invoke different behaviour depending on the runtime type of the object. In TypeScript it manifests as interface polymorphism (structural typing), inheritance polymorphism (method overriding), and union type polymorphism (type guards).',
      types: [
        {
          n: 'Runtime (Subtype) Polymorphism',
          d: 'Method dispatch resolved at runtime based on the concrete type. The most powerful form — enables the Open/Closed Principle and strategy patterns.',
        },
        {
          n: 'Compile-Time (Ad-hoc) Polymorphism',
          d: 'Function overloading in TypeScript — multiple signatures, one implementation that branches on argument types. Used for APIs that accept several input shapes.',
        },
        {
          n: 'Structural (Duck-Type) Polymorphism',
          d: 'TypeScript\'s default: any object with the required shape satisfies the interface, even without an explicit "implements" declaration. Maximally flexible.',
        },
      ],
      when: 'Apply polymorphism whenever you find yourself writing "if the type is X, do this; if the type is Y, do that". That conditional is a polymorphism smell — the type should carry its own behaviour. In NestJS, always write providers that implement framework interfaces rather than switch on provider types.',
      trade:
        'Polymorphism makes adding new types cheap (no existing code changes) but makes understanding flow harder — you must trace to the concrete implementation to know what runs. Good IDE support (Go to Definition, Find Implementations) and well-named types mitigate this. Excessive polymorphism can make debugging difficult; balance it with clear naming and minimal hierarchy depth.',
      code: `// NotificationProvider interface — the polymorphic contract.
interface NotificationProvider {
  readonly name: string;
  send(recipient: string, message: string): Promise<void>;
}

// Three independent implementations — no shared parent required.
@Injectable()
class EmailProvider implements NotificationProvider {
  readonly name = 'email';
  async send(recipient: string, message: string): Promise<void> {
    // send via SendGrid / SES / nodemailer
    console.log('Email to ' + recipient + ': ' + message);
  }
}

@Injectable()
class SmsProvider implements NotificationProvider {
  readonly name = 'sms';
  async send(recipient: string, message: string): Promise<void> {
    // send via Twilio
    console.log('SMS to ' + recipient + ': ' + message);
  }
}

@Injectable()
class PushProvider implements NotificationProvider {
  readonly name = 'push';
  async send(recipient: string, message: string): Promise<void> {
    // send via Firebase Cloud Messaging
    console.log('Push to ' + recipient + ': ' + message);
  }
}

// NotificationService — polymorphic consumer. Caller does not care which provider runs.
@Injectable()
class NotificationService {
  constructor(
    // Inject all providers — NestJS resolves each concrete class.
    private readonly providers: NotificationProvider[],
  ) {}

  async notifyAll(recipient: string, message: string): Promise<void> {
    // Polymorphic dispatch — each provider executes its own 'send'.
    await Promise.all(
      this.providers.map((p) => p.send(recipient, message)),
    );
  }

  async notifyVia(channel: string, recipient: string, message: string): Promise<void> {
    const provider = this.providers.find((p) => p.name === channel);
    if (!provider) throw new Error('Unknown channel: ' + channel);
    await provider.send(recipient, message); // polymorphic — right impl runs
  }
}

// ── Polymorphic exception filter with type guards ────────────────────────────

import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

class ValidationError extends Error {
  constructor(public readonly fields: Record<string, string>) {
    super('Validation failed');
  }
}

@Catch()
class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      // instanceof type guard — narrows to HttpException
      response.status(exception.getStatus()).json(exception.getResponse());
    } else if (exception instanceof ValidationError) {
      // instanceof type guard — narrows to ValidationError
      response.status(400).json({ errors: exception.fields });
    } else {
      // Catch-all — unknown exception shape
      response.status(500).json({ message: 'Internal server error' });
    }
  }
}`,
      rw: {
        ex: [
          'NestJS guards all implement "CanActivate.canActivate()" — the framework calls the same method name regardless of which guard is active',
          'NestJS pipes all implement "PipeTransform.transform()" — "ValidationPipe", "ParseIntPipe", and custom pipes are interchangeable',
          'NestJS interceptors all implement "NestInterceptor.intercept()" — logging, caching, and timeout interceptors share one interface',
          'TypeORM repository pattern — "Repository<User>" and a custom "InMemoryUserRepository" both implement "findOne", "save", "delete" — tests use the fake, production uses TypeORM',
        ],
        cs: 'Node.js streams are the definitive polymorphism example in the JS ecosystem. "Readable", "Writable", and "Transform" are interfaces. "fs.createReadStream()", "http.IncomingMessage", and "zlib.createGzip()" all implement them. You pipe any readable to any writable — the stream framework is polymorphic and every new stream type slots in without changing the framework.',
      },
    },
    interview: {
      q: 'How does NestJS\'s interceptor system demonstrate polymorphism, and what is the difference between polymorphism via inheritance vs via interfaces?',
      a: 'NestJS interceptors demonstrate interface polymorphism. The framework defines "NestInterceptor" with one method: "intercept(context: ExecutionContext, next: CallHandler): Observable<any>". Every interceptor — logging, caching, timeout, response-transformation — implements this single interface. When a request arrives, NestJS calls "intercept()" on each registered interceptor without knowing or caring which concrete class it is. Adding a new interceptor requires zero changes to the framework or any other interceptor. That is the Open/Closed Principle enabled by polymorphism. The difference between inheritance polymorphism and interface polymorphism: inheritance polymorphism requires a shared ancestor class — the runtime dispatches based on which subclass overrides a parent method, and the classes share the parent\'s implementation. Interface polymorphism requires only a shared contract — implementations are completely independent and share nothing except the method signatures. Interface polymorphism is generally preferable in NestJS because providers are independent services that should not inherit from each other; they just agree on a contract.',
      fu: [
        'What is the Open/Closed Principle and how does polymorphism enable it?',
        'How do you inject multiple implementations of the same interface in NestJS? (Injection tokens, "useClass" multi-providers)',
        'What is duck typing and how does TypeScript\'s structural type system implement it?',
        'How does the Strategy pattern use polymorphism to eliminate conditional logic?',
      ],
    },
  },
];

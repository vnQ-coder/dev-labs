import { Concept } from '../types';

export const NESTJS_CONCEPTS: Concept[] = [
  // ─── NESTJS ARCHITECTURE ─────────────────────────────────────────────────────

  {
    id: 'nestjs-architecture',
    cat: 'nestjs',
    color: '#e0234e',
    icon: '🏛️',
    title: 'NestJS Architecture & Modules',
    tag: 'NestJS is built on Angular-inspired module architecture — every feature is a self-contained module',
    overview:
      'NestJS organises application code into Modules — cohesive units that group related Controllers, Providers (Services, Repositories, Guards, etc.), and their dependencies. The DI container is the engine: it reads metadata emitted by TypeScript decorators to build a dependency graph and instantiate providers in the correct order. Each Module declares what it needs (imports), what it provides internally (providers), what HTTP handlers it exposes (controllers), and what it makes available to other modules (exports). Global modules bypass the import requirement and are available everywhere. Dynamic modules (forRoot/forFeature) allow configuration-time customisation — think ConfigModule.forRoot() or TypeOrmModule.forFeature([User]). Lazy-loaded modules defer initialisation to reduce cold-start time in serverless environments.',
    components: [
      {
        name: '@Module',
        icon: '📦',
        role: 'Declares a cohesive feature unit with its dependencies, controllers, providers, and exports.',
        detail:
          'The @Module() decorator accepts four keys: imports (other modules whose exports are needed), controllers (route handlers scoped to this module), providers (services/repos/guards registered in this module\'s DI container), and exports (providers that other importing modules can inject). Only exported providers are visible outside.',
      },
      {
        name: '@Injectable',
        icon: '💉',
        role: 'Marks a class as a DI provider that can be injected into other classes.',
        detail:
          'Applying @Injectable() tells the NestJS DI container that this class participates in dependency injection — it can declare constructor dependencies that the container will resolve and inject automatically.',
      },
      {
        name: '@Controller',
        icon: '🎮',
        role: 'Binds a class to an HTTP route prefix and defines request handler methods.',
        detail:
          'Controllers are thin orchestrators — they receive HTTP requests, delegate work to services, and return responses. They are listed in a module\'s "controllers" array and are never exported (they are not injectable into other classes).',
      },
      {
        name: '@Global',
        icon: '🌍',
        role: 'Makes a module\'s exports available everywhere without explicit import.',
        detail:
          'Apply @Global() to modules that provide truly application-wide singletons (ConfigService, DatabaseConnection). Overuse defeats the explicitness of the module graph — reserve it for cross-cutting infrastructure providers.',
      },
      {
        name: 'Dynamic modules (forRoot/forFeature)',
        icon: '⚙️',
        role: 'Produce a configured module at runtime based on options passed at import time.',
        detail:
          'A static forRoot(options) method returns a DynamicModule object — it can register providers whose values depend on the supplied options. forFeature() is the per-feature counterpart (e.g. TypeOrmModule.forFeature([User]) registers the User repository only in the importing module).',
      },
      {
        name: 'Lazy-loaded modules',
        icon: '🐢',
        role: 'Defer module initialisation until the feature is first requested.',
        detail:
          'Using LazyModuleLoader, you can import a module on-demand instead of at bootstrap. This reduces cold-start time in serverless / edge functions where only a subset of routes are invoked per instance.',
      },
    ],
    a: {
      v: 'Office building with departments',
      t: 'Each department (module) has its own staff (providers), reception desk (controller), and shared resources (exports). The building management (DI container) ensures every desk has what it needs. The HR department does not need to know about the Finance department\'s internal tools — only what Finance explicitly shares.',
      tx: 'Modules enforce encapsulation at the architectural level. The DI container resolves dependencies across module boundaries only when exports and imports are wired correctly.',
      s: 'UserModule exports UserService. AuthModule imports UserModule so AuthService can inject UserService. AppModule composes both. The DI container builds the whole graph from these declarations.',
    },
    te: {
      def: 'NestJS modules are DI-scoped boundaries. @Module() metadata drives the IoC container, which resolves constructor dependencies automatically. Exports / imports define the inter-module API surface.',
      types: [
        {
          n: 'Feature Module',
          d: 'Groups a single feature (Users, Orders, Auth). Most modules in an application are feature modules.',
        },
        {
          n: 'Shared Module',
          d: 'Exports reusable providers (LoggingService, CacheService) consumed by many feature modules.',
        },
        {
          n: 'Dynamic Module',
          d: 'Returns a DynamicModule from a static factory (forRoot/forFeature) so configuration is injected at import time rather than hard-coded.',
        },
        {
          n: 'Global Module',
          d: 'Decorated with @Global() — its exports are available to every module without explicit import.',
        },
      ],
      when: 'Create a new module for every distinct feature domain. Use forRoot() when configuration must be supplied once for the whole app. Use forFeature() when a module needs a subset of a shared resource (e.g. TypeORM entity repositories).',
      trade:
        'Modules add explicit wiring boilerplate but make dependency relationships auditable and testable. The DI container catches missing providers at bootstrap rather than at the point of first use in production.',
      code: `// database.module.ts — dynamic module with forRoot factory
import { Module, DynamicModule, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(options: { url: string }): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: options.url,
          autoLoadEntities: true,
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
}

// user.module.ts — feature module importing DatabaseModule exports
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // registers UserRepository
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // other modules can inject UserService
})
export class UserModule {}

// app.module.ts — root composition
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // global config
    DatabaseModule.forRoot({ url: process.env.DATABASE_URL ?? '' }),
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}

// Circular dependency fix with forwardRef()
// user.module.ts
import { forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)], // breaks circular reference
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}`,
      rw: {
        ex: [
          'TypeOrmModule.forRoot() at app level; TypeOrmModule.forFeature([Entity]) per feature module',
          'ConfigModule.forRoot({ isGlobal: true }) — one import, available everywhere',
          '@Global() DatabaseModule so every feature module can inject the connection without listing it in imports',
          'forwardRef() to resolve circular AuthModule <-> UserModule dependency',
        ],
        cs: 'Angular\'s NgModule system inspired NestJS modules directly. Both use the same imports/exports/declarations/providers pattern to compose large applications from isolated feature units.',
      },
    },
    interview: {
      q: 'What is the difference between providers and exports in @Module?',
      a: 'providers are classes registered in this module\'s DI container — they can be injected by any other provider or controller within the same module. exports is the subset of those providers that are exposed to other modules that import this module. A provider listed only in providers is module-private; listing it in exports makes it part of the module\'s public API. If ModuleA provides and exports ServiceA, and ModuleB imports ModuleA, then ModuleB\'s providers can inject ServiceA. If ModuleA does not export ServiceA, importing ModuleA gives no access to it.',
      fu: [
        'How do you handle circular dependencies between modules?',
        'What is the forRoot/forFeature pattern?',
        'When should you use @Global() vs always listing a module in imports?',
      ],
    },
  },

  // ─── REQUEST LIFECYCLE ───────────────────────────────────────────────────────

  {
    id: 'nestjs-request-lifecycle',
    cat: 'nestjs',
    color: '#e0234e',
    icon: '🔀',
    title: 'Request Lifecycle: Guards, Interceptors, Pipes, Filters',
    tag: 'Know the exact execution order — Middleware -> Guards -> Interceptors -> Pipes -> Handler -> Interceptors -> Filters',
    overview:
      'Every HTTP request in NestJS passes through a fixed pipeline before reaching the route handler and after leaving it. Middleware runs first — it is Express-compatible and has no NestJS context. Guards run next and decide whether the request is allowed to proceed (authentication, authorisation). Interceptors wrap the handler: they run before (e.g. logging start time) and after (e.g. logging response time, transforming the response). Pipes transform or validate incoming data (route params, query params, request body) immediately before the handler. The handler executes and returns a value. Then the response-side of interceptors runs. If an exception is thrown at any point after guards, exception filters catch it. Binding can happen globally (in main.ts), at controller level, or at individual route level — more specific bindings override broader ones.',
    components: [
      {
        name: 'Middleware',
        icon: '🛣️',
        role: 'Express-compatible function that runs before the NestJS pipeline.',
        detail:
          'Middleware has access to req, res, and next. It cannot access NestJS execution context or DI-injected guards. Apply globally with app.use() or per-module with configure(consumer). Use for request logging, CORS, body parsing, and rate limiting at the raw HTTP level.',
      },
      {
        name: 'Guards',
        icon: '🛡️',
        role: 'Determine whether a request should proceed based on auth/roles/permissions.',
        detail:
          'Guards implement CanActivate and return true/false (or a Promise/Observable). Returning false throws a ForbiddenException automatically. Guards have access to the ExecutionContext and can read custom metadata set by SetMetadata decorators — perfect for role-based access control.',
      },
      {
        name: 'Interceptors',
        icon: '🔁',
        role: 'Wrap the entire handler execution — run logic before and after.',
        detail:
          'Interceptors implement NestInterceptor.intercept(context, next). Calling next.handle() invokes the handler; the returned Observable lets you tap into the response stream. Use for logging, caching, response transformation, and timeouts.',
      },
      {
        name: 'Pipes',
        icon: '🔧',
        role: 'Transform and validate incoming data immediately before the handler receives it.',
        detail:
          'Pipes implement PipeTransform.transform(value, metadata). Built-in pipes include ValidationPipe (class-validator), ParseIntPipe, ParseUUIDPipe. Throw BadRequestException to reject invalid input.',
      },
      {
        name: 'Exception Filters',
        icon: '🎣',
        role: 'Catch exceptions thrown anywhere in the pipeline and shape the HTTP error response.',
        detail:
          'Filters implement ExceptionFilter.catch(exception, host). Use @Catch(HttpException) to target a specific exception type or @Catch() to catch everything. Filters run after the handler and interceptors when an exception propagates.',
      },
      {
        name: 'Order matters',
        icon: '📋',
        role: 'The pipeline sequence is fixed — understanding it prevents misplaced logic.',
        detail:
          'Incoming: Middleware -> Guards -> Interceptors (before) -> Pipes -> Handler. Outgoing: Handler -> Interceptors (after) -> Exception Filters (on error). Exception filters do NOT run before guards — if a guard throws, a filter catches it.',
      },
    ],
    a: {
      v: 'Airport security + customs process',
      t: 'You arrive at the airport (middleware — basic entry check). Security (guards) decides if you are allowed to board. Your bags go through the scanner (pipes — validate/transform contents). You board the plane (handler). Landing, customs (interceptors after) reviews what you bring back. If anything is wrong, the customs exception desk (exception filter) handles it.',
      tx: 'Each stage has one job. Guards never transform data. Pipes never do auth. Interceptors wrap the whole flight. Filters clean up problems. Mixing responsibilities across stages creates bugs that are hard to trace.',
      s: 'JwtAuthGuard runs before ValidationPipe. LoggingInterceptor wraps both the guard check and the handler. AllExceptionsFilter catches anything that propagates out.',
    },
    te: {
      def: 'The NestJS request pipeline is a fixed sequence of middleware, guards, interceptors, pipes, the route handler, interceptors again (response side), and exception filters. Each stage has a single responsibility and a well-defined interface.',
      types: [
        {
          n: 'Global binding',
          d: 'app.useGlobalGuards(), app.useGlobalPipes(), app.useGlobalInterceptors(), app.useGlobalFilters() — applies to every route in the application.',
        },
        {
          n: 'Controller-level binding',
          d: '@UseGuards(), @UseInterceptors(), @UsePipes(), @UseFilters() on the controller class — applies to all routes in that controller.',
        },
        {
          n: 'Route-level binding',
          d: 'Same decorators on an individual handler method — applies only to that route, overrides broader bindings.',
        },
      ],
      when: 'Put auth in guards, logging/timing in interceptors, validation in pipes, and error shaping in filters. Never do auth in middleware (no NestJS context) or validation in guards (wrong abstraction).',
      trade:
        'The fixed pipeline is opinionated but predictable. Every NestJS developer knows where auth lives, where validation lives, and where error handling lives — making codebases consistent and onboarding fast.',
      code: `// jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedException('No token provided');
    try {
      request.user = this.jwt.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

// logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const req = context.switchToHttp().getRequest();
    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        console.log(req.method + ' ' + req.url + ' - ' + ms + 'ms');
      }),
    );
  }
}

// all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      statusCode: status,
      message: exception instanceof Error ? exception.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}

// main.ts — global binding
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(3000);
}
bootstrap();

// user.controller.ts — controller-level guard, route-level pipe override
import { Controller, Get, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';

@Controller('users')
@UseGuards(JwtAuthGuard)           // applied to all routes in this controller
@UseInterceptors(LoggingInterceptor)
export class UserController {
  @Post()
  create(@Body() dto: CreateUserDto) {  // ValidationPipe from global binding validates dto
    return 'created';
  }

  @Get()
  findAll() {
    return [];
  }
}`,
      rw: {
        ex: [
          'JwtAuthGuard on every controller — single place to enforce authentication across all routes',
          'Global ValidationPipe with whitelist: true — strips unknown properties from every request body automatically',
          'LoggingInterceptor globally — measures response time for every route without touching handler code',
          'AllExceptionsFilter globally — consistent error response shape regardless of where the exception is thrown',
        ],
        cs: 'Express middleware chains inspired NestJS\'s pipeline but NestJS adds typed, class-based stages. Laravel\'s middleware pipeline is the closest PHP equivalent — each stage has an explicit interface and a defined execution order.',
      },
    },
    interview: {
      q: 'What is the exact execution order of NestJS request pipeline?',
      a: 'Incoming order: (1) Middleware — runs first, Express-compatible, no NestJS context. (2) Guards — canActivate() determines if the request proceeds; false throws 403. (3) Interceptors — intercept() is called; next.handle() has not been called yet so handler has not run. (4) Pipes — transform/validate each @Body(), @Param(), @Query() argument. (5) Route handler — the @Get()/@Post() method executes. Outgoing order: (6) Interceptors again — the Observable returned by next.handle() emits the handler result; tap/map operators here. (7) Exception filters — catch any exception thrown at any step from Guards onward. Middleware exceptions are NOT caught by NestJS exception filters.',
      fu: [
        'What is the difference between Middleware and Interceptors?',
        'When do exception filters run?',
        'Can a Guard access the response object?',
      ],
    },
  },

  // ─── CUSTOM DECORATORS ───────────────────────────────────────────────────────

  {
    id: 'nestjs-decorators',
    cat: 'nestjs',
    color: '#e0234e',
    icon: '🏷️',
    title: 'Custom Decorators & Metadata',
    tag: 'NestJS is decorator-driven — Reflect.metadata powers the entire DI and routing system',
    overview:
      'TypeScript decorators are functions that receive the target class, method, or parameter at class-definition time and can attach metadata or wrap behaviour. Reflect.metadata (from the reflect-metadata polyfill) is the storage mechanism — decorators write metadata, other code reads it. NestJS uses this internally for everything: @Controller stores the route prefix as metadata, @Injectable marks a class for DI, @Get stores the HTTP method and path. You build on the same system with createParamDecorator (extract custom values from the request), SetMetadata (attach arbitrary metadata to a handler), and Reflector (read that metadata inside guards and interceptors). Composing multiple decorators into one with applyDecorators keeps controller methods clean and DRY.',
    components: [
      {
        name: 'createParamDecorator',
        icon: '📌',
        role: 'Create a custom parameter decorator that extracts a value from the request.',
        detail:
          'createParamDecorator((data, ctx) => ...) returns a decorator you apply to handler parameters. The factory receives any argument passed to the decorator and the ExecutionContext. Use it to extract request.user, request.tenantId, or any custom request property set by middleware or guards.',
      },
      {
        name: 'SetMetadata',
        icon: '🏷️',
        role: 'Attach arbitrary key-value metadata to a controller class or route handler.',
        detail:
          'SetMetadata(key, value) returns a decorator that calls Reflect.defineMetadata(key, value, target). Guards and interceptors then read this metadata via Reflector to make decisions — the canonical example is attaching required roles to a route.',
      },
      {
        name: 'Reflector',
        icon: '🔍',
        role: 'Read metadata attached by SetMetadata inside guards and interceptors.',
        detail:
          'Inject Reflector and call reflector.getAllAndOverride(key, [handler, controller]) to read metadata, preferring the most specific scope. getAllAndMerge() merges arrays from handler and controller levels.',
      },
      {
        name: 'applyDecorators',
        icon: '🎨',
        role: 'Compose multiple decorators into a single reusable decorator.',
        detail:
          'applyDecorators(...decorators) applies each decorator in order. Use it to bundle @UseGuards, Swagger annotations, and @SetMetadata into one @Auth() or @AdminOnly() decorator that keeps controllers readable.',
      },
      {
        name: 'Custom class decorators',
        icon: '🏗️',
        role: 'Attach metadata or modify the class constructor at definition time.',
        detail:
          'Class decorators receive the constructor as their argument. You can attach metadata (Reflect.defineMetadata) or wrap the constructor. NestJS\'s own @Controller and @Injectable are class decorators.',
      },
      {
        name: 'Metadata keys',
        icon: '🔑',
        role: 'String or Symbol constants that namespace metadata to prevent collisions.',
        detail:
          'Define metadata keys as exported constants (e.g. export const ROLES_KEY = "roles") rather than inline strings. This prevents typos and makes imports the source of truth for the key name.',
      },
    ],
    a: {
      v: 'Luggage tags at an airport',
      t: 'When you check in a bag, the airline attaches a tag with your destination, priority class, and flight number. Every handler along the way (baggage belt, loader, sorter) reads the tag to know what to do with the bag — without you having to tell each one directly.',
      tx: 'SetMetadata is the luggage tag. The guard/interceptor is the baggage handler reading the tag. The bag itself (the route handler) does not need to know who will read its tag or when.',
      s: '@Roles("admin") attaches "admin" as metadata. RolesGuard reads it via Reflector and checks request.user.roles. The controller method knows nothing about the guard logic.',
    },
    te: {
      def: 'TypeScript decorators are factory functions invoked at class-definition time. They use Reflect.metadata to attach typed metadata. NestJS reads this metadata at request time via the Reflector service to drive guards, pipes, and interceptors.',
      types: [
        {
          n: 'Parameter decorator',
          d: 'Created with createParamDecorator. Extracts a value from ExecutionContext and passes it as a handler argument.',
        },
        {
          n: 'Metadata decorator',
          d: 'Created with SetMetadata. Stores arbitrary data on the handler or class; read later by Reflector inside guards/interceptors.',
        },
        {
          n: 'Composite decorator',
          d: 'Created with applyDecorators. Bundles multiple decorators into one for cleaner controllers.',
        },
      ],
      when: 'Create a param decorator whenever you find yourself accessing request.user (or any custom request property) in multiple handlers. Create a metadata + guard pair whenever you need declarative, reusable authorisation rules.',
      trade:
        'Decorators are declarative and DRY, but they make control flow implicit — a developer reading @Roles("admin") must know to look for RolesGuard. Document decorator semantics clearly and keep the guard logic cohesive.',
      code: `// current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    // If a specific field is requested (e.g. @CurrentUser('email')), return it
    return data ? user?.[data] : user;
  },
);

// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// public.decorator.ts — skip auth guard for public routes
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check @Public() first — skip auth entirely
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
}

// api-auth.decorator.ts — composite decorator
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';

export function Auth(...roles: string[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}

// user.controller.ts — clean, declarative
import { Controller, Get, Post } from '@nestjs/common';

@Controller('users')
export class UserController {
  @Get('me')
  @Auth()                          // JWT required, no specific role
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Post('admin-action')
  @Auth('admin')                   // JWT + admin role required
  adminAction(@CurrentUser('email') email: string) {
    return 'Admin: ' + email;
  }

  @Get('public')
  @Public()                        // No auth required
  publicEndpoint() {
    return 'anyone can see this';
  }
}

// Reflect internals — what SetMetadata does under the hood
Reflect.defineMetadata('roles', ['admin'], UserController.prototype, 'adminAction');
// What Reflector.getAllAndOverride does:
const roles = Reflect.getMetadata('roles', UserController.prototype, 'adminAction');`,
      rw: {
        ex: [
          '@CurrentUser() param decorator used in every authenticated controller instead of req.user casts',
          '@Roles() + RolesGuard for declarative RBAC across all endpoints',
          '@Public() to opt specific routes out of a globally applied JwtAuthGuard',
          'Composite @Auth() decorator bundling guard, Swagger, and metadata into one import',
        ],
        cs: 'Spring Security annotations (@PreAuthorize, @RolesAllowed) in Java are the closest equivalent — method-level security metadata read by an AOP advice (the equivalent of a NestJS guard). The TypeScript/Reflect.metadata approach is a JavaScript-native implementation of the same pattern.',
      },
    },
    interview: {
      q: 'How does SetMetadata work with Reflector in guards?',
      a: 'SetMetadata(key, value) returns a decorator that calls Reflect.defineMetadata(key, value, target, propertyKey) using the reflect-metadata polyfill — it attaches arbitrary data to the handler method or controller class at definition time, before any request arrives. At request time, the guard\'s canActivate() method runs. The guard injects Reflector (NestJS\'s wrapper around Reflect.getMetadata). It calls reflector.getAllAndOverride(key, [context.getHandler(), context.getClass()]) — this reads the metadata from the route handler first, then the controller class, returning the first defined value. getAllAndMerge() is used when the metadata is an array and you want to combine handler-level and controller-level values. The guard then uses the retrieved value to make its allow/deny decision. The handler itself is completely unaware of the guard\'s logic — the decorator is the only coupling point.',
      fu: [
        'What is createParamDecorator and when would you create one?',
        'How does NestJS use Reflect.metadata internally?',
        'What is the difference between getAllAndOverride and getAllAndMerge on Reflector?',
      ],
    },
  },

  // ─── MICROSERVICES ───────────────────────────────────────────────────────────

  {
    id: 'nestjs-microservices',
    cat: 'nestjs',
    color: '#e0234e',
    icon: '🔌',
    title: 'NestJS Microservices',
    tag: 'NestJS has built-in microservice support — TCP, Redis, NATS, Kafka, gRPC transports',
    overview:
      'NestJS provides a first-class microservice layer that sits alongside (or replaces) the HTTP layer. Microservices communicate via message patterns — either request-response (@MessagePattern, where the caller waits for a reply) or event-based (@EventPattern, fire-and-forget). The transport layer is pluggable: TCP (default, in-process testing), Redis pub/sub, NATS, Kafka, RabbitMQ, and gRPC are all supported via transport adapters. A hybrid application bootstraps both an HTTP server (for public API) and a microservice listener (for inter-service communication) in the same process. ClientProxy is the caller-side abstraction — send() for request-response (returns an Observable), emit() for fire-and-forget. Errors in microservices are wrapped in RpcException so the transport layer can serialise and propagate them.',
    components: [
      {
        name: '@MessagePattern',
        icon: '📨',
        role: 'Request-response pattern — caller sends a message and waits for the reply.',
        detail:
          '@MessagePattern("get_user") decorates a handler that receives a payload and must return a value. The caller uses ClientProxy.send(pattern, payload) which returns an Observable that resolves when the microservice responds.',
      },
      {
        name: '@EventPattern',
        icon: '📣',
        role: 'Fire-and-forget event — caller emits and does not wait for a response.',
        detail:
          '@EventPattern("user_created") decorates a handler that processes the event asynchronously. The caller uses ClientProxy.emit(pattern, payload) which returns immediately. Use for notifications, audit logs, cache invalidation.',
      },
      {
        name: 'ClientProxy (.send() vs .emit())',
        icon: '📡',
        role: 'Caller-side abstraction for sending messages to a microservice.',
        detail:
          'ClientProxy.send(pattern, payload) is request-response — it returns an Observable<Response>. Wrap with firstValueFrom() to get a Promise. ClientProxy.emit(pattern, payload) is fire-and-forget — returns an Observable<void> that completes immediately after the message is dispatched.',
      },
      {
        name: 'Transport options',
        icon: '🚌',
        role: 'Pluggable transport layer that serialises and routes messages between services.',
        detail:
          'Transport.TCP (default, binary, in-process). Transport.REDIS (pub/sub via Redis). Transport.NATS (lightweight pub/sub). Transport.KAFKA (high-throughput, persistent log). Transport.GRPC (binary protocol with protobuf schema). Each is configured via the transport and options keys in createMicroservice().',
      },
      {
        name: 'Hybrid application',
        icon: '🔄',
        role: 'Single process that listens on both HTTP and a microservice transport.',
        detail:
          'Call app.connectMicroservice(options) before app.listen() to attach a microservice listener to the HTTP app. Call app.startAllMicroservices() to start listening. The process handles both HTTP requests and microservice messages.',
      },
    ],
    a: {
      v: 'Restaurant kitchen and front-of-house',
      t: 'The waiter (API gateway) takes your order (HTTP request) and sends a ticket to the kitchen (microservice) via the order rail (transport). The kitchen either responds with the dish (@MessagePattern — request-response) or fires a notification to the bar to start a drink (@EventPattern — fire-and-forget).',
      tx: 'The transport (TCP/Redis/Kafka) is the order rail. @MessagePattern is for dishes — you need the result before serving. @EventPattern is for notifications — send and move on.',
      s: 'UserMicroservice handles @MessagePattern("get_user"). ApiGateway uses ClientProxy.send("get_user", { id }) wrapped in firstValueFrom(). @EventPattern("user_created") triggers email notification without blocking the registration response.',
    },
    te: {
      def: 'NestJS microservices use a transport-agnostic message pattern system. @MessagePattern handles request-response; @EventPattern handles fire-and-forget. ClientProxy abstracts the transport. RpcException propagates errors across service boundaries.',
      types: [
        {
          n: 'Request-Response',
          d: 'ClientProxy.send() + @MessagePattern. Caller blocks until the microservice replies. Use for data fetching and commands that return results.',
        },
        {
          n: 'Event-Based',
          d: 'ClientProxy.emit() + @EventPattern. Caller fires and continues. Use for side-effects: notifications, audit, cache busting.',
        },
        {
          n: 'Hybrid App',
          d: 'HTTP + microservice listener in one process. Useful for gradual microservice extraction from a monolith.',
        },
      ],
      when: 'Use @MessagePattern when the caller needs a result (get user, create order with ID). Use @EventPattern when the caller does not need a reply (user signed up, payment processed). Use Kafka/NATS for high-throughput event streams; use TCP for low-latency internal calls.',
      trade:
        'Microservices add network latency, serialisation overhead, and distributed tracing complexity compared to in-process function calls. The benefit is independent deployability and horizontal scaling of individual services.',
      code: `// user.microservice.ts — microservice application
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.REDIS,
    options: { host: 'localhost', port: 6379 },
  });
  await app.listen();
}
bootstrap();

// user.controller.ts — inside the microservice
import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload, RpcException } from '@nestjs/microservices';

@Controller()
export class UserMicroserviceController {
  @MessagePattern('get_user')
  async getUser(@Payload() data: { id: string }) {
    const user = await this.userService.findById(data.id);
    if (!user) throw new RpcException({ statusCode: 404, message: 'User not found' });
    return user;
  }

  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: { userId: string; email: string }) {
    await this.notificationService.sendWelcomeEmail(data.email);
    // No return value — fire-and-forget
  }
}

// api-gateway.service.ts — HTTP service calling the microservice
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class ApiGatewayService {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  async getUser(id: string) {
    try {
      return await firstValueFrom(
        this.userClient
          .send('get_user', { id })
          .pipe(timeout(5000)), // 5 second timeout
      );
    } catch (err: any) {
      if (err?.statusCode === 404) throw new NotFoundException('User not found');
      throw err;
    }
  }

  async notifyUserCreated(userId: string, email: string) {
    this.userClient.emit('user_created', { userId, email }); // fire-and-forget
  }
}

// app.module.ts — register ClientProxy with Redis transport
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.REDIS,
        options: { host: 'localhost', port: 6379 },
      },
    ]),
  ],
  providers: [ApiGatewayService],
})
export class AppModule {}

// Hybrid app — HTTP + microservice listener in one process
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice({
    transport: Transport.REDIS,
    options: { host: 'localhost', port: 6379 },
  });
  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();`,
      rw: {
        ex: [
          '@MessagePattern("get_user") in UserService microservice, called by API Gateway with ClientProxy.send()',
          '@EventPattern("order_placed") triggers inventory deduction and email notification independently',
          'Hybrid app for gradual monolith decomposition — HTTP stays up while microservice listeners are added one by one',
          'firstValueFrom() + timeout() operator for request-response calls with bounded latency',
        ],
        cs: 'Netflix uses event-driven microservices extensively. Their Studio Engineering team has open-sourced similar patterns where an API gateway calls internal gRPC microservices for data and emits Kafka events for async processing — the same request-response vs fire-and-forget split NestJS models with @MessagePattern and @EventPattern.',
      },
    },
    interview: {
      q: 'What is the difference between @MessagePattern and @EventPattern?',
      a: '@MessagePattern implements request-response communication. The caller uses ClientProxy.send(pattern, payload) which returns an Observable that waits for the microservice to return a value. The microservice handler must return a value (or throw RpcException for errors). This is synchronous from the caller\'s perspective — you can await firstValueFrom(client.send(...)). @EventPattern implements fire-and-forget. The caller uses ClientProxy.emit(pattern, payload) which dispatches the message and returns immediately without waiting. The microservice handler processes the event asynchronously and returns void. Use @MessagePattern when you need the result of the operation (get user by ID, create entity and return it). Use @EventPattern for side-effects where the caller does not need confirmation (send welcome email, invalidate cache, write audit log).',
      fu: [
        'How do you handle errors in NestJS microservices?',
        'How do you create a hybrid application in NestJS?',
        'When would you choose Kafka over Redis as a transport?',
      ],
    },
  },

  // ─── TESTING ─────────────────────────────────────────────────────────────────

  {
    id: 'nestjs-testing',
    cat: 'nestjs',
    color: '#e0234e',
    icon: '🧪',
    title: 'Testing in NestJS',
    tag: 'NestJS makes testing easy with Test.createTestingModule — mock any provider with useValue',
    overview:
      'NestJS provides a dedicated testing utility — Test.createTestingModule() — that bootstraps a lightweight DI container for tests. You declare the same module metadata as production code but swap real providers with mocks using useValue (inline mock object), useClass (replacement class), or useFactory. Unit tests test a single provider in isolation: mock all its dependencies so the test only exercises the provider\'s own logic. E2e tests boot the full NestJS application (or a subset) and send real HTTP requests via supertest — these verify the complete request pipeline including guards, pipes, and interceptors. Guards, interceptors, and pipes each have their own testable interface and can be unit tested by calling canActivate(), intercept(), or transform() directly. ModuleRef.get() lets you retrieve any provider from the DI container inside a test, useful for verifying interactions with injected services.',
    components: [
      {
        name: 'Test.createTestingModule()',
        icon: '🏗️',
        role: 'Bootstrap a DI container for tests with the same module metadata as production.',
        detail:
          'Accepts the same object as @Module() (imports, controllers, providers). Returns a TestingModuleBuilder where you override providers. Call .compile() to build the container and get a TestingModule. Then call module.get(Token) to retrieve instances.',
      },
      {
        name: 'useValue (mock)',
        icon: '🎭',
        role: 'Replace a provider with an inline mock object for a test.',
        detail:
          '{ provide: UserRepository, useValue: { findOne: jest.fn(), save: jest.fn() } } swaps the real repository with a plain object. The DI container injects this object wherever UserRepository is requested in the test module.',
      },
      {
        name: 'useClass (replacement)',
        icon: '🔄',
        role: 'Replace a provider with an alternative class.',
        detail:
          '{ provide: MailService, useClass: MockMailService } tells the DI container to instantiate MockMailService wherever MailService is requested. Useful when the mock has its own logic or state.',
      },
      {
        name: 'ModuleRef',
        icon: '📋',
        role: 'Access any provider from the DI container at runtime (or in tests).',
        detail:
          'Inject ModuleRef and call moduleRef.get(Token) to retrieve a provider instance. In tests this lets you grab providers after compile() and inspect or spy on them.',
      },
      {
        name: 'INestApplication + supertest',
        icon: '🌐',
        role: 'Full e2e testing — boot the real app and make HTTP requests in tests.',
        detail:
          'await NestFactory.create() or Test.createTestingModule().compile().createNestApplication() boots the full app. Pass app.getHttpServer() to supertest\'s request() to fire real HTTP requests and assert on responses.',
      },
      {
        name: 'jest.fn() / jest.spyOn()',
        icon: '🕵️',
        role: 'Create mock functions and spy on real ones to assert call behaviour.',
        detail:
          'jest.fn() creates a standalone mock. jest.spyOn(object, "method") wraps a real method with a spy that records calls. Use .mockResolvedValue(result) to control what an async mock returns. Use expect(spy).toHaveBeenCalledWith(args) to assert interactions.',
      },
    ],
    a: {
      v: 'Flight simulator vs real flight',
      t: 'A flight simulator (unit test) lets you test a pilot\'s reactions to engine failure without a real plane. You control exactly what the instruments show (mock dependencies) and verify the pilot\'s actions (method calls). An actual test flight (e2e test) verifies the whole system works together — real plane, real weather, real controls.',
      tx: 'Unit tests give fast, isolated feedback on individual components. E2e tests verify the integrated system. NestJS Test.createTestingModule is the simulator — it wires up DI without the real infrastructure.',
      s: 'Unit test UserService with a mocked UserRepository — no database. E2e test POST /users — real ValidationPipe, real JwtAuthGuard, response from the actual route handler.',
    },
    te: {
      def: 'NestJS testing uses Test.createTestingModule() to build an isolated DI container. Unit tests mock dependencies with useValue/useClass; e2e tests boot the full app and use supertest for HTTP assertions.',
      types: [
        {
          n: 'Unit Test',
          d: 'Tests one provider in isolation. All dependencies are mocked with useValue or jest.fn(). Fast, no I/O, run on every commit.',
        },
        {
          n: 'Integration Test',
          d: 'Tests multiple real providers wired together in a TestingModule, possibly with a real database. Slower, catches wiring bugs.',
        },
        {
          n: 'E2e Test',
          d: 'Boots the full NestJS application and makes HTTP requests via supertest. Verifies the complete pipeline including guards, pipes, and serialisation.',
        },
      ],
      when: 'Unit test every service method — especially error paths. E2e test every public API endpoint at least once. Test guards and pipes individually by calling their interface methods directly with crafted ExecutionContext mocks.',
      trade:
        'Unit tests are fast but do not catch integration bugs (wrong module wiring, missing exports). E2e tests catch everything but are slow and require infrastructure (DB, Redis). A healthy test suite has many unit tests, some integration tests, and a smaller number of e2e tests.',
      code: `// user.service.spec.ts — unit test with mocked repository
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './user.entity';
import { ConflictException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo, // swap real TypeORM repo with mock
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a user', async () => {
    mockRepo.findOne.mockResolvedValue(null); // email not taken
    mockRepo.create.mockReturnValue({ id: '1', email: 'a@b.com' });
    mockRepo.save.mockResolvedValue({ id: '1', email: 'a@b.com' });

    const result = await service.createUser({ email: 'a@b.com', password: 'secret' });
    expect(result.email).toBe('a@b.com');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException if email already exists', async () => {
    mockRepo.findOne.mockResolvedValue({ id: '1', email: 'a@b.com' });
    await expect(service.createUser({ email: 'a@b.com', password: 'x' }))
      .rejects.toThrow(ConflictException);
  });
});

// roles.guard.spec.ts — test a guard directly
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();
    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should allow access when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = { getHandler: jest.fn(), getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { roles: [] } }) }) } as unknown as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const ctx = { getHandler: jest.fn(), getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { roles: ['user'] } }) }) } as unknown as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(false);
  });
});

// app.e2e-spec.ts — e2e test with supertest
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UserService)
      .useValue({ createUser: jest.fn().mockResolvedValue({ id: '1', email: 'a@b.com' }) })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(() => app.close());

  it('POST /users should create a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'a@b.com', password: 'secret123' })
      .expect(201);
    expect(res.body.email).toBe('a@b.com');
  });

  it('POST /users should return 400 for invalid body', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ email: 'not-an-email' })
      .expect(400);
  });
});`,
      rw: {
        ex: [
          'useValue with jest.fn() mocks for repository methods — test service logic without a real DB',
          'overrideProvider() in e2e tests to swap slow or external services with fast fakes',
          'jest.spyOn(service, "findById") to assert a method was called with the right arguments',
          'ModuleRef.get(ConfigService) in a test helper to read config values without re-injecting them',
        ],
        cs: 'Angular\'s TestBed is architecturally identical to NestJS\'s Test.createTestingModule — both use the same DI container and provider override mechanism. The pattern originated in Angular and was ported directly to NestJS, making the testing story feel native to developers familiar with either framework.',
      },
    },
    interview: {
      q: 'How do you mock a service dependency in NestJS unit tests?',
      a: 'Use Test.createTestingModule() with a useValue provider override. In the providers array, instead of the real class, supply { provide: RealClass, useValue: { method: jest.fn() } }. The DI container injects this mock object wherever RealClass is constructor-injected. After module.compile(), retrieve the class under test with module.get(ClassUnderTest) — its constructor will have received the mock. Use mockRepo.findOne.mockResolvedValue(result) to control what the mock returns for each test case, and expect(mockRepo.save).toHaveBeenCalledWith(expectedArgs) to assert interactions. Call jest.clearAllMocks() in afterEach to reset call counts between tests so one test\'s setup does not leak into the next.',
      fu: [
        'What is the difference between unit and e2e tests in NestJS?',
        'How do you test a Guard?',
        'When would you use useClass instead of useValue for a mock?',
      ],
    },
  },
];

import { Concept } from '../types';

export const LARAVEL_CONCEPTS: Concept[] = [
  // ─── SERVICE CONTAINER ───────────────────────────────────────────────────────

  {
    id: 'laravel-service-container',
    cat: 'laravel',
    color: '#ff2d20',
    icon: '📦',
    title: 'Service Container & Dependency Injection',
    tag: 'Laravel IoC container auto-resolves dependencies — bind, singleton, service providers, facades',
    overview:
      'The Laravel service container is an Inversion of Control (IoC) container — a registry that knows how to build objects and resolve their dependencies automatically. bind() registers a factory: every time the container resolves the binding, it calls the factory and returns a new instance. singleton() registers a factory that is called once — the same instance is returned on every subsequent resolution. Interface bindings map an abstract interface to a concrete implementation: when Laravel sees PaymentGateway in a constructor, it injects StripeGateway — you swap implementations by changing one line in a service provider. Service providers are the bootstrap mechanism: register() wires bindings into the container, boot() runs after all providers are registered (safe to use other bindings). Facades are static proxies backed by the container — Cache::get("key") resolves the CacheManager from the container and calls get() on it. Contextual binding resolves different implementations for the same interface depending on which class is being constructed.',
    a: {
      v: 'Smart cafeteria ordering system',
      t: 'The service container is a smart cafeteria. When a chef (class) needs ingredients (dependencies), they do not go shopping — they declare what they need and the cafeteria manager (container) delivers it. bind() is ordering from a new supplier each time. singleton() is keeping one batch on the counter all day — everyone gets from the same pot. Facades are the self-service kiosks — they look like direct access but route through the manager.',
      tx: 'bind() = new instance per resolution. singleton() = shared instance for the entire request lifecycle. Interface binding = swappable implementations. Facades = static syntax over dynamic container resolution. Service providers = the configuration file that tells the cafeteria what to stock.',
      s: 'Your PaymentController constructor declares "PaymentGateway $gateway" — during testing you bind MockGateway in a service provider. In production, StripeGateway is bound. The controller never changes — only the binding changes. This is the Open/Closed principle in action.',
    },
    te: {
      def: 'The Laravel service container is an IoC container that automatically resolves class dependencies by inspecting constructor type hints and resolving them from registered bindings. bind() creates new instances per resolution; singleton() shares one instance. Service providers configure the container. Facades are static proxies over container-resolved instances.',
      types: [
        {
          n: 'bind()',
          d: 'Registers a factory closure. A new instance is created every time the binding is resolved from the container.',
        },
        {
          n: 'singleton()',
          d: 'Registers a factory closure that is called once. The same instance is returned on all subsequent resolutions within the application lifecycle.',
        },
        {
          n: 'Facade',
          d: 'Static proxy over a container-resolved instance. Cache::get() resolves the cache manager from the container. Enables static syntax while remaining testable (Facade::fake()).',
        },
      ],
      when: 'Use bind() for objects that should not be shared (per-request state). Use singleton() for expensive-to-create objects (DB connections, HTTP clients, config). Use interface binding when you need to swap implementations (different payment gateways per environment). Use facades for quick access to framework services in controllers and blade templates.',
      trade:
        'Heavy container usage adds resolve-time overhead — negligible for web requests but measurable in scripts resolving thousands of bindings. Facades make code look like static calls but are actually dynamic — they can be harder to trace in a debugger. Over-use of the container for simple objects (that could just be newed up) adds indirection without benefit.',
      code: `<?php
// ── Interface and implementations ─────────────────────────────────────────────

interface PaymentGateway {
    public function charge(int $amountCents): bool;
}

class StripeGateway implements PaymentGateway {
    public function charge(int $amountCents): bool {
        // real Stripe API call
        return true;
    }
}

// ── Service provider: register() wires bindings ──────────────────────────────

class AppServiceProvider extends ServiceProvider {
    public function register(): void {
        // bind(): new instance each time
        $this->app->bind(PaymentGateway::class, StripeGateway::class);

        // singleton(): same instance every time
        $this->app->singleton(HttpClient::class, function ($app) {
            return new HttpClient(['timeout' => 30]);
        });

        // Contextual binding: different impl for different consumers
        $this->app->when(ReportController::class)
            ->needs(PaymentGateway::class)
            ->give(MockGateway::class);
    }

    public function boot(): void {
        // Safe to use other bindings here — all providers registered
        Gate::define('admin', fn (User $user) => $user->is_admin);
    }
}

// ── Controller: auto-resolved by container ────────────────────────────────────

class OrderController extends Controller {
    public function __construct(
        private readonly PaymentGateway $gateway,  // injected by container
        private readonly OrderRepository $orders,  // also auto-resolved
    ) {}

    public function checkout(Request $request): JsonResponse {
        $order = $this->orders->create($request->validated());
        $this->gateway->charge($order->total_cents);
        return response()->json(['order_id' => $order->id]);
    }
}

// ── Facade: static proxy with real container resolution ───────────────────────

use Illuminate\Support\Facades\Cache;

$value = Cache::remember('users.count', 3600, fn () => User::count());

// ── Facade::getFacadeAccessor reveals the container key ───────────────────────

class Cache extends Facade {
    protected static function getFacadeAccessor(): string {
        return 'cache';  // container key for CacheManager
    }
}`,
      rw: {
        ex: [
          'Laravel Telescope uses singleton() to share the same recording context across all requests in a single process',
          'Queued job classes are resolved from the container on the worker — dependencies are injected fresh per job',
          'Cache::fake() in tests replaces the real cache manager with an array-backed fake — Facade testing without mocking',
          'Laravel Octane (Swoole/RoadRunner) shares singletons across requests — state in singletons persists between requests, requiring careful design',
        ],
        cs: 'Laravel Nova (Laravel\'s admin panel product) is built entirely on the service container — every Nova tool, resource, and action is registered via service providers. The container resolves tool dependencies and injects authorization policies automatically. This architecture lets Nova extensions register themselves without touching framework code.',
      },
    },
    interview: {
      q: 'What is the difference between bind() and singleton()?',
      a: 'bind() registers a factory that is called every time the binding is resolved — each resolution gets a fresh instance. This is correct for objects with per-request state or mutable internal state you do not want to share. singleton() registers a factory that is called once — the first resolution creates the instance, and all subsequent resolutions return the exact same object. This is correct for expensive-to-create objects (database connection pools, HTTP clients, configuration objects) where you want one shared instance per process lifetime. The difference matters in a long-running context like Laravel Octane (Swoole server) where a singleton persists across multiple HTTP requests — if it holds request-specific state, you have a bug. In a standard PHP-FPM setup, singletons are effectively per-request anyway (process dies after each request), so the distinction matters more in Octane/queue worker contexts.',
      fu: [
        'How do Facades work under the hood?',
        'What is the difference between register() and boot() in a service provider?',
      ],
    },
  },

  // ─── ELOQUENT ORM ────────────────────────────────────────────────────────────

  {
    id: 'laravel-eloquent',
    cat: 'laravel',
    color: '#ff2d20',
    icon: '🗄️',
    title: 'Eloquent ORM & Relationships',
    tag: 'Eloquent ActiveRecord — powerful but the N+1 problem will kill your performance without eager loading',
    overview:
      'Eloquent implements the ActiveRecord pattern — each model class represents a database table, and model instances represent rows. Relationships (hasOne, hasMany, belongsTo, belongsToMany, morphTo) are defined as methods returning relationship objects, enabling both lazy loading (accessing $user->posts triggers a query) and eager loading (with("posts") loads all posts in one query). The N+1 problem is the classic ORM pitfall: fetching 100 users then accessing $user->posts for each triggers 101 queries (1 for users + 100 for each user\'s posts). with() solves this with eager loading (2 queries: 1 for users, 1 for all their posts using WHERE IN). Local scopes add reusable query constraints. Observers hook into model events (creating, created, updating, deleting) for side effects like cache invalidation. Polymorphic relationships let a single model belong to multiple other model types via a type column.',
    a: {
      v: 'Library with research assistants',
      t: 'Eloquent without eager loading is like asking a research assistant to fetch a list of 100 authors, then sending them back to the archives 100 separate times to get each author\'s books. Eager loading is asking them to get all authors and all their books in two trips — same result, 99 fewer trips. The N+1 problem is why your API goes from 5ms to 500ms under load.',
      tx: 'Lazy loading is convenient for prototyping — access $user->posts and Eloquent figures it out. But in a loop it is a disaster. Eager loading (with()) is one extra line that changes O(n) queries to O(1). Scopes are reusable query fragments — activeUsers() adds WHERE active = 1 wherever you call it.',
      s: 'Your admin panel lists 50 orders with customer names. Without eager loading: 51 queries per page load. With Order::with("customer")->get(): 2 queries. The fix is one word. The Laravel Debugbar or Telescope query log reveals N+1 immediately.',
    },
    te: {
      def: 'Eloquent ORM implements ActiveRecord — models map to tables, relationships are defined as methods, and the query builder fluently constructs SQL. Eager loading (with()) solves the N+1 problem by batching related model queries. Scopes add reusable query constraints. Observers react to model lifecycle events.',
      types: [
        {
          n: 'Eager Loading (with())',
          d: 'Load related models in one additional query using WHERE IN. Fixes N+1. Use load() after fetching to eager-load on an existing collection.',
        },
        {
          n: 'Local Scope',
          d: 'Method prefixed with "scope" on the model — chainable, reusable query constraint. scopeActive() becomes ->active() in queries.',
        },
        {
          n: 'Observer',
          d: 'Class that listens to model events (creating, updating, deleting, etc.). Register in a service provider. Used for cache invalidation, audit logs, side effects.',
        },
      ],
      when: 'Use with() whenever you access relationships in a loop or collection — profile with Debugbar/Telescope to catch N+1. Use scopes for repeated WHERE clauses (active users, published posts, recent orders). Use observers for decoupled side effects. Use polymorphic relationships for comments, tags, or media that can belong to multiple model types.',
      trade:
        'Eloquent ActiveRecord couples database and business logic in the model — large models become god objects. For complex domains, consider separating query logic (repositories) from model definitions. with() performs a second query using WHERE IN — for very large ID sets this can be slower than a JOIN. Use withCount() for counts to avoid loading entire related collections.',
      code: `<?php
// ── N+1 problem: BAD vs GOOD ─────────────────────────────────────────────────

// BAD: 1 + N queries (N = number of posts)
$posts = Post::all();                    // 1 query: SELECT * FROM posts
foreach ($posts as $post) {
    echo $post->author->name;            // N queries: SELECT * FROM users WHERE id = ?
}

// GOOD: 2 queries total
$posts = Post::with('author')->get();   // 2 queries: posts + all authors via WHERE IN
foreach ($posts as $post) {
    echo $post->author->name;           // no additional queries — already loaded
}

// Nested eager loading: posts with author AND their profile
Post::with('author.profile')->get();

// ── Local scope ───────────────────────────────────────────────────────────────

class User extends Model {
    public function scopeActive($query) {
        return $query->where('active', true);
    }

    public function scopeRecentlyJoined($query, int $days = 30) {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Polymorphic: User morphs to Commentable
    public function comments(): MorphMany {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

// Scopes are chainable
$users = User::active()->recentlyJoined(7)->orderBy('name')->get();

// ── Observer: model event side effects ────────────────────────────────────────

class UserObserver {
    public function created(User $user): void {
        // Runs after INSERT — send welcome email, init preferences
        Mail::to($user->email)->queue(new WelcomeMail($user));
    }

    public function updated(User $user): void {
        // Bust cache on any user update
        Cache::forget('user.' . $user->id);
    }

    public function deleting(User $user): void {
        // Before DELETE — clean up related data not covered by cascade
        $user->apiTokens()->delete();
    }
}

// Register in AppServiceProvider::boot()
User::observe(UserObserver::class);

// ── Polymorphic relationship ──────────────────────────────────────────────────

// Comments can belong to Post OR Video (or any model)
class Comment extends Model {
    public function commentable(): MorphTo {
        return $this->morphTo();
    }
}

$post = Post::find(1);
$post->comments()->create(['body' => 'Great post!']);  // type = 'App\Models\Post'

$video = Video::find(1);
$video->comments()->create(['body' => 'Nice video!']); // type = 'App\Models\Video'

// ── load() eager loading after the fact ──────────────────────────────────────

$users = User::active()->get();         // already fetched
$users->load('posts', 'profile');       // eager-loads on existing collection`,
      rw: {
        ex: [
          'Laravel Telescope detects and highlights N+1 queries in development — shows the duplicate queries with stack traces',
          'with() uses a WHERE IN query — for thousands of IDs this is efficient; Eloquent chunks large sets automatically',
          'Observers are used in e-commerce apps for inventory updates, cache busting, and webhook dispatch on order state changes',
          'withCount("comments") adds a comments_count attribute without loading comments — avoids loading 10k comments to count them',
        ],
        cs: 'Shopify\'s PHP-based predecessor used ActiveRecord patterns similar to Eloquent. Their engineering blog documents N+1 problems at scale — 100 products on a page becoming 400+ queries destroyed response times. The solution was systematic eager loading enforcement via linters and query count assertions in test suites, the same patterns Laravel developers use today.',
      },
    },
    interview: {
      q: 'What is the N+1 problem and how do you fix it?',
      a: 'The N+1 problem occurs when you execute one query to fetch N records and then execute an additional query for each record to fetch related data — resulting in 1 + N total queries. Example: $posts = Post::all() runs 1 query for 100 posts. Accessing $post->author in a foreach runs 100 more queries — one per post. Total: 101 queries when 2 would suffice. Fix: eager loading with with(). Post::with("author")->get() runs 2 queries: one for all posts, and one that fetches all authors using WHERE id IN (1, 2, 3, ...). The related models are then matched in PHP memory — no additional queries. For nested relations use with("author.profile"). For post-fetch loading use $collection->load("author"). Always detect N+1 in development using Laravel Debugbar or Telescope — they show duplicate queries with stack traces. In tests, use DB::enableQueryLog() and assert the count is within expected bounds.',
      fu: [
        'What is the difference between with() and load()?',
        'How do polymorphic relationships work at the database level?',
      ],
    },
  },

  // ─── QUEUES ──────────────────────────────────────────────────────────────────

  {
    id: 'laravel-queues',
    cat: 'laravel',
    color: '#ff2d20',
    icon: '📋',
    title: 'Queues, Jobs & Laravel Horizon',
    tag: 'Laravel Queues offload slow work — email, notifications, processing — to background job workers',
    overview:
      'Laravel Queues decouple slow or unreliable operations from the HTTP request cycle. A job is a PHP class with a handle() method containing the work. dispatch() pushes the serialized job to the configured queue backend (Redis, database, SQS, Beanstalkd). Queue workers (php artisan queue:work) pull jobs from the queue and execute them in separate processes. The HTTP request returns immediately — the user does not wait for the email to send or the PDF to generate. Jobs can be retried on failure ($tries, $backoff), have unique constraints (prevent duplicate jobs), and declare timeouts. Job chaining executes jobs sequentially (chain B starts only if A succeeds). Job batching (Bus::batch()) dispatches a group of jobs and provides callbacks for when all complete or any fail. Laravel Horizon (Redis-only) provides a dashboard for monitoring queue throughput, failed jobs, and worker count, and enables supervisor-based auto-scaling of workers.',
    a: {
      v: 'Restaurant with a ticket system',
      t: 'Without queues, every customer waits at the counter while the chef prepares their entire order. With queues, the cashier takes the order, gives a ticket number, and the customer sits down. The kitchen (workers) processes tickets independently. The cashier is always free for the next customer. If the kitchen burns a dish (job fails), the ticket goes back to the queue (retry) or to the failed orders board (failed jobs table).',
      tx: 'HTTP request = cashier. Job = order ticket. Queue backend (Redis) = ticket board. Worker = kitchen. dispatch() = handing the ticket to the board. Queue::fake() = replacing the board with a whiteboard for testing — you can check what tickets were written without running the kitchen.',
      s: 'Your user registration sends a welcome email and creates a Stripe customer. Synchronously: 400ms per registration. With queued jobs: 5ms registration response, email + Stripe creation happen in the background. Users get a faster experience and failures are retried automatically.',
    },
    te: {
      def: 'Laravel Queues provide an abstraction over multiple queue backends for deferring work to background processes. Jobs are serialized PHP classes dispatched to a queue and executed by workers. Features include retries, timeouts, chaining, batching, and Horizon for Redis-based monitoring.',
      types: [
        {
          n: 'Queue drivers',
          d: 'Redis (production standard — fast, Horizon support), Database (simple, no extra infrastructure), SQS (AWS-managed, highly durable), Beanstalkd, Sync (runs immediately — for local dev/testing).',
        },
        {
          n: 'Job chaining',
          d: 'Bus::chain([JobA, JobB, JobC])->dispatch() — runs jobs sequentially. JobB starts only if JobA succeeds. A failed job cancels remaining chain jobs.',
        },
        {
          n: 'Job batching',
          d: 'Bus::batch([JobA, JobB, JobC])->then(fn)->catch(fn)->dispatch() — parallel execution with completion/failure callbacks. Jobs in a batch run concurrently.',
        },
      ],
      when: 'Queue anything that: takes more than 200ms (email, PDF generation, external API calls), can fail and should retry (payment webhooks, notifications), needs rate limiting (sending 10k emails at 100/min), or is not critical to the HTTP response. Keep synchronous only what the user needs to see immediately.',
      trade:
        'Queued jobs introduce eventual consistency — the job may succeed seconds or minutes after the HTTP response. If a job fails permanently (exceeds $tries), it lands in the failed_jobs table — you need a monitoring strategy. Jobs must be idempotent where possible — network failures can cause retries and you want the same job running twice to be safe. Serialized Eloquent models in jobs can become stale — the model state at dispatch time is stored, not a live reference.',
      code: `<?php
// ── Job class ────────────────────────────────────────────────────────────────

class SendWelcomeEmail implements ShouldQueue {
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;              // retry up to 3 times
    public int $backoff = 60;           // wait 60s between retries
    public int $timeout = 30;           // kill job if it runs > 30s

    public function __construct(private readonly User $user) {}

    public function handle(Mailer $mailer): void {
        $mailer->to($this->user->email)->send(new WelcomeMail($this->user));
    }

    public function failed(Throwable $exception): void {
        // Called after all retries exhausted
        Log::error('Welcome email failed', [
            'user_id' => $this->user->id,
            'error'   => $exception->getMessage(),
        ]);
    }
}

// ── dispatch() vs dispatchSync() ─────────────────────────────────────────────

SendWelcomeEmail::dispatch($user);          // async — pushes to queue
SendWelcomeEmail::dispatchSync($user);      // sync — runs immediately (testing/debugging)
SendWelcomeEmail::dispatch($user)->delay(now()->addMinutes(5)); // delayed dispatch

// ── Job chaining: sequential, each waits for prior ────────────────────────────

use Illuminate\Support\Facades\Bus;

Bus::chain([
    new ProcessPayment($order),
    new SendInvoice($order),
    new NotifyFulfillment($order),
])->catch(function (Throwable $e) {
    Log::error('Order pipeline failed', ['error' => $e->getMessage()]);
})->dispatch();

// ── Batch dispatch: parallel with callbacks ───────────────────────────────────

$batch = Bus::batch([
    new SendEmail($users->slice(0, 500)),
    new SendEmail($users->slice(500, 500)),
    new SendEmail($users->slice(1000, 500)),
])->then(function (Batch $batch) {
    Log::info('All emails sent');
})->catch(function (Batch $batch, Throwable $e) {
    Log::error('Batch failed: ' . $e->getMessage());
})->dispatch();

// ── Queue::fake() in tests ────────────────────────────────────────────────────

use Illuminate\Support\Facades\Queue;

Queue::fake();

$this->post('/register', ['email' => 'a@b.com', 'password' => 'password123']);

Queue::assertPushed(SendWelcomeEmail::class, function (SendWelcomeEmail $job) {
    return $job->user->email === 'a@b.com';
});
Queue::assertPushedOn('high-priority', SendWelcomeEmail::class);`,
      rw: {
        ex: [
          'Laravel Horizon provides real-time dashboard for queue throughput, wait times, and failed jobs — standard for Redis queue production monitoring',
          'Unique jobs (ShouldBeUnique) prevent duplicate jobs from queuing — critical for payment processing where idempotency matters',
          'Rate-limited jobs (RateLimited middleware) throttle processing — send max 100 emails/minute without external tools',
          'Job batches power bulk operations — import 100k CSV rows as 200 batches of 500, with progress tracking via Batch::processedJobs()',
        ],
        cs: 'GitHub Actions uses a similar queue-worker pattern at massive scale — jobs (workflow runs) are pushed to queues, worker runners pull and execute them. The same failure/retry/timeout patterns Laravel implements are present in every production job queue system. Laravel Horizon\'s auto-scaling (scaling workers based on queue depth) mirrors Kubernetes HPA for queue workloads.',
      },
    },
    interview: {
      q: 'What is the difference between sync and async job dispatch?',
      a: 'dispatchSync() (or using the Sync queue driver) executes the job immediately in the current PHP process, blocking until the job completes. The HTTP response is not sent until the job finishes. This is useful for testing (you can assert side effects directly) and for critical operations that must complete before the response. dispatch() (async) serializes the job and pushes it to the configured queue backend (Redis, database, SQS). The HTTP response is returned immediately — the job runs later in a queue worker process. The queue worker is a separate PHP process (php artisan queue:work) that polls the queue backend for jobs. The practical difference: with dispatch(), if the queue worker is down, the job sits in the queue until the worker restarts — good for resilience. With dispatchSync(), if the operation fails, the HTTP request fails — bad for user experience on slow operations like sending email.',
      fu: [
        'How do you handle job failures and retries in Laravel?',
        'What is the difference between job chaining and job batching?',
      ],
    },
  },

  // ─── LARAVEL AUTH ────────────────────────────────────────────────────────────

  {
    id: 'laravel-auth',
    cat: 'laravel',
    color: '#ff2d20',
    icon: '🔐',
    title: 'Authentication & Authorization',
    tag: 'Sanctum for SPAs/mobile tokens, Passport for OAuth2, Gates and Policies for authorization',
    overview:
      'Laravel has two first-party authentication packages: Sanctum (lightweight API tokens and SPA session-based auth) and Passport (full OAuth2 server). Sanctum issues opaque database-backed tokens for mobile apps and simple SPAs — easy to understand and revoke. Passport implements the full OAuth2 spec (authorization code, client credentials, implicit) — use it when your app is an OAuth2 server that third parties authenticate against. Guards determine how users are authenticated per request (web uses sessions, api uses tokens). Policies bind authorization logic to Eloquent models — a PostPolicy defines who can create, update, or delete a Post. Gates are closures for authorization logic not tied to a model — Gate::define("admin", fn($user) => $user->is_admin). Blade @can directive renders UI conditionally. In tests, actingAs($user) authenticates a user for the duration of the test without real token exchange.',
    a: {
      v: 'Hotel with key cards and access levels',
      t: 'Sanctum is the hotel front desk issuing key cards (tokens) — simple, revocable, specific to your hotel. Passport is the hotel joining a global hotel chain — your key card works across properties (OAuth2 federation). Gates are floor-level access rules ("only staff above supervisor can enter the server room"). Policies are room-specific rules ("the guest in Room 305 can access Room 305, not Room 306"). actingAs() in tests is a master pass that bypasses the front desk.',
      tx: 'Authentication (who are you?) = Sanctum/Passport issuing and validating tokens. Authorization (what can you do?) = Gates (app-wide) and Policies (model-bound). The auth guard bridges them — resolving the authenticated user from the token so policies and gates can check permissions against that user.',
      s: 'Your API uses Sanctum for mobile app tokens (revocable, no OAuth complexity) and Policies for resource authorization — users can only update their own posts, admins can update any. The Gate::before() hook short-circuits all policy checks for super-admins.',
    },
    te: {
      def: 'Laravel authentication uses guards to determine the authenticated user per request. Sanctum provides API token auth for SPAs and mobile apps. Passport provides full OAuth2. Authorization uses Gates (app-wide closures) and Policies (model-bound classes) to determine what authenticated users can do.',
      types: [
        {
          n: 'Sanctum',
          d: 'Opaque API tokens stored in personal_access_tokens table. Supports token abilities (scopes). SPA auth uses httpOnly session cookies. Simple to implement and revoke.',
        },
        {
          n: 'Passport',
          d: 'Full OAuth2 implementation — authorization code, client credentials, password grant. Use when your app is an OAuth2 server for third-party integrations.',
        },
        {
          n: 'Policy',
          d: 'Class with methods matching controller actions (view, create, update, delete). Registered with model in AuthServiceProvider. Encapsulates model-specific authorization logic.',
        },
      ],
      when: 'Use Sanctum for most apps — mobile apps, SPAs, simple API token auth. Use Passport only when you need OAuth2 (third-party app authorization, authorization code flow). Use Policies for model-bound authorization (can user edit this post?). Use Gates for app-level permissions not tied to a model (can user access admin panel?).',
      trade:
        'Sanctum tokens are opaque — the token itself carries no information, requiring a DB lookup on every request. JWT (via Passport or a third-party package) is stateless but cannot be revoked without a blacklist. Policies require registering in AuthServiceProvider and can become complex for multi-tenancy scenarios. actingAs() in tests bypasses the real auth flow — ensure you also test token validation separately.',
      code: `<?php
// ── Sanctum: create token for mobile app ─────────────────────────────────────

class AuthController extends Controller {
    public function login(Request $request): JsonResponse {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('mobile-app', ['orders:read', 'profile:write'])
                      ->plainTextToken;

        return response()->json(['token' => $token]);
    }

    public function logout(Request $request): JsonResponse {
        $request->user()->currentAccessToken()->delete(); // revoke token
        return response()->json(['message' => 'Logged out']);
    }
}

// ── Policy: model-bound authorization ────────────────────────────────────────

class PostPolicy {
    public function update(User $user, Post $post): bool {
        return $user->id === $post->user_id;   // only post owner can update
    }

    public function delete(User $user, Post $post): bool {
        return $user->id === $post->user_id || $user->is_admin;
    }

    public function create(User $user): bool {
        return $user->email_verified_at !== null;  // only verified users create posts
    }
}

// ── Gate::define for admin access ────────────────────────────────────────────

Gate::define('access-admin', function (User $user): bool {
    return $user->role === 'admin';
});

// Gate::before — bypass all other gates for super-admin
Gate::before(function (User $user, string $ability): ?bool {
    if ($user->is_super_admin) {
        return true;  // super-admin can do everything
    }
    return null;      // null means continue evaluating other gates/policies
});

// ── Using gates and policies ──────────────────────────────────────────────────

// In controller
$this->authorize('update', $post);  // throws 403 if policy returns false

// In Blade
@can('update', $post)
    <button>Edit Post</button>
@endcan

@can('access-admin')
    <a href="/admin">Admin Panel</a>
@endcan

// ── actingAs() in feature tests ───────────────────────────────────────────────

class PostTest extends TestCase {
    public function test_user_can_update_own_post(): void {
        $user = User::factory()->create();
        $post = Post::factory()->for($user)->create();

        $this->actingAs($user)                  // authenticated as $user
             ->putJson('/api/posts/' . $post->id, ['title' => 'Updated'])
             ->assertOk();
    }

    public function test_user_cannot_update_others_post(): void {
        $user  = User::factory()->create();
        $other = User::factory()->create();
        $post  = Post::factory()->for($other)->create();

        $this->actingAs($user)
             ->putJson('/api/posts/' . $post->id, ['title' => 'Hijacked'])
             ->assertForbidden();
    }
}`,
      rw: {
        ex: [
          'Sanctum powers most Laravel API starters (Breeze API, Jetstream) — the token table approach is the default for new Laravel APIs',
          'Token abilities (Sanctum scopes) power fine-grained mobile permissions — read-only tokens for widgets, full-access for main app',
          'Gate::policy() auto-discovery registers policies by convention — UserPolicy automatically applies to User model actions',
          'Laravel Fortify handles the authentication flow (login, registration, 2FA) while leaving UI to you — used by Breeze and Jetstream',
        ],
        cs: 'GitHub uses OAuth2 (equivalent to Laravel Passport) for third-party app authorization — when apps request access to your repositories, GitHub presents an OAuth2 authorization code flow. For its own first-party apps and API tokens, GitHub uses a Sanctum-equivalent opaque token system stored in their database with fine-grained scope control. Choosing between the two is always the same tradeoff: OAuth2 for third-party auth, simpler tokens for first-party.',
      },
    },
    interview: {
      q: 'What is the difference between Sanctum and Passport?',
      a: 'Sanctum is for authenticating your own first-party clients — mobile apps and SPAs built by you. It issues opaque tokens stored in a personal_access_tokens database table. Token validation requires a DB lookup on every request. It also supports SPA authentication using standard session cookies (no tokens needed for same-domain SPAs). Simple to implement, tokens are easy to revoke. Passport implements the full OAuth2 specification — it is for when your application is an OAuth2 authorization server that third-party developers authenticate against. It supports authorization code flow (users grant third-party apps permission), client credentials flow (server-to-server), and refresh tokens. Passport requires more setup (key generation, client management UI) and is significantly more complex. The rule of thumb: if you are building the only client that consumes your API, use Sanctum. If third-party developers will build apps that authenticate users against your system (like "Login with Your App"), use Passport.',
      fu: [
        'What is the difference between Gates and Policies?',
        'How do Sanctum token abilities work?',
      ],
    },
  },

  // ─── MIDDLEWARE ──────────────────────────────────────────────────────────────

  {
    id: 'laravel-middleware',
    cat: 'laravel',
    color: '#ff2d20',
    icon: '🔀',
    title: 'Middleware & Request Lifecycle',
    tag: 'Request flows: Kernel → global middleware → router → route middleware → controller → response',
    overview:
      'Every HTTP request in Laravel passes through the HTTP Kernel, which runs it through a pipeline of middleware before reaching the router and controller. Global middleware runs on every request (TrimStrings, ConvertEmptyStringsToNull, TrustProxies). Route middleware runs only on routes that declare it (auth, throttle, verified). Middleware groups bundle multiple middleware under a name — the "web" group includes sessions, CSRF protection, and cookies; the "api" group includes throttle and stateless handling. The $next pattern is the chain: calling $next($request) passes the request to the next middleware in the pipeline. Before middleware modifies the request before $next(); after middleware modifies the response after $next(). Terminable middleware implements terminate() — it runs after the response has been sent to the client, making it ideal for logging and cleanup without adding to response time.',
    a: {
      v: 'Airport security line',
      t: 'Each request is a passenger arriving at the airport. Global middleware is the customs hall everyone must pass through (passport check, baggage X-ray). Route middleware is the gate-specific check (first class lounge access, visa for certain destinations). The controller is the destination gate. Terminable middleware is the post-flight survey — it happens after the passenger has landed (response sent), not during security.',
      tx: '$next($request) is the conveyor belt — calling it passes the passenger to the next checkpoint. Middleware before $next() modifies the incoming passenger (request). Middleware after $next() modifies the outgoing luggage (response). Terminable middleware runs after the flight has departed — no delay to the passenger.',
      s: 'Your API uses the "api" middleware group (throttle:60,1 + stateless) on all routes, the "auth:sanctum" middleware on protected routes, and a custom RequestLoggingMiddleware that logs after $next() to capture status codes — all without touching controller code.',
    },
    te: {
      def: 'Laravel middleware form a pipeline that every request passes through before reaching the controller and every response passes through on the way out. Global middleware applies to all routes; route middleware applies selectively. Middleware groups bundle multiple middleware. Terminable middleware runs post-response for logging and cleanup.',
      types: [
        {
          n: 'Global Middleware',
          d: 'Registered in the $middleware array of HTTP Kernel. Runs on every request. Examples: TrustProxies, TrimStrings, HandleCors.',
        },
        {
          n: 'Route Middleware',
          d: 'Registered in $middlewareAliases in Kernel. Applied to specific routes via ->middleware("name"). Examples: auth, throttle, verified, signed.',
        },
        {
          n: 'Terminable Middleware',
          d: 'Implements terminate(Request $request, Response $response). Called after response is sent. Used for logging, analytics, cleanup. Does not delay the response.',
        },
      ],
      when: 'Use global middleware for concerns that apply to every request (proxy trust, CORS, request trimming). Use route middleware for authentication, rate limiting, and feature flags. Use middleware groups to compose sets of middleware. Use terminable middleware for post-response logging and cleanup that should not add latency to the response.',
      trade:
        'Deep middleware stacks add latency — each middleware adds processing time. Middleware ordering matters: auth middleware must run before any middleware that accesses the authenticated user. Laravel evaluates middleware in the order they are defined — put performance-sensitive checks (auth, rate limit) early to short-circuit expensive later middleware.',
      code: `<?php
// ── Custom middleware: before and after $next() ────────────────────────────────

class RequestTimingMiddleware {
    public function handle(Request $request, Closure $next): Response {
        // BEFORE: runs before the controller
        $startTime = microtime(true);
        $request->attributes->set('start_time', $startTime);

        $response = $next($request);  // pass to next middleware / controller

        // AFTER: runs on the way back out, with the response
        $duration = (microtime(true) - $startTime) * 1000;
        $response->headers->set('X-Response-Time', round($duration, 2) . 'ms');

        return $response;
    }
}

// ── Terminable middleware: runs AFTER response is sent ─────────────────────────

class AuditLogMiddleware {
    public function handle(Request $request, Closure $next): Response {
        return $next($request);  // no before logic
    }

    public function terminate(Request $request, Response $response): void {
        // Called AFTER response sent to client — zero impact on response time
        AuditLog::create([
            'user_id'    => $request->user()?->id,
            'method'     => $request->method(),
            'path'       => $request->path(),
            'status'     => $response->getStatusCode(),
            'ip'         => $request->ip(),
            'created_at' => now(),
        ]);
    }
}

// ── Registering middleware in Kernel ──────────────────────────────────────────

class Kernel extends HttpKernel {
    // Global — runs on every request
    protected $middleware = [
        TrustProxies::class,
        HandleCors::class,
        RequestTimingMiddleware::class,
    ];

    // Groups — compose multiple middleware under one name
    protected $middlewareGroups = [
        'web' => [
            EncryptCookies::class,
            AddQueuedCookiesToResponse::class,
            StartSession::class,
            VerifyCsrfToken::class,
        ],
        'api' => [
            ThrottleRequests::class . ':api',   // 60 req/min by default
            SubstituteBindings::class,
        ],
    ];

    // Aliases — apply to specific routes
    protected $middlewareAliases = [
        'auth'     => Authenticate::class,
        'throttle' => ThrottleRequests::class,
        'verified' => EnsureEmailIsVerified::class,
        'audit'    => AuditLogMiddleware::class,
    ];
}

// ── Applying middleware to routes ─────────────────────────────────────────────

Route::middleware(['auth:sanctum', 'verified', 'audit'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
});

// Inline middleware group
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('posts', PostController::class);
});`,
      rw: {
        ex: [
          'Laravel Sanctum "EnsureFrontendRequestsAreStateful" is a global middleware that enables SPA session auth for same-domain requests',
          'ThrottleRequests middleware uses the cache driver to track request counts — Redis-backed for distributed rate limiting across workers',
          'SubstituteBindings resolves route model bindings — {post} in route becomes the Post Eloquent model automatically',
          'Middleware priority (defined in Kernel::$middlewarePriority) ensures auth always runs before throttle checks',
        ],
        cs: 'Netflix\'s API gateway uses a middleware pipeline concept — every microservice request passes through auth verification, rate limiting, request logging, and circuit breaker checks before reaching the service. Laravel\'s middleware pipeline is the same architectural pattern at the application level. Understanding Laravel middleware directly maps to understanding API gateway patterns used in distributed systems.',
      },
    },
    interview: {
      q: 'What is terminable middleware?',
      a: 'Terminable middleware implements the terminate(Request $request, Response $response) method in addition to handle(). The terminate() method is called by Laravel\'s HTTP Kernel after the response has been sent to the browser — the client receives the response without waiting for terminate() to execute. This makes it ideal for work that should not add latency to the response: audit logging (write the request and status code to a log after the fact), analytics tracking, cache cleanup, releasing database connections, or sending internal metrics. The key difference from after-$next() middleware: after-$next() code runs before the response is sent (it can still modify the response); terminate() runs after (it cannot modify the response, but it also does not delay it). For terminate() to work, the middleware must be registered as a singleton in the container — Laravel checks if the middleware instance implements Terminable and calls terminate() if it does.',
      fu: [
        'What is the difference between global and route middleware?',
        'How does middleware ordering affect behavior?',
      ],
    },
  },
];

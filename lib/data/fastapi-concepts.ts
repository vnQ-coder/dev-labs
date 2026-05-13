import { Concept } from '../types';

export const FASTAPI_CONCEPTS: Concept[] = [
  // ─── FASTAPI FUNDAMENTALS ────────────────────────────────────────────────────

  {
    id: 'fastapi-fundamentals',
    cat: 'fastapi',
    color: '#009688',
    icon: '⚡',
    title: 'FastAPI Fundamentals',
    tag: 'FastAPI = Starlette + Pydantic + auto OpenAPI — async-first, type-safe, self-documenting',
    overview:
      'FastAPI is built on two core libraries: Starlette (the ASGI web framework providing routing, middleware, WebSocket support, and request/response handling) and Pydantic (data validation and serialization via Python type hints). ASGI (Asynchronous Server Gateway Interface) is the modern async successor to WSGI — where WSGI handles one request at a time per thread/process, ASGI supports concurrent connections via async/await on a single event loop. FastAPI reads your function type annotations to auto-generate JSON Schema, which it uses for request validation and for generating OpenAPI docs at /docs (Swagger UI) and /redoc. Every path parameter, query parameter, and request body is validated automatically based on type annotations — no manual validation code needed. APIRouter lets you split routes across multiple files for large applications.',
    a: {
      v: 'Modern automated factory',
      t: 'Traditional frameworks (Flask/Django) are like manual assembly lines — you write code to read request data, validate it, convert types, and document it yourself. FastAPI is an automated factory: you declare what you want via type hints, and the factory handles validation, serialization, and documentation automatically. Change the blueprint (type hint) and everything updates.',
      tx: 'Starlette is the factory floor (routing, HTTP handling). Pydantic is the quality control system (validation). Type hints are the blueprint. OpenAPI docs are the auto-generated product catalog — always up to date because they come from the same source as the code.',
      s: 'In your API, adding "user_id: int" as a path parameter means FastAPI validates it is an integer, returns a 422 Unprocessable Entity with a clear error if not, and documents it in /docs — three things you would otherwise write manually.',
    },
    te: {
      def: 'FastAPI is an ASGI web framework that uses Python type hints to drive automatic request validation (via Pydantic), response serialization, and OpenAPI schema generation. It is built on Starlette for HTTP handling and supports both async and sync route handlers.',
      types: [
        {
          n: 'ASGI vs WSGI',
          d: 'WSGI (Flask, Django) is synchronous — one request blocks a thread. ASGI (FastAPI, Starlette) is async — one event loop handles many concurrent requests without blocking.',
        },
        {
          n: 'Path / Query / Body Parameters',
          d: 'Path params from the URL pattern, query params from the URL string, body from request JSON/form. FastAPI infers type and location from function signature and type hints.',
        },
        {
          n: 'APIRouter',
          d: 'Blueprint-like object for grouping related routes. Mounted on the main app with a prefix. Enables modular project structure.',
        },
      ],
      when: 'Use FastAPI for: REST APIs where developer speed and correctness matter, microservices requiring auto-generated OpenAPI docs, async I/O-bound services (database, external APIs), and ML model serving (fast async responses for inference endpoints).',
      trade:
        'FastAPI adds Pydantic validation overhead on every request — negligible for most workloads but measurable at very high throughput with complex nested models. The async model means you must be careful not to call blocking code (sync DB drivers, time.sleep) in async routes — it blocks the event loop for all concurrent requests.',
      code: `from fastapi import FastAPI, APIRouter, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title='My API', version='1.0.0')

# ── CORS middleware ───────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=['https://myapp.com'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# ── Pydantic request body model ───────────────────────────────────────────────

class ItemCreate(BaseModel):
    name: str
    price: float
    in_stock: bool = True

class ItemResponse(BaseModel):
    id: int
    name: str
    price: float

# ── Path param, query param, typed body, response_model ──────────────────────

@app.get('/items/{item_id}', response_model=ItemResponse)
async def get_item(
    item_id: int,                                      # path param — must be int
    include_details: bool = Query(default=False),      # query param with default
):
    return {'id': item_id, 'name': 'Widget', 'price': 9.99}

@app.post('/items', response_model=ItemResponse, status_code=201)
async def create_item(item: ItemCreate):              # body auto-parsed + validated
    return {'id': 1, **item.model_dump()}

# ── APIRouter for modular structure ──────────────────────────────────────────

router = APIRouter(prefix='/users', tags=['users'])

@router.get('/{user_id}')
async def get_user(user_id: int):
    return {'id': user_id}

app.include_router(router)
# Docs auto-available at /docs and /redoc — no extra configuration needed`,
      rw: {
        ex: [
          'Stripe uses FastAPI internally for some microservices — Pydantic models map directly to their strongly-typed API surface',
          'Hugging Face Inference API is built on FastAPI — async routes handle concurrent model inference requests',
          'FastAPI /docs (Swagger UI) is generated from the same Pydantic models used for validation — zero documentation drift',
          'response_model strips fields not in the model — prevents accidentally leaking password hashes or internal fields',
        ],
        cs: 'Microsoft uses FastAPI for Azure ML endpoint serving — the async model handles hundreds of concurrent inference requests on a single event loop, and Pydantic model validation ensures malformed payloads are rejected before hitting the GPU.',
      },
    },
    interview: {
      q: 'What is ASGI vs WSGI?',
      a: 'WSGI (Flask, Django) is a synchronous interface — each request is handled by a Python callable that runs to completion before the next request can be handled on that thread. To handle concurrency, you run multiple threads or processes (gunicorn workers). ASGI is the async successor — a single event loop handles many concurrent connections via async/await. When an ASGI route awaits I/O (database query, HTTP call), the event loop switches to another request instead of blocking. FastAPI is ASGI, run by Uvicorn (the ASGI server). WSGI apps cannot handle WebSockets or long-polling natively; ASGI supports both. The practical difference: a FastAPI app on one process can handle hundreds of concurrent I/O-bound requests; a Flask app on one process handles one at a time.',
      fu: [
        'How does FastAPI generate /docs automatically?',
        'What happens if you call a blocking function inside an async FastAPI route?',
      ],
    },
  },

  // ─── DEPENDENCY INJECTION ────────────────────────────────────────────────────

  {
    id: 'fastapi-dependency-injection',
    cat: 'fastapi',
    color: '#009688',
    icon: '💉',
    title: 'Dependency Injection with Depends()',
    tag: 'Depends() resolves dependencies automatically — yield deps handle cleanup, chains compose',
    overview:
      'FastAPI\'s dependency injection system uses Depends() to declare what a route needs — FastAPI resolves and injects dependencies automatically. Dependencies can be functions, classes, or async functions. Yield dependencies (using Python\'s yield) are the standard pattern for resources that need cleanup: the code before yield runs before the route handler (setup), and the code after yield runs after the response is sent (teardown) — exactly like a context manager. Dependencies can depend on other dependencies, forming chains. Sub-dependencies are resolved once per request even if declared multiple times. In tests, you can override any dependency using app.dependency_overrides — a dict mapping the original dependency to a replacement, enabling clean unit testing without touching real databases.',
    a: {
      v: 'Restaurant order system',
      t: 'Depends() is like a waiter who automatically fetches everything a table needs before serving. You declare "this table needs a menu, a candle, and a sommelier" (Depends). The restaurant manager (FastAPI) ensures all three arrive before the food (route handler) is served, and cleans up after (yield teardown). The waiter does not fetch the same menu twice for the same table.',
      tx: 'The dependency graph is a DAG — FastAPI resolves it in the correct order, caches results within a request, and runs cleanup code (after yield) in reverse order after the response. You declare what you need; FastAPI handles when and how.',
      s: 'Your get_db() yield dependency opens a SQLAlchemy session, yields it to the route, and closes it in the finally block — even if the route raises an exception. Every route that declares Depends(get_db) gets a fresh session per request, closed automatically.',
    },
    te: {
      def: 'FastAPI\'s DI system resolves declared dependencies via Depends(), injecting them into route handlers. Yield dependencies act as context managers for resource lifecycle management. Dependencies compose into chains and can be overridden in tests via app.dependency_overrides.',
      types: [
        {
          n: 'Function dependency',
          d: 'A plain function or async function. FastAPI calls it and injects the return value. Used for auth, config, pagination params.',
        },
        {
          n: 'Yield dependency',
          d: 'A generator function using yield. Setup code before yield, cleanup code after. Guaranteed cleanup via try/finally. Standard pattern for DB sessions.',
        },
        {
          n: 'Class dependency',
          d: 'A class with __init__ and __call__, or just instantiated inline. Useful for dependencies that share config (e.g., a query filter class).',
        },
      ],
      when: 'Use Depends() for: database sessions, authenticated user lookup, shared query parameters (pagination), feature flags, rate limiting checks, and any cross-cutting concern that multiple routes share. Use dependency_overrides in tests to replace real services with fakes.',
      trade:
        'Dependency chains add indirection — tracing what a route needs requires following Depends() chains through multiple files. Heavy use of nested dependencies can make request initialization slow if each dep does real work. Cache results with use_cache=True (default) or scope per-request explicitly.',
      code: `from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import Generator

app = FastAPI()

# ── Database session: yield dependency ───────────────────────────────────────

engine = create_engine('postgresql://user:pass@localhost/db')
SessionLocal = sessionmaker(bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db          # route handler runs here
    finally:
        db.close()        # always runs — even if route raises

# ── Auth dependency using Depends(get_db) ────────────────────────────────────

def get_current_user(
    token: str,
    db: Session = Depends(get_db),   # sub-dependency — db injected automatically
):
    user = db.query(User).filter(User.token == token).first()
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    return user

# ── Route using chained dependencies ─────────────────────────────────────────

@app.get('/profile')
async def get_profile(
    current_user = Depends(get_current_user),  # get_db resolved inside this
):
    return {'user': current_user.email}

# ── Router-level dependency (applied to all routes in router) ─────────────────

from fastapi import APIRouter

admin_router = APIRouter(
    prefix='/admin',
    dependencies=[Depends(get_current_user)],  # ALL admin routes require auth
)

@admin_router.get('/stats')
async def get_stats():
    return {'total_users': 1000}

# ── Test override: replace get_db with in-memory session ─────────────────────

from fastapi.testclient import TestClient

def override_get_db():
    db = TestSessionLocal()  # test DB session
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)
# Now all routes use the test DB session — no real database hit`,
      rw: {
        ex: [
          'SQLAlchemy get_db() yield pattern is used in virtually every FastAPI + SQLAlchemy project — it is the canonical resource management approach',
          'FastAPI docs use Depends(oauth2_scheme) for auth token extraction — composable with get_current_user for role checks',
          'Dependency overrides in tests allow replacing Redis, email services, and S3 with in-memory fakes — clean unit tests',
          'Router-level dependencies enable applying auth to entire API sections without decorating every route individually',
        ],
        cs: 'Uber\'s internal API platform uses DI patterns similar to FastAPI\'s Depends() — shared database pools, auth contexts, and request tracing are injected automatically. The dependency graph is resolved per request, ensuring no state leaks between requests on the same process.',
      },
    },
    interview: {
      q: 'How do yield dependencies work?',
      a: 'A yield dependency is a generator function — FastAPI calls it before the route handler, runs the route handler when the generator yields, then resumes the generator after the response is sent. The code before yield is setup (open DB session, acquire lock), the yielded value is injected into the route handler, and the code after yield is cleanup (close session, release lock). Wrapping the yield in try/finally ensures cleanup runs even if the route raises an exception. FastAPI implements this using Python\'s contextlib.contextmanager pattern under the hood. Dependencies are resolved once per request and cached — if two route parameters both Depends(get_db), FastAPI calls get_db once and reuses the same session object.',
      fu: [
        'How do you override dependencies in tests?',
        'Can a dependency depend on another dependency? What order are they resolved?',
      ],
    },
  },

  // ─── PYDANTIC MODELS ─────────────────────────────────────────────────────────

  {
    id: 'fastapi-pydantic',
    cat: 'fastapi',
    color: '#009688',
    icon: '✅',
    title: 'Pydantic Models & Validation',
    tag: 'Pydantic v2 validates, serializes, and documents — Field() for constraints, validators for logic',
    overview:
      'Pydantic v2 is a complete rewrite in Rust (via pydantic-core) — 5-50x faster than v1. BaseModel is the foundation: declare fields with type annotations, use Field() for metadata and constraints (min/max length, gt/lt, regex patterns, descriptions for docs). @field_validator decorates a classmethod to add custom validation logic for one or more fields. @model_validator validates the entire model at once (e.g., checking that end_date > start_date). BaseSettings (from pydantic-settings) reads configuration from environment variables and .env files, with the same validation capabilities as BaseModel. model_dump() serializes to dict, model_dump(exclude={"password"}) strips sensitive fields. Discriminated unions let you parse different subtypes based on a literal type field — critical for polymorphic APIs.',
    a: {
      v: 'Airport customs form',
      t: 'A Pydantic model is like a customs declaration form. The form defines required fields (name: str), optional fields (middle_name: str = None), and constraints (age must be 0-120). Customs officers (Pydantic) validate your form on entry — wrong types are coerced if possible, nonsensical values are rejected with clear error messages. You never get a blank or invalid declaration through to the immigration officer (your route handler).',
      tx: 'BaseModel is the form template. Field() adds validation rules to each field. @field_validator adds custom logic. model_dump() is the approved outbound data — only what you declared leaves customs. BaseSettings reads from environment variables — the customs office configures itself from the operational context.',
      s: 'Your UserCreate model with "email: EmailStr" and "password: str = Field(min_length=8)" means FastAPI validates both constraints before your route runs, and the /docs page shows the constraints to API consumers automatically.',
    },
    te: {
      def: 'Pydantic v2 provides schema-based validation, serialization, and documentation for Python data structures. BaseModel defines the schema via type annotations and Field() constraints. Validators add custom logic. BaseSettings extends this for configuration management from environment variables.',
      types: [
        {
          n: 'BaseModel',
          d: 'Core class for data validation. Parses and validates input on instantiation. Provides model_dump(), model_validate(), model_json_schema().',
        },
        {
          n: 'Field()',
          d: 'Adds constraints (gt, lt, min_length, max_length, pattern) and metadata (description, example, alias) to model fields.',
        },
        {
          n: 'BaseSettings',
          d: 'Subclass of BaseModel that reads field values from environment variables and .env files. Used for application configuration.',
        },
      ],
      when: 'Use Pydantic models for: API request/response schemas, configuration from environment variables, data parsing and transformation, serializing ORM objects to JSON. Use Field() whenever you need constraints or documentation beyond the type. Use @field_validator for business logic validation that depends on the field value.',
      trade:
        'Pydantic v2 validation adds CPU overhead per request — negligible for most APIs but measurable at very high RPS with deeply nested models. Strict mode (model_config = ConfigDict(strict=True)) disables type coercion (no "42" -> 42 conversion) — more correct but requires exact types. Discriminated unions are powerful but add schema complexity.',
      code: `from pydantic import BaseModel, Field, field_validator, model_validator
from pydantic_settings import BaseSettings
from typing import Annotated, Literal, Union
from datetime import date

# ── BaseModel with Field constraints ─────────────────────────────────────────

class UserCreate(BaseModel):
    email: str = Field(..., description='Valid email address')
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$')
    age: int = Field(..., gt=0, lt=120)
    password: str = Field(..., min_length=8)

# ── @field_validator: custom validation logic ─────────────────────────────────

class BookingRequest(BaseModel):
    check_in: date
    check_out: date

    @field_validator('check_out')
    @classmethod
    def check_out_after_check_in(cls, v, info):
        if 'check_in' in info.data and v <= info.data['check_in']:
            raise ValueError('check_out must be after check_in')
        return v

# ── BaseSettings: config from environment variables ──────────────────────────

class Settings(BaseSettings):
    database_url: str                    # required — raises if DB_URL not set
    secret_key: str
    debug: bool = False
    max_connections: int = 10

    model_config = {'env_file': '.env', 'env_file_encoding': 'utf-8'}

settings = Settings()  # reads from env vars automatically

# ── model_dump with exclusions ────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    password: str  # internal field

user = UserResponse(id=1, email='a@b.com', username='alice', password='secret')
safe_dict = user.model_dump(exclude={'password'})  # {'id': 1, 'email': ..., 'username': ...}

# ── Discriminated union: polymorphic event types ──────────────────────────────

class ClickEvent(BaseModel):
    type: Literal['click']
    x: int
    y: int

class ScrollEvent(BaseModel):
    type: Literal['scroll']
    delta_y: float

Event = Annotated[Union[ClickEvent, ScrollEvent], Field(discriminator='type')]

class EventBatch(BaseModel):
    events: list[Event]

# Pydantic selects the correct subtype based on the 'type' field value
batch = EventBatch(events=[{'type': 'click', 'x': 10, 'y': 20}])
print(type(batch.events[0]))  # ClickEvent`,
      rw: {
        ex: [
          'FastAPI response_model uses Pydantic to filter and serialize route return values — prevents accidentally returning internal fields',
          'Pydantic BaseSettings is the standard way to load config in 12-factor FastAPI apps — validated at startup, not at runtime',
          'model_validate(obj) replaces from_orm() in Pydantic v2 — converts SQLAlchemy ORM objects to Pydantic models',
          'Discriminated unions power API versioning and event-driven architectures where the payload type depends on a type field',
        ],
        cs: 'OpenAI\'s Python SDK uses Pydantic models extensively for API response types — every API response is a typed Pydantic model, enabling IDE autocomplete and runtime validation. The v2 migration was performance-driven: Pydantic v2\'s Rust core handles the high volume of API calls in production with lower CPU overhead.',
      },
    },
    interview: {
      q: 'How do Pydantic v2 validators differ from v1?',
      a: 'In Pydantic v1, validators were decorated with @validator, were not classmethods by convention, and received only the field value (not context about other fields). In Pydantic v2, @field_validator replaces @validator and requires @classmethod. The second argument is ValidationInfo (info.data contains previously validated fields, info.field_name is the current field). @model_validator replaces @root_validator for whole-model validation. The mode parameter controls when validation runs: mode="before" runs before type coercion (receives raw input), mode="after" runs after (receives the typed value). Pydantic v2 also uses model_config = ConfigDict(...) instead of the inner class Config. Crucially, v2 validators are implemented in Rust via pydantic-core — validation is 5-50x faster than v1 for complex models.',
      fu: [
        'What is a discriminated union?',
        'What is the difference between model_dump() and dict() in Pydantic v2?',
      ],
    },
  },

  // ─── ASYNC ROUTES ────────────────────────────────────────────────────────────

  {
    id: 'fastapi-async',
    cat: 'fastapi',
    color: '#009688',
    icon: '🚀',
    title: 'Async Routes & Performance',
    tag: 'async def runs in event loop; sync def runs in threadpool — use async for I/O-bound routes',
    overview:
      'FastAPI distinguishes between async def and sync def route handlers with an important semantic difference: async def routes run directly in the event loop — they must only call async-compatible code (await db.query(), await httpx.get()). Sync def routes are automatically run in a thread pool executor by FastAPI/Starlette — this prevents blocking the event loop, making sync routes safe to call blocking libraries (psycopg2, requests). BackgroundTasks lets you queue work that runs after the response is sent — the client gets a fast response and the background work (sending email, writing logs) happens asynchronously. Lifespan events (startup/shutdown) using the lifespan context manager handle application-level setup and teardown. asyncio.gather() runs multiple async coroutines concurrently — critical for making parallel I/O calls (two DB queries simultaneously).',
    a: {
      v: 'Restaurant with two types of staff',
      t: 'async def routes are like waiters who can take multiple orders simultaneously — while waiting for the kitchen (database), they serve other tables. sync def routes are like chefs sent to a separate kitchen (thread pool) so they do not block the main floor. BackgroundTasks are busboys who clean tables after guests leave — the guests do not wait for cleanup.',
      tx: 'The event loop is the main floor. async routes are non-blocking — they await I/O and yield control back. sync routes are moved to the back (thread pool) so they cannot block the floor. asyncio.gather is taking multiple orders to the kitchen at once instead of waiting for each to finish before placing the next.',
      s: 'Your API endpoint needs user data AND their recent orders — use asyncio.gather(get_user(id), get_orders(id)) to fetch both in parallel instead of sequentially. The response time becomes max(user_query, orders_query) instead of sum.',
    },
    te: {
      def: 'FastAPI routes declared with async def execute in the event loop (non-blocking). Routes declared with def execute in a threadpool (blocking-safe). BackgroundTasks run after the response. Lifespan manages application startup/shutdown. asyncio.gather() enables parallel async I/O.',
      types: [
        {
          n: 'async def route',
          d: 'Runs in the event loop. Must use async-compatible libraries (asyncpg, httpx, aiobotocore). Never call blocking code (requests, psycopg2, time.sleep).',
        },
        {
          n: 'def route (sync)',
          d: 'FastAPI runs it in a threadpool executor automatically. Safe for blocking calls. Use when integrating libraries without async support.',
        },
        {
          n: 'BackgroundTasks',
          d: 'Add tasks that run after the response is returned to the client. Runs in the same process/event loop. For heavier work, use Celery or arq.',
        },
      ],
      when: 'Use async def when using async DB drivers (asyncpg, motor, SQLAlchemy async), HTTP clients (httpx), or any async library. Use def (sync) when forced to use sync-only libraries. Use BackgroundTasks for lightweight post-response work (audit logs, welcome emails). Use asyncio.gather for parallel I/O that is not inter-dependent.',
      trade:
        'Using sync def in a high-concurrency FastAPI app risks threadpool exhaustion — if all thread pool slots are busy, new sync requests queue. Using async def with blocking code (requests.get without await) blocks the entire event loop — all concurrent requests freeze until the blocking call returns. Mixing correctly is critical.',
      code: `import asyncio
import httpx
from fastapi import FastAPI, BackgroundTasks
from contextlib import asynccontextmanager
import asyncpg

app = FastAPI()

# ── Lifespan: startup/shutdown events ────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: runs before first request
    app.state.db_pool = await asyncpg.create_pool('postgresql://localhost/db')
    app.state.http_client = httpx.AsyncClient()
    print('App started, DB pool ready')
    yield
    # Shutdown: runs after last request
    await app.state.db_pool.close()
    await app.state.http_client.aclose()
    print('App shut down cleanly')

app = FastAPI(lifespan=lifespan)

# ── async route with async DB query ──────────────────────────────────────────

@app.get('/users/{user_id}')
async def get_user(user_id: int):
    pool = app.state.db_pool
    async with pool.acquire() as conn:
        row = await conn.fetchrow('SELECT * FROM users WHERE id = $1', user_id)
    return dict(row)

# ── asyncio.gather: parallel I/O ──────────────────────────────────────────────

@app.get('/dashboard/{user_id}')
async def get_dashboard(user_id: int):
    pool = app.state.db_pool
    async with pool.acquire() as conn:
        # Both queries run concurrently — total time = max(q1, q2) not sum
        user, orders = await asyncio.gather(
            conn.fetchrow('SELECT * FROM users WHERE id = $1', user_id),
            conn.fetch('SELECT * FROM orders WHERE user_id = $1', user_id),
        )
    return {'user': dict(user), 'orders': [dict(o) for o in orders]}

# ── BackgroundTasks: work after response ─────────────────────────────────────

def send_welcome_email(email: str):  # sync function — runs in threadpool
    import time
    time.sleep(2)                    # simulated blocking email send
    print(f'Email sent to {email}')

@app.post('/register')
async def register(email: str, background_tasks: BackgroundTasks):
    # Client gets 201 immediately; email sends in background
    background_tasks.add_task(send_welcome_email, email)
    return {'message': 'Registered successfully'}

# ── sync def route — safe for blocking libraries ──────────────────────────────

@app.get('/legacy-data')
def get_legacy_data():             # sync def — FastAPI runs in threadpool
    import requests                # blocking HTTP — OK in sync def, NOT in async def
    response = requests.get('http://legacy-api.internal/data')
    return response.json()`,
      rw: {
        ex: [
          'asyncpg is the standard async PostgreSQL driver for FastAPI — 3x faster than psycopg2 for async workloads',
          'httpx.AsyncClient in lifespan startup enables connection pooling for outbound HTTP — reused across all requests',
          'asyncio.gather for fan-out patterns: fetch user, permissions, and preferences in parallel for dashboard endpoints',
          'BackgroundTasks for audit logging — the route returns fast and the log write happens post-response',
        ],
        cs: 'Robinhood\'s market data API uses async Python services (FastAPI-like patterns) to handle thousands of concurrent WebSocket connections from mobile clients. asyncio.gather fetches prices from multiple exchange APIs in parallel per tick — sequential fetching would be too slow for real-time data.',
      },
    },
    interview: {
      q: 'What happens when you use sync def in FastAPI?',
      a: 'FastAPI (via Starlette) detects that the route handler is a regular function (not a coroutine) and runs it in a thread pool executor — specifically, it calls asyncio.get_event_loop().run_in_executor(None, func). This means the sync function runs in a separate thread, keeping the event loop free to handle other async requests concurrently. The thread pool has a limited number of slots (default: number of CPUs * 5 in Python\'s ThreadPoolExecutor). If you have many concurrent sync requests, the pool can exhaust and new requests queue. Sync def routes are safe for blocking I/O (psycopg2, requests, file I/O) precisely because they run off the event loop. The alternative — calling blocking code in async def — freezes the entire event loop for all concurrent requests until the blocking call returns, which is a serious production issue.',
      fu: [
        'When should you NOT use async def?',
        'How do you run CPU-intensive code in FastAPI without blocking the event loop?',
      ],
    },
  },

  // ─── FASTAPI AUTH ────────────────────────────────────────────────────────────

  {
    id: 'fastapi-auth',
    cat: 'fastapi',
    color: '#009688',
    icon: '🔐',
    title: 'Authentication & Security',
    tag: 'OAuth2PasswordBearer + JWT — dependency-based auth wired through the DI system',
    overview:
      'FastAPI integrates authentication through its DI system — auth is a dependency, not middleware, making it composable and testable. OAuth2PasswordBearer is a callable that extracts the Bearer token from the Authorization header and returns it as a string — it also tells /docs to show an Authorize button. JWT (JSON Web Tokens) are the standard token format: the server signs a payload (user ID, expiry, scopes) with a secret, and clients present the token on subsequent requests. The server validates the signature and extracts claims without hitting the database on every request. passlib.context with bcrypt handles password hashing — bcrypt is adaptive (configurable cost factor) and includes a built-in salt. Security scopes allow fine-grained permissions — a token can have scope "items:read" but not "items:write", and Security(get_current_user, scopes=["items:write"]) enforces this.',
    a: {
      v: 'VIP nightclub with wristbands',
      t: 'The /token endpoint is the door — you prove identity (password) and get a wristband (JWT) listing what areas you can access (scopes). Every other endpoint is a room — the bouncer (OAuth2PasswordBearer dependency) checks your wristband and lets you in if valid. The wristband has an expiry time (exp claim) — after midnight it is invalid. The bouncer never calls the guest list (database) — the wristband itself is the proof.',
      tx: 'JWTs are self-contained proof — the signature verifies authenticity, the claims (sub, exp, scopes) determine access, no database lookup needed. The DI system wires auth into any route by adding Depends(get_current_user) — authentication is a decorator-free concern.',
      s: 'Your API issues JWTs with a 15-minute access token lifetime and a 7-day refresh token. Every protected route declares Depends(get_current_user) — FastAPI extracts the token, validates the signature, checks expiry, and injects the user object. Auth code lives in one place.',
    },
    te: {
      def: 'FastAPI auth uses OAuth2PasswordBearer to extract tokens, jose/PyJWT to sign and verify JWTs, and passlib.bcrypt to hash passwords. Auth is implemented as a Depends() dependency — composable, testable, and reusable across routes. Security scopes provide fine-grained authorization.',
      types: [
        {
          n: 'OAuth2PasswordBearer',
          d: 'FastAPI utility that extracts Bearer token from Authorization header. Integrates with /docs Authorize UI. Returns the raw token string.',
        },
        {
          n: 'JWT (JSON Web Token)',
          d: 'Signed token containing claims (sub, exp, scopes). Validated without DB lookup. Short-lived (15-60 min). Refresh tokens are longer-lived.',
        },
        {
          n: 'passlib.bcrypt',
          d: 'Adaptive password hashing with built-in salt. CryptContext handles hash verification and upgrading old hashes to new cost factors.',
        },
      ],
      when: 'Use JWT + OAuth2PasswordBearer for: REST APIs with stateless auth, mobile apps (tokens stored in secure storage), microservices (token passed between services). Use session cookies for traditional server-rendered apps. Use API keys (simpler header-based auth) for server-to-server communication.',
      trade:
        'JWTs cannot be revoked before expiry without a token blacklist (Redis). Short expiry (15 min) with refresh tokens mitigates this but adds complexity. bcrypt is intentionally slow (this is a feature — slows brute-force) — use an appropriate work factor (12 is a common production default). Never store JWTs in localStorage — use httpOnly cookies for browser clients to prevent XSS token theft.',
      code: `from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel

app = FastAPI()

SECRET_KEY = 'your-secret-key-store-in-env'
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 15

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/token')
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

# ── Password hashing ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ── JWT creation ──────────────────────────────────────────────────────────────

def create_access_token(subject: str, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {'sub': subject, 'exp': expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# ── /token endpoint ───────────────────────────────────────────────────────────

@app.post('/token')
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_from_db(form_data.username)       # look up user
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Incorrect username or password',
            headers={'WWW-Authenticate': 'Bearer'},
        )
    token = create_access_token(
        subject=user.email,
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {'access_token': token, 'token_type': 'bearer'}

# ── get_current_user dependency ───────────────────────────────────────────────

class TokenData(BaseModel):
    email: str

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Could not validate credentials',
        headers={'WWW-Authenticate': 'Bearer'},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get('sub')
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return TokenData(email=email)

# ── Protected route ───────────────────────────────────────────────────────────

@app.get('/me')
async def get_me(current_user: TokenData = Depends(get_current_user)):
    return {'email': current_user.email}`,
      rw: {
        ex: [
          'FastAPI official docs use OAuth2PasswordBearer + JWT as the canonical authentication pattern',
          'Refresh token rotation: issue a new refresh token on every use and invalidate the old one — stored in Redis with TTL',
          'Scope-based auth: Depends(Security(get_current_user, scopes=["admin"])) enforces scopes at the route level',
          'httpOnly cookie auth for SPAs: store JWT in a cookie instead of Authorization header to prevent XSS theft',
        ],
        cs: 'Auth0 and Okta both issue JWTs following the OAuth2/OIDC standard. FastAPI services can verify Auth0 tokens by fetching the public key from the Auth0 JWKS endpoint and validating the signature — no custom auth database needed. This is the pattern for outsourcing auth to a managed identity provider while keeping FastAPI as the resource server.',
      },
    },
    interview: {
      q: 'How does OAuth2PasswordBearer work?',
      a: 'OAuth2PasswordBearer is a callable class (it implements __call__) that FastAPI uses as a dependency. When a request arrives, it looks for an Authorization header with the format "Bearer <token>". If the header is missing or not in Bearer format, it raises a 401 HTTPException with WWW-Authenticate: Bearer. If the header is present, it returns the raw token string to be used by the next dependency (typically get_current_user). It also registers itself with FastAPI\'s OpenAPI schema — this is why the /docs Swagger UI shows an Authorize button that lets you paste a Bearer token for manual API testing. The tokenUrl parameter tells the OpenAPI schema where to get a token (used by Swagger UI\'s built-in login flow). OAuth2PasswordBearer does not validate the token — it only extracts it. Validation (JWT signature check, expiry) happens in your get_current_user dependency that receives the token.',
      fu: [
        'What is the difference between authentication and authorization in FastAPI?',
        'How do you implement refresh token rotation?',
      ],
    },
  },
];

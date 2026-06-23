from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.router import api_router
from app.db.session import engine
from app.db.base import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all DB tables on startup (dev convenience; use Alembic for prod)."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="TraX Transport Platform REST API",
    version="1.0.0",
    lifespan=lifespan,
    # Disable interactive docs in production
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

allowed_origins = []
if settings.FRONTEND_URL.strip():
    # Supports one origin or comma-separated origins in FRONTEND_URL.
    for origin in settings.FRONTEND_URL.split(","):
        cleaned = origin.strip().rstrip("/")
        if cleaned:
            allowed_origins.append(cleaned)
allowed_origins.extend([
    "http://localhost:3000",
    "https://localhost:3000",
    "https://trax-maroc.up.railway.app",
])

# Deduplicate while preserving order.
allowed_origins = list(dict.fromkeys(allowed_origins))

# CORS — restrict to the configured frontend origin in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": settings.APP_NAME}


@app.get("/")
def root():
    return {"message" : "API is running"}

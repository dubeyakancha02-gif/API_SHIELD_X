import sys
import os
# Ensure the backend directory is in sys.path regardless of execution working directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import apis, scans, stats, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite tables
    init_db()
    yield
    # Shutdown: Clean up if needed

app = FastAPI(
    title="API Shield",
    description="Beginner-friendly defensive API security scanner and management backend.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration supporting authenticated HttpOnly cookies
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
env_origin = os.environ.get("ALLOWED_ORIGIN")
if env_origin and env_origin not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(env_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoint routers
app.include_router(auth.router)
app.include_router(apis.router)
app.include_router(scans.router)
app.include_router(stats.router)

# Health check route
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "API Shield",
        "documentation": "/docs"
    }

# Determine frontend static dist directory
POSSIBLE_DIST_PATHS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")),
    "/app/frontend/dist"
]

DIST_DIR = None
for p in POSSIBLE_DIST_PATHS:
    if os.path.exists(p) and os.path.isdir(p):
        DIST_DIR = p
        break

if DIST_DIR:
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_index():
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"status": "online", "service": "API Shield"}

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Do not catch API routes or Swagger docs
        if full_path.startswith("api") or full_path in ("docs", "openapi.json", "redoc"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(DIST_DIR, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Not Found")
else:
    @app.get("/")
    def root():
        return {
            "status": "online",
            "service": "API Shield Backend",
            "documentation": "/docs"
        }

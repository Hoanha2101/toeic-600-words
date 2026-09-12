from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import health, me, lessons, words, progress, review, tests, dashboard

try:
    from postgrest.exceptions import APIError as PostgrestAPIError
except ImportError:
    PostgrestAPIError = None

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for 600 Essential Words for the TOEIC Learning App",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Global exception handler for Supabase PostgREST errors
if PostgrestAPIError:
    @app.exception_handler(PostgrestAPIError)
    async def postgrest_api_error_handler(request: Request, exc: PostgrestAPIError):
        err_dict = exc.args[0] if exc.args and isinstance(exc.args[0], dict) else {}
        code = err_dict.get("code") or getattr(exc, "code", "")
        msg = err_dict.get("message") or getattr(exc, "message", str(exc))
        if code == "PGRST205" or "schema cache" in msg:
            detail = (
                f"Lỗi cơ sở dữ liệu Supabase ({code}): Bảng dữ liệu chưa được tạo trong Supabase. "
                "Vui lòng copy toàn bộ nội dung file 'supabase/migrations/0001_init.sql' dán vào Supabase SQL Editor và bấm Run."
            )
            return JSONResponse(status_code=503, content={"detail": detail, "code": code})
        return JSONResponse(status_code=500, content={"detail": f"Supabase Database Error: {msg}", "code": code})

# CORS configuration (support localhost & Vercel deployment domains)
origins = settings.cors_origins_list or ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def vercel_rewrite_path_middleware(request: Request, call_next):
    path_param = request.query_params.get("__path")
    if path_param is not None:
        target_path = "/" + path_param.lstrip("/") if path_param else "/"
        request.scope["path"] = target_path.split("?")[0]
    else:
        matched_path = request.headers.get("x-matched-path")
        if matched_path and matched_path != request.scope.get("path"):
            path_only = matched_path.split("?")[0]
            request.scope["path"] = path_only
    return await call_next(request)

# Register routers with /api prefix
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(me.router, prefix=settings.API_V1_STR, tags=["User State"])
app.include_router(lessons.router, prefix=settings.API_V1_STR, tags=["Lessons"])
app.include_router(words.router, prefix=settings.API_V1_STR, tags=["Words"])
app.include_router(progress.router, prefix=settings.API_V1_STR, tags=["Progress"])
app.include_router(review.router, prefix=settings.API_V1_STR, tags=["Review"])
app.include_router(tests.router, prefix=settings.API_V1_STR, tags=["Tests"])
app.include_router(dashboard.router, prefix=settings.API_V1_STR, tags=["Dashboard"])

# Fallback root routers (if Vercel or proxy strips /api prefix)
app.include_router(health.router, prefix="", include_in_schema=False)
app.include_router(me.router, prefix="", include_in_schema=False)
app.include_router(lessons.router, prefix="", include_in_schema=False)
app.include_router(words.router, prefix="", include_in_schema=False)
app.include_router(progress.router, prefix="", include_in_schema=False)
app.include_router(review.router, prefix="", include_in_schema=False)
app.include_router(tests.router, prefix="", include_in_schema=False)
app.include_router(dashboard.router, prefix="", include_in_schema=False)


import mimetypes
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")

def find_dist_dir() -> Path:
    candidates = [
        Path(__file__).resolve().parent.parent / "static_dist",
        Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
        Path("backend/static_dist"),
        Path("frontend/dist"),
        Path("../frontend/dist"),
        Path("/var/task/backend/static_dist"),
        Path("/var/task/frontend/dist"),
        Path(__file__).resolve().parent.parent / "dist",
    ]
    for p in candidates:
        if p.exists() and (p / "index.html").exists():
            return p
    return candidates[0]

DIST_DIR = find_dist_dir()

if DIST_DIR.exists() and (DIST_DIR / "index.html").exists():
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/assets/{asset_name:path}", include_in_schema=False)
    async def serve_asset_explicit(asset_name: str):
        file_path = (DIST_DIR / "assets") / asset_name
        if file_path.is_file():
            mime, _ = mimetypes.guess_type(str(file_path))
            return FileResponse(str(file_path), media_type=mime or "application/octet-stream")
        return JSONResponse(status_code=404, content={"detail": f"Asset {asset_name} not found"})

    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        favicon_path = DIST_DIR / "favicon.ico"
        if favicon_path.exists():
            return FileResponse(str(favicon_path))
        return JSONResponse(status_code=404, content={"detail": "Not found"})

    @app.get("/index.html", include_in_schema=False)
    async def serve_index_html():
        return FileResponse(str(DIST_DIR / "index.html"))

    @app.get("/", include_in_schema=False)
    async def serve_root():
        return FileResponse(str(DIST_DIR / "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_fallback(full_path: str):
        if full_path.startswith("api/") or full_path in ["api", "docs", "redoc", "openapi.json"]:
            return JSONResponse(status_code=404, content={"detail": "Not Found"})

        target_file = DIST_DIR / full_path
        if target_file.is_file():
            mime, _ = mimetypes.guess_type(str(target_file))
            return FileResponse(str(target_file), media_type=mime or "application/octet-stream")

        return FileResponse(str(DIST_DIR / "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "app": settings.PROJECT_NAME,
            "docs": "/docs",
            "api_prefix": settings.API_V1_STR,
        }

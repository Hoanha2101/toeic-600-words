import sys
import os
import mimetypes
from pathlib import Path
from urllib.parse import unquote

# Add root directory and backend directory to python path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "backend"))

from backend.app.main import app as fastapi_app

# Common MIME types
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/jpeg", ".jpeg")
mimetypes.add_type("image/x-icon", ".ico")


def find_static_dir() -> Path | None:
    candidates = [
        Path("/var/task/backend/static_dist"),
        Path("/var/task/frontend/dist"),
        ROOT_DIR / "backend" / "static_dist",
        ROOT_DIR / "frontend" / "dist",
        ROOT_DIR / "static_dist",
        Path("backend/static_dist").resolve(),
        Path("frontend/dist").resolve(),
    ]
    for c in candidates:
        if c.exists() and (c / "index.html").exists():
            return c
    return None


async def app(scope, receive, send):
    if scope["type"] == "http":
        path = scope.get("path", "/")

        # 1. Resolve path from query string or headers if rewritten by Vercel
        qs = scope.get("query_string", b"").decode("utf-8")
        if "__path=" in qs:
            filtered_qs = []
            for param in qs.split("&"):
                if param.startswith("__path="):
                    path = "/" + unquote(param.split("=", 1)[1]).lstrip("/")
                elif param:
                    filtered_qs.append(param)
            scope["query_string"] = "&".join(filtered_qs).encode("utf-8")
        elif path in ("/api/index.py", "/api/index", "/api"):
            headers = dict(scope.get("headers", []))
            for h in (b"x-matched-path", b"x-forwarded-uri", b"x-original-uri"):
                if h in headers:
                    path = headers[h].decode("utf-8").split("?")[0]
                    break

        clean_path = "/" + path.lstrip("/")

        static_dir = find_static_dir()

        # 2. Serve static assets directly (e.g. /assets/index-xxx.js)
        if clean_path.startswith("/assets/") and static_dir:
            asset_rel = clean_path.lstrip("/")
            target_file = static_dir / asset_rel
            if not target_file.is_file():
                target_file = static_dir / "assets" / target_file.name

            # If exact file found, serve it
            if target_file.is_file():
                mime_type, _ = mimetypes.guess_type(str(target_file))
                if not mime_type:
                    mime_type = "application/javascript" if str(target_file).endswith(".js") else "text/css"
                content = target_file.read_bytes()
                headers = [
                    (b"content-type", mime_type.encode("utf-8")),
                    (b"content-length", str(len(content)).encode("utf-8")),
                    (b"cache-control", b"public, max-age=31536000, immutable"),
                ]
                await send({"type": "http.response.start", "status": 200, "headers": headers})
                await send({"type": "http.response.body", "body": content})
                return

            # If an older asset hash was requested (e.g. stale browser cache), serve latest matching extension
            ext = target_file.suffix
            assets_folder = static_dir / "assets"
            if assets_folder.exists() and ext in (".js", ".css"):
                matching = list(assets_folder.glob(f"*{ext}"))
                if matching:
                    matching_file = matching[0]
                    mime_type, _ = mimetypes.guess_type(str(matching_file))
                    content = matching_file.read_bytes()
                    headers = [
                        (b"content-type", (mime_type or "application/javascript").encode("utf-8")),
                        (b"content-length", str(len(content)).encode("utf-8")),
                        (b"cache-control", b"no-cache"),
                    ]
                    await send({"type": "http.response.start", "status": 200, "headers": headers})
                    await send({"type": "http.response.body", "body": content})
                    return

        # 3. Serve root static files (favicon.ico, etc.)
        if clean_path in ("/favicon.ico", "/index.html") and static_dir:
            target_file = static_dir / clean_path.lstrip("/")
            if target_file.is_file():
                mime_type, _ = mimetypes.guess_type(str(target_file))
                content = target_file.read_bytes()
                headers = [
                    (b"content-type", (mime_type or "image/x-icon").encode("utf-8")),
                    (b"content-length", str(len(content)).encode("utf-8")),
                ]
                await send({"type": "http.response.start", "status": 200, "headers": headers})
                await send({"type": "http.response.body", "body": content})
                return

        # 4. SPA fallback: Any non-API route (/, /roadmap, /login, /review, /test, etc.)
        if static_dir and not clean_path.startswith("/api/") and clean_path not in ("/api", "/docs", "/redoc", "/openapi.json"):
            index_file = static_dir / "index.html"
            if index_file.is_file():
                content = index_file.read_bytes()
                headers = [
                    (b"content-type", b"text/html; charset=utf-8"),
                    (b"content-length", str(len(content)).encode("utf-8")),
                    (b"cache-control", b"no-cache"),
                ]
                await send({"type": "http.response.start", "status": 200, "headers": headers})
                await send({"type": "http.response.body", "body": content})
                return

        # 5. API routes: forward to FastAPI
        scope["path"] = clean_path

    try:
        await fastapi_app(scope, receive, send)
    except Exception as exc:
        import traceback
        import json
        traceback.print_exc()
        err_msg = json.dumps({"detail": f"Lỗi máy chủ nội bộ: {str(exc)}"}).encode("utf-8")
        headers = [
            (b"content-type", b"application/json"),
            (b"access-control-allow-origin", b"*"),
            (b"access-control-allow-credentials", b"true"),
            (b"access-control-allow-headers", b"*"),
            (b"access-control-allow-methods", b"*"),
            (b"content-length", str(len(err_msg)).encode("utf-8")),
        ]
        await send({"type": "http.response.start", "status": 500, "headers": headers})
        await send({"type": "http.response.body", "body": err_msg})

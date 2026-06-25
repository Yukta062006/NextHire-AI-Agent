import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from app.config import get_settings
from app.database import init_db
from app.routers import (
    auth,
    users,
    resumes,
    job_descriptions,
    interviews,
    scoring,
    analytics,
    career_coach,
    recruiter,
    copilot,
    gamification,
    realtime,
    autopilot,
)

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    # Initialize DB (create tables if they don't exist)
    await init_db()
    yield

app = FastAPI(
    title="NextHire AI Recruiter Agent API",
    description="Autonomous AI Hiring Agent powered by Qwen Cloud — Track 4: Autopilot Agent | Global AI Hackathon with Qwen Cloud (Alibaba Cloud + Devpost)",
    version="2.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health check (MUST be before static mount) ──
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "NextHire Backend",
        "database": "connected",
    }

# ── Mount API Routers ──
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(resumes.router)
app.include_router(job_descriptions.router)
app.include_router(interviews.router)
app.include_router(scoring.router)
app.include_router(analytics.router)
app.include_router(career_coach.router)
app.include_router(recruiter.router)
app.include_router(copilot.router)
app.include_router(gamification.router)
app.include_router(realtime.router)
app.include_router(autopilot.router)

# ── Serve static frontend (for production/Railway deployment ONLY) ──
# In production the Next.js export is built into 'out/' and served by FastAPI.
# In local dev, Next.js dev server runs separately on port 3000/3001.
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "out"))

if os.path.exists(frontend_dir):
    from fastapi.staticfiles import StaticFiles
    
    # Mount static assets (JS, CSS, images) under /_next so they don't conflict with API
    next_static = os.path.join(frontend_dir, "_next")
    if os.path.exists(next_static):
        app.mount("/_next", StaticFiles(directory=next_static), name="next-static")
    
    # Serve other static files from 'out' (favicon, etc.)
    @app.get("/favicon.ico")
    async def favicon():
        fav = os.path.join(frontend_dir, "icon.png")
        if not os.path.exists(fav):
            fav = os.path.join(frontend_dir, "favicon.ico")
        if os.path.exists(fav):
            return FileResponse(fav)
        return JSONResponse(status_code=404, content={"detail": "not found"})
    
    # Catch-all for frontend pages (SPA fallback) - only for non-API routes
    @app.api_route("/{full_path:path}", methods=["GET"], include_in_schema=False)
    async def serve_frontend(request: Request, full_path: str):
        # Never intercept /api/ routes
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        
        # Try to serve exact file match
        file_path = os.path.join(frontend_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Try .html extension (Next.js static export generates .html files)
        html_path = file_path + ".html"
        if os.path.isfile(html_path):
            return FileResponse(html_path, media_type="text/html")
        
        # Try index.html in subdirectory
        index_path = os.path.join(file_path, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path, media_type="text/html")
        
        # Fallback to root index.html (SPA mode)
        root_index = os.path.join(frontend_dir, "index.html")
        if os.path.isfile(root_index):
            return FileResponse(root_index, media_type="text/html")
        
        return JSONResponse(status_code=404, content={"detail": "Page not found"})


if __name__ == "__main__":
    import uvicorn
    port = settings.PORT or settings.BACKEND_PORT
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

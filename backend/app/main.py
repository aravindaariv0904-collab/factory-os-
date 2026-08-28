from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.api.v1.router import v1_router
from backend.app.core.config import get_settings
from backend.app.core.middleware import SecurityHeadersMiddleware

settings = get_settings()

app = FastAPI(
    title="Factory OS Enterprise Decision Intelligence Platform",
    description="Production-Grade Manufacturing AI Decision Intelligence System",
    version="6.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Security Headers & CORS Middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

# Health Check Route
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "Factory OS Enterprise Platform",
        "version": "6.0.0",
        "environment": settings.environment,
    }

# Register V1 Routers
app.include_router(v1_router, prefix="/api/v1")

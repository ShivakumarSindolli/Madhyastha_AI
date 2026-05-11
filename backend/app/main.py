"""
Madhyastha — FastAPI Application Entry Point
AI-Powered Dispute Resolution Platform
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.middleware import RequestLoggingMiddleware
from app.db.database import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("madhyastha")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(RequestLoggingMiddleware)

# Import and register routes
from app.api.routes.dispute import router as dispute_router
from app.api.routes.caucus import router as caucus_router
from app.api.routes.session import router as session_router
from app.api.routes.agreement import router as agreement_router
from app.api.routes.escalation import router as escalation_router
from app.api.routes.arbitration import router as arbitration_router
from app.api.routes.arbitrator_auth import router as arbitrator_auth_router
from app.api.routes.court import router as court_router
from app.api.routes.websocket import router as ws_router
from app.api.routes.risk import router as risk_router
from app.api.routes.tts import router as tts_router
from app.api.routes.stt import router as stt_router

app.include_router(dispute_router)
app.include_router(caucus_router)
app.include_router(session_router)
app.include_router(agreement_router)
app.include_router(escalation_router)
app.include_router(arbitration_router)
app.include_router(arbitrator_auth_router)
app.include_router(court_router)
app.include_router(ws_router)
app.include_router(risk_router)
app.include_router(tts_router)
app.include_router(stt_router)


@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    logger.info("=" * 60)
    logger.info(f"  {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"  AI-Powered Dispute Resolution Platform")
    logger.info(f"  Legal Anchors: Mediation Act 2023 | Arbitration Act 1996")
    logger.info("=" * 60)
    init_db()
    logger.info("Database initialized")


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "description": settings.APP_DESCRIPTION,
        "legal_basis": [
            "Mediation Act, 2023",
            "Arbitration and Conciliation Act, 1996",
            "Code of Civil Procedure, 1908"
        ]
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "service": settings.APP_NAME}

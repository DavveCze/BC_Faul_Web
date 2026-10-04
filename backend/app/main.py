from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.session import router as session_router
from app.api.pretest import router as pretest_router
from app.api.profile import router as profile_router
from app.api.recommend import router as recommend_router
from app.api.posttest import router as posttest_router
from app.api.catalog import router as catalog_router
from app.api.admin import router as admin_router
from app.services.seeder import init_db
from app.models.base import SessionLocal

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API doporučovacího systému pro výběr bakalářské práce (David Faul, KIP PřF OU)",
    version="1.0.0"
)

# CORS middleware pro komunikaci s React frontendem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrace routerů
app.include_router(session_router, prefix=settings.API_V1_STR)
app.include_router(pretest_router, prefix=settings.API_V1_STR)
app.include_router(profile_router, prefix=settings.API_V1_STR)
app.include_router(recommend_router, prefix=settings.API_V1_STR)
app.include_router(posttest_router, prefix=settings.API_V1_STR)
app.include_router(catalog_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }

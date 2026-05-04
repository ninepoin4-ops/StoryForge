import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.database import init_db
from app.routers import config_router, outline_router, generation_router, review_router, export_router, writer_router, project_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.data_dir, exist_ok=True)
    await init_db()
    yield


app = FastAPI(title="StoryForge API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(config_router.router, prefix="/api", tags=["config"])
app.include_router(outline_router.router, prefix="/api", tags=["outline"])
app.include_router(generation_router.router, prefix="/api", tags=["generation"])
app.include_router(review_router.router, prefix="/api", tags=["review"])
app.include_router(export_router.router, prefix="/api", tags=["export"])
app.include_router(writer_router.router, prefix="/api", tags=["writers"])
app.include_router(project_router.router, prefix="/api", tags=["projects"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}

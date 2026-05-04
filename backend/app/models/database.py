from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship
from datetime import datetime
import uuid

from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(256), nullable=False)
    writer = Column(String(64), nullable=False)
    selected_outline_title = Column(String(256), nullable=True)
    content = Column(Text, default="")
    stage = Column(String(32), default="selection")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class OutlineRecord(Base):
    __tablename__ = "outlines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String(36), nullable=False)
    title = Column(String(256), nullable=False)
    summary = Column(Text, nullable=False)
    twist = Column(Text, nullable=False)
    hook = Column(Text, nullable=False)
    hook_score = Column(Float, default=0.0)
    recommended = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class NovelSnapshot(Base):
    __tablename__ = "novel_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String(36), nullable=False)
    content = Column(Text, nullable=False)
    stage = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ReviewRecord(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String(36), nullable=False)
    round = Column(String(32), nullable=False)
    scores = Column(Text, nullable=False)
    analysis_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

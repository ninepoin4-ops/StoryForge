from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.database import get_db, Project, OutlineRecord

router = APIRouter()


@router.get("/projects")
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project).order_by(desc(Project.updated_at))
    )
    projects = result.scalars().all()
    return {
        "projects": [
            {
                "project_id": p.project_id,
                "title": p.title,
                "writer": p.writer,
                "selected_outline_title": p.selected_outline_title,
                "content": p.content[:200] if p.content else "",
                "content_length": len(p.content) if p.content else 0,
                "stage": p.stage,
                "updated_at": p.updated_at.isoformat() if p.updated_at else "",
            }
            for p in projects
        ]
    }


@router.get("/projects/{project_id}")
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project).where(Project.project_id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    outlines_result = await db.execute(
        select(OutlineRecord).where(OutlineRecord.project_id == project_id)
    )
    outlines = outlines_result.scalars().all()

    return {
        "project_id": project.project_id,
        "title": project.title,
        "writer": project.writer,
        "word_count": 24000,
        "stage": project.stage,
        "content": project.content,
        "selected_outline_title": project.selected_outline_title,
        "outlines": [
            {
                "title": o.title,
                "summary": o.summary,
                "twist": o.twist,
                "hook": o.hook,
                "hook_score": o.hook_score,
                "recommended": o.recommended,
            }
            for o in outlines
        ],
        "updated_at": project.updated_at.isoformat() if project.updated_at else "",
    }


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project).where(Project.project_id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    await db.delete(project)
    await db.commit()
    return {"status": "ok"}

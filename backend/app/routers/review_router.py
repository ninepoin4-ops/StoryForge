from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db, Project
from app.models.schemas import ReviewRequest, OptimizeRequest, PolishRequest
from app.services.review_service import (
    run_review, optimize_opening, polish_style,
)
from sqlalchemy import select

router = APIRouter()


@router.post("/review")
async def review_novel(req: ReviewRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await run_review(req, db)

        result_obj = await db.execute(
            select(Project).where(Project.project_id == req.project_id)
        )
        project = result_obj.scalar_one_or_none()
        if project:
            project.content = req.content
            if req.round.value == "hook_twist" and project.stage == "review_1":
                project.stage = "review_2"
            elif req.round.value == "finale" and project.stage == "review_2":
                project.stage = "review_3"
            elif req.round.value == "style" and project.stage == "review_3":
                project.stage = "completed"
            await db.commit()

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"审查失败: {str(e)}")


@router.post("/optimize")
async def optimize_novel(req: OptimizeRequest, db: AsyncSession = Depends(get_db)):
    try:
        if req.section == "opening":
            optimized = await optimize_opening(
                req.project_id, req.content, req.writer,
                req.suggestions, req.model, db
            )
            return {"content": optimized}
        else:
            raise HTTPException(status_code=400, detail=f"不支持的优化类型: {req.section}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"优化失败: {str(e)}")


@router.post("/polish")
async def polish_novel(req: PolishRequest, db: AsyncSession = Depends(get_db)):
    try:
        polished = await polish_style(
            req.project_id, req.content, req.writer, req.model, db
        )
        return {"content": polished}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"风格润色失败: {str(e)}")

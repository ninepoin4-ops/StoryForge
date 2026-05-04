from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import OutlineRequest, OutlineResponse
from app.services.outline_service import generate_outlines

router = APIRouter()


@router.post("/outlines/generate", response_model=OutlineResponse)
async def create_outlines(req: OutlineRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await generate_outlines(req, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"大纲生成失败: {str(e)}")

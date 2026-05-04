from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import os

from app.models.database import get_db
from app.models.schemas import ExportRequest
from app.services.export_service import export_novel

router = APIRouter()


@router.post("/export")
async def export(req: ExportRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await export_novel(req)
        import base64
        content = ""
        filepath = result["path"]
        if os.path.exists(filepath):
            with open(filepath, "rb") as f:
                content = base64.b64encode(f.read()).decode()
        return {
            "format": result["format"],
            "filename": result["filename"],
            "content": content,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}")

from fastapi import APIRouter
from app.services.writer_loader import get_all_writers_summary

router = APIRouter()


@router.get("/writers")
async def list_writers():
    return {"writers": get_all_writers_summary()}

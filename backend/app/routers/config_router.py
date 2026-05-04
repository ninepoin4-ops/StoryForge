from fastapi import APIRouter
from app.config import settings, save_config, _load_persisted
from app.models.schemas import ConfigUpdate

router = APIRouter()


@router.get("/config")
async def get_config():
    return {
        "api_base_url": settings.api_base_url,
        "api_key": settings.api_key,
        "model_name": settings.model_name,
        "default_word_count": settings.default_word_count,
    }


@router.put("/config")
async def update_config(cfg: ConfigUpdate):
    if cfg.api_base_url is not None:
        settings.api_base_url = cfg.api_base_url
    if cfg.api_key is not None:
        settings.api_key = cfg.api_key
    if cfg.model_name is not None:
        settings.model_name = cfg.model_name
    if cfg.default_word_count is not None:
        settings.default_word_count = cfg.default_word_count
    save_config({
        "api_base_url": settings.api_base_url,
        "api_key": settings.api_key,
        "model_name": settings.model_name,
        "default_word_count": settings.default_word_count,
    })
    return {"status": "ok", "message": "配置已保存"}

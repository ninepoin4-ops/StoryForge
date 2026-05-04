import os
import json
from pydantic_settings import BaseSettings
from pydantic import Field

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
CONFIG_FILE = os.path.join(DATA_DIR, "config.json")

_defaults = {
    "api_base_url": "https://api.openai.com/v1",
    "api_key": "",
    "model_name": "gpt-4o",
    "default_word_count": 24000,
}


def _load_persisted() -> dict:
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
            return {k: saved.get(k, v) for k, v in _defaults.items()}
    except Exception:
        pass
    return dict(_defaults)


def save_config(cfg: dict):
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        current = _load_persisted()
        current.update({k: v for k, v in cfg.items() if v is not None})
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(current, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


_persisted = _load_persisted()


class Settings(BaseSettings):
    api_base_url: str = Field(
        default=_persisted["api_base_url"],
        description="LLM API base URL"
    )
    api_key: str = Field(default=_persisted["api_key"], description="LLM API key")
    model_name: str = Field(default=_persisted["model_name"], description="Default model name")
    default_word_count: int = Field(default=_persisted["default_word_count"], description="Default target word count")
    data_dir: str = Field(default=DATA_DIR, description="Data storage directory")
    database_url: str = Field(
        default=f"sqlite+aiosqlite:///{DATA_DIR}/storyforge.db",
        description="SQLite database URL"
    )

    model_config = {"env_prefix": "STORYFORGE_", "env_file": ".env", "protected_namespaces": ("settings_",)}

    @property
    def api_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }


settings = Settings()

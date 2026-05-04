import json
import httpx
from typing import AsyncIterator, Optional
from app.config import settings


def _get_api_key() -> str:
    return (settings.api_key or "").strip()


def _get_base_url() -> str:
    return (settings.api_base_url or "https://api.openai.com/v1").rstrip("/")


def _get_model() -> str:
    return settings.model_name or "gpt-4o"


def _headers() -> dict:
    headers = {"Content-Type": "application/json"}
    key = _get_api_key()
    if key:
        headers["Authorization"] = f"Bearer {key}"
    return headers


def _ensure_key():
    if not _get_api_key():
        raise ValueError("API Key 未配置，请先在页面右上角「配置」中设置 API Key 和 Base URL")


async def chat(
    messages: list,
    model: Optional[str] = None,
    temperature: float = 0.7,
    top_p: float = 0.85,
    frequency_penalty: float = 0.15,
    presence_penalty: float = 0.1,
) -> str:
    _ensure_key()
    model_name = model or _get_model()
    async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
        resp = await client.post(
            f"{_get_base_url()}/chat/completions",
            headers=_headers(),
            json={
                "model": model_name,
                "messages": messages,
                "temperature": temperature,
                "top_p": top_p,
                "frequency_penalty": frequency_penalty,
                "presence_penalty": presence_penalty,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def chat_stream(
    messages: list,
    model: Optional[str] = None,
    temperature: float = 0.7,
    top_p: float = 0.85,
    frequency_penalty: float = 0.15,
    presence_penalty: float = 0.1,
) -> AsyncIterator[str]:
    _ensure_key()
    model_name = model or _get_model()
    async with httpx.AsyncClient(timeout=httpx.Timeout(300.0)) as client:
        async with client.stream(
            "POST",
            f"{_get_base_url()}/chat/completions",
            headers=_headers(),
            json={
                "model": model_name,
                "messages": messages,
                "temperature": temperature,
                "top_p": top_p,
                "frequency_penalty": frequency_penalty,
                "presence_penalty": presence_penalty,
                "stream": True,
            },
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk["choices"][0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield content
                    except json.JSONDecodeError:
                        continue

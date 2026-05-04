import json
from typing import AsyncIterator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import app.services.llm_client as llm_client
from app.services.writer_loader import (
    get_writer,
    get_writer_style_prompt,
    build_style_context,
    build_few_shot_prompt,
)
from app.models.schemas import GenerateRequest
from app.models.database import Project, NovelSnapshot
from app.prompts.generation_prompt import NOVEL_GENERATION_PROMPT, CONTINUATION_PROMPT

SEGMENT_THRESHOLD = 24000
SEGMENT_CHARS = 12000
TEMPERATURE = 1.0


def _has_ending(text: str) -> bool:
    last_200 = text[-200:] if len(text) > 200 else text
    endings = ["全文完", "剧终", "——完——", "·终·"]
    return any(e in last_200 for e in endings)


def _build_style_block(writer_key: str) -> tuple:
    style = get_writer_style_prompt(writer_key)
    dims = build_style_context(writer_key)
    shots = build_few_shot_prompt(writer_key)
    return style, dims, shots


async def _persist(full_text: str, project_id: str, db: AsyncSession):
    result = await db.execute(
        select(Project).where(Project.project_id == project_id)
    )
    project = result.scalar_one_or_none()
    if project:
        project.content = full_text
        project.stage = "review_1"
        await db.commit()

    snapshot = NovelSnapshot(
        project_id=project_id,
        content=full_text,
        stage="initial_generation",
    )
    db.add(snapshot)
    await db.commit()


async def generate_novel_stream(req: GenerateRequest, db: AsyncSession) -> AsyncIterator[str]:
    writer = get_writer(req.writer)
    style_prompt, style_dims, few_shots = _build_style_block(req.writer)
    total_target = req.word_count
    full_text = ""

    prompt = NOVEL_GENERATION_PROMPT.format(
        writer_name=writer["name"],
        writer_style=style_prompt,
        style_dimensions=style_dims,
        style_few_shots=few_shots,
        outline_title=req.outline.title,
        outline_summary=req.outline.summary,
        outline_twist=req.outline.twist,
        outline_hook=req.outline.hook,
    )

    system_msg = f"你是{writer['name']}风格的杰出小说家，文笔精炼，语序通顺，创作质量卓越。"
    if total_target < SEGMENT_THRESHOLD:
        system_msg += f"请一次完成全篇，目标约{total_target}字。"

    messages = [{"role": "system", "content": system_msg}, {"role": "user", "content": prompt}]

    async for chunk in llm_client.chat_stream(messages, model=req.model, temperature=TEMPERATURE):
        full_text += chunk
        yield chunk

    if total_target < SEGMENT_THRESHOLD:
        await _persist(full_text, req.project_id, db)
        return

    seg_count = max(1, total_target // SEGMENT_CHARS)
    for seg_idx in range(seg_count):
        if _has_ending(full_text):
            break
        remaining = total_target - len(full_text)
        if remaining < 800:
            break

        seg_target = min(SEGMENT_CHARS, remaining)
        recent = full_text[-1500:] if len(full_text) > 1500 else full_text

        continuation = CONTINUATION_PROMPT.format(
            writer_name=writer["name"],
            writer_style=style_prompt,
            style_dimensions=style_dims,
            word_count=seg_target,
            outline_title=req.outline.title,
            outline_summary=req.outline.summary,
            outline_twist=req.outline.twist,
            previous_ending=recent,
        )

        cont_messages = [
            {"role": "system", "content": f"你是{writer['name']}风格的杰出小说家，续写时保持风格统一、文笔卓越。"},
            {"role": "user", "content": continuation},
        ]

        yield "\n\n"
        full_text += "\n\n"

        async for chunk in llm_client.chat_stream(cont_messages, model=req.model, temperature=TEMPERATURE):
            full_text += chunk
            yield chunk

    await _persist(full_text, req.project_id, db)

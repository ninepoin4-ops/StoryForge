import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import app.services.llm_client as llm_client
from app.services.writer_loader import get_writer, get_writer_style_prompt
from app.models.schemas import ReviewRequest, ReviewRound
from app.models.database import Project, NovelSnapshot, ReviewRecord
from app.prompts.review_prompts import (
    HOOK_TWIST_REVIEW_PROMPT,
    FINALE_REVIEW_PROMPT,
    STYLE_REVIEW_PROMPT,
)


async def run_review(req: ReviewRequest, db: AsyncSession) -> dict:
    writer = get_writer(req.writer)

    if req.round == ReviewRound.HOOK_TWIST:
        return await review_hook_twist(req, db)
    elif req.round == ReviewRound.FINALE:
        return await review_finale(req, db)
    elif req.round == ReviewRound.STYLE:
        return await review_style(req, db)
    else:
        raise ValueError(f"Unknown review round: {req.round}")


async def review_hook_twist(req: ReviewRequest, db: AsyncSession) -> dict:
    writer = get_writer(req.writer)
    prompt = HOOK_TWIST_REVIEW_PROMPT.format(
        writer_name=writer["name"],
        novel_content=req.content[:6000],
    )
    messages = [
        {"role": "system", "content": "你是一位严格的文学审查专家，必须返回JSON格式的分析结果。"},
        {"role": "user", "content": prompt},
    ]
    response = await llm_client.chat(messages, model=req.model, temperature=0.3)
    result = _parse_json(response)

    await _save_review(req.project_id, req.round.value, result, db)
    return result


async def review_finale(req: ReviewRequest, db: AsyncSession) -> dict:
    writer = get_writer(req.writer)
    prompt = FINALE_REVIEW_PROMPT.format(
        writer_name=writer["name"],
        novel_content=req.content[:8000],
    )
    messages = [
        {"role": "system", "content": "你是一位资深文学评论家，必须返回JSON格式的终审点评。"},
        {"role": "user", "content": prompt},
    ]
    response = await llm_client.chat(messages, model=req.model, temperature=0.5)
    result = _parse_json(response)

    await _save_review(req.project_id, req.round.value, result, db)
    return result


async def review_style(req: ReviewRequest, db: AsyncSession) -> dict:
    writer = get_writer(req.writer)
    style_targets = writer.get("style_targets", {})
    prompt = STYLE_REVIEW_PROMPT.format(
        writer_name=writer["name"],
        style_targets=json.dumps(style_targets, ensure_ascii=False),
        novel_content=req.content[:8000],
    )
    messages = [
        {"role": "system", "content": "你是一位文学风格分析专家，必须返回JSON格式的分析结果。"},
        {"role": "user", "content": prompt},
    ]
    response = await llm_client.chat(messages, model=req.model, temperature=0.3)
    result = _parse_json(response)

    await _save_review(req.project_id, req.round.value, result, db)
    return result


async def optimize_opening(project_id: str, content: str, writer: str, suggestions: list, model: str, db: AsyncSession) -> str:
    writer_info = get_writer(writer)
    style_prompt = get_writer_style_prompt(writer)
    opening = content[:800] if len(content) > 800 else content
    rest = content[800:] if len(content) > 800 else ""

    prompt = f"""以【{writer_info['name']}】的风格，重写以下小说的开篇（前800字），使其更具吸睛力。

风格要求：{style_prompt}

优化建议：{json.dumps(suggestions, ensure_ascii=False) if suggestions else '增强开篇钩子、增加悬念、使用强动作/对话开头'}

原开篇：
{opening}

请只返回重写后的开篇文本，不要输出其他内容。"""
    messages = [
        {"role": "system", "content": f"你是{writer_info['name']}风格的文学编辑。"},
        {"role": "user", "content": prompt},
    ]
    new_opening = await llm_client.chat(messages, model=model, temperature=0.7)
    return new_opening + "\n\n" + rest


async def polish_style(project_id: str, content: str, writer: str, model: str, db: AsyncSession) -> str:
    writer_info = get_writer(writer)
    style_prompt = get_writer_style_prompt(writer)

    prompt = f"""请以【{writer_info['name']}】的写作风格，对以下小说进行全局风格润色。
严格保持原有的情节、人物和结构不变，仅调整语言风格以更贴合作家的文风。

风格要求：{style_prompt}

原小说：
{content}

请直接返回润色后的完整小说。"""
    messages = [
        {"role": "system", "content": f"你是{writer_info['name']}风格的大师级编辑。"},
        {"role": "user", "content": prompt},
    ]
    polished = await llm_client.chat(messages, model=model, temperature=0.6)

    snapshot = NovelSnapshot(
        project_id=project_id,
        content=polished,
        stage="style_polished",
    )
    db.add(snapshot)
    await db.commit()
    return polished


async def _save_review(project_id: str, round_name: str, result: dict, db: AsyncSession):
    record = ReviewRecord(
        project_id=project_id,
        round=round_name,
        scores=json.dumps(result.get("scores", {}), ensure_ascii=False),
        analysis_json=json.dumps(result, ensure_ascii=False),
    )
    db.add(record)
    await db.commit()


def _parse_json(response: str) -> dict:
    response = response.strip()
    if response.startswith("```"):
        lines = response.split("\n")
        response = "\n".join(lines[1:-1])
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        pass
    import re
    match = re.search(r"\{.*\}", response, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return {"error": "解析失败", "raw": response[:500]}

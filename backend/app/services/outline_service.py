import json
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import app.services.llm_client as llm_client
from app.services.writer_loader import get_writer, get_writer_style_prompt
from app.models.schemas import OutlineRequest, Outline, OutlineResponse
from app.models.database import Project, OutlineRecord
from app.prompts.outline_prompt import OUTLINE_GENERATION_PROMPT


async def generate_outlines(req: OutlineRequest, db: AsyncSession) -> OutlineResponse:
    writer = get_writer(req.writer)
    style_prompt = get_writer_style_prompt(req.writer)

    if req.plot_reference and req.plot_reference.strip():
        plot_instruction = f"请严格以以下用户提供的剧情参考为创作基础来构思：\n{req.plot_reference}\n\n在此参考基础上，"
    else:
        plot_instruction = ""

    prompt = OUTLINE_GENERATION_PROMPT.format(
        writer_name=writer["name"],
        writer_style=style_prompt,
        title=req.title,
        plot_instruction=plot_instruction,
        word_count=req.word_count,
    )

    messages = [
        {"role": "system", "content": "你是一位能用15位大师风格构思故事的大纲师。你必须以严格的JSON数组格式返回5个故事大纲。"},
        {"role": "user", "content": prompt},
    ]

    response = await llm_client.chat(messages, model=req.model, temperature=0.7)
    outlines_data = _parse_outline_json(response)

    project_id = str(uuid.uuid4())

    project = Project(
        project_id=project_id,
        title=req.title,
        writer=req.writer,
        stage="outline_selection",
    )
    db.add(project)

    max_score = max(o.get("hook_score", 0) for o in outlines_data)
    outlines = []
    for od in outlines_data:
        score = float(od.get("hook_score", 5))
        outline = Outline(
            title=od.get("title", "未命名"),
            summary=od.get("summary", ""),
            twist=od.get("twist", ""),
            hook=od.get("hook", ""),
            hook_score=score,
            recommended=(score >= max_score - 0.1),
        )
        outlines.append(outline)

        db.add(OutlineRecord(
            project_id=project_id,
            title=outline.title,
            summary=outline.summary,
            twist=outline.twist,
            hook=outline.hook,
            hook_score=outline.hook_score,
            recommended=outline.recommended,
        ))

    await db.commit()
    return OutlineResponse(outlines=outlines, project_id=project_id)


def _parse_outline_json(response: str) -> list:
    response = response.strip()
    if response.startswith("```"):
        lines = response.split("\n")
        response = "\n".join(lines[1:-1])
    try:
        data = json.loads(response)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass
    import re
    match = re.search(r"\[.*\]", response, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return [
        {
            "title": "未命名大纲",
            "summary": "解析失败，请重试",
            "twist": "",
            "hook": "",
            "hook_score": 5.0,
            "recommended": True,
        }
    ]

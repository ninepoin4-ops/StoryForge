import json
import os
import uuid
from app.config import settings
from app.models.schemas import ExportRequest, ExportFormat
from app.services.writer_loader import get_writer


async def export_novel(req: ExportRequest) -> dict:
    project_dir = os.path.join(settings.data_dir, "exports", req.project_id)
    os.makedirs(project_dir, exist_ok=True)

    safe_title = req.title.replace(" ", "_").replace("/", "_")[:64]
    writer = get_writer(req.writer)

    if req.format == ExportFormat.TXT:
        filepath = os.path.join(project_dir, f"{safe_title}.txt")
        _export_txt(filepath, req.title, req.content, writer)
        return {"format": "txt", "path": filepath, "filename": f"{safe_title}.txt"}

    elif req.format == ExportFormat.MARKDOWN:
        filepath = os.path.join(project_dir, f"{safe_title}.md")
        _export_markdown(filepath, req.title, req.content, writer)
        return {"format": "markdown", "path": filepath, "filename": f"{safe_title}.md"}

    elif req.format == ExportFormat.IMAGE:
        filepath = os.path.join(project_dir, f"{safe_title}.png")
        _export_image(filepath, req.title, req.content, writer)
        return {"format": "image", "path": filepath, "filename": f"{safe_title}.png"}

    raise ValueError(f"Unknown format: {req.format}")


def _export_txt(filepath: str, title: str, content: str, writer: dict):
    header = f"《{title}》\n"
    header += f"写作风格：{writer['name']}\n"
    header += "由 StoryForge 生成\n"
    header += "=" * 50 + "\n\n"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(header + content)


def _export_markdown(filepath: str, title: str, content: str, writer: dict):
    md = f"# 《{title}》\n\n"
    md += f"> 写作风格：**{writer['name']}**\n\n"
    md += f"> 由 StoryForge 生成\n\n"
    md += "---\n\n"
    md += content
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md)


def _export_image(filepath: str, title: str, content: str, writer: dict):
    from PIL import Image, ImageDraw, ImageFont

    width, padding = 800, 40
    font_paths = [
        "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/simhei.ttf",
        "C:/Windows/Fonts/simsun.ttc",
    ]
    font = None
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, 14)
                break
            except Exception:
                continue
    if font is None:
        font = ImageFont.load_default()

    title_font = None
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                title_font = ImageFont.truetype(fp, 32)
                break
            except Exception:
                continue
    if title_font is None:
        title_font = font

    line_height = 22
    chars_per_line = 40
    lines = []
    for paragraph in content.split("\n"):
        para = paragraph.strip()
        if not para:
            lines.append("")
            continue
        for i in range(0, len(para), chars_per_line):
            lines.append(para[i:i + chars_per_line])

    title_lines = [f"《{title}》", f"风格：{writer['name']} | StoryForge出品", ""]
    total_lines = len(title_lines) + len(lines) + 2

    img_height = max(800, padding * 2 + total_lines * line_height + 200)
    img = Image.new("RGB", (width, img_height), (248, 244, 235))
    draw = ImageDraw.Draw(img)

    y = padding
    for line in title_lines:
        draw.text((padding, y), line, fill=(40, 40, 40), font=title_font if line.startswith("《") else font)
        y += line_height + 4

    y += 20
    watermark_line = f"—— {writer['name']}风格 · StoryForge ——"
    draw.text((width - padding - len(watermark_line) * 8, img_height - padding - 20),
              watermark_line, fill=(180, 170, 150), font=font)

    for line in lines:
        draw.text((padding, y), line, fill=(30, 30, 30), font=font)
        y += line_height
        if y > img_height - 60:
            break

    img.save(filepath, "PNG")

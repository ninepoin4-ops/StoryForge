import json
import os

WRITERS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "writers")
_writers_cache = {}


def load_writers() -> dict:
    global _writers_cache
    if _writers_cache:
        return _writers_cache

    for filename in os.listdir(WRITERS_DIR):
        if filename.endswith(".json"):
            filepath = os.path.join(WRITERS_DIR, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    writer = json.load(f)
                    _writers_cache[writer["key"]] = writer
            except (json.JSONDecodeError, KeyError):
                continue
    return _writers_cache


def get_writer(key: str) -> dict:
    writers = load_writers()
    return writers.get(key, writers.get("hemingway", {
        "key": "unknown",
        "name": "海明威",
        "style_prompt": "简洁、硬汉、冰山理论、对话精准。",
        "signature_sentence": "天亮前，他喝了最后一杯酒，没再说话。",
    }))


WRITER_CATEGORIES = {
    "hemingway": "经典", "zhang_ailing": "经典", "lu_xun": "经典", "marquez": "经典",
    "murakami": "经典", "jk_rowling": "经典", "liu_cixin": "经典", "asimov": "经典",
    "wang_xiaobo": "经典", "yu_hua": "经典", "jin_yong": "经典", "borges": "经典",
    "kafka": "经典", "fitzgerald": "经典", "tolkien": "经典",
    "mo_yan": "经典", "san_mao": "经典", "gu_long": "经典", "wang_zengqi": "经典",
    "yan_geling": "经典", "a_cheng": "经典", "kawabata": "经典", "dazai": "经典",
    "lao_she": "经典", "shen_congwen": "经典", "xiao_hong": "经典", "salinger": "经典",
    "su_tong": "经典", "stephen_king": "经典", "george_martin": "经典",
    "neil_gaiman": "经典", "dan_brown": "经典",
    "zhou_dedong": "现代", "ma_boyong": "现代", "mao_ni": "现代",
    "tianxia_bachang": "现代", "jiang_nan": "现代", "han_han": "现代",
    "gu_man": "现代", "tiancan_tudou": "现代", "higashino_keigo": "现代",
    "tang_jia_san_shao": "现代", "priest": "现代", "ba_yue_chang_an": "现代",
    "feng_huo_xi_zhu_hou": "现代", "fei_wo_si_cun": "现代", "hu_die_lan": "现代",
    "jiu_ba_dao": "现代", "wei_yu": "现代", "bu_fei_yan": "现代", "guo_jingming": "现代",
}


def get_all_writers_summary() -> list:
    writers = load_writers()
    return [
        {
            "key": w["key"],
            "name": w["name"],
            "name_en": w.get("name_en", w["name"]),
            "signature_sentence": w.get("signature_sentence", ""),
            "description": w.get("description", ""),
            "category": WRITER_CATEGORIES.get(w["key"], "经典"),
        }
        for w in writers.values()
    ]


def get_writer_style_prompt(key: str) -> str:
    writer = get_writer(key)
    return writer.get("style_prompt", "")


def get_writer_style_dimensions(key: str) -> dict:
    writer = get_writer(key)
    return writer.get("style_dimensions", {})


def get_writer_few_shots(key: str) -> list:
    writer = get_writer(key)
    return writer.get("few_shots", [])


def build_style_context(key: str) -> str:
    """Build a comprehensive style context for the LLM prompt."""
    writer = get_writer(key)
    parts = []

    dims = writer.get("style_dimensions", {})
    if dims:
        sent = dims.get("sentence", {})
        voc = dims.get("vocabulary", {})
        narr = dims.get("narrative_distance", {})
        dial = dims.get("dialogue", {})
        rhy = dims.get("rhythm", {})
        neg = dims.get("negative_constraints", [])

        if sent:
            parts.append(f"句式：{'；'.join(sent.get('features', []))}。{sent.get('avg_length', '')}。常用模式：{'；'.join(sent.get('patterns', []))}")
        if voc:
            parts.append(f"用词：{voc.get('type', '')} 词域{'、'.join(voc.get('domain', []))}。禁用：{'、'.join(voc.get('taboo', []))}。偏好：{'、'.join(voc.get('preferred', []))}")
        if narr:
            parts.append(f"叙事：{narr.get('type', '')}，{narr.get('pov', '')}。规则：{narr.get('rule', '')}")
        if dial:
            parts.append(f"对话：{dial.get('density', '')}，{dial.get('style', '')}。{dial.get('rule', '')}")
        if rhy:
            parts.append(f"节奏：{rhy.get('pace', '')}。技巧：{'；'.join(rhy.get('technique', []))}")
        if neg:
            parts.append(f"严禁：{'；'.join(neg)}")

    return "\n".join(parts)


def build_few_shot_prompt(key: str) -> str:
    """Build few-shot examples for the LLM prompt."""
    shots = get_writer_few_shots(key)
    if not shots:
        return ""
    lines = ["以下为该作家风格的参考示例："]
    for i, shot in enumerate(shots, 1):
        lines.append(f"示例{i}：{shot}")
    return "\n".join(lines)

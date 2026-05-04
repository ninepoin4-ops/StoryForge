from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class WriterKey(str, Enum):
    HEMINGWAY = "hemingway"
    ZHANG_AILING = "zhang_ailing"
    LU_XUN = "lu_xun"
    MARQUEZ = "marquez"
    MURAKAMI = "murakami"
    JK_ROWLING = "jk_rowling"
    LIU_CIXIN = "liu_cixin"
    ASIMOV = "asimov"
    WANG_XIAOBO = "wang_xiaobo"
    YU_HUA = "yu_hua"
    JIN_YONG = "jin_yong"
    BORGES = "borges"
    KAFKA = "kafka"
    FITZGERALD = "fitzgerald"
    TOLKIEN = "tolkien"
    ZHOU_DEDONG = "zhou_dedong"
    MA_BOYONG = "ma_boyong"
    MAO_NI = "mao_ni"
    TIANXIA_BACHANG = "tianxia_bachang"
    JIANG_NAN = "jiang_nan"
    HAN_HAN = "han_han"
    GU_MAN = "gu_man"
    TIANCAN_TUDOU = "tiancan_tudou"
    HIGASHINO_KEIGO = "higashino_keigo"
    MO_YAN = "mo_yan"
    SAN_MAO = "san_mao"
    GU_LONG = "gu_long"
    WANG_ZENGQI = "wang_zengqi"
    YAN_GELING = "yan_geling"
    A_CHENG = "a_cheng"
    DAN_BROWN = "dan_brown"
    STEPHEN_KING = "stephen_king"
    GEORGE_MARTIN = "george_martin"
    KAWABATA = "kawabata"
    DAZAI = "dazai"
    LAO_SHE = "lao_she"
    SHEN_CONGWEN = "shen_congwen"
    XIAO_HONG = "xiao_hong"
    NEIL_GAIMAN = "neil_gaiman"
    SALINGER = "salinger"
    SU_TONG = "su_tong"


class WriterInfo(BaseModel):
    key: str
    name: str
    name_en: str
    signature_sentence: str
    description: str


class ConfigUpdate(BaseModel):
    model_config = {"protected_namespaces": ()}
    api_base_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    default_word_count: Optional[int] = None


class OutlineRequest(BaseModel):
    title: str
    writer: str
    word_count: int = 24000
    story_type: Optional[str] = None
    plot_reference: Optional[str] = None
    model: Optional[str] = None


class Outline(BaseModel):
    title: str
    summary: str
    twist: str
    hook: str
    hook_score: float
    recommended: bool = False


class OutlineResponse(BaseModel):
    outlines: List[Outline]
    project_id: str


class GenerateRequest(BaseModel):
    project_id: str
    outline: Outline
    writer: str
    word_count: int = 24000
    model: Optional[str] = None


class ReviewRound(str, Enum):
    HOOK_TWIST = "hook_twist"
    FINALE = "finale"
    STYLE = "style"


class ReviewRequest(BaseModel):
    project_id: str
    round: ReviewRound
    content: str
    writer: str
    model: Optional[str] = None


class HookTwistReview(BaseModel):
    opening_score: float
    twist_score: float
    hook_sentences: List[str]
    twist_analysis: str
    suggestions: List[str]


class FinaleReview(BaseModel):
    overall_score: float
    pacing_comment: str
    emotional_impact: str
    highlights: List[str]
    final_verdict: str


class StyleDimension(BaseModel):
    name: str
    target: float
    actual: float


class Violation(BaseModel):
    text_range: tuple
    reason: str
    suggestion: str


class StyleReview(BaseModel):
    dimensions: List[StyleDimension]
    overall_match: float
    violations: List[Violation]
    approved: bool


class OptimizeRequest(BaseModel):
    project_id: str
    content: str
    writer: str
    section: str = "opening"
    suggestions: Optional[List[str]] = None
    model: Optional[str] = None


class PolishRequest(BaseModel):
    project_id: str
    content: str
    writer: str
    model: Optional[str] = None


class ExportFormat(str, Enum):
    TXT = "txt"
    MARKDOWN = "markdown"
    IMAGE = "image"


class ExportRequest(BaseModel):
    project_id: str
    title: str
    content: str
    format: ExportFormat
    writer: str


class ProjectSnapshot(BaseModel):
    id: int
    project_id: str
    content: str
    stage: str
    created_at: datetime

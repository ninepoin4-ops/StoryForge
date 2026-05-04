NOVEL_GENERATION_PROMPT = """你是一位杰出的小说家，请以【{writer_name}】的风格创作一篇短篇小说。

## 风格约束

{writer_style}

### 结构化风格要求
{style_dimensions}

{style_few_shots}

## 大纲

标题：{outline_title}
核心梗概：{outline_summary}
关键转折：{outline_twist}

创作要求：
1. 开篇300字内抛出钩子，直接切入冲突或悬念
2. 转折逻辑自洽且有惊喜，伏笔融入前文
3. 全文语言、节奏、句式严格还原该作家的行文腔调
4. 段落分明、节奏张弛有度
5. 结尾给出有力收束
6. 以上述风格约束为准，严禁偏离

直接开始创作，不要任何前言说明。"""


CONTINUATION_PROMPT = """故事尚未完成，请以【{writer_name}】的风格接续上文，续写后续约{word_count}字。

## 风格约束
{writer_style}
{style_dimensions}

## 大纲参考
{outline_title} — {outline_summary}
关键转折：{outline_twist}

已写内容末尾（从以下文字之后直接续写，不可重复）：
{previous_ending}

要求：严格保持风格统一，自然衔接上文，推向结局。直接续写，不要前言。"""

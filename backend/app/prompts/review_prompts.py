HOOK_TWIST_REVIEW_PROMPT = """请分析以下以【{writer_name}】风格创作的短篇小说，从以下两个维度严格审查：

1. 开篇吸睛度（opening_score）：判断前800字是否足够抓人，指出具体钩子句子，评分0-100。
2. 转折质量（twist_score）：找出文中最关键的转折点，评估其意外性与合理性，并指出是否伏笔充足，评分0-100。

小说全文：
{novel_content}

请以JSON格式返回，结构如下：
{{
  "opening_score": 0-100,
  "twist_score": 0-100,
  "hook_sentences": ["钩子句子1", "钩子句子2"],
  "twist_analysis": "转折分析文字",
  "suggestions": ["优化建议1", "优化建议2"]
}}
只返回JSON，不要其他内容。"""


FINALE_REVIEW_PROMPT = """请对以下以【{writer_name}】风格创作的短篇小说做终审点评，从以下维度给出整体评价：

1. overall_score: 整体质量评分（0-100）
2. pacing_comment: 节奏感评价——叙事节奏是否张弛有度，高潮低谷安排是否合理
3. emotional_impact: 情感冲击力——是否在关键处打动读者，情感是否真实可信
4. highlights: 值得称赞的亮点（列出2-4个具体的高光时刻或精妙段落）
5. final_verdict: 终审评语——一句话总结这篇小说的独特价值和读者感受

小说全文：
{novel_content}

请以JSON格式返回，结构如下：
{{
  "overall_score": 0-100,
  "pacing_comment": "...",
  "emotional_impact": "...",
  "highlights": ["亮点1", "亮点2"],
  "final_verdict": "..."
}}
只返回JSON，不要其他内容。"""


STYLE_REVIEW_PROMPT = """请详细分析以下小说是否符合【{writer_name}】的写作风格。

目标风格指标：
{style_targets}

小说全文（前8000字）：
{novel_content}

请从以下五个维度量化评分（0-100）：
1. 简洁度（sentence_brevity）：句子是否短小精悍
2. 朴素度（word_plainness）：用词是否朴实无华
3. 对话密度（dialogue_density）：对话在文中的占比
4. 含蓄度（implicitness）：是否避免直白心理描写（冰山原则）
5. 行动导向（action_orientation）：是否侧重动作和外部描写

同时评估：
- overall_match: 整体风格吻合度 (0-100)
- violations: 严重偏离风格的具体段落，包含text_range（如"第3段至第5段"）、reason、suggestion

请以JSON格式返回，结构如下：
{{
  "dimensions": [
    {{"name": "简洁度", "target": 85, "actual": 70}},
    ...
  ],
  "overall_match": 75,
  "violations": [
    {{"text_range": ["第N段", "第M段"], "reason": "...", "suggestion": "..."}}
  ]
}}
只返回JSON，不要其他内容。"""

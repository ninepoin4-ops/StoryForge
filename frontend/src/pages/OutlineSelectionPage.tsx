import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import type { Outline } from "../types";

export default function OutlineSelectionPage() {
  const navigate = useNavigate();
  const store = useProjectStore();
  const [selected, setSelected] = useState<Outline | null>(
    store.outlines.find((o) => o.recommended) || store.outlines[0] || null
  );
  const [detailOpen, setDetailOpen] = useState<Outline | null>(null);

  if (!store.outlines.length) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <p className="text-sub text-sm">暂无可选大纲</p>
        <button onClick={() => navigate("/")} className="mt-6 px-6 py-2 bg-ink text-surface rounded-full text-xs tracking-wider hover:bg-ink/80 transition-colors">返回首页</button>
      </div>
    );
  }

  const maxScore = Math.max(...store.outlines.map((o) => o.hook_score));

  const handleStartWriting = () => {
    if (!selected) return;
    store.selectOutline(selected);
    navigate("/writing");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-xl text-ink mb-2 font-serif">《{store.title}》</h2>
        <p className="text-sub text-sm">选择你喜欢的故事大纲</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {store.outlines.map((outline, i) => {
          const isSelected = selected?.title === outline.title;
          const isRecommended = outline.hook_score >= maxScore - 0.1;
          const scorePercent = outline.hook_score * 10;
          const scoreColor = scorePercent >= 75 ? "#059669" : scorePercent >= 50 ? "#d97706" : "#dc2626";

          return (
            <div
              key={i}
              onClick={() => setSelected(outline)}
              className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${isSelected
                  ? "border-gold/60 bg-gold-light shadow-md scale-[1.02]"
                  : "border-border bg-panel hover:border-gold/20 hover:shadow-sm"
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm text-ink font-bold truncate flex-1 mr-2">{outline.title}</h3>
                {isRecommended && (
                  <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full whitespace-nowrap font-medium">推荐</span>
                )}
              </div>

              <p className="text-xs text-sub leading-relaxed mb-3 line-clamp-2">{outline.summary}</p>

              <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] text-faint mb-1">
                  <span>吸睛评分</span>
                  <span className="text-gold font-bold">{outline.hook_score.toFixed(1)}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${scorePercent}%`, backgroundColor: scoreColor }} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDetailOpen(outline); }}
                  className="text-[10px] text-gold/70 hover:text-gold transition-colors"
                >
                  查看详情
                </button>
              </div>

              {isSelected && (
                <button onClick={handleStartWriting} className="mt-3 w-full py-2.5 bg-ink text-surface rounded-lg text-xs tracking-wider hover:bg-ink/80 transition-colors">
                  以此为纲，开始编写
                </button>
              )}
            </div>
          );
        })}
      </div>

      {detailOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setDetailOpen(null)}>
          <div
            className="bg-panel rounded-2xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-lg border border-border animate-fade-in mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg text-ink font-bold mb-1">{detailOpen.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-gold text-sm font-bold">吸睛评分: {detailOpen.hook_score.toFixed(1)}</span>
                  {detailOpen.recommended && <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full">AI推荐</span>}
                </div>
              </div>
              <button onClick={() => setDetailOpen(null)} className="text-faint hover:text-ink text-xl leading-none">&times;</button>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-xs text-sub mb-2">核心梗概</h4>
                <p className="text-sm text-ink/80 leading-relaxed">{detailOpen.summary}</p>
              </div>
              <div>
                <h4 className="text-xs text-sub mb-2">关键转折</h4>
                <p className="text-sm text-ink/80 leading-relaxed">{detailOpen.twist}</p>
              </div>
              <div>
                <h4 className="text-xs text-sub mb-2">吸睛点分析</h4>
                <p className="text-sm text-ink/80 leading-relaxed">{detailOpen.hook}</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setDetailOpen(null)} className="px-5 py-2 text-xs text-sub hover:text-ink transition-colors">关闭</button>
              <button
                onClick={() => { setSelected(detailOpen); setDetailOpen(null); }}
                className="px-6 py-2 bg-ink text-surface rounded-lg text-xs tracking-wider hover:bg-ink/80 transition-colors"
              >
                选择此大纲
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mt-10">
        <button onClick={() => navigate("/")} className="text-xs text-faint hover:text-sub transition-colors">重新选择题目和作家</button>
      </div>
    </div>
  );
}

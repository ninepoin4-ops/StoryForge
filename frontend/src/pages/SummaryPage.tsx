import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import { api } from "../services/api";
import RadarChart from "../components/RadarChart";

export default function SummaryPage() {
  const navigate = useNavigate();
  const store = useProjectStore();
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [novelTitle, setNovelTitle] = useState(store.selectedOutline?.title || store.title);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(store.novelContent);

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      const result = await api.exportNovel({
        project_id: store.projectId, title: novelTitle,
        content: editContent || store.novelContent, format, writer: store.writer,
      });
      const binary = atob(result.content);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const mime = format === "image" ? "image/png" : format === "txt" ? "text/plain" : "text/markdown";
      const blob = new Blob([bytes], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${novelTitle}.${format === "image" ? "png" : format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) { console.error(e); }
    setExporting(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`《${novelTitle}》\n\n${editContent || store.novelContent}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hookTwistPass = (store.reviews.hookTwist?.opening_score ?? 0) >= 75 && (store.reviews.hookTwist?.twist_score ?? 0) >= 75;
  const finaleScore = store.reviews.finale?.overall_score ?? 0;
  const stylePass = (store.reviews.style?.overall_match ?? 0) >= 85;
  const hasReviews = store.reviews.hookTwist || store.reviews.finale || store.reviews.style;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h2 className="text-center text-xl text-ink mb-2 tracking-wider">作品完成</h2>
      <p className="text-center text-xs text-faint mb-10">《{store.title}》— {store.writer || "未选择风格"}</p>

      {hasReviews && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
          {[
            { label: "开篇吸睛度 + 转折强度", val1: store.reviews.hookTwist?.opening_score, val2: store.reviews.hookTwist?.twist_score, pass: hookTwistPass },
            { label: "终审评分", val1: finaleScore || "--", val2: null, pass: finaleScore >= 75 },
            { label: "风格吻合度", val1: `${store.reviews.style?.overall_match ?? "--"}%`, val2: null, pass: stylePass, extra: stylePass ? "★ 风格纯粹 ★" : "" },
          ].map((item, i) => (
            <div key={i} className={`bg-panel border rounded-xl p-6 text-center ${item.pass ? "border-emerald-200" : "border-border"}`}>
              <p className="text-[11px] text-sub mb-2">{item.label}</p>
              <p className={`text-2xl font-bold ${item.pass ? "text-emerald-600" : "text-amber-600"}`}>
                {item.val1}{item.val2 != null && ` / ${item.val2}`}
              </p>
              {item.extra && <p className="text-[10px] text-faint mt-2">{item.extra}</p>}
            </div>
          ))}
        </div>
      )}

      {store.reviews.style?.dimensions && (
        <div className="bg-panel border border-border rounded-xl p-6 mb-10">
          <h3 className="text-sm text-ink text-center mb-4">风格雷达图</h3>
          <RadarChart dimensions={store.reviews.style.dimensions} />
        </div>
      )}

      {store.reviews.finale?.final_verdict && (
        <div className="bg-gold-light border border-gold/20 rounded-xl p-6 mb-10">
          <h3 className="text-sm text-accent mb-2">终审评语</h3>
          <p className="text-sm text-ink/80 leading-relaxed font-serif">{store.reviews.finale.final_verdict}</p>
        </div>
      )}

      <div className="bg-panel border border-border rounded-xl p-6 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-ink">浏览全文</h3>
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-sub hover:text-ink transition-colors"
          >
            {editing ? "完成编辑" : "编辑"}
          </button>
        </div>
        {editing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[50vh] bg-surface border border-border rounded-lg p-5 text-ink/80 text-sm leading-relaxed resize-none font-serif focus:outline-none focus:border-gold/30"
          />
        ) : (
          <div className="max-h-[50vh] overflow-y-auto bg-surface rounded-lg p-5">
            <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap font-serif">
              {editContent || store.novelContent || "暂无内容"}
            </p>
          </div>
        )}
      </div>

      <div className="bg-panel border border-border rounded-xl p-6 mb-10">
        <h3 className="text-sm text-ink mb-4">导出作品</h3>
        <div className="mb-4">
          <input
            type="text" value={novelTitle} onChange={(e) => setNovelTitle(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:border-gold/40"
            placeholder="作品名称"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { fmt: "txt", label: "TXT" },
            { fmt: "markdown", label: "Markdown" },
            { fmt: "image", label: "长图" },
          ].map(({ fmt, label }) => (
            <button key={fmt} onClick={() => handleExport(fmt)} disabled={exporting}
              className="px-5 py-2 text-xs text-ink border border-border rounded-lg hover:bg-muted disabled:opacity-40 transition-colors">
              导出 {label}
            </button>
          ))}
          <button onClick={handleCopy} className="px-5 py-2 text-xs text-sub border border-border rounded-lg hover:bg-muted transition-colors">
            {copied ? "已复制" : "复制全文"}
          </button>
        </div>
      </div>

      <div className="flex gap-6 justify-center">
        {hasReviews && (
          <button onClick={() => navigate("/review")} className="text-xs text-faint hover:text-sub transition-colors">
            返回审查
          </button>
        )}
        <button onClick={() => { store.reset(); navigate("/"); }} className="text-xs text-gold hover:text-accent transition-colors">
          开始新故事
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import { api } from "../services/api";

export default function TypewriterPage() {
  const navigate = useNavigate();
  const store = useProjectStore();
  const [displayText, setDisplayText] = useState("");
  const [generating, setGenerating] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const paperRef = useRef<HTMLDivElement>(null);
  const calledRef = useRef(false);
  const writerName = store.writer || "未知作家";

  useEffect(() => {
    if (!store.selectedOutline || !store.projectId) {
      navigate("/outlines");
      return;
    }
    if (calledRef.current) return;
    calledRef.current = true;
    api.generateNovelStream(
      {
        project_id: store.projectId,
        outline: store.selectedOutline,
        writer: store.writer,
        word_count: store.wordCount,
      },
      (chunk) => {
        store.appendNovelContent(chunk);
        setDisplayText((prev) => prev + chunk);
        if (paperRef.current) {
          paperRef.current.scrollTop = paperRef.current.scrollHeight;
        }
      },
      () => { setDone(true); setGenerating(false); store.setStage("review_1"); },
      (err) => { setError(err); setGenerating(false); }
    );
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <p className="text-sub text-sm">
          正在用 <span className="text-ink">{writerName}</span> 的口吻讲述
          {generating && <span className="typewriter-cursor ml-1 inline-block" />}
        </p>
        <div className="flex gap-2">
          {["吸睛审查", "终审点评", "风格审查"].map((label, i) => (
            <span key={i} className={`text-[10px] px-2 py-1 rounded border transition-colors ${
              generating ? "border-border text-faint/40" : i === 0 ? "border-gold/40 text-gold" : "border-border text-faint/40"
            }`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div
        ref={paperRef}
        className="bg-panel rounded-2xl shadow-sm p-10 min-h-[60vh] max-h-[70vh] overflow-y-auto border border-border"
      >
        <div className="prose prose-stone max-w-none font-serif text-base leading-relaxed whitespace-pre-wrap text-ink/85">
          {displayText}
        </div>
        {generating && !displayText && (
          <div className="flex items-center gap-2 text-faint text-sm">
            <span className="inline-block w-2 h-2 bg-gold rounded-full animate-pulse" />
            生成中...
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-center mt-4 text-sm">{error}</p>}

      {done && (
        <div className="text-center mt-10 animate-fade-in space-y-3">
          <button
            onClick={() => navigate("/review")}
            className="px-10 py-3.5 bg-ink text-surface rounded-full text-sm tracking-[0.15em] hover:bg-ink/85 transition-all"
          >
            提交审查
          </button>
          <br />
          <button
            onClick={() => { store.setStage("completed"); navigate("/summary"); }}
            className="text-xs text-faint hover:text-sub transition-colors underline underline-offset-4"
          >
            跳过审查，直接完成
          </button>
          <p className="text-faint text-[11px] mt-3">选择提交审查将自动执行三轮审查...</p>
        </div>
      )}
    </div>
  );
}

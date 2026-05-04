import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import { api } from "../services/api";
import WriterWheel from "../components/WriterWheel";
import type { WriterInfo } from "../types";

export default function TitleInputPage() {
  const navigate = useNavigate();
  const store = useProjectStore();
  const [title, setTitle] = useState(store.title || "");
  const [writers, setWriters] = useState<WriterInfo[]>([]);
  const [selectedWriter, setSelectedWriter] = useState(store.writer || "");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [wordCount, setWordCount] = useState(store.wordCount);
  const [storyType, setStoryType] = useState("");
  const [plotRef, setPlotRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getWriters().then((data) => {
      setWriters(data.writers);
      if (!selectedWriter && data.writers.length) {
        const random = data.writers[Math.floor(Math.random() * data.writers.length)];
        setSelectedWriter(random.key);
      }
    }).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!title.trim()) { setError("请输入故事题目"); return; }
    if (!selectedWriter) { setError("请选择一位作家风格"); return; }
    setLoading(true);
    setError("");
    store.setTitle(title);
    store.setWriter(selectedWriter);
    store.setWordCount(wordCount);
    try {
      const result = await api.generateOutlines({
        title, writer: selectedWriter, word_count: wordCount,
        story_type: storyType || undefined,
        plot_reference: plotRef || undefined,
      });
      store.setOutlines(result.project_id, result.outlines);
      navigate("/outlines");
    } catch (e: any) {
      setError(e.message || "大纲生成失败");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <p className="text-faint text-sm tracking-[0.3em] mb-6 animate-fade-in">
          今天想写一个什么故事？
        </p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder="输入故事题目"
          className="w-full text-center text-3xl md:text-4xl bg-transparent border-b border-border focus:border-gold/50 outline-none py-4 text-ink placeholder-faint/40 transition-all font-serif"
          autoFocus
        />
      </div>

      <WriterWheel writers={writers} selected={selectedWriter} onSelect={setSelectedWriter} />

      <div className="mt-12">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="text-faint hover:text-sub text-xs tracking-wider transition-colors mx-auto block"
        >
          {advancedOpen ? "收起 ▲" : "高级设置"}
        </button>
        {advancedOpen && (
          <div className="mt-4 p-6 bg-panel border border-border rounded-xl max-w-lg mx-auto animate-fade-in space-y-5">
            <div>
              <label className="text-xs text-sub block mb-1.5">目标字数</label>
              <input
                type="number" value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:border-gold/40"
                min={1000} max={100000} step={1000}
              />
            </div>
            <div>
              <label className="text-xs text-sub block mb-1.5">故事类型（留空由AI判断）</label>
              <input
                type="text" value={storyType} onChange={(e) => setStoryType(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:border-gold/40"
                placeholder="科幻 / 悬疑 / 爱情 / ..."
              />
            </div>
            <div>
              <label className="text-xs text-sub block mb-1.5">
                剧情参考
                <span className="text-faint ml-1">（输入后AI将以此为创作核心，不输入则由AI自由发挥）</span>
              </label>
              <textarea
                value={plotRef}
                onChange={(e) => setPlotRef(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-ink text-sm focus:outline-none focus:border-gold/40 resize-none h-24"
                placeholder="例如：一个老捕鲸人最后一次出海，网到的不是鲸，而是一颗陨石的碎片..."
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-center mt-4 text-sm">{error}</p>}

      <div className="text-center mt-14">
        <button
          onClick={handleGenerate}
          disabled={loading || !title.trim() || !selectedWriter}
          className="px-12 py-4 bg-ink text-surface rounded-full text-sm tracking-[0.2em] hover:bg-ink/85 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
              构思中...
            </span>
          ) : "生成大纲"}
        </button>
      </div>
    </div>
  );
}

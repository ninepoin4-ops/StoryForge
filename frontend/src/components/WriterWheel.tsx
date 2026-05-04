import { useState, useMemo } from "react";
import type { WriterInfo } from "../types";

interface Props {
  writers: WriterInfo[];
  selected: string;
  onSelect: (key: string) => void;
}

type Tab = "经典" | "现代";

export default function WriterWheel({ writers, selected, onSelect }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("经典");
  const [hovered, setHovered] = useState<string | null>(null);

  const filtered = useMemo(
    () => writers.filter((w) => (w.category || "经典") === activeTab),
    [writers, activeTab]
  );

  const categories = useMemo(() => {
    const set = new Set(writers.map((w) => w.category || "经典"));
    return Array.from(set).sort();
  }, [writers]);

  if (!writers.length) {
    return <div className="text-center text-sub py-8 text-sm">加载作家中...</div>;
  }

  return (
    <div className="w-full">
      <p className="text-xs text-faint text-center mb-3 tracking-wider">选择作家风格</p>

      <div className="flex justify-center gap-1 mb-5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat as Tab)}
            className={`px-5 py-1.5 text-xs rounded-full transition-colors ${
              activeTab === cat
                ? "bg-ink text-surface"
                : "text-sub hover:text-ink"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-w-3xl mx-auto">
        {filtered.map((w) => {
          const isSelected = selected === w.key;
          return (
            <button
              key={w.key}
              onClick={() => onSelect(w.key)}
              onMouseEnter={() => setHovered(w.key)}
              onMouseLeave={() => setHovered(null)}
              className={`relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all duration-200 group
                ${isSelected
                  ? "bg-gold-light border border-gold/30 shadow-sm"
                  : "bg-panel border border-transparent hover:bg-muted hover:border-border"
                }`}
            >
              <span className={`text-sm font-serif tracking-wider transition-colors ${
                isSelected ? "text-accent" : "text-ink/70 group-hover:text-ink"
              }`}>
                {w.name}
              </span>
              <span className={`text-[10px] tracking-wide transition-colors ${
                isSelected ? "text-gold/60" : "text-faint"
              }`}>
                {w.name_en}
              </span>
              {hovered === w.key && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-3 bg-panel border border-border rounded-xl shadow-lg z-20 animate-fade-in">
                  <p className="text-gold/80 text-xs italic leading-relaxed">"{w.signature_sentence}"</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-faint text-center mt-3">
        {activeTab === "经典" ? "经典文学" : "网络/现代"} · {filtered.length} 位
      </p>
    </div>
  );
}

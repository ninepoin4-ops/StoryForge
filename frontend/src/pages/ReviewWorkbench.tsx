import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import { api } from "../services/api";
import GaugeChart from "../components/GaugeChart";
import RadarChart from "../components/RadarChart";
import type { ReviewRound, HookTwistResult, FinaleResult, StyleResult } from "../types";

type TabKey = "review1" | "review2" | "review3";

const roundMap: { key: TabKey; label: string; round: ReviewRound; next: TabKey | null }[] = [
  { key: "review1", label: "吸睛与转折", round: "hook_twist", next: "review2" },
  { key: "review2", label: "终审点评", round: "finale", next: "review3" },
  { key: "review3", label: "风格审查", round: "style", next: null },
];

export default function ReviewWorkbench() {
  const navigate = useNavigate();
  const store = useProjectStore();
  const [activeTab, setActiveTab] = useState<TabKey>("review1");
  const [content, setContent] = useState(store.novelContent);
  const [reviewing, setReviewing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [message, setMessage] = useState("");
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoStatus, setAutoStatus] = useState("");
  const autoRan = useRef(false);

  const hooksPass = useMemo(
    () => (store.reviews.hookTwist?.opening_score ?? 0) >= 75 && (store.reviews.hookTwist?.twist_score ?? 0) >= 75,
    [store.reviews.hookTwist]
  );
  const stylePass = useMemo(
    () => (store.reviews.style?.overall_match ?? 0) >= 85,
    [store.reviews.style]
  );
  const finaleScore = store.reviews.finale?.overall_score ?? 0;
  const allDone = store.reviews.hookTwist && store.reviews.finale && store.reviews.style;

  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    runAutoReview();
  }, []);

  const runAutoReview = async () => {
    setAutoRunning(true);
    try {
      setAutoStatus("正在执行第一轮：吸睛与转折审查...");
      const r1: HookTwistResult = await api.runReview({
        project_id: store.projectId, round: "hook_twist", content, writer: store.writer,
      });
      store.setHookTwistReview(r1);

      setAutoStatus("正在执行第二轮：终审点评...");
      const r2: FinaleResult = await api.runReview({
        project_id: store.projectId, round: "finale", content, writer: store.writer,
      });
      store.setFinaleReview(r2);

      setAutoStatus("正在执行第三轮：风格审查...");
      const r3: StyleResult = await api.runReview({
        project_id: store.projectId, round: "style", content, writer: store.writer,
      });
      store.setStyleReview(r3);

      setAutoStatus("三轮审查已完成");
      setMessage("三轮审查已完成，请查看各维度数据");
    } catch (e: any) {
      setAutoStatus(`审查中断: ${e.message}`);
    }
    setAutoRunning(false);
  };

  const rerunCurrent = async () => {
    setReviewing(true);
    setMessage("");
    const tab = roundMap.find((t) => t.key === activeTab)!;
    try {
      const result = await api.runReview({
        project_id: store.projectId, round: tab.round, content, writer: store.writer,
      });
      if (tab.round === "hook_twist") store.setHookTwistReview(result);
      else if (tab.round === "finale") store.setFinaleReview(result);
      else store.setStyleReview(result);
      setMessage("审查完成");
    } catch (e: any) { setMessage(`审查失败: ${e.message}`); }
    setReviewing(false);
  };

  const runOptimize = async () => {
    setOptimizing(true);
    try {
      const result = await api.optimize({
        project_id: store.projectId, content, writer: store.writer, section: "opening",
        suggestions: store.reviews.hookTwist?.suggestions,
      });
      setContent(result.content);
      store.setNovelContent(result.content);
      setMessage("开篇优化完成，可重新审查");
    } catch (e: any) { setMessage(`优化失败: ${e.message}`); }
    setOptimizing(false);
  };

  const handleSkipAll = () => {
    store.setNovelContent(content);
    store.setStage("completed");
    navigate("/summary");
  };

  const handleSkipToNext = () => {
    const currentIdx = roundMap.findIndex((t) => t.key === activeTab);
    if (currentIdx < roundMap.length - 1) {
      setActiveTab(roundMap[currentIdx + 1].key);
    } else {
      navigate("/summary");
    }
  };

  const runPolish = async () => {
    setPolishing(true);
    try {
      const result = await api.polish({
        project_id: store.projectId, content, writer: store.writer,
      });
      setContent(result.content);
      store.setNovelContent(result.content);
      setMessage("风格润色完成，可重新审查");
    } catch (e: any) { setMessage(`润色失败: ${e.message}`); }
    setPolishing(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      {autoRunning && (
        <div className="mb-8 p-6 bg-panel border border-border rounded-2xl text-center animate-fade-in">
          <div className="inline-block w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin-slow mb-3" />
          <p className="text-sm text-ink">{autoStatus}</p>
          <p className="text-xs text-faint mt-1">系统正在自动执行三轮审查，请稍候...</p>
        </div>
      )}

      {allDone && !autoRunning && (
        <div className="mb-8 p-5 bg-gold-light border border-gold/20 rounded-2xl text-center animate-stamp">
          <p className="text-accent text-lg mb-1">&#x2714; 三轮审查已完成</p>
          <p className="text-sub text-xs">点击各标签页查看详细数据</p>
          <button onClick={() => navigate("/summary")} className="mt-4 px-8 py-2.5 bg-ink text-surface rounded-full text-xs tracking-wider hover:bg-ink/80 transition-colors">
            查看总结与导出
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        {roundMap.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-t-lg text-xs tracking-wider transition-colors ${
              activeTab === tab.key
                ? "bg-panel text-ink border border-b-panel border-border -mb-px"
                : "text-sub hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2 items-center">
          {message && <span className="text-[11px] text-sub">{message}</span>}
          {activeTab !== "review3" && (
            <button onClick={handleSkipToNext}
              className="px-3 py-1.5 text-xs text-faint border border-border rounded-md hover:bg-muted transition-colors">
              跳过此项
            </button>
          )}
          <button onClick={handleSkipAll} disabled={autoRunning}
            className="px-3 py-1.5 text-xs text-faint border border-border rounded-md hover:bg-muted disabled:opacity-30 transition-colors">
            跳过全部，直接结束
          </button>
          <button onClick={rerunCurrent} disabled={reviewing || autoRunning}
            className="px-4 py-1.5 text-xs text-sub border border-border rounded-md hover:bg-muted hover:text-ink disabled:opacity-40 transition-colors">
            {reviewing ? "审查中..." : "重新审查当前"}
          </button>
        </div>
      </div>

      <div className="flex gap-6" style={{ minHeight: "65vh" }}>
        <div className="w-1/2 flex flex-col">
          <h3 className="text-xs text-sub mb-2">原文编辑器</h3>
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); store.setNovelContent(e.target.value); }}
            className="flex-1 w-full bg-panel border border-border rounded-xl p-5 text-ink/80 text-sm leading-relaxed resize-none font-serif focus:outline-none focus:border-gold/30"
          />
        </div>

        <div className="w-1/2 flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
          {activeTab === "review1" && (
            <>
              <div className="flex gap-3">
                <div className="flex-1 bg-panel border border-border rounded-xl p-5">
                  <h4 className="text-[11px] text-sub text-center mb-2">开篇吸睛度</h4>
                  <GaugeChart value={store.reviews.hookTwist?.opening_score ?? 0} />
                </div>
                <div className="flex-1 bg-panel border border-border rounded-xl p-5">
                  <h4 className="text-[11px] text-sub text-center mb-2">转折强度</h4>
                  <GaugeChart value={store.reviews.hookTwist?.twist_score ?? 0} />
                </div>
              </div>
              {store.reviews.hookTwist?.hook_sentences && (
                <div className="bg-panel border border-border rounded-xl p-5">
                  <h4 className="text-[11px] text-sub mb-2">检测到的吸睛句</h4>
                  {store.reviews.hookTwist.hook_sentences.map((s, i) => (
                    <p key={i} className="text-sm text-ink/70 italic mb-1 border-l-2 border-gold/20 pl-3">{s}</p>
                  ))}
                </div>
              )}
              <div className="bg-panel border border-border rounded-xl p-5">
                <h4 className="text-[11px] text-sub mb-2">建议</h4>
                {hooksPass ? (
                  <p className="text-xs text-emerald-600">两项指标均达标 &#x2714;</p>
                ) : (
                  <>
                    {store.reviews.hookTwist?.suggestions?.map((s, i) => (
                      <p key={i} className="text-xs text-sub mb-1">&#8226; {s}</p>
                    ))}
                    <button onClick={runOptimize} disabled={optimizing}
                      className="mt-3 w-full py-2 text-xs text-gold border border-gold/20 rounded-lg hover:bg-gold-light disabled:opacity-40 transition-colors">
                      {optimizing ? "优化中..." : "自动优化开篇"}
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {activeTab === "review2" && (
            <>
              <div className="bg-panel border border-border rounded-xl p-5">
                <h4 className="text-[11px] text-sub text-center mb-2">终审总评</h4>
                <div className="text-center">
                  <p className={`text-4xl font-bold ${finaleScore >= 80 ? "text-emerald-600" : finaleScore >= 60 ? "text-amber-600" : "text-red-500"}`}>
                    {finaleScore || "--"}
                  </p>
                  <p className="text-[10px] text-faint mt-1">/ 100</p>
                </div>
              </div>
              {store.reviews.finale?.pacing_comment && (
                <div className="bg-panel border border-border rounded-xl p-5">
                  <h4 className="text-[11px] text-sub mb-1">节奏感</h4>
                  <p className="text-xs text-ink/70 leading-relaxed">{store.reviews.finale.pacing_comment}</p>
                </div>
              )}
              {store.reviews.finale?.emotional_impact && (
                <div className="bg-panel border border-border rounded-xl p-5">
                  <h4 className="text-[11px] text-sub mb-1">情感冲击力</h4>
                  <p className="text-xs text-ink/70 leading-relaxed">{store.reviews.finale.emotional_impact}</p>
                </div>
              )}
              {store.reviews.finale?.highlights && (
                <div className="bg-panel border border-border rounded-xl p-5">
                  <h4 className="text-[11px] text-sub mb-2">亮点时刻</h4>
                  {store.reviews.finale.highlights.map((h, i) => (
                    <p key={i} className="text-xs text-ink/70 mb-1 border-l-2 border-gold/20 pl-3 italic">{h}</p>
                  ))}
                </div>
              )}
              {store.reviews.finale?.final_verdict && (
                <div className="bg-panel border border-gold/20 rounded-xl p-5 bg-gold-light/50">
                  <h4 className="text-[11px] text-accent mb-1">终审评语</h4>
                  <p className="text-sm text-ink/80 leading-relaxed font-serif">{store.reviews.finale.final_verdict}</p>
                </div>
              )}
            </>
          )}

          {activeTab === "review3" && (
            <>
              <div className="bg-panel border border-border rounded-xl p-5">
                <h4 className="text-[11px] text-sub text-center mb-2">风格雷达图</h4>
                {store.reviews.style?.dimensions && <RadarChart dimensions={store.reviews.style.dimensions} />}
                {store.reviews.style?.overall_match != null && (
                  <p className={`text-center text-sm mt-2 ${stylePass ? "text-emerald-600" : "text-amber-600"}`}>
                    风格吻合度: {store.reviews.style.overall_match}%
                    {stylePass && <span className="ml-2 text-gold">&#9733;</span>}
                  </p>
                )}
              </div>
              {store.reviews.style?.violations && store.reviews.style.violations.length > 0 && (
                <div className="bg-panel border border-border rounded-xl p-5">
                  <h4 className="text-[11px] text-sub mb-2">风格偏离</h4>
                  {store.reviews.style.violations.map((v, i) => (
                    <div key={i} className="mb-2 p-2 border-l-2 border-amber-300 pl-3">
                      <p className="text-[10px] text-sub">{v.text_range?.[0]} ~ {v.text_range?.[1]}</p>
                      <p className="text-xs text-sub/70">{v.reason}</p>
                      <p className="text-[10px] text-accent mt-1">建议: {v.suggestion}</p>
                    </div>
                  ))}
                  <button onClick={runPolish} disabled={polishing}
                    className="mt-3 w-full py-2 text-xs text-gold border border-gold/20 rounded-lg hover:bg-gold-light disabled:opacity-40 transition-colors">
                    {polishing ? "润色中..." : "全局风格润色"}
                  </button>
                </div>
              )}
              {stylePass && !autoRunning && (
                <div className="bg-gold-light border border-gold/20 rounded-xl p-6 text-center animate-stamp">
                  <p className="text-gold text-xl mb-1">&#9733; 风格认可章 &#9733;</p>
                  <p className="text-xs text-sub">小说已高度贴合作家风格</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useProjectStore } from "../stores/projectStore";

export default function HistoryPage() {
  const navigate = useNavigate();
  const store = useProjectStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listProjects().then((data) => {
      setProjects(data.projects || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleLoad = async (id: string) => {
    try {
      const data = await api.getProject(id);
      store.setTitle(data.title);
      store.setWriter(data.writer);
      store.setNovelContent(data.content || "");
      if (data.outlines?.length) {
        store.setOutlines(data.project_id, data.outlines);
      }
      if (data.stage === "completed" || data.stage === "review_3") {
        navigate("/summary");
      } else if (data.stage === "review_1" || data.stage === "review_2") {
        navigate("/review");
      } else if (data.content) {
        navigate("/review");
      } else if (data.outlines?.length) {
        navigate("/outlines");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.project_id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const stageLabels: Record<string, string> = {
    selection: "未完成", outline_selection: "大纲已选", generating: "生成中",
    review_1: "第一轮审查", review_2: "第二轮审查", review_3: "第三轮审查", completed: "已完成",
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl text-ink tracking-wider">创作历史</h2>
        <button onClick={() => navigate("/")} className="text-xs text-sub hover:text-ink transition-colors">
          新建故事 +
        </button>
      </div>

      {loading ? (
        <p className="text-sub text-sm text-center py-12">加载中...</p>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sub text-sm mb-4">还没有创作记录</p>
          <button onClick={() => navigate("/")} className="px-6 py-2 bg-ink text-surface rounded-full text-xs tracking-wider hover:bg-ink/80 transition-colors">
            开始第一个故事
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <div
              key={p.project_id}
              className="bg-panel border border-border rounded-xl p-5 flex items-center justify-between hover:border-gold/20 transition-colors cursor-pointer group"
              onClick={() => handleLoad(p.project_id)}
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm text-ink font-medium truncate mb-1">{p.title}</h3>
                <div className="flex items-center gap-3 text-[10px] text-sub">
                  <span>{p.writer || "未选择"}</span>
                  <span>{p.content_length ? `${p.content_length} 字` : "未生成"}</span>
                  <span className="text-faint">{stageLabels[p.stage] || p.stage}</span>
                  {p.updated_at && (
                    <span className="text-faint">{new Date(p.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(p.project_id); }}
                className="ml-4 text-xs text-faint hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

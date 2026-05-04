import { BrowserRouter, Routes, Route } from "react-router-dom";
import TitleInputPage from "./pages/TitleInputPage";
import OutlineSelectionPage from "./pages/OutlineSelectionPage";
import TypewriterPage from "./pages/TypewriterPage";
import ReviewWorkbench from "./pages/ReviewWorkbench";
import SummaryPage from "./pages/SummaryPage";
import HistoryPage from "./pages/HistoryPage";
import ConfigModal from "./components/ConfigModal";
import { useState, useEffect } from "react";
import { useConfigStore } from "./stores/configStore";
import { api } from "./services/api";

function App() {
  const [configOpen, setConfigOpen] = useState(false);
  const config = useConfigStore();

  useEffect(() => {
    api.getConfig().then((cfg) => {
      if (!config.api_key && cfg.api_key) config.setApiKey(cfg.api_key);
      if (!config.api_base_url || config.api_base_url === "https://api.openai.com/v1") {
        if (cfg.api_base_url) config.setBaseUrl(cfg.api_base_url);
      }
      if (!config.model_name || config.model_name === "gpt-4o") {
        if (cfg.model_name) config.setModel(cfg.model_name);
      }
    }).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface">
        <header className="fixed top-0 left-0 right-0 z-50 bg-panel/80 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
            <h1
              className="text-ink/80 text-lg tracking-[0.2em] cursor-pointer hover:text-ink transition-colors"
              onClick={() => (window.location.href = "/")}
            >
              StoryForge
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => (window.location.href = "/history")}
                className="text-xs text-sub border border-border rounded-md px-4 py-1.5 hover:bg-muted hover:text-ink transition-colors"
              >
                创作历史
              </button>
              <button
                onClick={() => setConfigOpen(true)}
                className="text-xs text-sub border border-border rounded-md px-4 py-1.5 hover:bg-muted hover:text-ink transition-colors"
              >
                配置
              </button>
            </div>
          </div>
        </header>
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<TitleInputPage />} />
            <Route path="/outlines" element={<OutlineSelectionPage />} />
            <Route path="/writing" element={<TypewriterPage />} />
            <Route path="/review" element={<ReviewWorkbench />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>
      </div>
      {configOpen && <ConfigModal onClose={() => setConfigOpen(false)} />}
    </BrowserRouter>
  );
}

export default App;

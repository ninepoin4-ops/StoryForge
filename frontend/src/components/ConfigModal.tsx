import { useState } from "react";
import { useConfigStore } from "../stores/configStore";
import { api } from "../services/api";

interface Props { onClose: () => void; }

export default function ConfigModal({ onClose }: Props) {
  const config = useConfigStore();
  const [baseUrl, setBaseUrl] = useState(config.api_base_url);
  const [apiKey, setApiKey] = useState(config.api_key);
  const [model, setModel] = useState(config.model_name);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateConfig({ api_base_url: baseUrl, api_key: apiKey, model_name: model });
      config.setConfig({ api_base_url: baseUrl, api_key: apiKey, model_name: model });
      setMessage("已保存，重启后仍有效");
      setTimeout(() => setMessage(""), 2500);
    } catch {
      setMessage("保存失败");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-panel rounded-2xl p-8 w-full max-w-md shadow-lg border border-border animate-fade-in">
        <h2 className="text-lg text-ink mb-6 tracking-wider">API 配置</h2>

        <label className="block text-xs text-sub mb-1.5">Base URL</label>
        <input
          type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-2.5 mb-5 bg-surface text-ink text-sm focus:outline-none focus:border-gold/40 transition-colors"
          placeholder="https://api.openai.com/v1"
        />

        <label className="block text-xs text-sub mb-1.5">API Key</label>
        <input
          type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-2.5 mb-5 bg-surface text-ink text-sm focus:outline-none focus:border-gold/40 transition-colors"
          placeholder="sk-..."
        />

        <label className="block text-xs text-sub mb-1.5">模型</label>
        <input
          type="text" value={model} onChange={(e) => setModel(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-2.5 mb-6 bg-surface text-ink text-sm focus:outline-none focus:border-gold/40 transition-colors"
          placeholder="gpt-4o"
        />

        {message && <p className="text-xs text-accent mb-4">{message}</p>}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2 text-sub text-sm hover:text-ink transition-colors">取消</button>
          <button
            onClick={handleSave} disabled={saving}
            className="px-6 py-2 bg-ink text-surface rounded-lg text-sm hover:bg-ink/80 transition-colors disabled:opacity-40"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

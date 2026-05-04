import { create } from "zustand";
import type { AppConfig } from "../types";

const LOCAL_KEY = "storyforge_config";

function loadLocal(): Partial<AppConfig> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveLocal(cfg: Partial<AppConfig>) {
  try {
    const existing = loadLocal();
    Object.assign(existing, cfg);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(existing));
  } catch {}
}

const local = loadLocal();

interface ConfigStore extends AppConfig {
  setConfig: (config: Partial<AppConfig>) => void;
  setApiKey: (key: string) => void;
  setBaseUrl: (url: string) => void;
  setModel: (model: string) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  api_base_url: local.api_base_url || "https://api.openai.com/v1",
  api_key: local.api_key || "",
  model_name: local.model_name || "gpt-4o",
  default_word_count: local.default_word_count || 24000,
  setConfig: (config) => {
    saveLocal(config);
    set(config);
  },
  setApiKey: (key) => {
    saveLocal({ api_key: key });
    set({ api_key: key });
  },
  setBaseUrl: (url) => {
    saveLocal({ api_base_url: url });
    set({ api_base_url: url });
  },
  setModel: (model) => {
    saveLocal({ model_name: model });
    set({ model_name: model });
  },
}));

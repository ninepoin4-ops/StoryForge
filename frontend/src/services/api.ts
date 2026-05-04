const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getConfig: () => request<any>("/config"),
  updateConfig: (data: any) =>
    request<any>("/config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  generateOutlines: (data: {
    title: string;
    writer: string;
    word_count: number;
    story_type?: string;
    plot_reference?: string;
    model?: string;
  }) =>
    request<any>("/outlines/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateNovelStream: (
    data: {
      project_id: string;
      outline: any;
      writer: string;
      word_count: number;
      model?: string;
    },
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (err: string) => void
  ) => {
    fetch(`${BASE}/novel/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(async (res) => {
      if (!res.ok) {
        onError(await res.text());
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          const remaining = buffer.trim();
          if (remaining.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(remaining.slice(6));
              if (parsed.chunk) onChunk(parsed.chunk);
              if (parsed.done) onDone();
            } catch { /* ignore */ }
          }
          onDone();
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.chunk) onChunk(parsed.chunk);
              if (parsed.done) onDone();
              if (parsed.error) onError(parsed.error);
            } catch {
              // skip parse errors
            }
          }
        }
      }
    });
  },

  runReview: (data: {
    project_id: string;
    round: string;
    content: string;
    writer: string;
    model?: string;
  }) =>
    request<any>("/review", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  optimize: (data: {
    project_id: string;
    content: string;
    writer: string;
    section: string;
    suggestions?: string[];
    model?: string;
  }) =>
    request<{ content: string }>("/optimize", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  polish: (data: {
    project_id: string;
    content: string;
    writer: string;
    model?: string;
  }) =>
    request<{ content: string }>("/polish", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getWriters: () => request<{ writers: any[] }>("/writers"),
  listProjects: () => request<{ projects: any[] }>("/projects"),
  getProject: (id: string) => request<any>(`/projects/${id}`),
  deleteProject: (id: string) => request<any>(`/projects/${id}`, { method: "DELETE" }),

  exportNovel: (data: {
    project_id: string;
    title: string;
    content: string;
    format: string;
    writer: string;
  }) =>
    request<any>("/export", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

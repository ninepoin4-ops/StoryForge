import { create } from "zustand";
import type {
  ProjectState, ProjectStage, Outline,
  HookTwistResult, FinaleResult, StyleResult,
} from "../types";

interface ProjectStore extends ProjectState {
  setTitle: (title: string) => void;
  setWriter: (writer: string) => void;
  setWordCount: (count: number) => void;
  setStage: (stage: ProjectStage) => void;
  setOutlines: (projectId: string, outlines: Outline[]) => void;
  selectOutline: (outline: Outline) => void;
  setNovelContent: (content: string) => void;
  appendNovelContent: (chunk: string) => void;
  setHookTwistReview: (review: HookTwistResult) => void;
  setFinaleReview: (review: FinaleResult) => void;
  setStyleReview: (review: StyleResult) => void;
  reset: () => void;
}

const initialState: ProjectState = {
  projectId: "",
  title: "",
  writer: "",
  wordCount: 24000,
  stage: "selection",
  outlines: [],
  selectedOutline: null,
  novelContent: "",
  reviews: { hookTwist: null, finale: null, style: null },
};

export const useProjectStore = create<ProjectStore>((set) => ({
  ...initialState,
  setTitle: (title) => set({ title }),
  setWriter: (writer) => set({ writer }),
  setWordCount: (wordCount) => set({ wordCount }),
  setStage: (stage) => set({ stage }),
  setOutlines: (projectId, outlines) => set({ projectId, outlines, stage: "outline_selection" }),
  selectOutline: (selectedOutline) => set({ selectedOutline }),
  setNovelContent: (novelContent) => set({ novelContent }),
  appendNovelContent: (chunk) => set((state) => ({ novelContent: state.novelContent + chunk })),
  setHookTwistReview: (review) => set((state) => ({ reviews: { ...state.reviews, hookTwist: review } })),
  setFinaleReview: (review) => set((state) => ({ reviews: { ...state.reviews, finale: review } })),
  setStyleReview: (review) => set((state) => ({ reviews: { ...state.reviews, style: review } })),
  reset: () => set(initialState),
}));

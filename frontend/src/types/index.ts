export interface WriterInfo {
  key: string;
  name: string;
  name_en: string;
  signature_sentence: string;
  description: string;
  category?: string;
}

export interface AppConfig {
  api_base_url: string;
  api_key: string;
  model_name: string;
  default_word_count: number;
}

export interface Outline {
  title: string;
  summary: string;
  twist: string;
  hook: string;
  hook_score: number;
  recommended: boolean;
}

export interface ProjectState {
  projectId: string;
  title: string;
  writer: string;
  wordCount: number;
  stage: ProjectStage;
  outlines: Outline[];
  selectedOutline: Outline | null;
  novelContent: string;
  reviews: ReviewState;
}

export type ProjectStage =
  | "selection"
  | "outline_selection"
  | "generating"
  | "review_1"
  | "review_2"
  | "review_3"
  | "completed";

export interface ReviewState {
  hookTwist: HookTwistResult | null;
  finale: FinaleResult | null;
  style: StyleResult | null;
}

export interface HookTwistResult {
  opening_score: number;
  twist_score: number;
  hook_sentences: string[];
  twist_analysis: string;
  suggestions: string[];
}

export interface FinaleResult {
  overall_score: number;
  pacing_comment: string;
  emotional_impact: string;
  highlights: string[];
  final_verdict: string;
}

export interface StyleDimension {
  name: string;
  target: number;
  actual: number;
}

export interface StyleViolation {
  text_range: [string, string];
  reason: string;
  suggestion: string;
}

export interface StyleResult {
  dimensions: StyleDimension[];
  overall_match: number;
  violations: StyleViolation[];
}

export type ReviewRound = "hook_twist" | "finale" | "style";

export type ExportFormat = "txt" | "markdown" | "image";

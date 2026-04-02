export type StageGuideStep = {
  step?: number;
  action: string;
  detail?: string;
  url?: string;
  tip?: string;
  cost?: string;
  options?: string[];
};

export type StageGuideWarning = {
  level: "danger" | "warning" | "info";
  text: string;
};

export type StageGuideAiTool = {
  tool_name: string;
  use_case: string;
  url?: string;
};

export type StageGuideContent = {
  id: string;
  stageCode: string;
  categoryId: string | null;
  locale: string;
  summary: string;
  whyNow: string | null;
  steps: StageGuideStep[];
  costRange: string | null;
  timeEstimate: string | null;
  warnings: StageGuideWarning[];
  aiTools: StageGuideAiTool[];
  expertWhen: string | null;
  expertType: string | null;
};

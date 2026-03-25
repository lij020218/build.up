export type SourceConfidence = "high" | "medium" | "low";

export type FreshnessStatus = "fresh" | "review_soon" | "stale" | "blocked";

export type SourceRecord = {
  sourceName: string;
  sourceUrl: string;
  verifiedAt: string;
  expiresAt?: string;
  confidence: SourceConfidence;
};

export type FreshnessMeta = {
  status: FreshnessStatus;
  label: string;
  sources: SourceRecord[];
  lastCheckedAt: string;
  nextReviewAt?: string;
  notes?: string;
};

export type KnowledgeItemRecord = {
  id: string;
  itemKey: string;
  itemType: string;
  domain: string;
  title: string;
  summary?: string;
  payload: Record<string, unknown>;
  freshnessStatus: FreshnessStatus;
  lastCheckedAt?: string;
  nextReviewAt?: string;
  notes?: string;
  isActive: boolean;
};

export type KnowledgeItemSourceRecord = {
  id: string;
  knowledgeItemId: string;
  sourceName: string;
  sourceUrl: string;
  verifiedAt: string;
  expiresAt?: string;
  confidence: SourceConfidence;
};

export type KnowledgeRefreshReviewRecord = {
  id: string;
  knowledgeItemId: string;
  reviewStatus: FreshnessStatus | "approved" | "needs_review";
  reviewMethod: "manual" | "crawler" | "api" | "ai_assisted";
  summary?: string;
  reviewedAt: string;
  reviewerUserId?: string;
  snapshot: Record<string, unknown>;
};

export type FreshnessPresentation = {
  tone: "neutral" | "warning" | "critical";
  isSelectable: boolean;
  summary: string;
};

export function getFreshnessPresentation(meta?: FreshnessMeta): FreshnessPresentation {
  if (!meta) {
    return {
      tone: "warning",
      isSelectable: false,
      summary: "Source review is missing."
    };
  }

  if (meta.status === "fresh") {
    return {
      tone: "neutral",
      isSelectable: true,
      summary: `${meta.label}. Checked ${meta.lastCheckedAt.slice(0, 10)}.`
    };
  }

  if (meta.status === "review_soon") {
    return {
      tone: "warning",
      isSelectable: true,
      summary: `${meta.label}. Recheck by ${meta.nextReviewAt?.slice(0, 10) ?? "soon"}.`
    };
  }

  if (meta.status === "stale") {
    return {
      tone: "critical",
      isSelectable: false,
      summary: "This information is stale and should be refreshed before use."
    };
  }

  return {
    tone: "critical",
    isSelectable: false,
    summary: "This information is blocked until it is reviewed again."
  };
}

import { formatGuideSectionTitle, type Language } from "../i18n";
import type {
  FreshnessMeta,
  KnowledgeItemRecord,
  KnowledgeItemSourceRecord
} from "../types/freshness";

export type GuideRecordWithSources = KnowledgeItemRecord & {
  sources: KnowledgeItemSourceRecord[];
  freshness?: FreshnessMeta;
};

export type GuideContextSection = {
  key: string;
  title: string;
  items: string[];
};

export type GuideContextBlock = {
  guideId: string;
  title: string;
  domain: string;
  summary: string;
  sections: GuideContextSection[];
  sources: Array<{
    sourceName: string;
    sourceUrl?: string;
    verifiedAt?: string;
  }>;
  freshness?: FreshnessMeta;
};

export type GuideQaRequest = {
  question: string;
  language: Language;
  guide: GuideRecordWithSources;
};

export type GuideQaAnswer = {
  shortAnswer: string;
  explanation: string;
  reasons: string[];
  cautions: string[];
  nextActions: string[];
  confidence: "high" | "medium" | "check_needed";
  citations: Array<{
    guideId: string;
    title: string;
    sourceName: string;
    sourceUrl?: string;
    sectionTitle?: string;
  }>;
};

type GuideConfidenceInput = {
  proposedConfidence?: GuideQaAnswer["confidence"];
  matchedSectionsCount?: number;
  topMatchScore?: number;
  hasCitations?: boolean;
  freshness?: FreshnessMeta;
  sourceConfidence?: KnowledgeItemSourceRecord["confidence"] | undefined;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function confidenceRank(value: GuideQaAnswer["confidence"]) {
  if (value === "high") return 2;
  if (value === "medium") return 1;
  return 0;
}

function rankToConfidence(rank: number): GuideQaAnswer["confidence"] {
  if (rank >= 2) return "high";
  if (rank === 1) return "medium";
  return "check_needed";
}

export function deriveGuideQaConfidence({
  proposedConfidence,
  matchedSectionsCount = 0,
  topMatchScore = 0,
  hasCitations = false,
  freshness,
  sourceConfidence
}: GuideConfidenceInput): GuideQaAnswer["confidence"] {
  const freshnessStatus = freshness?.status;

  if (!hasCitations || freshnessStatus === "stale" || freshnessStatus === "blocked") {
    return "check_needed";
  }

  let rank = confidenceRank(proposedConfidence ?? "medium");

  if (matchedSectionsCount === 0 || topMatchScore <= 0) {
    rank = Math.min(rank, 0);
  } else if (matchedSectionsCount === 1 || topMatchScore < 2) {
    rank = Math.min(rank, 1);
  }

  if (freshnessStatus === "review_soon") {
    rank = Math.min(rank, 1);
  }

  if (sourceConfidence === "low") {
    rank = 0;
  } else if (sourceConfidence === "medium") {
    rank = Math.min(rank, 1);
  }

  return rankToConfidence(rank);
}

export function buildGuideContextBlock(
  guide: GuideRecordWithSources,
  language: Language
): GuideContextBlock {
  const sections = Object.entries(guide.payload)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => ({
      key,
      title: formatGuideSectionTitle(key, language),
      items: (value as unknown[]).map((item) => String(item))
    }));

  return {
    guideId: guide.id,
    title: guide.title,
    domain: guide.domain,
    summary: guide.summary ?? "",
    sections,
    sources: guide.sources.map((source) => ({
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      verifiedAt: source.verifiedAt
    })),
    freshness: guide.freshness
  };
}

function scoreSection(questionTokens: string[], section: GuideContextSection) {
  const sectionTokens = normalize(`${section.title} ${section.items.join(" ")}`);
  const overlap = questionTokens.filter((token) => sectionTokens.includes(token));
  return unique(overlap).length;
}

function buildDomainCaution(domain: string, language: Language) {
  if (language === "ko") {
    if (domain === "permit-guide") {
      return "업종 세부 조건이나 관할 기관 해석은 추가 확인이 필요할 수 있습니다.";
    }

    if (domain === "tax-guide") {
      return "과세 유형이나 신고 시점은 실제 사업 형태에 따라 달라질 수 있습니다.";
    }

    return "대출 조건과 심사 기준은 시점과 기관에 따라 달라질 수 있습니다.";
  }

  if (domain === "permit-guide") {
    return "Local permit interpretation can still vary by authority.";
  }

  if (domain === "tax-guide") {
    return "Tax treatment can still vary by business setup and filing timing.";
  }

  return "Loan terms and screening criteria can still change by lender and timing.";
}

function buildDomainNextAction(domain: string, language: Language) {
  if (language === "ko") {
    if (domain === "permit-guide") {
      return "관할 기관 기준으로 현재 단계 체크리스트를 다시 확인하세요.";
    }

    if (domain === "tax-guide") {
      return "신고/증빙 관련 항목을 현재 단계 체크리스트와 함께 다시 확인하세요.";
    }

    return "대출 준비 서류와 신청 조건을 가이드 상세에서 다시 확인하세요.";
  }

  if (domain === "permit-guide") {
    return "Review the current permit checklist against the local authority guidance.";
  }

  if (domain === "tax-guide") {
    return "Check filing and documentation items against the current stage checklist.";
  }

  return "Review the loan preparation checklist and eligibility notes again.";
}

export function answerGuideQuestion({
  question,
  language,
  guide
}: GuideQaRequest): GuideQaAnswer {
  const context = buildGuideContextBlock(guide, language);
  const questionTokens = normalize(question);
  const rankedSections = context.sections
    .map((section) => ({
      section,
      score: scoreSection(questionTokens, section)
    }))
    .sort((left, right) => right.score - left.score);

  const topSections = rankedSections.filter((entry) => entry.score > 0).slice(0, 2);
  const matchedSections = topSections.map((entry) => entry.section);
  const topItems = matchedSections.flatMap((section) => section.items.slice(0, 2)).slice(0, 3);
  const firstSource = context.sources[0];
  const citations =
    firstSource
      ? (matchedSections.length > 0 ? matchedSections : [undefined]).map((section) => ({
          guideId: context.guideId,
          title: context.title,
          sourceName: firstSource.sourceName,
          sourceUrl: firstSource.sourceUrl,
          sectionTitle: section?.title
        }))
      : [];

  const confidence = deriveGuideQaConfidence({
    proposedConfidence: matchedSections.length > 0 && (topSections[0]?.score ?? 0) >= 2 ? "high" : "medium",
    matchedSectionsCount: matchedSections.length,
    topMatchScore: topSections[0]?.score ?? 0,
    hasCitations: citations.length > 0,
    freshness: context.freshness,
    sourceConfidence: guide.sources[0]?.confidence
  });

  const shortAnswer =
    language === "ko"
      ? matchedSections.length > 0
        ? `현재 가이드 기준으로는 ${matchedSections[0].title} 항목을 먼저 보는 게 가장 가깝습니다.`
        : "현재 가이드만으로는 질문에 바로 답하기 어려워 추가 확인이 필요합니다."
      : matchedSections.length > 0
        ? `Based on the current guide, the closest section is ${matchedSections[0].title}.`
        : "The current guide does not clearly answer this question, so additional confirmation is needed.";

  const explanation =
    language === "ko"
      ? matchedSections.length > 0
        ? `${guide.title} 안에서 질문과 가장 가까운 내용은 ${matchedSections
            .map((section) => section.title)
            .join(", ")} 입니다.`
        : `${guide.title} 요약과 섹션 안에서 질문과 직접 맞닿는 항목을 찾지 못했습니다.`
      : matchedSections.length > 0
        ? `The closest matches inside ${guide.title} are ${matchedSections
            .map((section) => section.title)
            .join(", ")}.`
        : `No direct match was found inside ${guide.title}.`;

  const reasons =
    topItems.length > 0
      ? topItems
      : context.summary
        ? [context.summary]
        : [
            language === "ko"
              ? "현재 저장된 가이드에서 직접 일치하는 항목을 찾지 못했습니다."
              : "No direct section match was found in the current guide."
          ];

  const cautions = unique(
    [
      context.freshness?.notes,
      buildDomainCaution(context.domain, language),
      confidence === "check_needed"
        ? language === "ko"
          ? "가이드 범위를 벗어난 질문일 수 있어 공식 기관 확인이 필요합니다."
          : "This may be outside the guide scope and may need official confirmation."
        : undefined
    ].filter(Boolean) as string[]
  ).slice(0, 3);

  const nextActions = unique(
    [
      matchedSections[0]
        ? language === "ko"
          ? `${matchedSections[0].title} 섹션을 다시 확인하세요.`
          : `Review the ${matchedSections[0].title} section again.`
        : undefined,
      buildDomainNextAction(context.domain, language)
    ].filter(Boolean) as string[]
  ).slice(0, 3);

  return {
    shortAnswer,
    explanation,
    reasons,
    cautions,
    nextActions,
    confidence,
    citations
  };
}

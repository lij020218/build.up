"use client";

import { Suspense } from "react";
import {
  bootstrapAccountWorkspace,
  completeCurrentStage,
  formatGuideSectionTitle,
  getFreshnessPresentation,
  getUiCopy,
  loadKnowledgeRecordById,
  localizeGuideRecord,
  saveRoadmapState,
  upsertStageDecision,
  type GuideQaAnswer,
  type FreshnessMeta,
  type KnowledgeItemRecord,
  type KnowledgeItemSourceRecord
} from "@foundone/shared";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useLanguage } from "../../language-provider";

type GuideRecord = KnowledgeItemRecord & {
  sources: KnowledgeItemSourceRecord[];
  freshness?: FreshnessMeta;
};

type QaEntry = { question: string; answer: GuideQaAnswer };

function getDomainLabel(domain: string, language: "ko" | "en") {
  if (language === "ko") {
    if (domain === "permit-guide") return "인허가";
    if (domain === "tax-guide") return "세무";
    if (domain === "loan-guide") return "대출";
    return domain;
  }
  if (domain === "permit-guide") return "Permit";
  if (domain === "tax-guide") return "Tax";
  if (domain === "loan-guide") return "Loan";
  return domain;
}

function getDomainColor(domain: string) {
  // 도메인 구분용 뉴트럴 컬러(성과 신호 아님) — 신호등 컬러 금지 원칙에 따라
  // 초록/주황 대신 네이비 농담 + 중립 블루로 카테고리만 구분.
  if (domain === "permit-guide") return "#457b9d";
  if (domain === "tax-guide") return "#007aff";
  if (domain === "loan-guide") return "#1d3557";
  return "#8e8e93";
}

function getConfidenceColor(confidence: GuideQaAnswer["confidence"]) {
  // 신뢰도 신호: 높음=짙은 네이비, 보통=중간 네이비, 낮음=벽돌 danger.
  if (confidence === "high") return "#191970";
  if (confidence === "medium") return "rgba(25,25,112,0.58)";
  return "#b64c4c";
}

function formatConfidenceBadge(confidence: GuideQaAnswer["confidence"], language: "ko" | "en") {
  if (language === "ko") {
    if (confidence === "high") return "신뢰 높음";
    if (confidence === "medium") return "신뢰 보통";
    return "추가 확인 필요";
  }
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  return "Check needed";
}

function getFreshnessLocalized(meta: FreshnessMeta | undefined, language: "ko" | "en"): { label: string; checked: string; next?: string } {
  if (!meta) return { label: language === "ko" ? "출처 미확인" : "Source unverified", checked: "" };
  const label =
    language === "ko"
      ? meta.status === "fresh" ? "공식 출처 검증 완료"
        : meta.status === "review_soon" ? "곧 재검토 예정"
        : meta.status === "stale" ? "정보 최신성 낮음"
        : "재검토 대기 중"
      : meta.label;
  return {
    label,
    checked: meta.lastCheckedAt.slice(0, 10),
    next: meta.nextReviewAt?.slice(0, 10)
  };
}

function getSectionItemStyle(key: string): "numbered" | "check" | "document" | "highlight" {
  if (key === "steps") return "numbered";
  if (key === "checkpoints") return "check";
  if (key === "requiredDocuments") return "document";
  return "highlight";
}

function getGuideSections(guide: GuideRecord | null, language: "ko" | "en") {
  if (!guide) return [];
  return Object.entries(guide.payload)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => ({
      key,
      title: formatGuideSectionTitle(key, language),
      style: getSectionItemStyle(key),
      items: (value as unknown[]).map((item) => String(item))
    }));
}

const SUGGESTED_QUESTIONS: Record<string, { ko: string[]; en: string[] }> = {
  "permit-guide": {
    ko: [
      "사업자등록 순서가 어떻게 되나요?",
      "위생교육은 언제, 어디서 받나요?",
      "필요한 서류가 무엇인가요?",
      "허가와 신고의 차이가 뭔가요?"
    ],
    en: [
      "What is the order of business registration?",
      "When and where do I get food safety training?",
      "What documents do I need?",
      "What is the difference between a license and a notification?"
    ]
  },
  "tax-guide": {
    ko: [
      "부가세 신고는 언제 해야 하나요?",
      "간이과세자와 일반과세자 차이가 뭔가요?",
      "세무사 없이 직접 신고할 수 있나요?",
      "카드 매출 증빙은 어떻게 관리하나요?"
    ],
    en: [
      "When is VAT filing due?",
      "What is the difference between simplified and general VAT?",
      "Can I file taxes without a tax accountant?",
      "How do I manage card sales receipts?"
    ]
  },
  "loan-guide": {
    ko: [
      "소진공 창업자금 신청 조건이 뭔가요?",
      "사업 시작 전에도 대출 신청이 가능한가요?",
      "정책자금과 일반 은행 대출 차이는?",
      "대출 신청에 필요한 서류가 뭔가요?"
    ],
    en: [
      "What are the eligibility requirements for SEMAS startup funds?",
      "Can I apply for a loan before opening?",
      "What is the difference between policy funds and regular bank loans?",
      "What documents are needed to apply?"
    ]
  }
};

const styles = {
  shell: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "32px 20px 80px"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap" as const
  },
  navGroup: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap" as const,
    padding: "6px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.72)",
    background: "rgba(255,255,255,0.5)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 10px 28px rgba(17,17,17,0.04)"
  },
  navButton: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    border: "1px solid transparent",
    background: "transparent",
    padding: "10px 14px",
    textDecoration: "none",
    color: "var(--muted)",
    fontSize: "13px",
    cursor: "pointer"
  },
  navButtonActive: {
    border: "1px solid rgba(255,255,255,0.82)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.62) 100%)",
    color: "var(--primary)",
    fontWeight: 600,
    boxShadow: "0 8px 20px rgba(17,17,17,0.05)"
  },
  card: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.78) 100%)",
    border: "1px solid rgba(255,255,255,0.76)",
    borderRadius: "28px",
    padding: "28px 24px",
    display: "grid",
    gap: "20px",
    boxShadow: "0 18px 48px rgba(17,17,17,0.06)",
    backdropFilter: "blur(18px)"
  },
  domainBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    borderRadius: "999px",
    padding: "4px 12px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    width: "fit-content"
  },
  title: {
    fontSize: "26px",
    lineHeight: 1.1,
    fontWeight: 700,
    letterSpacing: "-0.4px"
  },
  summary: {
    color: "var(--muted)",
    lineHeight: 1.75,
    fontSize: "15px"
  },
  freshnessRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "13px"
  },
  dot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0
  },
  sectionBlock: {
    display: "grid",
    gap: "10px"
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--muted)"
  },
  stepItem: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    padding: "10px 0",
    borderBottom: "0.5px solid rgba(0,0,0,0.06)"
  },
  stepNumber: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "rgba(0,122,255,0.1)",
    color: "#007aff",
    fontSize: "12px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "1px"
  },
  stepText: {
    fontSize: "14px",
    lineHeight: 1.6,
    color: "rgba(0,0,0,0.78)"
  },
  checkItem: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "rgba(0,0,0,0.78)",
    padding: "6px 0"
  },
  checkIcon: {
    color: "#1d3557",
    fontWeight: 700,
    fontSize: "14px",
    flexShrink: 0,
    marginTop: "2px"
  },
  highlightItem: {
    background: "rgba(0,122,255,0.04)",
    border: "0.5px solid rgba(0,122,255,0.12)",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "rgba(0,0,0,0.78)"
  },
  documentItem: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    padding: "8px 12px",
    background: "rgba(0,0,0,0.03)",
    borderRadius: "8px",
    fontSize: "14px",
    color: "rgba(0,0,0,0.78)"
  },
  divider: {
    height: "1px",
    background: "rgba(0,0,0,0.07)"
  },
  sourceCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    background: "rgba(0,0,0,0.03)",
    borderRadius: "10px",
    gap: "10px"
  },
  sourceLink: {
    color: "#007aff",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 500
  },
  sourceMeta: {
    fontSize: "12px",
    color: "var(--muted)",
    flexShrink: 0
  },
  qaSection: {
    display: "grid",
    gap: "14px"
  },
  suggestedRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap" as const
  },
  suggestedChip: {
    border: "1px solid rgba(0,122,255,0.2)",
    background: "rgba(0,122,255,0.05)",
    borderRadius: "999px",
    padding: "7px 14px",
    fontSize: "13px",
    color: "#007aff",
    cursor: "pointer",
    transition: "all 0.15s"
  },
  textarea: {
    borderRadius: "14px",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.92)",
    padding: "14px 16px",
    minHeight: "88px",
    resize: "vertical" as const,
    font: "inherit",
    fontSize: "14px",
    color: "var(--text)",
    lineHeight: 1.6,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const
  },
  askButton: {
    borderRadius: "999px",
    border: "none",
    background: "#007aff",
    color: "#fff",
    padding: "12px 22px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer"
  },
  askButtonDisabled: {
    background: "rgba(0,0,0,0.1)",
    color: "var(--muted)",
    cursor: "default"
  },
  historyEntry: {
    display: "grid",
    gap: "12px",
    padding: "16px",
    background: "rgba(0,0,0,0.025)",
    borderRadius: "16px",
    border: "0.5px solid rgba(0,0,0,0.07)"
  },
  questionBubble: {
    fontSize: "14px",
    fontWeight: 600,
    color: "rgba(0,0,0,0.8)",
    lineHeight: 1.5
  },
  answerBlock: {
    display: "grid",
    gap: "10px"
  },
  answerMetaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px"
  },
  answerLabel: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--muted)"
  },
  confidenceBadge: {
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: 700
  },
  shortAnswer: {
    fontSize: "15px",
    fontWeight: 600,
    lineHeight: 1.55,
    color: "rgba(0,0,0,0.85)"
  },
  explanation: {
    fontSize: "13px",
    lineHeight: 1.65,
    color: "var(--muted)"
  },
  answerListSection: {
    display: "grid",
    gap: "6px"
  },
  answerListLabel: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--muted)"
  },
  answerListItem: {
    display: "flex",
    gap: "8px",
    fontSize: "13px",
    lineHeight: 1.6,
    color: "rgba(0,0,0,0.75)"
  },
  completionButton: {
    borderRadius: "999px",
    border: "1.5px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.9)",
    padding: "14px 22px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    color: "var(--primary)"
  },
  warningText: {
    color: "#b64c4c",
    fontSize: "13px",
    lineHeight: 1.6
  },
  stateText: {
    color: "var(--muted)",
    lineHeight: 1.8,
    fontSize: "15px"
  }
};

export default function GuideDetailPageWrapper() {
  return (
    <Suspense>
      <GuideDetailPage />
    </Suspense>
  );
}

function GuideDetailPage() {
  const router = useRouter();
  const params = useParams<{ guideId: string }>();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const copy = getUiCopy(language);
  const ko = language === "ko";

  const [guide, setGuide] = useState<GuideRecord | null>(null);
  const [status, setStatus] = useState<string>(copy.common.loadingGuide);
  const [completionState, setCompletionState] = useState<string>("idle");
  const [question, setQuestion] = useState("");
  const [qaStatus, setQaStatus] = useState<"idle" | "loading" | "error">("idle");
  const [qaError, setQaError] = useState("");
  const [qaHistory, setQaHistory] = useState<QaEntry[]>([]);
  const stageId = searchParams.get("stageId");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const guideId = params?.guideId;
        if (!guideId) {
          setGuide(null);
          setStatus(copy.common.guideNotFound);
          return;
        }
        const record = await loadKnowledgeRecordById(supabase, guideId);
        if (cancelled) return;
        if (!record) { setGuide(null); setStatus(copy.common.guideNotFound); return; }
        setGuide(localizeGuideRecord(record, language));
        setStatus("");
      } catch (error) {
        if (cancelled) return;
        setStatus(error instanceof Error ? error.message : copy.common.failedToLoadGuide);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [params, language]); // eslint-disable-line react-hooks/exhaustive-deps

  const freshness = getFreshnessPresentation(guide?.freshness);
  const freshnessLocalized = getFreshnessLocalized(guide?.freshness, language);
  const sections = getGuideSections(guide, language);
  const domainColor = getDomainColor(guide?.domain ?? "");
  const suggestedQs = guide
    ? (SUGGESTED_QUESTIONS[guide.domain]?.[language] ?? [])
    : [];

  const completionLabel =
    stageId === "permit-guide"
      ? copy.guide.markPermitReviewedAndReturn
      : stageId === "tax-guide"
        ? copy.guide.markTaxReviewedAndReturn
        : stageId === "loan-guide"
          ? copy.guide.markLoanReviewedAndReturn
          : null;

  const handleMarkReviewed = async () => {
    if (!stageId) return;
    try {
      setCompletionState(copy.common.saving);
      const workspace = await bootstrapAccountWorkspace(supabase);
      const nextDecisions = upsertStageDecision(workspace.state.decisions, stageId, {
        stageId,
        inputs: { reviewed: true },
        completedAt: new Date().toISOString()
      });
      const transition = completeCurrentStage(workspace.state.roadmap, nextDecisions, workspace.state.tasks);
      await saveRoadmapState(
        supabase,
        { roadmap: transition.roadmap, decisions: nextDecisions, tasks: workspace.state.tasks },
        workspace.user
      );
      router.push("/current");
    } catch (error) {
      setCompletionState(error instanceof Error ? error.message : copy.common.guideReviewSaveFailed);
    }
  };

  const handleAsk = async (q?: string) => {
    const asked = (q ?? question).trim();
    if (!guide || !asked) return;
    try {
      setQaStatus("loading");
      setQaError("");
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(ko ? "로그인 세션을 다시 확인해 주세요." : "Please refresh your login session.");
      }

      const response = await fetch("/api/ai/guides/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ guideId: guide.id, question: asked, language })
      });
      const payload = (await response.json()) as GuideQaAnswer | { error?: string };
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Failed to answer question.");
      }
      setQaHistory((prev) => [...prev, { question: asked, answer: payload as GuideQaAnswer }]);
      setQuestion("");
      setQaStatus("idle");
    } catch (error) {
      setQaStatus("error");
      setQaError(error instanceof Error ? error.message : "Failed to answer question.");
    }
  };

  return (
    <main style={styles.shell}>
      {/* ── 상단 내비게이션 ── */}
      <div style={styles.topBar}>
        <div style={styles.navGroup}>
          <button type="button" style={styles.navButton} onClick={() => router.back()}>
            {ko ? "← 뒤로" : "← Back"}
          </button>
          <Link href="/" style={styles.navButton}>{copy.common.home}</Link>
          <Link href="/current" style={styles.navButton}>{copy.home.today}</Link>
          <Link href="/roadmap" style={styles.navButton}>{copy.home.starterFlow}</Link>
          <Link href="/guides" style={{ ...styles.navButton, ...styles.navButtonActive }}>
            {copy.home.operationalGuides}
          </Link>
        </div>
      </div>

      <article style={styles.card}>
        {guide ? (
          <>
            {/* ── 도메인 배지 + 제목 + 요약 ── */}
            <div>
              <div style={{ ...styles.domainBadge, background: `${domainColor}14`, color: domainColor }}>
                <div style={{ ...styles.dot, background: domainColor }} />
                {getDomainLabel(guide.domain, language)}
              </div>
            </div>
            <div style={styles.title}>{guide.title}</div>
            {guide.summary ? <div style={styles.summary}>{guide.summary}</div> : null}

            {/* ── 신선도 표시 ── */}
            <div style={{
              ...styles.freshnessRow,
              background: freshness.tone === "critical"
                ? "rgba(182,76,76,0.06)"
                : freshness.tone === "warning"
                  ? "rgba(25,25,112,0.08)"
                  : "rgba(25,25,112,0.04)"
            }}>
              <div style={{
                ...styles.dot,
                background: freshness.tone === "critical" ? "#b64c4c"
                  : freshness.tone === "warning" ? "rgba(25,25,112,0.85)" : "rgba(25,25,112,0.38)"
              }} />
              <span style={{
                fontSize: "13px",
                fontWeight: 600,
                color: freshness.tone === "critical" ? "#b64c4c"
                  : freshness.tone === "warning" ? "#191970" : "#1d3557"
              }}>
                {freshnessLocalized.label}
              </span>
              {freshnessLocalized.checked && (
                <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "4px" }}>
                  · {ko ? "확인" : "Checked"} {freshnessLocalized.checked}
                  {freshnessLocalized.next ? ` · ${ko ? "재검토" : "Review by"} ${freshnessLocalized.next}` : ""}
                </span>
              )}
            </div>
            {guide.freshness?.notes ? (
              <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65, padding: "0 2px" }}>
                {guide.freshness.notes}
              </div>
            ) : null}

            {/* ── 섹션 콘텐츠 ── */}
            {sections.map((section) => (
              <div key={section.key} style={styles.sectionBlock}>
                <div style={styles.sectionLabel}>{section.title}</div>
                {section.style === "numbered" && section.items.map((item, i) => (
                  <div key={item} style={{ ...styles.stepItem, borderBottom: i === section.items.length - 1 ? "none" : styles.stepItem.borderBottom }}>
                    <div style={styles.stepNumber}>{i + 1}</div>
                    <div style={styles.stepText}>{item}</div>
                  </div>
                ))}
                {section.style === "check" && section.items.map((item) => (
                  <div key={item} style={styles.checkItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
                {section.style === "document" && section.items.map((item) => (
                  <div key={item} style={styles.documentItem}>
                    <span style={{ fontSize: "13px", flexShrink: 0 }}>□</span>
                    <span>{item}</span>
                  </div>
                ))}
                {section.style === "highlight" && section.items.map((item) => (
                  <div key={item} style={styles.highlightItem}>{item}</div>
                ))}
              </div>
            ))}

            {/* ── 출처 ── */}
            {guide.sources.length > 0 && (
              <div style={styles.sectionBlock}>
                <div style={styles.sectionLabel}>{copy.common.sources}</div>
                {guide.sources.map((source) => (
                  <div key={source.id} style={styles.sourceCard}>
                    <a href={source.sourceUrl} target="_blank" rel="noreferrer" style={styles.sourceLink}>
                      {source.sourceName}
                    </a>
                    <span style={styles.sourceMeta}>
                      {ko ? "확인" : "Verified"} {source.verifiedAt.slice(0, 10)}
                      {source.expiresAt ? ` · ${ko ? "만료" : "Exp."} ${source.expiresAt.slice(0, 10)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.divider} />

            {/* ── 가이드 Q&A ── */}
            <div style={styles.qaSection}>
              <div style={{ fontSize: "15px", fontWeight: 700 }}>
                {ko ? "이 가이드에 대해 질문하기" : "Ask about this guide"}
              </div>
              <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                {ko
                  ? "가이드 내용을 근거로만 답변합니다. 가이드 범위를 벗어난 질문은 \"추가 확인 필요\"로 안내합니다."
                  : "Answers are grounded in this guide only. Questions outside its scope will be flagged."}
              </div>

              {/* 추천 질문 */}
              {suggestedQs.length > 0 && qaHistory.length === 0 && (
                <div style={styles.suggestedRow}>
                  {suggestedQs.map((q) => (
                    <button
                      key={q}
                      type="button"
                      style={styles.suggestedChip}
                      onClick={() => void handleAsk(q)}
                      disabled={qaStatus === "loading"}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Q&A 히스토리 */}
              {qaHistory.map((entry, idx) => {
                const confidenceColor = getConfidenceColor(entry.answer.confidence);
                return (
                  <div key={idx} style={styles.historyEntry}>
                    <div style={styles.questionBubble}>Q. {entry.question}</div>
                    <div style={styles.answerBlock}>
                      <div style={styles.answerMetaRow}>
                        <span style={styles.answerLabel}>
                          {ko ? "AI 해석 · 가이드 근거" : "AI · Guide-grounded"}
                        </span>
                        <span style={{
                          ...styles.confidenceBadge,
                          background: `${confidenceColor}14`,
                          color: confidenceColor
                        }}>
                          {formatConfidenceBadge(entry.answer.confidence, language)}
                        </span>
                      </div>
                      <div style={styles.shortAnswer}>{entry.answer.shortAnswer}</div>
                      {entry.answer.explanation && (
                        <div style={styles.explanation}>{entry.answer.explanation}</div>
                      )}
                      {entry.answer.cautions.length > 0 && (
                        <div style={styles.answerListSection}>
                          <div style={styles.answerListLabel}>{ko ? "주의할 점" : "Cautions"}</div>
                          {entry.answer.cautions.map((item) => (
                            <div key={item} style={styles.answerListItem}>
                              <span style={{ color: "#b64c4c", flexShrink: 0 }}>!</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {entry.answer.nextActions.length > 0 && (
                        <div style={styles.answerListSection}>
                          <div style={styles.answerListLabel}>{ko ? "다음 행동" : "Next actions"}</div>
                          {entry.answer.nextActions.map((item) => (
                            <div key={item} style={styles.answerListItem}>
                              <span style={{ color: "#007aff", flexShrink: 0 }}>→</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {entry.answer.citations.length > 0 && (
                        <div style={{ fontSize: "12px", color: "var(--muted)", borderTop: "0.5px solid rgba(0,0,0,0.07)", paddingTop: "8px" }}>
                          {ko ? "근거: " : "Source: "}
                          {entry.answer.citations.map((c, i) => (
                            <span key={i}>
                              {c.sectionTitle ?? c.title}
                              {c.sourceName ? ` · ${c.sourceName}` : ""}
                              {i < entry.answer.citations.length - 1 ? " / " : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 입력 영역 */}
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && question.trim()) {
                    void handleAsk();
                  }
                }}
                placeholder={
                  qaHistory.length > 0
                    ? (ko ? "추가로 궁금한 점을 적어보세요." : "Ask a follow-up question.")
                    : (ko ? "이 가이드에 대해 궁금한 점을 적어보세요." : "Ask a question about this guide.")
                }
                style={styles.textarea}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" as const }}>
                <button
                  type="button"
                  style={{
                    ...styles.askButton,
                    ...((!question.trim() || qaStatus === "loading") ? styles.askButtonDisabled : {})
                  }}
                  onClick={() => void handleAsk()}
                  disabled={!question.trim() || qaStatus === "loading"}
                >
                  {qaStatus === "loading"
                    ? (ko ? "해석 중…" : "Answering…")
                    : (ko ? "질문하기" : "Ask")}
                </button>
                {qaHistory.length > 0 && (
                  <button
                    type="button"
                    style={{ ...styles.navButton, border: "1px solid rgba(0,0,0,0.1)", borderRadius: "999px", padding: "10px 16px" }}
                    onClick={() => setQaHistory([])}
                  >
                    {ko ? "대화 초기화" : "Clear chat"}
                  </button>
                )}
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {ko ? "⌘ + Enter로 전송" : "⌘ + Enter to send"}
                </span>
              </div>
              {qaError ? <div style={styles.warningText}>{qaError}</div> : null}
            </div>

            {/* ── 단계 완료 버튼 ── */}
            {completionLabel ? (
              <>
                <div style={styles.divider} />
                <div style={{ display: "grid", gap: "10px" }}>
                  <button
                    type="button"
                    style={styles.completionButton}
                    onClick={() => void handleMarkReviewed()}
                    disabled={completionState === copy.common.saving}
                  >
                    {completionState === copy.common.saving ? copy.common.saving : completionLabel}
                  </button>
                  {completionState !== "idle" && completionState !== copy.common.saving ? (
                    <div style={styles.warningText}>{completionState}</div>
                  ) : null}
                </div>
              </>
            ) : null}
          </>
        ) : (
          <div style={styles.stateText}>{status}</div>
        )}
      </article>
    </main>
  );
}

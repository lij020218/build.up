"use client";

/**
 * TaxFaqCard — 세무 FAQ(검증된 답변) + AI fallback 위젯.
 *
 * tax-guide 단계 SSOT 전환(2026-06-25)으로 TaxGuideStage.tsx 에서 추출 → StageContentRenderer 의
 * interactive ref="taxFaq" 에서 사용. iOS 대응 위젯은 BUTaxFAQCard.
 *
 * 구조: 검증 FAQ 칩 + 검색 매칭(matchTaxFaq) → 0건 시 AI 답변(SSE) fallback.
 */

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { TAX_FAQ_ENTRIES, matchTaxFaq, type TaxFaqEntry } from "@foundone/shared";

const MIDNIGHT = "#191970";

export function TaxFaqCard({
  ko,
  qaText,
  setQaText,
  qaStatus,
  qaError,
  askAi,
}: {
  ko: boolean;
  qaText: string;
  setQaText: (v: string) => void;
  qaStatus: "idle" | "loading" | "error";
  qaError: string;
  askAi: () => void;
}) {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const matches: TaxFaqEntry[] = useMemo(() => {
    const q = search.trim();
    if (q.length < 2) return [];
    return matchTaxFaq(q);
  }, [search]);

  const displayedFaqs: TaxFaqEntry[] = matches.length > 0 ? matches : TAX_FAQ_ENTRIES;
  const noMatch = search.trim().length >= 2 && matches.length === 0;

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "16px",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    padding: "16px 18px",
  };
  const sectionLabel: React.CSSProperties = {
    fontSize: "11.5px",
    fontWeight: 700,
    color: "rgba(0,0,0,0.5)",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    marginBottom: "10px",
  };

  return (
    <div style={{ marginTop: "18px" }}>
      <div style={sectionLabel}>{ko ? "자주 묻는 세무 질문" : "Frequently Asked Tax Questions"}</div>
      <div style={cardStyle}>
        <div style={{ marginBottom: "12px" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setQaText(e.target.value); }}
            placeholder={ko ? "예: 간이과세, 부가세 신고, 사업용 카드, 세무사 비용..." : "e.g., simplified VAT, filing, business card..."}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "13.5px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>

        {noMatch ? (
          <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(182,76,76,0.04)", border: "1px dashed rgba(182,76,76,0.2)", marginBottom: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "6px" }}>
              {ko ? "준비된 FAQ에서 매칭되는 답변이 없어요" : "No matching FAQ found"}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55, marginBottom: "12px" }}>
              {ko ? "AI 답변은 일반 가이드이며 법령 변경 시 정확하지 않을 수 있어요. 중요한 결정은 세무사·국세청 확인 권장." : "AI answers are general guidance. Verify important decisions with a CPA or NTS."}
            </div>
            <button type="button" onClick={askAi} disabled={qaStatus === "loading"} style={{ padding: "9px 16px", borderRadius: "10px", border: "none", background: MIDNIGHT, color: "#fff", fontSize: "12.5px", fontWeight: 700, cursor: qaStatus === "loading" ? "wait" : "pointer", opacity: qaStatus === "loading" ? 0.5 : 1, fontFamily: "inherit" }}>
              {qaStatus === "loading" ? (ko ? "AI 답변 생성 중..." : "Generating...") : (ko ? "AI 에게 묻기 (참고용)" : "Ask AI (reference)")}
            </button>
            {qaError && <div style={{ marginTop: "8px", fontSize: "12px", color: "#b64c4c" }}>{qaError}</div>}
            {qaText && qaStatus !== "loading" && (
              <div style={{ marginTop: "12px", padding: "12px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", fontSize: "13px", color: "rgba(15,23,42,0.8)", lineHeight: 1.65, whiteSpace: "pre-wrap" as const }}>
                {qaText}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
            {displayedFaqs.map((faq) => {
              const open = openId === faq.id;
              return (
                <div key={faq.id} style={{ borderRadius: "12px", border: open ? `1.5px solid ${MIDNIGHT}` : "1px solid rgba(0,0,0,0.08)", background: open ? "rgba(25,25,112,0.03)" : "white", transition: "border-color 160ms, background 160ms", overflow: "hidden" }}>
                  <button type="button" onClick={() => setOpenId(open ? null : faq.id)} style={{ width: "100%", padding: "12px 14px", background: "transparent", border: "none", textAlign: "left" as const, cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontFamily: "inherit" }}>
                    <span style={{ fontSize: "13px", fontWeight: 650, color: open ? MIDNIGHT : "#0f172a", letterSpacing: "-0.005em", flex: 1, lineHeight: 1.45 }}>{faq.question}</span>
                    <ChevronRight size={14} strokeWidth={2} style={{ color: open ? MIDNIGHT : "rgba(0,0,0,0.35)", transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 160ms", flexShrink: 0 }} />
                  </button>
                  {open && (
                    <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "12px" }}>
                      <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.82)", lineHeight: 1.7, whiteSpace: "pre-wrap" as const, marginBottom: "10px" }}>{faq.answer}</div>
                      {faq.sources.length > 0 && (
                        <div style={{ fontSize: "11px", color: "var(--muted)", paddingTop: "8px", borderTop: "1px dashed rgba(0,0,0,0.08)", marginTop: "4px" }}>
                          <span style={{ fontWeight: 600 }}>{ko ? "출처" : "Sources"}</span> <span style={{ marginLeft: "4px" }}>·</span>{" "}
                          <span style={{ color: "var(--muted)" }}>{ko ? "검증" : "verified"} {faq.lastVerified}</span>
                          <div style={{ marginTop: "4px", display: "flex", flexDirection: "column" as const, gap: "2px" }}>
                            {faq.sources.map((src, i) => (
                              <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: MIDNIGHT, textDecoration: "none", fontWeight: 500 }}>· {src.label}</a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

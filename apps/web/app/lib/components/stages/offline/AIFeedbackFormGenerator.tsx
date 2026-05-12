"use client";

import { useState } from "react";
import {
  Sparkles, Loader2, Copy, Check, FileText, ExternalLink,
  AlertCircle, type LucideIcon,
} from "lucide-react";
import { supabase } from "../../../../../lib/supabase";

const MIDNIGHT = "#191970";

type Question = {
  id: string;
  type: "rating" | "multiple_choice" | "short_answer" | "yes_no";
  question: string;
  description?: string;
  options?: string[];
  scale?: 5 | 7 | 10;
  required?: boolean;
};

type FeedbackForm = {
  intro: string;
  questions: Question[];
  tips: string[];
  paperText: string;
};

type Props = {
  language: "ko" | "en";
  industryCategoryId: string;
  selectedIndustryId?: string;
  startupType?: "franchise" | "independent" | "undecided";
  storeName?: string;
};

/**
 * AI 피드백 폼 생성기 — 사용자가 한 번 클릭하면 sub-industry·운영형태 맞춤 질문지를 생성.
 *
 * 출력 형식:
 *  · 5–7개 질문 (rating / 객관식 / 단답)
 *  · 응답자 인사말
 *  · 운영자 활용 팁
 *  · 종이 카드용 plain text (구글폼·네이버폼·카카오폼 호환)
 *
 * 사용자가 결과를 "구글 폼", "네이버 폼", "카카오톡 채널 폼" 으로 복사 가능.
 */
export function AIFeedbackFormGenerator({
  language, industryCategoryId, selectedIndustryId, startupType, storeName,
}: Props) {
  const ko = language === "ko";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FeedbackForm | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Supabase 세션 토큰 가져오기 (인증 필수)
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setError(ko ? "로그인이 필요합니다." : "Sign-in required.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/ai/agents/feedback-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          industryCategoryId,
          selectedIndustryId,
          startupType,
          storeName,
          language,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? (ko ? "생성 실패" : "Generation failed"));
        setLoading(false);
        return;
      }

      const data = (await res.json()) as FeedbackForm;
      setForm(data);
    } catch (err) {
      setError(ko ? "생성 중 오류가 발생했습니다." : "Error during generation.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 복사 — 키 단위 (어떤 버튼이 눌렸는지 표시)
  const doCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      setError(ko ? "복사 실패 — 텍스트를 직접 선택해 복사하세요." : "Copy failed — select text manually.");
    }
  };

  // ─── 폼별 변환 ───
  const toGoogleFormsText = (f: FeedbackForm): string => {
    const lines: string[] = [];
    lines.push(f.intro);
    lines.push("");
    f.questions.forEach((q, i) => {
      const num = `${i + 1}. ${q.question}${q.required ? " *" : ""}`;
      lines.push(num);
      if (q.description) lines.push(`   (${q.description})`);
      if (q.type === "rating") {
        lines.push(`   척도 1–${q.scale ?? 5} (${q.scale ?? 5}점이 가장 좋음)`);
      } else if (q.type === "multiple_choice" && q.options) {
        q.options.forEach((opt) => lines.push(`   ☐ ${opt}`));
      } else if (q.type === "yes_no") {
        lines.push(`   ☐ 예    ☐ 아니오`);
      } else if (q.type === "short_answer") {
        lines.push(`   (단답형)`);
      }
      lines.push("");
    });
    return lines.join("\n").trim();
  };

  const toNaverFormText = (f: FeedbackForm): string => {
    // 네이버 폼은 구글 폼과 거의 동일 형식. 척도 표기만 살짝 다름
    return toGoogleFormsText(f);
  };

  const toKakaoChannelText = (f: FeedbackForm): string => {
    // 카카오톡 채널 발송용 — 더 짧게, 이모지 적당히
    const lines: string[] = [];
    lines.push(`📋 ${f.intro}`);
    lines.push("");
    f.questions.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.question}`);
      if (q.type === "rating") {
        lines.push(`   ⭐ 1–${q.scale ?? 5}점`);
      } else if (q.type === "multiple_choice" && q.options) {
        lines.push(`   ${q.options.map((o, j) => `${j + 1}) ${o}`).join("  ")}`);
      } else if (q.type === "yes_no") {
        lines.push(`   1) 예  2) 아니오`);
      }
      lines.push("");
    });
    lines.push("응답해 주셔서 감사합니다 🙏");
    return lines.join("\n").trim();
  };

  // ─── 렌더 ───
  return (
    <div style={{
      background: "white",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)",
    }}>
      {/* 헤더 */}
      <div style={{
        padding: "18px 20px 14px",
        background: form
          ? `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`
          : "transparent",
        color: form ? "#fff" : "var(--text)",
        transition: "background 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: form ? "rgba(255,255,255,0.18)" : "rgba(25,25,112,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            color: form ? "#fff" : MIDNIGHT,
          }}>
            <Sparkles size={18} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, opacity: form ? 0.7 : 0.4, marginBottom: "3px" }}>
              {ko ? "AI 피드백 폼 생성기" : "AI Feedback Form Generator"}
            </div>
            <div style={{ fontSize: "15.5px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              {form
                ? (ko ? "✓ 맞춤 질문지가 생성됐어요" : "✓ Custom feedback form generated")
                : (ko ? "내 업종에 딱 맞는 피드백 질문지" : "Feedback questions tailored to your business")}
            </div>
            <div style={{ fontSize: "12.5px", color: form ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.5)", marginTop: "3px", lineHeight: 1.5 }}>
              {form
                ? (ko ? "구글 폼·네이버 폼·카카오톡 채널에 바로 붙여넣어 사용하세요." : "Paste directly into Google Forms / Naver Form / Kakao Channel.")
                : (ko ? "AI가 5~7개 질문을 자동으로 설계 — 1분 안에 완성." : "AI designs 5-7 questions in under a minute.")}
            </div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ padding: "0 20px 18px" }}>
        {!form && (
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              width: "100%",
              padding: "13px 16px",
              borderRadius: "12px",
              background: loading ? "rgba(25,25,112,0.5)" : MIDNIGHT,
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              border: "none",
              cursor: loading ? "default" : "pointer",
              boxShadow: loading ? "none" : "0 4px 14px rgba(25,25,112,0.3)",
              transition: "all 0.2s",
              marginTop: "12px",
            }}
          >
            {loading
              ? <><Loader2 size={15} strokeWidth={2.4} style={{ animation: "spin 1s linear infinite" }} /> {ko ? "AI가 질문 설계 중..." : "Designing questions..."}</>
              : <><Sparkles size={15} strokeWidth={2.4} /> {ko ? "AI로 피드백 폼 생성" : "Generate with AI"}</>
            }
          </button>
        )}

        {error && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "8px",
            padding: "10px 12px", marginTop: "12px",
            borderRadius: "10px",
            background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.14)",
            fontSize: "12.5px", color: "#dc2626", lineHeight: 1.5,
          }}>
            <AlertCircle size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: "1px" }} />
            <span>{error}</span>
          </div>
        )}

        {form && (
          <div style={{ marginTop: "14px" }}>
            {/* 인사말 */}
            <div style={{
              padding: "12px 14px", marginBottom: "12px",
              borderRadius: "12px",
              background: "rgba(25,25,112,0.04)",
              border: "1px solid rgba(25,25,112,0.08)",
              fontSize: "13px", lineHeight: 1.6, color: "rgba(0,0,0,0.7)",
            }}>
              💬 {form.intro}
            </div>

            {/* 질문 리스트 */}
            <div style={{
              borderRadius: "14px",
              border: "1px solid rgba(0,0,0,0.06)",
              overflow: "hidden",
              marginBottom: "14px",
            }}>
              {form.questions.map((q, i) => (
                <div key={q.id} style={{
                  padding: "12px 16px",
                  borderTop: i > 0 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
                  background: "white",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{
                      fontSize: "11.5px", fontWeight: 800,
                      width: 22, height: 22, borderRadius: 6,
                      background: "rgba(25,25,112,0.08)",
                      color: MIDNIGHT,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: "1px",
                    }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", lineHeight: 1.4 }}>
                        {q.question}
                        {q.required && <span style={{ color: "#dc2626", marginLeft: "4px" }}>*</span>}
                      </div>
                      {q.description && (
                        <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", marginTop: "3px", lineHeight: 1.5 }}>
                          {q.description}
                        </div>
                      )}
                      {/* 타입별 시각화 */}
                      <div style={{ marginTop: "7px" }}>
                        {q.type === "rating" && (
                          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" as const }}>
                            {Array.from({ length: q.scale ?? 5 }, (_, j) => (
                              <div key={j} style={{
                                width: 28, height: 28, borderRadius: 8,
                                border: "1px solid rgba(0,0,0,0.12)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.5)",
                              }}>
                                {j + 1}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === "multiple_choice" && q.options && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            {q.options.map((opt, j) => (
                              <div key={j} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(0,0,0,0.6)" }}>
                                <div style={{ width: 14, height: 14, borderRadius: 4, border: "1.5px solid rgba(0,0,0,0.18)", flexShrink: 0 }} />
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === "yes_no" && (
                          <div style={{ display: "flex", gap: "10px" }}>
                            {[ko ? "예" : "Yes", ko ? "아니오" : "No"].map((opt, j) => (
                              <div key={j} style={{ padding: "4px 14px", borderRadius: "999px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "12.5px", color: "rgba(0,0,0,0.6)" }}>
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === "short_answer" && (
                          <div style={{ height: 36, borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", padding: "8px 12px", fontSize: "12.5px", color: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center" }}>
                            {ko ? "단답형 응답..." : "Short answer..."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 복사 / 내보내기 버튼 3개 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "8px",
              marginBottom: "14px",
            }}>
              <ExportButton
                label={ko ? "구글 폼용 복사" : "Copy for Google Forms"}
                href="https://forms.google.com"
                copied={copiedKey === "google"}
                onCopy={() => doCopy("google", toGoogleFormsText(form))}
                ko={ko}
              />
              <ExportButton
                label={ko ? "네이버 폼용 복사" : "Copy for Naver Form"}
                href="https://form.office.naver.com"
                copied={copiedKey === "naver"}
                onCopy={() => doCopy("naver", toNaverFormText(form))}
                ko={ko}
              />
              <ExportButton
                label={ko ? "카카오톡 채널 발송용" : "For Kakao Channel"}
                href="https://center-pf.kakao.com"
                copied={copiedKey === "kakao"}
                onCopy={() => doCopy("kakao", toKakaoChannelText(form))}
                ko={ko}
              />
            </div>

            {/* 종이 카드 (인쇄용) */}
            <div style={{
              padding: "12px 14px",
              borderRadius: "12px",
              background: "rgba(0,0,0,0.025)",
              border: "1px solid rgba(0,0,0,0.06)",
              marginBottom: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "rgba(0,0,0,0.55)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                  <FileText size={12} strokeWidth={2.2} />
                  {ko ? "종이 카드 / 인쇄용" : "Paper / Print"}
                </div>
                <button
                  type="button"
                  onClick={() => doCopy("paper", form.paperText)}
                  style={{
                    fontSize: "11.5px", fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: copiedKey === "paper" ? "rgb(34,167,73)" : MIDNIGHT,
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: "4px",
                  }}
                >
                  {copiedKey === "paper" ? <><Check size={11} strokeWidth={2.4} /> {ko ? "복사됨" : "Copied"}</> : <><Copy size={11} strokeWidth={2.4} /> {ko ? "복사" : "Copy"}</>}
                </button>
              </div>
              <pre style={{
                margin: 0,
                fontSize: "11.5px",
                fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                lineHeight: 1.55,
                color: "rgba(0,0,0,0.65)",
                whiteSpace: "pre-wrap" as const,
                maxHeight: 180,
                overflow: "auto",
              }}>
                {form.paperText}
              </pre>
            </div>

            {/* 활용 팁 */}
            {form.tips.length > 0 && (
              <div style={{
                padding: "12px 14px", marginBottom: "12px",
                borderRadius: "12px",
                background: "rgba(25,25,112,0.04)",
                border: "1px solid rgba(25,25,112,0.1)",
              }}>
                <div style={{ fontSize: "11.5px", fontWeight: 700, color: MIDNIGHT, marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                  💡 {ko ? "운영자 활용 팁" : "How to use"}
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "5px" }}>
                  {form.tips.map((t, i) => (
                    <li key={i} style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.65)", lineHeight: 1.55 }}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 재생성 */}
            <button
              type="button"
              onClick={() => { setForm(null); setError(null); }}
              style={{
                fontSize: "12.5px", fontWeight: 600,
                color: "rgba(0,0,0,0.55)",
                background: "transparent", border: "none",
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              ← {ko ? "다시 생성" : "Regenerate"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ExportButton({
  label, href, copied, onCopy, ko,
}: { label: string; href: string; copied: boolean; onCopy: () => void; ko: boolean }) {
  const Icon: LucideIcon = copied ? Check : Copy;
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "4px",
      padding: "10px 12px",
      borderRadius: "12px",
      background: "white",
      border: "1px solid rgba(25,25,112,0.12)",
    }}>
      <button
        type="button"
        onClick={onCopy}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
          width: "100%",
          padding: "7px 10px",
          borderRadius: 8,
          background: copied ? "rgb(34,167,73)" : MIDNIGHT,
          color: "#fff",
          fontSize: "12px", fontWeight: 700,
          border: "none",
          cursor: "pointer",
          letterSpacing: "-0.01em",
        }}
      >
        <Icon size={11} strokeWidth={2.4} />
        {copied ? (ko ? "복사됨" : "Copied") : label}
      </button>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
          fontSize: "10.5px", fontWeight: 600,
          color: MIDNIGHT,
          textDecoration: "none",
          padding: "3px 0",
        }}
      >
        <ExternalLink size={9} strokeWidth={2.4} />
        {ko ? "사이트 열기" : "Open site"}
      </a>
    </div>
  );
}

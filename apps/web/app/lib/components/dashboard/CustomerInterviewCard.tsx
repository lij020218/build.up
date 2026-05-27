"use client";

import { useMemo, useState } from "react";
import { Users, Sparkles, MessageCircle, Plus, X, Loader2, Lightbulb, Copy, Check, ExternalLink, Share2, BookOpen, Download, ClipboardList, MessageSquare, AlertCircle, Heart, Lock, ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";
import { useInterviewStore, type CustomerInterview, type CustomerInterviewType } from "../../stores/interview-store";
import { supabase } from "../../../../lib/supabase";
import { INTERVIEW_TEMPLATES, type InterviewTemplate } from "@build-up/shared";
import { getKstDate } from "../../utils/business-day";

/**
 * CustomerInterviewCard — 운영 중인 매장용 단골/잠재고객 인터뷰 도구.
 *
 * 일반 업종 (음식점·카페·뷰티·소매·피트니스 등) 사장님이 단골/이탈/신규/잠재 고객과
 * 직접 대화한 결과를 누적 기록하고, AI가 패턴을 분석해 액션을 제시.
 *
 * 차이점:
 *   - CustomerDiscoveryStage (스타트업 전용 — 아직 안 만든 제품의 PMF 검증)
 *   - CustomerInterviewCard (이 컴포넌트 — 이미 운영 중인 매장의 단골 분석)
 *
 * Mom Test 원칙: 의견이 아닌 과거 행동을 묻기. "맛있어요?" 가 아니라
 *               "최근에 우리 가게 말고 어디 가셨어요?" 같은 행동 질문.
 */

type Props = { ko: boolean; industryCategoryId?: string };

const TYPE_META: Record<CustomerInterviewType, { ko: string; en: string; color: string; bg: string }> = {
  regular:   { ko: "단골",      en: "Regular",   color: "#059669", bg: "rgba(5,150,105,0.08)" },
  lapsed:    { ko: "이탈 단골", en: "Lapsed",    color: "#d97706", bg: "rgba(217,119,6,0.08)" },
  new:       { ko: "신규",      en: "New",       color: "#191970", bg: "rgba(25,25,112,0.08)" },
  potential: { ko: "잠재",      en: "Potential", color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
};

export function CustomerInterviewCard({ ko, industryCategoryId }: Props) {
  const interviews = useInterviewStore((s) => s.customerInterviews);
  const patternAnalysis = useInterviewStore((s) => s.patternAnalysis);
  const guideTopic = useInterviewStore((s) => s.guideTopic);
  const guideTargetType = useInterviewStore((s) => s.guideTargetType);
  const generatedScript = useInterviewStore((s) => s.generatedScript);
  const addInterview = useInterviewStore((s) => s.addInterview);
  const removeInterview = useInterviewStore((s) => s.removeInterview);
  const setPatternAnalysis = useInterviewStore((s) => s.setPatternAnalysis);
  const setGuideTopic = useInterviewStore((s) => s.setGuideTopic);
  const setGuideTargetType = useInterviewStore((s) => s.setGuideTargetType);
  const setGeneratedScript = useInterviewStore((s) => s.setGeneratedScript);

  const [tab, setTab] = useState<"guide" | "log" | "insight">("log");
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  // 질문지 외부 공유 — 클립보드 복사 피드백
  const [copyFeedback, setCopyFeedback] = useState<"questions" | "intro" | null>(null);

  // 자동 임포트 (Google Sheets 공개 CSV URL)
  const [importUrl, setImportUrl] = useState("");
  const [importType, setImportType] = useState<CustomerInterviewType>("regular");
  const [importLoading, setImportLoading] = useState(false);
  const [importMsg, setImportMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // 새 인터뷰 입력 폼
  const [newType, setNewType] = useState<CustomerInterviewType>("regular");
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const stats = useMemo(() => {
    const total = interviews.length;
    const byType = (Object.keys(TYPE_META) as CustomerInterviewType[]).reduce<Record<CustomerInterviewType, number>>(
      (acc, t) => ({ ...acc, [t]: interviews.filter((iv) => iv.type === t).length }),
      { regular: 0, lapsed: 0, new: 0, potential: 0 }
    );
    return { total, byType };
  }, [interviews]);

  // ── AI 인터뷰 가이드 생성 ──
  const handleGenerateScript = async () => {
    if (!guideTopic.trim()) {
      setScriptError(ko ? "주제를 입력해주세요" : "Please enter a topic");
      return;
    }
    setScriptLoading(true);
    setScriptError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error(ko ? "로그인이 필요합니다" : "Sign in required");

      const targetTypeLabel = TYPE_META[guideTargetType].ko;
      const res = await fetch("/api/ai/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          industryCategoryId: industryCategoryId ?? "general",
          problemStatement: ko ? `이미 운영 중인 매장의 ${targetTypeLabel} 고객으로부터 알고 싶은 것: ${guideTopic}` : `What I want to learn from ${guideTargetType} customers of my running business: ${guideTopic}`,
          targetCustomer: targetTypeLabel,
          language: ko ? "ko" : "en",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      // API 응답 형태에 맞춰 질문 추출 (questions 배열 또는 script 배열)
      const questions: string[] = Array.isArray(data?.questions) ? data.questions
        : Array.isArray(data?.script) ? data.script
        : Array.isArray(data?.openingQuestions) ? [...data.openingQuestions, ...(data.behaviorQuestions ?? []), ...(data.commitmentQuestions ?? [])]
        : [];
      setGeneratedScript(questions.length > 0 ? questions.slice(0, 7) : [
        ko ? "이 가게에 처음 오신 게 언제였어요?" : "When did you first visit?",
        ko ? "오늘 말고 가장 최근에는 언제 오셨어요?" : "When was your most recent visit besides today?",
        ko ? "보통 우리 가게 말고 어디를 가시나요?" : "Where else do you usually go?",
        ko ? "여기에 다시 오시는 가장 큰 이유가 뭐예요?" : "Biggest reason you come back?",
        ko ? "혹시 불편하거나 아쉬운 점이 있나요?" : "Anything inconvenient or disappointing?",
      ]);
    } catch (err) {
      console.error("[CustomerInterview] generate script error:", err);
      setScriptError(err instanceof Error ? err.message : String(err));
    } finally {
      setScriptLoading(false);
    }
  };

  // ── 누적 인터뷰 패턴 분석 ──
  const handleAnalyzePatterns = async () => {
    if (interviews.length < 3) {
      setAnalysisError(ko ? "분석에는 최소 3건의 인터뷰가 필요합니다" : "At least 3 interviews needed");
      return;
    }
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error(ko ? "로그인이 필요합니다" : "Sign in required");

      const combinedNotes = interviews
        .slice(0, 30)  // 최근 30건만 분석 (토큰 절약)
        .map((iv) => `[${TYPE_META[iv.type].ko}${iv.customerName ? ` · ${iv.customerName}` : ""}] ${iv.notes}`)
        .join("\n\n");

      const res = await fetch("/api/ai/interview/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          interviewNotes: combinedNotes,
          industryCategoryId: industryCategoryId ?? "general",
          language: ko ? "ko" : "en",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setPatternAnalysis({
        generatedAt: new Date().toISOString(),
        interviewCount: interviews.length,
        topPainPoints: Array.isArray(data?.topPainPoints) ? data.topPainPoints : Array.isArray(data?.painPoints) ? data.painPoints : [],
        topMotivations: Array.isArray(data?.topMotivations) ? data.topMotivations : Array.isArray(data?.motivations) ? data.motivations : [],
        segments: Array.isArray(data?.segments) ? data.segments : [],
        recommendations: Array.isArray(data?.recommendations) ? data.recommendations : Array.isArray(data?.actions) ? data.actions : [],
      });
      setTab("insight");
    } catch (err) {
      console.error("[CustomerInterview] analyze error:", err);
      setAnalysisError(err instanceof Error ? err.message : String(err));
    } finally {
      setAnalysisLoading(false);
    }
  };

  // ── 새 인터뷰 저장 ──
  const handleAddInterview = () => {
    if (!newNotes.trim()) return;
    addInterview({
      type: newType,
      customerName: newName.trim() || undefined,
      notes: newNotes.trim(),
    });
    setNewName("");
    setNewNotes("");
  };

  /**
   * Google Sheets 공개 CSV URL → 인터뷰 응답 자동 임포트.
   *
   * 사장님 흐름:
   *   1. Google Forms 응답 → Google Sheets 자동 저장
   *   2. Sheets 메뉴 → "파일 → 공유 → 웹에 게시" → CSV 형식 → 게시 → 링크 복사
   *   3. build.up 에 그 URL 붙여넣고 "결과 가져오기" → 각 응답이 인터뷰 1건으로 저장
   *
   * 파싱 규칙:
   *   - 첫 행 = 헤더 (질문 텍스트들)
   *   - 첫 컬럼 = "타임스탬프" (자동 추가) — 인터뷰 date 로 변환
   *   - 나머지 컬럼 = 각 질문의 답 → notes 에 "Q: ...\nA: ..." 형식으로 묶음
   *   - 직전에 가져온 행은 importedRowKey 로 중복 방지 (선택)
   */
  const handleImportFromSheet = async () => {
    const url = importUrl.trim();
    if (!url) return;
    setImportLoading(true);
    setImportMsg(null);
    try {
      // Google Sheets "웹에 게시" CSV URL 검증 (느슨한 체크)
      if (!/^https?:\/\//i.test(url)) {
        throw new Error(ko ? "https:// 로 시작하는 공개 CSV URL 을 붙여넣어 주세요." : "Paste an https:// public CSV URL.");
      }
      // CSV fetch (CORS 허용 — Google Sheets publish-to-web 은 CORS open)
      const res = await fetch(url, { method: "GET", cache: "no-store" });
      if (!res.ok) throw new Error(ko ? `가져오기 실패 (${res.status}). 시트가 '웹에 게시' 되어 있는지 확인해 주세요.` : `Fetch failed (${res.status}). Make sure the sheet is published to web.`);
      const text = await res.text();

      // 단순 CSV 파서 — 따옴표 안 콤마/줄바꿈 처리
      const rows: string[][] = [];
      let cur: string[] = [];
      let cell = "";
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
          if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
          else if (ch === '"') inQuotes = false;
          else cell += ch;
        } else {
          if (ch === '"') inQuotes = true;
          else if (ch === ",") { cur.push(cell); cell = ""; }
          else if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && text[i + 1] === "\n") i++;
            cur.push(cell); rows.push(cur); cur = []; cell = "";
          }
          else cell += ch;
        }
      }
      if (cell.length > 0 || cur.length > 0) { cur.push(cell); rows.push(cur); }

      if (rows.length < 2) throw new Error(ko ? "응답이 없습니다. 시트에 헤더 + 1개 이상의 응답이 필요합니다." : "No responses. Need header + at least 1 response row.");

      const header = rows[0];
      const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim().length > 0));
      if (dataRows.length === 0) throw new Error(ko ? "응답 행이 비어 있습니다." : "Response rows are empty.");

      // 각 응답 행을 인터뷰 1건으로 변환
      let added = 0;
      for (const row of dataRows) {
        const notesParts: string[] = [];
        // 첫 컬럼은 보통 Google Forms 자동 타임스탬프 — date 로 사용 (실패 시 today)
        const tsRaw = row[0]?.trim() ?? "";
        const tsDate = (() => {
          const d = new Date(tsRaw);
          return Number.isNaN(d.getTime()) ? new Date() : d;
        })();
        const dateStr = getKstDate(tsDate);

        for (let c = 1; c < header.length; c++) {
          const q = header[c]?.trim();
          const a = row[c]?.trim();
          if (q && a) notesParts.push(`Q: ${q}\nA: ${a}`);
        }
        if (notesParts.length === 0) continue;

        addInterview({
          type: importType,
          notes: notesParts.join("\n\n"),
          date: dateStr,
        });
        added++;
      }

      setImportMsg({
        kind: "ok",
        text: ko ? `${added}건의 응답을 가져왔습니다.` : `Imported ${added} responses.`,
      });
      setImportUrl("");
    } catch (err) {
      setImportMsg({
        kind: "err",
        text: err instanceof Error ? err.message : (ko ? "가져오기 실패" : "Import failed"),
      });
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <article style={card} className="bento-card">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={iconWrap}>
            <Users size={18} strokeWidth={1.8} color="#7c3aed" />
          </div>
          <div>
            <div style={eyebrow}>{ko ? "고객 인터뷰" : "Customer Interview"}</div>
            <div style={title}>
              {ko ? `누적 ${stats.total}건` : `${stats.total} interviews`}
              {stats.total > 0 && (
                <span style={{ marginLeft: "8px", fontSize: "12px", fontWeight: 500, color: "rgba(15,23,42,0.45)" }}>
                  · {(["regular", "new", "lapsed", "potential"] as CustomerInterviewType[])
                    .filter((t) => stats.byType[t] > 0)
                    .map((t) => `${TYPE_META[t][ko ? "ko" : "en"]} ${stats.byType[t]}`)
                    .join(" · ")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab toggle */}
      <div style={tabBar}>
        {(["log", "guide", "insight"] as const).map((t) => {
          const TabIcon: LucideIcon = t === "log" ? ClipboardList : t === "guide" ? MessageSquare : Sparkles;
          const tabLabel = t === "log"
            ? (ko ? `기록 ${stats.total}` : `Log ${stats.total}`)
            : t === "guide"
            ? (ko ? "질문지 만들기" : "Script")
            : (ko ? "AI 패턴 분석" : "AI Patterns");
          return (
            <button key={t} type="button" onClick={() => setTab(t)} style={{ ...tabBtn, ...(tab === t ? tabBtnActive : {}), display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <TabIcon size={12.5} strokeWidth={1.5} />
              {tabLabel}
            </button>
          );
        })}
      </div>

      {/* ── LOG TAB ── */}
      {tab === "log" && (
        <>
          {/* 새 인터뷰 입력 */}
          <div style={inputBox}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
              {(Object.keys(TYPE_META) as CustomerInterviewType[]).map((t) => {
                const meta = TYPE_META[t];
                const isActive = newType === t;
                return (
                  <button key={t} type="button" onClick={() => setNewType(t)} style={{
                    fontSize: "11.5px", fontWeight: 650, padding: "5px 11px", borderRadius: "999px",
                    border: `1px solid ${isActive ? meta.color : "rgba(15,23,42,0.08)"}`,
                    background: isActive ? meta.bg : "transparent",
                    color: isActive ? meta.color : "rgba(15,23,42,0.55)",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}>
                    {meta[ko ? "ko" : "en"]}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder={ko ? "손님 이름 (선택)" : "Customer name (optional)"}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={inputStyle}
            />
            <textarea
              placeholder={ko
                ? "예: '점심 시간에 와서 분식이 빨리 나와서 좋다. 다만 결제할 때 줄이 길다. 친구에게 추천했다.' — Mom Test 원칙: 의견이 아닌 행동·사실 위주로"
                : "Past behavior, not opinions. e.g., 'Came at lunch, quick food. Long checkout line. Recommended to a friend.'"}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={3}
              style={{ ...inputStyle, minHeight: "70px", resize: "vertical" as const, fontFamily: "inherit", lineHeight: 1.55 }}
            />
            <button
              type="button"
              onClick={handleAddInterview}
              disabled={!newNotes.trim()}
              style={{
                padding: "9px 14px", borderRadius: "10px", border: "none", cursor: newNotes.trim() ? "pointer" : "default",
                background: newNotes.trim() ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" : "rgba(25,25,112,0.05)",
                color: newNotes.trim() ? "#fff" : "rgba(15,23,42,0.3)",
                fontSize: "13px", fontWeight: 650, letterSpacing: "-0.01em",
                display: "inline-flex", alignItems: "center", gap: "5px",
                boxShadow: newNotes.trim() ? "0 4px 12px rgba(124,58,237,0.18)" : "none",
              }}
            >
              <Plus size={13} strokeWidth={2.2} />
              {ko ? "기록 추가" : "Add note"}
            </button>
          </div>

          {/* ─── Google Sheets 응답 자동 임포트 ─── */}
          <details style={{
            padding: "10px 12px",
            borderRadius: "12px",
            border: "1px dashed rgba(13,148,136,0.3)",
            background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(13,148,136,0.02) 100%)",
          }}>
            <summary style={{
              cursor: "pointer", listStyle: "none",
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "12px", fontWeight: 700, color: "#0d9488",
              letterSpacing: "-0.005em",
            }}>
              <Download size={13} strokeWidth={1.5} />
              <span>{ko ? "구글 폼 응답 자동 가져오기" : "Auto-import Google Form responses"}</span>
              <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10.5px", fontWeight: 600, color: "rgba(15,23,42,0.42)" }}>
                <span>{ko ? "펼치기" : "Expand"}</span>
                <ChevronDown size={11} strokeWidth={2.2} />
              </span>
            </summary>
            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.62)", lineHeight: 1.55 }}>
                {ko ? (
                  <>
                    <div style={{ fontWeight: 700, color: "rgba(15,23,42,0.78)", marginBottom: "3px" }}>준비 (한 번만):</div>
                    <div>① 응답 시트 → <strong>파일 → 공유 → 웹에 게시</strong></div>
                    <div>② <strong>CSV 형식</strong> 선택 → 게시 → 링크 복사</div>
                    <div>③ 아래에 붙여넣고 가져오기 클릭 (이후 응답 추가 시마다 다시 가져오기)</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, color: "rgba(15,23,42,0.78)", marginBottom: "3px" }}>Setup (once):</div>
                    <div>① Sheet → <strong>File → Share → Publish to web</strong></div>
                    <div>② Choose <strong>CSV</strong> → Publish → Copy link</div>
                    <div>③ Paste below + click Import (re-import for new responses)</div>
                  </>
                )}
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                {(Object.keys(TYPE_META) as CustomerInterviewType[]).map((t) => {
                  const meta = TYPE_META[t];
                  const isActive = importType === t;
                  return (
                    <button key={t} type="button" onClick={() => setImportType(t)} style={{
                      fontSize: "11px", fontWeight: 650, padding: "4px 10px", borderRadius: "999px",
                      border: `1px solid ${isActive ? meta.color : "rgba(15,23,42,0.08)"}`,
                      background: isActive ? meta.bg : "#fff",
                      color: isActive ? meta.color : "rgba(15,23,42,0.55)",
                      cursor: "pointer",
                    }}>
                      {meta[ko ? "ko" : "en"]}
                    </button>
                  );
                })}
              </div>

              <input
                type="url"
                placeholder={ko ? "구글 시트 게시 CSV URL 붙여넣기 (https://...)" : "Paste Google Sheets published CSV URL"}
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                style={{
                  ...inputStyle,
                  fontSize: "12px",
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                }}
              />

              <button
                type="button"
                onClick={handleImportFromSheet}
                disabled={importLoading || !importUrl.trim()}
                style={{
                  padding: "9px 14px", borderRadius: "10px", border: "none",
                  cursor: importLoading || !importUrl.trim() ? "default" : "pointer",
                  background: importUrl.trim() && !importLoading
                    ? "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)"
                    : "rgba(25,25,112,0.05)",
                  color: importUrl.trim() && !importLoading ? "#fff" : "rgba(15,23,42,0.3)",
                  fontSize: "13px", fontWeight: 650, letterSpacing: "-0.01em",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px",
                  boxShadow: importUrl.trim() && !importLoading ? "0 4px 12px rgba(13,148,136,0.18)" : "none",
                }}
              >
                {importLoading ? <Loader2 size={13} className="spin" /> : <Download size={13} strokeWidth={2.2} />}
                {ko ? "결과 가져오기" : "Import responses"}
              </button>

              {importMsg && (
                <div style={{
                  padding: "8px 11px", borderRadius: "9px",
                  background: importMsg.kind === "ok" ? "rgba(5,150,105,0.08)" : "rgba(220,38,38,0.06)",
                  border: `1px solid ${importMsg.kind === "ok" ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.18)"}`,
                  color: importMsg.kind === "ok" ? "#059669" : "#b91c1c",
                  fontSize: "11.5px", fontWeight: 600, lineHeight: 1.5,
                  display: "flex", alignItems: "center", gap: "6px",
                }}>
                  {importMsg.kind === "ok"
                    ? <Check size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    : <AlertCircle size={13} strokeWidth={1.5} style={{ flexShrink: 0 }} />}
                  <span>{importMsg.text}</span>
                </div>
              )}
            </div>
          </details>

          {/* 누적 인터뷰 리스트 */}
          {interviews.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "280px", overflowY: "auto" as const }}>
              {interviews.slice(0, 20).map((iv) => {
                const meta = TYPE_META[iv.type];
                return (
                  <div key={iv.id} style={interviewItemStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px", background: meta.bg, color: meta.color }}>
                        {meta[ko ? "ko" : "en"]}
                      </span>
                      {iv.customerName && (
                        <span style={{ fontSize: "12px", fontWeight: 650, color: "#0f172a" }}>{iv.customerName}</span>
                      )}
                      <span style={{ fontSize: "10.5px", color: "rgba(15,23,42,0.4)", marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
                        {iv.date.slice(5).replace("-", "/")}
                      </span>
                      <button type="button" onClick={() => removeInterview(iv.id)} style={removeBtn} title={ko ? "삭제" : "Delete"}>
                        <X size={11} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.5, whiteSpace: "pre-wrap" as const }}>
                      {iv.notes}
                    </div>
                  </div>
                );
              })}
              {interviews.length > 20 && (
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", textAlign: "center" as const, padding: "6px" }}>
                  + {interviews.length - 20}{ko ? "건 더 있음" : " more"}
                </div>
              )}
            </div>
          ) : (
            <div style={emptyHint}>
              {ko ? "첫 단골과 대화하고 기록을 남겨보세요. 5건만 쌓여도 패턴이 보입니다." : "Start by talking to a regular. Patterns emerge after just 5 notes."}
            </div>
          )}

          {/* AI 분석 트리거 — 결과 4가지 미리보기 포함 */}
          {interviews.length >= 3 && (
            <div style={{
              display: "flex", flexDirection: "column", gap: "10px",
              padding: "12px 14px",
              borderRadius: "14px",
              border: "1px solid rgba(124,58,237,0.18)",
              background: "linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(168,85,247,0.025) 100%)",
            }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#7c3aed", letterSpacing: "-0.005em" }}>
                {ko ? `AI 패턴 분석 — 누적 ${interviews.length}건 묶어서 한 번에` : `AI Pattern Analysis — ${interviews.length} interviews together`}
              </div>
              <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
                {ko
                  ? "AI가 인터뷰들을 한꺼번에 읽고 ① 공통 페인 포인트 ② 재방문 동기 ③ 고객 세그먼트 ④ 추천 액션 4가지를 뽑아드려요."
                  : "AI reads all your notes together and extracts ① common pain points ② return motivations ③ customer segments ④ recommended actions."}
              </div>
              <button
                type="button"
                onClick={handleAnalyzePatterns}
                disabled={analysisLoading}
                style={{
                  padding: "10px 14px", borderRadius: "10px", border: "none",
                  background: analysisLoading
                    ? "rgba(124,58,237,0.5)"
                    : "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                  cursor: analysisLoading ? "default" : "pointer",
                  fontSize: "13px", fontWeight: 650, color: "#fff",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  letterSpacing: "-0.005em",
                  boxShadow: analysisLoading ? "none" : "0 4px 12px rgba(124,58,237,0.22)",
                }}
              >
                {analysisLoading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} strokeWidth={1.5} />}
                {ko ? "패턴 분석 실행" : "Run pattern analysis"}
              </button>
            </div>
          )}
          {analysisError && (
            <div style={errorHint}>{analysisError}</div>
          )}
        </>
      )}

      {/* ── GUIDE TAB — AI 인터뷰 질문지 생성 ── */}
      {tab === "guide" && (
        <>
          <div style={hintBox}>
            <Lightbulb size={14} strokeWidth={1.8} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.55 }}>
              {ko ? "Mom Test 원칙: 손님에게 의견을 묻지 말고, 과거 행동을 물으세요. \"맛있어요?\"는 데이터가 아닙니다. \"최근에 어디 가셨어요?\"가 데이터입니다." : "Mom Test: Ask about past behavior, not opinions. 'Is it good?' is not data. 'Where else did you go recently?' is."}
            </div>
          </div>

          {/* ─── 검증된 템플릿 라이브러리 (AI 호출 X — 즉시 사용) ─── */}
          {(() => {
            const filteredTemplates = INTERVIEW_TEMPLATES.filter((t) => t.target === guideTargetType);
            if (filteredTemplates.length === 0) return null;

            // source 별 색상 — UI 배지
            const sourceColor: Record<InterviewTemplate["source"], string> = {
              "Mom Test": "#d97706",
              "Sean Ellis (PMF)": "#7c3aed",
              "JTBD": "#0891b2",
              "NPS": "#059669",
              "CSAT": "#191970",
              "YC": "#ea580c",
              "build.up": "#191970",
            };

            return (
              <div style={{
                display: "flex", flexDirection: "column", gap: "8px",
                padding: "12px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(45,212,191,0.04) 0%, rgba(13,148,136,0.02) 100%)",
                border: "1px solid rgba(13,148,136,0.14)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <BookOpen size={13} strokeWidth={1.5} color="#0d9488" />
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#0d9488", letterSpacing: "-0.005em" }}>
                    {ko ? `검증된 템플릿 (${filteredTemplates.length}개)` : `Proven templates (${filteredTemplates.length})`}
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.45)", letterSpacing: "0.02em" }}>
                    {ko ? "AI 호출 X · 즉시 사용" : "No AI · instant"}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {filteredTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setGeneratedScript(ko ? tpl.questionsKo : tpl.questionsEn);
                        setScriptError(null);
                      }}
                      title={ko ? tpl.whenToUseKo : tpl.whenToUseEn}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "1px solid rgba(15,23,42,0.08)",
                        background: "#fff",
                        cursor: "pointer",
                        textAlign: "left" as const,
                        transition: "transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(13,148,136,0.4)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(13,148,136,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(15,23,42,0.08)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                        <div style={{ fontSize: "13px", fontWeight: 650, color: "#0f172a", lineHeight: 1.35, flex: 1 }}>
                          {ko ? tpl.labelKo : tpl.labelEn}
                        </div>
                        <span style={{
                          fontSize: "9.5px", fontWeight: 700,
                          padding: "2px 7px", borderRadius: "999px",
                          background: `${sourceColor[tpl.source]}14`,
                          color: sourceColor[tpl.source],
                          letterSpacing: "0.01em",
                          flexShrink: 0,
                        }}>
                          {tpl.source}
                        </span>
                        <span style={{
                          fontSize: "10px", fontWeight: 600,
                          color: "rgba(15,23,42,0.4)",
                          flexShrink: 0,
                        }}>
                          {(ko ? tpl.questionsKo : tpl.questionsEn).length}{ko ? "문항" : "q"}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.55)", lineHeight: 1.4 }}>
                        {ko ? tpl.descriptionKo : tpl.descriptionEn}
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", fontSize: "10.5px", color: "rgba(15,23,42,0.5)", marginTop: "2px", lineHeight: 1.45, alignSelf: "center" }}>
                  <ChevronUp size={11} strokeWidth={1.5} />
                  <span>{ko
                    ? "클릭만 하면 질문이 채워져요. 직접 편집·복사·폼 발송 가능."
                    : "Click to load questions. Edit, copy, send via forms."}</span>
                </div>
              </div>
            );
          })()}
          <div style={inputBox}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
              {(Object.keys(TYPE_META) as CustomerInterviewType[]).map((t) => {
                const meta = TYPE_META[t];
                const isActive = guideTargetType === t;
                return (
                  <button key={t} type="button" onClick={() => setGuideTargetType(t)} style={{
                    fontSize: "11.5px", fontWeight: 650, padding: "5px 11px", borderRadius: "999px",
                    border: `1px solid ${isActive ? meta.color : "rgba(15,23,42,0.08)"}`,
                    background: isActive ? meta.bg : "transparent",
                    color: isActive ? meta.color : "rgba(15,23,42,0.55)",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}>
                    {meta[ko ? "ko" : "en"]}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder={ko ? "예: 왜 우리 가게에 자주 오는지, 무엇이 불편한지 알고 싶음" : "e.g., why they keep coming, what bothers them"}
              value={guideTopic}
              onChange={(e) => setGuideTopic(e.target.value)}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={handleGenerateScript}
              disabled={scriptLoading || !guideTopic.trim()}
              style={{
                padding: "9px 14px", borderRadius: "10px", border: "none",
                cursor: scriptLoading || !guideTopic.trim() ? "default" : "pointer",
                background: guideTopic.trim() && !scriptLoading
                  ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
                  : "rgba(25,25,112,0.05)",
                color: guideTopic.trim() && !scriptLoading ? "#fff" : "rgba(15,23,42,0.3)",
                fontSize: "13px", fontWeight: 650,
                display: "inline-flex", alignItems: "center", gap: "5px",
              }}
            >
              {scriptLoading ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} strokeWidth={1.5} />}
              {ko ? "AI 질문지 생성" : "Generate script"}
            </button>
            {scriptError && <div style={errorHint}>{scriptError}</div>}
          </div>

          {generatedScript.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {generatedScript.map((q, i) => (
                <div key={i} style={questionItemStyle}>
                  <span style={questionNum}>{i + 1}</span>
                  <span style={{ fontSize: "13px", color: "#0f172a", lineHeight: 1.5 }}>{q}</span>
                </div>
              ))}
            </div>
          )}

          {/* ─── 외부 폼 발송 도구 — 질문지 생성 후에만 노출 ─── */}
          {generatedScript.length > 0 && (() => {
            const targetTypeLabel = TYPE_META[guideTargetType][ko ? "ko" : "en"];
            // 클립보드용 — 번호 매긴 일반 텍스트 (구글/네이버 폼 붙여넣기에 최적)
            const questionsText = generatedScript.map((q, i) => `${i + 1}. ${q}`).join("\n");
            // 카카오톡 등 메시지 발송용 — 인사말 + 질문 + 마무리
            const introText = ko
              ? `안녕하세요, [매장명] 입니다 🙏\n\n${targetTypeLabel} 손님께만 드리는 짧은 설문이에요. 솔직한 답변은 가게 개선에 큰 도움이 됩니다.\n\n${questionsText}\n\n감사합니다 — [매장명] 드림`
              : `Hi, this is [Shop Name] 🙏\n\nA short survey just for our ${targetTypeLabel.toLowerCase()} customers. Your honest answers help us improve.\n\n${questionsText}\n\nThank you — [Shop Name]`;

            const copy = async (text: string, key: "questions" | "intro") => {
              try {
                await navigator.clipboard.writeText(text);
                setCopyFeedback(key);
                window.setTimeout(() => setCopyFeedback((v) => (v === key ? null : v)), 1800);
              } catch {
                // 폴백 — 구형 브라우저
                const ta = document.createElement("textarea");
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
                setCopyFeedback(key);
                window.setTimeout(() => setCopyFeedback((v) => (v === key ? null : v)), 1800);
              }
            };

            const linkBtnStyle: React.CSSProperties = {
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "9px 13px", borderRadius: "10px",
              border: "1px solid rgba(15,23,42,0.1)",
              background: "#fff",
              color: "rgba(15,23,42,0.78)",
              fontSize: "12.5px", fontWeight: 650,
              cursor: "pointer", textDecoration: "none",
              transition: "transform 0.15s ease, border-color 0.15s ease",
            };

            return (
              <div style={{
                marginTop: "10px",
                padding: "14px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(168,85,247,0.02) 100%)",
                border: "1px solid rgba(124,58,237,0.12)",
                display: "flex", flexDirection: "column", gap: "10px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Share2 size={13} strokeWidth={1.5} color="#7c3aed" />
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#7c3aed", letterSpacing: "-0.005em" }}>
                    {ko ? "이제 질문을 손님께 보내세요" : "Now send to customers"}
                  </div>
                </div>

                <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>
                  {ko
                    ? "복사해서 구글 폼·네이버 폼에 붙여넣고, 카카오톡으로 단골에게 폼 링크를 보내세요. 보통 10명 응답이면 패턴이 보입니다."
                    : "Copy and paste into Google/Naver Forms, then share the link via KakaoTalk to regulars. ~10 replies usually surface a pattern."}
                </div>

                {/* 복사 버튼 2개 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => copy(questionsText, "questions")}
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      padding: "10px 14px", borderRadius: "10px",
                      border: "none",
                      background: copyFeedback === "questions"
                        ? "linear-gradient(135deg, #059669 0%, #34d399 100%)"
                        : "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                      color: "#fff",
                      fontSize: "13px", fontWeight: 650,
                      cursor: "pointer",
                      letterSpacing: "-0.005em",
                      transition: "background 0.2s ease",
                    }}
                  >
                    {copyFeedback === "questions" ? (
                      <><Check size={13} strokeWidth={2.5} /> {ko ? "복사됨!" : "Copied!"}</>
                    ) : (
                      <><Copy size={13} strokeWidth={1.5} /> {ko ? "질문만 복사 (폼 붙여넣기용)" : "Copy questions (for forms)"}</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(introText, "intro")}
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      padding: "9px 14px", borderRadius: "10px",
                      border: "1px solid rgba(124,58,237,0.25)",
                      background: copyFeedback === "intro" ? "rgba(5,150,105,0.08)" : "transparent",
                      color: copyFeedback === "intro" ? "#059669" : "#7c3aed",
                      fontSize: "12.5px", fontWeight: 600,
                      cursor: "pointer",
                      letterSpacing: "-0.005em",
                      transition: "background 0.2s ease, color 0.2s ease",
                    }}
                  >
                    {copyFeedback === "intro" ? (
                      <><Check size={12} strokeWidth={2.5} /> {ko ? "복사됨!" : "Copied!"}</>
                    ) : (
                      <><Copy size={12} strokeWidth={1.5} /> {ko ? "인사말 + 질문 묶음 복사 (카톡용)" : "Copy intro + questions (KakaoTalk)"}</>
                    )}
                  </button>
                </div>

                {/* 외부 폼 도구 바로가기 */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px",
                }}>
                  <a
                    href="https://docs.google.com/forms/u/0/create"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkBtnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4285F4"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(15,23,42,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <span style={{
                      width: 16, height: 16, borderRadius: 4, background: "#673ab7",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 10, fontWeight: 800, fontFamily: "Roboto, Arial, sans-serif",
                    }}>F</span>
                    <span>{ko ? "구글 폼 만들기" : "Open Google Forms"}</span>
                    <ExternalLink size={11} strokeWidth={1.5} style={{ marginLeft: "auto", opacity: 0.5 }} />
                  </a>
                  <a
                    href="https://office.naver.com/forms/create"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkBtnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#03c75a"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(15,23,42,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <span style={{
                      width: 16, height: 16, borderRadius: 4, background: "#03c75a",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 11, fontWeight: 800, fontFamily: "Pretendard, sans-serif",
                    }}>N</span>
                    <span>{ko ? "네이버 폼 만들기" : "Open Naver Forms"}</span>
                    <ExternalLink size={11} strokeWidth={1.5} style={{ marginLeft: "auto", opacity: 0.5 }} />
                  </a>
                </div>

                {/* 짧은 사용 흐름 안내 */}
                <div style={{
                  marginTop: "2px",
                  padding: "9px 11px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.55)",
                  border: "0.5px dashed rgba(124,58,237,0.2)",
                  fontSize: "11px", color: "rgba(15,23,42,0.62)", lineHeight: 1.55,
                }}>
                  {ko ? (
                    <>
                      <div style={{ fontWeight: 700, color: "rgba(15,23,42,0.8)", marginBottom: "2px" }}>활용 흐름 3단계</div>
                      <div>① <strong>질문 복사</strong> → 폼에 붙여넣기 (각 질문 = 단답형/장문형)</div>
                      <div>② 폼 <strong>공유 링크</strong> 받기 → 카카오톡으로 단골에게 발송</div>
                      <div>③ 응답 10건+ 모이면 <strong>인터뷰 기록 탭</strong>에 핵심 발견 입력 → AI 패턴 분석</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 700, color: "rgba(15,23,42,0.8)", marginBottom: "2px" }}>3-step flow</div>
                      <div>① <strong>Copy questions</strong> → paste into form (each = short/long answer)</div>
                      <div>② Get <strong>share link</strong> → send via KakaoTalk to regulars</div>
                      <div>③ With 10+ replies → log key findings in <strong>Log tab</strong> → AI pattern analysis</div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* ── INSIGHT TAB — AI 패턴 분석 결과 ── */}
      {tab === "insight" && (
        <>
          {patternAnalysis ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* 결과 화면 상단에도 한 줄 안내 — "이 결과가 무엇인지" */}
              <div style={{
                padding: "9px 12px",
                borderRadius: "10px",
                background: "rgba(124,58,237,0.05)",
                border: "0.5px solid rgba(124,58,237,0.12)",
                fontSize: "11.5px", color: "rgba(15,23,42,0.65)", lineHeight: 1.5,
              }}>
                {ko
                  ? "AI 가 누적 인터뷰들을 한 번에 읽고 뽑은 4가지 발견입니다 — 공통 불편·재방문 동기·고객 그룹·실행 액션."
                  : "Four findings AI extracted by reading all interviews together — common pains, return motivations, customer groups, action items."}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
                <MessageCircle size={11} strokeWidth={1.8} />
                {ko
                  ? `${patternAnalysis.interviewCount}건 분석 · ${patternAnalysis.generatedAt.slice(0, 10)}`
                  : `${patternAnalysis.interviewCount} interviews · ${patternAnalysis.generatedAt.slice(0, 10)}`}
              </div>
              {patternAnalysis.topPainPoints.length > 0 && (
                <InsightSection
                  title={ko ? "자주 언급된 페인 포인트" : "Top pain points"}
                  items={patternAnalysis.topPainPoints}
                  color="#dc2626"
                  Icon={AlertCircle}
                />
              )}
              {patternAnalysis.topMotivations.length > 0 && (
                <InsightSection
                  title={ko ? "재방문 동기" : "Motivations to return"}
                  items={patternAnalysis.topMotivations}
                  color="#059669"
                  Icon={Heart}
                />
              )}
              {patternAnalysis.segments.length > 0 && (
                <InsightSection
                  title={ko ? "발견된 고객 세그먼트" : "Customer segments"}
                  items={patternAnalysis.segments}
                  color="#191970"
                  Icon={Users}
                />
              )}
              {patternAnalysis.recommendations.length > 0 && (
                <InsightSection
                  title={ko ? "추천 액션" : "Recommended actions"}
                  items={patternAnalysis.recommendations}
                  color="#7c3aed"
                  Icon={Lightbulb}
                />
              )}
            </div>
          ) : (
            /* 빈 상태 — "이 기능이 무엇을 분석해드리는지" 4가지 명확하게 미리보기 */
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{
                padding: "12px 14px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(168,85,247,0.03) 100%)",
                border: "1px solid rgba(124,58,237,0.16)",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  fontSize: "12px", fontWeight: 700, color: "#7c3aed",
                  marginBottom: "4px", letterSpacing: "-0.005em",
                }}>
                  <Sparkles size={13} strokeWidth={1.5} />
                  <span>{ko ? "AI 패턴 분석이란?" : "What is AI Pattern Analysis?"}</span>
                </div>
                <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>
                  {ko
                    ? "기록 탭에 모은 인터뷰들을 AI가 한꺼번에 읽고, 손님들의 공통 패턴과 사장님이 취해야 할 액션을 자동으로 정리해드려요. 한 명씩 따로 보면 안 보이는 큰 그림이 보입니다."
                    : "AI reads all the interviews you've logged together, then extracts common patterns and recommends actions. Reveals the bigger picture invisible from individual notes."}
                </div>
              </div>

              {/* 4가지 결과 미리보기 카드 */}
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(15,23,42,0.45)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                {ko ? "분석되는 4가지 결과" : "4 outputs"}
              </div>
              {([
                { Icon: AlertCircle, color: "#dc2626", titleKo: "자주 언급된 페인 포인트", titleEn: "Top pain points",
                  exampleKo: "예: '결제 줄이 항상 길다', '주차장 좁다'", exampleEn: "e.g., 'checkout lines always long', 'parking is tight'" },
                { Icon: Heart, color: "#059669", titleKo: "재방문 동기", titleEn: "Return motivations",
                  exampleKo: "예: '맛 일관됨', '사장 친절', '가격 합리적'", exampleEn: "e.g., 'consistent taste', 'kind staff', 'fair price'" },
                { Icon: Users, color: "#191970", titleKo: "발견된 고객 세그먼트", titleEn: "Customer segments",
                  exampleKo: "예: '점심 직장인', '주말 가족', '저녁 술안주'", exampleEn: "e.g., 'lunch workers', 'weekend families', 'late-night drinkers'" },
                { Icon: Lightbulb, color: "#7c3aed", titleKo: "추천 액션 3-5개", titleEn: "3-5 recommended actions",
                  exampleKo: "예: '셀프 키오스크 도입', '주말 가족 메뉴 출시'", exampleEn: "e.g., 'add self-kiosk', 'launch weekend family menu'" },
              ] as const).map((p, i) => (
                <div key={i} style={{
                  display: "flex", gap: "10px", padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.6)",
                  border: "0.5px solid rgba(15,23,42,0.06)",
                }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "8px",
                    background: `${p.color}14`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: p.color, flexShrink: 0,
                  }}>
                    <p.Icon size={14} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 650, color: p.color, letterSpacing: "-0.005em" }}>
                      {ko ? p.titleKo : p.titleEn}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.55)", marginTop: "2px", lineHeight: 1.45 }}>
                      {ko ? p.exampleKo : p.exampleEn}
                    </div>
                  </div>
                </div>
              ))}

              {/* 사용 조건 안내 */}
              <div style={{
                padding: "10px 12px",
                borderRadius: "10px",
                background: interviews.length >= 3 ? "rgba(5,150,105,0.05)" : "rgba(217,119,6,0.05)",
                border: `0.5px solid ${interviews.length >= 3 ? "rgba(5,150,105,0.18)" : "rgba(217,119,6,0.2)"}`,
                fontSize: "11.5px", color: interviews.length >= 3 ? "#047857" : "#92400e",
                lineHeight: 1.5,
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                {interviews.length < 3 ? (
                  <>
                    <Lock size={13} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                    <span>{ko
                      ? `최소 3건의 인터뷰 기록이 필요합니다. (현재 ${interviews.length}건 — ${3 - interviews.length}건 더 필요)`
                      : `Need at least 3 interviews. (current ${interviews.length} — ${3 - interviews.length} more)`}</span>
                  </>
                ) : (
                  <>
                    <Check size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    <span>{ko
                      ? `${interviews.length}건 누적됨. '기록' 탭에서 [패턴 분석 실행] 버튼을 눌러보세요.`
                      : `${interviews.length} interviews ready. Click [Run pattern analysis] on the Log tab.`}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}

function InsightSection({ title, items, color, Icon }: { title: string; items: string[]; color: string; Icon: LucideIcon }) {
  return (
    <div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
        <span style={{
          width: "20px", height: "20px", borderRadius: "6px",
          background: `${color}14`,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color, flexShrink: 0,
        }}>
          <Icon size={11.5} strokeWidth={2.2} />
        </span>
        <span style={{ fontSize: "11.5px", fontWeight: 700, color, letterSpacing: "-0.005em" }}>{title}</span>
      </div>
      <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {items.map((it, i) => (
          <li key={i} style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────

const card: React.CSSProperties = {
  borderRadius: "20px",
  border: "1px solid rgba(124,58,237,0.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(124,58,237,0.015) 100%)",
  padding: "18px 22px",
  display: "grid",
  gap: "12px",
};

const iconWrap: React.CSSProperties = {
  width: "36px", height: "36px", borderRadius: "11px",
  background: "rgba(124,58,237,0.08)",
  border: "1px solid rgba(124,58,237,0.12)",
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0,
};

const eyebrow: React.CSSProperties = {
  fontSize: "10.5px", fontWeight: 700, color: "#7c3aed",
  letterSpacing: "0.07em", textTransform: "uppercase",
};

const title: React.CSSProperties = {
  fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a",
  marginTop: "2px",
};

const tabBar: React.CSSProperties = {
  display: "flex", gap: "4px",
  background: "rgba(25,25,112,0.035)",
  borderRadius: "10px", padding: "3px",
};

const tabBtn: React.CSSProperties = {
  flex: 1, padding: "7px 10px", borderRadius: "8px", border: "none", cursor: "pointer",
  fontSize: "12px", fontWeight: 650,
  background: "transparent",
  color: "rgba(15,23,42,0.45)",
  transition: "all 0.15s ease",
};

const tabBtnActive: React.CSSProperties = {
  background: "#fff",
  color: "#0f172a",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

const inputBox: React.CSSProperties = {
  padding: "12px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(124,58,237,0.08)",
  display: "flex", flexDirection: "column", gap: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px", borderRadius: "9px",
  border: "1px solid rgba(15,23,42,0.08)",
  background: "#fff",
  fontSize: "13px", fontWeight: 500,
  outline: "none", color: "#0f172a",
};

const hintBox: React.CSSProperties = {
  display: "flex", gap: "8px", padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(217,119,6,0.04)",
  border: "0.5px solid rgba(217,119,6,0.1)",
};

const interviewItemStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(25,25,112,0.025)",
  border: "1px solid rgba(15,23,42,0.04)",
};

const questionItemStyle: React.CSSProperties = {
  display: "flex", gap: "10px", padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(124,58,237,0.04)",
  border: "1px solid rgba(124,58,237,0.08)",
};

const questionNum: React.CSSProperties = {
  width: "20px", height: "20px", borderRadius: "50%",
  background: "#7c3aed", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "11px", fontWeight: 700, flexShrink: 0,
};

const removeBtn: React.CSSProperties = {
  width: "20px", height: "20px", borderRadius: "5px", border: "none",
  background: "transparent", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "rgba(15,23,42,0.35)",
};

const emptyHint: React.CSSProperties = {
  padding: "14px",
  borderRadius: "10px",
  background: "rgba(124,58,237,0.03)",
  fontSize: "12px",
  color: "rgba(15,23,42,0.5)",
  lineHeight: 1.55,
  textAlign: "center",
};

const errorHint: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: "8px",
  background: "rgba(220,38,38,0.05)",
  fontSize: "11.5px",
  color: "#dc2626",
  lineHeight: 1.4,
};

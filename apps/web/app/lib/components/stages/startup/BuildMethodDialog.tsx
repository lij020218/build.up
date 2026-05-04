"use client";

/**
 * BuildMethodDialog — task 별 여러 빌드 방법을 풍부하게 보여주는 풀스크린 모달.
 *
 * framer-motion 으로 부드러운 진입·퇴장.
 * 미드나이트 블루 통일 디자인.
 *
 * 사용:
 *   const [taskId, setTaskId] = useState<string | null>(null);
 *   <button onClick={() => setTaskId("mvp-coding")}>방법 자세히 보기</button>
 *   <BuildMethodDialog taskId={taskId} onClose={() => setTaskId(null)} />
 */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, DollarSign, ExternalLink, Check, AlertCircle, ChevronRight, Wrench, Sparkles, Lightbulb } from "lucide-react";
import { getBuildTask, type BuildMethod } from "./build-method-data";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.08)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.18)";

const DIFFICULTY_COLOR: Record<string, string> = {
  "초급": "#059669",
  "중급": "#d97706",
  "고급": "#dc2626",
};

export type BuildMethodDialogProps = {
  taskId: string | null;
  onClose: () => void;
};

export function BuildMethodDialog({ taskId, onClose }: BuildMethodDialogProps) {
  const task = taskId ? getBuildTask(taskId) : undefined;
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // SSR 안전 — 클라이언트에서만 portal 사용
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (task && task.methods.length > 0) {
      setSelectedMethodId(task.methods[0]?.id ?? null);
    }
  }, [task]);

  // ESC 키로 닫기 + body scroll lock
  useEffect(() => {
    if (!taskId) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [taskId, onClose]);

  const selectedMethod = task?.methods.find((m) => m.id === selectedMethodId);

  // ── React Portal 로 document.body 에 직접 렌더링 ──────────────────────
  //  이렇게 해야 부모의 stacking context (transform·filter·will-change) 에
  //  갇히지 않고 진짜 풀스크린 backdrop blur 가 모든 요소 위에 깔린다.
  if (!mounted) return null;

  const dialogContent = (
    <AnimatePresence>
      {taskId && task && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)", // Safari
            zIndex: 2147483647, // 최대 z-index — 어떤 fixed 요소도 위에 못 옴
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "1080px",
              maxHeight: "90vh",
              background: "white",
              borderRadius: "20px",
              boxShadow: "0 20px 60px rgba(25,25,112,0.35)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column" as const,
            }}
          >
            {/* ─── 헤더 ─── */}
            <div
              style={{
                padding: "20px 24px 16px",
                borderBottom: `1px solid ${MIDNIGHT_BORDER}`,
                background: `linear-gradient(135deg, ${MIDNIGHT}08 0%, white 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                flexShrink: 0,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <Sparkles size={14} strokeWidth={2.4} color={MIDNIGHT} />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: MIDNIGHT,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    빌드 방법 가이드 — {task.methods.length}가지 방법
                  </span>
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.015em", marginBottom: "4px" }}>
                  {task.name}
                </div>
                <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.65)", lineHeight: 1.5 }}>{task.intro}</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  border: "none",
                  background: "rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            {/* ─── 본문 (방법 선택 + 상세) ─── */}
            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", flex: 1, minHeight: 0 }}>
              {/* 좌측 — 방법 리스트 */}
              <div
                style={{
                  borderRight: `1px solid ${MIDNIGHT_BORDER}`,
                  background: "rgba(0,0,0,0.015)",
                  overflowY: "auto" as const,
                  padding: "12px 8px",
                }}
              >
                {task.methods.map((m, idx) => {
                  const active = m.id === selectedMethodId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethodId(m.id)}
                      style={{
                        width: "100%",
                        textAlign: "left" as const,
                        padding: "12px 14px",
                        marginBottom: "4px",
                        borderRadius: "10px",
                        border: "none",
                        background: active ? MIDNIGHT_SOFT : "transparent",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        flexDirection: "column" as const,
                        gap: "4px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 700,
                            color: active ? MIDNIGHT : "rgba(15,23,42,0.45)",
                            minWidth: "16px",
                          }}
                        >
                          {idx + 1}.
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: active ? 700 : 600,
                            color: active ? MIDNIGHT : "#0f172a",
                            letterSpacing: "-0.005em",
                            lineHeight: 1.35,
                            flex: 1,
                          }}
                        >
                          {m.name}
                        </span>
                        {active && <ChevronRight size={14} strokeWidth={2.4} color={MIDNIGHT} />}
                      </div>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" as const, paddingLeft: "20px" }}>
                        <span
                          style={{
                            fontSize: "9.5px",
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: "4px",
                            background: `${DIFFICULTY_COLOR[m.difficulty]}15`,
                            color: DIFFICULTY_COLOR[m.difficulty],
                            letterSpacing: "0.04em",
                          }}
                        >
                          {m.difficulty}
                        </span>
                        <span
                          style={{
                            fontSize: "9.5px",
                            fontWeight: 600,
                            padding: "1px 6px",
                            borderRadius: "4px",
                            background: "rgba(0,0,0,0.05)",
                            color: "rgba(15,23,42,0.55)",
                          }}
                        >
                          {m.timeEstimate.split(",")[0]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 우측 — 선택된 방법 상세 */}
              <div style={{ overflowY: "auto" as const, padding: "20px 24px" }}>
                {selectedMethod && <MethodDetail method={selectedMethod} />}
              </div>
            </div>

            {/* ─── 푸터 ─── */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: `1px solid ${MIDNIGHT_BORDER}`,
                background: "rgba(0,0,0,0.015)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11.5px",
                color: "rgba(15,23,42,0.55)",
                flexShrink: 0,
              }}
            >
              <span>ESC 또는 바깥 클릭으로 닫기</span>
              <span style={{ fontWeight: 600 }}>방법 {task.methods.length}개 · {task.id}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // document.body 에 직접 렌더 — 부모 stacking context 영향 X
  return createPortal(dialogContent, document.body);
}

/* ───────────────────────────────────────────────────────────────────
 * MethodDetail — 선택된 방법의 풀 디테일
 * ───────────────────────────────────────────────────────────────── */
function MethodDetail({ method }: { method: BuildMethod }) {
  return (
    <motion.div
      key={method.id}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* 방법 헤더 */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const, marginBottom: "6px" }}>
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: "6px",
              background: `${DIFFICULTY_COLOR[method.difficulty]}15`,
              color: DIFFICULTY_COLOR[method.difficulty],
              letterSpacing: "0.06em",
            }}
          >
            {method.difficulty}
          </span>
          <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)" }}>{method.bestFor}</span>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.015em", marginBottom: "6px" }}>
          {method.name}
        </h2>
        <p style={{ fontSize: "13.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, margin: 0 }}>{method.tagline}</p>
      </div>

      {/* 시간·비용 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
        <div style={{ padding: "10px 12px", borderRadius: "10px", background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
            <Clock size={11} strokeWidth={2.4} color={MIDNIGHT} />
            <span style={{ fontSize: "10px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em" }}>시간</span>
          </div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{method.timeEstimate}</div>
        </div>
        <div style={{ padding: "10px 12px", borderRadius: "10px", background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
            <DollarSign size={11} strokeWidth={2.4} color={MIDNIGHT} />
            <span style={{ fontSize: "10px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em" }}>비용</span>
          </div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{method.costEstimate}</div>
        </div>
      </div>

      {/* 사용 도구 */}
      <Section icon={Wrench} title="사용 도구">
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
          {method.tools.map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "10px",
                background: "white",
                border: `1px solid ${MIDNIGHT_BORDER}`,
              }}
            >
              <span style={{ fontSize: "13.5px", fontWeight: 700, color: MIDNIGHT, flex: 1 }}>{t.name}</span>
              {t.pricing && (
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "5px", background: MIDNIGHT_SOFT, color: MIDNIGHT }}>
                  {t.pricing}
                </span>
              )}
              {t.url && (
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", color: "rgba(15,23,42,0.5)" }}
                >
                  <ExternalLink size={13} strokeWidth={2.2} />
                </a>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* 단계별 절차 */}
      <Section icon={ChevronRight} title="단계별 절차">
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
          {method.steps.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "white",
                border: `1px solid ${MIDNIGHT_BORDER}`,
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: MIDNIGHT,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", lineHeight: 1.4, marginBottom: "3px" }}>{s.title}</div>
                <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 장단점 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            background: "rgba(5,150,105,0.04)",
            border: "1px solid rgba(5,150,105,0.18)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
            <Check size={12} strokeWidth={2.4} color="#059669" />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669", letterSpacing: "0.06em" }}>장점</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "rgba(15,23,42,0.72)", lineHeight: 1.65 }}>
            {method.pros.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            background: "rgba(220,38,38,0.04)",
            border: "1px solid rgba(220,38,38,0.18)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
            <AlertCircle size={12} strokeWidth={2.4} color="#dc2626" />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.06em" }}>단점</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "rgba(15,23,42,0.72)", lineHeight: 1.65 }}>
            {method.cons.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      </div>

      {/* 실제 예시 */}
      {method.example && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            background: MIDNIGHT_SOFT,
            border: `1px dashed ${MIDNIGHT_BORDER}`,
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
          }}
        >
          <Lightbulb size={14} strokeWidth={2.4} color={MIDNIGHT} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", marginBottom: "3px" }}>
              실제 사용 예
            </div>
            <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>{method.example}</div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Wrench; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <Icon size={13} strokeWidth={2.4} color={MIDNIGHT} />
        <span style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
 * BuildMethodTrigger — 인라인 "방법 자세히 보기" 버튼 (재사용)
 * ───────────────────────────────────────────────────────────────── */
export function BuildMethodTrigger({
  taskId,
  label = "📖 방법 자세히 보기",
  onOpen,
}: {
  taskId: string;
  label?: string;
  onOpen: (taskId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(taskId)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "10px",
        background: MIDNIGHT,
        color: "#fff",
        fontSize: "12.5px",
        fontWeight: 700,
        border: "none",
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(25,25,112,0.25)",
        transition: "transform 0.15s ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
    >
      {label}
    </button>
  );
}

"use client";

import type { Language } from "@foundone/shared";
import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useNotifications, type NotifItem } from "./notification-context";
import { useInAppNotifications, type InAppNotif } from "./lib/hooks/useInAppNotifications";
import { useIsMobile } from "./lib/hooks/useIsMobile";
import { enableWebPush, isWebPushGranted, isWebPushSupported } from "./lib/push-subscribe";

// 알림 url → DashboardSurface (navigateToSurface 가 받는 값). 알 수 없으면 클릭 비활성.
const NOTIF_SURFACES = new Set(["home", "current", "roadmap", "guides", "franchise", "profile", "analytics", "marketing", "reports", "team"]);
const surfaceFromUrl = (url: string | null) => (url ?? "").replace(/^\//, "").split(/[/?#]/)[0];
const timeAgoKo = (iso: string, ko: boolean) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return ko ? "방금 전" : "just now";
  if (m < 60) return ko ? `${m}분 전` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return ko ? `${h}시간 전` : `${h}h ago`;
  return ko ? `${Math.floor(h / 24)}일 전` : `${Math.floor(h / 24)}d ago`;
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "build-up-language";

export function LanguageProvider(props: { children: ReactNode }) {
  // 기본 언어 한국어 — Found.One 은 한국 SMB 우선 (사장님 요청 2026-05-09).
  // localStorage 에 이전 선택 (en/ko) 있으면 그걸로 덮어씀 (아래 useEffect).
  const [language, setLanguage] = useState<Language>("ko");
  const [notifOpen, setNotifOpen] = useState(false);
  // 웹 푸시 구독 상태 (2026-07-12) — "idle"=버튼 노출, "enabled"=숨김/완료 표시
  const [pushState, setPushState] = useState<"idle" | "enabling" | "enabled" | "failed">("idle");
  useEffect(() => {
    if (isWebPushGranted()) setPushState("enabled");
  }, []);
  const handleEnablePush = async () => {
    setPushState("enabling");
    const result = await enableWebPush();
    setPushState(result === "enabled" ? "enabled" : "failed");
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ko") {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === "ko" ? "ko" : "en";
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  const pathname = usePathname();
  const isAuthPage = pathname === "/auth";
  const { notifications } = useNotifications();
  // DB 인앱 알림함 (출근·초대·연차·수당 — push_dispatch 가 남기는 이벤트) 2026-07-14
  const { items: events, unreadCount: eventUnread, markRead, markAllRead } = useInAppNotifications();
  const isMobile = useIsMobile();
  const ko = language === "ko";
  const badgeCount = notifications.length;
  const urgentCount = notifications.filter((n: NotifItem) => n.severity === "urgent").length;
  const totalUnread = badgeCount + eventUnread; // 벨 배지 = 계산 경보 + 미읽음 이벤트

  // 이벤트 알림 클릭 → 읽음 처리 + 해당 surface 로 이동
  const handleEventClick = (n: InAppNotif) => {
    void markRead(n.id);
    const surface = surfaceFromUrl(n.url);
    if (!NOTIF_SURFACES.has(surface)) return;
    setNotifOpen(false);
    window.dispatchEvent(new CustomEvent("bup:navigate-feature", { detail: { surface } }));
  };

  // 알림 클릭 → 해당 surface 로 이동 + (옵션) 셋업 시트 자동 오픈.
  // 처리 자체는 starter-stage-demo 의 'bup:navigate-feature' / CashflowHeroCard 의
  // 'bup:open-cashflow-setup' listener 가 수행 — 여기서는 dispatch 만.
  const handleNotifClick = (n: NotifItem) => {
    if (!n.navigate?.surface) return;
    setNotifOpen(false);
    if (typeof window === "undefined") return;
    const detail: Record<string, unknown> = { surface: n.navigate.surface };
    if (n.navigate.scrollTargetId) detail.scrollTargetId = n.navigate.scrollTargetId;
    if (n.navigate.selector) detail.selector = n.navigate.selector;
    if (n.navigate.focusInput) detail.focusInput = true;
    window.dispatchEvent(new CustomEvent("bup:navigate-feature", { detail }));
    if (n.navigate.openCashflowSetup) {
      // surface 전환 + 카드 스크롤 (~700ms) 후 셋업 시트 오픈
      const openDetail = n.navigate.openCashflowSetup;
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("bup:open-cashflow-setup", { detail: openDetail }));
      }, 700);
    }
  };

  return (
    <LanguageContext.Provider value={value}>
      {props.children}

      {/* Hide header controls on /auth page (it has its own nav) */}
      {isAuthPage ? null : <>
      {/* Backdrop to close notification dropdown */}
      {notifOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 998 }}
          onClick={() => setNotifOpen(false)}
        />
      )}

      {/* Top-right: bell + language toggle.
          데스크톱: absolute(페이지 최상단, 스크롤 시 사라짐 — 의도된 디자인).
          모바일: fixed 로 고정 상단바(52px) 우측에 상주 — absolute 면 스크롤 시 상단바와 분리돼
          벨만 사라지는 문제. safe-area 반영. (2026-07-14) */}
      <div style={{
        position: isMobile ? "fixed" : "absolute",
        top: isMobile ? "max(9px, env(safe-area-inset-top))" : 36,
        right: isMobile ? 12 : 20,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>

        {/* ── 알림 벨 ── */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setNotifOpen(o => !o)}
            aria-label={ko ? "알림" : "Notifications"}
            style={{
              position: "relative",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "36px", height: "36px", borderRadius: "999px",
              border: notifOpen ? "1px solid rgba(59,92,140,0.30)" : "1px solid rgba(17,17,17,0.10)",
              background: notifOpen ? "rgba(59,92,140,0.08)" : "rgba(255,255,255,0.86)",
              backdropFilter: "blur(12px)",
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5C5.79 1.5 4 3.29 4 5.5V9L2.5 11h11L12 9V5.5C12 3.29 10.21 1.5 8 1.5Z"
                stroke={totalUnread > 0 ? "#1d3557" : "rgba(17,17,17,0.5)"}
                strokeWidth="1.3" strokeLinejoin="round" fill="none" />
              <path d="M6.5 11.5C6.5 12.33 7.17 13 8 13C8.83 13 9.5 12.33 9.5 11.5"
                stroke={totalUnread > 0 ? "#1d3557" : "rgba(17,17,17,0.5)"}
                strokeWidth="1.3" strokeLinecap="round" fill="none" />
            </svg>
            {totalUnread > 0 && (
              <span style={{
                position: "absolute", top: "-3px", right: "-3px",
                minWidth: "16px", height: "16px", borderRadius: "999px",
                background: urgentCount > 0 ? "#b64c4c" : "#191970",
                color: "#fff", fontSize: "9px", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px", lineHeight: 1,
                border: "2px solid rgba(255,255,255,0.9)",
              }}>
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0,
              zIndex: 1001, width: "min(320px, calc(100vw - 24px))", maxHeight: "440px",
              overflowY: "auto",
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(24px)",
              borderRadius: "18px",
              border: "1px solid rgba(0,0,0,0.09)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            }}>
              {/* 헤더 */}
              <div style={{ padding: "15px 18px 12px", borderBottom: "0.5px solid rgba(0,0,0,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.3px" }}>
                    {ko ? "알림" : "Notifications"}
                  </div>
                  {badgeCount > 0 && (
                    <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.45)", marginTop: "1px" }}>
                      {ko ? `${badgeCount}개 주의 항목` : `${badgeCount} alert${badgeCount > 1 ? "s" : ""}`}
                    </div>
                  )}
                </div>
                {urgentCount > 0 && (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#b64c4c", background: "rgba(182,76,76,0.08)", padding: "3px 8px", borderRadius: "999px" }}>
                    {ko ? `긴급 ${urgentCount}건` : `${urgentCount} urgent`}
                  </span>
                )}
              </div>

              {/* 푸시 알림 켜기 — 브라우저 밖에서도 알림 수신 (2026-07-12, 2026-07-14 문구·아이콘 정리) */}
              {isWebPushSupported() && pushState !== "enabled" && (
                <div style={{ padding: "10px 18px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    disabled={pushState === "enabling"}
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: "10px", border: "none",
                      background: "#191970", color: "white", fontSize: "12.5px", fontWeight: 700,
                      cursor: pushState === "enabling" ? "default" : "pointer",
                      opacity: pushState === "enabling" ? 0.6 : 1,
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px",
                    }}
                  >
                    {pushState === "enabling" ? (
                      ko ? "설정 중…" : "Enabling…"
                    ) : (
                      <>
                        {/* 서비스 벨 아이콘 (상단 벨 버튼과 동일 shape) — 이모지 대신 (2026-07-14) */}
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0 }}>
                          <path d="M8 1.5C5.79 1.5 4 3.29 4 5.5V9L2.5 11h11L12 9V5.5C12 3.29 10.21 1.5 8 1.5Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
                          <path d="M6.5 11.5C6.5 12.33 7.17 13 8 13C8.83 13 9.5 12.33 9.5 11.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                        </svg>
                        {ko ? "푸시 알림 켜기" : "Enable push"}
                      </>
                    )}
                  </button>
                  {pushState === "failed" && (
                    <div style={{ marginTop: "6px", fontSize: "11px", color: "#b64c4c", lineHeight: 1.4 }}>
                      {ko ? "설정 실패 — 로그인 상태와 브라우저 알림 권한을 확인해 주세요." : "Failed — check sign-in and browser permission."}
                    </div>
                  )}
                </div>
              )}

              {/* ── 최근 알림 (DB 이벤트: 출근·초대·연차·수당) 2026-07-14 ── */}
              {events.length > 0 && (
                <div>
                  <div style={{ padding: "11px 18px 5px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.5)", letterSpacing: "-0.1px" }}>{ko ? "최근 알림" : "Recent"}</span>
                    {eventUnread > 0 && (
                      <button type="button" onClick={() => void markAllRead()} style={{ fontSize: "10.5px", fontWeight: 700, color: "#191970", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        {ko ? "모두 읽음" : "Mark all read"}
                      </button>
                    )}
                  </div>
                  {events.map((n: InAppNotif, idx: number) => {
                    const clickable = NOTIF_SURFACES.has(surfaceFromUrl(n.url));
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleEventClick(n)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(25,25,112,0.04)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = n.is_read ? "transparent" : "rgba(25,25,112,0.03)"; }}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: "12px", width: "100%",
                          padding: "12px 18px", textAlign: "left", fontFamily: "inherit",
                          border: 0, borderBottom: idx < events.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
                          background: n.is_read ? "transparent" : "rgba(25,25,112,0.03)",
                          cursor: clickable ? "pointer" : "default", transition: "background 0.15s ease",
                        }}
                      >
                        {/* 미읽음 = 채운 네이비 점, 읽음 = 흐린 테두리 (신호등 색 미사용) */}
                        <div style={{
                          width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, marginTop: "4px",
                          background: n.is_read ? "transparent" : "#191970",
                          border: n.is_read ? "1.5px solid rgba(0,0,0,0.18)" : "none",
                          boxShadow: n.is_read ? "none" : "0 0 0 3px rgba(25,25,112,0.14)",
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: n.is_read ? 600 : 700, lineHeight: 1.35, color: "#111" }}>{n.title}</div>
                          <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.5)", marginTop: "2px", lineHeight: 1.4 }}>{n.body}</div>
                          <div style={{ fontSize: "10.5px", color: "rgba(0,0,0,0.38)", marginTop: "4px", fontWeight: 600 }}>{timeAgoKo(n.created_at, ko)}</div>
                        </div>
                      </button>
                    );
                  })}
                  {notifications.length > 0 && (
                    <div style={{ padding: "9px 18px 4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.5)" }}>{ko ? "주의 항목" : "Alerts"}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 알림 없음 (계산 경보 + 이벤트 모두 없음) */}
              {notifications.length === 0 && events.length === 0 && (
                <div style={{ padding: "28px 18px", textAlign: "center" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ margin: "0 auto 8px", display: "block" }}>
                    <path d="M14 3C9.58 3 6 6.58 6 11V17L4 20h20L22 17V11C22 6.58 18.42 3 14 3Z" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                    <path d="M11 20.5C11 22.16 12.34 23.5 14 23.5S17 22.16 17 20.5" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <polyline points="9,9 19,19" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#111", letterSpacing: "-0.1px" }}>
                    {ko ? "새 알림 없음" : "All clear"}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", marginTop: "3px" }}>
                    {ko ? "주의가 필요한 항목이 없습니다" : "No items need your attention"}
                  </div>
                </div>
              )}

              {/* 알림 목록 — navigate 가 있으면 클릭 가능 button, 없으면 정적 div */}
              {notifications.length > 0 && (
                <div>
                  {notifications.map((n: NotifItem, idx: number) => {
                    const clickable = !!n.navigate?.surface;
                    const rowStyle: React.CSSProperties = {
                      display: "flex", alignItems: "flex-start", gap: "12px",
                      width: "100%",
                      padding: "13px 18px",
                      borderBottom: idx < notifications.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
                      background: "transparent",
                      border: 0,
                      borderBottomWidth: idx < notifications.length - 1 ? "0.5px" : 0,
                      borderBottomStyle: "solid" as const,
                      borderBottomColor: "rgba(0,0,0,0.06)",
                      textAlign: "left" as const,
                      cursor: clickable ? "pointer" : "default",
                      fontFamily: "inherit",
                      transition: "background 0.15s ease",
                    };
                    const inner = (
                      <>
                        <div style={{
                          width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, marginTop: "4px",
                          background: n.severity === "urgent" ? "#b64c4c" : "#191970",
                          boxShadow: n.severity === "urgent" ? "0 0 0 3px rgba(182,76,76,0.14)" : "0 0 0 3px rgba(25,25,112,0.14)",
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "-0.1px", lineHeight: 1.35, color: "#111" }}>
                            {n.title}
                          </div>
                          <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.45)", marginTop: "2px", lineHeight: 1.4 }}>
                            {n.detail}
                          </div>
                          {clickable && (
                            <div style={{
                              fontSize: "10.5px", fontWeight: 700, color: "#191970",
                              marginTop: "5px", letterSpacing: "-0.005em",
                            }}>
                              {ko ? "지금 처리하기 →" : "Resolve now →"}
                            </div>
                          )}
                        </div>
                        <span style={{
                          fontSize: "10px", fontWeight: 700, flexShrink: 0, marginTop: "2px",
                          color: n.severity === "urgent" ? "#b64c4c" : "#191970",
                          background: n.severity === "urgent" ? "rgba(182,76,76,0.08)" : "rgba(25,25,112,0.08)",
                          padding: "2px 7px", borderRadius: "999px",
                        }}>
                          {n.severity === "urgent" ? (ko ? "긴급" : "Urgent") : (ko ? "주의" : "Warning")}
                        </span>
                      </>
                    );
                    return clickable ? (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleNotifClick(n)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(25,25,112,0.04)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        style={rowStyle}
                      >
                        {inner}
                      </button>
                    ) : (
                      <div key={n.id} style={{ ...rowStyle, cursor: "default" }}>
                        {inner}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 푸터 힌트 */}
              {notifications.length > 0 && (
                <div style={{ padding: "10px 18px", borderTop: "0.5px solid rgba(0,0,0,0.06)", fontSize: "11px", color: "rgba(0,0,0,0.45)", textAlign: "center" }}>
                  {ko ? "내 가게 탭에서 세부 내용을 확인하세요" : "Go to My Store tab for details"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 언어 토글 ── */}
        <div style={{
          display: "flex",
          gap: 8,
          padding: 6,
          borderRadius: 999,
          background: "rgba(255,255,255,0.86)",
          border: "1px solid rgba(17,17,17,0.08)",
          backdropFilter: "blur(12px)",
        }}>
          {/* 작은 chip 톤 — KO/EN 짧은 라벨 (사용자 피드백: "매번 보이는 시각 잡음") */}
          {(["ko", "en"] as const).map((next) => (
            <button
              key={next}
              type="button"
              onClick={() => setLanguage(next)}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "4px 10px",
                background: language === next ? "#1D3557" : "transparent",
                color: language === next ? "#fff" : "rgba(17,17,17,0.55)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {next === "ko" ? "KO" : "EN"}
            </button>
          ))}
        </div>

      </div>
      </>}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}

"use client";

import type { Language } from "@build-up/shared";
import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useNotifications, type NotifItem } from "./notification-context";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "build-up-language";

export function LanguageProvider(props: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [notifOpen, setNotifOpen] = useState(false);

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
  const ko = language === "ko";
  const badgeCount = notifications.length;
  const urgentCount = notifications.filter((n: NotifItem) => n.severity === "urgent").length;

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

      {/* Fixed top-right: bell + language toggle */}
      <div style={{
        position: "fixed",
        top: 36,
        right: 20,
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
              border: notifOpen ? "1px solid rgba(0,122,255,0.30)" : "1px solid rgba(17,17,17,0.10)",
              background: notifOpen ? "rgba(0,122,255,0.08)" : "rgba(255,255,255,0.86)",
              backdropFilter: "blur(12px)",
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5C5.79 1.5 4 3.29 4 5.5V9L2.5 11h11L12 9V5.5C12 3.29 10.21 1.5 8 1.5Z"
                stroke={badgeCount > 0 ? "#007aff" : "rgba(17,17,17,0.5)"}
                strokeWidth="1.3" strokeLinejoin="round" fill="none" />
              <path d="M6.5 11.5C6.5 12.33 7.17 13 8 13C8.83 13 9.5 12.33 9.5 11.5"
                stroke={badgeCount > 0 ? "#007aff" : "rgba(17,17,17,0.5)"}
                strokeWidth="1.3" strokeLinecap="round" fill="none" />
            </svg>
            {badgeCount > 0 && (
              <span style={{
                position: "absolute", top: "-3px", right: "-3px",
                minWidth: "16px", height: "16px", borderRadius: "999px",
                background: urgentCount > 0 ? "#ff3b30" : "#ff9f0a",
                color: "#fff", fontSize: "9px", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px", lineHeight: 1,
                border: "2px solid rgba(255,255,255,0.9)",
              }}>
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0,
              zIndex: 1001, width: "320px", maxHeight: "440px",
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
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#ff3b30", background: "rgba(255,59,48,0.08)", padding: "3px 8px", borderRadius: "999px" }}>
                    {ko ? `긴급 ${urgentCount}건` : `${urgentCount} urgent`}
                  </span>
                )}
              </div>

              {/* 알림 없음 */}
              {notifications.length === 0 && (
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

              {/* 알림 목록 */}
              {notifications.length > 0 && (
                <div>
                  {notifications.map((n: NotifItem, idx: number) => (
                    <div key={n.id} style={{
                      display: "flex", alignItems: "flex-start", gap: "12px",
                      padding: "13px 18px",
                      borderBottom: idx < notifications.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
                    }}>
                      <div style={{
                        width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, marginTop: "4px",
                        background: n.severity === "urgent" ? "#ff3b30" : "#ff9f0a",
                        boxShadow: n.severity === "urgent" ? "0 0 0 3px rgba(255,59,48,0.14)" : "0 0 0 3px rgba(255,159,10,0.14)",
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "-0.1px", lineHeight: 1.35, color: "#111" }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.45)", marginTop: "2px", lineHeight: 1.4 }}>
                          {n.detail}
                        </div>
                      </div>
                      <span style={{
                        fontSize: "10px", fontWeight: 700, flexShrink: 0, marginTop: "2px",
                        color: n.severity === "urgent" ? "#ff3b30" : "#ff9f0a",
                        background: n.severity === "urgent" ? "rgba(255,59,48,0.08)" : "rgba(255,159,10,0.08)",
                        padding: "2px 7px", borderRadius: "999px",
                      }}>
                        {n.severity === "urgent" ? (ko ? "긴급" : "Urgent") : (ko ? "주의" : "Warning")}
                      </span>
                    </div>
                  ))}
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
          {(["ko", "en"] as const).map((next) => (
            <button
              key={next}
              type="button"
              onClick={() => setLanguage(next)}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "8px 12px",
                background: language === next ? "#1D3557" : "transparent",
                color: language === next ? "#fff" : "#111",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {next === "ko" ? "한국어" : "English"}
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

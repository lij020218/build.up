"use client";

import { useRef, useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  getStarterBusinessModelOptions,
  localizeRecommendationItem,
} from "@build-up/shared";

export function BusinessModelSelectionStage() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    industryCategoryId,
    selectedIndustryLabel,
    selectedBusinessModelId, setSelectedBusinessModelId,
    canCompleteBusinessModelStep,
    handleBusinessModelContinue,
    prevTraversedStage, setViewingStageId,
    resetDemo,
  } = d;

  const businessModelRef = useRef<HTMLDivElement>(null);
  const [shakeWarning, setShakeWarning] = useState(false);

  return (
    <>
      <div style={styles.helper}>
        {copy.home.businessModelHelp}
      </div>
      <div style={styles.helper}>
        {language === "ko"
          ? `${selectedIndustryLabel} 기준으로 운영 방식을 고르세요.`
          : `Choose the operating model for ${selectedIndustryLabel}.`}
      </div>
      {(() => {
        const color = "#1d3557"; // 미드나이트 블루
        const modelIcons: Record<string, string> = {
          "dine-in-restaurant": "M3 12h18M5 12a7 7 0 0114 0M12 12v6m-3 0h6",           // 접시 (매장식사)
          "takeout-focused": "M8 2h8l-1 5H9L8 2zM7 7h10v4a5 5 0 01-5 5 5 5 0 01-5-5V7zm3 14h4", // 테이크아웃 컵
          "delivery-hybrid": "M5 17h14l1-9H4l1 9zM7 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000-2z", // 배달
          "storefront-cafe": "M3 21V8l9-5 9 5v13M9 21v-6h6v6",                          // 매장
          "self-serve-light": "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm4 15h8M12 19v2", // 키오스크
          "small-storefront-retail": "M3 3h18v18H3V3zm0 6h18",                          // 소매 매장
          "online-focused-retail": "M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1zm0 4h16", // 모니터
          "marketplace-seller": "M3 3h2l1 9h12l1-6H6M8 20a1 1 0 100 2 1 1 0 000-2zm9 0a1 1 0 100 2 1 1 0 000-2z", // 장바구니
          "brand-own-store": "M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z",    // 별 (브랜드)
          "content-membership": "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", // 메일
          "appointment-service": "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", // 캘린더
          "membership-pass": "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm10 0l2 2 4-4", // 멤버십
          "class-session": "M12 3l9 5v2l-9 5-9-5V8l9-5zm0 12v5",                        // 수업
          "utility-storefront": "M3 21V8l9-5 9 5v13M9 21v-4h6v4",                       // 서비스 매장
          "mobile-service": "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0l5.5 6M3 16l5.5 6", // 출장
          "hourly-rental": "M12 2a10 10 0 100 20 10 10 0 000-20zm0 6v4l3 3",            // 시계
          "saas-product": "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm0 4h16M4 13h16M8 9v8", // 대시보드
          "platform-model": "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10", // 플랫폼
          "api-infra": "M16 18l6-6-6-6M8 6l-6 6 6 6",                                   // 코드
        };
        const options = getStarterBusinessModelOptions(industryCategoryId);
        return (
          <div ref={businessModelRef} style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, 1fr)`, gap: "10px", ...(shakeWarning ? { outline: "2px solid #dc2626", outlineOffset: "4px", borderRadius: "16px", transition: "outline 0.3s ease" } : {}) }}>
            {options.map((rawOption) => {
              const option = localizeRecommendationItem(rawOption, language);
              const selected = selectedBusinessModelId === rawOption.id;
              const iconPath = modelIcons[rawOption.id] ?? "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5";
              return (
                <button
                  key={rawOption.id}
                  type="button"
                  style={{
                    display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center" as const,
                    gap: "6px", padding: "28px 16px", borderRadius: "18px", cursor: "pointer", width: "100%",
                    border: selected ? `1.5px solid ${color}50` : "1.5px solid rgba(0,0,0,0.04)",
                    background: selected
                      ? `linear-gradient(160deg, ${color}0e 0%, ${color}06 100%)`
                      : "rgba(255,255,255,0.8)",
                    boxShadow: selected ? `0 0 0 3px ${color}0a, 0 4px 12px ${color}08` : "none",
                    transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                  onClick={() => setSelectedBusinessModelId(rawOption.id)}
                >
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "14px",
                    background: selected ? `${color}12` : "rgba(0,0,0,0.035)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "4px", transition: "all 0.2s ease",
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke={selected ? color : "rgba(15,23,42,0.35)"}
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transition: "stroke 0.2s ease" }}>
                      <path d={iconPath} />
                    </svg>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 650, letterSpacing: "-0.01em", color: selected ? color : "#0f172a" }}>
                    {option.title}
                  </div>
                </button>
              );
            })}
          </div>
        );
      })()}

      <div style={styles.stageFooter}>
        {prevTraversedStage ? (
          <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
            {language === "ko" ? "← 이전 단계" : "← Back"}
          </button>
        ) : null}
        <button
          type="button"
          style={{
            ...styles.primaryButton,
            opacity: canCompleteBusinessModelStep ? 1 : 0.45
          }}
          onClick={() => {
            if (!canCompleteBusinessModelStep) {
              setShakeWarning(true);
              businessModelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setShakeWarning(false), 2000);
              return;
            }
            handleBusinessModelContinue();
          }}
        >
          {canCompleteBusinessModelStep
            ? (language === "ko" ? "운영 방식 확정하고 계속" : "Lock this model and continue")
            : (language === "ko" ? "↑ 운영 방식을 선택하세요" : "↑ Select an operating model")}
        </button>
        <button type="button" style={styles.button} onClick={resetDemo}>
          {copy.common.resetDemo}
        </button>
      </div>
    </>
  );
}

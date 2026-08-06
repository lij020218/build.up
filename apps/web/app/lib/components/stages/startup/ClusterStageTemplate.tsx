"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  AlertTriangle, ExternalLink, type LucideIcon,
} from "lucide-react";
import { StageWrapup, type WrapupItem } from "../shared/StageWrapup";
import { StartupKeyActionHero } from "./StartupStageShell";
import { getClusterStageVendors } from "./cluster-stage-vendors";

const MIDNIGHT = "#191970";

/**
 * 클러스터 (Hardware/Deep-tech-lab/Extreme-deeptech) 단계 공통 템플릿.
 *
 *  같은 패턴: KEY ACTION 미드나이트 히어로 + 트랩 카드 + 검증된 콘텐츠 카드.
 *  세부 업종 (hardware-iot · robotics-physical-ai · biotech-medtech · semiconductor · climate-energy)
 *  에 따라 콘텐츠가 분기되며, 부재 시 클러스터 기본 콘텐츠로 폴백.
 *
 *  이 컴포넌트는 12개 신규 stage 가 공통으로 사용 — props 로 stage 별 데이터를 받음.
 */

export type ClusterStageContent = {
  /** KEY ACTION (이 단계에서 꼭 할 일) */
  keyAction: { title: string; detail: string };
  /** 검증된 사실 카드 (출처 인용) */
  facts?: Array<{ icon: LucideIcon; label: string; value: string; source?: string }>;
  /** 단계별 핵심 체크리스트 (taskMap 과 별개로 가이드용 — 진행률은 taskMap 이 결정) */
  guideItems?: Array<{ title: string; desc: string }>;
  /** 빨강 트랩 카드 — 흔한 실패 사례 + 사례 출처 */
  traps?: Array<{ label: string; text: string }>;
  /** 외부 링크 (정부 지원·표준·인증기관 등) */
  links?: Array<{ name: string; href: string; desc?: string }>;
  /** 마무리 — 다음 단계 전 반드시 확인 */
  wrapup?: {
    nextStageLabelKo: string;
    doneItemsKo: WrapupItem[];
    verifyItemsKo: string[];
    nextSummaryKo: string;
  };
};

export type ClusterStageTemplateProps = {
  /** 단계 코드 (예: "hardware_prototype") — 페이지 헤더용 */
  stepLabel: string;
  /** 페이지 타이틀 */
  title: string;
  /** 단계 컨텍스트 (서브 라벨, 예: "Cluster B · Hardware NPI 1/4") */
  contextLabel?: string;
  /** 단계 ID (예: "hardware-prototype") — 추천 공급사·도구 조회용 */
  stageId?: string;
  /** sub-industry → 콘텐츠 매핑 */
  contentBySubIndustry: Record<string, ClusterStageContent>;
  /** 폴백 콘텐츠 (sub-industry 콘텐츠 없을 때) */
  defaultContent: ClusterStageContent;
};

const TIER_BADGE: Record<"essential" | "recommended" | "optional", { label: string; bg: string; fg: string }> = {
  essential:   { label: "필수", bg: "rgba(25,25,112,0.10)", fg: "#191970" },
  recommended: { label: "권장", bg: "rgba(11,114,133,0.10)", fg: "#0b7285" },
  optional:    { label: "선택", bg: "rgba(15,23,42,0.05)",  fg: "rgba(15,23,42,0.55)" },
};

export function ClusterStageTemplate({
  stepLabel,
  title,
  contextLabel,
  stageId,
  contentBySubIndustry,
  defaultContent,
}: ClusterStageTemplateProps) {
  const d = useDashboardCtx();
  const { language, selectedIndustryId } = d;
  const ko = language === "ko";

  /**
   * "N단계 / 총단계" — 실제 사장님 경로(pathStageList)에서 계산한다.
   * 종전에는 12개 파일에 `contextLabel="12단계 / 22"` 식으로 박아뒀는데,
   * 하드웨어·랩·반도체 경로는 실제 23단계라 숫자가 어긋났고 단계를 추가할 때마다 낡았다
   * (2026-08-06 정리 — "46단계 로드맵"·"14단계 로드맵" 과 같은 유형의 오류).
   */
  const autoContextLabel = (() => {
    if (!stageId) return undefined;
    const idx = d.pathStageList.findIndex((s) => s.stageId === stageId);
    if (idx < 0 || d.pathTotalStages <= 0) return undefined;
    return ko ? `${idx + 1}단계 / ${d.pathTotalStages}` : `Step ${idx + 1} / ${d.pathTotalStages}`;
  })();

  const content = (selectedIndustryId && contentBySubIndustry[selectedIndustryId])
    ? contentBySubIndustry[selectedIndustryId]
    : defaultContent;

  const vendors = stageId ? getClusterStageVendors(stageId, selectedIndustryId ?? undefined) : [];

  const sectionLabel: React.CSSProperties = {
    fontSize: "12.5px",
    fontWeight: 600,
    color: "rgba(0,0,0,0.45)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "10px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* 헤더 */}
      <div>
        {(contextLabel ?? autoContextLabel) && (
          <div style={{
            fontSize: "11.5px", fontWeight: 700, color: MIDNIGHT,
            letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px",
          }}>
            {contextLabel ?? autoContextLabel}
          </div>
        )}
        <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.3 }}>
          {title}
        </div>
        {stepLabel && (
          <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", marginTop: "4px" }}>
            {stepLabel}
          </div>
        )}
      </div>

      {/* ⚠️ 2026-05-18: inline KEY ACTION 카드를 StartupKeyActionHero 로 통합. 종전엔 cluster 12
          stage 가 자체 inline 히어로를 그려 startup-tech 메인 path 와 시각 분기 발생했음.
          이제 모든 startup-tech stage 가 같은 히어로 컴포넌트 사용 — 시각 일관성 확보. */}
      <StartupKeyActionHero
        eyebrow={ko ? "이 단계에서 꼭 할 일" : "Do this in this stage"}
        title={content.keyAction.title}
        subtitle={content.keyAction.detail}
      />

      {/* 검증된 사실 카드 */}
      {content.facts && content.facts.length > 0 && (
        <div>
          <div style={sectionLabel}>{ko ? "검증된 사실" : "Verified facts"}</div>
          <div style={{
            background: "white", borderRadius: "16px",
            border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}>
            {content.facts.map((fact, i) => {
              const Icon = fact.icon;
              return (
                <div key={fact.label}>
                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "rgba(25,25,112,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, color: MIDNIGHT,
                    }}>
                      <Icon size={17} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "14.5px", fontWeight: 600, color: "var(--text)",
                        letterSpacing: "-0.01em", marginBottom: "3px",
                      }}>
                        {fact.label}
                      </div>
                      <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55 }}>
                        {fact.value}
                        {fact.source && (
                          <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginLeft: "6px" }}>
                            ({fact.source})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 가이드 체크리스트 (taskMap 과 별도, 참고용) */}
      {content.guideItems && content.guideItems.length > 0 && (
        <div>
          <div style={sectionLabel}>{ko ? "단계별 가이드" : "Step guide"}</div>
          <div style={{
            background: "white", borderRadius: "16px",
            border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}>
            {content.guideItems.map((item, i) => (
              <div key={item.title}>
                {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(25,25,112,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, color: MIDNIGHT,
                    fontSize: "13px", fontWeight: 800,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "3px" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 트랩 카드 */}
      {content.traps && content.traps.length > 0 && (
        <div style={{ display: "grid", gap: "8px" }}>
          {content.traps.map((trap) => (
            <div key={trap.label} style={{
              display: "flex", gap: "10px", alignItems: "flex-start",
              padding: "13px 15px", borderRadius: "14px",
              background: "rgba(182,76,76,0.04)", border: "1px solid rgba(182,76,76,0.14)",
            }}>
              <AlertTriangle size={18} strokeWidth={2} style={{ color: "#b64c4c", flexShrink: 0, marginTop: "1px" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "13.5px", fontWeight: 700, color: "#b64c4c",
                  marginBottom: "3px", letterSpacing: "-0.01em",
                }}>
                  {trap.label}
                </div>
                <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(180,28,28,0.85)" }}>
                  {trap.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추천 공급사·도구 (2026 조사) */}
      {vendors.length > 0 && (
        <div>
          <div style={sectionLabel}>{ko ? "추천 공급사 · 도구" : "Recommended Vendors · Tools"}</div>
          <div style={{
            fontSize: "12px", color: "rgba(180,100,0,0.85)", lineHeight: 1.5,
            padding: "9px 13px", borderRadius: "11px", background: "rgba(255,149,0,0.08)", marginBottom: "10px",
          }}>
            {ko
              ? "💡 광고가 아닌 참고용입니다. 가격·사양은 시점에 따라 변하니 발주·계약·인증 전 직접 검증하세요."
              : "💡 Reference only, not advertising. Verify directly before ordering, contracting or certifying."}
          </div>
          <div style={{
            background: "white", borderRadius: "16px",
            border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}>
            {vendors.map((v, i) => {
              const badge = TIER_BADGE[v.tier];
              const Tag = v.href ? "a" : "div";
              return (
                <Tag
                  key={v.name}
                  {...(v.href ? { href: v.href, target: "_blank", rel: "noopener noreferrer" } : {})}
                  style={{
                    display: "flex", gap: "12px", alignItems: "flex-start", padding: "13px 16px",
                    borderTop: i > 0 ? "0.5px solid rgba(0,0,0,0.07)" : "none",
                    textDecoration: "none", color: "inherit",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap", marginBottom: "2px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 650, color: "var(--text)", letterSpacing: "-0.01em" }}>
                        {v.name}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "5px", background: badge.bg, color: badge.fg }}>
                        {badge.label}
                      </span>
                      <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)" }}>{v.category}</span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.6)", lineHeight: 1.5 }}>{v.descKo}</div>
                    {v.pricing && (
                      <div style={{ fontSize: "11.5px", fontWeight: 600, color: MIDNIGHT, marginTop: "3px" }}>{v.pricing}</div>
                    )}
                  </div>
                  {v.href && <ExternalLink size={14} strokeWidth={2} style={{ color: "rgba(0,0,0,0.3)", flexShrink: 0, marginTop: "2px" }} />}
                </Tag>
              );
            })}
          </div>
        </div>
      )}

      {/* 외부 링크 */}
      {content.links && content.links.length > 0 && (
        <div>
          <div style={sectionLabel}>{ko ? "참고 링크" : "References"}</div>
          <div style={{
            background: "white", borderRadius: "16px",
            border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}>
            {content.links.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", padding: "13px 16px", gap: "12px",
                  borderTop: i > 0 ? "0.5px solid rgba(0,0,0,0.07)" : "none",
                  textDecoration: "none", color: "inherit",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
                    {link.name}
                  </div>
                  {link.desc && (
                    <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", marginTop: "2px" }}>
                      {link.desc}
                    </div>
                  )}
                </div>
                <ExternalLink size={14} strokeWidth={2} style={{ color: "rgba(0,0,0,0.3)" }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {content.wrapup && (
        <StageWrapup
          ko={ko}
          nextStageLabelKo={content.wrapup.nextStageLabelKo}
          doneItemsKo={content.wrapup.doneItemsKo}
          verifyItemsKo={content.wrapup.verifyItemsKo}
          nextSummaryKo={content.wrapup.nextSummaryKo}
        />
      )}
    </div>
  );
}

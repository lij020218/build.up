"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  ShieldCheck, AlertTriangle, ExternalLink, type LucideIcon,
} from "lucide-react";
import { StageWrapup, type WrapupItem } from "../shared/StageWrapup";

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
  /** sub-industry → 콘텐츠 매핑 */
  contentBySubIndustry: Record<string, ClusterStageContent>;
  /** 폴백 콘텐츠 (sub-industry 콘텐츠 없을 때) */
  defaultContent: ClusterStageContent;
};

export function ClusterStageTemplate({
  stepLabel,
  title,
  contextLabel,
  contentBySubIndustry,
  defaultContent,
}: ClusterStageTemplateProps) {
  const d = useDashboardCtx();
  const { language, selectedIndustryId } = d;
  const ko = language === "ko";

  const content = (selectedIndustryId && contentBySubIndustry[selectedIndustryId])
    ? contentBySubIndustry[selectedIndustryId]
    : defaultContent;

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
        {contextLabel && (
          <div style={{
            fontSize: "11.5px", fontWeight: 700, color: MIDNIGHT,
            letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px",
          }}>
            {contextLabel}
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

      {/* KEY ACTION 히어로 */}
      <div style={{
        display: "flex", gap: "14px", alignItems: "flex-start",
        padding: "16px 18px", borderRadius: "16px",
        background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`,
        color: "#fff",
        boxShadow: "0 6px 20px rgba(25,25,112,0.28)",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          backdropFilter: "blur(8px)",
        }}>
          <ShieldCheck size={20} strokeWidth={2.2} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase" as const, opacity: 0.7, marginBottom: "4px",
          }}>
            {ko ? "이 단계에서 꼭 할 일" : "Do this in this stage"}
          </div>
          <div style={{
            fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em",
            lineHeight: 1.4, marginBottom: "5px",
          }}>
            {content.keyAction.title}
          </div>
          <div style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.92 }}>
            {content.keyAction.detail}
          </div>
        </div>
      </div>

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
              background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.14)",
            }}>
              <AlertTriangle size={18} strokeWidth={2} style={{ color: "#dc2626", flexShrink: 0, marginTop: "1px" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "13.5px", fontWeight: 700, color: "#dc2626",
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

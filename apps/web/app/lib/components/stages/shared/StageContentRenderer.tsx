"use client";

/**
 * StageContentRenderer — 단계 "내용" SSOT(@foundone/shared stages) 를 웹에서 렌더.
 *
 * 같은 StageContent 데이터를 iOS BUStageContentRenderer 가 렌더 → web↔iOS 무드리프트 불가.
 * 정적 섹션(whyList·stepList·permit·pitfalls·pathCards·checklist·infoCard·wrapup)은 데이터로,
 * 인터랙티브 위젯(kind="interactive")은 ref→React 컴포넌트로 매핑(플랫폼별 유일 비공유점).
 *
 * 디자인: RegistrationSetupStage 의 미드나잇 Apple-style 프리미티브 1:1 보존.
 */

import { useMemo, useState, type ReactNode } from "react";
import {
  FileText,
  ShieldCheck,
  Building2,
  AlertTriangle,
  Sparkles,
  Receipt,
  Lightbulb,
  ArrowRight,
  ExternalLink,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import type {
  Accent,
  CategoryContent,
  IconKey,
  Section,
  StageContent,
} from "@foundone/shared";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  MIDNIGHT,
  MIDNIGHT_SOFT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
} from "../startup/StartupStageShell";
import { StageWrapup } from "./StageWrapup";
import { StoreNameInput } from "./StoreNameInput";
import { BusinessDocumentUpload } from "../../my-store/BusinessDocumentUpload";

/* ───────────────────────── 토큰 매핑(문자열 → 웹) ───────────────────────── */

const ICONS: Record<IconKey, LucideIcon> = {
  fileText: FileText,
  shieldCheck: ShieldCheck,
  building: Building2,
  alertTriangle: AlertTriangle,
  sparkles: Sparkles,
  receipt: Receipt,
  lightbulb: Lightbulb,
  arrowRight: ArrowRight,
  checklist: ListChecks,
};

const ACCENT_COLOR: Record<Accent, string> = {
  midnight: MIDNIGHT,
  blue: "#0561fc",
  danger: "#b64c4c",
};

/* ───────────────────────── 시각 프리미티브(원본 보존) ───────────────────────── */

function CardShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "14px",
        border: `1px solid ${MIDNIGHT_BORDER}`,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
      }}
    >
      {children}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "0 4px" }}>
        {Icon && (
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: MIDNIGHT_SOFT, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={16} strokeWidth={2.2} color={MIDNIGHT} />
          </div>
        )}
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{title}</div>
          {subtitle && <div style={{ fontSize: "11.5px", color: "var(--muted)", marginTop: "1px" }}>{subtitle}</div>}
        </div>
      </div>
      <CardShell>{children}</CardShell>
    </div>
  );
}

function StepRow({ number, title, detail, isLast }: { number: number; title: string; detail: string; isLast?: boolean }) {
  return (
    <>
      <div style={{ display: "flex", gap: "12px", padding: "14px 16px", alignItems: "flex-start", background: "white" }}>
        <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>
          {number}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", lineHeight: 1.4, marginBottom: "3px" }}>{title}</div>
          <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55 }}>{detail}</div>
        </div>
      </div>
      {!isLast && <div style={{ height: "1px", background: "rgba(0,0,0,0.05)", marginLeft: "50px" }} />}
    </>
  );
}

function MetaPair({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div style={{ flex: 1, padding: "12px 14px", borderRadius: "10px", background: MIDNIGHT_SOFT, textAlign: "center" }}>
      <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(25,25,112,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 700, color: MIDNIGHT, marginTop: "3px" }}>{value}</div>
      {sublabel && <div style={{ fontSize: "10.5px", color: "var(--muted)", marginTop: "1px" }}>{sublabel}</div>}
    </div>
  );
}

function PathCardView({ condition, recommendation, reason }: { condition: string; recommendation: string; reason: string }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}`, marginBottom: "8px" }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <div style={{ padding: "3px 10px", borderRadius: "6px", background: MIDNIGHT_SOFT, fontSize: "11px", fontWeight: 700, color: MIDNIGHT, flexShrink: 0, marginTop: "1px", whiteSpace: "nowrap" }}>
          {condition}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "4px", lineHeight: 1.4 }}>→ {recommendation}</div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55 }}>{reason}</div>
        </div>
      </div>
    </div>
  );
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "rgba(25,25,112,0.55)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: "8px",
};

/* ───────────────────────── 섹션 렌더 ───────────────────────── */

function metaSplit(s: string): { value: string; sublabel?: string } {
  const value = (s.split("(")[0] ?? s).trim();
  const sublabel = s.includes("(") ? s.split("(")[1].replace(")", "").trim() : undefined;
  return { value, sublabel };
}

function PermitSection({ icon, cat, categoryLabel }: { icon?: IconKey; cat: CategoryContent; categoryLabel: string }) {
  const Icon = icon ? ICONS[icon] : undefined;
  const p = cat.permit;
  const costMeta = metaSplit(p.cost);
  const durMeta = metaSplit(p.duration);
  const kindSub = p.kind === "신고" ? "알림" : p.kind === "허가" ? "금지 해제" : p.kind === "등록" ? "기록 등재" : "자격 부여";
  return (
    <SectionCard icon={Icon} title={`2단계 · ${p.name}`} subtitle={`${categoryLabel} 업종 — ${p.description}`}>
      {/* 신청 위치 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: MIDNIGHT_SOFT, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <div>
          <div style={sectionLabelStyle}>신청 장소</div>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: MIDNIGHT }}>{p.where}</div>
        </div>
        {p.externalUrl && (
          <a href={p.externalUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 14px", borderRadius: "10px", background: MIDNIGHT, color: "#fff", fontSize: "12.5px", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px", boxShadow: "0 4px 12px rgba(25,25,112,0.25)" }}>
            바로가기 <ExternalLink size={12} strokeWidth={2.4} />
          </a>
        )}
      </div>
      {/* 필요 서류 */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <div style={sectionLabelStyle}>필요 서류 ({p.documents.length}종)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {p.documents.map((doc) => (
            <div key={doc} style={{ padding: "6px 10px", borderRadius: "8px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}`, fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>{doc}</div>
          ))}
        </div>
      </div>
      {/* 핵심 요건 */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <div style={sectionLabelStyle}>핵심 요건</div>
        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.7 }}>
          {p.requirements.map((req) => <li key={req}>{req}</li>)}
        </ul>
      </div>
      {/* 인허가 항목 리스트(발급기관·처리일) — iOS requiredPermits 합본 */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <div style={sectionLabelStyle}>필수 인허가 — {categoryLabel}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {cat.requiredPermits.map((rp) => (
            <div key={rp.label}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>{rp.label}</div>
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: "10px", fontWeight: 800, color: MIDNIGHT, background: "rgba(25,25,112,0.10)", padding: "1px 6px", borderRadius: "999px" }}>
                  {rp.estimatedDays === 0 ? "즉시" : `${rp.estimatedDays}일`}
                </div>
              </div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: MIDNIGHT, marginTop: "1px" }}>{rp.agency}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.5, marginTop: "2px" }}>{rp.detail}</div>
            </div>
          ))}
        </div>
      </div>
      {/* meta */}
      <div style={{ display: "flex", gap: "8px", padding: "14px 16px" }}>
        <MetaPair label="비용" value={costMeta.value} sublabel={costMeta.sublabel} />
        <MetaPair label="소요" value={durMeta.value} sublabel={durMeta.sublabel} />
        <MetaPair label="유형" value={p.kind} sublabel={kindSub} />
      </div>
    </SectionCard>
  );
}

/** 웹 docUpload — 카테고리별 서류 종류 분기(원본 보존). */
function DocUploadSection({ cat, ko, config }: { cat: string; ko: boolean; config?: Record<string, unknown> }) {
  const title = (config?.title as string) ?? (ko ? "이 단계 서류 보관" : "Documents from this stage");
  const note = config?.note as string | undefined;
  const isFoodLike = cat === "food" || cat === "cafe-dessert";
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        <BusinessDocumentUpload
          ko={ko}
          kind="biz-registration"
          label={ko ? "사업자등록증" : "Business Registration Certificate"}
          hint={ko ? "홈택스 또는 세무서 발급 PDF/사진. 사업개시일 20일 이내 등록 필수." : "HomeTax/tax office. Required within 20 days of opening."}
        />
        {isFoodLike && (
          <BusinessDocumentUpload
            ko={ko}
            kind="hygiene-cert"
            label={ko ? "위생교육 수료증" : "Hygiene Education Cert"}
            hint={ko ? "한국외식업중앙회 6시간 (신규 영업자). 영업신고 첨부 서류." : "KFIA 6h (new operators)"}
          />
        )}
        {(isFoodLike || cat === "beauty") && (
          <BusinessDocumentUpload
            ko={ko}
            kind="health-cert"
            label={ko ? "보건증 (건강진단결과서)" : "Health Cert"}
            hint={ko ? "보건소 발급 (장티푸스·결핵 검사). 1년 만료 — 만료 시 재발급 필요." : "Health center, expires after 1yr"}
            multiple
          />
        )}
      </div>
      {note && <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--muted)", lineHeight: 1.55 }}>{note}</div>}
    </div>
  );
}

function renderSection(
  section: Section,
  key: number,
  ctx: { content: StageContent; cat: CategoryContent; catId: string; categoryLabel: string; ko: boolean },
): ReactNode {
  const { content, cat, catId, categoryLabel, ko } = ctx;

  switch (section.kind) {
    case "whyList": {
      const Icon = Lightbulb;
      return (
        <SectionCard key={key} icon={Icon} title={section.eyebrow ?? ""} subtitle={section.subtitle}>
          <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {section.items.map((item, idx, arr) => (
              <div key={item.title}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "100px", background: ACCENT_COLOR[item.accent], marginTop: "8px", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", lineHeight: 1.4, marginBottom: "4px" }}>{item.title}</div>
                    <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>{item.body}</div>
                  </div>
                </div>
                {idx < arr.length - 1 && <div style={{ height: "1px", background: "rgba(0,0,0,0.05)", marginLeft: "18px", marginTop: "10px" }} />}
              </div>
            ))}
          </div>
        </SectionCard>
      );
    }

    case "stepList": {
      const Icon = section.icon ? ICONS[section.icon] : undefined;
      return (
        <SectionCard key={key} icon={Icon} title={section.eyebrow} subtitle={section.subtitle}>
          {section.steps.map((step, i) => {
            const extra = step.detailFromCategory ? ` ${String(cat[step.detailFromCategory] ?? "")}`.trimEnd() : "";
            return (
              <StepRow key={step.title} number={i + 1} title={step.title} detail={`${step.detail}${extra}`} isLast={i === section.steps.length - 1 && !section.meta && !section.links} />
            );
          })}
          {section.meta && section.meta.length > 0 && (
            <div style={{ display: "flex", gap: "8px", padding: "14px 16px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
              {section.meta.map((m) => <MetaPair key={m.label} label={m.label} value={m.value} sublabel={m.sublabel} />)}
            </div>
          )}
          {section.links && section.links.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", padding: "0 16px 14px" }}>
              {section.links.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}`, fontSize: "12px", fontWeight: 600, color: MIDNIGHT, textDecoration: "none" }}>
                  {link.label} <ExternalLink size={12} strokeWidth={2.2} />
                </a>
              ))}
            </div>
          )}
        </SectionCard>
      );
    }

    case "permit":
      return <PermitSection key={key} icon={section.icon} cat={cat} categoryLabel={categoryLabel} />;

    case "pitfalls":
      return (
        <div key={key} style={{ marginBottom: "20px", padding: "14px 18px", borderRadius: "14px", background: "rgba(182,76,76,0.04)", border: "1px solid rgba(182,76,76,0.18)", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <AlertTriangle size={18} strokeWidth={2.2} color="#b64c4c" style={{ flexShrink: 0, marginTop: "1px" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#b64c4c", marginBottom: "4px" }}>{section.title}</div>
            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12.5px", color: "rgba(15,23,42,0.75)", lineHeight: 1.6 }}>
              {cat.pitfalls.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
        </div>
      );

    case "pathCards": {
      const Icon = section.icon ? ICONS[section.icon] : undefined;
      return (
        <SectionCard key={key} icon={Icon} title={section.eyebrow} subtitle={section.subtitle}>
          <div style={{ padding: "14px 16px" }}>
            {section.cards.map((c) => <PathCardView key={c.condition} {...c} />)}
            {section.includeCategoryPath && cat.extraPath && <PathCardView {...cat.extraPath} />}
          </div>
        </SectionCard>
      );
    }

    case "checklist":
      return (
        <div key={key} style={{ marginTop: "8px", padding: "16px 18px", borderRadius: "14px", background: "rgba(25,25,112,0.04)", border: `1px dashed ${MIDNIGHT_BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <Sparkles size={14} strokeWidth={2.2} color={MIDNIGHT} />
            <div style={{ fontSize: "12.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.02em" }}>{section.eyebrow}</div>
          </div>
          <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "12.5px", lineHeight: 1.75, color: "rgba(15,23,42,0.78)" }}>
            {cat.weeklyChecklist.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </div>
      );

    case "infoCard": {
      const Icon = section.icon ? ICONS[section.icon] : ArrowRight;
      return (
        <div key={key} style={{ marginTop: "12px", padding: "16px 18px", borderRadius: "14px", background: "rgba(25,25,112,0.05)", border: `1px solid ${MIDNIGHT_BORDER}`, display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: MIDNIGHT_SOFT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={16} strokeWidth={2.2} color={MIDNIGHT} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, marginBottom: "4px" }}>{section.title}</div>
            <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.55 }}>{section.body}</div>
          </div>
        </div>
      );
    }

    case "wrapup":
      return (
        <StageWrapup
          key={key}
          ko={ko}
          nextStageLabelKo={content.wrapup.nextStageLabel}
          doneItemsKo={content.wrapup.doneItems}
          verifyItemsKo={content.wrapup.verifyItems}
          nextSummaryKo={content.wrapup.nextSummary}
        />
      );

    case "interactive": {
      const platforms = section.platforms ?? ["web", "ios"];
      if (!platforms.includes("web")) return null;
      switch (section.ref) {
        case "storeName":
          return (
            <div key={key} style={{ marginBottom: "14px" }}>
              <StoreNameInput helperText={section.config?.helperText as string | undefined} />
            </div>
          );
        case "docUpload":
          return <DocUploadSection key={key} cat={catId} ko={ko} config={section.config} />;
        default:
          // hometaxLink·bizRegToggle·permitToggle·taxTypeSelect 는 현재 iOS 전용(웹은 path/links 로 커버).
          return null;
      }
    }

    default:
      return null;
  }
}

/* ───────────────────────── 메인 ───────────────────────── */

export function StageContentRenderer({ content }: { content: StageContent }) {
  const d = useDashboardCtx();
  const { industryCategoryId, language } = d;
  const ko = language === "ko";

  const [page, setPage] = useState(0);

  const catId = industryCategoryId && content.byCategory[industryCategoryId] ? industryCategoryId : "food";
  const cat = content.byCategory[catId];
  const categoryLabel = cat.label;
  const pageLabels = useMemo(() => content.pages.map((p) => p.label), [content]);

  const currentPage = content.pages[page] ?? content.pages[0];

  return (
    <div className="bento-fade-in" style={{ marginBottom: "16px" }}>
      <StartupKeyActionHero
        eyebrow={content.keyAction.eyebrow}
        title={content.keyAction.title}
        subtitle={content.keyAction.subtitle}
        miniCards={content.keyAction.miniCards.map((m) => ({ icon: ICONS[m.icon], label: m.label, detail: m.detail }))}
      />

      <div style={{ marginBottom: "16px" }}>
        <StartupPageNav page={page} totalPages={content.pages.length} labels={pageLabels} onChange={setPage} />
      </div>

      {currentPage.sections.map((section, i) =>
        renderSection(section, i, { content, cat, catId, categoryLabel, ko }),
      )}
    </div>
  );
}

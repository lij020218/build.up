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
  Banknote,
  ClipboardList,
  Percent,
  CreditCard,
  Users,
  Award,
  Calendar,
  ChevronRight,
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
import { TaxFaqCard } from "./TaxFaqCard";
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
  banknote: Banknote,
  clipboard: ClipboardList,
  percent: Percent,
  creditCard: CreditCard,
  users: Users,
  rosette: Award,
  calendar: Calendar,
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
  if (!p) return null;
  const reqPermits = cat.requiredPermits ?? [];
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
          {reqPermits.map((rp) => (
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

/** 필수 세무 세팅 체크리스트(웹) — DashboardContext taxChecks 바인딩. */
function TaxChecklistWidget({
  items, checks, setChecks, config, ko,
}: {
  items: Array<{ id: string; label: string; detail: string; required?: boolean }>;
  checks: Record<string, boolean>;
  setChecks: (fn: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  config?: Record<string, unknown>;
  ko: boolean;
}) {
  const done = items.filter((t) => checks[t.id]).length;
  const total = items.length;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={sectionLabelStyle}>{(config?.title as string) ?? (ko ? "필수 세무 세팅" : "Required Tax Setup")}</span>
        <span style={{ fontSize: "11.5px", fontWeight: 700, color: done === total ? "#fff" : "var(--text)", background: done === total ? "rgb(29,53,87)" : "rgba(0,0,0,0.08)", padding: "3px 10px", borderRadius: "999px" }}>{done} / {total}</span>
      </div>
      <div style={{ height: "3px", borderRadius: "999px", background: "rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: "12px" }}>
        <div style={{ height: "100%", width: `${total ? (done / total) * 100 : 0}%`, background: MIDNIGHT, borderRadius: "999px", transition: "width 0.35s" }} />
      </div>
      <CardShell>
        {items.map((item, idx) => {
          const isDone = !!checks[item.id];
          return (
            <div key={item.id}>
              {idx > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
              <button type="button" onClick={() => setChecks((prev) => ({ ...prev, [item.id]: !prev[item.id] }))} style={{ display: "flex", gap: "14px", alignItems: "flex-start", width: "100%", textAlign: "left", padding: "14px 16px", background: isDone ? "rgba(25,25,112,0.03)" : "transparent", border: "none", cursor: "pointer" }}>
                <div style={{ flexShrink: 0, marginTop: "2px", width: 22, height: 22, borderRadius: 7, border: isDone ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: isDone ? MIDNIGHT : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isDone && (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: isDone ? "rgba(0,0,0,0.32)" : "var(--text)", textDecoration: isDone ? "line-through" : "none", letterSpacing: "-0.01em", lineHeight: 1.45 }}>{item.label}</div>
                  {!isDone && <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(0,0,0,0.55)", marginTop: "3px" }}>{item.detail}</div>}
                </div>
              </button>
            </div>
          );
        })}
      </CardShell>
    </div>
  );
}

/** 세무 처리 방식 선택(웹) — DashboardContext cpaDecision 바인딩. */
function CpaDecisionWidget({
  config, value, onSelect,
}: {
  config?: Record<string, unknown>;
  value: string | null;
  onSelect: (v: string) => void;
}) {
  const eyebrow = (config?.eyebrow as string) ?? "내 세무 처리 방식 선택";
  const options = (config?.options as Array<{ value: string; title: string; desc?: string }>) ?? [];
  return (
    <div style={{ marginTop: "18px" }}>
      <div style={sectionLabelStyle}>{eyebrow}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {options.map((opt) => {
          const sel = value === opt.value;
          return (
            <button key={opt.value} type="button" onClick={() => { onSelect(opt.value); if (typeof window !== "undefined") localStorage.setItem("cpaDecision", opt.value); }} style={{ padding: "16px", borderRadius: "16px", cursor: "pointer", textAlign: "left", background: sel ? "rgba(25,25,112,0.06)" : "white", border: sel ? `2px solid ${MIDNIGHT}` : "1px solid rgba(0,0,0,0.08)", boxShadow: sel ? "0 4px 14px rgba(25,25,112,0.12)" : "0 1px 3px rgba(0,0,0,0.03)", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: sel ? `6px solid ${MIDNIGHT}` : "2px solid rgba(0,0,0,0.15)", transition: "all 0.2s" }} />
                <div style={{ fontSize: "14.5px", fontWeight: 700, color: sel ? MIDNIGHT : "var(--text)", letterSpacing: "-0.01em" }}>{opt.title}</div>
              </div>
              {opt.desc && <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55 }}>{opt.desc}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type InteractiveBindings = {
  taxChecks: Record<string, boolean>;
  setTaxChecks: (fn: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  cpaDecision: string | null;
  setCpaDecision: (v: string) => void;
  faq: {
    qaText: string;
    setQaText: (v: string) => void;
    qaStatus: "idle" | "loading" | "error";
    qaError: string;
    askAi: () => void;
  };
};

function renderSection(
  section: Section,
  key: number,
  ctx: {
    content: StageContent;
    cat: CategoryContent;
    catId: string;
    categoryLabel: string;
    pageId: string;
    ko: boolean;
    iact: InteractiveBindings;
  },
): ReactNode {
  const { content, cat, catId, categoryLabel, pageId, ko, iact } = ctx;

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
              {(cat.pitfalls ?? []).map((p) => <li key={p}>{p}</li>)}
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
            {(cat.weeklyChecklist ?? []).map((item) => <li key={item}>{item}</li>)}
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

    case "pageKeyAction": {
      const ka = cat.pageKeyActions?.[pageId];
      if (!ka) return null;
      const Icon = section.icon ? ICONS[section.icon] : ShieldCheck;
      return (
        <div key={key} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "16px 18px", borderRadius: "16px", background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`, color: "#fff", marginBottom: "18px", boxShadow: "0 6px 20px rgba(25,25,112,0.28)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={20} strokeWidth={2.2} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7, marginBottom: "4px" }}>
              {ko ? "이 단계에서 꼭 할 일" : "Do this in this stage"}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.4, marginBottom: "5px" }}>{ka.title}</div>
            <div style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.92 }}>{ka.detail}</div>
          </div>
        </div>
      );
    }

    case "scheduleList": {
      const rows = cat.schedule ?? [];
      if (rows.length === 0) return null;
      return (
        <div key={key}>
          <div style={sectionLabelStyle}>{section.eyebrow}</div>
          <CardShell>
            {rows.map((row, i) => (
              <div key={row.title}>
                {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "16px" }} />}
                <div style={{ display: "flex", alignItems: "flex-start", padding: "13px 16px", gap: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#fff", background: MIDNIGHT, padding: "4px 8px", borderRadius: "6px", flexShrink: 0, whiteSpace: "nowrap" }}>{row.date}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{row.title}</div>
                    <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.55)", lineHeight: 1.5, marginTop: "2px" }}>{row.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardShell>
        </div>
      );
    }

    case "iconCardList": {
      const cards = cat.taxTips ?? [];
      if (cards.length === 0) return null;
      return (
        <div key={key}>
          <div style={sectionLabelStyle}>{section.eyebrow}</div>
          {section.subtitle && <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55, marginBottom: "12px" }}>{section.subtitle}</div>}
          <CardShell>
            {cards.map((tip, i) => {
              const Icon = ICONS[tip.icon];
              return (
                <div key={tip.label}>
                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: MIDNIGHT_SOFT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: MIDNIGHT }}>
                      <Icon size={17} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "3px" }}>{tip.label}</div>
                      <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55 }}>{tip.detail}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardShell>
        </div>
      );
    }

    case "calloutWarning": {
      const items = cat.trapsByPage?.[pageId] ?? [];
      if (items.length === 0) return null;
      const warn = section.severity === "warn";
      const c = warn ? "#b8860b" : "#b64c4c";
      const bg = warn ? "rgba(184,134,11,0.05)" : "rgba(182,76,76,0.04)";
      const border = warn ? "rgba(184,134,11,0.18)" : "rgba(182,76,76,0.14)";
      return (
        <div key={key} style={{ display: "grid", gap: "8px", marginTop: "8px" }}>
          {section.title && <div style={{ fontSize: "12px", fontWeight: 700, color: c, letterSpacing: "0.02em" }}>{section.title}</div>}
          {items.map((t) => (
            <div key={t.label} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "13px 15px", borderRadius: "14px", background: bg, border: `1px solid ${border}` }}>
              <AlertTriangle size={18} strokeWidth={2} style={{ color: c, flexShrink: 0, marginTop: "1px" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: c, marginBottom: "3px", letterSpacing: "-0.01em" }}>{t.label}</div>
                <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(80,50,20,0.85)" }}>{t.text}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "comparisonCards":
      return (
        <SectionCard key={key} title={section.eyebrow}>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {section.cards.map((c) => (
              <div key={c.title}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "3px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: MIDNIGHT }}>{c.title}</div>
                  {c.criteria && <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>{c.criteria}</div>}
                </div>
                <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      );

    case "cpaCriteria": {
      const needs = cat.cpaNeeded ?? [];
      if (needs.length === 0) return null;
      return (
        <div key={key}>
          <div style={sectionLabelStyle}>{section.eyebrow}</div>
          {section.subtitle && <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55, marginBottom: "12px" }}>{section.subtitle}</div>}
          <CardShell>
            {needs.map((n, i) => {
              const rec = n.recommend ?? true;
              return (
                <div key={n.condition}>
                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: rec ? "rgba(48,168,78,0.10)" : "rgba(0,0,0,0.05)", color: rec ? "#2f8f4e" : "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "16px", fontWeight: 800 }}>
                      {rec ? "✓" : "–"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "3px" }}>{n.condition}</div>
                      <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55 }}>{n.reason}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardShell>
        </div>
      );
    }

    case "linkCards":
      return (
        <div key={key}>
          <div style={sectionLabelStyle}>{section.eyebrow}</div>
          <CardShell>
            {section.links.map((link, i) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 16px", borderTop: i > 0 ? "0.5px solid rgba(0,0,0,0.07)" : "none", textDecoration: "none", color: "inherit" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>{link.badge}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{link.name}</div>
                  <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", marginTop: "2px" }}>{link.desc}</div>
                </div>
                <ChevronRight size={16} strokeWidth={2} style={{ color: "rgba(0,0,0,0.25)", flexShrink: 0 }} />
                <ExternalLink size={12} strokeWidth={2} style={{ color: "rgba(0,0,0,0.2)", flexShrink: 0 }} />
              </a>
            ))}
          </CardShell>
        </div>
      );

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
        case "taxChecklist":
          return <TaxChecklistWidget key={key} items={cat.taxChecklist ?? []} checks={iact.taxChecks} setChecks={iact.setTaxChecks} config={section.config} ko={ko} />;
        case "cpaDecision":
          return <CpaDecisionWidget key={key} config={section.config} value={iact.cpaDecision} onSelect={iact.setCpaDecision} />;
        case "taxFaq":
          return <TaxFaqCard key={key} ko={ko} {...iact.faq} />;
        default:
          // hometaxLink·bizRegToggle·permitToggle·taxTypeSelect·vatCalendarToggle 는 현재 iOS 전용.
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
  const {
    industryCategoryId, language,
    taxChecks, setTaxChecks,
    cpaDecision, setCpaDecision,
    knowledgeQaText, setKnowledgeQaText,
    knowledgeQaStatus, knowledgeQaError,
    handleKnowledgeQuestion,
  } = d;
  const ko = language === "ko";

  const [page, setPage] = useState(0);

  const catId = industryCategoryId && content.byCategory[industryCategoryId] ? industryCategoryId : "food";
  const cat = content.byCategory[catId];
  const categoryLabel = cat.label;
  const pageLabels = useMemo(() => content.pages.map((p) => p.label), [content]);

  const currentPage = content.pages[page] ?? content.pages[0];
  const keyAction = content.keyAction;

  const iact: InteractiveBindings = {
    taxChecks,
    setTaxChecks,
    cpaDecision,
    setCpaDecision: (v: string) => setCpaDecision(v as "self" | "cpa"),
    faq: {
      qaText: knowledgeQaText,
      setQaText: setKnowledgeQaText,
      qaStatus: knowledgeQaStatus,
      qaError: knowledgeQaError,
      askAi: () => handleKnowledgeQuestion("tax"),
    },
  };

  return (
    <div className="bento-fade-in" style={{ marginBottom: "16px" }}>
      {keyAction && (
        <StartupKeyActionHero
          eyebrow={keyAction.eyebrow}
          title={keyAction.title}
          subtitle={keyAction.subtitle}
          miniCards={(keyAction.miniCards ?? []).map((m) => ({ icon: ICONS[m.icon], label: m.label, detail: m.detail }))}
        />
      )}

      <div style={{ marginBottom: "16px" }}>
        <StartupPageNav page={page} totalPages={content.pages.length} labels={pageLabels} onChange={setPage} />
      </div>

      {currentPage.sections.map((section, i) =>
        renderSection(section, i, { content, cat, catId, categoryLabel, pageId: currentPage.id, ko, iact }),
      )}

      {/* wrapupMode="always" — 모든 페이지 하단에 마무리 표시(tax-guide 등). */}
      {content.wrapupMode === "always" && (
        <StageWrapup
          ko={ko}
          nextStageLabelKo={content.wrapup.nextStageLabel}
          doneItemsKo={content.wrapup.doneItems}
          verifyItemsKo={content.wrapup.verifyItems}
          nextSummaryKo={content.wrapup.nextSummary}
        />
      )}
    </div>
  );
}

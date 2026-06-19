"use client";

/**
 * SectionRenderer — Apple Settings 톤 섹션 카드.
 *
 * 두 모드:
 *   1) fields[]  → settings-list (label-row, hairline divider)
 *   2) arrayItem → 항목 리스트 (각 항목 한 줄 요약 + 펼침)
 *
 * 종이 양식 → settings 카드 톤으로 전면 리디자인.
 */

import { useState } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight as ChevRight,
  Pencil, Check, X,
  Building2, ShieldCheck, Wallet, Users, Umbrella, Building, Globe, Car,
  Utensils, ChefHat, Bike, Coffee, Tag, Truck, Scissors, Sparkles, Calendar,
  Award, Ticket, Dumbbell, GraduationCap, FileText, Heart, PackageOpen, Wrench,
  Home, CalendarCheck, Speaker, ShoppingBag, Copyright, Cloud, TrendingUp, Stamp,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { FieldRenderer } from "./FieldRenderer";
import {
  card, sectionHeader, sectionTitle, sectionSubtitle, sectionBody,
  ghostButton, subtleButton, ddayPill, PALETTE,
  editBtnStyle, saveBtnStyle, cancelBtnStyle,
} from "./styles";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import type { SectionSpec, FieldSpec } from "../../data/store-info-schema";

const ICON_MAP: Record<string, LucideIcon> = {
  Building2, ShieldCheck, Wallet, Users, Umbrella, Building, Globe, Car,
  Utensils, ChefHat, Bike, Coffee, Tag, Truck, Scissors, Sparkles, Calendar,
  Award, Ticket, Dumbbell, GraduationCap, FileText, Heart, PackageOpen, Wrench,
  Home, CalendarCheck, Speaker, ShoppingBag, Copyright, Cloud, TrendingUp, Stamp,
};

type ArrayValue = Array<Record<string, unknown> & { id: string }>;

type Props = {
  section: SectionSpec;
  ko: boolean;
  objectValue?: Record<string, unknown>;
  onObjectFieldChange?: (key: string, value: unknown) => void;
  arrayValue?: ArrayValue;
  onArrayAdd?: (newItem: Record<string, unknown>) => void;
  onArrayUpdate?: (id: string, patch: Record<string, unknown>) => void;
  onArrayRemove?: (id: string) => void;
  recommendedPrefills?: Array<{ name: string; type?: string; helper?: string }>;
};

function daysUntil(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function SectionRenderer({
  section, ko,
  objectValue, onObjectFieldChange,
  arrayValue, onArrayAdd, onArrayUpdate, onArrayRemove,
  recommendedPrefills,
}: Props) {
  const Icon = ICON_MAP[section.icon] ?? Building2;
  const filledCount = countFilled(section, objectValue, arrayValue);

  // ── Object 모드 수정/저장 ── (Array 모드는 add/remove 가 이미 명시적이라 그대로)
  const isObjectMode = !!(section.fields && objectValue && onObjectFieldChange);
  const d = useDashboardCtx();
  const flushStoreDataImmediate = d.flushStoreDataImmediate;
  const [editing, setEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleEdit = () => {
    setSnapshot(objectValue ? { ...objectValue } : {});
    setSaveStatus("idle");
    setSaveError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    // snapshot 의 각 field 값으로 store 복원
    if (snapshot && onObjectFieldChange && section.fields) {
      for (const f of section.fields) {
        const original = snapshot[f.key];
        const current = objectValue?.[f.key];
        if (!Object.is(original, current)) {
          onObjectFieldChange(f.key, original);
        }
      }
    }
    setEditing(false);
    setSnapshot(null);
    setSaveStatus("idle");
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    setSaveError(null);
    try {
      // 변경사항은 이미 onObjectFieldChange 로 store 에 반영됨. flush 만 호출.
      await flushStoreDataImmediate();
      setSaveStatus("saved");
      setEditing(false);
      setSnapshot(null);
      setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : (ko ? "저장에 실패했습니다." : "Save failed."));
    }
  };

  return (
    <section id={section.id} style={card}>
      {/* Header */}
      <header style={sectionHeader}>
        <div style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          background: PALETTE.MIDNIGHT_8,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={17} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: PALETTE.MIDNIGHT }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={sectionTitle}>{ko ? section.title : section.titleEn ?? section.title}</div>
          {section.subtitle && <div style={sectionSubtitle}>{section.subtitle}</div>}
        </div>
        {filledCount.show && (
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: filledCount.filled === filledCount.total ? PALETTE.SUCCESS : PALETTE.MUTED,
            background: filledCount.filled === filledCount.total ? "rgba(29,53,87,0.10)" : PALETTE.MIDNIGHT_4,
            padding: "4px 10px",
            borderRadius: 999,
            fontVariantNumeric: "tabular-nums" as const,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap" as const,
            flexShrink: 0,
          }}>
            {filledCount.filled}/{filledCount.total}
          </div>
        )}
        {/* 수정/저장/취소 버튼 — Object 모드만 */}
        {isObjectMode && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            {saveStatus === "saved" && (
              <span style={{ fontSize: 11, color: PALETTE.SUCCESS, fontWeight: 600 }}>
                {ko ? "✓ 저장됨" : "✓ Saved"}
              </span>
            )}
            {saveStatus === "error" && saveError && (
              <span style={{ fontSize: 11, color: "#b42334", fontWeight: 600, maxWidth: 180, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                ⚠ {saveError}
              </span>
            )}
            {!editing ? (
              <button type="button" onClick={handleEdit} style={editBtnStyle}>
                <Pencil size={11} strokeWidth={2} />
                <span>{ko ? "수정" : "Edit"}</span>
              </button>
            ) : (
              <>
                <button type="button" onClick={handleCancel} disabled={saveStatus === "saving"} style={cancelBtnStyle}>
                  <X size={11} strokeWidth={2} />
                  <span>{ko ? "취소" : "Cancel"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveStatus === "saving"}
                  style={{
                    ...saveBtnStyle,
                    opacity: saveStatus === "saving" ? 0.6 : 1,
                    cursor: saveStatus === "saving" ? "wait" : "pointer",
                  }}
                >
                  <Check size={11} strokeWidth={2} />
                  <span>{saveStatus === "saving" ? (ko ? "저장 중…" : "Saving…") : (ko ? "저장" : "Save")}</span>
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Object 모드: settings-list — editing=false 일 때 input 잠금 */}
      {section.fields && objectValue && onObjectFieldChange && (
        <div
          style={{
            ...sectionBody,
            ...(editing ? null : { pointerEvents: "none" as const, opacity: 0.78 }),
            transition: "opacity 0.15s ease",
          }}
          aria-readonly={!editing}
        >
          {section.fields.map((f, i) => (
            <FieldRenderer
              key={f.key}
              field={f}
              value={objectValue[f.key]}
              onChange={(v) => onObjectFieldChange(f.key, v)}
              ko={ko}
              isLast={i === section.fields!.length - 1}
            />
          ))}
        </div>
      )}

      {/* Array 모드: 항목 리스트 */}
      {section.arrayItem && arrayValue !== undefined && onArrayAdd && onArrayUpdate && onArrayRemove && (
        <ArrayEditor
          spec={section.arrayItem}
          value={arrayValue}
          onAdd={onArrayAdd}
          onUpdate={onArrayUpdate}
          onRemove={onArrayRemove}
          recommendedPrefills={recommendedPrefills}
          ko={ko}
        />
      )}
    </section>
  );
}

function countFilled(
  section: SectionSpec,
  objectValue?: Record<string, unknown>,
  arrayValue?: ArrayValue,
): { show: boolean; filled: number; total: number } {
  if (section.fields && objectValue) {
    const required = section.fields.filter((f) => !f.optional);
    if (required.length === 0) return { show: false, filled: 0, total: 0 };
    let filled = 0;
    for (const f of required) {
      const v = objectValue[f.key];
      if (Array.isArray(v) ? v.length > 0 : !!(v ?? "").toString().trim()) filled++;
    }
    return { show: true, filled, total: required.length };
  }
  if (section.arrayItem && arrayValue) {
    return { show: arrayValue.length > 0, filled: arrayValue.length, total: arrayValue.length };
  }
  return { show: false, filled: 0, total: 0 };
}

/* ──────────────────────────────────────────────────────────────────── */

type ArrayEditorProps = {
  spec: NonNullable<SectionSpec["arrayItem"]>;
  value: ArrayValue;
  onAdd: (newItem: Record<string, unknown>) => void;
  onUpdate: (id: string, patch: Record<string, unknown>) => void;
  onRemove: (id: string) => void;
  recommendedPrefills?: Array<{ name: string; type?: string; helper?: string }>;
  ko: boolean;
};

function ArrayEditor({ spec, value, onAdd, onUpdate, onRemove, recommendedPrefills, ko }: ArrayEditorProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const addEmpty = (prefill?: Record<string, unknown>) => {
    onAdd(prefill ?? {});
  };

  const empty = value.length === 0;

  return (
    <>
      {/* 권장 prefill chips */}
      {recommendedPrefills && recommendedPrefills.length > 0 && (
        <div style={{ padding: "14px 24px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", borderBottom: `1px solid ${PALETTE.HAIRLINE}` }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, color: PALETTE.MIDNIGHT, opacity: 0.65,
            letterSpacing: "0.05em", textTransform: "uppercase" as const, marginRight: 4,
          }}>
            {ko ? "업종 권장" : "Suggested"}
          </span>
          {recommendedPrefills.map((p, i) => {
            const alreadyAdded = value.some((v) => v.name === p.name);
            return (
              <button
                key={i}
                type="button"
                disabled={alreadyAdded}
                onClick={() => {
                  const prefill: Record<string, unknown> = { name: p.name };
                  if (p.type) prefill.type = p.type;
                  addEmpty(prefill);
                }}
                title={p.helper}
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "5px 11px",
                  borderRadius: 999,
                  border: `1px solid ${PALETTE.HAIRLINE}`,
                  background: alreadyAdded ? PALETTE.MIDNIGHT_4 : "white",
                  color: alreadyAdded ? PALETTE.GHOST : PALETTE.MIDNIGHT,
                  cursor: alreadyAdded ? "default" : "pointer",
                  fontFamily: "inherit",
                  textDecoration: alreadyAdded ? "line-through" : "none",
                  transition: "background 0.15s ease",
                }}
              >
                {alreadyAdded ? "✓ " : "+ "}{p.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 빈 상태 */}
      {empty && (
        <div style={{
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center" as const,
          gap: 10,
          color: PALETTE.MUTED,
          textAlign: "center" as const,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: PALETTE.MIDNIGHT_4,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: PALETTE.MIDNIGHT, opacity: 0.55,
          }}>
            <Inbox size={20} strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.55, maxWidth: 360 }}>
            {ko ? spec.emptyText ?? "아래 + 버튼으로 첫 항목을 등록하세요" : spec.emptyTextEn ?? "Click + below to add the first item"}
          </div>
        </div>
      )}

      {/* 항목 리스트 */}
      {value.map((item, idx) => {
        const isOpen = openIds.has(item.id);
        const titleVal = (item[spec.titleField] as string | undefined) ?? "";
        const expiryVal = spec.expiryKey ? (item[spec.expiryKey] as string | undefined) : undefined;
        const days = daysUntil(expiryVal);
        const isLast = idx === value.length - 1;

        return (
          <div
            key={item.id}
            style={{
              borderBottom: !isLast ? `1px solid ${PALETTE.HAIRLINE}` : "none",
            }}
          >
            {/* 한 줄 요약 — 클릭하면 펼침 */}
            <button
              type="button"
              onClick={() => toggle(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "14px 24px",
                background: isOpen ? PALETTE.MIDNIGHT_4 : "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left" as const,
                fontFamily: "inherit",
                transition: "background 0.15s ease",
              }}
            >
              {isOpen
                ? <ChevronDown size={14} strokeWidth={1.5} style={{ color: PALETTE.MIDNIGHT, flexShrink: 0 }} />
                : <ChevRight size={14} strokeWidth={1.5} style={{ color: PALETTE.GHOST, flexShrink: 0 }} />}
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                color: titleVal ? PALETTE.MIDNIGHT_DEEP : PALETTE.GHOST,
                letterSpacing: "-0.01em",
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
              }}>
                {titleVal || (ko ? "(이름 없음)" : "(unnamed)")}
              </span>
              {days !== null && (
                <span style={ddayPill(days)}>
                  {days < 0 ? `D+${-days}` : days === 0 ? (ko ? "오늘" : "Today") : `D-${days}`}
                </span>
              )}
              <span
                role="button"
                aria-label={ko ? "삭제" : "Delete"}
                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                style={{
                  ...subtleButton,
                  padding: "4px 8px",
                  color: PALETTE.DANGER,
                  borderColor: "rgba(182,76,76,0.20)",
                  display: "inline-flex",
                  alignItems: "center" as const,
                }}
              >
                <Trash2 size={11} strokeWidth={1.5} />
              </span>
            </button>

            {/* 펼침 — 전체 필드 편집 (settings-list 스타일) */}
            {isOpen && (
              <div style={{ borderTop: `1px solid ${PALETTE.HAIRLINE}`, background: "white" }}>
                {spec.fields.map((f: FieldSpec, i) => (
                  <FieldRenderer
                    key={f.key}
                    field={f}
                    value={item[f.key]}
                    onChange={(v) => onUpdate(item.id, { [f.key]: v })}
                    ko={ko}
                    isLast={i === spec.fields.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* 추가 버튼 */}
      <div style={{ padding: "14px 24px", borderTop: empty ? "none" : `1px solid ${PALETTE.HAIRLINE}` }}>
        <button
          type="button"
          onClick={() => addEmpty()}
          style={ghostButton}
          onMouseEnter={(e) => { e.currentTarget.style.background = PALETTE.MIDNIGHT_4; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <Plus size={13} strokeWidth={1.5} style={{ verticalAlign: "middle", marginRight: 4 }} />
          {ko ? spec.addLabel : spec.addLabelEn ?? spec.addLabel}
        </button>
      </div>
    </>
  );
}


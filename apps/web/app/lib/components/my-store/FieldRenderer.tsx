"use client";

/**
 * FieldRenderer — Apple Settings 스타일 row 렌더.
 *
 * Inlineable 타입 (text, number, won, percent, date, time, select, phone, url, email):
 *   → 좌측 라벨 / 우측 입력 (borderless, 하단 hairline)
 *
 * Stack 타입 (textarea, multiselect):
 *   → 라벨 위, 입력 아래 full-width (soft fill bg)
 *
 * filled 여부에 따라 색감·굵기 변화 — 입력 안 된 row 는 회색으로 차분히 들어감.
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  rowLabel, rowLabelOptional, rowHelper,
  settingsRow, settingsRowFull,
  inlineInput, numberInput, textareaInput,
  PALETTE,
} from "./styles";
import type { FieldSpec } from "../../data/store-info-schema";

type Props = {
  field: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
  ko: boolean;
  /** 마지막 row 면 하단 보더 제거 */
  isLast?: boolean;
};

const STACK_TYPES = new Set<FieldSpec["type"]>(["textarea", "multiselect"]);

export function FieldRenderer({ field, value, onChange, ko, isLast }: Props) {
  const labelText = ko ? field.label : field.labelEn ?? field.label;
  const stringValue = (value as string | undefined) ?? "";
  const filled = (() => {
    if (Array.isArray(value)) return value.length > 0;
    if (value === null || value === undefined || value === "") return false;
    return true;
  })();

  const isStack = STACK_TYPES.has(field.type);
  const labelStyle: React.CSSProperties = field.optional ? rowLabelOptional : rowLabel;
  const rowBaseStyle: React.CSSProperties = isStack ? settingsRowFull : settingsRow;
  const rowStyle: React.CSSProperties = isLast ? { ...rowBaseStyle, borderBottom: "none" } : rowBaseStyle;

  if (isStack) {
    return (
      <div style={rowStyle}>
        <div style={labelStyle}>{labelText}</div>
        {renderStackInput(field, value, onChange, filled, ko)}
        {field.helper && <div style={rowHelper}>{field.helper}</div>}
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <div style={labelStyle}>
        {labelText}
        {field.helper && (
          <span style={{ fontSize: 11, color: PALETTE.HINT, fontWeight: 500, marginLeft: 4 }}>· {field.helper}</span>
        )}
      </div>
      {renderInlineInput(field, value, onChange, stringValue, filled, ko)}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * Inline input (라벨 우측, borderless, hairline)
 * ───────────────────────────────────────────────────────────────────── */
function renderInlineInput(
  field: FieldSpec,
  value: unknown,
  onChange: (v: unknown) => void,
  stringValue: string,
  filled: boolean,
  ko: boolean,
): React.ReactNode {
  switch (field.type) {
    case "text":
    case "phone":
    case "url":
    case "email":
      return (
        <input
          type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
          value={stringValue}
          placeholder={field.placeholder ?? "—"}
          onChange={(e) => onChange(e.target.value)}
          style={inlineInput(filled)}
        />
      );
    case "number":
    case "won":
    case "percent": {
      const numValue = value === null || value === undefined || value === "" ? "" : String(value);
      const unit = field.unit ?? (field.type === "won" ? "원" : field.type === "percent" ? "%" : "");
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
          <input
            type="number"
            value={numValue}
            placeholder={field.placeholder ?? "—"}
            inputMode="decimal"
            onChange={(e) => {
              const v = e.target.value;
              onChange(v === "" ? null : Number(v));
            }}
            style={{ ...numberInput(filled), maxWidth: 200 }}
          />
          {unit && (
            <span style={{ fontSize: 12, fontWeight: 500, color: filled ? PALETTE.MUTED : PALETTE.GHOST, fontVariantNumeric: "tabular-nums" as const }}>
              {unit}
            </span>
          )}
        </div>
      );
    }
    case "date":
      return (
        <input
          type="date"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inlineInput(filled), maxWidth: 180, color: filled ? PALETTE.INK : PALETTE.GHOST }}
        />
      );
    case "time":
      return (
        <input
          type="time"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inlineInput(filled), maxWidth: 140 }}
        />
      );
    case "select":
      return <SelectInline field={field} value={stringValue} onChange={onChange} filled={filled} ko={ko} />;
    default:
      return null;
  }
}

/* ─────────────────────────────────────────────────────────────────────
 * Stack input (라벨 아래 full-width)
 * ───────────────────────────────────────────────────────────────────── */
function renderStackInput(
  field: FieldSpec,
  value: unknown,
  onChange: (v: unknown) => void,
  filled: boolean,
  ko: boolean,
): React.ReactNode {
  if (field.type === "textarea") {
    return (
      <textarea
        value={(value as string | undefined) ?? ""}
        placeholder={field.placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={textareaInput(filled)}
      />
    );
  }
  if (field.type === "multiselect") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {field.options?.map((opt) => {
          const active = arr.includes(opt.value);
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => {
                const next = active ? arr.filter((v) => v !== opt.value) : [...arr, opt.value];
                onChange(next);
              }}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 999,
                border: active ? `1.5px solid ${PALETTE.MIDNIGHT}` : `1px solid ${PALETTE.HAIRLINE}`,
                background: active ? "rgba(25,25,112,0.06)" : "transparent",
                color: active ? PALETTE.MIDNIGHT_DEEP : PALETTE.MUTED,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
            >
              {ko ? opt.label : opt.labelEn ?? opt.label}
            </button>
          );
        })}
      </div>
    );
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────────
 * Select — Apple SF style with custom chevron, no native arrow
 * ───────────────────────────────────────────────────────────────────── */

function SelectInline({
  field, value, onChange, filled, ko,
}: { field: FieldSpec; value: string; onChange: (v: unknown) => void; filled: boolean; ko: boolean }) {
  const [hover, setHover] = useState(false);
  const labelOf = (v: string) => field.options?.find((o) => o.value === v);
  const selected = labelOf(value);
  const display = selected ? (ko ? selected.label : selected.labelEn ?? selected.label) : (ko ? "선택…" : "Select…");

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        justifyContent: "flex-end",
        position: "relative" as const,
        cursor: "pointer",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none" as const,
          WebkitAppearance: "none" as const,
          MozAppearance: "none" as const,
          background: "transparent",
          border: "none",
          padding: "8px 22px 8px 0",
          fontSize: 14,
          fontWeight: filled ? 600 : 400,
          color: filled ? PALETTE.INK : PALETTE.GHOST,
          fontFamily: "inherit",
          textAlign: "right" as const,
          textAlignLast: "right" as const,
          outline: "none",
          cursor: "pointer",
          letterSpacing: "-0.005em",
          minWidth: 120,
          maxWidth: 240,
          borderBottom: `1px solid ${filled || hover ? PALETTE.MIDNIGHT_BORDER : "transparent"}`,
          transition: "border-color 0.15s ease",
        }}
      >
        {!selected && <option value="">{display}</option>}
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {ko ? opt.label : opt.labelEn ?? opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        strokeWidth={1.5}
        style={{
          position: "absolute" as const,
          right: 0,
          color: filled ? PALETTE.MIDNIGHT : PALETTE.GHOST,
          pointerEvents: "none" as const,
        }}
      />
    </div>
  );
}

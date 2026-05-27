"use client";

import { useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import { VENDOR_URL_MAP } from "../../../constants";
import { supabase } from "../../../../../lib/supabase";
import type { InventoryItem, InvForm } from "../../../stores/operations-store";
import {
  getFranchiseBrandById,
  getFranchiseSupplyInfo,
  getSupplyTypeColor,
} from "@build-up/shared";
import { getKstDate } from "../../../utils/business-day";

export function InventoryManagementCard() {
  const d = useDashboardCtx();
  const {
    language,
    inventory,
    invForm, setInvForm,
    emptyInvForm,
    businessCtx,
    saveInventory,
    handleInvSave, handleInvQty, handleInvDelete, openInvEdit, handleInvWaste, handleMarkOrdered,
    invCategoryFilter, setInvCategoryFilter,
    invWasteQty, setInvWasteQty,
    invWasteReason, setInvWasteReason,
    invWasteTarget, setInvWasteTarget,
    startupType,
    selectedFranchiseBrandId,
    vendorSelections,
    vendorCustomInputs,
  } = d;

  const [invShowAll, setInvShowAll] = useState(false);

  if (!businessCtx.showInventoryCard) return null;

  const ko = language === "ko";
  const todayStr = getKstDate(new Date());
  const currentMonth = todayStr.slice(0, 7);
  const UNITS = ["개", "kg", "g", "L", "ml", "봉지", "박스", "병", "캔"];
  const invStep = (unit: string) => ["kg", "L", "l"].includes(unit) ? 0.5 : 1;

  // ── 핵심 계산 함수 ──
  const daysLeft = (item: InventoryItem): number | null =>
    item.dailyUsage > 0 ? Math.floor(item.quantity / item.dailyUsage) : null;

  const expiryLeft = (item: InventoryItem): number | null => {
    if (!item.expiryDate) return null;
    return Math.ceil(
      (new Date(item.expiryDate + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000
    );
  };

  const needsOrderToday = (item: InventoryItem): boolean => {
    const d = daysLeft(item);
    return d !== null && d <= (item.leadTimeDays || 1);
  };

  const itemStatus = (item: InventoryItem): "urgent" | "warning" | "good" => {
    if (item.quantity === 0) return "urgent";
    if (needsOrderToday(item)) return "urgent";
    const exp = expiryLeft(item);
    if (exp !== null && exp <= 2) return "urgent";
    if (item.minThreshold > 0 && item.quantity <= item.minThreshold) return "warning";
    if (exp !== null && exp <= 5) return "warning";
    return "good";
  };

  const CAT: Record<string, { ko: string; en: string; color: string }> = {
    fresh:    { ko: "신선", en: "Fresh",    color: "#34c759" },
    dry:      { ko: "건식", en: "Dry",      color: "#ff9f0a" },
    frozen:   { ko: "냉동", en: "Frozen",   color: "#007aff" },
    beverage: { ko: "음료", en: "Beverage", color: "#30b0c7" },
    supply:   { ko: "소모품", en: "Supply", color: "#af52de" },
    other:    { ko: "기타", en: "Other",    color: "#8e8e93" },
  };
  const SC = { urgent: "#ff3b30", warning: "#ff9f0a", good: "#34c759" } as const;
  const SL = {
    urgent: { ko: "긴급", en: "Urgent" },
    warning: { ko: "주의", en: "Low" },
    good:   { ko: "충분", en: "OK" },
  } as const;

  // ── 필터 & 정렬 ──
  const SORT = { urgent: 0, warning: 1, good: 2 } as const;
  const filtered = invCategoryFilter === "all"
    ? inventory
    : inventory.filter(i => (i.category ?? "other") === invCategoryFilter);
  const sorted = [...filtered].sort((a, b) => SORT[itemStatus(a)] - SORT[itemStatus(b)]);

  // ── 통계 ──
  const urgentList  = inventory.filter(i => itemStatus(i) === "urgent");
  const orderCount  = inventory.filter(needsOrderToday).length;
  const totalValue  = inventory.reduce((s, i) => s + i.quantity * (i.unitCost || 0), 0);
  const wasteCost   = inventory.reduce((s, i) => {
    const w = (i.wasteLog ?? []).filter(e => e.date.startsWith(currentMonth)).reduce((a, e) => a + e.qty, 0);
    return s + w * (i.unitCost || 0);
  }, 0);

  const fmtV = (n: number) => n >= 10000 ? `${Math.round(n / 10000).toLocaleString()}만원` : `${Math.round(n).toLocaleString()}원`;
  const catCounts = Object.fromEntries(
    Object.keys(CAT).map(c => [c, inventory.filter(i => (i.category ?? "other") === c).length])
  );

  // ── 공통 스타일 ──
  const inputSt: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px",
    padding: "10px 13px", fontSize: "14px", outline: "none",
    background: "#fff", width: "100%", boxSizing: "border-box" as const,
  };
  const secLbl: React.CSSProperties = {
    fontSize: "11px", fontWeight: 700, color: "var(--muted)",
    textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "8px",
  };

  return (
    <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>

      {/* ── 헤더 ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 22px 16px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
            {businessCtx.inventoryLabel[language]}
          </div>
          {inventory.length > 0 && (
            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
              {ko ? `${inventory.length}개 품목 관리 중` : `${inventory.length} items tracked`}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button type="button"
            onClick={() => setInvForm({ ...emptyInvForm, open: true })}
            style={{ fontSize: "12px", fontWeight: 600, color: "#007aff", background: "rgba(0,122,255,0.08)", border: "none", borderRadius: "9px", padding: "6px 13px", cursor: "pointer" }}>
            {ko ? "+ 직접 추가" : "+ Add"}
          </button>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#34c759", cursor: "pointer", padding: "6px 13px", background: "rgba(52,199,89,0.08)", borderRadius: "9px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 2v12M2 8h12" /></svg>
            {ko ? "CSV" : "CSV"}
            <input type="file" accept=".csv,.tsv,.txt" aria-label={ko ? "재고 CSV 파일 업로드" : "Upload inventory CSV file"} style={{ display: "none" }} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              e.target.value = "";
              try {
                let text = "";
                const ext = file.name.split(".").pop()?.toLowerCase();
                if (ext === "csv" || ext === "tsv" || ext === "txt") {
                  text = await file.text();
                } else {
                  const buf = await file.arrayBuffer();
                  const bytes = new Uint8Array(buf);
                  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
                  catch { text = new TextDecoder("euc-kr", { fatal: false }).decode(bytes); }
                  if (text.includes("\0") || text.length < 10) {
                    alert(ko ? "지원하지 않는 파일 형식입니다." : "Unsupported file format.");
                    return;
                  }
                }
                if (!text.trim()) return;
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch("/api/ai/products/parse", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
                  body: JSON.stringify({ text: text.slice(0, 50000), language }),
                });
                const payload = await res.json();
                if (!res.ok || payload.error) { alert(payload.error ?? "Parse failed"); return; }
                const parsed = payload.products as { name: string; category: string; price: number; cost: number; stock: number; unit: string }[];
                if (!parsed?.length) { alert(ko ? "데이터를 찾을 수 없습니다." : "No data found."); return; }
                const newItems: InventoryItem[] = parsed.map((p) => ({
                  id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  name: p.name, quantity: p.stock, unit: p.unit || "개",
                  minThreshold: 0, unitCost: p.cost,
                  category: "other" as const,
                  itemType: "product" as const, sellingPrice: p.price ?? 0,
                  expiryDate: "", supplierName: "", supplierUrl: "",
                  leadTimeDays: 1, dailyUsage: 0, lastOrderedAt: "",
                  wasteLog: [],
                }));
                saveInventory([...inventory, ...newItems]);
                alert(ko ? `${newItems.length}개 품목 등록 완료` : `${newItems.length} items added`);
              } catch (err) { alert(ko ? `파일 처리 오류: ${err instanceof Error ? err.message : err}` : `File error: ${err}`); }
            }} />
          </label>
        </div>
      </div>

      {/* ── 발주 알림 배너 ── */}
      {urgentList.length > 0 && (
        <div style={{ padding: "12px 22px", background: "rgba(255,59,48,0.04)", borderBottom: "0.5px solid rgba(255,59,48,0.10)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#ff3b30", marginBottom: "2px" }}>
            {ko ? `지금 주문하세요 — ${urgentList.map(i => i.name).join(", ")}` : `Order now — ${urgentList.map(i => i.name).join(", ")}`}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(200,40,30,0.8)", lineHeight: 1.4 }}>
            {ko ? "리드타임 기준, 오늘 발주해야 재고 소진을 막을 수 있습니다." : "Based on lead times, order today to prevent stockouts."}
          </div>
        </div>
      )}

      {/* ── 3-col 요약 지표 ── */}
      {inventory.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
          {[
            { label: ko ? "총 재고 가치" : "Stock value",      value: totalValue > 0 ? fmtV(totalValue) : "—",                               color: "inherit" as const },
            { label: ko ? "이달 폐기 비용" : "Waste this month", value: wasteCost > 0 ? fmtV(wasteCost) : "—",                                color: wasteCost > 0 ? "#ff9f0a" : "inherit" as const },
            { label: ko ? "주문 필요" : "To order",             value: orderCount > 0 ? `${orderCount}${ko ? "건" : ""}` : ko ? "없음" : "—", color: orderCount > 0 ? "#ff3b30" : "#34c759" as const },
          ].map((m, idx) => (
            <div key={m.label} style={{ padding: "12px 14px", borderLeft: idx > 0 ? "0.5px solid rgba(0,0,0,0.07)" : "none" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "5px" }}>{m.label}</div>
              <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.4px", color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── 카테고리 필터 ── */}
      {inventory.length > 1 && (
        <div style={{ display: "flex", gap: "6px", padding: "11px 22px", overflowX: "auto" as const, borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
          {[
            { id: "all", label: ko ? "전체" : "All", count: inventory.length },
            ...Object.entries(CAT).filter(([c]) => catCounts[c] > 0).map(([c, v]) => ({
              id: c, label: ko ? v.ko : v.en, count: catCounts[c],
            })),
          ].map(tab => (
            <button key={tab.id} type="button" onClick={() => setInvCategoryFilter(tab.id)}
              style={{
                flexShrink: 0, fontSize: "11px", fontWeight: 600, border: "none",
                borderRadius: "8px", padding: "5px 11px", cursor: "pointer", transition: "background 0.15s, color 0.15s",
                background: invCategoryFilter === tab.id ? "#007aff" : "rgba(0,0,0,0.05)",
                color: invCategoryFilter === tab.id ? "#fff" : "var(--muted)",
              }}>
              {tab.label} {tab.count}
            </button>
          ))}
        </div>
      )}

      {/* ── 빈 상태 ── */}
      {inventory.length === 0 && !invForm.open && (
        <div style={{ padding: "24px 22px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.3px", marginBottom: "7px" }}>
            {ko ? "재고 관리로 폐업 위험을 줄이세요" : "Track inventory to reduce failure risk"}
          </div>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>
            {ko
              ? "단가와 1일 사용량을 입력하면 소진 예정일과 발주 시점을 자동 계산합니다. 유통기한 알림으로 신선재료 폐기 손실도 방지할 수 있습니다."
              : "Enter unit cost and daily usage to auto-predict depletion dates and reorder timing. Expiry alerts prevent fresh ingredient waste."}
          </div>
        </div>
      )}

      {/* ── 재고 목록 (기본 5개, 전체 보기 토글) ── */}
      {(invShowAll ? sorted : sorted.slice(0, 5)).map((item, idx) => {
        const s   = itemStatus(item);
        const sc  = SC[s];
        const d   = daysLeft(item);
        const exp = expiryLeft(item);
        const st  = invStep(item.unit);
        const cat = CAT[item.category ?? "other"];
        const val = item.quantity * (item.unitCost || 0);
        const lastOrderAge = item.lastOrderedAt
          ? Math.round((Date.now() - new Date(item.lastOrderedAt).getTime()) / 86400000)
          : null;
        const isWasting = invWasteTarget === item.id;
        const isLast = idx === sorted.length - 1;

        return (
          <div key={item.id} style={{
            padding: "16px 22px",
            borderBottom: (!isLast || invForm.open) ? "0.5px solid rgba(0,0,0,0.06)" : "none",
            background: s === "urgent" ? "rgba(255,59,48,0.018)" : s === "warning" ? "rgba(255,159,10,0.012)" : "transparent",
          }}>

            {/* 이름 · 카테고리 · 상태 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  {item.name}
                </span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: cat.color, background: `${cat.color}18`, borderRadius: "5px", padding: "2px 7px", flexShrink: 0 }}>
                  {ko ? cat.ko : cat.en}
                </span>
              </div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: sc, background: `${sc}18`, borderRadius: "6px", padding: "3px 8px", letterSpacing: "0.05em", flexShrink: 0, marginLeft: "8px" }}>
                {SL[s][ko ? "ko" : "en"]}
              </div>
            </div>

            {/* 핵심 인사이트 줄 */}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginBottom: "12px", alignItems: "center" }}>
              {d !== null ? (
                <span style={{ fontSize: "12px", fontWeight: 600, color: d <= (item.leadTimeDays || 1) ? "#ff3b30" : d <= 7 ? "#ff9f0a" : "var(--muted)" }}>
                  {d === 0 ? (ko ? "오늘 소진" : "Depletes today") : d === 1 ? (ko ? "내일 소진" : "Depletes tomorrow") : (ko ? `D-${d} 소진 예정` : `${d}d left`)}
                </span>
              ) : (
                <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.22)", fontStyle: "italic" }}>
                  {ko ? "사용량 미입력" : "No usage rate"}
                </span>
              )}
              {exp !== null && (
                <span style={{ fontSize: "12px", fontWeight: exp <= 2 ? 700 : 500, color: exp <= 0 ? "#ff3b30" : exp <= 2 ? "#ff3b30" : exp <= 5 ? "#ff9f0a" : "var(--muted)" }}>
                  {exp <= 0 ? (ko ? "유통기한 만료" : "Expired") : (ko ? `유통기한 D+${exp}` : `Exp D+${exp}`)}
                </span>
              )}
              {val > 0 && (
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>{fmtV(val)}</span>
              )}
              {lastOrderAge !== null && (
                <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.22)" }}>
                  {ko ? `발주 ${lastOrderAge}일 전` : `Ordered ${lastOrderAge}d ago`}
                </span>
              )}
            </div>

            {/* 수량 스테퍼 + 액션 버튼 */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
              {/* +/− 스테퍼 */}
              <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(0,0,0,0.11)", borderRadius: "10px", overflow: "hidden" }}>
                <button type="button" onClick={() => handleInvQty(item.id, -st)} disabled={item.quantity <= 0}
                  aria-label={ko ? `${item.name} 수량 감소` : `Decrease ${item.name} quantity`}
                  style={{ width: "36px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: item.quantity > 0 ? "pointer" : "default", fontSize: "20px", color: item.quantity > 0 ? "var(--primary)" : "rgba(0,0,0,0.18)", fontWeight: 300, lineHeight: 1 }}>
                  −
                </button>
                <div style={{ minWidth: "64px", textAlign: "center" as const, fontSize: "13px", fontWeight: 600, padding: "0 6px", borderLeft: "0.5px solid rgba(0,0,0,0.09)", borderRight: "0.5px solid rgba(0,0,0,0.09)" }} aria-live="polite">
                  {item.quantity}{item.unit}
                </div>
                <button type="button" onClick={() => handleInvQty(item.id, st)}
                  aria-label={ko ? `${item.name} 수량 증가` : `Increase ${item.name} quantity`}
                  style={{ width: "36px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--primary)", fontWeight: 300, lineHeight: 1 }}>
                  +
                </button>
              </div>

              {/* 주문하기 (긴급·주의) */}
              {(s === "urgent" || s === "warning") && (
                item.supplierUrl ? (
                  <a href={item.supplierUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "12px", fontWeight: 700, color: "#fff", background: "#007aff", textDecoration: "none", borderRadius: "9px", padding: "7px 14px" }}>
                    {ko ? "주문하기 ›" : "Order ›"}
                  </a>
                ) : (
                  <span style={{ fontSize: "11px", color: "#ff9f0a", background: "rgba(255,159,10,0.09)", borderRadius: "8px", padding: "6px 11px", fontWeight: 600 }}>
                    {item.supplierName ? item.supplierName : (ko ? "공급업체 미등록" : "No supplier")}
                  </span>
                )
              )}

              {/* 주문 완료 표시 (긴급·주의) */}
              {(s === "urgent" || s === "warning") && (
                <button type="button" onClick={() => handleMarkOrdered(item.id)}
                  style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "8px", padding: "6px 11px", cursor: "pointer" }}>
                  {ko ? "주문 완료" : "Ordered"}
                </button>
              )}

              {/* 폐기 기록 */}
              <button type="button"
                onClick={() => { setInvWasteTarget(isWasting ? null : item.id); setInvWasteQty(""); setInvWasteReason(""); }}
                style={{ fontSize: "11px", fontWeight: 500, color: isWasting ? "#ff3b30" : "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
                {ko ? "폐기 기록" : "Log waste"}
              </button>

              {/* 수정·삭제 */}
              <div style={{ marginLeft: "auto", display: "flex" }}>
                <button type="button" onClick={() => openInvEdit(item)}
                  style={{ fontSize: "11px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "4px 9px", fontWeight: 500 }}>
                  {ko ? "수정" : "Edit"}
                </button>
                <button type="button" onClick={() => handleInvDelete(item.id)}
                  style={{ fontSize: "11px", color: "#ff3b30", background: "none", border: "none", cursor: "pointer", padding: "4px 9px", fontWeight: 500 }}>
                  {ko ? "삭제" : "Del"}
                </button>
              </div>
            </div>

            {/* 폐기 기록 인라인 폼 */}
            {isWasting && (
              <div style={{ marginTop: "12px", padding: "13px 15px", background: "rgba(255,59,48,0.04)", borderRadius: "12px", border: "0.5px solid rgba(255,59,48,0.13)", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#ff3b30", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
                  {ko ? "폐기 기록" : "Waste log"}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="text" inputMode="decimal" placeholder={ko ? `수량 (${item.unit})` : `Qty (${item.unit})`}
                    value={invWasteQty} onChange={e => setInvWasteQty(e.target.value.replace(/[^0-9.]/g, ""))}
                    aria-label={ko ? "폐기 수량" : "Waste quantity"}
                    style={{ ...inputSt, flex: 1, fontSize: "13px", padding: "8px 11px" }} />
                  <select value={invWasteReason} onChange={e => setInvWasteReason(e.target.value)}
                    aria-label={ko ? "폐기 사유" : "Waste reason"}
                    style={{ ...inputSt, flex: 1, fontSize: "13px", padding: "8px 11px", cursor: "pointer" }}>
                    <option value="">{ko ? "사유 선택" : "Reason"}</option>
                    <option value="expiry">{ko ? "유통기한 만료" : "Expired"}</option>
                    <option value="quality">{ko ? "품질 불량" : "Quality issue"}</option>
                    <option value="overstock">{ko ? "과주문" : "Over-ordered"}</option>
                    <option value="other">{ko ? "기타" : "Other"}</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: "7px" }}>
                  <button type="button" disabled={!invWasteQty} onClick={() => handleInvWaste(item.id)}
                    style={{ flex: 1, background: invWasteQty ? "#ff3b30" : "rgba(0,0,0,0.08)", color: invWasteQty ? "#fff" : "var(--muted)", border: "none", borderRadius: "9px", padding: "8px 0", fontSize: "12px", fontWeight: 700, cursor: invWasteQty ? "pointer" : "default" }}>
                    {ko ? "기록" : "Record"}
                  </button>
                  <button type="button" onClick={() => setInvWasteTarget(null)}
                    style={{ background: "rgba(0,0,0,0.06)", color: "var(--muted)", border: "none", borderRadius: "9px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {ko ? "취소" : "Cancel"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* 전체 보기 / 접기 */}
      {sorted.length > 5 && (
        <button type="button" onClick={() => setInvShowAll(v => !v)} style={{
          width: "100%", padding: "10px", border: "none", background: "none",
          fontSize: "13px", fontWeight: 600, color: "#0561fc", cursor: "pointer",
          borderTop: "0.5px solid rgba(0,0,0,0.06)",
        }}>
          {invShowAll ? (ko ? `접기 ↑` : `Collapse ↑`) : (ko ? `전체 ${sorted.length}개 보기 ↓` : `Show all ${sorted.length} ↓`)}
        </button>
      )}

      {/* ── 품목 추가·수정 폼 ── */}
      {invForm.open && (
        <div style={{ padding: "22px 22px", borderTop: "0.5px solid rgba(0,0,0,0.09)", background: "rgba(0,0,0,0.018)", display: "flex", flexDirection: "column" as const, gap: "18px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.3px" }}>
            {invForm.editId ? (ko ? "품목 수정" : "Edit item") : (ko ? "새 품목 추가" : "New item")}
          </div>

          {/* 기본 정보 */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
            <div style={secLbl}>{ko ? "기본 정보" : "Basic info"}</div>
            <input type="text" placeholder={ko ? "품목명 (예: 닭가슴살)" : "Item name"}
              aria-label={ko ? "품목명" : "Item name"}
              value={invForm.name} onChange={e => setInvForm(f => ({ ...f, name: e.target.value }))} style={inputSt} />
            <div style={{ display: "flex", gap: "8px" }}>
              <select value={invForm.category} onChange={e => setInvForm(f => ({ ...f, category: e.target.value as InvForm["category"] }))}
                aria-label={ko ? "카테고리" : "Category"}
                style={{ ...inputSt, flex: 1, cursor: "pointer" }}>
                {Object.entries(CAT).map(([k, v]) => <option key={k} value={k}>{ko ? v.ko : v.en}</option>)}
              </select>
              <select value={invForm.unit} onChange={e => setInvForm(f => ({ ...f, unit: e.target.value }))}
                aria-label={ko ? "단위" : "Unit"}
                style={{ ...inputSt, width: "76px", flex: "none", cursor: "pointer" }}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* 수량 & 사용량 */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
            <div style={secLbl}>{ko ? "수량 & 사용량" : "Quantity & usage"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: ko ? "현재 수량" : "Current qty", key: "qty" as const, ph: "0" },
                { label: ko ? `1일 사용량 (${invForm.unit})` : `Daily usage (${invForm.unit})`, key: "dailyUsage" as const, ph: "e.g. 2.5" },
                { label: ko ? `재주문 기준량 (${invForm.unit})` : `Reorder at (${invForm.unit})`, key: "threshold" as const, ph: "e.g. 5" },
                { label: ko ? "단가 (원)" : "Unit cost (₩)", key: "unitCost" as const, ph: "e.g. 8500" },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "5px" }}>{f.label}</div>
                  <input type="text" inputMode="decimal" placeholder={f.ph}
                    value={invForm[f.key]} onChange={e => setInvForm(p => ({ ...p, [f.key]: e.target.value.replace(/[^0-9.]/g, "") }))} style={inputSt} />
                </div>
              ))}
            </div>
          </div>

          {/* 유통기한 (신선·냉동만) */}
          {(invForm.category === "fresh" || invForm.category === "frozen") && (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              <div style={secLbl}>{ko ? "유통기한" : "Expiry date"}</div>
              <input type="date" value={invForm.expiryDate} onChange={e => setInvForm(f => ({ ...f, expiryDate: e.target.value }))} aria-label={ko ? "유통기한" : "Expiry date"} style={inputSt} />
            </div>
          )}

          {/* 공급업체 */}
          {(() => {
            // 프랜차이즈 본사 공급업체 추출
            const franchiseSuppliers: { name: string; type: string; color: string }[] = [];
            if (startupType === "franchise" && selectedFranchiseBrandId) {
              const fb = getFranchiseBrandById(selectedFranchiseBrandId);
              if (fb) {
                const supplyInfo = getFranchiseSupplyInfo(fb);
                supplyInfo.forEach(s => {
                  const typeName = s.type === "hq-exclusive" ? (language === "ko" ? "본사 독점" : "HQ Only")
                    : s.type === "hq-designated" ? (language === "ko" ? "본사 지정" : "HQ Designated")
                    : "";
                  if (typeName) {
                    franchiseSuppliers.push({
                      name: `${fb!.name[language]} ${s.category[language]}`,
                      type: typeName,
                      color: getSupplyTypeColor(s.type)
                    });
                  }
                });
              }
            }

            // 로드맵 vendor-setup 단계에서 저장한 공급업체 목록 추출
            const savedSuppliers = Object.entries(vendorSelections)
              .filter(([, v]) => v !== "")
              .map(([k, v]) => {
                const name = v.startsWith("__etc__") ? (vendorCustomInputs[k] ?? "").trim() : v;
                return { name, url: VENDOR_URL_MAP[name] ?? "" };
              })
              .filter(({ name }) => name !== "")
              .filter((s, i, arr) => arr.findIndex(x => x.name === s.name) === i);
            return (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                <div style={secLbl}>{ko ? "공급업체" : "Supplier"}</div>

                {/* 프랜차이즈 본사 공급업체 */}
                {franchiseSuppliers.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.38)", marginBottom: "6px", fontWeight: 500 }}>
                      {ko ? "프랜차이즈 본사 공급" : "Franchise HQ supply"}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                      {franchiseSuppliers.map(s => {
                        const isSelected = invForm.supplierName === s.name;
                        return (
                          <button
                            key={s.name}
                            type="button"
                            onClick={() => setInvForm(f => ({
                              ...f,
                              supplierName: isSelected ? "" : s.name,
                            }))}
                            style={{
                              fontSize: "11px", fontWeight: 600, padding: "4px 10px",
                              borderRadius: "999px", cursor: "pointer",
                              border: isSelected ? `1.5px solid ${s.color}` : `1px solid ${s.color}30`,
                              background: isSelected ? `${s.color}15` : `${s.color}06`,
                              color: s.color,
                              transition: "all 0.15s",
                              display: "inline-flex", alignItems: "center", gap: "4px"
                            }}
                          >
                            <span style={{ fontSize: "9px", opacity: 0.7 }}>{s.type}</span>
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {savedSuppliers.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.38)", marginBottom: "6px", fontWeight: 500 }}>
                      {ko ? "로드맵에서 저장한 공급업체" : "From your roadmap"}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                      {savedSuppliers.map(s => {
                        const isSelected = invForm.supplierName === s.name;
                        return (
                          <button
                            key={s.name}
                            type="button"
                            onClick={() => setInvForm(f => ({
                              ...f,
                              supplierName: isSelected ? "" : s.name,
                              url: isSelected ? f.url : (s.url || f.url),
                            }))}
                            style={{
                              fontSize: "12px", fontWeight: 600, padding: "5px 11px",
                              borderRadius: "999px", cursor: "pointer",
                              border: isSelected ? "none" : "1px solid rgba(0,0,0,0.12)",
                              background: isSelected ? "#007aff" : "rgba(0,0,0,0.04)",
                              color: isSelected ? "#fff" : "var(--primary)",
                              transition: "all 0.15s",
                            }}
                          >
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <input type="text" placeholder={savedSuppliers.length > 0 ? (ko ? "또는 직접 입력" : "Or enter manually") : (ko ? "공급업체명 (예: 한국식자재)" : "Supplier name")}
                  aria-label={ko ? "공급업체명" : "Supplier name"}
                  value={invForm.supplierName} onChange={e => setInvForm(f => ({ ...f, supplierName: e.target.value }))} style={inputSt} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", alignItems: "end" }}>
                  <input type="text" placeholder={ko ? "주문 URL (주문하기 버튼에 연결)" : "Order URL (linked to Order button)"}
                    aria-label={ko ? "주문 URL" : "Order URL"}
                    value={invForm.url} onChange={e => setInvForm(f => ({ ...f, url: e.target.value }))} style={inputSt} />
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "5px", whiteSpace: "nowrap" as const }}>{ko ? "리드타임 (일)" : "Lead time (d)"}</div>
                    <input type="text" inputMode="numeric" placeholder="1"
                      aria-label={ko ? "리드타임 (일)" : "Lead time (days)"}
                      value={invForm.leadTimeDays} onChange={e => setInvForm(f => ({ ...f, leadTimeDays: e.target.value.replace(/[^0-9]/g, "") }))}
                      style={{ ...inputSt, width: "64px" }} />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 소진 예측 미리보기 */}
          {invForm.qty && invForm.dailyUsage && Number(invForm.dailyUsage) > 0 && (() => {
            const days = Math.floor(Number(invForm.qty) / Number(invForm.dailyUsage));
            const lead = Number(invForm.leadTimeDays) || 1;
            const warn = days <= lead;
            return (
              <div style={{ padding: "11px 14px", borderRadius: "11px", background: warn ? "rgba(255,59,48,0.05)" : "rgba(52,199,89,0.05)", border: `0.5px solid ${warn ? "rgba(255,59,48,0.15)" : "rgba(52,199,89,0.15)"}` }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: warn ? "#ff3b30" : "#34c759" }}>
                  {warn
                    ? (ko ? `현재 수량으로 ${days}일치 — 리드타임(${lead}일) 고려 시 오늘 주문 필요` : `${days}d of stock — must order today (${lead}d lead time)`)
                    : (ko ? `현재 수량으로 ${days}일치 — 당장 주문 불필요` : `${days} days of stock — no immediate order needed`)}
                </div>
              </div>
            );
          })()}

          {/* 저장·취소 */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" style={{ ...styles.primaryButton, flex: 1, opacity: invForm.name.trim() ? 1 : 0.45 }}
              onClick={handleInvSave} disabled={!invForm.name.trim()}>
              {ko ? "저장" : "Save"}
            </button>
            <button type="button" style={styles.button}
              onClick={() => setInvForm(f => ({ ...f, open: false, editId: null }))}>
              {ko ? "취소" : "Cancel"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

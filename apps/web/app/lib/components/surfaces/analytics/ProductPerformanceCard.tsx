"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import { supabase } from "../../../../../lib/supabase";
import type { Product } from "../../../stores/operations-store";

export function ProductPerformanceCard() {
  const d = useDashboardCtx();
  const {
    language,
    businessCtx,
    products,
    saveProducts,
    handleProdSave,
    handleProdDelete,
    handleProdSoldChange,
    openProdEdit,
    prodFormOpen, setProdFormOpen,
    prodEditId, setProdEditId,
    prodName, setProdName,
    prodCategory, setProdCategory,
    prodPrice, setProdPrice,
    prodCost, setProdCost,
    prodStock, setProdStock,
    prodUnit, setProdUnit,
  } = d;

  if (!businessCtx.showProductCard) return null;

  const ko = language === "ko";
  const isRestaurant = businessCtx.inventoryMode === "separate";
  const fmt = (n: number) => n >= 10000
    ? `${Math.round(n / 10000).toLocaleString()}만원`
    : `${Math.round(n).toLocaleString()}원`;
  const fmtN = (n: number) => n.toLocaleString();

  // 수익성 계산
  const calcMargin = (p: Product) => p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
  const calcRevenue = (p: Product) => p.monthlySold * p.price;
  const calcProfit = (p: Product) => p.monthlySold * (p.price - p.cost);

  const totalRevenue = products.reduce((s, p) => s + calcRevenue(p), 0);
  const totalProfit = products.reduce((s, p) => s + calcProfit(p), 0);
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // 정렬: 월 매출 기여도 내림차순
  const sorted = [...products].sort((a, b) => calcRevenue(b) - calcRevenue(a));
  const dangerItems = products.filter(p => p.cost > 0 && calcMargin(p) < 20);

  const marginColor = (m: number) => m < 0 ? "#ff3b30" : m < 20 ? "#ff9f0a" : m < 40 ? "var(--primary)" : "#34c759";

  // 카테고리 목록 (업종별 기본값)
  const defaultCategories = isRestaurant
    ? (ko ? ["메인", "사이드", "음료", "디저트", "세트"] : ["Main", "Side", "Drink", "Dessert", "Set"])
    : businessCtx.isOnlineStore
      ? (ko ? ["의류", "잡화", "디지털", "홈리빙", "기타"] : ["Apparel", "Accessories", "Digital", "Home", "Other"])
      : (ko ? ["상품", "소모품", "악세서리", "기타"] : ["Product", "Supplies", "Accessories", "Other"]);

  const UNITS = ["개", "잔", "그릇", "접시", "병", "캔", "팩"];

  return (
    <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
      {/* 헤더 */}
      <div style={{ padding: "18px 22px 14px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
              {businessCtx.productLabel[language] || (ko ? "제품 수익성" : "Product Performance")}
            </div>
            {products.length > 0 && (
              <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px" }}>
                {ko ? `${products.length}개 등록 · 이달 매출 기여 ${fmt(totalRevenue)}` : `${products.length} items · ${fmt(totalRevenue)} this month`}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button type="button"
              onClick={() => { setProdFormOpen(true); setProdEditId(null); setProdName(""); setProdCategory(""); setProdPrice(""); setProdCost(""); setProdStock(""); setProdUnit("개"); }}
              style={{ fontSize: "13px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
              {ko ? "+ 직접 추가" : "+ Add manually"}
            </button>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#34c759", cursor: "pointer", padding: "4px 0", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 2v12M2 8h12" />
              </svg>
              {ko ? "CSV 업로드" : "Upload CSV"}
              <input type="file" accept=".csv,.tsv,.txt" aria-label={ko ? "제품 CSV 파일 업로드" : "Upload product CSV file"} style={{ display: "none" }} onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                try {
                  let text = "";
                  const fileExt = file.name.split(".").pop()?.toLowerCase();
                  if (fileExt === "csv" || fileExt === "tsv" || fileExt === "txt") {
                    text = await file.text();
                  } else {
                    const buf = await file.arrayBuffer();
                    const bytes = new Uint8Array(buf);
                    try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
                    catch { text = new TextDecoder("euc-kr", { fatal: false }).decode(bytes); }
                    if (text.includes("\0") || text.length < 10) {
                      alert(ko ? "지원하지 않는 파일 형식입니다." : "Unsupported format.");
                      return;
                    }
                  }
                  if (!text.trim()) { alert(ko ? "파일 내용이 비어 있습니다." : "File is empty."); return; }

                  const statusEl = document.getElementById("excel-upload-status");
                  if (statusEl) statusEl.textContent = ko ? "AI가 분석 중..." : "AI parsing...";

                  const { data: { session } } = await supabase.auth.getSession();
                  const res = await fetch("/api/ai/products/parse", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
                    body: JSON.stringify({ text: text.slice(0, 50000), language }),
                  });
                  const payload = await res.json();
                  if (!res.ok || payload.error) {
                    alert(payload.error ?? (ko ? "파싱 실패" : "Parse failed"));
                    if (statusEl) statusEl.textContent = "";
                    return;
                  }
                  const parsed = payload.products as { name: string; category: string; price: number; cost: number; stock: number; unit: string }[];
                  if (!parsed || parsed.length === 0) {
                    alert(ko ? "제품 데이터를 찾을 수 없습니다." : "No products found.");
                    if (statusEl) statusEl.textContent = "";
                    return;
                  }
                  const newProducts = parsed.map((p) => ({
                    id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    name: p.name,
                    category: p.category,
                    price: p.price,
                    cost: p.cost,
                    stock: p.stock,
                    monthlySold: 0,
                    unit: p.unit,
                  }));
                  const merged = [...products, ...newProducts];
                  saveProducts(merged);
                  if (statusEl) statusEl.textContent = ko ? `${newProducts.length}개 제품 등록 완료` : `${newProducts.length} products added`;
                  setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 3000);
                } catch (err) {
                  alert(ko ? "파일 처리 중 오류가 발생했습니다." : "Error processing file.");
                }
              }} />
            </label>
          </div>
        </div>
        <div id="excel-upload-status" style={{ fontSize: "12px", fontWeight: 600, color: "#34c759", minHeight: "18px", marginTop: "4px", padding: "0 22px" }} />
        {/* 업종 태그 */}
        <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" as const, padding: "0 22px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "16px", border: "1px solid #007aff", background: "rgba(0,122,255,0.08)", color: "#007aff" }}>
            {ko ? "제품 관리" : "Products"}
          </span>
        </div>
      </div>

      {/* 위험 경보 */}
      {dangerItems.length > 0 && (
        <div style={{ padding: "10px 22px", background: "rgba(255,59,48,0.04)", borderBottom: "0.5px solid rgba(255,59,48,0.10)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#ff3b30" }}>
            {ko ? `마진 20% 미만 경고: ${dangerItems.map(p => p.name).join(", ")}` : `Low margin (<20%): ${dangerItems.map(p => p.name).join(", ")}`}
          </div>
        </div>
      )}

      {/* 요약 3-col */}
      {products.length > 0 && totalRevenue > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
          {[
            { label: ko ? "이달 매출" : "Revenue", value: fmt(totalRevenue), color: "inherit" },
            { label: ko ? "이달 이익" : "Gross profit", value: fmt(totalProfit), color: totalProfit >= 0 ? "#34c759" : "#ff3b30" },
            { label: ko ? "평균 마진율" : "Avg margin", value: `${overallMargin.toFixed(1)}%`, color: marginColor(overallMargin) },
          ].map((col, idx) => (
            <div key={col.label} style={{ padding: "14px 12px", borderLeft: idx > 0 ? "0.5px solid rgba(0,0,0,0.08)" : "none" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "6px" }}>{col.label}</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: col.color, letterSpacing: "-0.4px" }}>{col.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {products.length === 0 ? (
        <div style={{ padding: "16px 22px 22px" }}>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
            {ko
              ? `${isRestaurant ? "메뉴" : "상품"}를 등록하면 판매량 기록, 마진율 계산, 베스트셀러 분석이 가능합니다.`
              : `Register ${isRestaurant ? "menu items" : "products"} to track sales, calculate margins, and identify bestsellers.`}
          </div>
        </div>
      ) : (
        <div>
          {sorted.map((p, idx) => {
            const margin = calcMargin(p);
            const revenue = calcRevenue(p);
            const revenueShare = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
            return (
              <div key={p.id} style={{ padding: "13px 22px", borderBottom: idx < sorted.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none" }}>
                {/* 이름 행 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary)" }}>{p.name}</span>
                      <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "10px", background: "rgba(0,0,0,0.05)", color: "var(--muted)" }}>{p.category}</span>
                      {idx === 0 && totalRevenue > 0 && <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "10px", background: "rgba(0,122,255,0.10)", color: "#007aff" }}>{ko ? "베스트" : "Best"}</span>}
                      {margin < 0 && <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "10px", background: "rgba(255,59,48,0.10)", color: "#ff3b30" }}>{ko ? "적자주의" : "Loss!"}</span>}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>
                      {ko ? `판매가 ${fmtN(p.price)}원 · 원가 ${p.cost > 0 ? fmtN(p.cost) + "원" : "미입력"} · 재고 ${p.stock}${p.unit}` : `Price ₩${fmtN(p.price)} · Cost ${p.cost > 0 ? "₩" + fmtN(p.cost) : "N/A"} · Stock ${p.stock}${p.unit}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button type="button" onClick={() => openProdEdit(p)} style={{ fontSize: "11px", color: "#007aff", background: "none", border: "none", cursor: "pointer" }}>{ko ? "수정" : "Edit"}</button>
                    <button type="button" onClick={() => handleProdDelete(p.id)} style={{ fontSize: "11px", color: "#ff3b30", background: "none", border: "none", cursor: "pointer" }}>{ko ? "삭제" : "Del"}</button>
                  </div>
                </div>
                {/* 마진율 바 */}
                {p.cost > 0 && (
                  <div style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{ko ? "마진율" : "Margin"}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: marginColor(margin) }}>{margin.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: "3px", borderRadius: "2px", background: "rgba(0,0,0,0.07)" }}>
                      <div style={{ height: "100%", borderRadius: "2px", width: `${Math.max(0, Math.min(100, margin))}%`, background: marginColor(margin) }} />
                    </div>
                  </div>
                )}
                {/* 판매량 조작 + 월 기여 */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" as const }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
                    <button type="button" onClick={() => handleProdSoldChange(p.id, -1)}
                      aria-label={ko ? `${p.name} 판매량 감소` : `Decrease ${p.name} sold count`}
                      style={{ width: "28px", height: "28px", borderRadius: "8px 0 0 8px", border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.03)", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>−</button>
                    <div style={{ padding: "0 10px", height: "28px", border: "1px solid rgba(0,0,0,0.12)", borderLeft: "none", borderRight: "none", display: "flex", alignItems: "center", fontSize: "13px", fontWeight: 600, minWidth: "44px", justifyContent: "center" }} aria-live="polite">
                      {p.monthlySold}{p.unit}
                    </div>
                    <button type="button" onClick={() => handleProdSoldChange(p.id, 1)}
                      aria-label={ko ? `${p.name} 판매량 증가` : `Increase ${p.name} sold count`}
                      style={{ width: "28px", height: "28px", borderRadius: "0 8px 8px 0", border: "1px solid rgba(0,0,0,0.12)", background: "rgba(0,0,0,0.03)", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>+</button>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>{ko ? "이달 판매량" : "Sold this month"}</span>
                  {revenue > 0 && (
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", marginLeft: "auto" }}>
                      {ko ? `매출 ${fmt(revenue)}` : `${fmt(revenue)} revenue`}
                      {revenueShare > 0 && <span style={{ fontSize: "10px", color: "var(--muted)", marginLeft: "4px" }}>({revenueShare.toFixed(0)}%)</span>}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 추가/수정 폼 */}
      {prodFormOpen && (
        <div style={{ padding: "18px 22px", borderTop: "0.5px solid rgba(0,0,0,0.08)", background: "rgba(0,122,255,0.03)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#007aff", marginBottom: "14px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
            {prodEditId ? (ko ? "수정" : "Edit") : (ko ? "제품 추가" : "Add product")}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
            <input type="text" placeholder={ko ? "제품명 (예: 아메리카노, 흰티셔츠)" : "Product name"} value={prodName} onChange={e => setProdName(e.target.value)}
              aria-label={ko ? "제품명" : "Product name"}
              style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
            {/* 카테고리 선택 */}
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>{ko ? "카테고리" : "Category"}</div>
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" as const }}>
                {defaultCategories.map(cat => (
                  <button key={cat} type="button" onClick={() => setProdCategory(cat)}
                    style={{ fontSize: "11px", fontWeight: 600, padding: "5px 12px", borderRadius: "16px", border: `1px solid ${prodCategory === cat ? "#007aff" : "rgba(0,0,0,0.10)"}`, background: prodCategory === cat ? "rgba(0,122,255,0.09)" : "transparent", color: prodCategory === cat ? "#007aff" : "var(--muted)", cursor: "pointer" }}>
                    {cat}
                  </button>
                ))}
                <input type="text" placeholder={ko ? "직접 입력" : "Custom"} value={!defaultCategories.includes(prodCategory) ? prodCategory : ""} onChange={e => setProdCategory(e.target.value)}
                  aria-label={ko ? "사용자 정의 카테고리" : "Custom category"}
                  style={{ width: "80px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "5px 10px", fontSize: "12px", outline: "none" }} />
              </div>
            </div>
            {/* 가격 + 원가 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "판매가 (원)" : "Price (₩)"}</div>
                <input type="text" inputMode="numeric" placeholder="12000" value={prodPrice} onChange={e => setProdPrice(e.target.value.replace(/[^0-9]/g, ""))}
                  aria-label={ko ? "판매가 (원)" : "Selling price (KRW)"}
                  style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "원가 (원, 선택)" : "Cost (₩, optional)"}</div>
                <input type="text" inputMode="numeric" placeholder="4000" value={prodCost} onChange={e => setProdCost(e.target.value.replace(/[^0-9]/g, ""))}
                  aria-label={ko ? "원가 (원)" : "Cost price (KRW)"}
                  style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
              </div>
            </div>
            {/* 재고 + 단위 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "재고 수량" : "Stock qty"}</div>
                <input type="text" inputMode="numeric" placeholder="0" value={prodStock} onChange={e => setProdStock(e.target.value.replace(/[^0-9]/g, ""))}
                  aria-label={ko ? "재고 수량" : "Stock quantity"}
                  style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "단위" : "Unit"}</div>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" as const }}>
                  {UNITS.map(u => (
                    <button key={u} type="button" onClick={() => setProdUnit(u)}
                      style={{ fontSize: "11px", fontWeight: 600, padding: "5px 10px", borderRadius: "12px", border: `1px solid ${prodUnit === u ? "#007aff" : "rgba(0,0,0,0.10)"}`, background: prodUnit === u ? "rgba(0,122,255,0.09)" : "transparent", color: prodUnit === u ? "#007aff" : "var(--muted)", cursor: "pointer" }}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* 마진 미리보기 */}
            {prodPrice && prodCost && parseInt(prodPrice) > 0 && (
              <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(0,122,255,0.05)", border: "0.5px solid rgba(0,122,255,0.12)" }}>
                {(() => {
                  const p = parseInt(prodPrice); const c = parseInt(prodCost);
                  if (p <= 0) return null;
                  const m = ((p - c) / p * 100);
                  return (
                    <div style={{ fontSize: "12px", color: m < 0 ? "#ff3b30" : marginColor(m), fontWeight: 600 }}>
                      {ko ? `마진율 ${m.toFixed(1)}% · 건당 이익 ${(p - c).toLocaleString()}원` : `Margin ${m.toFixed(1)}% · ₩${(p - c).toLocaleString()} per item`}
                      {m < 0 && <span style={{ color: "#ff3b30", marginLeft: "8px", fontWeight: 600 }}>{ko ? "⚠ 역마진" : "⚠ Negative"}</span>}
                      {m >= 0 && m < 20 && <span style={{ color: "#ff9f0a", marginLeft: "8px", fontWeight: 600 }}>{ko ? "마진 낮음" : "Low margin"}</span>}
                    </div>
                  );
                })()}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" onClick={handleProdSave}
                style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#007aff", color: "#fff", border: "none", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                {prodEditId ? (ko ? "수정 완료" : "Save") : (ko ? "추가" : "Add")}
              </button>
              <button type="button" onClick={() => { setProdFormOpen(false); setProdEditId(null); }}
                style={{ padding: "12px 20px", borderRadius: "12px", background: "rgba(0,0,0,0.06)", color: "var(--primary)", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                {ko ? "취소" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

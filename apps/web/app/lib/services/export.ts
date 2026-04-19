/**
 * 데이터 Export 서비스 — CSV/Excel/PDF 내보내기.
 * xlsx + jsPDF는 이미 package.json에 있음.
 * SSR 안전을 위해 dynamic import 사용.
 */

import type { DailyEntry, MonthlyCosts } from "../stores/finance-store";
import type { InventoryItem, Employee, Product, UnifiedProduct, ServiceMenuItem } from "../stores/operations-store";

// ── 헬퍼: 현재 월 ISO (예: "2026-04") ──
export function currentMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── CSV 빌더 (BOM 포함, 한글 엑셀 호환) ──
function buildCsv(rows: Array<Record<string, unknown>>, headers: string[]): string {
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) => headers.map((h) => escape(row[h])).join(","));
  // BOM (UTF-8) — 한글 엑셀에서 깨짐 방지
  return "\uFEFF" + [headerLine, ...dataLines].join("\n");
}

// ── 브라우저에서 Blob 다운로드 트리거 ──
function triggerDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // revoke 약간 지연
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── 1. 매출 CSV (일별) ───

export function exportSalesCsv(entries: DailyEntry[], month?: string): void {
  const filter = month ? entries.filter((e) => e.date.startsWith(month)) : entries;
  const sorted = [...filter].sort((a, b) => a.date.localeCompare(b.date));
  const rows = sorted.map((e) => ({
    "날짜": e.date,
    "매출(원)": e.sales,
    "고객수": e.customers,
    "객단가(원)": e.customers > 0 ? Math.round(e.sales / e.customers) : 0,
  }));
  const csv = buildCsv(rows, ["날짜", "매출(원)", "고객수", "객단가(원)"]);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `매출_${month ?? "전체"}.csv`);
}

// ─── 2. 비용 CSV (8칸 분해) ───

export function exportCostsCsv(monthlyCosts: MonthlyCosts, totalSales: number, month: string): void {
  const pct = (v: number) => (totalSales > 0 ? ((v / totalSales) * 100).toFixed(1) + "%" : "-");
  const total = monthlyCosts.ingredients + monthlyCosts.labor + monthlyCosts.rent + monthlyCosts.utilities
    + monthlyCosts.sga + monthlyCosts.marketing + monthlyCosts.other + monthlyCosts.interest;

  const rows = [
    { "항목": "재료비/원가", "금액(원)": monthlyCosts.ingredients, "매출 대비": pct(monthlyCosts.ingredients) },
    { "항목": "인건비", "금액(원)": monthlyCosts.labor, "매출 대비": pct(monthlyCosts.labor) },
    { "항목": "임대료", "금액(원)": monthlyCosts.rent, "매출 대비": pct(monthlyCosts.rent) },
    { "항목": "공과금", "금액(원)": monthlyCosts.utilities, "매출 대비": pct(monthlyCosts.utilities) },
    { "항목": "판관비/운영비", "금액(원)": monthlyCosts.sga, "매출 대비": pct(monthlyCosts.sga) },
    { "항목": "마케팅비", "금액(원)": monthlyCosts.marketing, "매출 대비": pct(monthlyCosts.marketing) },
    { "항목": "기타", "금액(원)": monthlyCosts.other, "매출 대비": pct(monthlyCosts.other) },
    { "항목": "대출이자", "금액(원)": monthlyCosts.interest, "매출 대비": pct(monthlyCosts.interest) },
    { "항목": "총 비용", "금액(원)": total, "매출 대비": pct(total) },
  ];
  const csv = buildCsv(rows, ["항목", "금액(원)", "매출 대비"]);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `비용_${month}.csv`);
}

// ─── 3. 재고 CSV ───

export function exportInventoryCsv(items: InventoryItem[]): void {
  const rows = items.map((i) => ({
    "상품명": i.name,
    "카테고리": i.category,
    "유형": i.itemType === "material" ? "원재료" : "완제품",
    "수량": i.quantity,
    "단위": i.unit,
    "최소재고": i.minThreshold,
    "단가(원)": i.unitCost,
    "총액(원)": i.quantity * i.unitCost,
    "판매가(원)": i.sellingPrice || 0,
    "공급처": i.supplierName,
    "공급처URL": i.supplierUrl,
    "리드타임(일)": i.leadTimeDays,
    "일소비량": i.dailyUsage,
    "최근주문일": i.lastOrderedAt,
    "유통기한": i.expiryDate,
  }));
  const headers = ["상품명", "카테고리", "유형", "수량", "단위", "최소재고", "단가(원)", "총액(원)", "판매가(원)", "공급처", "공급처URL", "리드타임(일)", "일소비량", "최근주문일", "유통기한"];
  const csv = buildCsv(rows, headers);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `재고_${currentMonthIso()}.csv`);
}

// ─── 4. 직원 CSV ───

export function exportEmployeesCsv(employees: Employee[]): void {
  const rows = employees.map((e) => {
    const monthlyWage = e.hourlyWage * e.weeklyHours * 4.33;
    return {
      "이름": e.name,
      "시급(원)": e.hourlyWage,
      "주간근무(시)": e.weeklyHours,
      "월급여추정(원)": Math.round(monthlyWage),
      "4대보험": e.isInsured ? "가입" : "미가입",
    };
  });
  const csv = buildCsv(rows, ["이름", "시급(원)", "주간근무(시)", "월급여추정(원)", "4대보험"]);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `직원_${currentMonthIso()}.csv`);
}

// ─── 5. 통합 P&L Excel (여러 시트) ───

export async function exportComprehensiveExcel(params: {
  month: string;
  entries: DailyEntry[];
  monthlyCosts: MonthlyCosts;
  inventory: InventoryItem[];
  employees: Employee[];
  products?: Product[];
  unifiedProducts?: UnifiedProduct[];
  serviceMenu?: ServiceMenuItem[];
}): Promise<void> {
  const { month, entries, monthlyCosts, inventory, employees, products, unifiedProducts, serviceMenu } = params;
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  // Sheet 1: 손익계산서
  const monthEntries = entries.filter((e) => e.date.startsWith(month));
  const totalSales = monthEntries.reduce((s, e) => s + e.sales, 0);
  const totalCustomers = monthEntries.reduce((s, e) => s + e.customers, 0);
  const totalCosts = monthlyCosts.ingredients + monthlyCosts.labor + monthlyCosts.rent + monthlyCosts.utilities
    + monthlyCosts.sga + monthlyCosts.marketing + monthlyCosts.other + monthlyCosts.interest;
  const netProfit = totalSales - totalCosts;
  const pct = (v: number) => (totalSales > 0 ? Math.round((v / totalSales) * 1000) / 10 + "%" : "-");

  const pnlRows = [
    { "항목": "매출", "금액(원)": totalSales, "비율": "100%" },
    { "항목": "(-) 재료비/원가", "금액(원)": monthlyCosts.ingredients, "비율": pct(monthlyCosts.ingredients) },
    { "항목": "매출총이익", "금액(원)": totalSales - monthlyCosts.ingredients, "비율": pct(totalSales - monthlyCosts.ingredients) },
    { "항목": "(-) 인건비", "금액(원)": monthlyCosts.labor, "비율": pct(monthlyCosts.labor) },
    { "항목": "(-) 임대료", "금액(원)": monthlyCosts.rent, "비율": pct(monthlyCosts.rent) },
    { "항목": "(-) 공과금", "금액(원)": monthlyCosts.utilities, "비율": pct(monthlyCosts.utilities) },
    { "항목": "(-) 판관비", "금액(원)": monthlyCosts.sga, "비율": pct(monthlyCosts.sga) },
    { "항목": "(-) 마케팅비", "금액(원)": monthlyCosts.marketing, "비율": pct(monthlyCosts.marketing) },
    { "항목": "(-) 기타", "금액(원)": monthlyCosts.other, "비율": pct(monthlyCosts.other) },
    { "항목": "영업이익", "금액(원)": totalSales - totalCosts + monthlyCosts.interest, "비율": pct(totalSales - totalCosts + monthlyCosts.interest) },
    { "항목": "(-) 대출이자", "금액(원)": monthlyCosts.interest, "비율": pct(monthlyCosts.interest) },
    { "항목": "순이익", "금액(원)": netProfit, "비율": pct(netProfit) },
  ];
  const pnlSheet = XLSX.utils.json_to_sheet(pnlRows);
  XLSX.utils.book_append_sheet(wb, pnlSheet, "손익계산서");

  // Sheet 2: 일별매출
  const salesRows = monthEntries.sort((a, b) => a.date.localeCompare(b.date)).map((e) => ({
    "날짜": e.date,
    "매출(원)": e.sales,
    "고객수": e.customers,
    "객단가(원)": e.customers > 0 ? Math.round(e.sales / e.customers) : 0,
  }));
  const salesSheet = XLSX.utils.json_to_sheet(salesRows);
  XLSX.utils.book_append_sheet(wb, salesSheet, "일별매출");

  // Sheet 3: 재고
  if (inventory.length > 0) {
    const invRows = inventory.map((i) => ({
      "상품명": i.name,
      "카테고리": i.category,
      "유형": i.itemType === "material" ? "원재료" : "완제품",
      "수량": i.quantity,
      "단위": i.unit,
      "최소재고": i.minThreshold,
      "단가(원)": i.unitCost,
      "총액(원)": i.quantity * i.unitCost,
      "판매가(원)": i.sellingPrice || 0,
      "공급처": i.supplierName,
    }));
    const invSheet = XLSX.utils.json_to_sheet(invRows);
    XLSX.utils.book_append_sheet(wb, invSheet, "재고");
  }

  // Sheet 4: 직원
  if (employees.length > 0) {
    const empRows = employees.map((e) => ({
      "이름": e.name,
      "시급(원)": e.hourlyWage,
      "주간근무(시)": e.weeklyHours,
      "월급여추정(원)": Math.round(e.hourlyWage * e.weeklyHours * 4.33),
      "4대보험": e.isInsured ? "가입" : "미가입",
    }));
    const empSheet = XLSX.utils.json_to_sheet(empRows);
    XLSX.utils.book_append_sheet(wb, empSheet, "직원");
  }

  // Sheet 5: 상품/메뉴 (있으면)
  if (products && products.length > 0) {
    const prodRows = products.map((p) => ({
      "상품명": p.name,
      "카테고리": p.category,
      "판매가(원)": p.price,
      "원가(원)": p.cost,
      "마진(원)": p.price - p.cost,
      "마진율": p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) + "%" : "-",
      "재고": p.stock,
      "월판매": p.monthlySold,
      "단위": p.unit,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodRows), "상품");
  }
  if (unifiedProducts && unifiedProducts.length > 0) {
    const upRows = unifiedProducts.map((p) => ({
      "상품명": p.name,
      "카테고리": p.category,
      "판매가(원)": p.price,
      "원가(원)": p.cost,
      "마진율": p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) + "%" : "-",
      "재고": p.stock,
      "월판매": p.monthlySold,
      "소모성": p.isConsumable ? "Y" : "N",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(upRows), "제품");
  }
  if (serviceMenu && serviceMenu.length > 0) {
    const smRows = serviceMenu.map((s) => ({
      "서비스명": s.name,
      "카테고리": s.category,
      "가격(원)": s.price,
      "소요시간(분)": s.duration,
      "월판매": s.monthlySold,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(smRows), "서비스");
  }

  // Sheet 6: 요약 지표
  const summaryRows = [
    { "지표": "매출", "값": totalSales.toLocaleString() + "원" },
    { "지표": "총 고객수", "값": totalCustomers.toLocaleString() + "명" },
    { "지표": "평균 객단가", "값": totalCustomers > 0 ? Math.round(totalSales / totalCustomers).toLocaleString() + "원" : "-" },
    { "지표": "총 비용", "값": totalCosts.toLocaleString() + "원" },
    { "지표": "순이익", "값": netProfit.toLocaleString() + "원" },
    { "지표": "순이익률", "값": totalSales > 0 ? Math.round((netProfit / totalSales) * 1000) / 10 + "%" : "-" },
    { "지표": "영업일수", "값": monthEntries.length + "일" },
    { "지표": "일평균 매출", "값": monthEntries.length > 0 ? Math.round(totalSales / monthEntries.length).toLocaleString() + "원" : "-" },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, "요약");

  // 다운로드
  const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbOut], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  triggerDownload(blob, `buildup_경영보고서_${month}.xlsx`);
}

// ─── 6. 월간 P&L PDF ───

export async function exportMonthlyPnLPdf(params: {
  month: string;
  storeName?: string;
  entries: DailyEntry[];
  monthlyCosts: MonthlyCosts;
}): Promise<void> {
  const { month, storeName, entries, monthlyCosts } = params;
  const { default: jsPDF } = await import("jspdf");

  const monthEntries = entries.filter((e) => e.date.startsWith(month));
  const totalSales = monthEntries.reduce((s, e) => s + e.sales, 0);
  const totalCustomers = monthEntries.reduce((s, e) => s + e.customers, 0);
  const totalCosts = monthlyCosts.ingredients + monthlyCosts.labor + monthlyCosts.rent + monthlyCosts.utilities
    + monthlyCosts.sga + monthlyCosts.marketing + monthlyCosts.other + monthlyCosts.interest;
  const netProfit = totalSales - totalCosts;
  const pct = (v: number) => (totalSales > 0 ? ((v / totalSales) * 100).toFixed(1) + "%" : "-");
  const fmt = (n: number) => `${Math.round(n).toLocaleString()} KRW`;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  // 한글 미지원 (jsPDF 기본 폰트) → 영문 기반 생성, 상점명만 간단히
  let y = 60;

  // 타이틀
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`Monthly P&L Report - ${month}`, 40, y);
  y += 18;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  if (storeName) {
    doc.text(`Store: ${storeName}`, 40, y);
    y += 14;
  }
  doc.text(`Generated: ${new Date().toISOString().slice(0, 10)} | build.up`, 40, y);
  y += 26;

  // 요약 박스
  doc.setFillColor(240, 244, 248);
  doc.rect(40, y, 515, 70, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SUMMARY", 52, y + 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Revenue: ${fmt(totalSales)}`, 52, y + 34);
  doc.text(`Customers: ${totalCustomers.toLocaleString()}`, 220, y + 34);
  doc.text(`Avg Ticket: ${totalCustomers > 0 ? fmt(totalSales / totalCustomers) : "-"}`, 390, y + 34);
  doc.text(`Total Costs: ${fmt(totalCosts)}`, 52, y + 50);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(netProfit >= 0 ? 5 : 220, netProfit >= 0 ? 150 : 38, netProfit >= 0 ? 105 : 38);
  doc.text(`Net Profit: ${fmt(netProfit)} (${pct(netProfit)})`, 220, y + 50);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  y += 90;

  // P&L 테이블
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Profit & Loss Statement", 40, y);
  y += 20;

  const rows: Array<[string, number, string]> = [
    ["Revenue", totalSales, "100%"],
    ["(-) COGS / Ingredients", -monthlyCosts.ingredients, pct(monthlyCosts.ingredients)],
    ["Gross Profit", totalSales - monthlyCosts.ingredients, pct(totalSales - monthlyCosts.ingredients)],
    ["(-) Labor", -monthlyCosts.labor, pct(monthlyCosts.labor)],
    ["(-) Rent", -monthlyCosts.rent, pct(monthlyCosts.rent)],
    ["(-) Utilities", -monthlyCosts.utilities, pct(monthlyCosts.utilities)],
    ["(-) SG&A", -monthlyCosts.sga, pct(monthlyCosts.sga)],
    ["(-) Marketing", -monthlyCosts.marketing, pct(monthlyCosts.marketing)],
    ["(-) Other", -monthlyCosts.other, pct(monthlyCosts.other)],
    ["Operating Profit", totalSales - totalCosts + monthlyCosts.interest, pct(totalSales - totalCosts + monthlyCosts.interest)],
    ["(-) Interest", -monthlyCosts.interest, pct(monthlyCosts.interest)],
    ["NET PROFIT", netProfit, pct(netProfit)],
  ];

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Item", 40, y);
  doc.text("Amount", 340, y, { align: "right" });
  doc.text("% of Rev", 500, y, { align: "right" });
  y += 6;
  doc.setLineWidth(0.5);
  doc.line(40, y, 540, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  rows.forEach((r) => {
    const isHighlight = r[0] === "Revenue" || r[0] === "Gross Profit" || r[0] === "Operating Profit" || r[0] === "NET PROFIT";
    if (isHighlight) doc.setFont("helvetica", "bold");
    doc.text(r[0], 40, y);
    doc.text(fmt(r[1]), 340, y, { align: "right" });
    doc.text(r[2], 500, y, { align: "right" });
    if (isHighlight) doc.setFont("helvetica", "normal");
    y += 14;
  });

  y += 10;
  doc.setLineWidth(0.5);
  doc.line(40, y, 540, y);
  y += 20;

  // 운영 지표
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Operating Metrics", 40, y);
  y += 18;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const metrics = [
    ["Working days", `${monthEntries.length} days`],
    ["Avg daily sales", monthEntries.length > 0 ? fmt(totalSales / monthEntries.length) : "-"],
    ["Highest day", monthEntries.length > 0 ? fmt(Math.max(...monthEntries.map((e) => e.sales))) : "-"],
    ["Lowest day", monthEntries.length > 0 ? fmt(Math.min(...monthEntries.map((e) => e.sales))) : "-"],
    ["Cost ratio", totalSales > 0 ? ((totalCosts / totalSales) * 100).toFixed(1) + "%" : "-"],
    ["Net margin", pct(netProfit)],
  ];
  metrics.forEach(([k, v]) => {
    doc.text(`${k}:`, 40, y);
    doc.text(v, 340, y, { align: "right" });
    y += 14;
  });

  // 푸터
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("Generated by build.up — roadmap-first startup companion", 40, 810);

  // 저장
  doc.save(`buildup_PnL_${month}.pdf`);
}

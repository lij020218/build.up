"use client";

import { useOperationsStore, useFinanceStore } from "../stores";
import type {
  InventoryItem,
  InvForm,
  Employee,
  DeliveryPlatform,
  Product,
  UnifiedProduct,
  ServiceMenuItem,
  TaxSettings,
  FixedExpense,
} from "../stores/operations-store";
import type { DailyEntry, CostSnapshot } from "../stores/finance-store";
import type { DashboardDeps } from "../types";
import { applyRecipeStockDelta } from "../recipe-cost";
import { getKstDate } from "../utils/business-day";

/** useOperationsHandlers 전용 추가 deps */
export type OperationsHandlersDeps = DashboardDeps & {
  flushStoreData: () => void;
  flushStoreDataImmediate?: () => Promise<void>;
  scheduleAiRefresh: () => void;
};

export function useOperationsHandlers(deps: OperationsHandlersDeps) {
  const { language, flushStoreData, flushStoreDataImmediate, scheduleAiRefresh } = deps;

  // ⚠️ 명시적 저장 (save 버튼 클릭 류) 은 debounce 우회하고 즉시 Supabase 반영.
  //   종전엔 flushStoreData() 로 1초 debounce 됐는데, 사장님이 저장 직후 새로고침·다른 기기 열면
  //   stale 보이는 손실 위험. flushStoreDataImmediate 가 있으면 await 없이 발사 (UI 비차단).
  const flushImmediate = () => {
    if (flushStoreDataImmediate) {
      flushStoreDataImmediate().catch((err) => {
        console.warn("[ops] flushStoreDataImmediate failed:", err);
      });
    } else {
      flushStoreData();
    }
  };

  // ── Operations store ──
  const {
    inventory, setInventory,
    invForm, setInvForm,
    invWasteQty, invWasteReason,
    setInvWasteTarget, setInvWasteQty, setInvWasteReason,
    employees, setEmployees,
    empEditId, empName, empWage, empHours, empInsured, empHireDate,
    setEmpFormOpen, setEmpEditId, setEmpName, setEmpWage, setEmpHours, setEmpInsured, setEmpHireDate,
    fixedExpenses, setFixedExpenses,
    fexpEditId, fexpName, fexpAmount, fexpDueDay, fexpCategory,
    setFexpFormOpen, setFexpEditId, setFexpName, setFexpAmount, setFexpDueDay, setFexpCategory,
    deliveryPlatforms, setDeliveryPlatforms,
    monthlyDeliverySales, setMonthlyDeliverySales,
    dlvEditId, dlvName, dlvRate, dlvAd,
    setDlvFormOpen, setDlvEditId, setDlvName, setDlvRate, setDlvAd,
    products, setProducts,
    prodEditId, prodName, prodCategory, prodPrice, prodCost, prodStock, prodUnit,
    setProdFormOpen, setProdEditId, setProdName, setProdCategory,
    setProdPrice, setProdCost, setProdStock, setProdUnit,
    setUnifiedProducts,
    setServiceMenuItems,
    setTaxSettings,
  } = useOperationsStore();

  // ── Finance store ──
  const {
    dailyEntries, setDailyEntries,
    dailyDateInput, dailySalesInput, dailyCustomersInput,
    setDailySalesInput, setDailyCustomersInput,
    setMonthlyCosts,
    costHistory, setCostHistory,
    costCogsText, costIngredientsText, costLaborText, costRentText, costUtilitiesText, costOtherText,
    costSgaText, costMarketingText, costInterestText,
  } = useFinanceStore();

  // ─────────────────────────────────────────────
  // 매출 / 비용
  // ─────────────────────────────────────────────

  const handleAddDailyEntry = async () => {
    // 2026-05-27 보안 (P1-5): 사장님 매출/고객수 데이터 로깅 차단. dev 환경에서만.
    const __dev = process.env.NODE_ENV !== "production";
    if (__dev) console.info("[buildup] handleAddDailyEntry called", { dailySalesInput, dailyCustomersInput, dailyDateInput });
    // ⚠️ 빈 input은 저장 X (사용자 입력 의지 없음 = 누름 실수).
    // 단, "0"은 정당한 입력 (휴무일·매출 없는 날) → 그대로 저장.
    if (dailySalesInput === undefined || dailySalesInput === null || dailySalesInput === "") {
      if (__dev) console.warn("[buildup] handleAddDailyEntry: empty dailySalesInput, skipping");
      return;
    }
    const parsedSales = Number(dailySalesInput.replace(/[^0-9]/g, "")) || 0;
    if (__dev) console.info("[buildup] handleAddDailyEntry: saving", { parsedSales, dailyDateInput });
    // 기존 기록의 productSales 등 추가 필드를 보존
    const existing = (dailyEntries as Array<Record<string, unknown>>).find((e) => e.date === dailyDateInput);
    const entry = {
      ...(existing ?? {}),
      date: dailyDateInput,
      sales: parsedSales * 10000,
      customers: Number(dailyCustomersInput.replace(/[^0-9]/g, "")) || 0
    };
    // 같은 날짜의 기존 entry는 새 값으로 덮어쓰기 (날짜 unique 보장)
    const next = [
      ...(dailyEntries as DailyEntry[]).filter((e) => e.date !== dailyDateInput),
      entry as DailyEntry
    ].sort((a, b) => b.date.localeCompare(a.date));
    setDailyEntries(next);
    if (__dev) console.info("[buildup] handleAddDailyEntry: setDailyEntries called", { totalEntries: next.length, newEntry: entry });
    setDailySalesInput("");
    setDailyCustomersInput("");
    // ⚠️ 매출은 critical data → 즉시 Supabase 저장 (debounce 건너뛰기).
    // 모바일·다른 기기 동기화에 필수. 실패 시 사용자 가시 (persistStatus="error").
    if (flushStoreDataImmediate) {
      try {
        await flushStoreDataImmediate();
        if (__dev) console.info("[buildup] handleAddDailyEntry: Supabase save SUCCESS");
      } catch (err) {
        // 에러는 이미 onboarding store에 기록됨 — 사용자가 헤더 indicator로 확인
        // localStorage 백업은 Zustand persist가 처리하므로 여기서 추가 작업 불필요
        // Sentry 가 console.error 자동 캡처 — 사용자 가시성에 영향 없음
        console.error("[buildup] handleAddDailyEntry: Supabase save FAILED", err);
      }
    } else {
      if (__dev) console.warn("[buildup] handleAddDailyEntry: flushStoreDataImmediate not available, falling back to debounced flush");
      flushStoreData();
    }
    scheduleAiRefresh(); // 매출 입력 → AI 경영 우선순위 자동 갱신
  };

  // targetMonth 미지정 시 현재 월. ⚠️ 과거 월 비용 편집기를 새로 붙일 땐 반드시 그 월을 넘겨야
  //   현재 월 스냅샷을 덮어쓰지 않는다(매출 날짜 버그의 월 버전 — 방어적 파라미터화).
  const handleSaveMonthlyCosts = (targetMonth?: string) => {
    const costs = {
      ingredients: (Number((costCogsText ?? costIngredientsText ?? "").replace(/[^0-9]/g, "")) || 0) * 10000,
      labor: (Number(costLaborText.replace(/[^0-9]/g, "")) || 0) * 10000,
      rent: (Number(costRentText.replace(/[^0-9]/g, "")) || 0) * 10000,
      utilities: (Number(costUtilitiesText.replace(/[^0-9]/g, "")) || 0) * 10000,
      sga: (Number((costSgaText ?? "").replace(/[^0-9]/g, "")) || 0) * 10000,
      marketing: (Number((costMarketingText ?? "").replace(/[^0-9]/g, "")) || 0) * 10000,
      other: (Number(costOtherText.replace(/[^0-9]/g, "")) || 0) * 10000,
      interest: (Number((costInterestText ?? "").replace(/[^0-9]/g, "")) || 0) * 10000
    };
    setMonthlyCosts(costs);
    // Archive to costHistory (월별 스냅샷, 최대 12개월)
    const month = targetMonth ?? getKstDate(new Date()).slice(0, 7);
    const snap: CostSnapshot = { ...costs, month };
    const updatedHistory = [...costHistory.filter(h => h.month !== month), snap]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
    setCostHistory(updatedHistory);
    flushImmediate();
    scheduleAiRefresh(); // 비용 변경 → AI 경영 우선순위 자동 갱신
  };

  // ─────────────────────────────────────────────
  // 재고 (Inventory)
  // ─────────────────────────────────────────────

  const saveInventory = (next: InventoryItem[]) => {
    setInventory(next);
    flushImmediate();
    scheduleAiRefresh(); // 재고 변경 → AI 우선순위 갱신
  };

  const emptyInvForm: InvForm = {
    open: false, editId: null, name: "", qty: "", unit: "개", threshold: "",
    unitCost: "", category: "other", itemType: "material" as const,
    sellingPrice: "", displayCategory: "", expiryDate: "", supplierName: "", url: "", leadTimeDays: "", dailyUsage: "",
  };

  const handleInvSave = () => {
    if (!invForm.name.trim()) return;
    const existing = inventory.find(i => i.id === invForm.editId);
    const item: InventoryItem = {
      id: invForm.editId ?? Date.now().toString(),
      name: invForm.name.trim(),
      quantity: Number(invForm.qty) || 0,
      unit: invForm.unit,
      minThreshold: Number(invForm.threshold) || 0,
      unitCost: Number(invForm.unitCost) || 0,
      category: invForm.category,
      itemType: invForm.itemType,
      sellingPrice: Number(invForm.sellingPrice) || 0,
      // 상품(product)만 자유분류 보존 — 식자재(material)는 enum category 로 정리. (2026-07-22 통합)
      displayCategory: invForm.itemType === "product" ? (invForm.displayCategory?.trim() || undefined) : undefined,
      expiryDate: invForm.expiryDate,
      supplierName: invForm.supplierName.trim(),
      supplierUrl: invForm.url.trim(),
      leadTimeDays: Number(invForm.leadTimeDays) || 1,
      dailyUsage: Number(invForm.dailyUsage) || 0,
      lastOrderedAt: existing?.lastOrderedAt ?? "",
      wasteLog: existing?.wasteLog ?? [],
    };
    saveInventory(invForm.editId
      ? inventory.map(i => i.id === invForm.editId ? item : i)
      : [...inventory, item]);
    setInvForm(emptyInvForm);
  };

  const handleInvQty = (id: string, delta: number) => {
    saveInventory(inventory.map(i =>
      i.id === id ? { ...i, quantity: Math.max(0, parseFloat((i.quantity + delta).toFixed(2))) } : i
    ));
  };

  const handleInvDelete = (id: string) => {
    saveInventory(inventory.filter(i => i.id !== id));
  };

  const openInvEdit = (item: InventoryItem) => {
    setInvForm({
      open: true, editId: item.id, name: item.name, qty: String(item.quantity), unit: item.unit,
      threshold: String(item.minThreshold), unitCost: item.unitCost ? String(item.unitCost) : "",
      category: item.category ?? "other", itemType: item.itemType ?? "material",
      sellingPrice: item.sellingPrice ? String(item.sellingPrice) : "",
      displayCategory: item.displayCategory ?? "",
      expiryDate: item.expiryDate ?? "",
      supplierName: item.supplierName ?? "", url: item.supplierUrl ?? "",
      leadTimeDays: item.leadTimeDays ? String(item.leadTimeDays) : "",
      dailyUsage: item.dailyUsage ? String(item.dailyUsage) : "",
    });
  };

  const handleInvWaste = (itemId: string) => {
    const qty = parseFloat(invWasteQty) || 0;
    if (qty <= 0) return;
    const today = getKstDate(new Date());
    saveInventory(inventory.map(i => i.id !== itemId ? i : {
      ...i,
      quantity: Math.max(0, parseFloat((i.quantity - qty).toFixed(2))),
      wasteLog: [...(i.wasteLog ?? []), { date: today, qty, reason: invWasteReason }],
    }));
    setInvWasteTarget(null);
    setInvWasteQty("");
    setInvWasteReason("");
  };

  const handleMarkOrdered = (itemId: string) => {
    const today = getKstDate(new Date());
    saveInventory(inventory.map(i => i.id === itemId ? { ...i, lastOrderedAt: today } : i));
  };

  // ─────────────────────────────────────────────
  // 직원 (Employees)
  // ─────────────────────────────────────────────

  const saveEmployees = (list: Employee[]) => {
    setEmployees(list);
    flushImmediate();
    scheduleAiRefresh(); // 직원 변경 → AI 우선순위 갱신
  };

  const handleEmpSave = () => {
    const wage = parseInt(empWage.replace(/[^0-9]/g, ""), 10);
    const hours = parseFloat(empHours.replace(/[^0-9.]/g, ""));
    if (!empName.trim() || !wage || !hours) return;
    const autoInsured = hours * 4.345 >= 60;
    const entry: Employee = {
      id: empEditId ?? `emp-${Date.now()}`,
      name: empName.trim(),
      hourlyWage: wage,
      weeklyHours: hours,
      isInsured: empInsured || autoInsured,
      hireDate: empHireDate.trim() || undefined,
    };
    const next = empEditId
      ? employees.map(e => e.id === empEditId ? entry : e)
      : [...employees, entry];
    saveEmployees(next);
    setEmpFormOpen(false); setEmpEditId(null);
    setEmpName(""); setEmpWage(""); setEmpHours(""); setEmpInsured(false); setEmpHireDate("");
  };

  const handleEmpDelete = (id: string) => saveEmployees(employees.filter(e => e.id !== id));

  const openEmpEdit = (emp: Employee) => {
    setEmpEditId(emp.id); setEmpName(emp.name);
    setEmpWage(String(emp.hourlyWage)); setEmpHours(String(emp.weeklyHours));
    setEmpInsured(emp.isInsured);
    setEmpHireDate(emp.hireDate ?? "");
    setEmpFormOpen(true);
  };

  // ─────────────────────────────────────────────
  // 고정비 (Fixed Expenses)
  // ─────────────────────────────────────────────

  const saveFixedExpenses = (list: FixedExpense[]) => {
    setFixedExpenses(list);
    flushImmediate();
  };

  const handleFexpSave = () => {
    const amount = parseInt(fexpAmount.replace(/[^0-9]/g, ""), 10) * 10000;
    const dueDay = parseInt(fexpDueDay.replace(/[^0-9]/g, ""), 10);
    if (!fexpName.trim() || !amount || !dueDay || dueDay < 1 || dueDay > 31) return;
    const entry: FixedExpense = {
      id: fexpEditId ?? `fexp-${Date.now()}`,
      name: fexpName.trim(),
      amount,
      dueDay,
      category: fexpCategory,
    };
    const next = fexpEditId
      ? fixedExpenses.map(e => e.id === fexpEditId ? entry : e)
      : [...fixedExpenses, entry];
    saveFixedExpenses(next);
    setFexpFormOpen(false); setFexpEditId(null);
    setFexpName(""); setFexpAmount(""); setFexpDueDay(""); setFexpCategory("other");
  };

  const handleFexpDelete = (id: string) => saveFixedExpenses(fixedExpenses.filter(e => e.id !== id));

  const openFexpEdit = (fe: FixedExpense) => {
    setFexpEditId(fe.id); setFexpName(fe.name);
    setFexpAmount(String(Math.round(fe.amount / 10000)));
    setFexpDueDay(String(fe.dueDay)); setFexpCategory(fe.category);
    setFexpFormOpen(true);
  };

  // ─────────────────────────────────────────────
  // 배달 플랫폼 (Delivery Platforms)
  // ─────────────────────────────────────────────

  const saveDeliveryPlatforms = (list: DeliveryPlatform[]) => {
    setDeliveryPlatforms(list);
    flushImmediate();
  };

  const saveMonthlyDeliverySales = (map: Record<string, number>) => {
    setMonthlyDeliverySales(map);
    flushImmediate();
  };

  const handleDlvSave = () => {
    const rate = parseFloat(dlvRate) || 0;
    const ad = parseFloat(dlvAd) || 0;
    if (!dlvName.trim() || rate <= 0) return;
    const entry: DeliveryPlatform = {
      id: dlvEditId ?? `dlv-${Date.now()}`,
      name: dlvName.trim(), commissionRate: rate, adCostMonthly: ad,
    };
    const next = dlvEditId
      ? deliveryPlatforms.map(p => p.id === dlvEditId ? entry : p)
      : [...deliveryPlatforms, entry];
    saveDeliveryPlatforms(next);
    setDlvFormOpen(false); setDlvEditId(null);
    setDlvName(""); setDlvRate(""); setDlvAd("");
  };

  const handleDlvDelete = (id: string) => {
    saveDeliveryPlatforms(deliveryPlatforms.filter(p => p.id !== id));
    const next = { ...monthlyDeliverySales }; delete next[id];
    saveMonthlyDeliverySales(next);
  };

  const openDlvEdit = (p: DeliveryPlatform) => {
    setDlvEditId(p.id); setDlvName(p.name);
    setDlvRate(String(p.commissionRate)); setDlvAd(String(p.adCostMonthly));
    setDlvFormOpen(true);
  };

  // ─────────────────────────────────────────────
  // 상품/메뉴 (Products)
  // ─────────────────────────────────────────────

  const saveProducts = (list: Product[]) => {
    setProducts(list);
    flushImmediate();
  };

  const saveUnifiedProducts = (list: UnifiedProduct[]) => {
    setUnifiedProducts(list);
    flushImmediate();
  };

  const saveServiceMenuItems = (list: ServiceMenuItem[]) => {
    setServiceMenuItems(list);
    flushImmediate();
  };

  // ── 상품/메뉴 정본 = inventory(itemType="product") — iOS·홈 MenuProfitabilityCard·로드맵과 통일.
  //    (2026-07-22 상품모델 통합) 신규 입력은 inventory 로, 레거시 products 배열 항목은 제자리 편집(무손실·롤백).
  //    소스 인식: id 가 inventory 에 있으면 inventory, 아니면 legacy products.
  const handleProdSave = () => {
    const price = parseInt(prodPrice.replace(/[^0-9]/g, ""), 10);
    const cost = parseInt(prodCost.replace(/[^0-9]/g, ""), 10) || 0;
    const stock = parseInt(prodStock.replace(/[^0-9]/g, ""), 10) || 0;
    if (!prodName.trim() || !price) return;
    const cat = prodCategory.trim() || (language === "ko" ? "기타" : "Other");

    const invExisting = prodEditId ? inventory.find(i => i.id === prodEditId) : undefined;
    const prodLegacy = prodEditId ? products.find(p => p.id === prodEditId) : undefined;

    if (prodEditId && prodLegacy && !invExisting) {
      // 레거시 products 항목 편집 → 제자리 유지 (마이그레이션 없이 롤백 안전)
      const entry: Product = {
        id: prodEditId, name: prodName.trim(), category: cat,
        price, cost, stock, monthlySold: prodLegacy.monthlySold ?? 0, unit: prodUnit,
      };
      saveProducts(products.map(p => p.id === prodEditId ? entry : p));
    } else {
      // 신규 또는 inventory 항목 편집 → inventory(itemType=product) 정본에 기록.
      //   자유분류(cat)는 displayCategory 로 무손실 보존, enum category 는 기존값/other.
      const item: InventoryItem = {
        id: prodEditId ?? `prod-${Date.now()}`,
        name: prodName.trim(),
        quantity: stock, unit: prodUnit, minThreshold: invExisting?.minThreshold ?? 0,
        unitCost: cost, category: invExisting?.category ?? "other", itemType: "product",
        sellingPrice: price, monthlySold: invExisting?.monthlySold ?? 0,
        displayCategory: cat,
        expiryDate: invExisting?.expiryDate ?? "", supplierName: invExisting?.supplierName ?? "",
        supplierUrl: invExisting?.supplierUrl ?? "", leadTimeDays: invExisting?.leadTimeDays ?? 0,
        dailyUsage: invExisting?.dailyUsage ?? 0, lastOrderedAt: invExisting?.lastOrderedAt ?? "",
        wasteLog: invExisting?.wasteLog ?? [],
      };
      saveInventory(invExisting
        ? inventory.map(i => i.id === prodEditId ? item : i)
        : [...inventory, item]);
    }
    setProdFormOpen(false); setProdEditId(null);
    setProdName(""); setProdCategory(""); setProdPrice(""); setProdCost(""); setProdStock(""); setProdUnit("개");
  };

  const handleProdDelete = (id: string) => {
    if (inventory.some(i => i.id === id)) saveInventory(inventory.filter(i => i.id !== id));
    else saveProducts(products.filter(p => p.id !== id));
  };

  const handleProdSoldChange = (id: string, delta: number) => {
    if (inventory.some(i => i.id === id)) {
      // 1) 판매량 갱신  2) 레시피(BOM) 있으면 재료 재고 자동 차감(delta>0)·복구(delta<0). (2026-07-22)
      const withSold = inventory.map(i => i.id === id ? { ...i, monthlySold: Math.max(0, (i.monthlySold ?? 0) + delta) } : i);
      saveInventory(applyRecipeStockDelta(withSold, id, delta));
    } else {
      saveProducts(products.map(p => p.id === id ? { ...p, monthlySold: Math.max(0, p.monthlySold + delta) } : p));
    }
  };

  // 정규화 표시항목(inventory.product + legacy products)에서 폼으로. category = displayCategory||category.
  const openProdEdit = (p: { id: string; name: string; category: string; price: number; cost: number; stock: number; unit: string }) => {
    setProdEditId(p.id); setProdName(p.name); setProdCategory(p.category);
    setProdPrice(String(p.price)); setProdCost(String(p.cost)); setProdStock(String(p.stock));
    setProdUnit(p.unit); setProdFormOpen(true);
  };

  // ─────────────────────────────────────────────
  // 세금 설정 (Tax Settings)
  // ─────────────────────────────────────────────

  const saveTaxSettings = (s: TaxSettings) => {
    setTaxSettings(s);
    flushImmediate();
  };

  return {
    // 매출/비용
    handleAddDailyEntry,
    handleSaveMonthlyCosts,
    // 재고
    saveInventory,
    emptyInvForm,
    handleInvSave,
    handleInvQty,
    handleInvDelete,
    openInvEdit,
    handleInvWaste,
    handleMarkOrdered,
    // 직원
    saveEmployees,
    handleEmpSave,
    handleEmpDelete,
    openEmpEdit,
    // 고정비
    saveFixedExpenses,
    handleFexpSave,
    handleFexpDelete,
    openFexpEdit,
    // 배달
    saveDeliveryPlatforms,
    saveMonthlyDeliverySales,
    handleDlvSave,
    handleDlvDelete,
    openDlvEdit,
    // 상품
    saveProducts,
    saveUnifiedProducts,
    saveServiceMenuItems,
    handleProdSave,
    handleProdDelete,
    handleProdSoldChange,
    openProdEdit,
    // 세금
    saveTaxSettings,
  };
}

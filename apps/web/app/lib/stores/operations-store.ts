import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types (re-exported from useDashboard for backwards compat) ───

/** 레시피 재료 한 줄 — 메뉴 1개당 들어가는 재고(material) 소요량. (2026-07-22 레시피/BOM)
 *  materialId = inventory 내 material 항목 id. qty 는 unit 기준(0.3 등 소수 허용). */
export type RecipeIngredient = { materialId: string; qty: number; unit: string };

export type InventoryItem = {
  id: string; name: string; quantity: number; unit: string; minThreshold: number;
  unitCost: number;
  category: "fresh" | "dry" | "frozen" | "beverage" | "supply" | "other";
  itemType: "material" | "product";
  sellingPrice: number;
  /** 월 판매량 — 소매 상품(itemType=product)의 sell-through 계산용. iOS BUInventoryItem 정합
   *  (2026-07-22 소매 상품모델 통합: inventory 를 소매 판매상품 정본으로. 기존엔 웹만 누락). */
  monthlySold?: number;
  /** 상품류(itemType=product)의 자유문자열 분류 — 메뉴(메인/사이드/음료)·소매(의류/잡화)·서비스(커트/펌).
   *  category enum 은 식자재 개념(신선/냉동)이라 상품엔 부적합 → 사장님이 입력한 분류를 무손실 보존.
   *  material 은 이 필드 미사용(enum category 로 식자재 정리). (2026-07-22 상품모델 통합) */
  displayCategory?: string;
  /** 레시피(BOM) — 메뉴(itemType=product)에 들어가는 재료 소요량. 원가율 계산 + 판매 시 재고 자동차감.
   *  비어있으면 수동 unitCost 폴백. material 은 미사용. (2026-07-22 레시피/BOM) */
  recipe?: RecipeIngredient[];
  expiryDate: string; supplierName: string; supplierUrl: string;
  leadTimeDays: number; dailyUsage: number; lastOrderedAt: string;
  wasteLog: { date: string; qty: number; reason: string }[];
};

export type InvForm = {
  open: boolean; editId: string | null;
  name: string; qty: string; unit: string; threshold: string; unitCost: string;
  category: "fresh" | "dry" | "frozen" | "beverage" | "supply" | "other";
  itemType: "material" | "product";
  sellingPrice: string;
  /** 상품류 자유문자열 분류 (메인/사이드·의류/잡화 등). material 은 미사용. (2026-07-22 상품모델 통합) */
  displayCategory?: string;
  expiryDate: string; supplierName: string; url: string; leadTimeDays: string; dailyUsage: string;
};

export type Employee = {
  id: string; name: string; hourlyWage: number; weeklyHours: number; isInsured: boolean;
  /** 입사일 (ISO YYYY-MM-DD) — 연차 1년 도래 추적용. null = 미입력 → 연차 알림 비활성. */
  hireDate?: string;
};

export type DeliveryPlatform = {
  id: string; name: string; commissionRate: number; adCostMonthly: number;
};

export type Product = {
  id: string; name: string; category: string; price: number; cost: number;
  stock: number; monthlySold: number; unit: string;
};

export type UnifiedProduct = {
  id: string; name: string; category: string; price: number; cost: number;
  stock: number; monthlySold: number; unit: string;
  minThreshold: number; supplierName: string; supplierUrl: string;
  leadTimeDays: number; dailyUsage: number; lastOrderedAt: string; isConsumable: boolean;
};

export type ServiceMenuItem = {
  id: string; name: string; category: string; price: number; duration: number; monthlySold: number;
};

export type TaxSettings = { vatType: "general" | "simplified"; hasEmployees: boolean };

export type FixedExpense = {
  id: string; name: string; amount: number; dueDay: number;
  category: "rent" | "loan" | "insurance" | "other";
};

export type Member = {
  id: string; name: string; plan: string; fee: number; startDate: string; endDate: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;           // "Free", "Standard", "Pro"
  price: number;          // 월 가격 (원)
  billingCycle: "monthly" | "annual";
  isActive: boolean;
};

export type Subscriber = {
  id: string;
  name: string;
  email?: string;
  planId: string;          // references SubscriptionPlan.id
  status: "active" | "churned" | "trial";
  joinedAt: string;        // ISO date
  churnedAt?: string;
};

// ─── Form defaults ───

const EMPTY_INV_FORM: InvForm = {
  open: false, editId: null, name: "", qty: "", unit: "개", threshold: "",
  unitCost: "", category: "other", itemType: "material", sellingPrice: "",
  expiryDate: "", supplierName: "", url: "", leadTimeDays: "", dailyUsage: "",
};

// ─── Store ───

type OperationsState = {
  // 재고
  inventory: InventoryItem[];
  invForm: InvForm;
  invCategoryFilter: string;
  invWasteTarget: string | null;
  invWasteQty: string;
  invWasteReason: string;
  // 직원
  employees: Employee[];
  empFormOpen: boolean;
  empEditId: string | null;
  empName: string;
  empWage: string;
  empHours: string;
  empInsured: boolean;
  /** 입사일 (ISO YYYY-MM-DD) — 연차 1년 도래 추적용. 빈 문자열 = 미입력. */
  empHireDate: string;
  // 고정비
  fixedExpenses: FixedExpense[];
  fexpFormOpen: boolean;
  fexpEditId: string | null;
  fexpName: string;
  fexpAmount: string;
  fexpDueDay: string;
  fexpCategory: FixedExpense["category"];
  // 배달
  deliveryPlatforms: DeliveryPlatform[];
  monthlyDeliverySales: Record<string, number>;
  dlvFormOpen: boolean;
  dlvEditId: string | null;
  dlvName: string;
  dlvRate: string;
  dlvAd: string;
  // 상품
  products: Product[];
  prodFormOpen: boolean;
  prodEditId: string | null;
  prodName: string;
  prodCategory: string;
  prodPrice: string;
  prodCost: string;
  prodStock: string;
  prodUnit: string;
  // 통합상품/서비스/세금/온라인
  unifiedProducts: UnifiedProduct[];
  serviceMenuItems: ServiceMenuItem[];
  taxSettings: TaxSettings;
  onlinePlatformSales: Record<string, string>;
  onlineSelectedPlatforms: string[];
  onlineSelectedCourier: string;
  onlineMonthlyParcels: string;
  // 회원
  members: Member[];
  memFormOpen: boolean;
  memName: string;
  memPlan: string;
  memFee: string;
  memEnd: string;
  // 구독 플랜 (SaaS)
  subscriptionPlans: SubscriptionPlan[];
  subPlanFormOpen: boolean;
  subPlanEditId: string | null;
  subPlanName: string;
  subPlanPrice: string;
  subPlanCycle: "monthly" | "annual";
  // 구독 고객
  subscribers: Subscriber[];
  subCustomerFormOpen: boolean;
  subCustomerName: string;
  subCustomerEmail: string;
  subCustomerPlanId: string;
};

type OperationsActions = {
  // 재고
  setInventory: (items: InventoryItem[]) => void;
  setInvForm: (form: InvForm | ((prev: InvForm) => InvForm)) => void;
  setInvCategoryFilter: (v: string) => void;
  setInvWasteTarget: (v: string | null) => void;
  setInvWasteQty: (v: string) => void;
  setInvWasteReason: (v: string) => void;
  emptyInvForm: () => void;
  // 직원
  setEmployees: (items: Employee[]) => void;
  setEmpFormOpen: (v: boolean) => void;
  setEmpEditId: (v: string | null) => void;
  setEmpName: (v: string) => void;
  setEmpWage: (v: string) => void;
  setEmpHours: (v: string) => void;
  setEmpInsured: (v: boolean) => void;
  setEmpHireDate: (v: string) => void;
  // 고정비
  setFixedExpenses: (items: FixedExpense[]) => void;
  setFexpFormOpen: (v: boolean) => void;
  setFexpEditId: (v: string | null) => void;
  setFexpName: (v: string) => void;
  setFexpAmount: (v: string) => void;
  setFexpDueDay: (v: string) => void;
  setFexpCategory: (v: FixedExpense["category"]) => void;
  // 배달
  setDeliveryPlatforms: (items: DeliveryPlatform[]) => void;
  setMonthlyDeliverySales: (v: Record<string, number>) => void;
  setDlvFormOpen: (v: boolean) => void;
  setDlvEditId: (v: string | null) => void;
  setDlvName: (v: string) => void;
  setDlvRate: (v: string) => void;
  setDlvAd: (v: string) => void;
  // 상품
  setProducts: (items: Product[]) => void;
  setProdFormOpen: (v: boolean) => void;
  setProdEditId: (v: string | null) => void;
  setProdName: (v: string) => void;
  setProdCategory: (v: string) => void;
  setProdPrice: (v: string) => void;
  setProdCost: (v: string) => void;
  setProdStock: (v: string) => void;
  setProdUnit: (v: string) => void;
  // 통합상품/서비스/세금/온라인
  setUnifiedProducts: (items: UnifiedProduct[]) => void;
  setServiceMenuItems: (items: ServiceMenuItem[]) => void;
  setTaxSettings: (v: TaxSettings | ((prev: TaxSettings) => TaxSettings)) => void;
  setOnlinePlatformSales: (v: Record<string, string>) => void;
  setOnlineSelectedPlatforms: (v: string[]) => void;
  setOnlineSelectedCourier: (v: string) => void;
  setOnlineMonthlyParcels: (v: string) => void;
  // 회원
  setMembers: (items: Member[]) => void;
  setMemFormOpen: (v: boolean) => void;
  setMemName: (v: string) => void;
  setMemPlan: (v: string) => void;
  setMemFee: (v: string) => void;
  setMemEnd: (v: string) => void;
  // 구독 플랜
  setSubscriptionPlans: (items: SubscriptionPlan[]) => void;
  setSubPlanFormOpen: (v: boolean) => void;
  setSubPlanEditId: (v: string | null) => void;
  setSubPlanName: (v: string) => void;
  setSubPlanPrice: (v: string) => void;
  setSubPlanCycle: (v: "monthly" | "annual") => void;
  // 구독 고객
  setSubscribers: (items: Subscriber[]) => void;
  setSubCustomerFormOpen: (v: boolean) => void;
  setSubCustomerName: (v: string) => void;
  setSubCustomerEmail: (v: string) => void;
  setSubCustomerPlanId: (v: string) => void;
  // 리셋
  resetAll: () => void;
};

const initialState: OperationsState = {
  inventory: [],
  invForm: EMPTY_INV_FORM,
  invCategoryFilter: "all",
  invWasteTarget: null,
  invWasteQty: "",
  invWasteReason: "",
  employees: [],
  empFormOpen: false,
  empEditId: null,
  empName: "",
  empWage: "",
  empHours: "",
  empInsured: false,
  empHireDate: "",
  fixedExpenses: [],
  fexpFormOpen: false,
  fexpEditId: null,
  fexpName: "",
  fexpAmount: "",
  fexpDueDay: "",
  fexpCategory: "other",
  deliveryPlatforms: [],
  monthlyDeliverySales: {},
  dlvFormOpen: false,
  dlvEditId: null,
  dlvName: "",
  dlvRate: "",
  dlvAd: "",
  products: [],
  prodFormOpen: false,
  prodEditId: null,
  prodName: "",
  prodCategory: "",
  prodPrice: "",
  prodCost: "",
  prodStock: "",
  prodUnit: "개",
  unifiedProducts: [],
  serviceMenuItems: [],
  taxSettings: { vatType: "general", hasEmployees: false },
  onlinePlatformSales: {},
  onlineSelectedPlatforms: [],
  onlineSelectedCourier: "cj",
  onlineMonthlyParcels: "",
  members: [],
  memFormOpen: false,
  memName: "",
  memPlan: "",
  memFee: "",
  memEnd: "",
  subscriptionPlans: [],
  subPlanFormOpen: false,
  subPlanEditId: null,
  subPlanName: "",
  subPlanPrice: "",
  subPlanCycle: "monthly",
  subscribers: [],
  subCustomerFormOpen: false,
  subCustomerName: "",
  subCustomerEmail: "",
  subCustomerPlanId: "",
};

export const useOperationsStore = create<OperationsState & OperationsActions>()(
  persist(
    (set) => ({
      ...initialState,

      // 재고
      setInventory: (items) => set({ inventory: items }),
      setInvForm: (form) =>
        set((s) => ({ invForm: typeof form === "function" ? form(s.invForm) : form })),
      setInvCategoryFilter: (v) => set({ invCategoryFilter: v }),
      setInvWasteTarget: (v) => set({ invWasteTarget: v }),
      setInvWasteQty: (v) => set({ invWasteQty: v }),
      setInvWasteReason: (v) => set({ invWasteReason: v }),
      emptyInvForm: () => set({ invForm: EMPTY_INV_FORM }),

      // 직원
      setEmployees: (items) => set({ employees: items }),
      setEmpFormOpen: (v) => set({ empFormOpen: v }),
      setEmpEditId: (v) => set({ empEditId: v }),
      setEmpName: (v) => set({ empName: v }),
      setEmpWage: (v) => set({ empWage: v }),
      setEmpHours: (v) => set({ empHours: v }),
      setEmpInsured: (v) => set({ empInsured: v }),
      setEmpHireDate: (v) => set({ empHireDate: v }),

      // 고정비
      setFixedExpenses: (items) => set({ fixedExpenses: items }),
      setFexpFormOpen: (v) => set({ fexpFormOpen: v }),
      setFexpEditId: (v) => set({ fexpEditId: v }),
      setFexpName: (v) => set({ fexpName: v }),
      setFexpAmount: (v) => set({ fexpAmount: v }),
      setFexpDueDay: (v) => set({ fexpDueDay: v }),
      setFexpCategory: (v) => set({ fexpCategory: v }),

      // 배달
      setDeliveryPlatforms: (items) => set({ deliveryPlatforms: items }),
      setMonthlyDeliverySales: (v) => set({ monthlyDeliverySales: v }),
      setDlvFormOpen: (v) => set({ dlvFormOpen: v }),
      setDlvEditId: (v) => set({ dlvEditId: v }),
      setDlvName: (v) => set({ dlvName: v }),
      setDlvRate: (v) => set({ dlvRate: v }),
      setDlvAd: (v) => set({ dlvAd: v }),

      // 상품
      setProducts: (items) => set({ products: items }),
      setProdFormOpen: (v) => set({ prodFormOpen: v }),
      setProdEditId: (v) => set({ prodEditId: v }),
      setProdName: (v) => set({ prodName: v }),
      setProdCategory: (v) => set({ prodCategory: v }),
      setProdPrice: (v) => set({ prodPrice: v }),
      setProdCost: (v) => set({ prodCost: v }),
      setProdStock: (v) => set({ prodStock: v }),
      setProdUnit: (v) => set({ prodUnit: v }),

      // 통합상품/서비스/세금/온라인
      setUnifiedProducts: (items) => set({ unifiedProducts: items }),
      setServiceMenuItems: (items) => set({ serviceMenuItems: items }),
      setTaxSettings: (v) =>
        set((s) => ({ taxSettings: typeof v === "function" ? v(s.taxSettings) : v })),
      setOnlinePlatformSales: (v) => set({ onlinePlatformSales: v }),
      setOnlineSelectedPlatforms: (v) => set({ onlineSelectedPlatforms: v }),
      setOnlineSelectedCourier: (v) => set({ onlineSelectedCourier: v }),
      setOnlineMonthlyParcels: (v) => set({ onlineMonthlyParcels: v }),

      // 회원
      setMembers: (items) => set({ members: items }),
      setMemFormOpen: (v) => set({ memFormOpen: v }),
      setMemName: (v) => set({ memName: v }),
      setMemPlan: (v) => set({ memPlan: v }),
      setMemFee: (v) => set({ memFee: v }),
      setMemEnd: (v) => set({ memEnd: v }),

      // 구독 플랜
      setSubscriptionPlans: (items) => set({ subscriptionPlans: items }),
      setSubPlanFormOpen: (v) => set({ subPlanFormOpen: v }),
      setSubPlanEditId: (v) => set({ subPlanEditId: v }),
      setSubPlanName: (v) => set({ subPlanName: v }),
      setSubPlanPrice: (v) => set({ subPlanPrice: v }),
      setSubPlanCycle: (v) => set({ subPlanCycle: v }),

      // 구독 고객
      setSubscribers: (items) => set({ subscribers: items }),
      setSubCustomerFormOpen: (v) => set({ subCustomerFormOpen: v }),
      setSubCustomerName: (v) => set({ subCustomerName: v }),
      setSubCustomerEmail: (v) => set({ subCustomerEmail: v }),
      setSubCustomerPlanId: (v) => set({ subCustomerPlanId: v }),

      // 리셋
      resetAll: () => set(initialState),
    }),
    {
      name: "foundone-operations",
      skipHydration: true,
      partialize: (state) => ({
        // 폼 UI 상태는 persist 하지 않음 — 데이터만 persist
        inventory: state.inventory,
        employees: state.employees,
        fixedExpenses: state.fixedExpenses,
        deliveryPlatforms: state.deliveryPlatforms,
        monthlyDeliverySales: state.monthlyDeliverySales,
        products: state.products,
        unifiedProducts: state.unifiedProducts,
        serviceMenuItems: state.serviceMenuItems,
        taxSettings: state.taxSettings,
        onlinePlatformSales: state.onlinePlatformSales,
        onlineSelectedPlatforms: state.onlineSelectedPlatforms,
        onlineSelectedCourier: state.onlineSelectedCourier,
        onlineMonthlyParcels: state.onlineMonthlyParcels,
        members: state.members,
        subscriptionPlans: state.subscriptionPlans,
        subscribers: state.subscribers,
      }),
    },
  ),
);

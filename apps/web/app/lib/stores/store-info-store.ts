/**
 * Store Info Store — "내 가게" 페이지 전용 state.
 *
 * 회계·정적 정보. 사장이 직접 입력하는 값만. AI 호출 0.
 * Zustand persist 로 localStorage 동기화 + usePersistence 가 5초마다 Supabase upsert.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Permit = {
  id: string;
  name: string;
  issuedAt?: string;
  expiresAt?: string;
  issuedBy?: string;
  certNumber?: string;
  memo?: string;
};

export type InsurancePolicy = {
  id: string;
  name: string;
  type: string;
  insurer?: string;
  policyNumber?: string;
  startDate?: string;
  expiresAt?: string;
  annualPremium?: number;
  coverageAmount?: number;
  memo?: string;
};

export type Person = {
  id: string;
  name: string;
  kind: string;
  role?: string;
  phone?: string;
  startDate?: string;
  fourInsurance?: string;
  wage?: number;
  memo?: string;
};

export type Tenancy = {
  leaseStartDate?: string;
  leaseEndDate?: string;
  depositKrw?: number;
  monthlyRentKrw?: number;
  monthlyMaintenanceKrw?: number;
  areaSqm?: number;
  areaPyeong?: number;
  floor?: string;
  landlordName?: string;
  landlordPhone?: string;
  renewalIntent?: string;
};

export type DigitalFootprintItem = {
  id: string;
  name: string;
  kind: string;
  vendorName?: string;
  monthlyFeeKrw?: number;
  expiresAt?: string;
  memo?: string;
};

export type Vehicle = {
  id: string;
  name: string;
  plateNumber?: string;
  purchaseDate?: string;
  purchasePriceKrw?: number;
  insuranceExpiresAt?: string;
  memo?: string;
};

export type StorePhoto = { url: string; caption?: string };

type State = {
  // Identity
  mission: string;
  shortDescription: string;
  longDescription: string;
  addressRoad: string;
  addressDetail: string;
  regionCode: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  ownerPhone: string;
  websiteUrl: string;
  instagramUrl: string;
  naverPlaceUrl: string;
  kakaoPlaceUrl: string;
  weeklyHolidays: string[];
  breakTime: string;
  storePhotos: StorePhoto[];

  // Financial
  currentBalanceManualKrw: number | null;
  currentBalanceUpdatedAt: string | null;

  // Legal & Compliance
  bizRegistrationNumber: string;
  bizRegistrationDate: string;
  bizRegistrationType: string;
  industryCode: string;
  telecomSalesNumber: string;
  fourInsuranceEstablished: string;
  permits: Permit[];

  // Money Infrastructure
  bizBankName: string;
  bizBankAccountMasked: string;
  bizCardIssued: string;
  posTerminal: string;
  taxHandling: string;
  cpaName: string;
  cpaPhone: string;

  // People
  peopleDirectory: Person[];

  // Insurance
  insurancePolicies: InsurancePolicy[];

  // Footprint
  tenancy: Tenancy;
  digitalFootprint: DigitalFootprintItem[];
  vehicles: Vehicle[];

  // Industry-specific (sectionId -> 배열 또는 객체)
  industrySpecifics: Record<string, unknown>;

  // 2026-05-12 P1 #13: 사업 서류 PDF 라이브러리.
  // 사장님 발급받은 사업자등록증·영업신고증·통신판매신고·상표등록증 등 한 곳에서 보관.
  // 실제 PDF 는 Supabase Storage 버킷, 여기엔 메타데이터 + URL 만.
  businessDocuments: BusinessDocument[];
};

export type BusinessDocumentKind =
  | "biz-registration"     // 사업자등록증
  | "biz-report-food"      // 영업신고증 — 일반/휴게음식점
  | "biz-report-pet"       // 동물미용업 등록증
  | "biz-report-beauty"    // 미용업 영업신고증
  | "telecom-sales"        // 통신판매업 신고증
  | "hygiene-cert"         // 위생교육 수료증
  | "health-cert"          // 보건증
  | "fire-safety"          // 소방완비증명서
  | "trademark"            // 상표등록증
  | "patent"               // 특허증
  | "venture-cert"         // 벤처기업 확인서
  | "other";

export type BusinessDocument = {
  id: string;
  kind: BusinessDocumentKind;
  filename: string;
  url: string;
  sizeBytes?: number;
  uploadedAt: string;
  expiresAt?: string;            // 위생교육·보건증 만료 추적
  issuedAt?: string;             // 발급일자
  registrationNumber?: string;   // 사업자등록번호·상표등록번호 등
  notes?: string;
};

type Actions = {
  setField: <K extends keyof State>(key: K, value: State[K]) => void;
  setIndustrySpecific: (sectionId: string, value: unknown) => void;
  /** 배열 항목 추가 (id 자동 생성) */
  addArrayItem: <K extends "permits" | "insurancePolicies" | "peopleDirectory" | "digitalFootprint" | "vehicles">(
    key: K,
    item: Omit<State[K][number], "id">,
  ) => void;
  /** 배열 항목 갱신 */
  updateArrayItem: <K extends "permits" | "insurancePolicies" | "peopleDirectory" | "digitalFootprint" | "vehicles">(
    key: K,
    id: string,
    patch: Partial<State[K][number]>,
  ) => void;
  /** 배열 항목 삭제 */
  removeArrayItem: <K extends "permits" | "insurancePolicies" | "peopleDirectory" | "digitalFootprint" | "vehicles">(
    key: K,
    id: string,
  ) => void;
  /** ── industrySpecifics 안의 배열을 functional 하게 다룸 (closure stale 방지) ── */
  addIndustryArrayItem: (sectionId: string, item: Record<string, unknown>) => void;
  updateIndustryArrayItem: (sectionId: string, id: string, patch: Record<string, unknown>) => void;
  removeIndustryArrayItem: (sectionId: string, id: string) => void;
  /** Supabase 로딩 시 일괄 적용 */
  hydrate: (data: Partial<State>) => void;
  /** 리셋 */
  resetAll: () => void;
};

const initialState: State = {
  mission: "",
  shortDescription: "",
  longDescription: "",
  addressRoad: "",
  addressDetail: "",
  regionCode: "",
  latitude: null,
  longitude: null,
  phone: "",
  ownerPhone: "",
  websiteUrl: "",
  instagramUrl: "",
  naverPlaceUrl: "",
  kakaoPlaceUrl: "",
  weeklyHolidays: [],
  breakTime: "",
  storePhotos: [],
  currentBalanceManualKrw: null,
  currentBalanceUpdatedAt: null,
  bizRegistrationNumber: "",
  bizRegistrationDate: "",
  bizRegistrationType: "",
  industryCode: "",
  telecomSalesNumber: "",
  fourInsuranceEstablished: "",
  permits: [],
  bizBankName: "",
  bizBankAccountMasked: "",
  bizCardIssued: "",
  posTerminal: "",
  taxHandling: "",
  cpaName: "",
  cpaPhone: "",
  peopleDirectory: [],
  insurancePolicies: [],
  tenancy: {},
  digitalFootprint: [],
  vehicles: [],
  industrySpecifics: {},
  businessDocuments: [],
};

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useStoreInfoStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initialState,
      setField: (key, value) => set({ [key]: value } as never),
      setIndustrySpecific: (sectionId, value) =>
        set((s) => ({ industrySpecifics: { ...s.industrySpecifics, [sectionId]: value } })),
      addArrayItem: (key, item) =>
        set((s) => ({ [key]: [...(s[key] as unknown[]), { id: newId(), ...item }] } as never)),
      updateArrayItem: (key, id, patch) =>
        set((s) => ({
          [key]: (s[key] as Array<{ id: string }>).map((it) => (it.id === id ? { ...it, ...patch } : it)),
        } as never)),
      removeArrayItem: (key, id) =>
        set((s) => ({
          [key]: (s[key] as Array<{ id: string }>).filter((it) => it.id !== id),
        } as never)),
      // ── industrySpecifics 배열 헬퍼 — 항상 set 안에서 fresh state 읽음 (stale closure 0) ──
      addIndustryArrayItem: (sectionId, item) =>
        set((s) => {
          const existing = (s.industrySpecifics[sectionId] as Array<Record<string, unknown> & { id: string }> | undefined) ?? [];
          return {
            industrySpecifics: {
              ...s.industrySpecifics,
              [sectionId]: [...existing, { id: newId(), ...item }],
            },
          };
        }),
      updateIndustryArrayItem: (sectionId, id, patch) =>
        set((s) => {
          const existing = (s.industrySpecifics[sectionId] as Array<Record<string, unknown> & { id: string }> | undefined) ?? [];
          return {
            industrySpecifics: {
              ...s.industrySpecifics,
              [sectionId]: existing.map((it) => (it.id === id ? { ...it, ...patch } : it)),
            },
          };
        }),
      removeIndustryArrayItem: (sectionId, id) =>
        set((s) => {
          const existing = (s.industrySpecifics[sectionId] as Array<Record<string, unknown> & { id: string }> | undefined) ?? [];
          return {
            industrySpecifics: {
              ...s.industrySpecifics,
              [sectionId]: existing.filter((it) => it.id !== id),
            },
          };
        }),
      hydrate: (data) => set((s) => ({ ...s, ...data })),
      resetAll: () => set(initialState),
    }),
    {
      name: "buildup-store-info",
      partialize: (s) => ({
        mission: s.mission,
        shortDescription: s.shortDescription,
        longDescription: s.longDescription,
        addressRoad: s.addressRoad,
        addressDetail: s.addressDetail,
        regionCode: s.regionCode,
        latitude: s.latitude,
        longitude: s.longitude,
        phone: s.phone,
        ownerPhone: s.ownerPhone,
        websiteUrl: s.websiteUrl,
        instagramUrl: s.instagramUrl,
        naverPlaceUrl: s.naverPlaceUrl,
        kakaoPlaceUrl: s.kakaoPlaceUrl,
        weeklyHolidays: s.weeklyHolidays,
        breakTime: s.breakTime,
        storePhotos: s.storePhotos,
        currentBalanceManualKrw: s.currentBalanceManualKrw,
        currentBalanceUpdatedAt: s.currentBalanceUpdatedAt,
        bizRegistrationNumber: s.bizRegistrationNumber,
        bizRegistrationDate: s.bizRegistrationDate,
        bizRegistrationType: s.bizRegistrationType,
        industryCode: s.industryCode,
        telecomSalesNumber: s.telecomSalesNumber,
        fourInsuranceEstablished: s.fourInsuranceEstablished,
        permits: s.permits,
        bizBankName: s.bizBankName,
        bizBankAccountMasked: s.bizBankAccountMasked,
        bizCardIssued: s.bizCardIssued,
        posTerminal: s.posTerminal,
        taxHandling: s.taxHandling,
        cpaName: s.cpaName,
        cpaPhone: s.cpaPhone,
        peopleDirectory: s.peopleDirectory,
        insurancePolicies: s.insurancePolicies,
        tenancy: s.tenancy,
        digitalFootprint: s.digitalFootprint,
        vehicles: s.vehicles,
        industrySpecifics: s.industrySpecifics,
        businessDocuments: s.businessDocuments,
      }),
    },
  ),
);

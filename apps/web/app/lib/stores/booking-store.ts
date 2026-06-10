"use client";

/**
 * booking-store — 예약 기반 업종 통합 store (뷰티·펫·공간임대·생활서비스).
 *
 *  ── 왜 만들었나 (2026-05-13 Phase 2e) ────────────────────────────────
 *  카카오헤어샵 노쇼 0.09% 사례 + Zenoti·Meevo·Gingr·OfficeRnD 표준 — 예약
 *  기반 업종 사장님의 daily KPI = 예약·노쇼·취소·rebook (디자이너별).
 *
 *  업종 공통 모델 (한 store 로 처리):
 *    · 뷰티: 시술 예약 (헤어·네일·피부) — provider = 디자이너
 *    · 펫: 미용·호텔·병원 예약 — provider = 미용사·수의사
 *    · 공간임대: 룸·테이블 예약 — provider = 공간 (룸 ID)
 *    · 생활서비스: 청소·수리 의뢰 — provider = 기사
 *
 *  ── 데이터 모델 ──────────────────────────────────────────────────
 *  · bookings: { id, date, time, customerId?, customerName, providerId?, providerName?,
 *               service, price, status: confirmed|completed|noshow|cancelled, source }
 *  · providers: { id, name, role, commission?, isActive }
 *
 *  ── persist ──────────────────────────────────────────────────────
 *  Zustand persist (localStorage) — operations-store 와 동일 패턴.
 *  Supabase mirror 는 v2 (다중 디바이스).
 *  ────────────────────────────────────────────────────────────────
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getKstDate } from "../utils/business-day";

export type BookingStatus = "confirmed" | "completed" | "noshow" | "cancelled";
export type BookingSource = "kakao-hair" | "naver-booking" | "phone" | "walk-in" | "other";

/** 데모 시드 업종 — 카드(업종)별로 적절한 예시 내용 분기 */
export type DemoIndustry = "beauty" | "pet" | "space" | "living-service";

export type Booking = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  customerId?: string;
  customerName: string;
  providerId?: string;
  providerName?: string;
  service: string;       // "헤어컷·매니큐어·강아지 미용·룸A 2시간" 등
  price: number;         // 원
  status: BookingStatus;
  source: BookingSource;
  /** YYYY-MM-DD HH:MM — 예약 등록 시각 */
  createdAt: string;
  /** 사장님 메모 */
  note?: string;
  /**
   * 예시(데모) 데이터 여부. seedDemo()로 생성된 항목만 true.
   * optional — 기존 localStorage 데이터 하위호환 (undefined = 실데이터로 취급, 단 마이그레이션이 옛 데모 id를 마킹).
   */
  isDemo?: boolean;
};

export type Provider = {
  id: string;
  name: string;
  role: string;        // "디자이너·미용사·수의사·기사·룸"
  commission?: number; // 0~100 (인센티브 비율 %)
  isActive: boolean;
  /** 예시(데모) 데이터 여부. optional — 하위호환. */
  isDemo?: boolean;
};

type BookingState = {
  bookings: Booking[];
  providers: Provider[];

  addBooking: (b: Omit<Booking, "id" | "createdAt">) => void;
  updateBooking: (id: string, updates: Partial<Omit<Booking, "id">>) => void;
  deleteBooking: (id: string) => void;
  setBookingStatus: (id: string, status: BookingStatus) => void;

  addProvider: (p: Omit<Provider, "id">) => void;
  updateProvider: (id: string, updates: Partial<Omit<Provider, "id">>) => void;
  deleteProvider: (id: string) => void;

  /** Demo seed — 사장님이 빈 화면 대신 *예시 데이터* 보고 카드 이해. 업종별 적절한 예시. */
  seedDemo: (industry?: DemoIndustry) => void;
  /** 예시(데모) 항목만 삭제 — 실제 입력 데이터는 보존 */
  clearDemo: () => void;
  clearAll: () => void;
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 옛 헤어샵 데모 시드 식별자 — isDemo 플래그 도입(2026-06-10) 이전에
 * 저장된 데모 데이터를 마이그레이션으로 마킹하기 위한 기준.
 */
const LEGACY_DEMO_BOOKING_IDS = new Set(["b1", "b2", "b3", "b4", "b5", "b6"]);
const LEGACY_DEMO_PROVIDER_IDS = new Set(["p1", "p2"]);

/** 업종별 데모 시드 — 헤어샵 더미를 모든 업종이 공유하던 문제 해결 */
function buildDemoSeed(industry: DemoIndustry): { providers: Provider[]; bookings: Booking[] } {
  const now = new Date();
  const todayStr = getKstDate(now);
  const yesterday = getKstDate(new Date(now.getTime() - 86400000));
  const twoDaysAgo = getKstDate(new Date(now.getTime() - 2 * 86400000));
  const tomorrow = getKstDate(new Date(now.getTime() + 86400000));
  const nowISO = now.toISOString();
  const yISO = new Date(Date.now() - 86400000).toISOString();
  const twoISO = new Date(Date.now() - 2 * 86400000).toISOString();

  const mark = <T extends { id: string }>(arr: T[]) => arr.map((x) => ({ ...x, isDemo: true as const }));

  if (industry === "pet") {
    return {
      providers: mark<Provider>([
        { id: "demo-p1", name: "김미용사", role: "미용사", commission: 35, isActive: true },
        { id: "demo-p2", name: "이수의사", role: "수의사", commission: 30, isActive: true },
      ]),
      bookings: mark<Booking>([
        { id: "demo-b1", date: todayStr, time: "10:00", customerName: "박** (보호자)", providerId: "demo-p1", providerName: "김미용사", service: "강아지 미용", price: 45000, status: "confirmed", source: "naver-booking", createdAt: nowISO },
        { id: "demo-b2", date: todayStr, time: "13:00", customerName: "최**", providerId: "demo-p2", providerName: "이수의사", service: "진료+예방접종", price: 70000, status: "confirmed", source: "phone", createdAt: nowISO },
        { id: "demo-b3", date: tomorrow, time: "11:00", customerName: "정**", providerId: "demo-p1", providerName: "김미용사", service: "호텔 1박", price: 50000, status: "confirmed", source: "naver-booking", createdAt: nowISO },
        { id: "demo-b4", date: yesterday, time: "15:00", customerName: "한**", providerId: "demo-p1", providerName: "김미용사", service: "미용+목욕", price: 55000, status: "completed", source: "phone", createdAt: yISO },
        { id: "demo-b5", date: yesterday, time: "16:30", customerName: "유**", providerId: "demo-p2", providerName: "이수의사", service: "진료", price: 40000, status: "noshow", source: "naver-booking", createdAt: yISO },
        { id: "demo-b6", date: twoDaysAgo, time: "11:00", customerName: "임**", providerId: "demo-p1", providerName: "김미용사", service: "사료·용품", price: 30000, status: "cancelled", source: "walk-in", createdAt: twoISO },
      ]),
    };
  }

  if (industry === "space") {
    return {
      providers: mark<Provider>([
        { id: "demo-p1", name: "룸A", role: "룸", isActive: true },
        { id: "demo-p2", name: "룸B", role: "룸", isActive: true },
      ]),
      bookings: mark<Booking>([
        { id: "demo-b1", date: todayStr, time: "10:00", customerName: "박**", providerId: "demo-p1", providerName: "룸A", service: "2시간 4명", price: 40000, status: "confirmed", source: "other", createdAt: nowISO },
        { id: "demo-b2", date: todayStr, time: "19:00", customerName: "최**", providerId: "demo-p2", providerName: "룸B", service: "3시간 2명", price: 45000, status: "confirmed", source: "other", createdAt: nowISO },
        { id: "demo-b3", date: tomorrow, time: "14:00", customerName: "정**", providerId: "demo-p1", providerName: "룸A", service: "2시간 6명", price: 60000, status: "confirmed", source: "other", createdAt: nowISO },
        { id: "demo-b4", date: yesterday, time: "20:00", customerName: "한**", providerId: "demo-p1", providerName: "룸A", service: "2시간", price: 30000, status: "completed", source: "other", createdAt: yISO },
        { id: "demo-b5", date: yesterday, time: "21:00", customerName: "유**", providerId: "demo-p2", providerName: "룸B", service: "1시간", price: 15000, status: "completed", source: "other", createdAt: yISO },
        { id: "demo-b6", date: twoDaysAgo, time: "11:00", customerName: "임**", providerId: "demo-p2", providerName: "룸B", service: "2시간", price: 30000, status: "cancelled", source: "other", createdAt: twoISO },
      ]),
    };
  }

  if (industry === "living-service") {
    return {
      providers: mark<Provider>([
        { id: "demo-p1", name: "김기사", role: "기사", commission: 50, isActive: true },
        { id: "demo-p2", name: "이기사", role: "기사", commission: 50, isActive: true },
      ]),
      bookings: mark<Booking>([
        { id: "demo-b1", date: todayStr, time: "09:00", customerName: "박**", providerId: "demo-p1", providerName: "김기사", service: "가정 청소", price: 60000, status: "confirmed", source: "phone", createdAt: nowISO },
        { id: "demo-b2", date: todayStr, time: "14:00", customerName: "최**", service: "에어컨 수리", price: 80000, status: "confirmed", source: "other", createdAt: nowISO },
        { id: "demo-b3", date: todayStr, time: "16:00", customerName: "정**", service: "이사 청소", price: 120000, status: "confirmed", source: "phone", createdAt: nowISO },
        { id: "demo-b4", date: yesterday, time: "10:00", customerName: "한**", providerId: "demo-p1", providerName: "김기사", service: "정기 청소", price: 60000, status: "completed", source: "phone", createdAt: yISO },
        { id: "demo-b5", date: yesterday, time: "13:00", customerName: "유**", providerId: "demo-p2", providerName: "이기사", service: "배관 수리", price: 90000, status: "completed", source: "other", createdAt: yISO },
        { id: "demo-b6", date: twoDaysAgo, time: "15:00", customerName: "임**", providerId: "demo-p2", providerName: "이기사", service: "청소", price: 60000, status: "cancelled", source: "phone", createdAt: twoISO },
      ]),
    };
  }

  // beauty (default) — 기존 헤어샵 예시 (id를 demo- prefix 로 통일)
  return {
    providers: mark<Provider>([
      { id: "demo-p1", name: "김디자이너", role: "디자이너", commission: 40, isActive: true },
      { id: "demo-p2", name: "이디자이너", role: "디자이너", commission: 35, isActive: true },
    ]),
    bookings: mark<Booking>([
      { id: "demo-b1", date: todayStr, time: "10:00", customerName: "박** (단골)", providerId: "demo-p1", providerName: "김디자이너", service: "컷+염색", price: 95000, status: "confirmed", source: "kakao-hair", createdAt: nowISO },
      { id: "demo-b2", date: todayStr, time: "11:30", customerName: "최**", providerId: "demo-p2", providerName: "이디자이너", service: "컷", price: 30000, status: "confirmed", source: "naver-booking", createdAt: nowISO },
      { id: "demo-b3", date: tomorrow, time: "14:00", customerName: "정**", providerId: "demo-p1", providerName: "김디자이너", service: "펌+트리트먼트", price: 150000, status: "confirmed", source: "kakao-hair", createdAt: nowISO },
      { id: "demo-b4", date: yesterday, time: "15:00", customerName: "한**", providerId: "demo-p1", providerName: "김디자이너", service: "컷", price: 30000, status: "completed", source: "phone", createdAt: yISO },
      { id: "demo-b5", date: yesterday, time: "16:30", customerName: "유**", providerId: "demo-p2", providerName: "이디자이너", service: "염색", price: 80000, status: "noshow", source: "kakao-hair", createdAt: yISO },
      { id: "demo-b6", date: twoDaysAgo, time: "11:00", customerName: "임**", providerId: "demo-p2", providerName: "이디자이너", service: "컷", price: 30000, status: "cancelled", source: "naver-booking", createdAt: twoISO },
    ]),
  };
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      bookings: [],
      providers: [],

      // 사장님이 실제 예약을 추가하면 예시(데모) 항목·provider 자동 제거.
      addBooking: (b) => set((s) => ({
        bookings: [
          ...s.bookings.filter((x) => !x.isDemo),
          { ...b, id: newId(), createdAt: new Date().toISOString() },
        ],
        providers: s.providers.some((p) => p.isDemo) ? s.providers.filter((p) => !p.isDemo) : s.providers,
      })),
      updateBooking: (id, updates) => set((s) => ({
        bookings: s.bookings.map((b) => b.id === id ? { ...b, ...updates } : b),
      })),
      deleteBooking: (id) => set((s) => ({
        bookings: s.bookings.filter((b) => b.id !== id),
      })),
      setBookingStatus: (id, status) => set((s) => ({
        bookings: s.bookings.map((b) => b.id === id ? { ...b, status } : b),
      })),

      // 실제 provider 추가 시 예시(데모) 데이터 자동 제거.
      addProvider: (p) => set((s) => ({
        providers: [...s.providers.filter((x) => !x.isDemo), { ...p, id: newId() }],
        bookings: s.bookings.some((b) => b.isDemo) ? s.bookings.filter((b) => !b.isDemo) : s.bookings,
      })),
      updateProvider: (id, updates) => set((s) => ({
        providers: s.providers.map((p) => p.id === id ? { ...p, ...updates } : p),
      })),
      deleteProvider: (id) => set((s) => ({
        providers: s.providers.filter((p) => p.id !== id),
      })),

      // 업종별 예시 데이터 시드 — 모든 항목 isDemo: true (가짜 숫자 금지 원칙: 카드가 "예시" 배지 표시).
      seedDemo: (industry = "beauty") => {
        const seed = buildDemoSeed(industry);
        set((s) => ({
          // 기존 예시 항목은 교체, 사장님 실데이터는 보존
          providers: [...s.providers.filter((p) => !p.isDemo), ...seed.providers],
          bookings: [...s.bookings.filter((b) => !b.isDemo), ...seed.bookings],
        }));
      },
      // 예시(데모) 항목만 삭제 — 실데이터 보존
      clearDemo: () => set((s) => ({
        bookings: s.bookings.filter((b) => !b.isDemo),
        providers: s.providers.filter((p) => !p.isDemo),
      })),
      clearAll: () => set({ bookings: [], providers: [] }),
    }),
    {
      name: "foundone-bookings",
      // 기존(isDemo 도입 이전) localStorage 데이터 마이그레이션:
      //   옛 헤어샵 데모 시드(id b1~b6 / p1~p2)와 일치하는 항목을 isDemo 로 마킹 →
      //   카드가 "예시" 배지를 붙여 실데이터처럼 보이지 않게 함.
      merge: (persistedState, currentState) => {
        const ps = (persistedState ?? {}) as Partial<BookingState>;
        const rawBookings = Array.isArray(ps.bookings) ? ps.bookings : [];
        const rawProviders = Array.isArray(ps.providers) ? ps.providers : [];
        return {
          ...currentState,
          ...ps,
          bookings: rawBookings.map((b) =>
            b.isDemo === undefined && LEGACY_DEMO_BOOKING_IDS.has(b.id) ? { ...b, isDemo: true } : b,
          ),
          providers: rawProviders.map((p) =>
            p.isDemo === undefined && LEGACY_DEMO_PROVIDER_IDS.has(p.id) ? { ...p, isDemo: true } : p,
          ),
        };
      },
    },
  ),
);

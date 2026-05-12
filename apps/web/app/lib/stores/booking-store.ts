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

export type BookingStatus = "confirmed" | "completed" | "noshow" | "cancelled";
export type BookingSource = "kakao-hair" | "naver-booking" | "phone" | "walk-in" | "other";

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
};

export type Provider = {
  id: string;
  name: string;
  role: string;        // "디자이너·미용사·수의사·기사·룸"
  commission?: number; // 0~100 (인센티브 비율 %)
  isActive: boolean;
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

  /** Demo seed — 사장님이 빈 화면 대신 *예시 데이터* 보고 카드 이해 */
  seedDemo: () => void;
  clearAll: () => void;
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      bookings: [],
      providers: [],

      addBooking: (b) => set((s) => ({
        bookings: [...s.bookings, { ...b, id: newId(), createdAt: new Date().toISOString() }],
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

      addProvider: (p) => set((s) => ({
        providers: [...s.providers, { ...p, id: newId() }],
      })),
      updateProvider: (id, updates) => set((s) => ({
        providers: s.providers.map((p) => p.id === id ? { ...p, ...updates } : p),
      })),
      deleteProvider: (id) => set((s) => ({
        providers: s.providers.filter((p) => p.id !== id),
      })),

      seedDemo: () => {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const yesterday = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
        const twoDaysAgo = new Date(today.getTime() - 2 * 86400000).toISOString().slice(0, 10);
        const tomorrow = new Date(today.getTime() + 86400000).toISOString().slice(0, 10);
        set({
          providers: [
            { id: "p1", name: "김디자이너", role: "디자이너", commission: 40, isActive: true },
            { id: "p2", name: "이디자이너", role: "디자이너", commission: 35, isActive: true },
          ],
          bookings: [
            { id: "b1", date: todayStr, time: "10:00", customerName: "박** (단골)", providerId: "p1", providerName: "김디자이너", service: "컷+염색", price: 95000, status: "confirmed", source: "kakao-hair", createdAt: new Date().toISOString() },
            { id: "b2", date: todayStr, time: "11:30", customerName: "최**", providerId: "p2", providerName: "이디자이너", service: "컷", price: 30000, status: "confirmed", source: "naver-booking", createdAt: new Date().toISOString() },
            { id: "b3", date: tomorrow, time: "14:00", customerName: "정**", providerId: "p1", providerName: "김디자이너", service: "펌+트리트먼트", price: 150000, status: "confirmed", source: "kakao-hair", createdAt: new Date().toISOString() },
            { id: "b4", date: yesterday, time: "15:00", customerName: "한**", providerId: "p1", providerName: "김디자이너", service: "컷", price: 30000, status: "completed", source: "phone", createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: "b5", date: yesterday, time: "16:30", customerName: "유**", providerId: "p2", providerName: "이디자이너", service: "염색", price: 80000, status: "noshow", source: "kakao-hair", createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: "b6", date: twoDaysAgo, time: "11:00", customerName: "임**", providerId: "p2", providerName: "이디자이너", service: "컷", price: 30000, status: "cancelled", source: "naver-booking", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
          ],
        });
      },
      clearAll: () => set({ bookings: [], providers: [] }),
    }),
    { name: "buildup-bookings" },
  ),
);

"use client";

/**
 * ecommerce-store — 이커머스 광고·전환·반품 데이터 store (Phase 2f).
 *
 *  ── 왜 만들었나 (2026-05-13) ──────────────────────────────────────────
 *  Agent B 11 자료 (Polar·Shopify·Daymark·OSC 쿠팡·Sellerking) — 이커머스
 *  사장님 daily KPI: CVR·ROAS·반품률. 한국 SaaS 거의 부재 (캐시노트는 매출만).
 *
 *  ── 데이터 모델 ──────────────────────────────────────────────────
 *  · adSpends: 일별 채널별 광고비 + 클릭·전환·전환매출
 *  · returns: 일별 반품 (금액·사유)
 *  · 주문 수 / 매출은 useUnifiedRevenue + dailyEntries 에서 가져옴
 *
 *  ── persist ──────────────────────────────────────────────────────
 *  Zustand persist (operations-store 패턴).
 *  ────────────────────────────────────────────────────────────────
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdChannel = "naver" | "coupang" | "meta" | "google" | "kakao" | "other";

export type AdSpend = {
  id: string;
  date: string;          // YYYY-MM-DD
  channel: AdChannel;
  spend: number;         // 원
  impressions?: number;
  clicks?: number;
  conversions: number;   // 전환 (주문 건수)
  conversionValue: number; // 전환 매출 (원)
};

export type ReturnEntry = {
  id: string;
  date: string;
  orderAmount: number;
  reason: string;
};

type EcommerceState = {
  adSpends: AdSpend[];
  returns: ReturnEntry[];

  addAdSpend: (a: Omit<AdSpend, "id">) => void;
  updateAdSpend: (id: string, updates: Partial<Omit<AdSpend, "id">>) => void;
  deleteAdSpend: (id: string) => void;

  addReturn: (r: Omit<ReturnEntry, "id">) => void;
  deleteReturn: (id: string) => void;

  seedDemo: () => void;
  clearAll: () => void;
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useEcommerceStore = create<EcommerceState>()(
  persist(
    (set) => ({
      adSpends: [],
      returns: [],

      addAdSpend: (a) => set((s) => ({ adSpends: [...s.adSpends, { ...a, id: newId() }] })),
      updateAdSpend: (id, updates) => set((s) => ({ adSpends: s.adSpends.map((a) => a.id === id ? { ...a, ...updates } : a) })),
      deleteAdSpend: (id) => set((s) => ({ adSpends: s.adSpends.filter((a) => a.id !== id) })),

      addReturn: (r) => set((s) => ({ returns: [...s.returns, { ...r, id: newId() }] })),
      deleteReturn: (id) => set((s) => ({ returns: s.returns.filter((r) => r.id !== id) })),

      seedDemo: () => {
        const today = new Date();
        const days7 = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today.getTime() - i * 86400000);
          return d.toISOString().slice(0, 10);
        });
        set({
          adSpends: [
            // 쿠팡: 좋은 ROAS
            ...days7.map((date) => ({ id: newId(), date, channel: "coupang" as const, spend: 80000, clicks: 250, conversions: 8, conversionValue: 320000 })),
            // 네이버: 평균
            ...days7.map((date) => ({ id: newId(), date, channel: "naver" as const, spend: 50000, clicks: 180, conversions: 5, conversionValue: 175000 })),
            // 메타: 낮은 ROAS
            ...days7.map((date) => ({ id: newId(), date, channel: "meta" as const, spend: 100000, clicks: 800, conversions: 6, conversionValue: 180000 })),
          ],
          returns: [
            { id: newId(), date: days7[0], orderAmount: 35000, reason: "사이즈 안 맞음" },
            { id: newId(), date: days7[1], orderAmount: 45000, reason: "배송 지연" },
            { id: newId(), date: days7[2], orderAmount: 25000, reason: "단순 변심" },
            { id: newId(), date: days7[4], orderAmount: 55000, reason: "제품 불량" },
          ],
        });
      },
      clearAll: () => set({ adSpends: [], returns: [] }),
    }),
    { name: "buildup-ecommerce" },
  ),
);

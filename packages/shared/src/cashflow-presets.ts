// 현금흐름 채널 프리셋 + 업종별 기본 채널 믹스 공유 SSOT 접근자.
// 웹 cashflow-store.ts + iOS CashflowPresetsRegistry 가 동일 데이터를 소비 → 수수료·정산주기 숫자 일치.

import presets from "./cashflow-presets.json";

export interface CashflowChannelPreset {
  id: string;
  label: { ko: string; en: string };
  settlementDays: number;   // 매출 발생 → 정산까지 평균 영업일
  commissionRate: number;   // 플랫폼 수수료 (%)
  paymentFeeRate: number;   // 결제 수수료 (%)
  rateNote?: { ko: string; en: string };
}

export interface CashflowDefaultChannel extends CashflowChannelPreset {
  salesRatio: number;       // 0~100 (%)
  isActive: boolean;
}

interface RawPreset {
  id: string;
  labelKo: string;
  labelEn: string;
  settlementDays: number;
  commissionRate: number;
  paymentFeeRate: number;
  rateNoteKo?: string;
  rateNoteEn?: string;
}

const RAW = presets as unknown as {
  channelPresets: Record<string, RawPreset>;
  industryDefaultMix: Record<string, Array<{ id: string; salesRatio: number }>>;
};

function toPreset(r: RawPreset): CashflowChannelPreset {
  const base: CashflowChannelPreset = {
    id: r.id,
    label: { ko: r.labelKo, en: r.labelEn },
    settlementDays: r.settlementDays,
    commissionRate: r.commissionRate,
    paymentFeeRate: r.paymentFeeRate,
  };
  if (r.rateNoteKo && r.rateNoteEn) base.rateNote = { ko: r.rateNoteKo, en: r.rateNoteEn };
  return base;
}

/** 채널 id → 프리셋 (label/수수료/정산주기). */
export const CASHFLOW_CHANNEL_PRESETS: Record<string, CashflowChannelPreset> = Object.fromEntries(
  Object.entries(RAW.channelPresets).map(([k, v]) => [k, toPreset(v)])
);

/** 업종 카테고리 id → 기본 채널 믹스(활성 채널 + 비율). 미식별 시 일반 오프라인(현금10/카드90). */
export function cashflowDefaultMixForIndustry(categoryId?: string): CashflowDefaultChannel[] {
  const cat = (categoryId ?? "").toLowerCase();
  const mix = RAW.industryDefaultMix[cat] ?? RAW.industryDefaultMix._fallback;
  return mix.map((m) => ({ ...CASHFLOW_CHANNEL_PRESETS[m.id], salesRatio: m.salesRatio, isActive: true }));
}

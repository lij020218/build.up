"use client";

/**
 * useUnifiedRevenue — 모든 매출 출처(PortOne·TOSS Place·CSV·CODEF·팝빌)를 하나로 통합.
 *
 * ⚠️ 2026-06-07 재설계 (의회 검증): "택1(우선순위)" → "구간별 합산(사용자 기준)".
 *   채널마다 측정하는 "돈의 구간"이 다르다:
 *     - PortOne   = 온라인 PG 매출
 *     - TossPlace = 오프라인 POS 매출
 *     - CODEF카드 = 여신협회 집계 "전체 카드매출" (온·오프·배달앱 슈퍼셋)
 *     - 팝빌      = 현금영수증(현금) 매출
 *     - CODEF통장 = 카드 정산금 입금 (= 위 매출의 같은 돈, 며칠 뒤) → 매출합 제외
 *     - CSV/수동  = 사장님 직접 정리 (전부와 중복) → 직접소스 0일 때만
 *   단순 합산은 이중계상, 단순 택1은 누락. → 구간별로:
 *     ① 같은 구간 겹치면 택1(카드: 사용자 선택 individual vs codef)
 *     ② 다른 구간이면 합산(온라인+오프라인+현금)
 *     ③ 정산(통장)은 매출합 제외, 직접소스 0일 때만 비상 fallback
 *   사용자 기준(revenueBasis)은 cashflow-store 에 저장 (사장님이 ProfileView 에서 선택).
 *
 * 사용처: ActivitySnapshotCard 매출 흐름 차트, useDashboardComputed.
 */
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useCashflowStore, type RevenueBasis } from "../stores/cashflow-store";

export type UnifiedRevenueSource =
  | "portone"
  | "tossplace"
  | "codef"
  | "codef-bank"
  | "popbill"
  | "csv";

export type UnifiedDailyEntry = {
  date: string;          // YYYY-MM-DD KST
  sales: number;
  customers: number;
  source: UnifiedRevenueSource;
};

/** 채널별 매출 내역 — 현재 집계 기준으로 "실제 합산된" 출처별 기간 합계 (매출 카드 breakdown 표시용). */
export type RevenueBreakdownItem = {
  source: UnifiedRevenueSource;
  sales: number;
};

export type UnifiedRevenueSources = {
  portone: boolean;
  tossplace: boolean;
  codef: boolean;
  codefBank: boolean;
  popbill: boolean;
  csv: boolean;
};

export type UnifiedRevenueState = {
  loading: boolean;
  /** 최소 1개 이상 출처 연결 여부 */
  anyConnected: boolean;
  sources: UnifiedRevenueSources;
  entries: UnifiedDailyEntry[];
  /** 채널별 매출 내역 (집계 기준으로 실제 합산된 출처만, 기간 합계) */
  breakdown: RevenueBreakdownItem[];
  /** 적용 중인 집계 기준 (스마트 기본 포함) — UI 표기용 */
  basis: RevenueBasis;
  /** 카드매출이 2개 이상 채널에 겹쳐 사용자 선택이 필요한 상태 */
  cardOverlap: boolean;
  lastFetched: number | null;
  refetch: () => Promise<void>;
};

const REFETCH_INTERVAL = 30 * 60 * 1000;

/** 미설정(null) 시 연결 채널 기준 스마트 기본값. CODEF 연결됐으면 통합, 아니면 개별. 현금은 안전하게 OFF. */
export function effectiveRevenueBasis(
  basis: RevenueBasis | null,
  sources: UnifiedRevenueSources,
): RevenueBasis {
  if (basis) return basis;
  return { card: sources.codef ? "codef" : "individual", countCashReceipt: false };
}

/** 카드매출이 여러 채널에 겹쳐 사용자 선택이 의미있는 상태인지 (CODEF 슈퍼셋 + 개별채널 동시 연결). */
export function hasCardOverlap(sources: UnifiedRevenueSources): boolean {
  return sources.codef && (sources.portone || sources.tossplace);
}

export function useUnifiedRevenue(fromDays = 30): UnifiedRevenueState {
  const [loading, setLoading] = useState(true);
  const [rawEntries, setRawEntries] = useState<UnifiedDailyEntry[]>([]);
  const [sources, setSources] = useState<UnifiedRevenueSources>({
    portone: false,
    tossplace: false,
    codef: false,
    codefBank: false,
    popbill: false,
    csv: false,
  });
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const inFlight = useRef(false);
  const storedBasis = useCashflowStore((s) => s.revenueBasis);

  const refetch = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      if (!token) {
        setSources({ portone: false, tossplace: false, codef: false, codefBank: false, popbill: false, csv: false });
        setRawEntries([]);
        setLoading(false);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      // status endpoint 병렬 호출 (6개 채널)
      const [portoneStatus, tossStatus, codefStatus, codefBankStatus, popbillStatus, csvList] = await Promise.allSettled([
        fetch("/api/integrations/portone/status", { headers, cache: "no-store" }).then((r) => r.json()),
        fetch("/api/integrations/tossplace/status", { headers, cache: "no-store" }).then((r) => r.json()),
        fetch("/api/integrations/codef/status", { headers, cache: "no-store" }).then((r) => r.json()),
        fetch("/api/integrations/codef/bank/status", { headers, cache: "no-store" }).then((r) => r.json()),
        fetch("/api/integrations/popbill/status", { headers, cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/integrations/csv/list?fromDays=${fromDays}`, { headers, cache: "no-store" }).then((r) => r.json()),
      ]);

      const newSources: UnifiedRevenueSources = {
        portone: portoneStatus.status === "fulfilled" && portoneStatus.value.connected && portoneStatus.value.status === "active",
        tossplace: tossStatus.status === "fulfilled" && tossStatus.value.connected && tossStatus.value.status === "active",
        codef: codefStatus.status === "fulfilled" && codefStatus.value.connected && codefStatus.value.status === "active",
        codefBank: codefBankStatus.status === "fulfilled" && (codefBankStatus.value.accounts?.length ?? 0) > 0,
        popbill: popbillStatus.status === "fulfilled" && popbillStatus.value.connection?.status === "active",
        csv: csvList.status === "fulfilled" && (csvList.value.uploads?.length ?? 0) > 0,
      };
      setSources(newSources);

      // 데이터 fetch — 연결된 것만
      const dailyPromises: Array<Promise<UnifiedDailyEntry[]>> = [];

      if (newSources.portone) {
        dailyPromises.push(
          fetch(`/api/integrations/portone/daily?fromDays=${fromDays}`, { headers, cache: "no-store" })
            .then((r) => r.json())
            .then((d: { ok: boolean; entries?: UnifiedDailyEntry[] }) => d.ok ? (d.entries ?? []).map((e) => ({ ...e, source: "portone" as const })) : [])
            .catch(() => [])
        );
      }
      if (newSources.tossplace) {
        dailyPromises.push(
          fetch(`/api/integrations/tossplace/daily?fromDays=${fromDays}`, { headers, cache: "no-store" })
            .then((r) => r.json())
            .then((d: { ok: boolean; entries?: UnifiedDailyEntry[] }) => d.ok ? (d.entries ?? []).map((e) => ({ ...e, source: "tossplace" as const })) : [])
            .catch(() => [])
        );
      }
      if (newSources.csv && csvList.status === "fulfilled") {
        const csvEntries = (csvList.value.dailyEntries ?? []) as Array<{ date: string; sales: number; customers: number }>;
        dailyPromises.push(Promise.resolve(csvEntries.map((e) => ({ ...e, source: "csv" as const }))));
      }
      if (newSources.popbill) {
        dailyPromises.push(
          fetch(`/api/integrations/popbill/daily?fromDays=${fromDays}`, { headers, cache: "no-store" })
            .then((r) => r.json())
            .then((d: { ok: boolean; entries?: UnifiedDailyEntry[] }) => d.ok ? (d.entries ?? []).map((e) => ({ ...e, source: "popbill" as const })) : [])
            .catch(() => [])
        );
      }
      if (newSources.codefBank) {
        dailyPromises.push(
          fetch(`/api/integrations/codef/bank/daily?fromDays=${fromDays}`, { headers, cache: "no-store" })
            .then((r) => r.json())
            .then((d: { ok: boolean; entries?: UnifiedDailyEntry[] }) => d.ok ? (d.entries ?? []).map((e) => ({ ...e, source: "codef-bank" as const })) : [])
            .catch(() => [])
        );
      }
      // CODEF 카드매입 daily — "카드사 통합" 기준의 데이터 소스 (여신협회 슈퍼셋).
      if (newSources.codef) {
        dailyPromises.push(
          fetch(`/api/integrations/codef/daily?fromDays=${fromDays}`, { headers, cache: "no-store" })
            .then((r) => r.json())
            .then((d: { ok: boolean; entries?: UnifiedDailyEntry[] }) => d.ok ? (d.entries ?? []).map((e) => ({ ...e, source: "codef" as const })) : [])
            .catch(() => [])
        );
      }

      const results = await Promise.all(dailyPromises);
      setRawEntries(results.flat());
      setLastFetched(Date.now());
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [fromDays]);

  useEffect(() => {
    void refetch();
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void refetch();
      }
    }, REFETCH_INTERVAL);
    return () => clearInterval(id);
  }, [refetch]);

  const anyConnected = useMemo(
    () =>
      sources.portone ||
      sources.tossplace ||
      sources.codef ||
      sources.codefBank ||
      sources.popbill ||
      sources.csv,
    [sources]
  );

  const basis = useMemo(() => effectiveRevenueBasis(storedBasis, sources), [storedBasis, sources]);
  const cardOverlap = useMemo(() => hasCardOverlap(sources), [sources]);

  // 구간별 합산 — basis·sources 변경 시 refetch 없이 재계산.
  const entries = useMemo(() => segmentMerge(rawEntries, basis), [rawEntries, basis]);
  const breakdown = useMemo(() => computeBreakdown(rawEntries, basis), [rawEntries, basis]);

  return { loading, anyConnected, sources, entries, breakdown, basis, cardOverlap, lastFetched, refetch };
}

/**
 * 채널별 매출 내역 — 현재 집계 기준으로 "실제 합산되는" 출처만 기간 합계.
 *   카드 기준이 codef면 통합 카드 1줄, individual이면 포트원·토스플레이스 각 줄. 현금은 토글 ON일 때.
 *   (취소·부분취소는 일별 entry 에 이미 차감 반영 → 출처별 sum = 순매출)
 */
function computeBreakdown(entries: UnifiedDailyEntry[], basis: RevenueBasis): RevenueBreakdownItem[] {
  const sums = new Map<UnifiedRevenueSource, number>();
  for (const e of entries) sums.set(e.source, (sums.get(e.source) ?? 0) + e.sales);
  const out: RevenueBreakdownItem[] = [];
  const pushIf = (src: UnifiedRevenueSource) => {
    const v = sums.get(src) ?? 0;
    if (v > 0) out.push({ source: src, sales: v });
  };
  if (basis.card === "codef") pushIf("codef");
  else { pushIf("portone"); pushIf("tossplace"); }
  if (basis.countCashReceipt) pushIf("popbill");
  return out;
}

/** 채널별 매출 내역의 출처 라벨 (UI 공용). */
export function revenueSourceLabel(source: UnifiedRevenueSource, ko: boolean): string {
  switch (source) {
    case "portone": return ko ? "포트원 (온라인)" : "PortOne (online)";
    case "tossplace": return ko ? "토스플레이스 (매장)" : "TossPlace (in-store)";
    case "codef": return ko ? "카드 매출 (통합)" : "Card sales (CODEF)";
    case "popbill": return ko ? "현금 매출" : "Cash sales";
    case "codef-bank": return ko ? "통장 입금" : "Bank deposits";
    case "csv": return ko ? "CSV 업로드" : "CSV upload";
  }
}

/**
 * 구간별 합산 (이중계상 0 · 누락 0):
 *  - 카드구간: basis.card === "codef" 면 CODEF 슈퍼셋 1개, "individual" 이면 PortOne(온라인)+TossPlace(오프라인) 합산.
 *      (개별 선택 시 CODEF 가 있어도 무시 → 같은 카드돈 이중계상 방지)
 *  - 현금구간: basis.countCashReceipt 면 팝빌 현금영수증 합산.
 *  - 일매출 = 카드 + 현금 (서로 다른 구간 → 합).
 *  - 직접소스 합이 0이면 fallback: CSV > CODEF통장(정산) 순 1개 (정산금은 평소엔 매출합에서 제외).
 */
function segmentMerge(entries: UnifiedDailyEntry[], basis: RevenueBasis): UnifiedDailyEntry[] {
  // date → source → entry (브리지가 이미 일별 1건으로 집계해 옴)
  const byDate = new Map<string, Partial<Record<UnifiedRevenueSource, UnifiedDailyEntry>>>();
  for (const e of entries) {
    const bucket = byDate.get(e.date) ?? {};
    // 같은 (date, source) 중복 방어 — 합산.
    const prev = bucket[e.source];
    bucket[e.source] = prev
      ? { ...e, sales: prev.sales + e.sales, customers: prev.customers + e.customers }
      : e;
    byDate.set(e.date, bucket);
  }

  const out: UnifiedDailyEntry[] = [];
  for (const [date, b] of byDate) {
    let sales = 0;
    let customers = 0;
    let primary: UnifiedRevenueSource | null = null;

    // ── 카드 구간 ──
    if (basis.card === "codef" && b.codef) {
      sales += b.codef.sales;
      customers += b.codef.customers;
      primary = "codef";
    } else {
      // individual: 온라인(PortOne) + 오프라인(TossPlace) 합산
      if (b.portone) { sales += b.portone.sales; customers += b.portone.customers; primary = "portone"; }
      if (b.tossplace) { sales += b.tossplace.sales; customers += b.tossplace.customers; primary = primary ?? "tossplace"; }
    }

    // ── 현금 구간 ──
    if (basis.countCashReceipt && b.popbill) {
      sales += b.popbill.sales;
      customers += b.popbill.customers;
      primary = primary ?? "popbill";
    }

    // ── fallback: 직접소스가 "없는" 날만 CSV > 통장(정산) ──
    //   ⚠️ sales===0 으로 판정하면 직접소스가 *있는데 전액취소로 순매출 0* 인 날에도
    //   정산금/CSV 를 끌어와 잘못 표시됨. primary===null(직접소스 부재)일 때만 fallback.
    if (primary === null) {
      const fb = b.csv ?? b["codef-bank"];
      if (fb) { sales = fb.sales; customers = fb.customers; primary = fb.source; }
    }

    if (primary && sales > 0) {
      out.push({ date, sales, customers, source: primary });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

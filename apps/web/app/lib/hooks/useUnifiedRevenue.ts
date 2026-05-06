"use client";

/**
 * useUnifiedRevenue — 모든 매출 출처(PortOne·TOSS Place·CSV·CODEF·팝빌)를 하나로 통합.
 *
 * 우선순위 (같은 날 여러 출처 있을 때):
 *   1. PortOne (실시간 webhook, 가장 정확)
 *   2. TOSS Place (POS 직접 매출)
 *   3. CODEF Card (10개 카드사 매통조 합계)
 *   4. 팝빌 세금계산서 (B2B 매출)
 *   5. 팝빌 현금영수증 (현금 매출)
 *   6. CODEF Bank (사업자 통장 입금 — 마지막 수단)
 *   7. CSV 업로드
 *   8. Manual entries (사장님 직접 입력)
 *
 * 사용처: ActivitySnapshotCard 매출 흐름 차트.
 */
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { supabase } from "../../../lib/supabase";

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

export type UnifiedRevenueState = {
  loading: boolean;
  /** 최소 1개 이상 출처 연결 여부 */
  anyConnected: boolean;
  sources: {
    portone: boolean;
    tossplace: boolean;
    codef: boolean;
    codefBank: boolean;
    popbill: boolean;
    csv: boolean;
  };
  entries: UnifiedDailyEntry[];
  lastFetched: number | null;
  refetch: () => Promise<void>;
};

const REFETCH_INTERVAL = 30 * 60 * 1000;

export function useUnifiedRevenue(fromDays = 30): UnifiedRevenueState {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<UnifiedDailyEntry[]>([]);
  const [sources, setSources] = useState({
    portone: false,
    tossplace: false,
    codef: false,
    codefBank: false,
    popbill: false,
    csv: false,
  });
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const inFlight = useRef(false);

  const refetch = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      if (!token) {
        setSources({ portone: false, tossplace: false, codef: false, codefBank: false, popbill: false, csv: false });
        setEntries([]);
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

      const newSources = {
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
      // CODEF Card daily endpoint 는 별도 — 본 hook 에서는 임시 skip (PoC)

      const results = await Promise.all(dailyPromises);
      const merged = mergeByDate(results.flat());
      setEntries(merged);
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

  return { loading, anyConnected, sources, entries, lastFetched, refetch };
}

/**
 * 같은 날짜 entries 우선순위 merge:
 *  portone > tossplace > codef(card) > popbill > codef-bank > csv
 *
 * 같은 날 여러 출처가 있으면 가장 정확도 높은 것을 우선:
 *  - PortOne / TOSS Place: 결제 단건 단위 정확
 *  - CODEF 카드매출: 매통조 합계 (수수료 차감 전)
 *  - 팝빌 현금영수증/세금계산서: 발행된 것만
 *  - CODEF 통장 입금: 정산 시점 차이 + 카드사 입금 합쳐 들어와 부정확
 *  - CSV: 사장님 직접 정리 (포맷 천차만별)
 */
function mergeByDate(entries: UnifiedDailyEntry[]): UnifiedDailyEntry[] {
  const priority: Record<UnifiedRevenueSource, number> = {
    portone: 6,
    tossplace: 5,
    codef: 4,
    popbill: 3,
    "codef-bank": 2,
    csv: 1,
  };
  const map = new Map<string, UnifiedDailyEntry>();
  for (const e of entries) {
    const existing = map.get(e.date);
    if (!existing || priority[e.source] > priority[existing.source]) {
      map.set(e.date, e);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

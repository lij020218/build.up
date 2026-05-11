"use client";

/**
 * useBankBalance — 사장님이 연동한 사업자 통장의 *현재 잔고* 자동 조회.
 *
 *  사용처: CashflowSetupSheet 의 "현재 통장 잔고" 자동 불러오기.
 *  데이터 흐름: GET /api/integrations/codef/bank/balance
 *   → codef_bank_transactions.balance_after 의 계좌별 최신 값 합계.
 *
 *  설계 원칙 (2026-05-11):
 *   - 자동 fetch 1회 + 명시적 refresh() 노출. polling 안 함 (CODEF API 호출 비용).
 *   - 미연동/세션 없음/오류 모두 graceful — { connected: false, totalBalance: 0 }.
 *   - 잔고 스냅샷 시점(asOf)이 24시간 이상 지났으면 isStale=true → UI 가 동기화 버튼 노출.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

export type BankAccountBalance = {
  accountId: string;
  bankName: string | null;
  accountAlias: string | null;
  accountNumberMask: string | null;
  isPrimary: boolean;
  balance: number;
  asOf: string | null;
  lastSyncAt: string | null;
};

export type UseBankBalanceResult = {
  connected: boolean;
  totalBalance: number;       // 원
  accounts: BankAccountBalance[];
  asOf: string | null;        // 가장 오래된 거래 시각 (잔고 신뢰도 lower bound)
  isStale: boolean;           // asOf 가 24시간 이상 경과
  loading: boolean;
  error: string | null;
  /** 강제 재조회 — 사용자가 "통장 자동 불러오기" 다시 누를 때 */
  refresh: () => Promise<void>;
  /** CODEF 거래 동기화 후 재조회 — 잔고 최신화 */
  syncAndRefresh: () => Promise<void>;
};

export function useBankBalance(): UseBankBalanceResult {
  const [connected, setConnected] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [accounts, setAccounts] = useState<BankAccountBalance[]>([]);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aborted = useRef(false);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      if (!token) {
        if (!aborted.current) {
          setConnected(false);
          setTotalBalance(0);
          setAccounts([]);
          setAsOf(null);
        }
        return;
      }
      const res = await fetch("/api/integrations/codef/bank/balance", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json();
      if (aborted.current) return;
      if (!json?.ok) {
        setError(json?.error ?? "잔고 조회 실패");
        return;
      }
      setConnected(!!json.connected);
      setTotalBalance(Math.max(0, Math.round(Number(json.totalBalance) || 0)));
      setAccounts(Array.isArray(json.accounts) ? json.accounts : []);
      setAsOf(json.asOf ?? null);
    } catch (e) {
      if (!aborted.current) setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      if (!aborted.current) setLoading(false);
    }
  }, []);

  const syncAndRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      if (!token) return;
      // 최근 7일치만 빠르게 sync — 잔고 최신화 목적이라 fullBackfill 불필요.
      await fetch("/api/integrations/codef/bank/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fromDays: 7 }),
      });
    } catch (e) {
      if (!aborted.current) setError(e instanceof Error ? e.message : "통장 동기화 실패");
    } finally {
      await fetchBalance();
    }
  }, [fetchBalance]);

  useEffect(() => {
    aborted.current = false;
    void fetchBalance();
    return () => {
      aborted.current = true;
    };
  }, [fetchBalance]);

  const isStale = (() => {
    if (!asOf) return false;
    const ageMs = Date.now() - new Date(asOf).getTime();
    return ageMs > 24 * 60 * 60 * 1000;
  })();

  return {
    connected,
    totalBalance,
    accounts,
    asOf,
    isStale,
    loading,
    error,
    refresh: fetchBalance,
    syncAndRefresh,
  };
}

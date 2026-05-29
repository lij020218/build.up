"use client";

import { useEffect, useMemo } from "react";
import { useCashflowStore } from "../stores/cashflow-store";
import { useFinanceStore } from "../stores/finance-store";
import { projectCashflow, detectCrisis, type DailyEntry } from "../services/cashflow-projection";
import { fireNotification } from "../services/notifications";

/**
 * Cashflow 알림 자동 발송 훅 — starter-stage-demo 에서 한 번만 mount.
 *
 * 동작:
 *  1) **위기 경고** (notifyOnCrisis ON): 14일 예측에서 crisisThresholdDays 내 음수 발생 시 알림.
 *     - 30초마다 데이터 변화 감지 (zustand subscribe), 위기 새로 감지되면 즉시 발송.
 *     - 같은 종류 알림은 하루 1회 (notifications.ts 의 canFireToday).
 *  2) **매일 아침 요약** (dailyMorningBriefing ON): 오전 8~11시 사이 첫 페이지 진입 시 어제 매출/오늘 잔고 요약.
 *     - 1분마다 시간 체크 → 8시 이후 + 오늘 미발송이면 발송.
 *
 * 제약:
 *  - Web Notifications API — 페이지가 열려있을 때만 동작. 백그라운드는 service worker (PWA) 필요.
 *  - 권한이 "granted" 일 때만 fireNotification 이 실제 시스템 알림을 보냄.
 *  - 권한 없으면 조용히 스킵 (사장님이 토글 ON 시 권한 요청 별도 처리).
 */
export function useCashflowNotifications() {
  const {
    currentBalance,
    salesChannels,
    fixedExpenses,
    crisisThresholdDays,
    vatReserveEnabled,
    notifyOnCrisis,
    dailyMorningBriefing,
    setupCompletedAt,
  } = useCashflowStore();

  const dailyEntries = useFinanceStore((s) => s.dailyEntries) as DailyEntry[];

  // 위기 감지 — 데이터 변경 시마다 재계산
  const projections = useMemo(() => {
    if (!setupCompletedAt) return [];
    if (!salesChannels.some((c) => c.isActive && c.salesRatio > 0)) return [];
    return projectCashflow({
      currentBalance,
      recentDailyEntries: dailyEntries,
      salesChannels,
      fixedExpenses,
      vatReserveEnabled,
      projectionDays: 14,
    });
  }, [setupCompletedAt, currentBalance, salesChannels, fixedExpenses, vatReserveEnabled, dailyEntries]);

  const crisis = useMemo(() => {
    if (projections.length === 0) return null;
    return detectCrisis(projections, crisisThresholdDays);
  }, [projections, crisisThresholdDays]);

  // ─── 1) 위기 알림: 위기가 새로 감지될 때 즉시 발송 (하루 1회 자동 제한) ───
  useEffect(() => {
    if (!notifyOnCrisis) return;
    if (!crisis?.willCrisis) return;
    const days = crisis.daysUntilCrisis ?? 0;
    const shortfall = Math.abs(crisis.shortfallAmount);
    const shortfallTxt = shortfall >= 10000
      ? `${Math.round(shortfall / 10000).toLocaleString()}만원`
      : `${shortfall.toLocaleString()}원`;
    fireNotification({
      kind: "cashflow-crisis",
      title: "🚨 Found.One — 현금흐름 위기 신호",
      body: `${days}일 후 통장 잔고가 약 ${shortfallTxt} 부족합니다. 지금 해결책을 확인하세요.`,
      tag: "cashflow-crisis",
    });
  }, [notifyOnCrisis, crisis]);

  // ─── 2) 매일 아침 요약: 1분마다 시계 체크 ───
  useEffect(() => {
    if (!dailyMorningBriefing) return;

    const tryFireMorning = () => {
      const now = new Date();
      const hour = now.getHours();
      // 8시~11시 사이만 (사장님 출근/오픈 시간대)
      if (hour < 8 || hour >= 11) return;

      // 어제 매출 요약 + 오늘 예상 잔고
      const yesterdayIso = (() => {
        const d = new Date(); d.setDate(d.getDate() - 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })();
      const yesterdayEntry = dailyEntries.find((e) => e.date === yesterdayIso);
      const yesterdaySales = yesterdayEntry?.sales ?? 0;

      const todayProjection = projections[0];
      const endBalance = todayProjection?.endBalance ?? currentBalance;

      const balanceTxt = endBalance >= 10000
        ? `${Math.round(endBalance / 10000).toLocaleString()}만원`
        : `${endBalance.toLocaleString()}원`;

      let body: string;
      if (yesterdaySales > 0) {
        const salesTxt = yesterdaySales >= 10000
          ? `${Math.round(yesterdaySales / 10000).toLocaleString()}만원`
          : `${yesterdaySales.toLocaleString()}원`;
        body = `어제 매출 ${salesTxt} · 오늘 예상 잔고 ${balanceTxt}`;
      } else {
        body = `오늘 예상 잔고 ${balanceTxt} — 어제 매출을 먼저 기록해 주세요`;
      }

      fireNotification({
        kind: "morning-briefing",
        title: "☀ Found.One — 오늘 한 줄 요약",
        body,
        tag: "morning-briefing",
      });
    };

    // 마운트 시 한 번 체크
    tryFireMorning();
    // 1분마다 체크 (8시 도달 후 첫 1회만 발송)
    const id = setInterval(tryFireMorning, 60_000);
    return () => clearInterval(id);
  }, [dailyMorningBriefing, dailyEntries, projections, currentBalance]);
}

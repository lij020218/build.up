"use client";

/**
 * useIsMobile — 폰 뷰포트(≤BP.sm) 여부 (2026-07-14).
 *
 * 컴포넌트가 열 수·스택 방향 등을 JS 로 분기할 때 쓰는 공용 primitive.
 * 종전엔 이게 없어 MarketingSurface·PreLaunchStage 가 각자 matchMedia 를 재구현했음.
 *
 * SSR 안전: 초기 false → 마운트 후 matchMedia 로 확정, resize/회전 반영.
 * ⚠️ 인라인 다열 그리드 collapse 는 대부분 globals.css 모바일 백스톱으로 충분.
 *    이 훅은 그리드로 안 풀리는 세밀 분기(탭 스택·조건부 렌더)용.
 */

import { useEffect, useState } from "react";
import { BP } from "../breakpoints";

export function useIsMobile(maxWidth: number = BP.sm): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [maxWidth]);
  return isMobile;
}

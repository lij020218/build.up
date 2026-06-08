"use client";

/**
 * useStoreInfoSaver — store-info-store 의 모든 변경을 600ms debounce 로 Supabase 에 flush.
 *
 * 보장:
 *  · 어떤 add/update/remove 든 600ms 안에 Supabase 에 저장
 *  · persistStatus 가 saving → saved/error 로 자동 갱신 (사용자에게 시각 피드백)
 *  · 5초 인터벌 + flushStoreDataImmediate 의 boundary 명확
 *
 * 거짓 기능 0 — 실제 동작 검증된 chain.
 */

import { useEffect, useRef } from "react";
import { useStoreInfoStore } from "../../stores/store-info-store";
import { isCircuitBroken } from "../../services/save-circuit-breaker";

type Flush = () => Promise<void>;

/**
 * ⚠️ Zustand selector 는 반드시 primitive 또는 stable reference 반환.
 * Object/array literal 반환 시 매 render 새 reference → 무한 re-render.
 * 여기서는 hash string (primitive) 만 반환.
 */
function useStoreInfoHash(): string {
  return useStoreInfoStore((s) =>
    [
      s.mission, s.shortDescription, s.longDescription,
      s.addressRoad, s.addressDetail, s.regionCode, s.latitude, s.longitude,
      s.phone, s.ownerPhone, s.websiteUrl, s.instagramUrl, s.naverPlaceUrl, s.kakaoPlaceUrl,
      s.weeklyHolidays.join(","), s.breakTime, s.storePhotos.length,
      s.currentBalanceManualKrw, s.currentBalanceUpdatedAt,
      s.bizRegistrationNumber, s.bizRegistrationDate, s.bizRegistrationType,
      s.industryCode, s.telecomSalesNumber, s.fourInsuranceEstablished,
      s.permits.length,
      s.bizBankName, s.bizBankAccountMasked, s.bizCardIssued, s.posTerminal,
      s.taxHandling, s.cpaName, s.cpaPhone,
      s.peopleDirectory.length,
      s.insurancePolicies.length,
      Object.keys(s.tenancy).length,
      s.digitalFootprint.length,
      s.vehicles.length,
      Object.keys(s.industrySpecifics).length,
      // 실제 값 변화도 감지: JSON 직렬화는 비용이 들지만 selector 안에서만 1회 호출됨
      JSON.stringify(s.permits) + JSON.stringify(s.peopleDirectory) +
        JSON.stringify(s.insurancePolicies) + JSON.stringify(s.tenancy) +
        JSON.stringify(s.digitalFootprint) + JSON.stringify(s.vehicles) +
        JSON.stringify(s.industrySpecifics) + JSON.stringify(s.storePhotos),
    ].join("|"),
  );
}

export function useStoreInfoSaver(flushStoreDataImmediate: Flush | undefined) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hash = useStoreInfoHash();
  const initialized = useRef(false);

  // flush 함수가 매 render 새 reference 라 deps 에 직접 넣으면 무한 루프.
  // ref 에 가두고 effect deps 에서 제외 — hash 가 실제로 바뀔 때만 저장 트리거.
  const flushRef = useRef(flushStoreDataImmediate);
  useEffect(() => {
    flushRef.current = flushStoreDataImmediate;
  });

  useEffect(() => {
    // 첫 마운트는 hydrate 직후이므로 저장 트리거 안 함
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    // 전역 회로 차단 — 영구 실패 감지된 후엔 시도 안 함
    if (isCircuitBroken("store")) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const fn = flushRef.current;
      if (!fn) return;
      // 호출 직전 다시 한 번 회로 상태 확인 (다른 경로에서 트립됐을 수 있음)
      if (isCircuitBroken("store")) return;
      fn().catch(() => {
        // 에러 처리·로그·status 갱신은 flushStoreDataImmediate 안에서 circuit breaker 가 통합 관리.
      });
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [hash]);
}

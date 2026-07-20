import { create } from "zustand";
import { useEffect, useRef } from "react";

/**
 * 현재 화면에 떠 있는 페이지형 스테이지의 페이지 네비 상태 (transient, 비영속).
 *
 * 모든 페이지형 스테이지는 <StartupPageNav page totalPages onChange/> 를 렌더한다.
 * StartupPageNav 가 이 store 에 자신의 {page,totalPages,onChange} 를 publish 하면,
 * 부모 푸터(CurrentStageView)가 "지금 몇 페이지인지" 알 수 있어 하단 버튼을
 *  - 남은 페이지 있음 → "다음 페이지" (onChange(page+1))
 *  - 마지막 페이지 → "다음 단계로"
 * 로 스마트하게 전환한다. (사장님 신고: 페이지 끝에서 다음 페이지 대신 다음 단계로 넘어가는 문제)
 *
 * onChange 는 각 스테이지가 넘긴 페이지 setter (setGuideStepIndex 또는 로컬 setPage) 라
 * 푸터가 호출하면 상단 "다음 →" 와 동일하게 페이지가 넘어간다.
 */
export type StagePageNav = {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
};

type PageNavState = {
  nav: StagePageNav | null;
  setNav: (nav: StagePageNav | null) => void;
};

export const usePageNavStore = create<PageNavState>((set) => ({
  nav: null,
  setNav: (nav) => set({ nav }),
}));

/**
 * 페이지형 스테이지의 페이지 네비를 store 에 publish 하는 공용 훅.
 *
 * 종전엔 StartupPageNav 컴포넌트 안에만 이 로직이 있어, 자체 페이저를 쓰는 스테이지
 * (LoanGuide·PreLaunchFinal·OnlineRegistration·OperationsSetup)와 StageTabNav 사용
 * 스테이지(PreLaunch·LocationCandidates)는 발행이 누락 → 푸터가 페이지를 인식 못 해
 * 첫 페이지부터 "다음 단계로"가 떴다 (읽기 게이트 무력화, 2026-07-21 감사 P1).
 * 모든 페이저는 이 훅 하나로 발행한다.
 *
 * onChange 는 ref 로 감싼다 — inline 핸들러를 넘기는 스테이지에서 매 렌더
 * publish→리렌더 루프 방지 (StartupPageNav 의 기존 처방과 동일).
 */
export function usePublishPageNav(
  page: number,
  totalPages: number,
  onChange: (p: number) => void,
): void {
  const setNav = usePageNavStore((s) => s.setNav);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    if (totalPages <= 1) return; // 단일 페이지 스테이지는 발행하지 않음 (푸터는 기본 "다음 단계로")
    setNav({ page, totalPages, onChange: (p) => onChangeRef.current(p) });
    return () => setNav(null);
  }, [page, totalPages, setNav]);
}

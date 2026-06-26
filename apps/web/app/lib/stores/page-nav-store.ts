import { create } from "zustand";

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

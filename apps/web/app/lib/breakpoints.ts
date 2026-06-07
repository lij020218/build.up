/** 뷰포트 브레이크포인트 SSOT. CSS @media 쿼리와 일치시킬 것. */
export const BP = {
  xs: 480,   // 소형 모바일
  sm: 640,   // 모바일 (isMobile 기준)
  md: 768,   // 태블릿
  lg: 980,   // 대시보드 wide
  xl: 1100,  // 활동 패널 표시 기준
  xxl: 1220, // 3열 그리드 기준
} as const;

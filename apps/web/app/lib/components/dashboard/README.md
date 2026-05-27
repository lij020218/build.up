# lib/components/dashboard — 운영 대시보드 컴포넌트 가이드

> **카드 위치를 찾고 있다면**: [`sections/DASHBOARD_MAP.md`](./sections/DASHBOARD_MAP.md) 를 먼저 여세요.  
> 각 tier·카드·분기 조건이 전부 나와 있습니다.

---

## 구조 한눈에 보기

```
dashboard/
│
├── OperationalDashboard.tsx        # 진입점 — Tier 섹션을 순서대로 렌더링하는 thin orchestrator
│
├── sections/                       # Tier별 렌더 단위
│   ├── DASHBOARD_MAP.md            # ★ 카드 전체 인덱스 (여기부터)
│   ├── Tier0Header.tsx             # 상호명 + 리추얼 배너
│   ├── Tier1Hero.tsx               # CEO 모닝 브리핑 + Alert
│   ├── Tier1DailyHub.tsx           # 매출·현금·손익·KPI Strip
│   ├── Tier1_5Coaching.tsx         # 코칭 카드 (업종별 분기, 가장 많은 카드)
│   ├── Tier2WeeklyPulse.tsx        # 13주 예측·생존보드·비용도넛·벤치마크
│   ├── Tier3Operations.tsx         # 구독·고객·인기상품·최근활동
│   ├── Tier4GrowthTools.tsx        # WhatIf·시간·마일스톤·인터뷰·4대보험
│   └── Tier5ForecastTools.tsx      # 예측·플레이북·내보내기
│
├── CEOMorningHero.tsx              # AI 모닝 브리핑 hero (Tier 1에서 사용)
├── CashflowHeroCard.tsx            # 현금 + 런웨이 (Tier 1.1에서 사용)
├── PLHeroCard.tsx                  # 손익 카드 (Tier 1.1에서 사용)
├── Cashflow13WeekForecastCard.tsx  # 13주 예측 (Tier 2에서 사용)
└── (60+ 개별 카드 파일)
```

---

## 데이터 흐름

```
useDashboard()                  ← 6개 Zustand 스토어 집계 (lib/useDashboard.ts)
    │
    ├── DashboardHook (d)       → 모든 tier에 props로 전달
    └── useDashboardComputed()  → 계산값 캐시 (c: totalSales, runwayMonths …)
                                   (lib/hooks/useDashboardComputed.tsx)
```

모든 Tier 컴포넌트는 동일한 시그니처를 받습니다:
```tsx
type Props = {
  d: DashboardHook;          // raw store state + handlers
  c: DashboardComputed;      // memoized computed values
  ko: boolean;               // true = 한국어
  nextStaggerStyle: () => CSSProperties;  // 카드 stagger 애니메이션
};
```

---

## 새 카드 추가 체크리스트

1. **Tier 결정** — [DASHBOARD_MAP.md](./sections/DASHBOARD_MAP.md) 에서 적절한 tier 찾기
2. **파일 생성** — `ComponentNameCard.tsx`, 파일 상단 한 줄 주석으로 역할 명시
3. **Tier 파일에 등록** — `TierN_*.tsx` 에 `<NewCard d={d} c={c} ko={ko} />` 추가
4. **분기 조건 추가** — 업종·데이터 유무 분기는 카드 내부 또는 `showByMatrix(cardId)`
5. **DASHBOARD_MAP.md 업데이트** — 한 줄 추가 필수

---

## 카드 숨기기 (사용자 설정)

사장님이 특정 카드를 대시보드에서 숨길 수 있습니다.

- **SSOT**: `lib/dashboard-cards-meta.ts` — 카드 ID·라벨·essential 여부
- **저장소**: `profile-store.hiddenCards: string[]` → Supabase에 동기화
- **UI**: `components/profile/DashboardLayoutCard.tsx`
- **가드 패턴**:
  ```tsx
  const hiddenCards = useProfileStore((s) => s.hiddenCards);
  const hide = (id: string) => hiddenCards.includes(id);
  // ...
  {!hide("activity-snapshot") && <ActivitySnapshotCard ... />}
  ```
- essential 카드(NSM hero, cashflow, activity-snapshot)는 숨길 수 없음

---

## 스타일 규칙

- 카드 공통 컨테이너: `.bento-card` (globals.css) — 호버 효과 포함
- 그리드: `.bento-grid` — 모바일 767px 이하에서 1열로 자동 전환
- 라이브 업데이트 CSS: `animations.tsx` 의 `LivePulse` 컴포넌트
- 색상 토큰: `lavender-mist` 배경 + `midnight navy(#191970)` 액센트 (신호등 색 금지)

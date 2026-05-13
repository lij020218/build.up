# build.up iOS

한국 SMB 사장님 운영 대시보드의 모바일 앱 — Swift + SwiftUI + iOS 26 Liquid Glass.

## 디자인 철학

웹과 동일한 build.up 철학 + 모바일 최적화:

| 원칙 | 웹 | iOS |
|---|---|---|
| 컬러 | Lavender Mist 배경 + Midnight Navy 액센트 | 동일 토큰 + Dark Mode 자동 |
| 타이포 | SF Pro Display (Apple) | SF Pro Display + Dynamic Type |
| 신호색 | 위험 시에만 (점진적 disclosure) | 동일 — 평소엔 neutral |
| 머티리얼 | Liquid Glass (CSS backdrop-filter) | `.glassEffect()` iOS 26 + `.ultraThinMaterial` fallback |
| 입력 | 키보드 + 5초 룰 | 큰 숫자 키패드 + 햅틱 + 5초 룰 |
| 카드 | 가로 그리드 (2-3 col) | 세로 스택 (1 col, full-width) |

## 디렉토리 구조

```
apps/ios/
├── Package.swift                          # Swift Package 정의
├── Sources/
│   ├── BuildUpDesignSystem/               # ← 1단계 (현재 진행 중)
│   │   ├── Colors.swift                   # 디자인 토큰 (웹 SSOT 와 동기화)
│   │   ├── Typography.swift               # SF Pro + Dynamic Type
│   │   ├── Spacing.swift                  # 8pt grid
│   │   ├── GlassMaterials.swift           # iOS 26 Liquid Glass (+ iOS 18 fallback)
│   │   ├── HealthColors.swift             # HEALTH_COLORS SSOT
│   │   └── BUCard.swift                   # 표준 카드 컴포넌트
│   ├── BuildUpCore/                       # 2단계 — 비즈니스 로직 (TS shared 와 동기화)
│   │   ├── UnifiedHealth.swift
│   │   ├── CostRatios.swift
│   │   └── HeroResolver.swift
│   ├── BuildUpComponents/                 # 3단계 — UI 컴포넌트
│   │   ├── BUNumberPad.swift
│   │   ├── BUSparkline.swift
│   │   └── BUHealthDot.swift
│   └── BuildUpFeatures/                   # 4단계 — 화면
│       ├── Today/                         # CEOMorningHero 모바일 버전
│       ├── Roadmap/                       # 46단계 로드맵 모바일
│       └── Auth/                          # 카카오 + Apple Sign In
└── Tests/
    └── BuildUpDesignSystemTests/
```

## Xcode App Target 만들기 (사장님이 직접)

이 Swift Package 는 라이브러리만 정의함. 실제 실행 가능한 iOS App 은 Xcode 에서 생성:

1. **Xcode 16+** 열기 (iOS 26 SDK 포함)
2. File → New → Project → iOS → App
3. Product Name: `BuildUp`, Interface: SwiftUI, Language: Swift
4. 저장 위치: `apps/ios/App/` (이 디렉토리 안)
5. File → Add Package Dependencies → Add Local → `apps/ios/` (이 패키지)
6. Frameworks 에 `BuildUpDesignSystem` 추가

## 빌드 & 테스트

```bash
cd apps/ios
swift build              # 패키지 빌드 (CLI)
swift test               # 단위 테스트
```

Xcode 에서는 패키지를 직접 열어 preview 확인 가능.

## SSOT 동기화 원칙

웹 (`packages/shared/src/finance/*.ts`) ↔ iOS (`Sources/BuildUpCore/*.swift`) 은 같은 알고리즘.

- 임계값 변경 시 두 곳 동시 업데이트
- 같은 입력 → 같은 출력 (단위 테스트로 보장)

## 최소 지원 버전

- **iOS 18.0+** (기본)
- **iOS 26.0+** (Liquid Glass 풀 활용 — fallback 자동 처리)

## 진행 상황

- [x] **Phase 1 — Design System** (Colors / Typography / Spacing / Glass / HealthColors / BUCard)
- [x] **Phase 2 — BuildUpCore** (Models / IndustryThresholds / CostRatios / HealthScore / HeroResolver) + 23 unit tests
- [x] **Phase 3 — BuildUpComponents** (BUSparkline / BUHealthDot / BUEyebrow / BUTagBadge / BUTrendChip / BUNumberPad)
- [x] **Phase 4 — TodayView** (CEOMorningHero 모바일 — 5 섹션 + 5 시나리오 Preview)
- [x] **Phase 5 — RoadmapView** (46단계 수직 timeline + 3 상태 + sticky phase header + StageDetailSheet)
- [ ] **Phase 6** — Supabase 연동 (auth + dailyEntries / monthlyCosts CRUD)
- [ ] **Phase 7** — 카카오 로그인 (KakaoSDK) + Apple Sign In
- [ ] **Phase 8** — 푸시 알림 (모닝 브리핑 09:00 + 위기 즉시)
- [ ] **Phase 9** — Live Activity + Interactive Widget (App Intents)
- [ ] **Phase 10** — App Store 출시

## 검증

```bash
swift build    # Build complete!
swift test     # 23 tests in 6 suites passed
```

## Preview 시나리오 (Xcode 에서 검증)

`TodayView` 6개 Preview:
- 안정 운영 (`.healthyRestaurant`) — Drucker hero
- 주의 신호 (`.warningCafe`) — 비용 anomaly
- 긴급 위기 (`.criticalSaaS`) — Cashflow crisis 7일
- 매출 미기록 (`.staleSalesRestaurant`) — stale-sales hero
- 첫 진입 (`.empty`) — Drucker fallback
- Dark Mode — 모든 색상 자동 적응

`RoadmapView` 2개 Preview (Light/Dark) — 46단계, 현재 단계 23.

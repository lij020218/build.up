# iOS 출시 핸드오프 (2026-06-08)

> 코드 감사 결과 **컴파일·크래시·데이터 손실 위험은 없음**(빌드 가능, 웹과 매출수치 일치, 손실픽스 유지).
> 막는 건 대부분 **Xcode·Apple Developer 포털 작업**이라 이 환경(헤드리스)에서는 불가 → 아래를 사장님이 직접 처리.
> ⚠️ 모든 iOS 변경은 **Xcode 빌드 + 시뮬레이터/실기기 스모크 테스트**로 검증 필요(헤드리스 빌드 불가).

## 🔴 P0 — App Store 제출 차단 (Xcode/포털)

### 1. 앱 아이콘 / Asset Catalog ✅ 완료 (이번 작업)
- 나선(fieri) 마크 on 미드나잇 네이비로 **앱 아이콘 생성 완료**:
  - `App/FoundOne/Assets.xcassets/AppIcon.appiconset/icon-1024.png` (1024×1024, 알파 없음, full-bleed)
  - `AppIcon.appiconset/Contents.json`(single-size universal), 카탈로그 루트 `Contents.json`
  - `project.yml` 에 `ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon` 추가(앱 타깃은 `App/FoundOne` 그룹 전체 포함이라 .xcassets 자동 반영)
  - 소스 SVG: `apps/web/public/found-one-appicon.svg`
- **남은 일**: `xcodegen generate` 재실행(또는 Xcode가 자동 인식) 후 빌드 시 아이콘 적용 확인.

### 2. Sign in with Apple — entitlement 추가
- 현상: `.entitlements` 파일 자체가 없어, 실기기에서 "Apple로 시작" 누르면 `ASAuthorizationError 1000`로 **가입 불가**. (코드 로직 `AppleAuthProvider.swift`는 정상)
- 조치:
  1. Xcode → 타깃 → Signing & Capabilities → **+ Sign in with Apple** → `FoundOne.entitlements` 생성(`com.apple.developer.applesignin = [Default]`).
  2. Apple Developer 포털 → App ID(`com.foundone.mobile`)에 **Sign in with Apple** 활성.
  3. Supabase 콘솔 → Auth → Apple provider(Service ID·Key·Team ID) 설정 확인.

### 3. (출시에 원격 푸시 포함 시) APNs entitlement
- 현상: `aps-environment` entitlement 없음 → "현금위기 7일 전 푸시"의 **원격 푸시** 불가(로컬 알림은 동작).
- 조치: Capability **Push Notifications** 추가 + Apple 포털 APNs Key. *1차 출시를 로컬 알림만으로 가면 생략 가능*.

## 🟡 P1 — 출시 전 (Xcode/포털)

### 4. 코드 서명 팀
- `Config/Build.xcconfig:34` `DEVELOPMENT_TEAM =` 공란 → 실기기·아카이브·업로드 불가.
- 조치: `DEVELOPMENT_TEAM`에 Team ID 주입, Release 구성 `CODE_SIGN_IDENTITY = Apple Distribution`.

### 5. 카카오 로그인 (정책 결정)
- 현재 버튼 **숨김 처리됨**(SDK 미연동) → 출시에 문제 없음. 깨진 버튼 노출 없음.
- 켜려면: `Package.swift` Kakao SDK 추가 + `Config/Build.xcconfig`의 `KAKAO_NATIVE_APP_KEY`(현재 `REPLACE_WITH_...`) + Info.plist `LSApplicationQueriesSchemes`(`kakaokompassauth`·`kakaolink`) + `KakaoAuthProvider.isAvailable=true`. **출시 후 작업 가능**(이메일+Apple로 1차 출시).

### 6. 인프라(대시보드) — 코드 밖 전제
- Supabase → Database → Replication → **Realtime 토글 ON**: `user_store_data`·`business_profiles`·`roadmaps`·`coaching_history`. (안 켜면 웹↔iOS 실시간 동기화 안 됨 — 코드로 검증 불가)

## ✅ 이미 코드로 처리됨 (이번 작업)
- `MARKETING_VERSION` 0.1.0 → **1.0.0**, 내 정보에 **버전 표시** 추가.
- 익명 세션에 "계정 삭제" 버튼 **숨김**(실계정만 — 401 방지).
- `/help` 깨진 링크 **제거**(이용약관·개인정보·문의는 정상).
- 프랜차이즈 정보공개서 URL **강제언랩 가드**(`?? 공정위`)로 크래시 차단.
- FeedbackSheet·RevenueBasisSheet 상태갱신 `Task { @MainActor in }`(Swift6 strict 대비).

## ✅ 감사 통과 (블로커 아님)
- DailyEntry raw-merge 손실픽스·StageInputProjector echo방지 유지, 매출 합산 웹과 줄단위 일치,
  약관/개인정보 동의 체크박스(웹과 일관), 계정삭제(실계정) 정상, PrivacyInfo.xcprivacy·권한설명 적합.

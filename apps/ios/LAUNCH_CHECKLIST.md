# build.up Mobile — App Store 출시 체크리스트

사장님이 직접 수행해야 하는 외부 작업 + 검증 항목 정리.

---

## 1. 사전 준비 (계정 + 키 발급)

### Apple Developer Program
- [ ] Apple Developer Program 가입 ($99/년)
- [ ] App Store Connect 에서 새 App 등록 (Bundle ID: `com.buildup.mobile` 권장)
- [ ] Provisioning Profile + Distribution Certificate 생성

### Supabase
- [ ] Supabase 프로젝트 생성 (웹과 동일 프로젝트 공유)
- [ ] Project Settings → API → URL + anon key 복사
- [ ] Apple Sign In OAuth provider 활성화:
  - Authentication → Providers → Apple → Enable
  - Services ID, Team ID, Key ID, Private Key (.p8) 입력
- [ ] Kakao OAuth provider 활성화:
  - Authentication → Providers → Kakao → Enable
  - REST API key (또는 OIDC 설정) 입력

### Kakao Developers
- [ ] [Kakao Developers](https://developers.kakao.com/) 가입
- [ ] 새 앱 등록 → Native App Key 발급
- [ ] 카카오 로그인 → 활성화 → Redirect URI 등록 (Supabase callback URL)
- [ ] 동의항목: 닉네임 / 이메일 (선택) 활성화

---

## 2. Xcode 프로젝트 셋업

### 새 App Target 생성
- [ ] Xcode 16+ 설치 (iOS 26 SDK)
- [ ] File → New → Project → iOS → App
- [ ] Product Name: `BuildUp`, Bundle ID: `com.buildup.mobile`
- [ ] Interface: SwiftUI, Language: Swift, Minimum: iOS 18.0
- [ ] 저장 위치: `apps/ios/App/`

### Swift Package 연결
- [ ] File → Add Package Dependencies → Add Local → `apps/ios/`
- [ ] BuildUp App target 의 Frameworks 에 추가:
  - `BuildUpDesignSystem`
  - `BuildUpCore`
  - `BuildUpComponents`
  - `BuildUpFeatures`
  - `BuildUpData`
  - `BuildUpAuth`
  - `BuildUpNotifications`

### 진입점 코드
- [ ] App.swift 를 다음과 같이 작성:
```swift
import SwiftUI
import BuildUpFeatures

@main
struct BuildUpApp: App {
    var body: some Scene {
        WindowGroup {
            AppRoot()
        }
    }
}
```

### Info.plist 설정
- [ ] `apps/ios/Resources/Info.plist.template` 내용을 App target 의 Info.plist 에 병합
- [ ] `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `KAKAO_NATIVE_APP_KEY` 실제 값 채움
- [ ] `kakao{NATIVE_APP_KEY}` URL scheme 의 placeholder 교체

### Capabilities
- [ ] Sign In with Apple 활성화
- [ ] Push Notifications 활성화
- [ ] Background Modes:
  - Remote notifications
  - Background fetch
  - Background processing
- [ ] App Groups: `group.com.buildup.shared` 추가 (Widget 공유용)

### Privacy Manifest
- [ ] File → New File → Privacy Manifest File 추가
- [ ] `apps/ios/Resources/PrivacyInfo.xcprivacy.template` 내용 복사

---

## 3. 카카오 SDK 추가 (Phase 7 활성화)

Package.swift 의 dependencies 주석 해제:
```swift
.package(url: "https://github.com/kakao/kakao-ios-sdk", from: "2.23.0"),
```

BuildUpAuth target dependencies 에 추가:
```swift
.product(name: "KakaoSDKUser", package: "kakao-ios-sdk"),
.product(name: "KakaoSDKAuth", package: "kakao-ios-sdk"),
```

App.swift `init()` 에 SDK 초기화 추가:
```swift
import KakaoSDKCommon
// init():
guard let key = Bundle.main.infoDictionary?["KAKAO_NATIVE_APP_KEY"] as? String else {
    fatalError("KAKAO_NATIVE_APP_KEY 누락")
}
KakaoSDK.initSDK(appKey: key)
```

URL 처리:
```swift
.onOpenURL { url in
    if AuthApi.isKakaoTalkLoginUrl(url) {
        _ = AuthController.handleOpenUrl(url: url)
    }
}
```

`KakaoAuthProvider.swift` 의 `isAvailable: true` 로 변경 + signIn 구현 활성화.

---

## 4. Widget + Live Activity Extension 추가

### Widget Extension Target
- [ ] File → New → Target → Widget Extension
- [ ] Name: `BuildUpWidget`, Include Live Activity 체크
- [ ] Widget bundle 에서 BuildUpWidgets import + `HomeWidgetSmall/Medium` 사용
- [ ] ActivityConfiguration(for: CashCrisisAttributes.self) 에서
  `CashCrisisLockScreenView` + `CashCrisisDynamicIsland` 사용

### App Group 공유
- [ ] Widget Extension Capabilities 에도 App Groups: `group.com.buildup.shared` 추가
- [ ] 메인 앱이 SnapshotStore.save() 호출하면 Widget 이 load() 로 읽음

---

## 5. 출시 직전 점검

### 빌드 & 테스트
- [ ] `swift build` → Build complete!
- [ ] `swift test` → All tests pass (23+)
- [ ] Xcode 시뮬레이터 실행 (iPhone 15 Pro, iOS 18.0)
- [ ] 6 가지 TodayView Preview 시각 검증
- [ ] RoadmapView Preview 검증
- [ ] Light / Dark Mode 모두 확인

### 정책 검토
- [ ] 계정 삭제 기능 정상 작동 (Apple 정책 의무)
- [ ] 개인정보처리방침 URL 준비 (App Store Connect 입력 필수)
- [ ] 이용약관 URL 준비
- [ ] 카카오 unlink 호출 (Kakao 정책)

### App Store Connect
- [ ] 앱 정보 (이름, 부제목, 카테고리: 비즈니스)
- [ ] 스크린샷 (6.7"·6.5"·5.5" 3 크기)
- [ ] 앱 미리보기 영상 (선택)
- [ ] 키워드 (소상공인, 자영업, 매출관리, 비용, 손익)
- [ ] 가격 책정: 무료 + In-App Purchase
- [ ] In-App Purchase 등록 (월 9,900원 / 연 99,000원)
- [ ] 심사 정보: 테스트 계정 (사장님 demo 계정) + 메모

### TestFlight
- [ ] Archive 빌드 → App Store Connect 업로드
- [ ] Internal Testing → 본인 + 동료 5명
- [ ] External Testing → 한국 SMB 사장님 20-50명 (1-2주)
- [ ] 피드백 수집 + 핵심 버그 fix

### App Store 심사
- [ ] App Review 제출
- [ ] 거절 사유 단골 케이스:
  - 계정 삭제 누락
  - Privacy Manifest 누락
  - 카카오 unlink 누락
  - Apple Sign In + 이메일 누락 (3rd-party 로그인 있으면 Apple 도 필수)
  - In-App Purchase 외 결제 사용
- [ ] 승인 → 출시일 결정

---

## 6. 출시 후

### 모니터링
- [ ] Supabase 사용량 + RLS 점검
- [ ] App Store Connect Analytics (다운로드, retention, crash)
- [ ] 사용자 피드백 (App Store 리뷰 + 인앱 피드백)

### Success criteria (5개월 후 목표)
- D1 retention ≥ 60%
- D7 retention ≥ 35%
- 일평균 매출 입력 ≥ 0.8회/사장님
- 푸시 알림 권한 허용률 ≥ 70%
- App Store 별점 ≥ 4.3

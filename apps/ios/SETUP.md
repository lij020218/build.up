# build.up iOS — 5분 셋업 가이드

`.env.local` 키 + Xcode 16+ 가 이미 준비되어 있다는 전제. 5분 안에 시뮬레이터에서 실행.

---

## Step 1 — `Build.xcconfig` 자동 생성 (1초)

```bash
cd apps/ios
./Scripts/generate-xcconfig.sh
```

`.env.local` 의 `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` 가 자동으로 `Config/Build.xcconfig` 에 들어갑니다.

> ⚠️ `KAKAO_NATIVE_APP_KEY` 가 없으면 placeholder. Kakao Developers 에서 같은 앱의 **Native App Key** 발급 후 `.env.local` 에 `KAKAO_NATIVE_APP_KEY=xxxxx` 추가 → 스크립트 재실행.

---

## Step 2 — Preview 즉시 확인 (Swift Package 열기)

App target 만들기 전에 **Preview 만으로도 모든 화면 확인 가능**:

```bash
cd apps/ios
open Package.swift
```

Xcode 에서:
- `Sources/BuildUpFeatures/Today/TodayView.swift` 열기 → 우측 상단 Canvas 활성 (`⌥⌘↩︎`) → 6 가지 시나리오 Preview
- `Sources/BuildUpFeatures/Roadmap/RoadmapView.swift` → 46단계 Preview
- `Sources/BuildUpFeatures/Auth/SignInView.swift` → 로그인 화면

→ 시뮬레이터 띄울 필요 없이 코드 디자인 검증 가능.

---

## Step 3 — App Target 생성 (3분)

### 3-1. Xcode 새 프로젝트

1. Xcode → File → New → Project
2. **iOS → App** 선택
3. 옵션:
   - Product Name: `BuildUp`
   - Team: (본인 Apple ID 선택, 없으면 Add Account)
   - Organization Identifier: `com.buildup`
   - Bundle ID: `com.buildup.mobile` (자동 생성됨)
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Storage: **None** (SwiftData 옵션 아님 — 직접 추가 예정)
   - Include Tests: 체크
4. 저장 위치: `apps/ios/App/` (자동으로 `apps/ios/App/BuildUp/...` 구조 생성)

### 3-2. Swift Package 의존성 추가

1. Xcode 좌측 Project Navigator → `BuildUp` 프로젝트 클릭
2. 중앙 패널 → `BuildUp` target → General 탭 → **Frameworks, Libraries, and Embedded Content**
3. `+` 버튼 → **Add Local** → `apps/ios/` (이 폴더) 선택
4. 아래 7개 라이브러리 모두 체크해서 추가:
   - `BuildUpDesignSystem`
   - `BuildUpCore`
   - `BuildUpComponents`
   - `BuildUpFeatures` ← 메인
   - `BuildUpData`
   - `BuildUpAuth`
   - `BuildUpNotifications`

### 3-3. xcconfig 연결

1. Project Navigator → `BuildUp` 프로젝트 클릭
2. 중앙 **PROJECT** (target 위) → Info 탭 → Configurations 섹션
3. **Debug** + **Release** 각각:
   - `BuildUp` target row 클릭
   - 우측 ▼ → `Config/Build.xcconfig` 선택

### 3-4. 진입점 코드 교체

생성된 `BuildUpApp.swift` 를 통째로 아래로 교체:

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

`ContentView.swift` 는 삭제 가능 (Project Navigator 우클릭 → Delete).

### 3-5. Info.plist 환경 변수 참조

기본 생성된 Info.plist 가 안 보이면: Project → Info 탭 → Custom iOS Target Properties.

다음 항목 추가:

| Key | Type | Value |
|---|---|---|
| SUPABASE_URL | String | `$(SUPABASE_URL)` |
| SUPABASE_ANON_KEY | String | `$(SUPABASE_ANON_KEY)` |
| BU_ENVIRONMENT | String | `$(BU_ENVIRONMENT)` |
| KAKAO_NATIVE_APP_KEY | String | `$(KAKAO_NATIVE_APP_KEY)` |
| NSCameraUsageDescription | String | `영수증 촬영을 위해 카메라 권한이 필요합니다` |
| NSSupportsLiveActivities | Boolean | YES |

또는 `apps/ios/Resources/Info.plist.template` 의 내용을 통째로 복사.

### 3-6. Capabilities

Target → Signing & Capabilities → `+ Capability`:
- ✅ Sign In with Apple
- ✅ Push Notifications
- ✅ Background Modes → Remote notifications + Background fetch + Background processing
- ✅ App Groups → `group.com.buildup.shared` 추가

### 3-7. 빌드 & 실행

`⌘R` → iPhone 15 Pro 시뮬레이터 (iOS 18.0) → 앱 실행

처음에는 SignInView 가 뜸. Supabase Auth → Apple Sign In 가능 (Kakao 는 SDK 추가 전엔 비활성).

---

## Step 4 — 카카오 SDK 활성화 (선택, 5분)

Kakao Developers 에서 **Native App Key** 발급 후:

### 4-1. .env.local + xcconfig 갱신

```bash
echo "KAKAO_NATIVE_APP_KEY=발급받은_네이티브_키" >> apps/web/.env.local
cd apps/ios && ./Scripts/generate-xcconfig.sh
```

### 4-2. Kakao SDK 의존성 추가

`apps/ios/Package.swift` 의 dependencies 에 추가:

```swift
.package(url: "https://github.com/kakao/kakao-ios-sdk", from: "2.23.0"),
```

BuildUpAuth target 의 dependencies 에 추가:

```swift
.target(
    name: "BuildUpAuth",
    dependencies: [
        "BuildUpCore",
        "BuildUpData",
        .product(name: "KakaoSDKUser", package: "kakao-ios-sdk"),
        .product(name: "KakaoSDKAuth", package: "kakao-ios-sdk"),
    ],
    // ...
)
```

### 4-3. KakaoAuthProvider 활성화

`Sources/BuildUpAuth/KakaoAuthProvider.swift`:
- `isAvailable: Bool = false` → `isAvailable: Bool = true`
- 주석 처리된 실제 로그인 로직 활성화 (`signIn()` 메서드)

### 4-4. URL Scheme + SDK 초기화

`BuildUpApp.swift` 수정:

```swift
import SwiftUI
import BuildUpFeatures
import KakaoSDKCommon
import KakaoSDKAuth

@main
struct BuildUpApp: App {
    init() {
        if let key = Bundle.main.infoDictionary?["KAKAO_NATIVE_APP_KEY"] as? String {
            KakaoSDK.initSDK(appKey: key)
        }
    }

    var body: some Scene {
        WindowGroup {
            AppRoot()
                .onOpenURL { url in
                    if AuthApi.isKakaoTalkLoginUrl(url) {
                        _ = AuthController.handleOpenUrl(url: url)
                    }
                }
        }
    }
}
```

Info.plist 에 URL Scheme 추가:
- CFBundleURLTypes → URL Schemes → `$(KAKAO_URL_SCHEME)`
- LSApplicationQueriesSchemes → `kakaokompassauth`, `kakaolink`

---

## Step 5 — Widget Extension 추가 (선택, 10분)

App Store 출시 시점에 작업. `LAUNCH_CHECKLIST.md` 4번 섹션 참조.

---

## 자주 묻는 질문

**Q. 시뮬레이터에서 Kakao 로그인 안 됨**
A. Kakao 로그인은 **카카오톡 앱이 설치된 실제 기기**에서만 1차 시도. 시뮬레이터는 웹뷰 fallback.

**Q. Push Notification 권한 거부 후 다시 묻기**
A. 시뮬레이터 → Settings → Notifications → BuildUp → Allow 수동 설정.

**Q. Supabase 연결 실패 (`SUPABASE_URL 누락` fatalError)**
A. Info.plist 에 `SUPABASE_URL` 키가 `$(SUPABASE_URL)` 로 들어갔는지 확인. Build.xcconfig 가 Configurations 에 연결됐는지 확인.

**Q. Build 에러: `cannot find 'KAKAO_NATIVE_APP_KEY' in environment`**
A. `./Scripts/generate-xcconfig.sh` 재실행. .env.local 에 키 추가됐는지 확인.

// swift-tools-version: 6.0
//
// Found.One iOS — Swift Package
//
// 한국 SMB 사장님 운영 대시보드의 모바일 앱.
// 현재 FoundOneDesignSystem 모듈만 존재 (1단계). 후속: FoundOneCore / Components / Features.
//
// 실행 가능한 App target 은 Xcode 에서 별도 생성 (README 참조).

import PackageDescription

let package = Package(
    name: "FoundOne",
    defaultLocalization: "ko",
    platforms: [
        // iOS 전용. swift build CLI 는 macOS host 호환성 이슈로 비활성 — Xcode + iOS 시뮬레이터로 빌드.
        .iOS(.v18),
    ],
    products: [
        // 1단계: 디자인 시스템
        .library(name: "FoundOneDesignSystem", targets: ["FoundOneDesignSystem"]),
        // 2단계: 비즈니스 로직 SSOT
        .library(name: "FoundOneCore", targets: ["FoundOneCore"]),
        // 3단계: UI 컴포넌트
        .library(name: "FoundOneComponents", targets: ["FoundOneComponents"]),
        // 4단계: 화면 (Features)
        .library(name: "FoundOneFeatures", targets: ["FoundOneFeatures"]),
        // 6단계: 네트워크/Auth/Persistence
        .library(name: "FoundOneData", targets: ["FoundOneData"]),
        // 7단계: Auth providers (카카오/Apple)
        .library(name: "FoundOneAuth", targets: ["FoundOneAuth"]),
        // 8단계: 푸시 알림
        .library(name: "FoundOneNotifications", targets: ["FoundOneNotifications"]),
        // 9단계: Widget + Live Activity (App Extension target 에서 import)
        .library(name: "FoundOneWidgets", targets: ["FoundOneWidgets"]),
    ],
    dependencies: [
        // Supabase Swift SDK — Auth / PostgREST / Realtime / Storage
        .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0"),
        // Lucide Icons — 웹 lucide-react 와 동일한 1300+ 아이콘 (SPM)
        // 사용: Image(uiImage: UIImage(lucideId: "utensils-crossed"))
        .package(url: "https://github.com/JakubMazur/lucide-icons-swift.git", from: "1.16.0"),
        // 카카오 로그인 SDK 는 사장님이 native app key 받은 후 추가:
        // .package(url: "https://github.com/kakao/kakao-ios-sdk", from: "2.23.0"),
    ],
    targets: [
        // ──────────── 1단계: Design System ────────────
        // FoundOneCore 의존 — HealthGrade 등 pure type 만 가져옴 (SwiftUI 의존성 없음 유지)
        .target(
            name: "FoundOneDesignSystem",
            dependencies: ["FoundOneCore"],
            path: "Sources/FoundOneDesignSystem",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableUpcomingFeature("ExistentialAny"),
            ]
        ),
        .testTarget(
            name: "FoundOneDesignSystemTests",
            dependencies: ["FoundOneDesignSystem"],
            path: "Tests/FoundOneDesignSystemTests"
        ),

        // ──────────── 2단계: Core (비즈니스 로직) ────────────
        // 의존성 없음 — pure Swift. TS shared 와 같은 알고리즘만 미러.
        .target(
            name: "FoundOneCore",
            dependencies: [],
            path: "Sources/FoundOneCore",
            resources: [
                .process("Resources")
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableUpcomingFeature("ExistentialAny"),
            ]
        ),
        .testTarget(
            name: "FoundOneCoreTests",
            dependencies: ["FoundOneCore"],
            path: "Tests/FoundOneCoreTests"
        ),

        // ──────────── 3단계: Components (UI 빌딩 블록) ────────────
        .target(
            name: "FoundOneComponents",
            dependencies: ["FoundOneDesignSystem", "FoundOneCore"],
            path: "Sources/FoundOneComponents",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableUpcomingFeature("ExistentialAny"),
            ]
        ),

        // ──────────── 4단계: Features (화면) ────────────
        .target(
            name: "FoundOneFeatures",
            dependencies: [
                "FoundOneDesignSystem", "FoundOneCore", "FoundOneComponents",
                "FoundOneData", "FoundOneAuth", "FoundOneNotifications",
                .product(name: "LucideIcons", package: "lucide-icons-swift"),
            ],
            path: "Sources/FoundOneFeatures",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableUpcomingFeature("ExistentialAny"),
            ]
        ),

        // ──────────── 6단계: Data (Supabase + Repository) ────────────
        .target(
            name: "FoundOneData",
            dependencies: [
                "FoundOneCore",
                .product(name: "Supabase", package: "supabase-swift"),
            ],
            path: "Sources/FoundOneData",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableUpcomingFeature("ExistentialAny"),
            ]
        ),
        .testTarget(
            name: "FoundOneDataTests",
            dependencies: ["FoundOneData"],
            path: "Tests/FoundOneDataTests"
        ),

        // ──────────── 7단계: Auth ────────────
        .target(
            name: "FoundOneAuth",
            dependencies: [
                "FoundOneCore",
                "FoundOneData",
            ],
            path: "Sources/FoundOneAuth",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableUpcomingFeature("ExistentialAny"),
            ]
        ),

        // ──────────── 8단계: Notifications ────────────
        .target(
            name: "FoundOneNotifications",
            dependencies: [
                "FoundOneCore",
            ],
            path: "Sources/FoundOneNotifications",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableUpcomingFeature("ExistentialAny"),
            ]
        ),

        // ──────────── 9단계: Widgets + Live Activity ────────────
        // App Extension target 에서 import (Xcode 에서 Widget Extension 추가 시).
        .target(
            name: "FoundOneWidgets",
            dependencies: [
                "FoundOneCore",
                "FoundOneDesignSystem",
            ],
            path: "Sources/FoundOneWidgets",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableUpcomingFeature("ExistentialAny"),
            ]
        ),
    ]
)

// swift-tools-version: 6.0
//
// build.up iOS — Swift Package
//
// 한국 SMB 사장님 운영 대시보드의 모바일 앱.
// 현재 BuildUpDesignSystem 모듈만 존재 (1단계). 후속: BuildUpCore / Components / Features.
//
// 실행 가능한 App target 은 Xcode 에서 별도 생성 (README 참조).

import PackageDescription

let package = Package(
    name: "BuildUp",
    defaultLocalization: "ko",
    platforms: [
        .iOS(.v18),       // 기본 (모든 사장님 사용 가능)
        .macOS(.v15),     // SwiftUI preview / Xcode Mac 대상
    ],
    products: [
        // 1단계: 디자인 시스템
        .library(name: "BuildUpDesignSystem", targets: ["BuildUpDesignSystem"]),
        // 2단계: 비즈니스 로직 SSOT
        .library(name: "BuildUpCore", targets: ["BuildUpCore"]),
        // 3단계: UI 컴포넌트
        .library(name: "BuildUpComponents", targets: ["BuildUpComponents"]),
        // 4단계: 화면 (Features)
        .library(name: "BuildUpFeatures", targets: ["BuildUpFeatures"]),
    ],
    dependencies: [
        // Supabase/Kakao 등은 Auth/Network 모듈에서 추가 예정
    ],
    targets: [
        // ──────────── 1단계: Design System ────────────
        // BuildUpCore 의존 — HealthGrade 등 pure type 만 가져옴 (SwiftUI 의존성 없음 유지)
        .target(
            name: "BuildUpDesignSystem",
            dependencies: ["BuildUpCore"],
            path: "Sources/BuildUpDesignSystem",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableUpcomingFeature("ExistentialAny"),
            ]
        ),
        .testTarget(
            name: "BuildUpDesignSystemTests",
            dependencies: ["BuildUpDesignSystem"],
            path: "Tests/BuildUpDesignSystemTests"
        ),

        // ──────────── 2단계: Core (비즈니스 로직) ────────────
        // 의존성 없음 — pure Swift. TS shared 와 같은 알고리즘만 미러.
        .target(
            name: "BuildUpCore",
            dependencies: [],
            path: "Sources/BuildUpCore",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableUpcomingFeature("ExistentialAny"),
            ]
        ),
        .testTarget(
            name: "BuildUpCoreTests",
            dependencies: ["BuildUpCore"],
            path: "Tests/BuildUpCoreTests"
        ),

        // ──────────── 3단계: Components (UI 빌딩 블록) ────────────
        .target(
            name: "BuildUpComponents",
            dependencies: ["BuildUpDesignSystem", "BuildUpCore"],
            path: "Sources/BuildUpComponents",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableUpcomingFeature("ExistentialAny"),
            ]
        ),

        // ──────────── 4단계: Features (화면) ────────────
        .target(
            name: "BuildUpFeatures",
            dependencies: ["BuildUpDesignSystem", "BuildUpCore", "BuildUpComponents"],
            path: "Sources/BuildUpFeatures",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableUpcomingFeature("ExistentialAny"),
            ]
        ),
    ]
)

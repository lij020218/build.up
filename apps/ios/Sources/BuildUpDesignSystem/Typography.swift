//
//  Typography.swift — build.up 타이포그래피
//
//  Apple SF Pro Display / SF Pro Text 위에 build.up 위계 정의.
//
//  웹 (globals.css) 과의 매핑:
//   • 큰 숫자 hero  — 26-34px → .buHeroNumber
//   • 카드 title    — 18-20px → .buCardTitle
//   • 카드 body     — 13-14.5px → .buCardBody
//   • Eyebrow / Tag — 10-11px UPPERCASE → .buEyebrow
//
//  Dynamic Type 지원 (한국 사장님 큰 글씨 필요) — relativeTo 기준 폰트 사용.
//

import SwiftUI

public enum BUFont {

    // MARK: - Hero — 큰 숫자 (NSM 메인 메트릭, 매출 hero 등)
    /// 34pt / 700 / -0.035em / SF Pro Display
    /// Dynamic Type: .largeTitle 기준 ±20%
    public static let heroNumber = Font.system(
        size: 34,
        weight: .bold,
        design: .default
    ).leading(.tight)

    /// 26pt — 단순 큰 숫자 (NSM 보조, KPI 셀)
    public static let bigNumber = Font.system(
        size: 26,
        weight: .bold,
        design: .default
    ).leading(.tight)

    // MARK: - Title — 카드 헤더
    /// 20pt / 700 / -0.03em
    public static let cardTitle = Font.system(.title3, design: .default).weight(.bold)

    /// 18pt — 보조 헤더 (서브 카드)
    public static let cardTitleSmall = Font.system(.headline, design: .default).weight(.bold)

    // MARK: - Body — 본문 / 분석문 / 액션문
    /// 17pt — 본문 기본 (Apple HIG)
    public static let body = Font.system(.body, design: .default).weight(.regular)

    /// 14.5pt — 보조 본문 (분석문 / 액션문)
    public static let bodySmall = Font.system(.subheadline, design: .default).weight(.regular)

    /// 13pt / 500 — 카드 내 description
    public static let bodyCaption = Font.system(.footnote, design: .default).weight(.medium)

    // MARK: - Label — 라벨 / 강조 텍스트
    /// 13px / 700 — 위험신호 박스 제목 등
    public static let label = Font.system(.subheadline, design: .default).weight(.bold)

    /// 12.5px / 500 — 보조 라벨
    public static let labelSmall = Font.system(.footnote, design: .default).weight(.medium)

    // MARK: - Eyebrow — 10-11px UPPERCASE (Tier 라벨, 카테고리 태그)
    /// 10.5pt / 700 / 0.14em letter-spacing / UPPERCASE
    /// 사용 시 `.tracking(1.5)` modifier 추가 권장.
    public static let eyebrow = Font.system(.caption2, design: .default).weight(.bold)

    public static let eyebrowLarge = Font.system(.caption, design: .default).weight(.bold)

    // MARK: - Tabular Numbers (숫자 정렬용)
    /// 숫자 표시에는 `.monospacedDigit()` 적용 권장 — 자릿수 흔들림 방지.
    /// 예: `.font(BUFont.bigNumber.monospacedDigit())`
}

// MARK: - View modifier helpers — 한 줄에 폰트 + tracking + lineHeight 설정

public extension View {
    /// 큰 숫자용 (tabular digits + 타이트 line height)
    func buHeroNumberStyle(color: Color = BUColor.midnightDeep) -> some View {
        self
            .font(BUFont.heroNumber.monospacedDigit())
            .foregroundStyle(color)
            .tracking(-0.5)
            .lineSpacing(0)
    }

    /// 카드 타이틀
    func buCardTitleStyle(color: Color = BUColor.ink) -> some View {
        self
            .font(BUFont.cardTitle)
            .foregroundStyle(color)
            .tracking(-0.3)
    }

    /// Eyebrow (UPPERCASE 태그 — Tier·카테고리 라벨)
    /// 호출 측에서 `.text("TODAY".uppercased())` 식으로 대문자화 권장.
    func buEyebrowStyle(color: Color = BUColor.inkMuted) -> some View {
        self
            .font(BUFont.eyebrow)
            .foregroundStyle(color)
            .tracking(1.5)
            .textCase(.uppercase)
    }

    /// 분석문 (Hero 안의 본문 — multiline 자연스럽게)
    func buAnalysisStyle(color: Color = BUColor.inkSecondary) -> some View {
        self
            .font(BUFont.bodySmall)
            .foregroundStyle(color)
            .lineSpacing(4)
            .tracking(-0.1)
    }
}

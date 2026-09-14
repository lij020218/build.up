//
//  BUListSection.swift — 애플식 그룹 리스트 (2026-09-12).
//
//  왜 만들었나 (사장님 지적: "내부 요소들이 너무 복잡하고 세련되지 못하다"):
//   화면마다 카드·행을 손으로 다시 만들고 있었다. 그래서
//    · 카드가 화면마다 달랐다 (내 정보는 반투명 흰색 0.72 + 모서리 18 로 공용 카드와 따로 놀았다)
//    · 제목이 세 번 나왔다 (`ACCOUNT · 계정` eyebrow + `계정 정보` 타이틀 + 행 라벨)
//    · 본문 글자가 13~14pt 라 촘촘하고 답답했다 (애플 리스트 기본은 17pt)
//
//  애플이 하는 방식 (설정·메일·건강의 inset grouped 리스트):
//    제목은 카드 **밖**에 한 번, 카드 안에는 내용만.
//    행은 라벨(왼쪽) + 값(오른쪽), 높이 최소 44pt, 사이는 들여쓴 헤어라인 한 줄.
//    장식 배지·칩 없이 글자와 간격만으로 위계를 만든다.
//
//  쓰는 법:
//    BUListSection("계정") {
//        BUListRow.value("이메일", "owner@example.com")
//        BUListRow.link("도움말") { openHelp() }
//        BUListRow.toggle("푸시 알림", subtitle: "매출 급변 시 알림", isOn: $push)
//    }
//

import SwiftUI

// MARK: - 행

/// 리스트 한 줄. 뷰가 아니라 **값**이다 — 그래야 섹션이 구분선을 자동으로 넣을 수 있다.
public struct BUListRow: Identifiable {

    public enum Accessory {
        /// 오른쪽 회색 값 텍스트.
        case value(String, monospaced: Bool)
        /// 탭하면 이동 — 셰브론.
        case chevron
        /// 스위치.
        case toggle(Binding<Bool>)
        /// 선택지 목록의 현재 선택 — 오른쪽 체크마크(애플 설정앱 패턴).
        case checkmark(Bool)
        /// 그 밖의 것(배지·진행바 등). 꼭 필요할 때만.
        case custom(AnyView)
        case none
    }

    public let id = UUID()
    let title: String
    let subtitle: String?
    let accessory: Accessory
    let action: (() -> Void)?
    let isDestructive: Bool
    /// 설정앱처럼 라벨 왼쪽에 붙는 29pt 아이콘 타일. nil 이면 아이콘 없음.
    let icon: String?
    let iconTint: Color?
    /// 행 전체 폭을 쓰는 내용(진행바·칩 묶음 등). 있으면 라벨 아래에 깔린다.
    let content: AnyView?

    private init(title: String, subtitle: String?, accessory: Accessory,
                 action: (() -> Void)?, isDestructive: Bool = false,
                 icon: String? = nil, iconTint: Color? = nil, content: AnyView? = nil) {
        self.title = title
        self.subtitle = subtitle
        self.accessory = accessory
        self.action = action
        self.isDestructive = isDestructive
        self.icon = icon
        self.iconTint = iconTint
        self.content = content
    }

    /// 아이콘을 붙인 사본 — `BUListRow.link("데이터 연결") {}.icon("antenna.radiowaves.left.and.right")`
    public func icon(_ systemName: String, tint: Color? = nil) -> BUListRow {
        .init(title: title, subtitle: subtitle, accessory: accessory, action: action,
              isDestructive: isDestructive, icon: systemName, iconTint: tint, content: content)
    }

    /// 라벨 + 값. 이메일·사업자번호처럼 자릿수를 맞춰 읽어야 하면 `monospaced: true`.
    public static func value(_ title: String, _ value: String,
                             subtitle: String? = nil, monospaced: Bool = false) -> BUListRow {
        .init(title: title, subtitle: subtitle,
              accessory: .value(value, monospaced: monospaced), action: nil)
    }

    /// 탭하면 이동하는 행.
    public static func link(_ title: String, subtitle: String? = nil,
                            action: @escaping () -> Void) -> BUListRow {
        .init(title: title, subtitle: subtitle, accessory: .chevron, action: action)
    }

    /// 스위치 행.
    public static func toggle(_ title: String, subtitle: String? = nil,
                              isOn: Binding<Bool>) -> BUListRow {
        .init(title: title, subtitle: subtitle, accessory: .toggle(isOn), action: nil)
    }

    /// 배지·진행바처럼 값 텍스트로 안 되는 경우.
    public static func custom<V: View>(_ title: String, subtitle: String? = nil,
                                       @ViewBuilder trailing: () -> V) -> BUListRow {
        .init(title: title, subtitle: subtitle,
              accessory: .custom(AnyView(trailing())), action: nil)
    }

    /// 선택지 한 줄 — 고르면 오른쪽에 체크마크. 라디오 버튼·2단 카드 대신 쓴다.
    public static func select(_ title: String, subtitle: String? = nil,
                              isSelected: Bool, action: @escaping () -> Void) -> BUListRow {
        .init(title: title, subtitle: subtitle, accessory: .checkmark(isSelected), action: action)
    }

    /// 이동이 아니라 **동작**하는 행 — 셰브론 없이 강조색 글자 한 줄(로그아웃 등).
    public static func button(_ title: String, action: @escaping () -> Void) -> BUListRow {
        .init(title: title, subtitle: nil, accessory: .none, action: action)
    }

    /// 로그아웃·탈퇴처럼 되돌리기 어려운 행 — 애플은 빨간 글자 한 줄로만 표시한다.
    public static func destructive(_ title: String, action: @escaping () -> Void) -> BUListRow {
        .init(title: title, subtitle: nil, accessory: .none, action: action, isDestructive: true)
    }

    /// 값도 셰브론도 없는 설명 행.
    public static func plain(_ title: String, subtitle: String? = nil) -> BUListRow {
        .init(title: title, subtitle: subtitle, accessory: .none, action: nil)
    }

    /// 라벨 + 오른쪽 값 + 그 아래 전체 폭 내용(진행바 등).
    public static func content<V: View>(_ title: String, value: String? = nil,
                                        subtitle: String? = nil,
                                        @ViewBuilder content: () -> V) -> BUListRow {
        .init(title: title, subtitle: subtitle,
              accessory: value.map { Accessory.value($0, monospaced: false) } ?? .none,
              action: nil, content: AnyView(content()))
    }
}

// MARK: - 행 빌더

@resultBuilder
public enum BUListRowBuilder {
    public static func buildBlock(_ parts: [BUListRow]...) -> [BUListRow] { parts.flatMap { $0 } }
    public static func buildExpression(_ row: BUListRow) -> [BUListRow] { [row] }
    public static func buildExpression(_ rows: [BUListRow]) -> [BUListRow] { rows }
    public static func buildOptional(_ rows: [BUListRow]?) -> [BUListRow] { rows ?? [] }
    public static func buildEither(first rows: [BUListRow]) -> [BUListRow] { rows }
    public static func buildEither(second rows: [BUListRow]) -> [BUListRow] { rows }
    public static func buildArray(_ parts: [[BUListRow]]) -> [BUListRow] { parts.flatMap { $0 } }
    public static func buildLimitedAvailability(_ rows: [BUListRow]) -> [BUListRow] { rows }
}

// MARK: - 섹션

/// 제목(카드 밖) + 불투명 카드 + 헤어라인으로 나뉜 행들.
public struct BUListSection: View {

    private let title: String?
    private let actionLabel: String?
    private let action: (() -> Void)?
    private let footer: String?
    private let rows: [BUListRow]

    public init(
        _ title: String? = nil,
        actionLabel: String? = nil,
        action: (() -> Void)? = nil,
        footer: String? = nil,
        @BUListRowBuilder rows: () -> [BUListRow]
    ) {
        self.title = title
        self.actionLabel = actionLabel
        self.action = action
        self.footer = footer
        self.rows = rows()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let title {
                BUSectionTitle(title, actionLabel: actionLabel, action: action)
            }

            VStack(spacing: 0) {
                ForEach(Array(rows.enumerated()), id: \.element.id) { index, row in
                    if index > 0 {
                        // 애플 리스트와 같은 규칙 — 구분선은 라벨 시작점에 맞춰 들여쓴다.
                        BUHairline(inset: Metrics.horizontal)
                    }
                    RowView(row: row)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.surfaceElevated)
            .clipShape(RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                    .strokeBorder(BUColor.ink.opacity(0.07), lineWidth: 0.5)
            )
            .shadow(color: BUColor.ink.opacity(0.05), radius: 10, x: 0, y: 3)

            if let footer {
                // 각주는 카드 밖 — 카드 안에 넣으면 행처럼 읽힌다.
                Text(footer)
                    .font(.system(size: 13))
                    .foregroundStyle(BUColor.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 4)
            }
        }
    }

    enum Metrics {
        /// 행 좌우 여백 — 구분선 들여쓰기와 같은 값이어야 선이 라벨에 맞는다.
        static let horizontal: CGFloat = 16
        /// 애플 최소 탭 영역.
        static let minHeight: CGFloat = 44
    }
}

// MARK: - 행 렌더

private struct RowView: View {
    let row: BUListRow

    var body: some View {
        if let action = row.action {
            Button(action: action) { content }
                .buttonStyle(BUListRowButtonStyle())
        } else {
            content
        }
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                if let icon = row.icon {
                    iconTile(icon)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(row.title)
                        // 애플 리스트 본문 = 17pt. 종전 13~14pt 가 화면을 촘촘하게 만들었다.
                        .font(.system(size: 17))
                        .foregroundStyle(row.isDestructive ? BUColor.danger : BUColor.ink)
                    if let subtitle = row.subtitle {
                        Text(subtitle)
                            .font(.system(size: 13))
                            .foregroundStyle(BUColor.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer(minLength: 8)
                accessoryView
            }
            if let extra = row.content {
                extra
            }
        }
        .padding(.horizontal, BUListSection.Metrics.horizontal)
        .padding(.vertical, 11)
        .frame(minHeight: BUListSection.Metrics.minHeight)
        .contentShape(Rectangle())
    }

    /// 설정앱 아이콘 타일 — 29pt 정사각, 안쪽 심볼 흰색.
    private func iconTile(_ systemName: String) -> some View {
        RoundedRectangle(cornerRadius: 7, style: .continuous)
            .fill(row.iconTint ?? BUColor.midnight)
            .frame(width: 29, height: 29)
            .overlay(
                Image(systemName: systemName)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(.white)
            )
            .accessibilityHidden(true)
    }

    @ViewBuilder
    private var accessoryView: some View {
        switch row.accessory {
        case let .value(text, monospaced):
            Text(text)
                .font(.system(size: 17, design: monospaced ? .monospaced : .default))
                .foregroundStyle(BUColor.inkMuted)
                .multilineTextAlignment(.trailing)
                .lineLimit(1)
                .truncationMode(.middle)
        case let .checkmark(on):
            Image(systemName: "checkmark")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(BUColor.midnightInk)
                .opacity(on ? 1 : 0)
                .accessibilityHidden(true)
        case .chevron:
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(BUColor.ink.opacity(0.25))
        case let .toggle(binding):
            Toggle("", isOn: binding)
                .labelsHidden()
                .tint(BUColor.midnight)
        case let .custom(view):
            view
        case .none:
            EmptyView()
        }
    }
}

/// 눌림 표시 — 애플 리스트처럼 행 전체가 옅게 깔린다.
private struct BUListRowButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(configuration.isPressed ? BUColor.ink.opacity(0.05) : Color.clear)
    }
}

// MARK: - Preview

#if DEBUG
#Preview("BUListSection") {
    ZStack {
        BUCanvasBackground()
        ScrollView {
            VStack(spacing: BUSpacing.shellGap) {
                BUListSection("계정", footer: "로그인하면 기기가 바뀌어도 기록이 이어집니다.") {
                    BUListRow.value("이메일", "owner@example.com")
                    BUListRow.value("로그인 방식", "Apple")
                    BUListRow.link("비밀번호 변경") {}
                }
                BUListSection("가게", actionLabel: "편집", action: {}) {
                    BUListRow.value("가게 이름", "성심당 본점")
                    BUListRow.value("영업시간", "09:00 – 21:00")
                    BUListRow.value("사업자번호", "123-45-67890", monospaced: true)
                }
            }
            .padding(.horizontal, BUSpacing.screenMargin)
            .padding(.top, BUSpacing.md)
        }
    }
}
#endif

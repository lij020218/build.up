//
//  DesignPreviewView.swift — iOS 26 디자인 개편 "적용 후" 미리보기 (2026-09-12, DEBUG 전용).
//
//  용도: 사장님께 보여드릴 **비교용 화면**. 실제 데이터·상태 없이 목업 값으로 새 규칙만 보여준다.
//    실행: SIMCTL_CHILD_BU_DEMO_ALLOW=1 SIMCTL_CHILD_BU_DEMO_DESIGN=home|roadmap|profile \
//          xcrun simctl launch booted com.foundone.mobile
//
//  적용한 규칙 (조사 근거는 docs/design/ios-redesign-plan-20260912.md):
//   1) Liquid Glass 는 **네비게이션 레이어에만**. 콘텐츠(카드·리스트)는 불투명 — 글자가 유리 위에 놓이지 않는다.
//   2) 배경은 그라디언트가 아니라 한 톤의 단색. 색은 "지금 할 일·위험" 에만 쓴다.
//   3) 카드 안에 카드 금지(중첩 0단계). 내부 구분은 여백과 헤어라인으로.
//   4) 한 화면 = 한 가지 일 + 주요 액션 1개. 칩은 줄당 최대 1개.
//   5) 타이포 4단 (34 / 17 / 15 / 13). 11pt 미만 글자 금지, 숫자는 monospacedDigit.
//   6) 탭바는 스크롤 시 축소(.tabBarMinimizeBehavior) — 콘텐츠를 가리지 않는다.
//

#if DEBUG
import SwiftUI
import FoundOneDesignSystem

// MARK: - 새 디자인 토큰 (개편안 — 확정 시 DesignSystem 으로 승격)

enum NewDS {
    /// 콘텐츠 배경·글로우는 DesignSystem(BUColor.appBackground / canvasGlow)으로 승격됨.
    /// 카드/리스트 표면 — 불투명 흰색.
    static let surface = Color.white
    /// 흰 배경 위에서 흰 카드가 묻히지 않게 하는 최소 경계.
    static let cardBorder = Color(red: 0x11 / 255, green: 0x13 / 255, blue: 0x1A / 255).opacity(0.07)
    static let ink = Color(red: 0x11 / 255, green: 0x13 / 255, blue: 0x1A / 255)
    static let inkSecondary = Color(red: 0x11 / 255, green: 0x13 / 255, blue: 0x1A / 255).opacity(0.55)
    static let inkTertiary = Color(red: 0x11 / 255, green: 0x13 / 255, blue: 0x1A / 255).opacity(0.35)
    static let separator = Color(red: 0x11 / 255, green: 0x13 / 255, blue: 0x1A / 255).opacity(0.08)
    /// 액센트 — 한 가지. 주요 액션·현재 상태에만.
    static let accent = Color(red: 0x19 / 255, green: 0x19 / 255, blue: 0x70 / 255)
    static let positive = Color(red: 0x1F / 255, green: 0x7A / 255, blue: 0x45 / 255)
    static let warning = Color(red: 0xB8 / 255, green: 0x86 / 255, blue: 0x0B / 255)
    static let danger = Color(red: 0xB6 / 255, green: 0x4C / 255, blue: 0x4C / 255)

    /// 카드 모서리 — 한 값만. 중첩이 없으니 단계가 필요 없다.
    static let radius: CGFloat = 20
    /// 화면 좌우 여백.
    static let margin: CGFloat = 20
    /// 카드 내부 여백.
    static let cardPadding: CGFloat = 18
    /// 섹션 사이 간격 — 관련 없는 것끼리는 넉넉히.
    static let sectionGap: CGFloat = 24
}

/// 배경은 공용 토큰을 쓴다 — 정의가 두 곳에 있으면 갈라진다.
///  (BUCanvasBackground: 흰 바탕 + 상단 글로우, 세기는 BUColor.canvasGlowOpacity)
typealias BackgroundCanvas = BUCanvasBackground

/// 불투명 카드 — 중첩하지 않는다.
private struct Card<Content: View>: View {
    var padding: CGFloat = NewDS.cardPadding
    @ViewBuilder var content: Content
    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(NewDS.surface, in: RoundedRectangle(cornerRadius: NewDS.radius, style: .continuous))
            // 흰 배경 위 흰 카드 — 얇은 경계 + 아주 얕은 그림자로만 띄운다(테두리 겹치기 금지).
            .overlay(
                RoundedRectangle(cornerRadius: NewDS.radius, style: .continuous)
                    .strokeBorder(NewDS.cardBorder, lineWidth: 0.5)
            )
            .shadow(color: NewDS.ink.opacity(0.05), radius: 10, x: 0, y: 3)
    }
}

/// 섹션 제목 — 한국어 한 줄. 영문 eyebrow 병기 없음.
private struct SectionTitle: View {
    let text: String
    var action: String? = nil
    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(text)
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(NewDS.ink)
            Spacer()
            if let action {
                Text(action)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(NewDS.accent)
            }
        }
        .padding(.horizontal, 4)
    }
}

private struct Hairline: View {
    var inset: CGFloat = 0
    var body: some View {
        Rectangle().fill(NewDS.separator).frame(height: 0.5).padding(.leading, inset)
    }
}

// MARK: - 1) 홈 (오늘)

private struct PreviewHome: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: NewDS.sectionGap) {

                // ── 오늘 할 일 하나 — 화면의 주인공. 액션도 하나.
                Card {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("오늘 할 일")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(NewDS.inkSecondary)
                        Text("단골 24명에게 복귀 쿠폰 보내기")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(NewDS.ink)
                            .fixedSize(horizontal: false, vertical: true)
                        Text("최근 2주 신규 고객은 늘었지만 재방문이 제자리입니다. 30일 이상 안 온 단골에게 쿠폰을 보내면 보통 4~5명이 돌아옵니다.")
                            .font(.system(size: 15))
                            .foregroundStyle(NewDS.inkSecondary)
                            .lineSpacing(3)
                            .fixedSize(horizontal: false, vertical: true)
                        Button {} label: {
                            Text("쿠폰 보내기")
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity, minHeight: 50)
                                .background(NewDS.accent, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }

                // ── 어제 매출 — 숫자 하나가 주인공. 칩·배지 없음.
                VStack(alignment: .leading, spacing: 10) {
                    SectionTitle(text: "어제 매출", action: "기록")
                    Card {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack(alignment: .firstTextBaseline, spacing: 8) {
                                Text("1,124,000")
                                    .font(.system(size: 34, weight: .bold))
                                    .monospacedDigit()
                                    .foregroundStyle(NewDS.ink)
                                Text("원")
                                    .font(.system(size: 17, weight: .medium))
                                    .foregroundStyle(NewDS.inkSecondary)
                            }
                            HStack(spacing: 6) {
                                Image(systemName: "arrow.up.right")
                                    .font(.system(size: 12, weight: .bold))
                                Text("7일 평균보다 3.8% 높음")
                                    .font(.system(size: 15))
                            }
                            .foregroundStyle(NewDS.positive)
                        }
                    }
                }

                // ── 이번 주 — 표가 아니라 한 줄씩. 값은 오른쪽 정렬, 숫자는 tabular.
                VStack(alignment: .leading, spacing: 10) {
                    SectionTitle(text: "이번 주")
                    Card(padding: 0) {
                        VStack(spacing: 0) {
                            metricRow("매출", "5,068,000원", note: "6일")
                            Hairline(inset: 18)
                            metricRow("객단가", "12,400원", note: nil)
                            Hairline(inset: 18)
                            metricRow("재료비율", "31%", note: "목표 30%", tint: NewDS.warning)
                        }
                    }
                }

                // ── 알림 — 있을 때만, 최대 2줄.
                VStack(alignment: .leading, spacing: 10) {
                    SectionTitle(text: "챙길 것")
                    Card(padding: 0) {
                        VStack(spacing: 0) {
                            noticeRow(icon: "calendar", title: "부가세 확정신고", detail: "7일 남음 · 1월 25일까지")
                            Hairline(inset: 56)
                            noticeRow(icon: "person.2", title: "김서연 근로계약서", detail: "작성 전 · 입사 3일차")
                        }
                    }
                }

                Color.clear.frame(height: 8)
            }
            .padding(.horizontal, NewDS.margin)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background(BackgroundCanvas())
        .navigationTitle("성심당 본점")
        .navigationBarTitleDisplayMode(.large)
    }

    private func metricRow(_ label: String, _ value: String, note: String?, tint: Color = NewDS.ink) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 17))
                .foregroundStyle(NewDS.ink)
            Spacer()
            if let note {
                Text(note)
                    .font(.system(size: 13))
                    .foregroundStyle(NewDS.inkTertiary)
            }
            Text(value)
                .font(.system(size: 17, weight: .semibold))
                .monospacedDigit()
                .foregroundStyle(tint)
        }
        .padding(.horizontal, 18)
        .frame(minHeight: 52)
    }

    private func noticeRow(icon: String, title: String, detail: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(NewDS.accent)
                .frame(width: 26)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 17)).foregroundStyle(NewDS.ink)
                Text(detail).font(.system(size: 13)).foregroundStyle(NewDS.inkSecondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(NewDS.inkTertiary)
        }
        .padding(.horizontal, 18)
        .frame(minHeight: 60)
    }
}

// MARK: - 2) 로드맵

private struct PreviewRoadmap: View {
    private struct Step: Identifiable {
        let id = UUID()
        let no: Int
        let title: String
        let state: State
        enum State { case done, current, locked }
    }
    private let steps: [Step] = [
        .init(no: 1, title: "업종 선택", state: .done),
        .init(no: 2, title: "창업 형태 선택", state: .done),
        .init(no: 3, title: "인허가 사전 확인", state: .current),
        .init(no: 4, title: "입지 분석", state: .locked),
        .init(no: 5, title: "자금 계획", state: .locked),
        .init(no: 6, title: "임대 계약 검토", state: .locked),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: NewDS.sectionGap) {
                // 지금 단계만 카드로 — 나머지는 목록. 화면의 주인공이 하나다.
                Card {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("3단계 · 진행 중")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(NewDS.accent)
                        Text("인허가 사전 확인")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(NewDS.ink)
                        Text("영업신고 전에 건물·사람·시설 세 가지를 확인합니다. 지금 확인하면 계약 후 발견해서 생기는 손실을 막습니다.")
                            .font(.system(size: 15))
                            .foregroundStyle(NewDS.inkSecondary)
                            .lineSpacing(3)
                            .fixedSize(horizontal: false, vertical: true)
                        Button {} label: {
                            Text("이어서 하기")
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity, minHeight: 50)
                                .background(NewDS.accent, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }

                VStack(alignment: .leading, spacing: 10) {
                    SectionTitle(text: "전체 21단계")
                    Card(padding: 0) {
                        VStack(spacing: 0) {
                            ForEach(Array(steps.enumerated()), id: \.element.id) { idx, step in
                                stepRow(step)
                                if idx < steps.count - 1 { Hairline(inset: 56) }
                            }
                        }
                    }
                }
                Color.clear.frame(height: 8)
            }
            .padding(.horizontal, NewDS.margin)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background(BackgroundCanvas())
        .navigationTitle("로드맵")
        .navigationBarTitleDisplayMode(.large)
    }

    @ViewBuilder
    private func stepRow(_ step: Step) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(step.state == .done ? NewDS.positive.opacity(0.12)
                          : step.state == .current ? NewDS.accent : NewDS.ink.opacity(0.06))
                    .frame(width: 26, height: 26)
                switch step.state {
                case .done:
                    Image(systemName: "checkmark").font(.system(size: 12, weight: .bold)).foregroundStyle(NewDS.positive)
                case .current:
                    Text("\(step.no)").font(.system(size: 13, weight: .bold)).foregroundStyle(.white)
                case .locked:
                    Text("\(step.no)").font(.system(size: 13, weight: .semibold)).foregroundStyle(NewDS.inkTertiary)
                }
            }
            .frame(width: 26)

            Text(step.title)
                .font(.system(size: 17, weight: step.state == .current ? .semibold : .regular))
                .foregroundStyle(step.state == .locked ? NewDS.inkTertiary : NewDS.ink)
            Spacer()
            if step.state == .current {
                Text("진행 중")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(NewDS.accent)
            }
            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(NewDS.inkTertiary)
        }
        .padding(.horizontal, 18)
        .frame(minHeight: 56)
    }
}

// MARK: - 3) 내 정보 (설정형 리스트)

private struct PreviewProfile: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: NewDS.sectionGap) {
                // 계정 — 아바타 + 이름. 카드 안 카드 없음.
                Card {
                    HStack(spacing: 14) {
                        Circle()
                            .fill(NewDS.accent.opacity(0.1))
                            .frame(width: 56, height: 56)
                            .overlay(Text("김").font(.system(size: 22, weight: .bold)).foregroundStyle(NewDS.accent))
                        VStack(alignment: .leading, spacing: 3) {
                            Text("김사장").font(.system(size: 20, weight: .semibold)).foregroundStyle(NewDS.ink)
                            Text("성심당 본점 · 운영 248일째").font(.system(size: 15)).foregroundStyle(NewDS.inkSecondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold)).foregroundStyle(NewDS.inkTertiary)
                    }
                }

                VStack(alignment: .leading, spacing: 10) {
                    SectionTitle(text: "가게")
                    Card(padding: 0) {
                        VStack(spacing: 0) {
                            settingRow("가게 정보", value: "외식 · 대전 중구")
                            Hairline(inset: 18)
                            settingRow("영업 시간", value: "09:00 – 21:00")
                            Hairline(inset: 18)
                            settingRow("사업자 정보", value: "확인 완료", tint: NewDS.positive)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 10) {
                    SectionTitle(text: "앱")
                    Card(padding: 0) {
                        VStack(spacing: 0) {
                            settingRow("알림", value: "켜짐")
                            Hairline(inset: 18)
                            settingRow("언어", value: "한국어")
                            Hairline(inset: 18)
                            settingRow("버전", value: "1.4.0", chevron: false)
                        }
                    }
                }
                Color.clear.frame(height: 8)
            }
            .padding(.horizontal, NewDS.margin)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background(BackgroundCanvas())
        .navigationTitle("내 정보")
        .navigationBarTitleDisplayMode(.large)
    }

    private func settingRow(_ label: String, value: String, tint: Color = NewDS.inkSecondary, chevron: Bool = true) -> some View {
        HStack {
            Text(label).font(.system(size: 17)).foregroundStyle(NewDS.ink)
            Spacer()
            Text(value).font(.system(size: 17)).foregroundStyle(tint)
            if chevron {
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(NewDS.inkTertiary)
                    .padding(.leading, 2)
            }
        }
        .padding(.horizontal, 18)
        .frame(minHeight: 52)
    }
}

// MARK: - 미리보기 셸 (탭바 = 유일한 유리 레이어)

/// iOS 26+ 에서만 탭바 축소 동작을 켠다.
private struct MinimizeTabBarOnScroll: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 26.0, *) {
            content.tabBarMinimizeBehavior(.onScrollDown)
        } else {
            content
        }
    }
}

public struct DesignPreviewView: View {
    @State private var tab = 0

    public init() {}

    public var body: some View {
        TabView(selection: $tab) {
            Tab("홈", systemImage: "house.fill", value: 0) {
                NavigationStack { PreviewHome() }
            }
            Tab("로드맵", systemImage: "map.fill", value: 1) {
                NavigationStack { PreviewRoadmap() }
            }
            Tab("내 정보", systemImage: "person.crop.circle.fill", value: 2) {
                NavigationStack { PreviewProfile() }
            }
        }
        .tint(NewDS.accent)
        // iOS 26: 스크롤하면 탭바가 접혀 콘텐츠를 가리지 않는다 (현재 앱은 110pt 스페이서로 회피 중).
        //   앱 최소 지원 버전이 26 미만이라 availability 로 감싼다 — 구버전은 기존 탭바 그대로.
        .modifier(MinimizeTabBarOnScroll())
        .onAppear {
            if let t = ProcessInfo.processInfo.environment["BU_DEMO_DESIGN"] {
                tab = t == "roadmap" ? 1 : t == "profile" ? 2 : 0
            }
        }
    }
}
#endif

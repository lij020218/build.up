//
//  StartupFoundationStageView.swift — 스타트업 기초 (iOS 네이티브)
//
//  stageId: "startup-foundation"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct StartupFoundationStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("sf.problem")   private var problem   = ""
    @AppStorage("sf.targetUser") private var targetUser = ""
    @AppStorage("sf.corpType")  private var corpType  = ""
    @AppStorage("sf.done")      private var done      = false

    private let pages = ["왜 중요한가", "문제 정의", "창업팀 정렬"]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 0) {
                            ForEach(pages.indices, id: \.self) { i in
                                Button {
                                    withAnimation(.easeInOut(duration: 0.2)) { page = i }
                                } label: {
                                    Text(pages[i])
                                        .font(BUFont.bodySmall.weight(page == i ? .semibold : .regular))
                                        .foregroundStyle(page == i ? BUColor.midnight : BUColor.inkMuted)
                                        .padding(.horizontal, BUSpacing.md)
                                        .padding(.vertical, BUSpacing.sm)
                                        .background(page == i ? BUColor.midnight.opacity(0.08) : Color.clear, in: Capsule())
                                }
                            }
                        }
                        .padding(.horizontal, BUSpacing.sm)
                    }
                    .padding(.vertical, BUSpacing.xs)

                    ScrollView {
                        VStack(alignment: .leading, spacing: BUSpacing.lg) {
                            Group {
                                switch page {
                                case 0: whyPage
                                case 1: problemPage
                                default: teamPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("스타트업 기초")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - pg 0 왜 중요한가

    private var whyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("스타트업 기초")
                    Text("스타트업 실패의 42%는\n시장이 없는 문제를 풀었기 때문")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("팀·문제·시장 세 가지가 먼저")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("기초 구축 3요소")
                    let items: [(String, String, String)] = [
                        ("lightbulb", "문제 명확화", "\"우리는 X라는 문제를 Y가 겪는 걸 봤다\" — 한 문장으로 완성"),
                        ("person.2", "팀 정렬", "공동창업자 역할·지분·풀타임 여부를 첫 주에 명문화"),
                        ("building.2", "법인 형태", "개인사업자 vs 법인 — 투자 받을 계획이면 법인 필수"),
                    ]
                    ForEach(items, id: \.0) { icon, title, detail in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.08))
                                    .frame(width: 32, height: 32)
                                Image(systemName: icon)
                                    .font(.system(size: 14)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 문제 정의

    private var problemPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("문제 정의 캔버스")
                    VStack(alignment: .leading, spacing: 4) {
                        Text("핵심 문제").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                        TextField("\"X는 Y할 때 Z 때문에 어려움을 겪는다\"", text: $problem, axis: .vertical)
                            .font(BUFont.bodySmall)
                            .lineLimit(4)
                            .padding(.horizontal, 10).padding(.vertical, 10)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("타깃 사용자").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                        TextField("직업·연령·상황 구체적으로", text: $targetUser)
                            .font(BUFont.bodySmall)
                            .padding(.horizontal, 10).padding(.vertical, 10)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("좋은 문제의 4가지 기준")
                    let criteria = [
                        "빈도 높음 — 매일 혹은 매주 발생하는 문제",
                        "고통 심함 — 현재 해결책이 너무 불편하거나 비쌈",
                        "시장 있음 — 이 문제를 가진 사람이 100만 명 이상",
                        "우리만의 강점 — 왜 우리 팀이 이 문제를 풀기 적합한가",
                    ]
                    ForEach(criteria, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(BUColor.midnight).frame(width: 4, height: 4).padding(.top, 5)
                            Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 2 창업팀 정렬

    private var teamPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("법인 형태 선택")
                    let options: [(String, String, String)] = [
                        ("individual", "개인사업자", "빠른 시작·저비용. 투자 유치 불리. 초기 MVP 검증 단계에 적합."),
                        ("corp", "법인 설립", "투자 유치 가능. 세금 구조 복잡. 팀 2명 이상 + 투자 계획 있으면 권장."),
                        ("undecided", "아직 미결정", "고객 인터뷰 후 결정. 인터뷰 10건 이전이면 서두를 필요 없음."),
                    ]
                    ForEach(options, id: \.0) { id, title, desc in
                        let isSelected = corpType == id
                        Button {
                            corpType = isSelected ? "" : id
                        } label: {
                            HStack(alignment: .top, spacing: BUSpacing.sm) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(title).font(BUFont.bodySmall.weight(.semibold))
                                        .foregroundStyle(isSelected ? BUColor.midnightDeep : BUColor.ink)
                                    Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                        .multilineTextAlignment(.leading)
                                }
                                Spacer()
                                if isSelected {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 16)).foregroundStyle(BUColor.midnight)
                                }
                            }
                            .padding(BUSpacing.sm)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(isSelected ? BUColor.midnight.opacity(0.08) : BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                                    .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 1.5)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange).font(.system(size: 13))
                        Text("공동창업자가 있다면 — 첫 주에 결정할 것들")
                            .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    }
                    let warnings = [
                        "역할 분담 (CEO·CTO·COO) — 모호하면 1년 내 분쟁",
                        "지분 비율 — Vesting 4년 + 1년 cliff 구조 권장",
                        "풀타임 전환 시점 — 언제 회사에 전념할 것인가",
                    ]
                    ForEach(warnings, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(Color.orange).frame(width: 4, height: 4).padding(.top, 5)
                            Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("스타트업 기초 정렬 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("StartupFoundation") { StartupFoundationStageView() }
#endif

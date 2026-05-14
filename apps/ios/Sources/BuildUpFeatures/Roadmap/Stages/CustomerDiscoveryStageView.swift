//
//  CustomerDiscoveryStageView.swift — 고객 발굴 (iOS 네이티브)
//
//  stageId: "customer-discovery"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct CustomerDiscoveryStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("cd.interviewCount") private var interviewCount = 0
    @AppStorage("cd.painPattern")    private var painPattern    = ""
    @AppStorage("cd.wedgeProblem")   private var wedgeProblem   = ""
    @AppStorage("cd.done")           private var done           = false

    private let pages = ["인터뷰 가이드", "인터뷰 기록", "인사이트 정리"]

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
                                case 0: guidePage
                                case 1: recordPage
                                default: insightPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("고객 발굴")
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

    // MARK: - pg 0 인터뷰 가이드

    private var guidePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("고객 발굴")
                    Text("10번의 인터뷰가\n6개월의 개발을 구한다")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("만들기 전에 먼저 대화하세요")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("인터뷰 황금 5문항")
                    let questions: [(Int, String)] = [
                        (1, "지금 이 문제를 어떻게 해결하고 있나요? (현재 행동)"),
                        (2, "마지막으로 이 문제를 경험한 게 언제였나요? (빈도)"),
                        (3, "그때 얼마나 불편하셨나요? 1-10점으로 표현하면? (강도)"),
                        (4, "이 문제가 해결되면 어떤 점이 가장 달라질까요? (가치)"),
                        (5, "지금 쓰는 해결책의 가장 큰 불만은? (경쟁 약점)"),
                    ]
                    ForEach(questions, id: \.0) { num, q in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                                Text("\(num)").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                            }
                            Text(q).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange).font(.system(size: 13))
                        Text("하지 말아야 할 것").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(.orange)
                    }
                    let donts = [
                        "제품 피칭 — 인터뷰가 아니라 영업이 됨",
                        "\"이런 기능 쓰실 건가요?\" 가정 질문 — 답이 항상 Yes",
                        "친한 지인만 인터뷰 — 편향된 피드백",
                    ]
                    ForEach(donts, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(Color.orange).frame(width: 4, height: 4).padding(.top, 5)
                            Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 인터뷰 기록

    private var recordPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("인터뷰 진행 현황")
                    HStack(spacing: BUSpacing.md) {
                        Button {
                            if interviewCount > 0 { interviewCount -= 1 }
                        } label: {
                            Image(systemName: "minus.circle.fill")
                                .font(.system(size: 28)).foregroundStyle(BUColor.inkMuted)
                        }
                        .buttonStyle(.plain)
                        VStack(spacing: 2) {
                            Text("\(interviewCount)")
                                .font(.system(size: 36, weight: .bold)).foregroundStyle(BUColor.midnight).monospacedDigit()
                            Text("건 완료").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                        }
                        Button {
                            if interviewCount < 50 { interviewCount += 1 }
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 28)).foregroundStyle(BUColor.midnight)
                        }
                        .buttonStyle(.plain)
                    }
                    .frame(maxWidth: .infinity)

                    ProgressView(value: Double(min(interviewCount, 10)), total: 10)
                        .tint(BUColor.midnight)
                        .padding(.top, BUSpacing.xs)

                    let statusText: String = {
                        if interviewCount < 5 { return "시작 단계 — 계속 진행하세요" }
                        if interviewCount < 10 { return "절반 완료 — 다양한 페르소나 시도" }
                        return "충분한 데이터 확보"
                    }()
                    Text(statusText).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                    Text("목표: 10건").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("페인 패턴 메모")
                    TextField("반복 등장한 고통 패턴", text: $painPattern, axis: .vertical)
                        .font(BUFont.bodySmall)
                        .lineLimit(4)
                        .padding(.horizontal, 10).padding(.vertical, 10)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        }
    }

    // MARK: - pg 2 인사이트 정리

    private var insightPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("핵심 문제 (Wedge Problem)")
                    TextField("가장 많이 등장한 페인 포인트 한 문장", text: $wedgeProblem)
                        .font(BUFont.bodySmall)
                        .padding(.horizontal, 10).padding(.vertical, 10)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    HStack(spacing: 6) {
                        Image(systemName: "info.circle").font(.system(size: 12)).foregroundStyle(BUColor.midnight)
                        Text("Wedge Problem = 가장 고통스럽고, 빈번하고, 우리가 해결할 수 있는 교차점")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                    .padding(.top, BUSpacing.xs)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("고객 발굴 완료 기준")
                    let criteria = [
                        "10명 이상 인터뷰 완료",
                        "3번 이상 반복 등장한 페인 패턴 식별",
                        "타깃 고객 페르소나 1명 구체화",
                        "핵심 문제 한 문장으로 정의",
                    ]
                    ForEach(criteria, id: \.self) { item in
                        HStack(spacing: BUSpacing.sm) {
                            Image(systemName: "checkmark.circle")
                                .font(.system(size: 14)).foregroundStyle(BUColor.inkSubtle)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("고객 발굴 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("CustomerDiscovery") { CustomerDiscoveryStageView() }
#endif

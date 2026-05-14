//
//  MvpBuildStageView.swift — MVP 개발 (iOS 네이티브)
//
//  stageId: "mvp-build"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct MvpBuildStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("mvp.coreFlow")  private var coreFlow  = ""
    @AppStorage("mvp.techPath")  private var techPath  = ""
    @AppStorage("mvp.shipped")   private var shipped   = false
    @AppStorage("mvp.ipFiled")   private var ipFiled   = false
    @AppStorage("mvp.done")      private var done      = false

    private let pages = ["핵심 워크플로우", "MVP 개발", "기술 경로 선택"]

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
                                case 0: workflowPage
                                case 1: buildPage
                                default: techPathPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("MVP 개발")
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

    // MARK: - pg 0 핵심 워크플로우

    private var workflowPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("MVP 개발")
                    Text("MVP = 가장 작은 제품으로\n가장 큰 가정을 검증")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("6주 안에 실제 사용자에게 전달하는 것이 목표")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("핵심 워크플로우 정의")
                    TextField("사용자가 제품으로 완수하는 핵심 행동 3단계를 서술 (예: 영수증 사진 → 자동 분류 → 리포트 확인)", text: $coreFlow, axis: .vertical)
                        .font(BUFont.bodySmall)
                        .lineLimit(4)
                        .padding(.horizontal, 10).padding(.vertical, 10)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("MVP 범위 결정 — 버릴 것 먼저")
                    let cuts = [
                        "어드민 페이지 — MVP 단계에서는 구글 스프레드시트로 대체",
                        "알림·이메일 — 수동으로 대체 가능하면 나중에",
                        "다국어·다크모드 — 첫 100 사용자에겐 불필요",
                        "소셜 로그인 — 이메일 로그인으로 충분",
                    ]
                    ForEach(cuts, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "xmark.circle").font(.system(size: 13)).foregroundStyle(BUColor.inkMuted)
                            Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 MVP 개발

    private var buildPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("MVP 6주 로드맵")
                    let weeks: [(String, String)] = [
                        ("W1", "기술 스택 선정·환경 셋업"),
                        ("W2-3", "핵심 기능 개발"),
                        ("W4", "내부 테스트·버그 수정"),
                        ("W5", "베타 사용자 5명 온보딩"),
                        ("W6", "피드백 반영·v1 배포"),
                    ]
                    ForEach(weeks, id: \.0) { week, task in
                        HStack(spacing: BUSpacing.sm) {
                            Text(week)
                                .font(BUFont.eyebrow.weight(.bold))
                                .foregroundStyle(BUColor.midnight)
                                .frame(width: 36, alignment: .leading)
                            Text(task).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $shipped) {
                        Text("MVP 실제 사용자에게 배포 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $ipFiled) {
                        Text("핵심 기술 IP 출원 완료 (또는 해당 없음)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("추천 기술 스택 (SaaS 기준)")
                    let stack: [(String, String)] = [
                        ("Frontend", "Next.js / React Native"),
                        ("Backend", "Supabase / Firebase (빠른 MVP)"),
                        ("결제", "Toss Payments / Stripe"),
                        ("모니터링", "Sentry + PostHog"),
                    ]
                    ForEach(stack, id: \.0) { label, value in
                        HStack(spacing: BUSpacing.sm) {
                            Text(label)
                                .font(BUFont.eyebrow)
                                .foregroundStyle(BUColor.inkMuted)
                                .frame(width: 64, alignment: .leading)
                            Text(value).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 2 기술 경로 선택

    private var techPathPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                Text("MVP 이후 어떤 기술 경로로 진행하나요? 선택에 따라 다음 단계가 달라집니다.")
                    .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
            }

            let options: [(String, String, String, String)] = [
                ("saas", "SaaS·소프트웨어", "app.badge", "웹·앱 기반 서비스. 즉시 배포·반복 가능. 다음: GTM 론칭"),
                ("hardware", "하드웨어·IoT", "cpu", "실물 제품. EVT→DVT→PVT 프로토타입 단계 필요. 개발 기간 2-3배"),
                ("lab", "로봇·바이오", "flask", "연구소 기반. 현장 테스트·임상시험·규제 허가 필요. 5-10년 경로"),
                ("semi", "반도체·클린테크", "waveform.path.ecg", "EDA 설계·테이프아웃 필요. 초기 비용 수억~수십억. 전문 파운드리 파트너 필수"),
            ]

            ForEach(options, id: \.0) { id, title, icon, desc in
                let isSelected = techPath == id
                Button {
                    techPath = isSelected ? "" : id
                } label: {
                    HStack(alignment: .top, spacing: BUSpacing.sm) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(isSelected ? BUColor.midnight.opacity(0.12) : BUColor.midnight.opacity(0.06))
                                .frame(width: 40, height: 40)
                            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(BUColor.midnight)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text(title).font(BUFont.bodySmall.weight(.bold))
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
                    .padding(BUSpacing.md)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(isSelected ? BUColor.midnight.opacity(0.06) : BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                            .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 1.5)
                    )
                }
                .buttonStyle(.plain)
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("MVP 개발 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("MvpBuild") { MvpBuildStageView() }
#endif

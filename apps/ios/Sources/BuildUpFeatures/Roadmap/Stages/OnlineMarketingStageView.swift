//
//  OnlineMarketingStageView.swift — SEO·광고·리뷰 전략 (iOS 네이티브)
//
//  stageId: "online-marketing"
//
//  3-page (segmented): SEO 최적화 / 광고 전략 / 리뷰 관리
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct OnlineMarketingStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("om.seoKeywords")   private var seoKeywords   = ""
    @AppStorage("om.adBudgetText")  private var adBudgetText  = ""
    @AppStorage("om.adChannel")     private var adChannel     = ""
    @AppStorage("om.reviewTarget")  private var reviewTarget  = ""
    @AppStorage("om.done")          private var done          = false

    private let pages = ["SEO 최적화", "광고 전략", "리뷰 관리"]

    private struct AdOption {
        let id: String; let name: String; let desc: String
    }

    private let adOptions: [AdOption] = [
        AdOption(id: "naver", name: "네이버 쇼핑 광고", desc: "CPC 클릭당 30-300원. 구매 의도 높은 트래픽. 초기 추천."),
        AdOption(id: "kakao", name: "카카오 모먼트",    desc: "디스플레이 광고. 브랜드 인지도. CPC 100-500원."),
        AdOption(id: "meta",  name: "Meta (인스타·페이스북)", desc: "비주얼 상품에 효과적. 리타겟팅 강력. CPM 방식."),
        AdOption(id: "none",  name: "광고 없이 시작",   desc: "SEO·SNS 무료 채널로만. 성장 느리지만 비용 없음."),
    ]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
                    Picker("페이지", selection: $page) {
                        ForEach(pages.indices, id: \.self) { i in
                            Text(pages[i]).tag(i)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(BUSpacing.md)

                    ScrollView {
                        VStack(alignment: .leading, spacing: BUSpacing.lg) {
                            Group {
                                switch page {
                                case 0: seoPage
                                case 1: adPage
                                default: reviewPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)

                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("SEO·광고·리뷰 전략")
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

    // MARK: - Page 0: SEO 최적화

    private var seoPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("SEO 최적화")
                    Text("온라인 커머스 매출의 60%는 검색에서 온다")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(BUColor.midnightDeep)
                        .tracking(-0.3)
                        .lineSpacing(4)
                    Text("네이버 쇼핑 SEO = 상품명·카테고리·리뷰 수·판매량의 함수")
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("네이버 쇼핑 SEO 핵심")
                    infoRow(text: "키워드 배치: 상품명 앞 30글자에 핵심 키워드 포함")
                    infoRow(text: "카테고리 정확도: 잘못된 카테고리 = 검색 제외")
                    infoRow(text: "판매량·리뷰수: 초기에 낮으면 하위 노출 — 유료 광고로 초기 트래픽 확보")
                    infoRow(text: "배송 점수: 빠른 처리로 '빠른 배송' 배지 확보")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("키워드 메모")
                    TextField("타깃 키워드를 쉼표로 구분하여 입력 (예: 남성청바지, 슬림핏청바지)", text: $seoKeywords, axis: .vertical)
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.ink)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 9)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .lineLimit(3...6)
                }
            }
        }
    }

    // MARK: - Page 1: 광고 전략

    private var adPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("광고 예산 계획")
                    HStack(spacing: BUSpacing.sm) {
                        TextField("월 광고 예산", text: $adBudgetText)
                            .font(BUFont.bodySmall)
                            .foregroundStyle(BUColor.ink)
                            .keyboardType(.numberPad)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 9)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        Text("만원")
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.inkSecondary)
                    }
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "lightbulb.fill")
                            .font(.system(size: 13))
                            .foregroundStyle(BUColor.midnight)
                        Text("권장 초기 예산: 월 30-50만원. ROAS(광고비 대비 매출) 목표: 300% 이상.")
                            .font(BUFont.bodyCaption)
                            .foregroundStyle(BUColor.inkSecondary)
                            .lineSpacing(2)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("광고 채널 선택")
                    VStack(spacing: BUSpacing.xs) {
                        ForEach(adOptions, id: \.id) { opt in
                            adButton(opt)
                        }
                    }
                }
            }
        }
    }

    private func adButton(_ opt: AdOption) -> some View {
        let isSelected = adChannel == opt.id
        return Button { adChannel = opt.id } label: {
            HStack(spacing: BUSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08))
                        .frame(width: 26, height: 26)
                    Image(systemName: isSelected ? "checkmark" : "megaphone")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(isSelected ? .white : BUColor.inkMuted)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(opt.name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    Text(opt.desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
                Spacer()
            }
            .padding(BUSpacing.sm)
            .background(isSelected ? BUColor.midnight.opacity(0.05) : Color.clear, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous).strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 1.5))
        }
        .buttonStyle(.plain)
    }

    // MARK: - Page 2: 리뷰 관리

    private var reviewPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("리뷰가 온라인 커머스의 생존을 결정")
                    infoRow(text: "스마트스토어 알고리즘: 리뷰 10개 이상이 첫 번째 노출 임계값")
                    infoRow(text: "구매 전환율: 리뷰 10개 → 20개 구간에서 전환율 2배 상승")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("리뷰 목표 설정")
                    HStack(spacing: BUSpacing.sm) {
                        Text("첫 달 목표 리뷰 수")
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.ink)
                        Spacer()
                        TextField("예) 20", text: $reviewTarget)
                            .font(BUFont.bodySmall)
                            .foregroundStyle(BUColor.ink)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 7)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("리뷰 빠르게 확보하는 방법")
                    infoRow(text: "구매 후 리뷰 요청 문자 자동 발송 (스마트스토어 기본 제공)")
                    infoRow(text: "구매자에게 소정의 리뷰 포인트 제공 (스마트스토어 내 설정)")
                    infoRow(text: "지인 구매 → 리뷰 요청 (첫 10개를 채우는 가장 빠른 방법)")
                    infoRow(text: "네이버 리뷰: 4.5점 이하면 즉시 원인 파악·CS 대응")
                }
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("SEO·광고·리뷰 전략 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        }
    }

    // MARK: - Helpers

    private func infoRow(text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text("•").font(BUFont.bodyCaption).foregroundStyle(BUColor.midnight).padding(.top, 2)
            Text(text).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
        }
    }
}

#if DEBUG
#Preview("OnlineMarketing") { OnlineMarketingStageView() }
#endif

//
//  StoreSetupStageView.swift — 스토어 셋업 (iOS 네이티브)
//
//  stageId: "store-setup"
//
//  2-page (segmented): 스토어 설정 / 배송·결제
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct StoreSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("sto.storeFront")     private var storeFront     = false
    @AppStorage("sto.productListed")  private var productListed  = false
    @AppStorage("sto.shippingPolicy") private var shippingPolicy = false
    @AppStorage("sto.pgLive")         private var pgLive         = false
    @AppStorage("sto.done")           private var done           = false

    private let pages = ["스토어 설정", "배송·결제"]

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
                                case 0: storeConfigPage
                                default: shippingPaymentPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)

                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("스토어 셋업")
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

    // MARK: - Page 0: 스토어 설정

    private var storeConfigPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("스토어 설정")
                    Text("스토어 첫 인상이 구매 전환율을 결정합니다")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(BUColor.midnightDeep)
                        .tracking(-0.3)
                        .lineSpacing(4)
                    Text("스마트스토어 기준: 평균 전환율 2-5%. 사진·설명·리뷰가 핵심.")
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(spacing: 0) {
                    BUEyebrow("스마트스토어 셋업 순서")
                        .padding(.bottom, BUSpacing.sm)
                    stepRow(num: 1, title: "스마트스토어 판매자 가입 (sell.smartstore.naver.com)", isLast: false)
                    stepRow(num: 2, title: "스토어명·대표 카테고리·로고 설정", isLast: false)
                    stepRow(num: 3, title: "사업자 정보 연동", isLast: false)
                    stepRow(num: 4, title: "상품 등록 (최소 10개 이상 권장)", isLast: false)
                    stepRow(num: 5, title: "스토어 오픈 (검수 1-3일)", isLast: true)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("스토어 SEO 최적화")
                    infoRow(text: "상품명: 검색 키워드 앞에 배치 (예: '남성 슬림핏 청바지 스트레치')")
                    infoRow(text: "태그: 10개 풀 활용")
                    infoRow(text: "카테고리: 정확한 3단계 카테고리 선택")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    Toggle(isOn: $storeFront) {
                        Text("스토어 기본 설정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)

                    Divider()

                    Toggle(isOn: $productListed) {
                        Text("상품 등록 완료 (최소 10개)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)
                }
            }
        }
    }

    // MARK: - Page 1: 배송·결제

    private var shippingPaymentPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("배송 정책 설정")
                    infoRow(text: "배송비 기준: 3만원 이상 무료 or 3000원 고정")
                    infoRow(text: "택배사 계약: CJ대한통운·롯데택배 (소규모: 선불택배 가능)")
                    infoRow(text: "발송 처리 기한: 영업일 기준 2일 이내 (지연 시 구매 취소)")
                    infoRow(text: "반품/교환 정책: 7일 이내 무조건 수락 (전자상거래법)")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("결제 게이트웨이")
                    labeledRow(label: "스마트스토어", text: "네이버페이 기본 포함")
                    labeledRow(label: "자체몰",       text: "토스페이먼츠·KG이니시스·NICE페이 중 선택")
                    infoRow(text: "결제 실거래 테스트 필수 (1원 결제 후 환불)")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    Toggle(isOn: $shippingPolicy) {
                        Text("배송 정책 설정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)

                    Divider()

                    Toggle(isOn: $pgLive) {
                        Text("결제 실거래 테스트 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("스토어 셋업 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        }
    }

    // MARK: - Helpers

    private func stepRow(num: Int, title: String, isLast: Bool) -> some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                ZStack {
                    Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                    Text("\(num)").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                }
                Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                Spacer()
            }
            .padding(.horizontal, BUSpacing.md).padding(.vertical, 12)
            if !isLast {
                Divider().padding(.leading, 52)
            }
        }
    }

    private func infoRow(text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text("•").font(BUFont.bodyCaption).foregroundStyle(BUColor.midnight).padding(.top, 2)
            Text(text).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
        }
    }

    private func labeledRow(label: String, text: String) -> some View {
        HStack(alignment: .top, spacing: BUSpacing.sm) {
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                .fixedSize()
            Text(text).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
        }
    }
}

#if DEBUG
#Preview("StoreSetup") { StoreSetupStageView() }
#endif

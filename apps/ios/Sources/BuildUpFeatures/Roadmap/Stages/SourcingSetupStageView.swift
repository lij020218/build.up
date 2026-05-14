//
//  SourcingSetupStageView.swift — 소싱·상품 준비 (iOS 네이티브)
//
//  stageId: "sourcing-setup"
//
//  2-page (segmented): 소싱 전략 / 상품 준비
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct SourcingSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("src.sourcingType")    private var sourcingType    = ""
    @AppStorage("src.supplierLocked")  private var supplierLocked  = false
    @AppStorage("src.photosDone")      private var photosDone      = false
    @AppStorage("src.pricingDone")     private var pricingDone     = false
    @AppStorage("src.done")            private var done            = false

    private let pages = ["소싱 전략", "상품 준비"]

    private struct SourcingOption {
        let id: String; let name: String; let desc: String
    }

    private let sourcingOptions: [SourcingOption] = [
        SourcingOption(id: "domestic", name: "국내 도매 소싱",         desc: "1688.com·동대문·가락시장·오카도. 리드타임 짧음. 단가 높음."),
        SourcingOption(id: "import",   name: "중국 직수입",             desc: "알리바바·1688. 단가 낮음. 리드타임 4-8주. MOQ 주의."),
        SourcingOption(id: "own",      name: "자체 제작 (OEM/ODM)",     desc: "브랜드 독점성. 초기 비용 높음. 재고 리스크."),
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
                                case 0: sourcingPage
                                default: productPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)

                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("소싱·상품 준비")
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

    // MARK: - Page 0: 소싱 전략

    private var sourcingPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("소싱 전략")
                    Text("소싱 = 온라인 커머스의 원가 구조 — 마진을 결정하는 가장 중요한 결정")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(BUColor.midnightDeep)
                        .tracking(-0.3)
                        .lineSpacing(4)
                    Text("목표 원가율: 소비자가의 30-40% 이하")
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("소싱 유형 선택")
                    VStack(spacing: BUSpacing.xs) {
                        ForEach(sourcingOptions, id: \.id) { opt in
                            sourcingButton(opt)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("공급사 평가 기준")
                    infoRow(text: "견적 3곳 이상 비교")
                    infoRow(text: "샘플 주문 후 품질 확인")
                    infoRow(text: "MOQ(최소 주문 수량)·리드타임·결제 조건 협상")
                    infoRow(text: "공급사 다변화 (단일 소싱 리스크 방지)")
                }
            }
        }
    }

    private func sourcingButton(_ opt: SourcingOption) -> some View {
        let isSelected = sourcingType == opt.id
        return Button { sourcingType = opt.id } label: {
            HStack(spacing: BUSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08))
                        .frame(width: 26, height: 26)
                    Image(systemName: isSelected ? "checkmark" : "shippingbox")
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

    // MARK: - Page 1: 상품 준비

    private var productPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("상품 사진·설명 제작")
                    labeledRow(label: "메인 사진",   text: "흰 배경·고해상도 (1000×1000px 이상). 스마트스토어 SEO의 핵심.")
                    labeledRow(label: "상세 페이지", text: "모바일 최적화. 상품 특징·사용법·실사 착용 컷 필수.")
                    infoRow(text: "전문 스튜디오 vs 자체 촬영: 초기엔 스마트폰+흰 배경지로 충분")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("가격 책정 공식")
                    formulaRow(formula: "원가 × 3 = 최소 소비자가 (원가율 33%)")
                    infoRow(text: "경쟁사 가격 ±10% 내 포지셔닝")
                    infoRow(text: "무료 배송 기준가 설정 (4만원 이상 무료배송이 전환율↑)")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    Toggle(isOn: $supplierLocked) {
                        Text("공급사 계약 완료 (최소 2곳)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)

                    Divider()

                    Toggle(isOn: $photosDone) {
                        Text("상품 사진·상세 페이지 제작 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)

                    Divider()

                    Toggle(isOn: $pricingDone) {
                        Text("가격 책정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("소싱·상품 준비 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
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

    private func formulaRow(formula: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "equal.circle.fill")
                .font(.system(size: 14))
                .foregroundStyle(BUColor.midnight)
            Text(formula).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
        }
    }
}

#if DEBUG
#Preview("SourcingSetup") { SourcingSetupStageView() }
#endif

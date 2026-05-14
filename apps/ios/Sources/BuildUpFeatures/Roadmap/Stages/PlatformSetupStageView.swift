//
//  PlatformSetupStageView.swift — 판매 플랫폼 선택 (iOS 네이티브)
//
//  stageId: "platform-setup"
//
//  2-page (segmented): 플랫폼 선택 / 셋업 체크리스트
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct PlatformSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("ps.platform")     private var platform     = ""
    @AppStorage("ps.businessReg")  private var businessReg  = false
    @AppStorage("ps.telecomSale")  private var telecomSale  = false
    @AppStorage("ps.pgConnected")  private var pgConnected  = false
    @AppStorage("ps.done")         private var done         = false

    private let pages = ["플랫폼 선택", "셋업 체크리스트"]

    private struct PlatformOption {
        let id: String; let name: String; let desc: String
    }

    private let platforms: [PlatformOption] = [
        PlatformOption(id: "smartstore", name: "네이버 스마트스토어", desc: "수수료 5.6%. 네이버 검색 연동 강점. 국내 1위 트래픽."),
        PlatformOption(id: "coupang",    name: "쿠팡",               desc: "로켓배송 입점 시 판매 급증. 단, 입점 심사 필요. 수수료 10-15%."),
        PlatformOption(id: "own",        name: "자체 쇼핑몰",         desc: "Shopify·카페24. 브랜드 구축에 유리. 트래픽은 직접 확보해야."),
        PlatformOption(id: "multi",      name: "멀티채널",             desc: "스마트스토어+쿠팡 동시 운영. 관리 부담은 증가."),
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
                                case 0: platformPage
                                default: checklistPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)

                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("판매 플랫폼 선택")
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

    // MARK: - Page 0: 플랫폼 선택

    private var platformPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("플랫폼 선택")
                    Text("플랫폼 선택이 수수료·물류·고객 구조를 결정합니다")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(BUColor.midnightDeep)
                        .tracking(-0.3)
                        .lineSpacing(4)
                    Text("첫 채널 하나에 집중 — 분산은 고객 100명 이후")
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("주요 플랫폼 비교")
                    VStack(spacing: BUSpacing.xs) {
                        ForEach(platforms, id: \.id) { opt in
                            platformButton(opt)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("플랫폼별 수수료 비교")
                    feeRow(platform: "스마트스토어", fee: "결제수수료 3.74% + 네이버페이 수수료 = 약 5.6%")
                    feeRow(platform: "쿠팡 마켓플레이스", fee: "카테고리별 8-15%")
                    feeRow(platform: "자체 쇼핑몰 (카페24)", fee: "월 사용료 0-7만원 + PG 수수료 3%")
                }
            }
        }
    }

    private func platformButton(_ opt: PlatformOption) -> some View {
        let isSelected = platform == opt.id
        return Button { platform = opt.id } label: {
            HStack(spacing: BUSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08))
                        .frame(width: 28, height: 28)
                    Image(systemName: isSelected ? "checkmark" : "storefront")
                        .font(.system(size: 12, weight: .semibold))
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

    private func feeRow(platform: String, fee: String) -> some View {
        HStack(alignment: .top, spacing: BUSpacing.sm) {
            Text(platform)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                .fixedSize(horizontal: false, vertical: true)
            Text(fee)
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
        }
    }

    // MARK: - Page 1: 셋업 체크리스트

    private var checklistPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("온라인 커머스 필수 셋업")
                    Toggle(isOn: $businessReg) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("사업자등록 완료 (통신판매업 신고용)")
                                .font(BUFont.bodySmall.weight(.semibold))
                                .foregroundStyle(BUColor.ink)
                        }
                    }
                    .tint(BUColor.midnight)

                    Divider()

                    Toggle(isOn: $telecomSale) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("통신판매업 신고 완료 (공정위, 법인 설립 후 14일 이내)")
                                .font(BUFont.bodySmall.weight(.semibold))
                                .foregroundStyle(BUColor.ink)
                        }
                    }
                    .tint(BUColor.midnight)

                    Divider()

                    Toggle(isOn: $pgConnected) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("PG(결제 게이트웨이) 연동 완료 (토스페이먼츠·KG이니시스)")
                                .font(BUFont.bodySmall.weight(.semibold))
                                .foregroundStyle(BUColor.ink)
                        }
                    }
                    .tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("통신판매업 신고 방법")
                    infoRow(text: "공정거래위원회 전자공정거래시스템 (ftc.go.kr) 온라인 신청")
                    infoRow(text: "필요 서류: 사업자등록증·대표자 신분증·통신판매 관련 정보")
                    infoRow(text: "처리 기간: 5-7 영업일")
                }
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("판매 플랫폼 셋업 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        }
    }

    private func infoRow(text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text("•").font(BUFont.bodyCaption).foregroundStyle(BUColor.midnight).padding(.top, 2)
            Text(text).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
        }
    }
}

#if DEBUG
#Preview("PlatformSetup") { PlatformSetupStageView() }
#endif

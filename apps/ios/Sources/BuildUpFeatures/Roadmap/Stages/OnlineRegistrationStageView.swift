//
//  OnlineRegistrationStageView.swift — 온라인 사업자 등록 (iOS 네이티브)
//
//  stageId: "online-registration"
//
//  2-page (segmented): 사업자등록 / 통신판매업 신고
//  Note: prefix "or2." 사용 — "reg." 와의 충돌 방지 (RegistrationSetupStageView)
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct OnlineRegistrationStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("or2.bizRegDone")  private var bizRegDone  = false
    @AppStorage("or2.taxType")     private var taxType     = ""
    @AppStorage("or2.telecomDone") private var telecomDone = false
    @AppStorage("or2.done")        private var done        = false

    private let pages = ["사업자등록", "통신판매업 신고"]

    private struct TaxOption {
        let id: String; let name: String; let desc: String
    }

    private let taxOptions: [TaxOption] = [
        TaxOption(id: "simplified", name: "간이과세 (연매출 1억 400만원 미만 예상)", desc: "세금계산서 발행 불가. 사업자 간 거래 제한. 초기 소규모에 적합."),
        TaxOption(id: "general",    name: "일반과세",                               desc: "세금계산서 발행 가능. 매입세액 공제. B2B 거래 필수."),
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
                                case 0: bizRegPage
                                default: telecomPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)

                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("온라인 사업자 등록")
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

    // MARK: - Page 0: 사업자등록

    private var bizRegPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("사업자등록")
                    Text("온라인 사업자등록 = 스마트스토어 개설의 전제 조건")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(BUColor.midnightDeep)
                        .tracking(-0.3)
                        .lineSpacing(4)
                    Text("홈택스에서 10분 만에 완료 가능")
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(spacing: 0) {
                    BUEyebrow("온라인 사업자등록 절차")
                        .padding(.bottom, BUSpacing.sm)
                    stepRow(num: 1, title: "홈택스(hometax.go.kr) → 신청/제출 → 사업자등록신청",
                            detail: nil)
                    stepRow(num: 2, title: "업태: 소매업 / 종목: 전자상거래 소매업",
                            detail: nil)
                    stepRow(num: 3, title: "개업일·사업장 주소·대표자 정보 입력",
                            detail: nil)
                    stepRow(num: 4, title: "보완 서류 없으면 당일~3일 내 발급",
                            detail: nil, isLast: true)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("세금 유형 선택")
                    VStack(spacing: BUSpacing.xs) {
                        ForEach(taxOptions, id: \.id) { opt in
                            taxButton(opt)
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $bizRegDone) {
                    Text("사업자등록 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        }
    }

    private func taxButton(_ opt: TaxOption) -> some View {
        let isSelected = taxType == opt.id
        return Button { taxType = opt.id } label: {
            HStack(spacing: BUSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08))
                        .frame(width: 26, height: 26)
                    Image(systemName: isSelected ? "checkmark" : "doc.text")
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

    // MARK: - Page 1: 통신판매업 신고

    private var telecomPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("통신판매업 신고 — 왜 필요한가")
                    infoRow(text: "전자상거래 소비자 보호법에 따라 온라인으로 상품·서비스 판매 시 의무")
                    infoRow(text: "미신고 시 과태료 최대 500만원")
                    infoRow(text: "스마트스토어·쿠팡 등 플랫폼 입점 심사 시 신고증 요구")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("신고 방법")
                    infoRow(text: "공정위 전자공정거래시스템 (ftc.go.kr)")
                    infoRow(text: "필요 서류: 사업자등록증·통신판매 방법(인터넷·전화 등)")
                    infoRow(text: "처리 기간: 5-7 영업일 / 수수료 없음")
                }
            }

            BUCard(.card) {
                Toggle(isOn: $telecomDone) {
                    Text("통신판매업 신고 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("온라인 사업자 등록 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        }
    }

    // MARK: - Helpers

    private func stepRow(num: Int, title: String, detail: String?, isLast: Bool = false) -> some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                ZStack {
                    Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                    Text("\(num)").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    if let detail {
                        Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
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
}

#if DEBUG
#Preview("OnlineRegistration") { OnlineRegistrationStageView() }
#endif

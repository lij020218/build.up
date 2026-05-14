//
//  VentureCertificationStageView.swift — 벤처 인증 (iOS 네이티브)
//
//  stageId: "venture-certification"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct VentureCertificationStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("vc.certType") private var certType = ""
    @AppStorage("vc.applied")  private var applied  = false
    @AppStorage("vc.done")     private var done     = false

    private let pages = ["인증 종류", "신청 방법"]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
                    Picker("탭", selection: $page) {
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
                                case 0: certTypePage
                                default: applicationPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("벤처 인증")
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

    // MARK: - pg 0 인증 종류

    private var certTypePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("벤처 인증")
                    Text("세제 혜택·보조금·조달 우선권\n— 법인 설립 후 가능한 빨리")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(BUColor.midnightDeep)
                        .tracking(-0.3)
                        .lineSpacing(4)
                    Text("2026년 벤처 인증 기업 수: 약 4만 2천 개")
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("벤처 인증 4가지 유형")
                    let options: [(String, String, String)] = [
                        ("research",    "연구개발기업",   "R&D 비용이 매출의 5% 이상 또는 연구인력 5% 이상. 딥테크 스타트업에 적합."),
                        ("innovation",  "기술혁신형",     "기술보증기금(KIBO) 기술평가 통해 인증. 혁신기술 보유 기업."),
                        ("vc",          "벤처투자기업",   "VC로부터 5000만원 이상 투자 유치. 가장 빠른 취득 경로."),
                        ("government",  "정부지원기업",   "정부 R&D 과제 수행 기업. 중진공·IITP 과제 해당."),
                    ]
                    ForEach(options, id: \.0) { id, title, desc in
                        let isSelected = certType == id
                        Button {
                            certType = isSelected ? "" : id
                        } label: {
                            HStack(alignment: .top, spacing: BUSpacing.sm) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(title)
                                        .font(BUFont.bodySmall.weight(.semibold))
                                        .foregroundStyle(isSelected ? BUColor.midnightDeep : BUColor.ink)
                                    Text(desc)
                                        .font(BUFont.bodyCaption)
                                        .foregroundStyle(BUColor.inkSecondary)
                                        .lineSpacing(2)
                                        .multilineTextAlignment(.leading)
                                }
                                Spacer()
                                if isSelected {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 16))
                                        .foregroundStyle(BUColor.midnight)
                                }
                            }
                            .padding(BUSpacing.sm)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(
                                isSelected ? BUColor.midnight.opacity(0.08) : BUColor.midnight.opacity(0.03),
                                in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                            )
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
                    BUEyebrow("벤처 인증 혜택")
                    let benefits = [
                        "법인세·소득세 50% 감면 (5년)",
                        "4대보험 50% 감면 (3년)",
                        "공공기관 조달 가점",
                        "정책자금 금리 우대 (0.2-0.5%p)",
                        "코스닥 상장 특례 (일부 유형)",
                    ]
                    ForEach(benefits, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "checkmark")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(BUColor.success)
                                .padding(.top, 2)
                            Text(item)
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 신청 방법

    private var applicationPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("신청 절차 (벤처확인기관 기준)")
                    let steps = [
                        "벤처확인종합관리시스템 (venturein.or.kr) 접속",
                        "유형 선택 → 필요 서류 확인 (유형마다 다름)",
                        "온라인 신청 + 서류 업로드",
                        "심사 (평균 2-4주) → 확인서 발급",
                        "혜택 즉시 적용 시작",
                    ]
                    ForEach(steps.indices, id: \.self) { i in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                Circle()
                                    .fill(BUColor.midnight.opacity(0.08))
                                    .frame(width: 24, height: 24)
                                Text("\(i + 1)")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(BUColor.midnight)
                            }
                            Text(steps[i])
                                .font(BUFont.bodySmall)
                                .foregroundStyle(BUColor.ink)
                                .lineSpacing(2)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("준비 서류 (공통)")
                    let docs = [
                        "법인등기부등본",
                        "사업자등록증",
                        "최근 3년 재무제표 (없으면 창업 후 첫 회계연도 내)",
                    ]
                    ForEach(docs, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(BUColor.midnight).frame(width: 4, height: 4).padding(.top, 5)
                            Text(item)
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $applied) {
                    Text("벤처 인증 신청 완료")
                        .font(BUFont.bodySmall.weight(.semibold))
                        .foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("벤처 인증 완료")
                        .font(BUFont.bodySmall.weight(.semibold))
                        .foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("VentureCertification") { VentureCertificationStageView() }
#endif

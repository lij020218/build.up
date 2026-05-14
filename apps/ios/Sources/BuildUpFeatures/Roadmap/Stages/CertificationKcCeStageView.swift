//
//  CertificationKcCeStageView.swift — KC·CE·FCC 인증 (iOS 네이티브)
//
//  stageId: "certification-kc-ce"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct CertificationKcCeStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("cert.kcRequired")  private var kcRequired  = false
    @AppStorage("cert.ceRequired")  private var ceRequired  = false
    @AppStorage("cert.fccRequired") private var fccRequired = false
    @AppStorage("cert.kcApplied")   private var kcApplied   = false
    @AppStorage("cert.ceApplied")   private var ceApplied   = false
    @AppStorage("cert.done")        private var done        = false

    private let pages = ["인증 종류", "신청 절차"]

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
                                default: procedurePage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("KC·CE·FCC 인증")
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
                    BUEyebrow("KC·CE·FCC 인증")
                    Text("인증 없이는 판매 불가\nKC는 국내, CE는 유럽, FCC는 미국")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("무선 통신 포함 제품: 8–16주 / 비무선 제품: 4–8주")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("인증별 적용 범위")
                    let certInfos: [(String, String, String)] = [
                        ("KC", "한국", "국내 판매 의무. 전기용품안전기준(KS). 위반 시 리콜·판매정지."),
                        ("CE", "유럽", "EU 수출 시 필수. RoHS·EMC·LVD 지령 포함. 유럽 대리인 지정 필요."),
                        ("FCC", "미국", "미국 판매·수출 시 필수. 무선 제품은 ID 등록 의무."),
                        ("MIC", "일본", "일본 판매 시 전파법 인증. 국내 TELEC 대행 기관 통해 가능."),
                    ]
                    ForEach(certInfos, id: \.0) { cert, region, desc in
                        VStack(alignment: .leading, spacing: 3) {
                            HStack(spacing: BUSpacing.xs) {
                                Text(cert).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                                Text("(\(region))").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                            }
                            Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                        .padding(.bottom, BUSpacing.xs)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("필요 인증 선택")
                    Toggle(isOn: $kcRequired) {
                        Text("KC 인증 필요 (국내 판매)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $ceRequired) {
                        Text("CE 인증 필요 (유럽 수출 계획)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $fccRequired) {
                        Text("FCC 인증 필요 (미국 수출 계획)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }

    // MARK: - pg 1 신청 절차

    private var procedurePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("KC 인증 신청 절차")
                    let steps: [(String, String)] = [
                        ("1", "시험기관 선정 (KTL·KOTITI·FITI 등)"),
                        ("2", "시험 의뢰"),
                        ("3", "심사·시험 (4–16주)"),
                        ("4", "인증서 발급"),
                        ("5", "제품에 KC 마크 표시"),
                    ]
                    ForEach(steps, id: \.0) { num, desc in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(num)
                                .font(BUFont.eyebrow.weight(.bold))
                                .foregroundStyle(BUColor.midnight)
                                .frame(width: 18, alignment: .center)
                            Text(desc).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("인증 비용 가이드 (2026 기준)")
                    let costs: [(String, String)] = [
                        ("KC 기본", "300–800만원 (제품 복잡도에 따라)"),
                        ("CE 마킹", "500–1,500만원"),
                        ("FCC", "500–2,000만원"),
                        ("EMC 시험", "별도 추가 가능"),
                    ]
                    ForEach(costs, id: \.0) { label, value in
                        HStack(spacing: BUSpacing.sm) {
                            Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted).frame(width: 72, alignment: .leading)
                            Text(value).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("신청 완료 체크")
                    Toggle(isOn: $kcApplied) {
                        Text("KC 인증 신청 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $ceApplied) {
                        Text("CE 인증 신청 완료 (해당 시)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 완료")
                    Toggle(isOn: $done) {
                        Text("인증 프로세스 시작 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("CertificationKcCe") { CertificationKcCeStageView() }
#endif

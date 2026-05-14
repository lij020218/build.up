//
//  CompanySetupStageView.swift — 법인 설립·IP 보호 (iOS 네이티브)
//
//  stageId: "company-setup"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct CompanySetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("cs.corpRegistered")  private var corpRegistered  = false
    @AppStorage("cs.patentFiled")     private var patentFiled     = false
    @AppStorage("cs.trademarkFiled")  private var trademarkFiled  = false
    @AppStorage("cs.bizAccount")      private var bizAccount      = false
    @AppStorage("cs.done")            private var done            = false

    private let pages = ["법인 설립", "IP 보호"]

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
                                case 0: corpPage
                                default: ipPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("법인 설립·IP 보호")
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

    // MARK: - pg 0 법인 설립

    private var corpPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("법인 설립·IP 보호")
                    Text("법인은 MVP 직전에 설립 —\nIP 출원은 MVP 전에")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("순서가 틀리면 IP 귀속 문제 발생")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("법인 설립 절차")
                    let steps: [(String, String)] = [
                        ("상호 검색", "대법원 인터넷등기소 → 중복 확인"),
                        ("정관 작성 + 공증", "자본금 10억 미만 → 공증 생략 가능"),
                        ("법인등기", "법원 등기소 or 온라인 — 3-5 영업일"),
                        ("사업자등록", "홈택스, 법인등기 후 즉시"),
                    ]
                    ForEach(steps.indices, id: \.self) { i in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                                Text("\(i+1)").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(steps[i].0).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(steps[i].1).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $corpRegistered) {
                        Text("법인 설립 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $bizAccount) {
                        Text("사업용 법인 통장 개설").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("법인 vs 개인사업자 비교")
                    let rows: [(String, String, String)] = [
                        ("투자 유치", "✓ 가능", "✗ 불가"),
                        ("세율", "9~24%", "6~45%"),
                        ("설립 비용", "50-100만원", "무료"),
                        ("추천 시점", "팀 2명+ + 투자 계획", "1인 초기 검증"),
                    ]
                    HStack {
                        Text("").frame(maxWidth: .infinity, alignment: .leading)
                        Text("법인").font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight).frame(width: 90, alignment: .center)
                        Text("개인").font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.inkMuted).frame(width: 90, alignment: .center)
                    }
                    Divider()
                    ForEach(rows, id: \.0) { label, corp, individual in
                        HStack {
                            Text(label).font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).frame(maxWidth: .infinity, alignment: .leading)
                            Text(corp).font(BUFont.bodyCaption.weight(.semibold)).foregroundStyle(BUColor.midnight).frame(width: 90, alignment: .center)
                            Text(individual).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).frame(width: 90, alignment: .center)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 IP 보호

    private var ipPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("IP 보호")
                    Text("IP는 MVP 전에 —\n공개 후 출원하면 신규성 상실")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("특허 출원 비용: 개인 약 60만원 / 법인 약 80만원")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("IP 우선순위")
                    let items: [(String, String, String)] = [
                        ("shield", "특허", "핵심 기술·알고리즘 — 심사 18-24개월. 출원 즉시 '출원 중' 표시 가능."),
                        ("tag", "상표", "브랜드명·로고 — 10년 유효, 9만원. 경쟁사 모방 방지 핵심."),
                        ("doc.text", "저작권", "소스코드 자동 보호 (별도 등록 불필요). 저작권 등록은 분쟁 시 유리."),
                    ]
                    ForEach(items, id: \.1) { icon, title, detail in
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

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $patentFiled) {
                        Text("핵심 기술 특허 출원 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $trademarkFiled) {
                        Text("브랜드 상표 출원 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("IP 출원 기관")
                    let orgs: [(String, String, String)] = [
                        ("shield.checkered", "특허청 (kipo.go.kr)", "온라인 출원, 중소기업 수수료 70% 감면"),
                        ("person.badge.shield.checkmark", "한국특허전략개발원", "스타트업 IP 바우처 최대 1000만원 지원"),
                    ]
                    ForEach(orgs, id: \.1) { icon, name, detail in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.08))
                                    .frame(width: 32, height: 32)
                                Image(systemName: icon).font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("법인 설립·IP 보호 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("CompanySetup") { CompanySetupStageView() }
#endif

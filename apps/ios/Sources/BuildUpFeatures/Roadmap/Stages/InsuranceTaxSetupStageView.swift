//
//  InsuranceTaxSetupStageView.swift — 보험·세무 세팅 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/InsuranceTaxSetupStage.tsx
//  stageId: "insurance-tax-setup"
//
//  2026 요율 (검증 완료):
//    국민연금: 9.5% (각 4.75%) — 2026년 인상
//    건강보험: 7.19% (각 3.595%) — 2026년 인상
//    장기요양: 건강보험료의 0.9448%
//    고용보험: 1.8% (각 0.9%) + 사업주 추가 0.25%
//    산재보험: 0.8% (음식·도소매·숙박, 사업주 100%)
//    두루누리: 월보수 270만 미만 + 10인 미만 → 80% 국가 지원 (최대 36개월)
//
//  3-page (세그먼트):
//    pg 0 — 4대보험 요율 & 두루누리
//    pg 1 — 세무 세팅 (홈택스·세무사·비용처리)
//    pg 2 — 완료 체크리스트
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

private let WAGE_2026 = 10_320
private let MONTH_HOURS = 209

public struct InsuranceTaxSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0
    @State private var monthlyWageText = "\(WAGE_2026 * MONTH_HOURS)"

    // 세무 선택
    @AppStorage("insTax.cpaChoice")      private var cpaChoice        = "" // "cpa" or "self"
    @AppStorage("insTax.hometaxDone")    private var hometaxDone      = false
    @AppStorage("insTax.bizCardDone")    private var bizCardDone      = false
    @AppStorage("insTax.insRegDone")     private var insRegDone       = false
    @AppStorage("insTax.vatDone")        private var vatDone          = false

    private var monthlyWage: Int { Int(monthlyWageText) ?? (WAGE_2026 * MONTH_HOURS) }
    private var pensionEmployee: Int { Int(Double(monthlyWage) * 0.0475) }
    private var healthEmployee: Int  { Int(Double(monthlyWage) * 0.03595) }
    private var employerExtra: Int   { Int(Double(monthlyWage) * (0.0475 + 0.03595 + 0.009 + 0.008 + 0.0025)) }

    private let pages = ["4대보험", "세무 세팅", "체크리스트"]

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
                                case 0: insurancePage
                                case 1: taxPage
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
            .navigationTitle("보험·세무 세팅")
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

    // MARK: - pg 0 4대보험

    private var insurancePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("단계 17 · 보험·세무 세팅")
                    Text("4대보험 + 세무 세팅 —\n채용 D+14 이내 필수")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("1명 고용도 4대보험 의무 (5인 미만 예외 없음). 직원 입사일로부터 14일 이내 신고 — 미신고 시 과태료 100만원+.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("2026년 4대보험 요율")
                    let rates: [(String, String, String, String)] = [
                        ("국민연금",   "9.5%", "근로자 4.75% / 사업주 4.75%", "2025년 9%에서 인상"),
                        ("건강보험",   "7.19%","근로자 3.595% / 사업주 3.595%", "2026 인상"),
                        ("장기요양",   "건강보험료의 0.9448%", "근로자·사업주 각 절반", ""),
                        ("고용보험",   "1.8%", "근로자 0.9% / 사업주 0.9% + 추가 0.25%", "사업주 추가부담"),
                        ("산재보험",   "0.8%", "사업주 100% (근로자 부담 없음)", "음식·도소매·숙박 업종"),
                    ]
                    ForEach(rates, id: \.0) { name, rate, split, note in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.midnight).frame(width: 64, alignment: .leading)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(rate).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                                Text(split).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                                if !note.isEmpty {
                                    Text(note).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                                }
                            }
                            Spacer()
                        }
                    }
                }
            }

            // 두루누리
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        Image(systemName: "sparkles").foregroundStyle(BUColor.midnight).font(.system(size: 13))
                        Text("두루누리 사회보험 지원 (2026)").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                    }
                    Text("월보수 270만원 미만 근로자 + 10인 미만 사업장 → 국민연금·고용보험 사업주 부담의 80% 국가 지원 (최대 36개월).")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    Text("4insure.or.kr 신고 시 두루누리 동시 신청 가능.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                }
            }

            // 부담 시뮬레이션
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("사업주 부담 시뮬레이션")
                    HStack(spacing: BUSpacing.md) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("월 급여 (원)").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                            TextField("월급여", text: $monthlyWageText)
                                .font(BUFont.body)
                                .padding(.horizontal, 10).padding(.vertical, 8)
                                .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                                .keyboardType(.numberPad)
                        }
                    }
                    Divider()
                    HStack {
                        simRow(label: "국민연금", value: pensionEmployee)
                        Spacer()
                        simRow(label: "건강보험", value: healthEmployee)
                        Spacer()
                        simRow(label: "사업주 총부담", value: employerExtra, highlight: true)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("신고 방법 (4insure.or.kr)")
                    let steps: [(String, String)] = [
                        ("4insure.or.kr 접속", "4대보험 통합 신고 사이트 — 국민연금·건강·고용·산재 한 번에"),
                        ("사업자등록증 + 근로계약서 + 통장 사본 PDF 업로드", "D+14 이내 필수. 약 30분 소요"),
                        ("자동이체 신청", "매월 납부 자동화 권장"),
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
        }
    }

    // MARK: - pg 1 세무 세팅

    private var taxPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("세무 처리 방식 선택")
                    HStack(spacing: BUSpacing.sm) {
                        taxMethodCard(id: "cpa", title: "세무사 선임", desc: "월 10~20만원. 신고 대행·절세 컨설팅. 초기 3년 강력 권장.", icon: "person.badge.shield.checkmark")
                        taxMethodCard(id: "self", title: "직접 신고", desc: "홈택스 독학. 단순 간이과세자에게만 현실적.", icon: "laptopcomputer")
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("홈택스 필수 세팅")
                    let items: [(String, String)] = [
                        ("홈택스 회원가입·사업장 등록", "공인인증서 또는 금융인증서로 로그인 후 사업자 등록"),
                        ("부가세 신고 일정 확인", "간이과세: 1월 신고 1회. 일반과세: 1월·7월 신고 2회"),
                        ("원천세 자동이체 설정", "직원 월급 지급 후 다음달 10일까지 홈택스 납부"),
                        ("현금영수증 가맹점 등록", "연 매출 2,400만원+ 의무. 미등록 시 가산세 5%"),
                    ]
                    ForEach(items, id: \.0) { title, detail in
                        HStack(alignment: .top, spacing: 8) {
                            Text("✓").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.success)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("절세 핵심 — 비용 처리")
                    let tips: [(String, String)] = [
                        ("사업용 카드로만 결제", "개인카드 혼용 시 비용 불인정 — 세금 늘어남"),
                        ("영수증·세금계산서 보관", "5년 보관 의무. 클라우드 스캔 권장"),
                        ("인테리어·설비 감가상각", "5~10년 감가상각으로 매년 비용 처리 가능"),
                    ]
                    ForEach(tips, id: \.0) { title, detail in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "lightbulb.fill").foregroundStyle(.orange).font(.system(size: 11))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 2 체크리스트

    private var checklistPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크리스트")
                    Toggle(isOn: $insRegDone) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("4대보험 신고 완료 (4insure.or.kr)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("채용 D+14 이내 필수").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $hometaxDone) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("홈택스 회원가입·사업장 등록").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("공인인증서 또는 금융인증서 필요").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $bizCardDone) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("사업용 카드 분리 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("개인카드 혼용 = 비용 불인정").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $vatDone) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("부가세 신고 일정 확인").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("간이: 1월 1회 / 일반: 1·7월 2회").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                }
            }

            warningCard(title: "반드시 확인", items: [
                "현금 급여 + 미신고 = 세무조사 (국세청 PCI 자동 추적)",
                "원천세 신고 미납 시 가산세 10%↑ — 매월 10일까지",
                "두루누리 신청 대상인지 확인 — 월보수 270만 미만 근로자",
            ], color: .red)
        }
    }

    // MARK: - Helpers

    private func simRow(label: String, value: Int, highlight: Bool = false) -> some View {
        VStack(alignment: .center, spacing: 2) {
            Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
            Text("\(value.formatted())원")
                .font(highlight ? BUFont.cardTitleSmall : BUFont.bodySmall)
                .foregroundStyle(highlight ? BUColor.midnight : BUColor.ink)
                .monospacedDigit()
        }
    }

    private func taxMethodCard(id: String, title: String, desc: String, icon: String) -> some View {
        let isSelected = cpaChoice == id
        return Button {
            cpaChoice = isSelected ? "" : id
        } label: {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(isSelected ? BUColor.midnight.opacity(0.12) : BUColor.midnight.opacity(0.06))
                        .frame(width: 40, height: 40)
                    Image(systemName: icon).font(.system(size: 18)).foregroundStyle(BUColor.midnight)
                }
                Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2).multilineTextAlignment(.leading)
            }
            .padding(BUSpacing.sm)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.surface, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                    .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func warningCard(title: String, items: [String], color: Color) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.xs) {
                Text(title).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(color)
                ForEach(items, id: \.self) { item in
                    HStack(alignment: .top, spacing: 6) {
                        Circle().fill(color).frame(width: 4, height: 4).padding(.top, 5)
                        Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
            }
        }
    }
}

#if DEBUG
#Preview("InsuranceTaxSetup") { InsuranceTaxSetupStageView() }
#endif

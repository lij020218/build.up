//
//  HiringSetupStageView.swift — 채용 설정 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/HiringSetupStage.tsx
//  stageId: "hiring-setup"
//
//  2026 검증 데이터:
//    최저시급: 10,320원 (고용노동부 2025-08 고시, 2026.1.1 시행)
//    월 209시간 (주 40h × 4.345주): 2,156,880원
//    주휴수당: 주 15h↑ 개근 시 시급 × 8h 추가
//    4대보험 사업주 부담: 월 약 19만원 (최저임금 기준)
//
//  3-page (세그먼트):
//    pg 0 — 공고 (플랫폼 선택 안내)
//    pg 1 — 계약서 + 임금 계산
//    pg 2 — 4대보험·원천세 + 체크리스트
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

private let WAGE_2026 = 10_320
private let MONTH_HOURS = 209
private let MONTHLY_MIN_WAGE = WAGE_2026 * MONTH_HOURS // 2,156,880

public struct HiringSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    // 계산기 state
    @State private var wageText    = "\(WAGE_2026)"
    @State private var hoursText   = "30"

    // 체크
    @AppStorage("hiring.contractDone")    private var contractDone    = false
    @AppStorage("hiring.insuranceDone")   private var insuranceDone   = false
    @AppStorage("hiring.payslipDone")     private var payslipDone     = false

    private var wage: Int   { Int(wageText) ?? WAGE_2026 }
    private var hours: Double { Double(hoursText) ?? 30 }
    private var weeklyBase: Int { Int(hours) * wage }
    private var weeklyHoliday: Int { Int(hours) >= 15 ? wage * 8 : 0 }
    private var weeklyTotal: Int { weeklyBase + weeklyHoliday }
    private var monthlyTotal: Int { Int(Double(weeklyTotal) * 4.345) }
    private var employerInsurance: Int { Int(Double(monthlyTotal) * 0.088) } // 국민연금+건강+고용 약 8.8%

    private let pages = ["공고", "계약서·임금", "보험·체크"]

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
                                case 0: postingPage
                                case 1: contractPage
                                default: insurancePage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("채용 설정")
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

    // MARK: - pg 0 공고

    private var postingPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("단계 16 · 채용 설정")
                    Text("첫 직원 채용 60분 —\n계약서 + 4대보험 + 원천세")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("알바 1명도 정직원과 동일한 법적 절차 적용. 계약서 미교부 = 500만원 이하 과태료.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("채용 플랫폼 (외식업 권장)")
                    let platforms: [(String, String, String)] = [
                        ("알바몬", "단기·파트타임 1순위 · 소상공인 무료 공고", "albamon.com"),
                        ("알바천국", "음식점·카페 표준 · 네이버 검색 연동", "alba.co.kr"),
                        ("당근 동네알바", "지역 주민 즉시 매칭 · 무료 · 출퇴근 짧은", "daangn.com"),
                        ("사람인", "정직원·경력직 채용 · 이력서 기반", "saramin.co.kr"),
                    ]
                    ForEach(platforms, id: \.0) { name, desc, _ in
                        HStack(spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight)
                                    .frame(width: 32, height: 32)
                                Text(String(name.prefix(1)))
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(.white)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(name).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                            }
                            Spacer()
                        }
                    }
                }
            }

            warningCard(title: "공고 필수 4항목", items: [
                "시급 명시 (최저임금 10,320원 이상)",
                "근무 시간·요일 구체적으로",
                "식사 제공 여부",
                "오픈 1~2주 전 채용 필수 (교육 기간)",
            ], color: .orange)

            BUCard(.card) {
                HStack(spacing: 6) {
                    Image(systemName: "info.circle").foregroundStyle(BUColor.midnight)
                    Text("2026 최저시급: 10,320원/h · 월 209시간 기준 2,156,880원")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.midnightDeep)
                }
            }
        }
    }

    // MARK: - pg 1 계약서·임금

    private var contractPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("근로계약서 필수 4항목")
                    let items = [
                        ("임금", "시급/월급, 지급일, 지급방법 명시"),
                        ("근무 시간·요일", "휴게 시간 (4h↑ 30분 / 8h↑ 1시간)"),
                        ("업무·근무지", "구체적인 업무 내용과 장소"),
                        ("계약 기간", "기간제 vs 무기계약 명확히"),
                    ]
                    ForEach(items, id: \.0) { title, detail in
                        HStack(alignment: .top, spacing: 8) {
                            Text("✓").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.success)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                            }
                        }
                    }
                }
            }

            // 인건비 계산기
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("실제 사업주 부담 시뮬레이션")

                    HStack(spacing: BUSpacing.md) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("시급 (원)").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                            TextField("시급", text: $wageText).buHiringFieldStyle().keyboardType(.numberPad)
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            Text("주간 시간").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                            TextField("시간", text: $hoursText).buHiringFieldStyle().keyboardType(.numberPad)
                        }
                    }

                    Divider()

                    HStack {
                        resultRow(label: "주급 (기본)", value: weeklyBase)
                        Spacer()
                        resultRow(label: "주휴수당", value: weeklyHoliday)
                        Spacer()
                        resultRow(label: "월 총 지급", value: monthlyTotal, highlight: true)
                    }

                    HStack {
                        resultRow(label: "사업주 4대보험", value: employerInsurance)
                        Spacer()
                        resultRow(label: "실제 월 부담", value: monthlyTotal + employerInsurance, highlight: true)
                    }

                    if wage < WAGE_2026 {
                        HStack(spacing: 6) {
                            Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.red).font(.system(size: 12))
                            Text("최저임금 미달! 2026 최저시급 \(WAGE_2026.formatted())원 이상으로 수정하세요.")
                                .font(BUFont.eyebrow).foregroundStyle(.red)
                        }
                    }
                }
            }

            warningCard(title: "주의", items: [
                "계약서 미교부 시 500만원 이하 과태료 — 사인 후 즉시 1부 교부",
                "주휴수당 「포함된 시급」 협상은 불법 — 시급·주휴 별도 표기 필수",
                "수습 90% 감액은 1년 이상 계약 + 3개월 이내만 적용",
            ], color: .red)

            BUCard(.card) {
                Toggle(isOn: $contractDone) {
                    Text("근로계약서 작성·교부 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }

    // MARK: - pg 2 보험·체크

    private var insurancePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("4대보험 + 원천세")
                    let steps: [(String, String)] = [
                        ("4insure.or.kr 통합 신고 (채용 D+14 이내)",
                         "국민연금·건강·고용·산재 한 사이트에서. 사업자등록증·근로계약서·통장 사본 PDF 업로드. 30분."),
                        ("사업주 월 부담 약 19만원 (최저임금 기준)",
                         "국민연금 50% + 건강 50% + 고용 50% + 산재 100% (음식점 약 1%). 자동이체 신청 권장."),
                        ("홈택스 원천세 — 매월 10일까지 신고·납부",
                         "간이세액표 자동 계산 → 신고 → 자동이체. 누락 시 가산세 10%↑"),
                        ("급여명세서 의무 교부 (2021.11~)",
                         "카카오톡·이메일 전송도 합법. 수신 확인 보존 필수. 미교부 500만원 이하 과태료."),
                    ]
                    ForEach(steps.indices, id: \.self) { i in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                                Text("\(i+1)").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                            }
                            VStack(alignment: .leading, spacing: 3) {
                                Text(steps[i].0).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
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
                    Toggle(isOn: $insuranceDone) {
                        Text("4대보험 신고 완료 (D+14)").font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $payslipDone) {
                        Text("급여명세서 자동 발송 셋업").font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            warningCard(title: "반드시 확인", items: [
                "1인 고용도 4대보험 의무 (5인 미만 예외 없음)",
                "현금 급여 + 미신고 = 세무조사 (국세청 PCI 자동 추적)",
                "산재보험은 사업주 100% 부담 (음식점 약 1% 요율)",
            ], color: .red)
        }
    }

    // MARK: - Helpers

    private func resultRow(label: String, value: Int, highlight: Bool = false) -> some View {
        VStack(alignment: .center, spacing: 2) {
            Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
            Text("\(value.formatted())원")
                .font(highlight ? BUFont.cardTitleSmall : BUFont.bodySmall)
                .foregroundStyle(highlight ? BUColor.midnight : BUColor.ink)
                .monospacedDigit()
        }
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

private extension View {
    func buHiringFieldStyle() -> some View {
        self.font(BUFont.body)
            .padding(.horizontal, 10).padding(.vertical, 8)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

#if DEBUG
#Preview("HiringSetup") { HiringSetupStageView() }
#endif

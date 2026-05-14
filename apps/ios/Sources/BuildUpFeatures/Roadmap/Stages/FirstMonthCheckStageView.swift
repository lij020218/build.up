//
//  FirstMonthCheckStageView.swift — 첫 달 점검 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared-tail/FirstMonthCheckStage.tsx
//  stageId: "first-month-check"
//
//  @AppStorage fin.* (FinancialReviewStage 에서 입력) 를 읽어 런웨이 계산.
//
//  4-page (가로 스크롤 탭바):
//    pg 0 — 왜 중요한가
//    pg 1 — 비상금·런웨이 계산기
//    pg 2 — 첫달 KPI 트래커
//    pg 3 — 주간 루틴
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct FirstMonthCheckStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    // FinancialReview 에서 이어받는 월 고정비 (만원)
    @AppStorage("fin.rent")       private var rent      = 0
    @AppStorage("fin.labor")      private var labor     = 0
    @AppStorage("fin.utilities")  private var utilities = 0
    @AppStorage("fin.interest")   private var interest  = 0
    @AppStorage("fin.ingredients") private var ingredients = 0
    @AppStorage("fin.sga")         private var sga         = 0
    @AppStorage("fin.marketing")  private var marketing = 0
    @AppStorage("fin.other")      private var other     = 0

    // 런웨이 계산기
    @AppStorage("fm.reserve")     private var reserveText  = ""  // 비상금 (만원)
    @AppStorage("fm.weekSales1")  private var week1Text    = ""  // 1주차 매출
    @AppStorage("fm.weekSales2")  private var week2Text    = ""
    @AppStorage("fm.weekSales3")  private var week3Text    = ""
    @AppStorage("fm.weekSales4")  private var week4Text    = ""

    // KPI
    @AppStorage("fm.customerCount") private var customerCountText = ""
    @AppStorage("fm.avgTicket")     private var avgTicketText     = ""

    // 루틴 체크
    @AppStorage("fm.routineSales")    private var routineSales    = false
    @AppStorage("fm.routinePrime")    private var routinePrime    = false
    @AppStorage("fm.routineReview")   private var routineReview   = false
    @AppStorage("fm.routineExpense")  private var routineExpense  = false
    @AppStorage("fm.routineMenu")     private var routineMenu     = false

    @AppStorage("fm.done")         private var firstMonthDone = false

    private let pages = ["왜 중요한가", "비상금·런웨이", "첫달 KPI", "주간 루틴"]

    private var totalMonthlyCost: Int { rent + labor + utilities + interest + ingredients + sga + marketing + other }

    private var reserve: Int    { Int(reserveText) ?? 0 }
    private var week1: Int      { Int(week1Text)   ?? 0 }
    private var week2: Int      { Int(week2Text)   ?? 0 }
    private var week3: Int      { Int(week3Text)   ?? 0 }
    private var week4: Int      { Int(week4Text)   ?? 0 }
    private var totalSales: Int { week1 + week2 + week3 + week4 }

    private var runwayMonths: Double {
        guard totalMonthlyCost > 0, reserve > 0 else { return 0 }
        return Double(reserve) / Double(totalMonthlyCost)
    }

    private var runwayStatus: (label: String, color: Color) {
        if runwayMonths >= 6 { return ("안전", BUColor.success) }
        if runwayMonths >= 3 { return ("주의", .orange) }
        return ("위험", .red)
    }

    private var customerCount: Int { Int(customerCountText) ?? 0 }
    private var avgTicket: Int     { Int(avgTicketText)     ?? 0 }
    private var estimatedSales: Int { customerCount * avgTicket / 10000 } // 만원 단위

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
                    // 가로 스크롤 탭바
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 0) {
                            ForEach(pages.indices, id: \.self) { i in
                                Button {
                                    withAnimation(.easeInOut(duration: 0.2)) { page = i }
                                } label: {
                                    Text(pages[i])
                                        .font(BUFont.bodySmall.weight(page == i ? .semibold : .regular))
                                        .foregroundStyle(page == i ? BUColor.midnight : BUColor.inkMuted)
                                        .padding(.horizontal, BUSpacing.md)
                                        .padding(.vertical, BUSpacing.sm)
                                        .background(
                                            page == i ? BUColor.midnight.opacity(0.08) : Color.clear,
                                            in: Capsule()
                                        )
                                }
                            }
                        }
                        .padding(.horizontal, BUSpacing.sm)
                    }
                    .padding(.vertical, BUSpacing.xs)

                    ScrollView {
                        VStack(alignment: .leading, spacing: BUSpacing.lg) {
                            Group {
                                switch page {
                                case 0: whyPage
                                case 1: runwayPage
                                case 2: kpiPage
                                default: routinePage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("첫 달 점검")
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

    // MARK: - pg 0 왜 중요한가

    private var whyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("첫 달 점검 · 왜 중요한가")
                    Text("첫 3개월이 폐업률 피크 —\n매주 숫자로 보정하세요")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("음식점 폐업의 60%가 오픈 후 3개월 이내에 결정됩니다. 첫 달 KPI를 주간 단위로 추적하면 위기 신호를 조기에 포착할 수 있습니다.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("첫 달 생존을 위한 3가지 숫자")
                    let kpis: [(String, String, String)] = [
                        ("비상금 런웨이", "≥ 3개월치 고정비", "매출 0원이어도 3개월 버티는 현금. 이 아래면 위험 신호."),
                        ("주간 매출 성장", "주차별 +5~10% 목표", "1주차 대비 4주차 매출이 성장하고 있는가?"),
                        ("Prime Cost", "≤ 65%", "재료비+인건비 / 매출. 이걸 매주 계산하지 않으면 손실이 쌓인다."),
                    ]
                    ForEach(kpis, id: \.0) { label, target, desc in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Spacer()
                                Text(target).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight)
                            }
                            Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                        .padding(BUSpacing.sm)
                        .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("폐업 전 경고 신호 — 이 중 2개 이상이면 즉시 대응")
                    let signals = [
                        "주간 매출이 2주 연속 전주 대비 하락",
                        "Prime Cost 70% 초과 — 팔수록 손해",
                        "비상금이 1개월치 고정비 이하로 감소",
                        "리뷰 평점 3.5 미만 또는 리뷰 0개 (4주째)",
                    ]
                    ForEach(signals, id: \.self) { signal in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.red).font(.system(size: 10)).padding(.top, 2)
                            Text(signal).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 비상금·런웨이

    private var runwayPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            if totalMonthlyCost > 0 {
                BUCard(.hero) {
                    VStack(alignment: .leading, spacing: BUSpacing.xs) {
                        BUEyebrow("월 고정비 (재무 검토에서 자동 계산)")
                        HStack(alignment: .firstTextBaseline, spacing: 6) {
                            Text("\(totalMonthlyCost)").font(.system(size: 28, weight: .bold)).foregroundStyle(BUColor.midnight).monospacedDigit()
                            Text("만원/월").font(BUFont.cardTitleSmall).foregroundStyle(BUColor.inkMuted)
                        }
                        Text("임대료 \(rent) + 인건비 \(labor) + 공과금 \(utilities) + 이자 \(interest) + 식자재 \(ingredients) + 기타 \(marketing + sga + other)만원")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                    }
                }
            } else {
                BUCard(.card) {
                    HStack(spacing: BUSpacing.sm) {
                        Image(systemName: "info.circle").foregroundStyle(BUColor.midnight)
                        Text("재무 검토 단계에서 월 운영비를 입력하면 여기서 자동으로 계산됩니다.")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("비상금 (만원)")
                    HStack(spacing: BUSpacing.md) {
                        TextField("예) 3000", text: $reserveText)
                            .font(BUFont.body).keyboardType(.numberPad)
                            .padding(.horizontal, 10).padding(.vertical, 8)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                        Text("만원").font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                    }
                    Text("사업자 통장에 묶어두는 '손 안 대는 비상금' — 매출과 별도 관리 필수.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
                }
            }

            if reserve > 0 && totalMonthlyCost > 0 {
                BUCard(.card) {
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        BUEyebrow("런웨이 계산 결과")
                        HStack(alignment: .firstTextBaseline, spacing: 6) {
                            Text(String(format: "%.1f", runwayMonths))
                                .font(.system(size: 32, weight: .bold)).foregroundStyle(runwayStatus.color).monospacedDigit()
                            Text("개월").font(BUFont.cardTitleSmall).foregroundStyle(BUColor.inkMuted)
                            Spacer()
                            Text(runwayStatus.label).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(.white)
                                .padding(.horizontal, 10).padding(.vertical, 4)
                                .background(runwayStatus.color, in: Capsule())
                        }
                        Text("\(reserve)만원 ÷ \(totalMonthlyCost)만원/월 = \(String(format: "%.1f", runwayMonths))개월")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                        Divider()
                        Text("권장: 최소 3개월 / 이상적: 6개월 이상. 런웨이가 3개월 미만이면 추가 자금 확보 또는 비용 절감 즉시 시작.")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("주차별 매출 기록 (만원)")
                    let weeks: [(String, Binding<String>)] = [
                        ("1주차", $week1Text), ("2주차", $week2Text),
                        ("3주차", $week3Text), ("4주차", $week4Text),
                    ]
                    ForEach(weeks, id: \.0) { label, binding in
                        HStack {
                            Text(label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Spacer()
                            TextField("0", text: binding)
                                .font(BUFont.body).keyboardType(.numberPad).multilineTextAlignment(.trailing)
                                .frame(width: 80)
                                .padding(.horizontal, 8).padding(.vertical, 6)
                                .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                            Text("만원").font(BUFont.bodySmall).foregroundStyle(BUColor.inkMuted)
                        }
                    }
                    Divider()
                    HStack {
                        Text("첫 달 총 매출").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                        Spacer()
                        Text("\(totalSales)만원").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight).monospacedDigit()
                    }
                }
            }
        }
    }

    // MARK: - pg 2 첫달 KPI

    private var kpiPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    BUEyebrow("첫달 KPI 트래커")
                    Text("측정하지 않으면 개선할 수 없습니다.")
                        .font(BUFont.cardTitleSmall).foregroundStyle(BUColor.midnightDeep)
                    Text("주간 매출·고객수·평균 객단가 3가지만 매주 기록하면 트렌드가 보입니다.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("객단가 추정")
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("주간 고객 수").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            TextField("예) 200", text: $customerCountText)
                                .font(BUFont.body).keyboardType(.numberPad)
                                .padding(.horizontal, 8).padding(.vertical, 6)
                                .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                        }
                        Text("×").font(BUFont.cardTitleSmall).foregroundStyle(BUColor.inkMuted).padding(.top, 16)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("평균 객단가 (원)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            TextField("예) 12000", text: $avgTicketText)
                                .font(BUFont.body).keyboardType(.numberPad)
                                .padding(.horizontal, 8).padding(.vertical, 6)
                                .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                        }
                    }
                    if estimatedSales > 0 {
                        Divider()
                        HStack {
                            Text("주간 예상 매출").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                            Spacer()
                            Text("≈ \(estimatedSales)만원").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight).monospacedDigit()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("음식점 KPI 벤치마크 (첫 달)")
                    let benchmarks: [(String, String, String, String)] = [
                        ("일 평균 고객 수", "20~40명", "오픈 2주차부터 의미 있는 추세 가능", "person.2"),
                        ("테이블 회전율", "점심 2.5회 / 저녁 1.5회", "홀 좌석 10석 기준", "arrow.triangle.2.circlepath"),
                        ("리뷰 수 (4주)", "10개 이상", "네이버 플레이스 알고리즘 초기 부스트 임계값", "star"),
                        ("재방문율", "20% 이상 목표", "1달 내 재방문 = 단골 전환 신호", "return"),
                    ]
                    ForEach(benchmarks, id: \.0) { label, target, desc, icon in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.07)).frame(width: 32, height: 32)
                                Image(systemName: icon).font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                HStack {
                                    Text(label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                    Spacer()
                                    Text(target).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight)
                                }
                                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }

            if totalSales > 0 && totalMonthlyCost > 0 {
                BUCard(.card) {
                    VStack(alignment: .leading, spacing: BUSpacing.xs) {
                        BUEyebrow("첫 달 시뮬레이션")
                        let profitLoss = totalSales - totalMonthlyCost
                        let isProfitable = profitLoss >= 0
                        HStack(alignment: .firstTextBaseline, spacing: 6) {
                            Text(isProfitable ? "+" : "").font(.system(size: 24, weight: .bold)).foregroundStyle(isProfitable ? BUColor.success : .red)
                            Text("\(abs(profitLoss))만원").font(.system(size: 24, weight: .bold)).foregroundStyle(isProfitable ? BUColor.success : .red).monospacedDigit()
                        }
                        Text("매출 \(totalSales)만원 - 총비용 \(totalMonthlyCost)만원 = \(profitLoss)만원")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                        if !isProfitable {
                            HStack(spacing: 6) {
                                Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange).font(.system(size: 12))
                                Text("첫 달 적자는 정상입니다. 비상금 런웨이를 확인하고 2달차 개선 포인트를 찾으세요.")
                                    .font(BUFont.eyebrow).foregroundStyle(.orange)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 3 주간 루틴

    private var routinePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    BUEyebrow("첫 달 주간 루틴")
                    Text("사장님의 주간 숫자 관리 루틴 — 매주 금요일 30분")
                        .font(BUFont.cardTitleSmall).foregroundStyle(BUColor.midnightDeep)
                    Text("첫 달을 넘긴 가게의 공통점: 사장님이 매주 숫자를 봤습니다. 30분이면 충분합니다.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("매주 금요일 루틴 체크리스트")
                    let routines: [(String, String, Binding<Bool>)] = [
                        ("주간 매출 기록", "POS 정산 → 이 화면 '비상금·런웨이' 탭에 입력", $routineSales),
                        ("Prime Cost 계산", "이번 주 식자재+인건비 / 매출 × 100", $routinePrime),
                        ("리뷰 모니터링", "네이버 플레이스·카카오맵 신규 리뷰 확인·답글", $routineReview),
                        ("주간 지출 정리", "영수증 스캔·카드 내역 분류 (세금 대비)", $routineExpense),
                        ("다음 주 메뉴·발주 계획", "인기 메뉴 추가·재고 소진 메뉴 조정", $routineMenu),
                    ]
                    ForEach(routines, id: \.0) { label, desc, binding in
                        VStack(alignment: .leading, spacing: 4) {
                            Toggle(isOn: binding) {
                                Text(label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            }.tint(BUColor.midnight)
                            Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                .padding(.leading, 4)
                        }
                        if routines.last?.0 != label { Divider() }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("2달차 진입 기준 — 이 3가지면 됩니다")
                    let criteria: [(String, String)] = [
                        ("비상금 유지", "런웨이 3개월 이상 유지 중"),
                        ("매출 성장", "4주차 매출 ≥ 1주차 매출 × 1.2"),
                        ("Prime Cost < 70%", "아직 65% 미만 아니어도 괜찮음 — 방향이 중요"),
                    ]
                    ForEach(criteria, id: \.0) { title, detail in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(BUColor.success).font(.system(size: 14)).padding(.top, 1)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $firstMonthDone) {
                    Text("첫 달 점검 완료 — 2달차 시작!").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("FirstMonthCheck") { FirstMonthCheckStageView() }
#endif

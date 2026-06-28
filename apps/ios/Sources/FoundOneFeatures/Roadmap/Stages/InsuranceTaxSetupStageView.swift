//
//  InsuranceTaxSetupStageView.swift — 보험·세무 세팅 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/InsuranceTaxSetupStage.tsx
//  stageId: "insurance-tax-setup"
//
//  2026 요율 (정부 고시 검증 — 2026-05-25 audit):
//    국민연금: 9.5% (각 4.75%) — 2026.1 인상 (9% → 9.5%)
//    건강보험: 7.19% (각 3.595%) — 2026.1 인상 (7.09% → 7.19%)
//    장기요양: 임금의 0.9448% (= 건보료 × 13.14%) — 근로자·사업주 각 0.4724%
//    고용보험: 1.8% (각 0.9%, 실업급여) + 사업주 추가 0.25%~ (고용안정·직업능력개발)
//    산재보험: 0.8% (음식·도소매·숙박, 사업주 100% 부담)
//    두루누리: 월보수 270만 미만 + 10인 미만 → 80% 국가 지원 (최대 36개월)
//
//  3-page (세그먼트):
//    pg 0 — 4대보험 요율 & 두루누리
//    pg 1 — 세무 세팅 (홈택스·세무사·비용처리)
//    pg 2 — 완료 체크리스트
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

// ⚠️ 요율·최저임금은 FoundOneCore SSOT(InsuranceRates2026 / MINIMUM_WAGE_2026)만 참조.
//    이 파일이 요율을 따로 들고 있던 게 "옛 요율 버그" 원인 — 중복정의 금지.
private let WAGE_2026 = MINIMUM_WAGE_2026
private let MONTH_HOURS = MONTHLY_WORK_HOURS_2026

public struct InsuranceTaxSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var page = 0
    @State private var monthlyWageText = "\(WAGE_2026 * MONTH_HOURS)"
    private let stageId = "insurance-tax-setup"

    // 세무 선택
    @AppStorage("insTax.cpaChoice")      private var cpaChoice        = "" // "cpa" or "self"
    @AppStorage("insTax.hometaxDone")    private var hometaxDone      = false
    @AppStorage("insTax.bizCardDone")    private var bizCardDone      = false
    @AppStorage("insTax.insRegDone")     private var insRegDone       = false
    @AppStorage("insTax.vatDone")        private var vatDone          = false

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }
    /// 업종별 산재요율 (%). 웹 SSOT: ACCIDENT_RATE_BY_CATEGORY.
    private var accidentRate: Double { cluster.accidentInsuranceRatePct }
    private var accidentRateDecimal: Double { accidentRate / 100.0 }

    // 영업장 법정 의무보험(직원 4대보험과 별개). SSOT: packages/shared mandatory-insurance.ts 미러.
    private var mandatoryIns: [MandatoryInsurance] {
        MandatoryInsuranceRegistry.forCategory(StarterIndustryData.option(by: industryId)?.categoryId)
    }

    private var monthlyWage: Int { Int(monthlyWageText) ?? (WAGE_2026 * MONTH_HOURS) }

    // ⚠️ 2026-05-25 정합화 (사장님 audit):
    //   장기요양 = 임금의 0.9448% (= 건보료 × 13.14%). 근로자·사업주 각 절반 0.4724%.
    //   고용보험 실업급여 = 1.8% (각 0.9%). 사업주 추가 = 고용안정·직업능력개발 0.25%.
    //   이전 계산식 누락 / 과대:
    //     • 장기요양 사업주분 0.9% → 0.4724% 로 (절반만 사업주)
    //     • 고용보험 사업주 실업급여 0.9% 완전 누락 — 추가
    private var pensionEmployee: Int   { Int(Double(monthlyWage) * InsuranceRates2026.pensionEmployee) }
    private var healthEmployee: Int    { Int(Double(monthlyWage) * InsuranceRates2026.healthEmployee) }
    private var ltcareEmployee: Int    { Int(Double(healthEmployee) * InsuranceRates2026.longTermCareRateOfHealth) }  // 장기요양 = 건보료 × 13.14%
    private var employmentEmployee: Int { Int(Double(monthlyWage) * InsuranceRates2026.employmentEmployee) }
    private var employeeTotal: Int     { pensionEmployee + healthEmployee + ltcareEmployee + employmentEmployee }

    /// 사업주 부담 = 국민(4.75%) + 건강(3.595%) + 장기요양 사업주분(건보료×13.14%) + 산재(업종별, 100%)
    ///              + 고용보험 실업급여 사업주분(0.9%) + 고용안정·직업능력개발(0.25%, 사업주만)
    private var employerExtra: Int {
        Int(Double(monthlyWage) * (
            InsuranceRates2026.pensionEmployer
            + InsuranceRates2026.healthEmployer
            + InsuranceRates2026.healthEmployer * InsuranceRates2026.longTermCareRateOfHealth
            + accidentRateDecimal
            + InsuranceRates2026.employmentEmployer
            + InsuranceRates2026.employmentStabilityEmployer
        ))
    }

    private let pages = ["4대보험", "세무 세팅", "체크리스트", "마무리"]

    private var canCompleteStage: Bool {
        insRegDone && hometaxDone && !cpaChoice.isEmpty
    }

    private var advanceHint: String {
        if !insRegDone { return "4대보험 신고 완료를 체크하세요" }
        if !hometaxDone { return "홈택스 사업장 등록 완료를 체크하세요" }
        if cpaChoice.isEmpty { return "급여·세무 처리 방식을 선택하세요 (세무사 / 직접)" }
        return "보험·세무 셋업 완료 — 다음 단계로"
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "직원 채용 의무 — 근로계약·4대보험·급여 세팅",
            stageEyebrow: "단계 17 · 보험·세무 세팅",
            helperText: "1명 고용도 4대보험 의무 (5인 미만 예외 없음). 직원 입사일로부터 14일 이내 신고 — 미신고 시 과태료 100만원+.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                // cpaDecision 을 inputs 로 전달 → StageInputProjector 가 cpa_decision 컬럼에 자동 투영(웹 SSOT).
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["cpaDecision": cpaChoice])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["cpaDecision": cpaChoice])
            },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 4대보험 의무 이해", detail: "1인 고용부터 4대보험 의무 — 국민·건강·고용·산재 4축 이해"),
                .init(label: "2. 원천세 신고 일정", detail: "매월 10일 홈택스 원천세 신고·납부 + 자동이체 셋업"),
                .init(label: "3. 산재 요율 확인", detail: "업종별 0.7~5.6% 사업주 100% 부담 별도 계산"),
                .init(label: "4. 급여·유리한 길 점검", detail: "주휴수당·퇴직금 등 누락 시 차액·가산금 발생 인식"),
                ],
                verifyItems: [
                "1인 사장님 — 본인 국민연금·건강보험 「지역가입자」로 자동 전환, 사업자 신고 시 분리 가입",
                "직원 채용 14일 이내 4insure.or.kr 통합 신고 — 누락 시 과태료 + 소급 보험료 부담",
                "원천세 — 매월 10일 자동이체 셋업, 납부지연 시 미납세액 3% + 일 0.022% 가산세 (홈택스 자동납부 권장)",
                "산재보험 — 사업주 100% 부담 별도 계산, 업종별 요율 적용 (외식 0.8%, 미용 0.7% 수준)",
                "퇴직금 — 1년 근속 + 주 15시간 이상 의무, 매월 12분의 1 적립 권장 (분쟁 1순위)",
                "5인 이상 사업장 — 연차 의무 + 연장수당 1.5배 + 야간수당 1.5배 모두 추가 비용 (월 30~50만원/인)",
                ],
                nextStageLabel: "채용·운영 세팅",
                nextSummary: "4대보험·원천세·급여 시스템 셋업 완료 → 채용·운영 세팅 단계로 진입"
            ),
            currentPage: page,
            totalPages: pages.count
        ) {
            VStack(alignment: .leading, spacing: 16) {
                BUWizardPageNav(
                    page: page,
                    totalPages: pages.count,
                    labels: pages,
                    onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { page = newPage } }
                )

                Group {
                    switch page {
                    case 0: insurancePage
                    case 1: taxPage
                    case 2: checklistPage
                    default: EmptyView()  // 마무리 페이지 — BUStageShell 이 wrapup 표시
                    }
                }
            }
        }
    }

    // MARK: - pg 0 4대보험

    private var insurancePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("2026년 4대보험 요율 (정부 고시)")
                    let rates: [(String, String, String, String)] = [
                        ("국민연금",   "9.5%", "근로자 4.75% / 사업주 4.75%", "2026.1 인상 (9% → 9.5%)"),
                        ("건강보험",   "7.19%","근로자 3.595% / 사업주 3.595%", "2026.1 인상 (7.09% → 7.19%)"),
                        ("장기요양",   "임금의 0.9448%", "근로자·사업주 각 0.4724% (= 건보료 × 13.14%)", "건강보험료 기준이 아닌 임금 기준"),
                        ("고용보험",   "1.8%", "근로자 0.9% / 사업주 0.9% + 추가 0.25%↑", "추가 = 고용안정·직업능력개발 (사업주만)"),
                        ("산재보험",   String(format: "%.1f%%", accidentRate), "사업주 100% (근로자 부담 없음)", "\(cluster.categoryNounKo) 업종별 요율"),
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
                    Text("⚠️ 취득신고 시점에만 신청 가능 — 한 번 놓치면 재신청 불가. 청년·신규 사업주에겐 사업주 부담을 약 5%까지 낮추는 결정적 자금 여유.")
                        .font(BUFont.bodyCaption.weight(.semibold)).foregroundStyle(BUColor.midnightDeep).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            // 영업장 법정 의무보험 — 해당 업종일 때만. 직원 보험과 별개, 미가입 시 과태료.
            if !mandatoryIns.isEmpty {
                BUCard(.card) {
                    VStack(alignment: .leading, spacing: BUSpacing.sm) {
                        HStack(spacing: 6) {
                            Image(systemName: "shield.lefthalf.filled").foregroundStyle(BUColor.midnight).font(.system(size: 13))
                            Text("영업장 법정 의무보험").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                        }
                        Text("직원 4대보험과 별개 — 영업신고 전 가입 확인.").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                        ForEach(mandatoryIns, id: \.name) { ins in
                            VStack(alignment: .leading, spacing: 5) {
                                Text(ins.name).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                                if let cond = ins.condition {
                                    (Text("의무 기준 — ").font(BUFont.bodyCaption.weight(.bold)).foregroundColor(BUColor.midnight)
                                     + Text(cond).font(BUFont.bodyCaption).foregroundColor(BUColor.inkSecondary))
                                        .lineSpacing(2).fixedSize(horizontal: false, vertical: true)
                                }
                                HStack(alignment: .top, spacing: 6) {
                                    Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(BUColor.danger).font(.system(size: 11)).padding(.top, 1)
                                    Text(ins.penalty).font(BUFont.bodyCaption).foregroundStyle(BUColor.ink).lineSpacing(2)
                                }
                                .padding(BUSpacing.xs)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(BUColor.danger.opacity(0.06), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                                Text("가입 · \(ins.whereToGet)").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                Text("출처 · \(ins.source)").font(.system(size: 10.5)).foregroundStyle(BUColor.inkMuted)
                            }
                            .padding(.top, 2)
                        }
                    }
                }
            }

            warningCard(title: "사장님이 자주 빠지는 함정", items: [
                "현금 급여 지급 후 미신고 — 카드 매출(PCI) 분석으로 추적, 가산세 50%+",
                "친·인척 직원도 4대보험 신고 의무 (배우자·자녀 포함)",
                "알바 시급 신고 누락 — 일용직도 산재보험 의무 가입",
                "퇴사자 자격상실 신고 지연 — 사업주가 보험료 계속 부담",
            ], color: BUColor.danger)

            // 부담 시뮬레이션 (2026-05-25 정합화: 근로자 4축 모두 표시 + 합계)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("부담 시뮬레이션 (2026년 요율)")
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
                    Text("근로자 부담 (실수령액에서 차감)")
                        .font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                    HStack {
                        simRow(label: "국민연금", value: pensionEmployee)
                        Spacer()
                        simRow(label: "건강보험", value: healthEmployee)
                        Spacer()
                        simRow(label: "장기요양", value: ltcareEmployee)
                        Spacer()
                        simRow(label: "고용보험", value: employmentEmployee)
                    }
                    HStack {
                        Spacer()
                        simRow(label: "근로자 4축 합계", value: employeeTotal, highlight: true)
                    }
                    Divider()
                    HStack {
                        Spacer()
                        simRow(label: "사업주 추가 부담", value: employerExtra, highlight: true)
                    }
                    Text("※ 사업주는 위 급여 외에 추가로 \(formatKRW(employerExtra))을 매월 부담합니다 (산재 포함).")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
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

            // 직원 수별 유리한 길 (웹 PATH "당신 상황에 유리한 길" 1:1)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("직원 수별 유리한 길")
                    pathRow("1인 사업자 (직원 0)", "4대보험 신고 불필요 — 본인은 지역가입자",
                            "대표자 본인은 직장가입자 대상이 아님. 지역의보 + 지역연금으로 자동 가입. 본인을 임원으로 등재한 경우는 별개.")
                    pathRow("직원 1~2명 + 월급 270만 미만", "두루누리 80% 지원 + 수기 엑셀로 시작",
                            "신규 가입자면 두루누리로 보험료 80% 지원 → 사업주 부담 약 5%. 페이퍼워크는 엑셀+매월 신고로 충분. 첫 신고는 세무서 방문 권장.")
                    pathRow("직원 3~5명", "급여 SaaS (flex / 알밤) + 두루누리 + 반기납부",
                            "SaaS 월 5만 < 수기 실수 위험+시간 비용. 반기납부로 페이퍼워크 1/6. 두루누리 가능자는 반드시 신청. 세무사 위임은 5명부터 검토.")
                    pathRow("직원 6명 이상", "세무사 위임 적극 검토",
                            "월 10~30만 = 본인 시간 5시간 가치 이상. 부가세·종소세까지 통합 처리 + 세무조사 리스크 0. 매장 운영 집중이 ROI 높음.")
                    pathRow("알바·시급 직원만 운영", "일용근로자 신고 — 월 60시간 + 1개월 미만 기준",
                            "일용직은 산재만 의무. 월 60시간↑ + 1개월↑ 근무 시 4대보험 모두 의무. 시급 알바 늘릴 때 사회보험 부담 미리 계산.")
                }
            }
        }
    }

    private func pathRow(_ condition: String, _ recommendation: String, _ reason: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(condition).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
            HStack(alignment: .top, spacing: 6) {
                Image(systemName: "arrow.turn.down.right").font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.midnight).padding(.top, 2)
                Text(recommendation).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
            }
            Text(reason).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 7)
        .overlay(alignment: .top) { Divider().opacity(0.5) }
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
                        ("홈택스 회원가입·사업장 등록", "공동인증서 또는 금융인증서로 로그인 후 사업자 등록"),
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
                            Image(systemName: "lightbulb.fill").foregroundStyle(BUColor.warn).font(.system(size: 11))
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
                            Text("공동인증서 또는 금융인증서 필요").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
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
                "원천세 납부지연 시 미납세액 3% + 일 0.022% 가산세 — 매월 10일까지",
                "두루누리 신청 대상인지 확인 — 월보수 270만 미만 근로자",
            ], color: BUColor.danger)
        }
    }

    // MARK: - Helpers

    private func formatKRW(_ value: Int) -> String {
        "\(value.formatted())원"
    }

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
#Preview("InsuranceTaxSetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["insurance-tax-setup"] }
    return InsuranceTaxSetupStageView().environment(store)
}
#endif

//
//  InsuranceTaxSetupStageView.swift — 보험·세무 세팅 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/InsuranceTaxSetupStage.tsx
//  stageId: "insurance-tax-setup"
//
//  2026-07-21 웹·iOS 페이지 구조 통일:
//    웹 5페이지 ["왜 필요한가", "1. 4대보험", "2. 원천세", "3. 급여 + 유리한 길", "마무리"] 1:1.
//    pg 0 — WHY: 채용 시 자동 발생 의무 5가지 + 영업장 법정 의무보험
//    pg 1 — 4대보험 요율표 + 신고 절차 + 함정
//    pg 2 — 원천세 절차 + 매월 vs 반기 비교
//    pg 3 — 급여 시스템 3옵션 + 직원 수별 유리한 길 + 채용 직후 체크리스트
//    pg 4 — 마무리 (BUStageShell wrapup)
//
//  요율 표시는 FoundOneCore SSOT(InsuranceRates2026) → pctText 파생 (웹 RATE_STR 미러).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct InsuranceTaxSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var page = 0
    private let stageId = "insurance-tax-setup"

    // 세무 선택 — 온보딩(ExistingStoreRegistration)에서 복원되는 계약 키. "cpa"|"self".
    @AppStorage("insTax.cpaChoice")      private var cpaChoice        = ""
    @AppStorage("insTax.hometaxDone")    private var hometaxDone      = false
    @AppStorage("insTax.insRegDone")     private var insRegDone       = false

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }
    /// 업종별 산재요율 (%). 웹 SSOT: ACCIDENT_RATE_BY_CATEGORY.
    private var accidentRate: Double { cluster.accidentInsuranceRatePct }

    /// 소수 요율 → 표시 퍼센트 (0.0475 → "4.75%"). 후행 0 제거, 최대 4자리(장기요양 0.9448%).
    private func pctText(_ rate: Double) -> String {
        var s = String(format: "%.4f", rate * 100)
        while s.hasSuffix("0") { s.removeLast() }
        if s.hasSuffix(".") { s.removeLast() }
        return s + "%"
    }

    // ─── 표시용 요율 문자열 — 웹 RATE_STR 미러 (SSOT 파생) ───
    private var R: InsuranceRates2026.Type { InsuranceRates2026.self }
    private var pensionTotal: String { pctText(R.pensionEmployer + R.pensionEmployee) }        // 9.5%
    private var pensionHalf: String { pctText(R.pensionEmployer) }                             // 4.75%
    private var healthTotal: String { pctText(R.healthEmployer + R.healthEmployee) }           // 7.19%
    private var healthHalf: String { pctText(R.healthEmployer) }                               // 3.595%
    private var employmentTotal: String { pctText(R.employmentEmployer + R.employmentEmployee) } // 1.8%
    private var employmentHalf: String { pctText(R.employmentEmployer) }                       // 0.9%
    private var longTermOfWage: String { pctText((R.healthEmployer + R.healthEmployee) * R.longTermCareRateOfHealth) } // 0.9448%
    private var longTermOfHealth: String { pctText(R.longTermCareRateOfHealth) }               // 13.14%
    private var stabilityMin: String { pctText(R.employmentStabilityEmployer) }                // 0.25%

    // 영업장 법정 의무보험(직원 4대보험과 별개). SSOT: packages/shared mandatory-insurance.ts 미러.
    private var mandatoryIns: [MandatoryInsurance] {
        MandatoryInsuranceRegistry.forCategory(StarterIndustryData.option(by: industryId)?.categoryId)
    }

    // 웹 5페이지 1:1 — ["왜 필요한가", "1. 4대보험", "2. 원천세", "3. 급여 + 유리한 길", "마무리"]
    private let pages = ["왜 필요한가", "1. 4대보험", "2. 원천세", "3. 급여 + 유리한 길", "마무리"]

    private var canCompleteStage: Bool {
        insRegDone && hometaxDone
    }

    private var advanceHint: String {
        if !insRegDone { return "「1. 4대보험」에서 취득 신고 완료를 체크하세요" }
        if !hometaxDone { return "「2. 원천세」에서 신고 셋업 완료를 체크하세요" }
        return "보험·세무 셋업 완료 — 다음 단계로"
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "직원 채용 의무 — 근로계약·4대보험·급여 세팅",
            stageEyebrow: "단계 17 · 보험·세무 세팅",
            helperText: "1명 고용도 4대보험 의무 (5인 미만 예외 없음). 직원 입사일 기준 4대보험 취득 신고(건강 14일·기타 익월 15일) — 미신고 시 과태료 100만원+.",
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
                "직원 채용 시 4insure.or.kr 4대보험 취득 신고(건강 14일·기타 익월 15일) — 누락 시 과태료 + 소급 보험료 부담",
                "원천세 — 매월 10일 자동이체 셋업, 납부지연 시 미납세액 3% + 일 0.022% 가산세 (홈택스 자동납부 권장)",
                "산재보험 — 사업주 100% 부담 별도 계산, 업종별 요율 적용 (외식 0.8%, 미용 0.7% 수준)",
                "퇴직금 — 1년 근속 + 주 15시간 이상 의무, 매월 12분의 1 적립 권장 (분쟁 1순위)",
                "5인 이상 사업장 — 연차 의무 + 연장수당 1.5배 + 야간수당 1.5배 모두 추가 비용 (월 30~50만원/인)",
                ],
                nextStageLabel: "채용·운영 세팅",
                nextSummary: "4대보험·원천세·급여 시스템 셋업 완료 → 채용·운영 세팅 단계로 진입"
            ),
            currentPage: page,
            onNextPage: { withAnimation { page += 1 } },
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
                    case 0: whyPage
                    case 1: insurancePage
                    case 2: withholdingPage
                    case 3: payrollPathPage
                    default: EmptyView()  // 마무리 페이지 — BUStageShell 이 wrapup 표시
                    }
                }
            }
        }
    }

    // MARK: - pg 0 왜 필요한가 (웹 PAGE 0 1:1)

    private var whyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("왜 이 단계가 중요한가")
                    Text("직원 1명 채용 = 자동 발생 의무 5가지 (2026 변화 포함)")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                    let items: [(Color, String, String)] = [
                        (BUColor.danger,
                         "근로계약서 미체결 = 500만원 이하 벌금 또는 과태료",
                         "채용 당일 또는 출근 전 반드시 작성·교부. 임금·근로시간·휴일·휴가 등 핵심 조건 명시 의무. 표준근로계약서는 고용노동부에서 무료 다운로드 — 근로기준법 17조 위반 시 500만원 이하 벌금(정규직 형사처벌·인당) 또는 과태료(기간제·단시간)."),
                        (BUColor.midnight,
                         "4대보험 취득 신고(건강 14일·기타 익월 15일) — 5인 미만 예외 X",
                         "근로자 1명만 채용해도 4대사회보험 (국민연금·건강보험·고용·산재) 가입 의무. 건강보험 14일 / 국민연금·고용·산재 다음달 15일까지. 미신고 시 가산세 + 소급납부. 국세청 지급명세서와 공단 4대보험 자료 교차검증·근로자 확인청구(제보)로 무신고 적발."),
                        (BUColor.midnight,
                         "사업주 부담 = 급여의 약 10% 추가",
                         "근로자 월급 250만원이면 사업주가 추가 부담하는 4대보험료만 약 25만원. 인건비를 계산할 때 '급여 + 사업주 부담분' 으로 봐야 정확한 손익. 2026.1 인상 요율: 국민연금 \(pensionTotal) (각 \(pensionHalf))·건강보험 \(healthTotal) (각 \(healthHalf))·고용 \(employmentTotal) (각 \(employmentHalf))+사업주α·산재 0.7-0.8% (업종별)."),
                        (BUColor.midnightDeep,
                         "두루누리 80% 국가 지원 — 신고 시점에만 신청 가능",
                         "월 보수 270만원 미만 신규 가입자 + 10인 미만 사업장 = 고용·국민연금 보험료 80%를 정부가 최대 36개월 지원. 4대보험 취득신고 시 '두루누리 지원' 체크박스 — 한 번 놓치면 재신청 불가. 청년·신규 사업주에게 결정적인 자금 여유."),
                        (BUColor.midnight,
                         "2026 신규: 건강보험 연말정산 자동화",
                         "2026년부터 사업주가 국세청에 근로소득 간이지급명세서 제출하면 건강보험 연말정산 자동 연계. 기존 국세청 + 건강보험공단 각각 신고 → 1회 신고로 통합. 페이퍼워크 절감."),
                    ]
                    ForEach(items.indices, id: \.self) { i in
                        VStack(alignment: .leading, spacing: 0) {
                            HStack(alignment: .top, spacing: BUSpacing.sm) {
                                Circle().fill(items[i].0).frame(width: 8, height: 8).padding(.top, 5)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(items[i].1).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                                        .fixedSize(horizontal: false, vertical: true)
                                    Text(items[i].2).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                            if i < items.count - 1 {
                                Divider().opacity(0.5).padding(.leading, 18).padding(.top, BUSpacing.sm)
                            }
                        }
                    }
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
                        Text("직원 보험과 별개 — 미가입 시 과태료. 영업신고 전 확인").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
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
        }
    }

    // MARK: - pg 1 4대보험 (웹 PAGE 1 1:1 — 요율표 + 신고 절차 + 함정)

    private var insurancePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            // 요율표
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("2026년 4대보험 요율 (사업주 vs 근로자)")
                    Text("국민연금·건강보험·고용·산재 — 모두 2026년 인상 반영")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                    // 헤더
                    HStack(spacing: BUSpacing.sm) {
                        Text("보험 종류").frame(maxWidth: .infinity, alignment: .leading)
                        Text("사업주 부담").frame(width: 76, alignment: .trailing)
                        Text("근로자 부담").frame(width: 76, alignment: .trailing)
                    }
                    .font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                    let rows: [(String, String, String, String)] = [
                        ("국민연금", pensionHalf, pensionHalf, "2026년 \(pensionTotal)로 인상 (기존 9%)"),
                        ("건강보험", healthHalf, healthHalf, "2026년 \(healthTotal)로 인상 (기존 7.09%)"),
                        ("장기요양보험", "별도", "별도", "임금의 \(longTermOfWage) (= 건보료 × \(longTermOfHealth), 2026 인상)"),
                        ("고용보험", "\(employmentHalf) + α", employmentHalf, "α = 고용안정·직업능력개발 (사업주 \(stabilityMin)~0.85% 추가)"),
                        ("산재보험", String(format: "%.1f%%", accidentRate), "0%", "\(cluster.categoryNounKo) 업종별 요율 — 사업주 100% 부담"),
                    ]
                    ForEach(rows, id: \.0) { name, emp, ee, note in
                        VStack(alignment: .leading, spacing: 2) {
                            Divider().opacity(0.5)
                            HStack(alignment: .top, spacing: BUSpacing.sm) {
                                Text(name).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                Text(emp).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                                    .monospacedDigit().frame(width: 76, alignment: .trailing)
                                Text(ee).font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                                    .monospacedDigit().frame(width: 76, alignment: .trailing)
                            }
                            Text(note).font(.system(size: 10.5)).foregroundStyle(BUColor.inkMuted)
                        }
                    }
                }
            }

            // 신고 절차
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("신고 절차")
                    Text("다음 달 15일까지(건강보험은 14일 이내) — 4대사회보험 정보연계센터 일괄 신고")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                    stepRow(1, "4대사회보험 정보연계센터 회원가입",
                            "4insure.or.kr 접속 → 사업자등록번호 + 공동인증서·간편인증으로 가입")
                    stepRow(2, "사업장 성립신고 (최초 1회)",
                            "사업 개시일 · 업종 · 소재지 · 근로자 수 입력. 성립신고가 안 끝나면 근로자 신고 불가")
                    stepRow(3, "근로자 자격취득 신고 (직원당)",
                            "입사일 · 보수월액 · 주민번호 · 부양가족 정보 입력. 4가지 보험 동시 신고됨")
                    stepRow(4, "두루누리 지원 체크 (해당 시 자동 적용)",
                            "월 보수 270만 미만 + 10인 미만 사업장이면 신고 화면에서 '두루누리 지원' 체크. 고용보험·국민연금 80% 국가 지원 (36개월)")
                    Divider().opacity(0.5)
                    HStack(spacing: BUSpacing.xs) {
                        metaPair("기한", "익월 15일", "건강보험 14일")
                        metaPair("비용", "무료", "신고 자체")
                        metaPair("장소", "4insure.or.kr", nil)
                    }
                    HStack(spacing: 6) {
                        linkChip("4대사회보험 정보연계센터", "https://www.4insure.or.kr")
                        linkChip("산재보험 업종별 요율", "https://www.comwel.or.kr/comwel/paym/insu/chek1.jsp")
                    }
                    linkChip("두루누리 지원 확인", "https://www.4insure.or.kr")
                    // 게이트 — 실제 신고 완료 확인 (iOS 끝조건)
                    Divider().opacity(0.5)
                    Toggle(isOn: $insRegDone) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("4대보험 취득 신고 완료 (4insure.or.kr)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("건강 14일·기타 익월 15일 이내 필수").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                }
            }

            warningCard(title: "사장님이 자주 빠지는 함정", items: [
                "현금 급여 지급 후 미신고 — 국세청 지급명세서·공단 4대보험 자료 교차검증 및 근로자 확인청구로 적발, 가산세 + 소급납부",
                "친·인척 직원도 4대보험 신고 의무 (배우자·자녀 포함)",
                "알바 시급 신고 누락 — 일용직도 산재보험 의무 가입",
                "퇴사자 자격상실 신고 지연 — 사업주가 보험료 계속 부담",
            ])
        }
    }

    // MARK: - pg 2 원천세 (웹 PAGE 2 1:1)

    private var withholdingPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("원천세 — 매월 급여 지급 시 세금 공제")
                    Text("간이세액표로 자동 계산 → 다음 달 10일까지 홈택스 신고")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                    stepRow(1, "홈택스에서 간이세액표 조회",
                            "급여액 + 부양가족 수 입력 → 원천징수 세액 자동 산출. 부양가족 1명당 약 10만원 공제 효과")
                    stepRow(2, "매월 급여일에 원천징수",
                            "급여에서 [근로소득세 + 지방소득세 (소득세의 10%)] 공제 후 지급. 월급여 250만원 + 부양 1명 = 약 4.5만원 원천징수")
                    stepRow(3, "다음 달 10일까지 홈택스 신고·납부",
                            "홈택스 → 세금신고 → 원천세. 납부지연 시 미납세액 3% + 일 0.022% 가산세 (일할분 최대 10% 한도)")
                    stepRow(4, "반기납부 신청 검토 (상시근로자 20인 이하)",
                            "1월·7월 직전 6개월치 일괄 신고. 매월 신고의 부담 절반. 단 자금 흐름 관리 필요")
                    Divider().opacity(0.5)
                    HStack(spacing: BUSpacing.xs) {
                        metaPair("신고기한", "익월 10일", "매월")
                        metaPair("대안", "반기납부", "20인 이하")
                        metaPair("장소", "홈택스", nil)
                    }
                    HStack(spacing: 6) {
                        linkChip("홈택스 간이세액표", "https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&menuCd=index3")
                        linkChip("원천세 신고 매뉴얼", "https://www.nts.go.kr")
                    }
                    linkChip("반기납부 신청", "https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&menuCd=index3")
                    // 게이트 — 원천세 셋업 확인 (iOS 끝조건)
                    Divider().opacity(0.5)
                    Toggle(isOn: $hometaxDone) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("홈택스 원천세 신고 셋업 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("매월 10일 신고·납부 + 자동이체 권장").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }.tint(BUColor.midnight)
                }
            }

            // 매월 vs 반기 비교
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("매월 신고 vs 반기납부 — 어떤 게 유리?")
                    Text("자금 흐름 + 페이퍼워크 부담 vs 큰 일괄 납부")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                    HStack(alignment: .top, spacing: BUSpacing.sm) {
                        compareBox(
                            title: "매월 신고",
                            lines: ["✓ 매월 소액 납부 (자금 부담 적음)", "✓ 직원 입·퇴사 즉시 반영", "✗ 매월 페이퍼워크 (1-2시간/월)"],
                            bottom: "권장: 직원 5명+ 또는 변동 잦은 매장",
                            filled: false
                        )
                        compareBox(
                            title: "반기납부 (20인 이하)",
                            lines: ["✓ 1월·7월 연 2회만 신고", "✓ 페이퍼워크 부담 1/6", "✗ 큰 금액 일괄 납부 (자금 계획 필요)"],
                            bottom: "권장: 직원 1-3명, 안정적 운영",
                            filled: true
                        )
                    }
                }
            }
        }
    }

    // MARK: - pg 3 급여 + 유리한 길 (웹 PAGE 3 1:1)

    private var payrollPathPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            // 급여 지급 방식 3가지
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("급여 시스템 — 3가지 옵션 비교")
                    Text("매장 규모·예산·실수 리스크에 따라 선택")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                    payrollOption(icon: "doc.text",
                                  title: "수기 관리 (엑셀)",
                                  desc: "예스폼 급여대장 양식 활용. 4대보험·원천세 직접 계산. 실수 시 본인 책임. 무료지만 5명 넘어가면 위험.",
                                  cost: "무료", fit: "직원 1~2명")
                    payrollOption(icon: "building.2",
                                  title: "세무사 위임",
                                  desc: "월 수임료 10~30만원. 급여·4대보험·원천세·연말정산 전부 대행. 가장 안전. 세무 리스크 0. 부가세·종소세도 같이 가능.",
                                  cost: "월 10~30만", fit: "전 규모")
                    payrollOption(icon: "function",
                                  title: "급여 SaaS (flex, 알밤, 자비스)",
                                  desc: "자동 급여 계산 + 명세서 발송 + 4대보험 연동 + 출퇴근 기록. 직원 수 기반 과금. 3명+부터 손익 맞음. 단 세무사 대체는 아님.",
                                  cost: "월 0~5만", fit: "직원 3명+")
                }
            }

            // PATH — 사용자 상황별 유리한 길
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("당신 상황에 유리한 길")
                    Text("직원 수·매출·업종별 권장 시나리오")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                    pathRow("1인 사업자 (직원 0)", "4대보험 신고 불필요 — 본인은 지역가입자",
                            "대표자 본인은 직장가입자 대상이 아님. 지역의보 + 지역연금으로 자동 가입. 단, 본인 명의 사업장에 본인을 임원으로 등재한 경우는 별개.")
                    pathRow("직원 1~2명 + 월급 270만 미만", "두루누리 80% 지원 + 수기 엑셀로 시작",
                            "신규 가입자라면 두루누리로 보험료 80% 지원받음. 사업주 부담만 약 5%로 떨어짐. 페이퍼워크는 엑셀 + 매월 신고로 충분. 단, 실수 위험 큼 — 첫 신고는 세무서 방문 권장.")
                    pathRow("직원 3~5명", "급여 SaaS (flex / 알밤) + 두루누리 + 반기납부",
                            "SaaS 월 5만 < 수기 실수 위험 + 시간 비용. 반기납부로 페이퍼워크 1/6. 두루누리 가능자는 반드시 신청. 세무사 위임은 5명부터 검토.")
                    pathRow("직원 6명 이상", "세무사 위임 적극 검토",
                            "월 10-30만 = 본인 시간 5시간 가치 이상. 부가세·종소세까지 통합 처리되며 세무조사 리스크 0. 매장 운영에 집중하는 것이 ROI 높음.")
                    pathRow("알바·시급 직원만 운영", "일용근로자 신고 — 고용·산재는 1일만 일해도 의무",
                            "일용직도 고용·산재는 1일만 일해도 의무 가입(근로내용확인신고 익월 15일). 1개월 이상 + 월 8일 또는 60시간 이상이면 국민연금·건강까지 의무. '산재만'은 오해 — 고용보험 누락 시 과태료. 시급 알바 늘릴 때 사회보험 부담 미리 계산.")
                }
            }

            // 채용 직후 체크리스트
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        Image(systemName: "sparkles").foregroundStyle(BUColor.midnight).font(.system(size: 13))
                        Text("채용 직후 체크리스트").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                    }
                    let checklist = [
                        "채용 즉시: 근로계약서 작성 (필수, 미체결 시 500만원 이하 벌금·과태료)",
                        "익월 15일까지(건강보험 14일): 4대사회보험 정보연계센터 → 사업장 성립 + 근로자 취득 신고",
                        "두루누리 자동 적용 체크 (해당자만 — 신청 안 하면 자동 적용 안 됨)",
                        "첫 급여일 전: 홈택스 간이세액표로 원천세 계산법 숙지",
                        "첫 급여 지급일 다음 달 10일까지: 홈택스 원천세 신고·납부",
                        "반기납부 신청 검토 (20인 이하 + 안정적 운영 시)",
                        "직원 3명+ 시: 급여 SaaS 도입 또는 세무사 면담",
                    ]
                    ForEach(checklist.indices, id: \.self) { i in
                        HStack(alignment: .top, spacing: 8) {
                            Text("\(i + 1).").font(BUFont.bodyCaption.weight(.bold)).foregroundStyle(BUColor.midnight)
                            Text(checklist[i]).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }

            // 다음 단계 안내
            BUCard(.card) {
                HStack(alignment: .top, spacing: BUSpacing.sm) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .fill(BUColor.midnight.opacity(0.08))
                            .frame(width: 30, height: 30)
                        Image(systemName: "arrow.right").font(.system(size: 13, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("다음 단계: 채용 비용 계산기 + 채용·운영 세팅")
                            .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                        Text("보험·세무 시스템이 완성되면, 다음은 실제 채용 + 매장 운영 세팅. 채용 비용 계산기로 급여 + 4대보험 + 퇴직금까지 합한 실비를 미리 시뮬레이션 해보세요.")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }
    }

    // MARK: - Helpers

    private func stepRow(_ number: Int, _ title: String, _ detail: String) -> some View {
        HStack(alignment: .top, spacing: BUSpacing.sm) {
            ZStack {
                Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                Text("\(number)").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer()
        }
    }

    private func metaPair(_ label: String, _ value: String, _ sublabel: String?) -> some View {
        VStack(alignment: .center, spacing: 2) {
            Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
            Text(value).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                .lineLimit(1).minimumScaleFactor(0.7)
            if let sublabel {
                Text(sublabel).font(.system(size: 10.5)).foregroundStyle(BUColor.inkMuted)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private func linkChip(_ label: String, _ url: String) -> some View {
        Group {
            if let dest = URL(string: url) {
                Link(destination: dest) {
                    HStack(spacing: 5) {
                        Text(label).font(BUFont.bodyCaption.weight(.semibold))
                        Image(systemName: "arrow.up.right").font(.system(size: 9, weight: .bold))
                    }
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 12).padding(.vertical, 7)
                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        }
    }

    private func compareBox(title: String, lines: [String], bottom: String, filled: Bool) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(filled ? BUColor.midnightDeep : BUColor.midnight)
            ForEach(lines, id: \.self) { line in
                Text(line).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Text(bottom).font(BUFont.bodyCaption.weight(.bold)).foregroundStyle(BUColor.ink)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(BUSpacing.sm)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(filled ? BUColor.midnight.opacity(0.04) : BUColor.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(filled ? 0.18 : 0.10), lineWidth: 1)
        )
    }

    private func payrollOption(icon: String, title: String, desc: String, cost: String, fit: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: BUSpacing.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(BUColor.midnight.opacity(0.06))
                        .frame(width: 28, height: 28)
                    Image(systemName: icon).font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                }
                Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
            }
            Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 6) {
                Text(cost)
                    .font(.system(size: 11, weight: .bold)).foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 9).padding(.vertical, 3)
                    .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                Text("적합: \(fit)")
                    .font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.inkSecondary)
                    .padding(.horizontal, 9).padding(.vertical, 3)
                    .background(BUColor.ink.opacity(0.05), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
            }
        }
        .padding(BUSpacing.sm)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.10), lineWidth: 1)
        )
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

    @ViewBuilder
    private func warningCard(title: String, items: [String]) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.xs) {
                Text(title).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.danger)
                ForEach(items, id: \.self) { item in
                    HStack(alignment: .top, spacing: 6) {
                        Circle().fill(BUColor.danger).frame(width: 4, height: 4).padding(.top, 5)
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

//
//  RegistrationSetupStageView.swift — 사업자등록 + 인허가 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/RegistrationSetupStage.tsx
//  stageId: "registration-setup"
//
//  4-page (세그먼트):
//    pg 0 — 왜 중요한가
//    pg 1 — 1단계: 사업자등록 (홈택스)
//    pg 2 — 2단계: 인허가 (일반음식점 영업신고)
//    pg 3 — 유리한 길 (과세유형)
//
//  2026 법령:
//    간이과세 기준 1억 400만원 (부가세법 시행령 109조)
//    사업개시일 20일 이내 등록 의무
//    음식점 일반음식점 영업신고 비용 약 6.6만원
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpCore
import BuildUpData

public struct RegistrationSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    @State private var page = 0
    private let stageId = "registration-setup"
    @AppStorage("stage.regSetup.bizRegDone")    private var bizRegDone    = false
    @AppStorage("stage.regSetup.permitDone")    private var permitDone    = false
    @AppStorage("stage.regSetup.taxTypeChoice") private var taxTypeChoice = ""

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }

    private let pages = ["왜 중요한가", "사업자등록", "인허가", "유리한 길"]

    private var canCompleteStage: Bool {
        bizRegDone && permitDone && !taxTypeChoice.isEmpty
    }

    private var advanceHint: String {
        if !bizRegDone { return "사업자등록 완료 토글을 켜세요" }
        if !permitDone { return "영업신고증 발급 완료를 체크하세요" }
        if taxTypeChoice.isEmpty { return "과세유형을 선택하세요" }
        return "등록·인허가 완료 — 다음 단계로"
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "사업자 등록 및 인허가 신고",
            stageEyebrow: "단계 9 · 사업자등록·인허가",
            helperText: "사업자등록 → 인허가 → 오픈. 순서를 지키지 않으면 매출이 0원으로 묶입니다.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["taxTypeChoice": taxTypeChoice])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["taxTypeChoice": taxTypeChoice]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 상호·업태·종목 결정", detail: "상호 중복 검색 + 업태(소매·서비스 등) + 종목(세부 업종) 정확 매칭"),
                .init(label: "2. 사업자등록 신청", detail: "홈택스 온라인 또는 세무서 방문 — 임대차계약서·신분증 지참, 발급 평균 1~3일"),
                .init(label: "3. 영업신고·허가 신청", detail: "업종별 관할 보건소·구청·시청 — 식품접객업·미용업·체육시설업 등 카테고리별 분리"),
                .init(label: "4. 통장·카드단말기·홈택스 연동", detail: "사업자 통장 개설 + 카드단말기 신청 + 홈택스 공동인증서 등록"),
                ],
                verifyItems: [
                "사업자등록 — 개업일 기준 20일 이내 신청 (지연 시 가산세 + 부가세 매입세액 공제 불가)",
                "영업신고증 — 시설기준·위생교육·건강진단서 3개 모두 갖춰야 발급 (1개라도 누락 시 보완 통보)",
                "임대차계약서 — 사업자등록 시 제출용은 「확정일자」 받은 원본, 보증금 우선변제권 확보",
                "간이과세 vs 일반과세 — 연매출 1억 400만원 미만이면 간이 유리, 초기엔 일반 선택 후 매입세액 환급도 고려",
                "건강진단서·위생교육 — 식품접객업은 영업신고 전 필수 (보건소 또는 식품진흥원, 비용 1~3만원)",
                "다중이용시설 — 소방시설완비증명서·전기안전점검확인서 사전 발급 (영업신고 시 첨부)",
                ],
                nextStageLabel: "세무 가이드",
                nextSummary: "사업자등록·영업신고증 발급 완료 → 세무 가이드(부가세·종소세·간이과세) 단계로 진입"
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
                    case 0: whyPage
                    case 1: bizRegPage
                    case 2: permitPage
                    default: taxPathPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 왜

    private var whyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            whyCard(accent: BUColor.midnight,
                title: "법적 의무 — 미등록은 즉시 처벌",
                body: "사업개시일로부터 20일 이내 사업자등록 의무. 일반음식점 미신고 영업은 식품위생법 §97(6) — 3년 이하 징역 또는 3천만원 이하 벌금 + 폐쇄 명령.")

            whyCard(accent: .blue,
                title: "운영 인프라의 전제 조건",
                body: "사업자등록증 없으면 사업용 통장 개설, POS 가맹, 세금계산서 발행, 배달앱 입점이 모두 불가능합니다.")

            whyCard(accent: .red,
                title: "순서가 중요 — 순차 진행 필수",
                body: "① 임대차계약 → ② 사업자등록 → ③ 인허가 신고 → ④ 오픈. 위생교육·보건증은 사업자등록과 병행 가능(시간 절약).")
        }
    }

    private func whyCard(accent: Color, title: String, body: String) -> some View {
        BUCard(.card) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Circle().fill(accent).frame(width: 8, height: 8).padding(.top, 6)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    Text(body).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
            }
        }
    }

    // MARK: - pg 1 사업자등록

    private var bizRegPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: 4) {
                    BUEyebrow("1단계 · 사업자등록 (홈택스)")
                    Text("무료 · 1~3일 소요 · 사업개시 20일 이내 의무")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                }
            }

            BUCard(.card) {
                VStack(spacing: 0) {
                    stepRow(num: 1, title: "홈택스 접속 → 사업자등록 신청",
                        detail: "공동인증서·간편인증 로그인. 인증서 없으면 관할 세무서 직접 방문 (당일 발급 가능).")
                    stepRow(num: 2, title: "업종코드 입력 — 음식점 552111 (한식)",
                        detail: "국세청 업종코드 조회로 정확히 확인. 배달 전문도 동일 코드 사용 가능.")
                    stepRow(num: 3, title: "사업장 주소 = 임대차계약서 주소",
                        detail: "계약서 사본 첨부 필수. 주소 불일치 시 인허가 신청 거절.")
                    stepRow(num: 4, title: "과세유형 선택 — 간이 / 일반",
                        detail: "2026년 기준 직전년 매출 1억 400만원 미만 → 간이과세 가능. 초기 창업자 간이로 시작 권장.")
                    stepRow(num: 5, title: "제출 → 즉일~3일 발급 → 사업용 통장 개설",
                        detail: "등록증 발급 직후 사업용 통장·카드·POS 가맹 동시 신청.", isLast: true)
                }
            }

            // 완료 체크
            BUCard(.card) {
                Toggle(isOn: $bizRegDone) {
                    Text("사업자등록 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        }
    }

    // MARK: - pg 2 인허가 (cluster 별 분기)

    private var permitPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: 4) {
                    BUEyebrow("2단계 · \(cluster.categoryNounKo) 인허가")
                    Text("업종별 필수 인허가 \(cluster.requiredPermits.count)종 — 발급처·기간·핵심 요건")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                }
            }

            // 인허가 리스트 — IndustryCluster.requiredPermits 자동 매핑
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("필수 인허가 — \(cluster.categoryNounKo)")
                    ForEach(Array(cluster.requiredPermits.enumerated()), id: \.offset) { idx, permit in
                        if idx > 0 { Divider() }
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(alignment: .firstTextBaseline, spacing: 6) {
                                Text(permit.label)
                                    .font(BUFont.bodySmall.weight(.heavy))
                                    .foregroundStyle(BUColor.ink)
                                Spacer()
                                Text(permit.estimatedDays == 0 ? "즉시" : "\(permit.estimatedDays)일")
                                    .font(.system(size: 10, weight: .heavy))
                                    .foregroundStyle(BUColor.midnight)
                                    .padding(.horizontal, 6).padding(.vertical, 2)
                                    .background(BUColor.midnight.opacity(0.10), in: Capsule())
                            }
                            Text(permit.agency)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(BUColor.midnight)
                            Text(permit.detail)
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }

            // 핵심 주의 — 카테고리별
            BUCard(.card) {
                HStack(alignment: .top, spacing: BUSpacing.sm) {
                    Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(Color.red).font(.system(size: 16))
                    VStack(alignment: .leading, spacing: 4) {
                        Text("자주 거절·지연 사유").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(Color.red)
                        ForEach(permitPitfalls, id: \.self) { p in
                            HStack(alignment: .top, spacing: 6) {
                                Text("⚠").font(.system(size: 10)).padding(.top, 2)
                                Text(p).font(BUFont.bodyCaption).foregroundStyle(Color(red: 0.5, green: 0.1, blue: 0.1)).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $permitDone) {
                    Text("\(cluster.categoryNounKo) 인허가 발급 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        }
    }

    /// 카테고리별 자주 거절·지연되는 사유.
    private var permitPitfalls: [String] {
        switch cluster.category {
        case .food: return [
            "주방·객석 분리 안 됨 (벽·칸막이 의무)",
            "건축물 용도가 근린생활시설이 아닌 경우",
            "환기·하수·급수 시설 미비",
            "지하층·반지하 영업 시 별도 요건 적용",
        ]
        case .cafeDessert: return [
            "휴게음식점 / 일반음식점 구분 누락 — 주류 판매 시 일반 의무",
            "환기·식수 시설 미비",
            "건축물 용도 = 근린생활시설 (1·2종) 아닌 경우",
        ]
        case .beauty: return [
            "면허증 미보유 종사자 적발 (단속 1순위)",
            "위생교육 수료증 누락",
            "공중위생업 시설 기준 미충족 (세면대·소독기)",
        ]
        case .fitness: return [
            "체육시설업 신고 누락 — 자유업이지만 안전 점검 의무",
            "안전요원·강사 자격 미증명",
            "다중이용시설 소방·환기 기준 미달",
        ]
        case .education: return [
            "강사 자격 (정교사·보육교사 등) 미증명",
            "학원 면적 / 학생 수 비율 미준수",
            "비상구·소화기·CCTV 표준 미달",
        ]
        case .pet: return [
            "동물보호법 등록 누락 (시도청 동물보호과)",
            "동물 폐기물 처리 계약 미체결",
            "방음·환기 미달 — 짖음·냄새 이웃 민원",
        ]
        case .livingService: return [
            "공중위생업 신고 누락 (세탁업 등)",
            "폐수 처리 시설 미달 — 환경 기준 위반",
            "위생교육 수료증 누락",
        ]
        case .space: return [
            "방음·소음 기준 미달 — 이웃 민원 즉시 단속",
            "다중이용시설 소방안전 기준 미달",
            "쉐어오피스·코워킹의 경우 통신판매업 별도 신고",
        ]
        case .retail: return [
            "통신판매업 신고 누락 (옴니채널 동시 판매 시)",
            "KC 인증 없는 상품 판매 — 즉시 게시중지·과태료",
            "지하·2층 매장 소방 기준 미달",
        ]
        case .onlineDigital: return [
            "통신판매업 신고 전 사업자등록 미완료",
            "에스크로(구매안전서비스) 가입 누락",
            "KC 인증 없는 상품 — 게시중지·과태료",
            "개인정보처리방침 미게시 (PIPA 위반)",
        ]
        case .startupTech: return [
            "이용약관·개인정보처리방침 미게시 (PIPA 위반)",
            "결제 받는 SaaS 가 통신판매업 신고 누락",
            "상표·특허 공개 후 출원 (선출원주의 위반)",
        ]
        }
    }

    // MARK: - pg 3 유리한 길

    private var taxPathPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: 4) {
                    BUEyebrow("과세유형 — 첫 1년 손실 막는 결정")
                    Text("2026 간이과세 기준: 연매출 1억 400만원 미만")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                }
            }

            let paths: [(String, String, String)] = [
                ("예상 매출 4,800만 미만", "간이과세 + 부가세 면제 활용", "4,800만 미만은 부가세 납부 의무 자체 면제. 1년차 소형 매장에 가장 유리."),
                ("예상 매출 4,800만 ~ 1억 400만", "간이과세 (부가세율 1.5~4%)", "음식점 부가가치율 15% × 10% = 실질 1.5%. 일반과세 10% 대비 부담 큰 폭 감소."),
                ("예상 매출 1억 400만 초과", "일반과세 (자동) + 매입세액 환급", "간이과세 불가. 인테리어·장비·식자재 매입세액 환급 적극 활용."),
                ("B2B 거래 비중 높음", "처음부터 일반과세 등록", "간이과세는 세금계산서 발행 불가 → 거래처 매입세액 공제 불가 → 거래 거부 위험."),
            ]

            ForEach(paths, id: \.0) { condition, recommendation, reason in
                pathCard(condition: condition, recommendation: recommendation, reason: reason)
            }

            // 이번 주 체크리스트
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("이번 주 체크리스트 — 순서대로")
                    let checklist = [
                        "임대차계약서 + 건축물대장 (정부24 무료) 준비",
                        "홈택스 사업자등록 신청 (즉일~3일)",
                        "위생교육 온라인 수강 (외식업중앙회 / 2.6만원 / 6시간)",
                        "관할 보건소 방문 → 보건증 발급 (1.2만원 / 1주 내)",
                        "일반음식점 영업신고 접수 (구청 위생과)",
                        "현장점검 대응 → 영업신고증 수령",
                        "사업용 통장 + POS 가맹 신청",
                    ]
                    ForEach(checklist.indices, id: \.self) { i in
                        HStack(alignment: .top, spacing: 8) {
                            Text("\(i+1).")
                                .font(BUFont.eyebrow.weight(.bold))
                                .foregroundStyle(BUColor.midnight)
                                .frame(width: 18, alignment: .leading)
                            Text(checklist[i])
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    private func pathCard(condition: String, recommendation: String, reason: String) -> some View {
        BUCard(.card) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Text(condition)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                    .fixedSize(horizontal: false, vertical: true)
                VStack(alignment: .leading, spacing: 3) {
                    Text("→ " + recommendation)
                        .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    Text(reason)
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
            }
        }
    }

    // MARK: - Helpers

    private func stepRow(num: Int, title: String, detail: String, isLast: Bool = false) -> some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                ZStack {
                    Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                    Text("\(num)").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
                Spacer()
            }
            .padding(.horizontal, BUSpacing.md).padding(.vertical, 12)
            if !isLast {
                Divider().padding(.leading, 52)
            }
        }
    }
}

#if DEBUG
#Preview("RegistrationSetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["registration-setup"] }
    return RegistrationSetupStageView().environment(store)
}
#endif

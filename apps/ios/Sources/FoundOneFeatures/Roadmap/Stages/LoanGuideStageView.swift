//
//  LoanGuideStageView.swift — 대출 가이드 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared-tail/LoanGuideStage.tsx
//  stageId: "loan-guide"
//
//  2026-07-21 웹 재구성(5→3페이지) 미러 — 페이지 구성·콘텐츠 1:1:
//    pg 0 — 내 상황 진단 (진단 요약 + 예산별 추천 매트릭스 + 트랩)
//    pg 1 — 추천 자금 경로 (매칭 프로그램 + K-Startup 실시간 안내 + 트랩)
//    pg 2 — AI 사업계획서 (안내 + 성공 팁 + 트랩 + 검토 체크 + FAQ)
//
//  웹과 동일: advance 게이트 = 마지막 페이지 "검토 완료" 체크 1개 (2026-05-12 P0 패턴).
//  AI 사업계획서 생성 기능은 웹 전용 — iOS 는 동일 제목 페이지에 안내 콘텐츠 + AI 기본법 고지.
//
//  2026 검증 데이터 (웹 문자열 그대로):
//    - 소진공(SEMAS) 정책자금 기준금리 2.96% · 비수도권 -0.2%p
//    - 소상공인정책자금 신청: ols.semas.or.kr · 연초(1~2월) 신청 권장
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct LoanGuideStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    @State private var progFilter = "all"
    private let stageId = "loan-guide"

    // 웹 2026-05-12 P0 패턴 — 검토 완료 명시적 confirmation 이 유일한 advance 게이트.
    @AppStorage("loan.reviewDone")            private var reviewDone  = false
    @AppStorage("roadmap.selectedIndustryId") private var industryId  = ""
    @AppStorage("stage.startupType.selected") private var startupType = ""
    // 예산 단계에서 저장한 시설·창업비용 (원 단위) — 웹 selectedBudget 미러.
    @AppStorage("stage.budget.startupWon")    private var startupWon  = 0

    private var isStartup: Bool { IndustryCluster.from(industryId: industryId).isStartupTech }
    private var isOnline: Bool { IndustryCluster.from(industryId: industryId).isOnline } // 2026-07-05: 무점포 — 운영자본잠식 대신 정산주기

    private var categoryId: String? { StarterIndustryData.option(by: industryId)?.categoryId }

    // ── 예산 buckets (웹과 동일 — KRW 원 단위: ≤5천만 small / ≤2억 medium / 그 이상 large) ──
    private var budgetBucket: String {
        if startupWon <= 50_000_000  { return "small" }
        if startupWon <= 200_000_000 { return "medium" }
        return "large"
    }

    private var budgetLabel: String {
        guard startupWon > 0 else { return "예산 미입력" }
        if startupWon >= 100_000_000 {
            let eok = Double(startupWon) / 100_000_000
            let s = eok == eok.rounded() ? String(format: "%.0f", eok) : String(format: "%.1f", eok)
            return "\(s)억원"
        }
        let man = startupWon / 10_000
        let fmt = NumberFormatter()
        fmt.numberStyle = .decimal
        return "\(fmt.string(from: NSNumber(value: man)) ?? "\(man)")만원"
    }

    private let pages = ["내 상황 진단", "추천 자금 경로", "AI 사업계획서"]

    public init() {}

    // ── 페이지별 KEY ACTION (웹 keyActions 1:1 미러) ──
    private var pageKeyAction: BUStageKeyAction? {
        switch (isStartup, page) {
        case (true, 0):
            return .init(title: "지분 양보 전 비지분 자금부터 — TIPS 8억·예비창업 1억·청년창업 1억",
                         detail: "초기 밸류에이션 낮을 때 지분을 내어주면 수십억 손실. 무상 R&D 과제로 마일스톤 달성 후 시리즈 A를 노리세요.")
        case (true, 1):
            return .init(title: "K-Startup 통합공고 + TIPS 운영사 매칭으로 신청 시작",
                         detail: "K-Startup(k-startup.go.kr) → 모집공고 확인. TIPS는 149개 운영사 중 우리 분야 매칭이 핵심 — 운영사 선투자 → 정부 매칭 구조.")
        case (true, 2):
            return .init(title: "AI 사업계획서로 신청서 초안 30초 완성",
                         detail: "지금까지 입력한 업종·상권·재무 시뮬레이션 데이터 기반으로 PSST·청년창업사관학교 양식에 맞는 초안 자동 생성.")
        case (false, 0):
            return .init(title: "내 예산·업종·신용 상황을 입력하면 자금 경로가 자동 매칭됨",
                         detail: "소상공인(외식 등)은 5천만원 이하 소진공 직접대출(2.96%) → 5천~2억 지역신보 보증서 대출 → 그 이상은 소상공인 기준 초과 기업형 매장만 중진공(중소기업 대상), 일반 매장은 시중은행 시설자금. 비수도권 0.2%p 우대.")
        case (false, 1):
            return .init(title: "연초(1~2월) 신청 — 통합공고 직후 신규 예산이 가장 많을 때. 상반기 중 인기자금 소진 가능",
                         detail: "소상공인정책자금 누리집(ols.semas.or.kr) 방문 → 자격 확인 → 온라인 신청 → 현장 실사 1~2주 → 자금 집행.")
        case (false, 2):
            return .init(title: "AI 사업계획서로 신청서 초안 30초 완성 + 프린트 가능 PDF",
                         detail: "지금까지 입력한 업종·상권·재무 시뮬레이션 데이터 기반으로 정책자금 신청에 적합한 초안 자동 생성.")
        default:
            return nil
        }
    }

    // ── 트랩 (웹 traps 1:1 미러 — 페이지별 벽돌 경고) ──
    private var pageTraps: [(String, String)] {
        if isStartup {
            switch page {
            case 0: return [
                ("지분 먼저 내어주면 수십억 손실 — 비지분 자금부터", "초기 밸류 5억일 때 30% 지분 = 1.5억. 시리즈 A 밸류 50억 되면 그 30%가 15억. 무상 R&D로 마일스톤 달성하고 밸류 올리세요."),
                ("벤처인증·기보 보증 없이 시중은행 대출은 거의 불가", "스타트업은 매출·담보 부족 → 시중은행 거절 표준. 기보(kibo.or.kr) 기술평가 + 벤처인증으로 우회."),
            ]
            case 1: return [
                ("TIPS는 운영사 선투자가 필수 — 운영사 매칭 실패하면 끝", "149개 운영사 중 우리 분야와 맞는 곳 3-5곳에 동시 컨택 권장. 콜드 메일보다 네트워크 추천이 결정적."),
                ("여러 프로그램 동시 지원이 정답 — 단일 의존 X", "TIPS + 청년창업사관학교 + AI 바우처 + 지자체 = 동시 수혜 가능. 한 곳 떨어져도 백업."),
            ]
            default: return [
                ("사업계획서 '자금 사용 계획' 절대 '운전자금' 한 줄로 끝내지 마세요", "심사위원이 가장 중요시하는 섹션. 항목별 구체 금액(인건비 4억·R&D 2억·마케팅 1억) 명시 필수."),
                ("발표(피칭) 준비 없이 신청은 무용지물 — 30% 점수가 발표", "PSST 서류 통과 후 5분 발표. AI 사업계획서로 초안 만들고, 발표 자료는 직접 다듬어야 합격."),
            ]
            }
        } else {
            switch page {
            case 0: return [
                ("기존 고금리 대출이 있으면 대환대출(4.5%)부터 검토", "시중은행 6~10% 대출을 정책자금 4.5%로 전환 = 연 수백만원 절감. 신청 자격: 소상공인 + 6개월 이상 정상 상환 이력."),
                ("개인신용평점 하위 20%(NICE 744점·KCB 700점 이하)면 햇살론 우선 — 정책자금 거절 가능성", "신용등급제(1~10등급)는 2021년 폐지·신용점수제로 전환. 2026 햇살론 일반·특례로 개편, 저신용자 무담보 가능. 신용점수 먼저 확인 후 경로 선택."),
            ]
            case 1: return [
                ("신청서 '운전자금' 한 줄로 작성하면 거절 — 항목별 명시", "임차료 1천만 / 인건비 2천만 / 재고 1천만 / 마케팅 5백만 등 구체 금액. 정책자금 거절 1순위 사유."),
                ("재무제표 없으면 추정 손익 + 매출 시뮬레이션 첨부", "신규 창업자도 추정 매출·비용·BEP 분석으로 신청 가능. 재무 시뮬레이션 단계 결과 그대로 활용."),
            ]
            default: return [
                ("AI 생성 후 그대로 제출하지 말 것 — 본인 검토 필수", "AI 초안은 70% 완성도. 매장 특성·지역 상권·실제 인건비 등 본인 데이터로 다듬어야 합격률 ↑."),
                ("여러 프로그램 동시 신청 — 한 곳 거절돼도 백업", "무상 바우처는 대출과 병행 가능. 단, 정책자금(직접대출)과 보증서 대출은 같은 자금 용도면 기관별 기대출·보증 잔액이 한도에서 차감돼 전액 중복은 어려움 — 연동 여부 사전 확인. 단일 의존 X."),
            ]
            }
        }
    }

    // ── 예산별 추천 매트릭스 (웹 recommendations 1:1 미러) ──
    //   (title, bucket, rate, limit, why, url, primary)
    private var recommendations: [(String, String, String, String, String, String, Bool)] {
        if isStartup {
            return [
                ("예비창업패키지 / 청년창업사관학교", "1억 이하 시드 전", "무상 (갚지 않음)", "최대 1억",
                 "사업자등록 전·만 39세 이하·창업 3년 이내. 1월~2월 모집. 사업비 70% 지원 + 공간·교육·코칭",
                 "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do", true),
                ("TIPS (민간투자주도형)", "5억~8억 시드~프리A", "무상 + 매칭투자", "최대 8억 (R&D 5억 + 사업화 3억)",
                 "기술 기반 스타트업 핵심 트랙. 149개 운영사 중 매칭 → 운영사 선투자 → 정부 매칭. ※ 지분요건(창업기업 60%↑·운영사 30%↓)상 주식회사(법인) 전제 — 개인사업자는 법인 전환 후 신청",
                 "https://www.jointips.or.kr", false),
                ("AI·데이터·클라우드 바우처", "도입 비용 부담 시", "70~90% 정부 부담", "AI 3억 / 데이터 5천 / 클라우드 크레딧",
                 "사업계획서 간소 — 견적서 + 도입 계획만. 신청 진입 장벽 가장 낮음",
                 "https://www.nipa.kr", false),
                ("기보 + 시중은행 (지분 X)", "운영자금 1~5억", "보증료 0.5~1.5%", "최대 5억 무담보",
                 "기술보증기금 기술평가 → 보증서 → 시중은행 저금리 대출. 벤처인증 시 보증료 우대",
                 "https://www.kibo.or.kr/main/work/work010301.do", false),
            ]
        }
        switch budgetBucket {
        case "small":
            let second: (String, String, String, String, String, String, Bool) = isOnline
                ? ("소상공인 온라인 판로 지원사업", "상세페이지·쇼핑몰 입점·라이브커머스", "무상 (갚지 않음)", "상품성 개선·홍보 콘텐츠·채널 진출 지원",
                   "온라인 진출 준비~실전~도약 단계별 지원. 상세페이지·홍보영상·SNS 패키지",
                   "https://www.semas.or.kr", false)
                : ("소상공인 스마트화 / 디지털 바우처", "장비·POS·키오스크 도입 시", "무상 (갚지 않음)", "POS·키오스크 비용 70% 지원",
                   "선정률 10~30%. 견적서 + 도입 계획만 필요. 신청 진입 장벽 낮음",
                   "https://www.semas.or.kr/web/SUP01/SUP015001.kmdc", false)
            return [
                ("소상공인 정책자금 (소진공)", "5천만원 이하 추천 1순위", "연 2.96%~ (비수도권 -0.2%p)", "최대 7천만원",
                 "신규 창업자 + 무담보 가능 + 1~2년 거치. 시중 대비 2~3%p 저렴. 연초(1~2월) 신청이 신규 예산 가장 많음",
                 "https://ols.semas.or.kr/ols/man/SMAN018M/page.do", true),
                second,
                ("지자체 정책자금 + 신보 보증", "지역별 추가 지원", "1~2%대", "지자체별 최대 5천만원",
                 "서울신보·경기신보 등 지자체 보증재단. 본 정책자금과 중복 수혜 가능",
                 "https://www.kodit.or.kr/kodit/cm/cntnts/cntntsView.do?mi=2970&cntntsId=11307", false),
            ]
        case "medium":
            return [
                ("지역신보 보증 + 시중은행", "5천만~2억 추천 1순위", "보증료 0.5~1.5% + 은행 4~5%", "최대 2억 무담보",
                 "소상공인은 지역신용보증재단(지역신보)이 1순위 — 지자체별 소상공인 특화 보증. 보증서 발급 후 국민·신한·하나 등 시중은행 저금리 대출. (기술·중소기업은 신보·기보 병행 검토)",
                 "https://www.koreg.or.kr/", true),
                ("소상공인 일반경영안정자금", "운영자금 부족 시", "연 2.96%~", "최대 7천만원",
                 "정책자금 + 보증서 결합으로 1억+ 가능. 거치 1년·상환 4년",
                 "https://ols.semas.or.kr/ols/man/SMAN018M/page.do", false),
                ("대환대출 (기존 고금리 부채 시)", "기존 6~10% 대출 보유", "고정 4.5%", "기존 부채 한도",
                 "시중은행 6~10% → 정책자금 4.5%. 연 수백만원 이자 절감",
                 "https://ols.semas.or.kr/ols/man/SMAN018M/page.do", false),
            ]
        default:
            return [
                ("중진공 직접대출", "기업형(중소기업) 2억+", "연 2.0~4.5%", "최대 1억 (운영자금) / 시설 5억",
                 "성장기반·혁신성장촉진자금 — 중소기업(제조·기술 등) 대상. 소상공인(외식 5인 미만)은 원칙 제외, 소상공인 기준 초과·법인 전환 등 기업형만 해당. 사업계획서 정밀 평가",
                 "https://www.kosmes.or.kr/nsh/SH/SBI/SHSBI004M0.do", false),
                ("기보 + 시중은행 (대규모)", "시설·확장자금", "보증료 + 은행 3~5%", "최대 5억 무담보",
                 "기보 보증으로 시중은행 5억까지. 인테리어·장비·확장 시 활용",
                 "https://www.kibo.or.kr/main/work/work010301.do", false),
                ("정책자금 + 보증 + 바우처 패키지", "복합 수혜 전략", "혼합", "10억+",
                 "여러 자금을 결합 — 정책자금 7천 + 보증 2억 + 시설 3억 + 무상 바우처. 세무사·금융자문 동반 권장",
                 "https://www.kosmes.or.kr/nsh/SH/SBI/SHSBI004M0.do", false),
            ]
        }
    }

    // ── 매칭 프로그램 (웹 getMatchedProgramsV2({startupType, industryCategoryId}) + eligible 필터 미러.
    //    레지스트리 match() 가 만료(closed·마감일 경과) 제외까지 웹 isProgramExpired 와 동일 처리) ──
    private var matchedPrograms: [StartupProgramMatch] {
        let criteria = StartupProgramMatchCriteria(
            startupType: startupType.isEmpty ? nil : startupType,
            industryCategoryId: categoryId
        )
        return StartupProgramRegistry.match(criteria: criteria).filter { $0.eligible }
    }

    private var filteredPrograms: [StartupProgramMatch] {
        progFilter == "all" ? matchedPrograms : matchedPrograms.filter { $0.program.category == progFilter }
    }

    /// 게이트 — 웹과 동일: 마지막 페이지 검토 완료 체크 1개.
    private var canCompleteStage: Bool { reviewDone }

    private var advanceHint: String {
        reviewDone ? "자금 가이드 완료 — 다음 단계로" : "마지막 페이지에서 검토 완료 체크를 켜세요"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "대출 가이드",
            stageEyebrow: "단계 12 · 대출 가이드",
            helperText: "소상공인 정책자금 신규 예산은 1월 통합공고 직후(연초) 가장 많습니다. 인기자금은 상반기 중 소진 가능 — 빠른 신청이 유리.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["reviewed": "true"])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["reviewed": reviewDone ? "true" : "false"]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 자금 수요·구조 진단", detail: "초기 시설자금 vs 운영자금 분리 + 대출 vs 정부지원금 우선순위 결정"),
                .init(label: "2. 정책자금 후보군 매칭", detail: "소상공인시장진흥공단·지역신보·신보·기보 매칭 — 업종·기간·자본 자동 필터 (소상공인은 지역신보 1순위)"),
                .init(label: "3. 신용·재무 점검", detail: "개인신용 점수·기존 부채·연체 기록 사전 정리, 사업자 신용평가 사전 시뮬"),
                .init(label: "4. 신청 일정·서류 준비", detail: "사업계획서·매출 시뮬·자금 사용 계획 3종 + 추천 기관 면담 일정 확보"),
                ],
                verifyItems: [
                "정책자금 — 1순위는 「보증부 대출」 (지역신보·신보·기보 보증서 80~90% 보증)",
                isOnline
                    ? "자금 회전 — 채널별 정산 주기 차이(네이버 ~3일 · 쿠팡 최대 ~60일) 감안, 정산 느린 채널 비중 크면 사입 대금·광고비 선지출과 유입 시차로 자금 압박(「돈맥경화」)"
                    : "이자 부담 — 매출 0원 가정 6개월 운영자본 대비 월 이자 한계점 시뮬, 「운영자본 잠식」 1순위 부도 원인",
                "보증 한도 — 지역신보·신보·기보 통합 한도 인지 (개인/업종별 한도 상이), 다중 신청 시 보증 거절 위험",
                "사업계획서 — 「자금 사용 계획」 + 「상환 계획」 명확해야 심사 통과율 상승, 두루뭉술하면 거절",
                "정부지원금 — 「선정 후 입금」까지 평균 4~12주, 일정 역산 필수 (오픈 직전 신청 X)",
                "사기 주의 — 「대출 100% 보장」 「선수수료」 요구하는 브로커는 모두 사기, 직접 신청 원칙",
                ],
                nextStageLabel: isStartup ? "사업자등록·금융 세팅" : isOnline ? "상품 소싱 및 상세 페이지" : "메뉴·서비스 라인업 확정",
                nextSummary: "자금 구조·대출 후보 확정 → \(isStartup ? "사업자등록·금융 세팅" : isOnline ? "상품 소싱" : "메뉴·서비스 라인업 확정") 단계로 진입"
            ),
            currentPage: page,
            onNextPage: { withAnimation { page += 1 } },
            totalPages: pages.count,
            keyActionOverride: pageKeyAction
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
                    case 0: diagnosisPage
                    case 1: fundingPathPage
                    default: aiPlanPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 내 상황 진단

    private var diagnosisPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            // 진단 요약 (웹 "현재 진단된 상황" 그리드 미러)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("현재 진단된 상황")
                    let items: [(String, String)] = [
                        ("업종", isStartup ? "기술 스타트업" : (StarterIndustryData.option(by: industryId)?.titleKo ?? "미입력")),
                        ("운영 형태", startupType == "franchise" ? "프랜차이즈" : startupType == "independent" ? "개인 운영" : "미정"),
                        ("예산", budgetLabel),
                        ("런웨이", "미입력"),
                    ]
                    LazyVGrid(columns: [GridItem(.flexible(), alignment: .leading), GridItem(.flexible(), alignment: .leading)], spacing: BUSpacing.sm) {
                        ForEach(items, id: \.0) { label, value in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                                Text(value).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                            }
                        }
                    }
                }
            }

            // 예산별 추천 매트릭스 (웹 recommendations 미러)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack {
                        BUEyebrow("내 예산·상황 맞춤 추천")
                        Spacer()
                        if !isStartup && startupWon > 0 {
                            Text(budgetBucket == "small" ? "5천 이하" : budgetBucket == "medium" ? "5천~2억" : "2억+")
                                .font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                                .padding(.horizontal, 8).padding(.vertical, 3)
                                .background(BUColor.midnight, in: Capsule())
                        }
                    }
                    ForEach(recommendations, id: \.0) { title, bucket, rate, limit, why, url, primary in
                        recommendationRow(title: title, bucket: bucket, rate: rate, limit: limit, why: why, url: url, primary: primary)
                    }
                }
            }

            trapsSection
        }
    }

    @ViewBuilder
    private func recommendationRow(title: String, bucket: String, rate: String, limit: String, why: String, url: String, primary: Bool) -> some View {
        let inner = VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                if primary {
                    Text("추천 1순위").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                        .padding(.horizontal, 6).padding(.vertical, 2).background(BUColor.midnight, in: Capsule())
                }
                Text(bucket).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(primary ? BUColor.midnight : BUColor.inkMuted)
            }
            Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
            HStack(spacing: 10) {
                Text("금리 \(rate)").font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.midnight)
                Text("한도 \(limit)").font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.inkSecondary)
            }
            Text(why).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
        }
        .padding(BUSpacing.sm)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(primary ? BUColor.midnight.opacity(0.06) : Color.clear, in: RoundedRectangle(cornerRadius: 8, style: .continuous))

        if let dest = URL(string: url) {
            Link(destination: dest) { inner }.buttonStyle(.plain)
        } else {
            inner
        }
    }

    // MARK: - pg 1 추천 자금 경로

    private var fundingPathPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            // 매칭된 프로그램 (웹 "내 업종 맞춤 프로그램" 미러 — 동일 매처 V2)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("내 업종 맞춤 프로그램")
                    HStack(spacing: 6) {
                        ForEach([("all", "전체"), ("government", "정부"), ("private", "민간·재단"), ("local", "지자체")], id: \.0) { id, label in
                            let active = progFilter == id
                            Button {
                                withAnimation(.easeInOut(duration: 0.15)) { progFilter = id }
                            } label: {
                                Text(label)
                                    .font(.system(size: 11.5, weight: active ? .bold : .medium))
                                    .foregroundStyle(active ? .white : BUColor.inkSecondary)
                                    .padding(.horizontal, 12).padding(.vertical, 5)
                                    .background(active ? AnyShapeStyle(BUColor.midnight) : AnyShapeStyle(Color.clear), in: Capsule())
                                    .overlay(Capsule().stroke(active ? Color.clear : BUColor.midnight.opacity(0.12), lineWidth: 1))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    if filteredPrograms.isEmpty {
                        Text("현재 매칭된 프로그램이 없습니다.")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                            .frame(maxWidth: .infinity, alignment: .center)
                            .padding(.vertical, BUSpacing.md)
                    } else {
                        ForEach(filteredPrograms.prefix(12), id: \.program.id) { match in
                            programRow(match.program)
                        }
                        if filteredPrograms.count > 12 {
                            Text("외 \(filteredPrograms.count - 12)개 — 「지원금」 메뉴에서 전체 확인")
                                .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                        }
                    }
                }
            }

            // 실시간 K-Startup (웹은 API 자동 로드 — iOS 는 공식 공고 창구 링크로 안내)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("실시간 정부 지원사업 (K-Startup)")
                    Text(isStartup
                         ? "K-Startup 통합공고에서 모집 중인 창업 지원사업을 실시간으로 확인하세요. 웹 대시보드의 대출 가이드에는 실시간 공모가 자동 표시됩니다."
                         : "K-Startup 통합공고에서 모집 중인 소상공인 지원사업을 실시간으로 확인하세요. 웹 대시보드의 대출 가이드에는 실시간 공모가 자동 표시됩니다.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    if let url = URL(string: "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do") {
                        Link(destination: url) {
                            HStack(spacing: 6) {
                                Image(systemName: "arrow.up.right.square").font(.system(size: 12, weight: .semibold))
                                Text("K-Startup 모집공고 바로가기").font(BUFont.bodySmall.weight(.semibold))
                            }
                            .foregroundStyle(BUColor.midnight)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            trapsSection
        }
    }

    @ViewBuilder
    private func programRow(_ prog: StartupProgram) -> some View {
        let catLabel: String = {
            switch prog.category {
            case "government": return "정부"
            case "private":    return "민간·재단"
            case "local":      return "지자체"
            default:           return prog.category
            }
        }()
        let inner = HStack(alignment: .top, spacing: BUSpacing.sm) {
            Text(catLabel)
                .font(.system(size: 10, weight: .bold)).foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 7).padding(.vertical, 3)
                .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(prog.name.ko).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                Text(prog.target.ko).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                if let amount = prog.amount, !amount.isEmpty {
                    Text(amount).font(.system(size: 11, weight: .bold)).foregroundStyle(BUColor.midnight)
                }
                if prog.internalApply == true {
                    Text("→ 앱 「지원금」 메뉴에서 바로 신청")
                        .font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.midnight)
                }
            }
            Spacer(minLength: 0)
            if prog.internalApply != true, !prog.url.isEmpty {
                Image(systemName: "chevron.right").font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.inkSubtle)
            }
        }
        .padding(.vertical, 6)

        if prog.internalApply != true, let dest = URL(string: prog.url), !prog.url.isEmpty {
            Link(destination: dest) { inner }.buttonStyle(.plain)
        } else {
            inner
        }
    }

    // MARK: - pg 2 AI 사업계획서

    private var aiPlanPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            // 사업계획서 안내 (웹 "사업계획서 자동 생성" 카드 대응 — iOS 는 생성 기능 없이 안내)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: BUSpacing.sm) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 10, style: .continuous).fill(BUColor.midnight).frame(width: 36, height: 36)
                            Image(systemName: "doc.text").font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text("사업계획서 자동 생성").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                            Text("입력한 로드맵 데이터를 활용").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                    }
                    Text("지금까지 입력한 업종, 상권, 재무 시뮬레이션 데이터를 기반으로 정책자금·TIPS·청년창업사관학교 신청에 적합한 사업계획서를 자동 생성합니다.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    HStack(alignment: .top, spacing: 6) {
                        Image(systemName: "macbook").font(.system(size: 12)).foregroundStyle(BUColor.midnight).padding(.top, 1)
                        Text("AI 초안 생성은 웹 대시보드(대출 가이드 → AI 사업계획서)에서 가능합니다. 생성된 초안은 이 앱과 동일 계정으로 동기화된 로드맵 데이터를 사용합니다.")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                    .padding(BUSpacing.sm)
                    .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    // AI 기본법(2026-01-22 시행) 생성물 표시 — 웹 상시 라벨 문구 미러
                    Text("이 사업계획서는 생성형 AI가 작성한 초안입니다. 참고용이며, 제출 전 반드시 본인이 검토·수정하세요.")
                        .font(.system(size: 11)).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
                }
            }

            // 자금 조달 성공 팁 (웹 문자열 그대로)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("자금 조달 성공률을 높이는 핵심 팁")
                    let tips = [
                        "사업계획서 '자금 사용 계획'은 항목별 구체 금액을 적으세요 — '운전자금' 한 줄은 거절 1순위",
                        "재무 시뮬레이션을 먼저 돌리세요 — 손익분기 매출과 런웨이가 사업계획서의 근거",
                        "정책자금은 연초(1~2월)에 신청하세요 — 통합공고 직후 신규 예산이 가장 많고, 인기자금은 상반기 중 소진 가능",
                        "여러 프로그램에 동시 지원하세요 — 바우처는 병행 가능, 정책자금·보증서 대출은 한도 차감 등 중복 제한 있어 연동 확인 필요",
                    ]
                    ForEach(tips.indices, id: \.self) { i in
                        HStack(alignment: .top, spacing: 8) {
                            Text("\(i + 1).").font(BUFont.bodyCaption.weight(.heavy)).foregroundStyle(BUColor.midnight)
                            Text(tips[i]).font(BUFont.bodyCaption).foregroundStyle(BUColor.midnight.opacity(0.85)).lineSpacing(3)
                        }
                    }
                }
            }

            trapsSection

            // 검토 완료 체크 — 웹 2026-05-12 P0 게이트 미러 (마지막 페이지에만)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 6) {
                    Toggle(isOn: $reviewDone) {
                        Text("정책자금·대출 내용을 모두 검토했습니다")
                            .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }
                    .tint(BUColor.midnight)
                    Text("이 체크를 켜야 다음 단계로 진행할 수 있습니다. 위 내용을 충분히 읽고 본인 상황에 맞는 자금원을 식별했는지 확인하세요.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
            }

            // 대출 FAQ (웹 LoanFaqCard 미러)
            BULoanFAQCard()
        }
    }

    // MARK: - 공통 트랩 카드 (웹 TrapsCard 미러 — 벽돌색)

    private var trapsSection: some View {
        VStack(alignment: .leading, spacing: BUSpacing.xs) {
            ForEach(pageTraps, id: \.0) { label, text in
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 13, weight: .semibold)).foregroundStyle(BUColor.danger).padding(.top, 2)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(label).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.danger)
                        Text(text).font(BUFont.bodyCaption).foregroundStyle(BUColor.danger.opacity(0.85)).lineSpacing(2)
                    }
                }
                .padding(BUSpacing.sm)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.danger.opacity(0.04), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).stroke(BUColor.danger.opacity(0.14), lineWidth: 1))
            }
        }
    }
}

#if DEBUG
#Preview("LoanGuide") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["loan-guide"] }
    return LoanGuideStageView().environment(store)
}
#endif

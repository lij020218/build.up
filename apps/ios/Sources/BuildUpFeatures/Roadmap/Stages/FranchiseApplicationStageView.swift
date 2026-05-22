//
//  FranchiseApplicationStageView.swift — 프랜차이즈 가맹 절차 (iOS 네이티브, 웹 SSOT 미러)
//
//  웹 SSOT: apps/web/app/lib/components/stages/franchise/FranchiseApplicationStage.tsx
//  stageId: "franchise-application"
//
//  3-page 구조 (웹과 동일):
//    pg 0 — 왜 중요한가  (정보공개서·14일 숙려 핵심 이유 + 한국 가맹 통계)
//    pg 1 — 가맹 절차    (StageTaskRegistry 6 tasks 가 BUStageShell 하단에 자동 노출)
//    pg 2 — 정보공개서 검증 (4항목 점검 리스트 + 외부 링크)
//
//  진입 조건: startup-type 단계에서 "franchise" 선택 시 budget-setup 직후 자동 삽입.
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpCore
import BuildUpData

public struct FranchiseApplicationStageView: View {

    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("stage.franchise.selectedBrandId") private var franchiseBrandId = ""
    @State private var page = 0
    private let stageId = "franchise-application"

    private let pages = ["왜 중요한가", "가맹 절차", "정보공개서 검증"]

    public init() {}

    /// 게이트: 6-task 모두 체크되면 진행 가능 — StageTaskRegistry 가 자동 처리.
    /// 사장님이 BUStageTaskList 에서 직접 체크. canAdvance 는 항상 true (체크리스트는 추천이지 강제 아님,
    /// 웹과 동일 — 웹도 task 체크 안 해도 다음 진행은 허용하되 status 만 노출).
    private var canContinue: Bool { true }

    private var advanceHint: String {
        "가맹 절차 검토 — 다음 단계로 진행"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "프랜차이즈 가맹 절차",
            stageEyebrow: "단계 · 프랜차이즈",
            helperText: "가맹은 시스템 구매 — 본사가 보여주는 매출 자료보다 정보공개서 + 기존 점주 증언이 진짜 신호입니다.",
            canAdvance: canContinue,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId) },
            wrapup: BUStageWrapupData(
                doneItems: [
                    .init(label: "1. 정보공개서 검토", detail: "공정위 franchise.ftc.go.kr — 가맹점 수·폐점률·평균 매출·가맹비 4항목 직접 확인"),
                    .init(label: "2. 본사 미팅·교육", detail: "본사 담당자 직접 면담 + 가맹점 운영 교육 4~12주 일정 확인"),
                    .init(label: "3. 입지·계약 진행", detail: "본사 추천 입지 vs 자율 입지 비교 + 가맹계약서·인테리어 견적 검토"),
                    .init(label: "4. 가맹비·로열티 확정", detail: "가맹금·교육비·인테리어 강제·로열티 5년 총비용 시뮬"),
                ],
                verifyItems: [
                    "정보공개서 — 최근 3년 폐점률 30% 이상 브랜드 회피, 가맹점주 평균 운영기간 5년 미만 위험",
                    "가맹계약 14일 숙려기간 — 가맹사업법 의무, 본사가 압박 시 위반 (공정위 신고 가능)",
                    "인테리어 강제 — 본사 지정 업체만 가능 시 시장가 대비 30~50% 부풀림 흔함, 견적 비교 필수",
                    "필수 구매 비율 — 70% 이상이면 식자재 단가 협상력 X, 마진 압박 위험",
                    "영업지역 보호 — 반경 OO미터 내 추가 가맹점 금지 조항 명문화 (없으면 잠식 리스크)",
                    "본사 광고비 — 분담률·집행 내역 공개 의무, 불투명하면 가맹사업법 위반 신고 가능",
                ],
                nextStageLabel: "인테리어 시공",
                nextSummary: "정보공개서·계약서 검토 완료 → 인테리어 시공·운영 준비 단계로 진입"
            ),
            currentPage: page,
            totalPages: pages.count
        ) {
            VStack(alignment: .leading, spacing: 16) {
                BUWizardPageNav(
                    page: page,
                    totalPages: pages.count,
                    labels: pages,
                    onChange: { newPage in
                        withAnimation(.easeInOut(duration: 0.22)) { page = newPage }
                    }
                )

                Group {
                    switch page {
                    case 0: whyPage
                    case 1: processPage
                    default: verifyPage
                    }
                }
                .animation(.easeInOut(duration: 0.22), value: page)
            }
        }
    }

    // MARK: - Brand header (선택된 브랜드 표시)

    @ViewBuilder
    private var brandHeader: some View {
        if !franchiseBrandId.isEmpty,
           let info = FranchiseBrandRegistry.brand(by: franchiseBrandId) {
            BUCard(.card) {
                HStack(spacing: 10) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(LinearGradient(colors: [BUColor.midnight, BUColor.midnight.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 42, height: 42)
                        Text(String(info.name.ko.prefix(1)))
                            .font(.system(size: 17, weight: .heavy))
                            .foregroundStyle(.white)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(info.name.ko)
                            .font(.system(size: 16, weight: .heavy))
                            .tracking(-0.3)
                            .foregroundStyle(BUColor.ink)
                        Text("선택한 브랜드 — 가맹 절차를 단계별로 진행하세요")
                            .font(.system(size: 11.5, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                    Spacer()
                }
            }
        }
    }

    // MARK: - Page 0 — Why

    @ViewBuilder
    private var whyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.cardGap) {
            brandHeader

            BUCard(.outer) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(BUColor.midnight)
                        Text("왜 정보공개서·14일 숙려가 핵심인가")
                            .font(.system(size: 11, weight: .heavy))
                            .tracking(0.6)
                            .textCase(.uppercase)
                            .foregroundStyle(BUColor.midnight)
                    }

                    Text("가맹은 시스템 구매입니다. 본사가 보여주는 매출 자료보다 정보공개서 + 기존 가맹점주의 실제 증언이 진짜 신호입니다.")
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, 2)

                    Text("공정위가 14일 숙려기간을 의무화한 이유 — 가맹비 입금 전 사장님이 정보공개서를 충분히 읽고 결정할 시간을 강제로 확보하기 위함. 본사가 압박해도 신고 가능.")
                        .font(.system(size: 13))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: 10) {
                    BUEyebrow("한국 가맹 데이터")
                    factRow(tag: "가맹 분쟁 1위", body: "공정위 2024 가맹분야 분쟁조정 — '계약 해지 시 위약금·인테리어 강제' 32%")
                    factRow(tag: "3년 폐업률",    body: "가맹점 3년 폐업률 평균 30% — 정보공개서 미검토 사장님 폐업률 47% (KFA 2024)")
                    factRow(tag: "정보공개서 효과", body: "14일 숙려기간 활용한 사장님 분쟁률 11% vs 미활용 26% — 공정위 모니터링 보고서")
                    factRow(tag: "인테리어 강제",  body: "본사 지정 인테리어 평균 시장가 대비 30~50% 부풀림 — 공정위 시정명령 사례 다수")
                }
            }
        }
    }

    private func factRow(tag: String, body: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text(tag)
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(BUColor.midnight.opacity(0.10), in: RoundedRectangle(cornerRadius: 4, style: .continuous))
                .fixedSize()
                .padding(.top, 1)
            Text(body)
                .font(.system(size: 12.5))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Page 1 — Process (6 단계)

    @ViewBuilder
    private var processPage: some View {
        // 6 task 의 본문 narrative — 체크박스 자체는 BUStageShell 의 하단 BUStageTaskList 가 자동 렌더링.
        VStack(alignment: .leading, spacing: BUSpacing.cardGap) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 10) {
                    BUEyebrow("6단계 가맹 절차 — 시간·해설")
                    Text("각 단계의 의미와 핵심 포인트입니다. 하단 체크리스트에서 완료 표시.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineSpacing(2)

                    processStep(idx: 1, title: "본사 가맹 상담 신청",            time: "1~2주", detail: "본사 홈페이지·전화로 상담 예약. 사업 경험·자본금·희망 지역을 전달하고 가맹부 담당자 미팅.")
                    processStep(idx: 2, title: "정보공개서 수령·검토 (14일 숙려)", time: "14일",   detail: "가맹사업법 의무 제공 자료. 가맹점 수·폐점률·평균 영업이익·최근 3년 분쟁 이력 4항목을 직접 확인.")
                    processStep(idx: 3, title: "기존 가맹점 3곳 이상 방문",       time: "1주",    detail: "정보공개서 목록의 가맹점 직접 방문 — 실제 일매출·본사 지원 만족도·물류 문제를 점주에게 질문.")
                    processStep(idx: 4, title: "가맹계약 법률 검토",              time: "2~3일",  detail: "변호사·가맹거래사 자문 — 영업지역 보호·필수구매 비율·중도 해지 위약금 조항을 review.")
                    processStep(idx: 5, title: "가맹계약 체결 및 가맹비 납부",     time: "1일",    detail: "가맹비·교육비·인테리어비·로열티 조건 최종 확인. 중도 해지 위약금이 총 투자비 50% 초과면 재협상.")
                    processStep(idx: 6, title: "본사 교육 프로그램 이수",          time: "2~4주",  detail: "조리법·운영 매뉴얼·POS·위생 교육. 본사 매뉴얼이 부실하면 오픈 후 운영 사고 위험 ↑.")
                }
            }
        }
    }

    private func processStep(idx: Int, title: String, time: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            ZStack {
                Circle().fill(BUColor.midnight.opacity(0.10)).frame(width: 26, height: 26)
                Text("\(idx)")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(BUColor.midnight)
            }
            .padding(.top, 1)

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(title)
                        .font(.system(size: 13.5, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    Text(time)
                        .font(.system(size: 10.5, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(BUColor.midnight.opacity(0.08), in: Capsule())
                }
                Text(detail)
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, 4)
    }

    // MARK: - Page 2 — Verify

    @ViewBuilder
    private var verifyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.cardGap) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 12) {
                    BUEyebrow("정보공개서 핵심 4항목")
                    Text("공정위 franchise.ftc.go.kr 에서 직접 조회 가능. 본사가 제공하는 요약본만 보지 말고 PDF 전체 확인.")
                        .font(.system(size: 12))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)

                    verifyRow(label: "가맹점 수 추이",    detail: "최근 3년 신규 개점 / 폐점 / 명의변경 — 감소 추세면 위험")
                    verifyRow(label: "평균 영업이익",    detail: "본사가 광고하는 매출 ≠ 영업이익. 인건비·로열티·식자재 제외 후 실제 수익")
                    verifyRow(label: "최근 3년 분쟁 이력", detail: "공정거래조정원 분쟁 건수·내용 — 동일 분쟁 반복 시 본사 시스템 문제")
                    verifyRow(label: "가맹금·비용 내역",  detail: "가맹비 + 교육비 + 인테리어 강제 + 보증금 + 로열티 5년 총합 시뮬")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: 8) {
                    BUEyebrow("참고 링크")
                    linkRow(title: "공정위 정보공개서 조회",     url: "https://franchise.ftc.go.kr")
                    linkRow(title: "표준가맹계약서 양식 (공정위)", url: "https://www.ftc.go.kr/")
                    linkRow(title: "한국프랜차이즈산업협회",       url: "https://www.ikfa.or.kr/")
                }
            }
        }
    }

    private func verifyRow(label: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 14))
                .foregroundStyle(BUColor.midnight)
                .padding(.top, 2)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 13.5, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text(detail)
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }

    private func linkRow(title: String, url: String) -> some View {
        Link(destination: URL(string: url)!) {
            HStack {
                Text(title)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                Spacer()
                Image(systemName: "arrow.up.right")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(.plain)
    }
}

#if DEBUG
#Preview("FranchiseApplication") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["franchise-application"] }
    return FranchiseApplicationStageView().environment(store)
}
#endif

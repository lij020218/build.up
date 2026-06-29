//
//  OnlineRegistrationStageView.swift — 온라인 사업자 등록 (iOS 네이티브)
//
//  stageId: "online-registration"
//
//  2-page (segmented): 사업자등록 / 통신판매업 신고
//  Note: prefix "or2." 사용 — "reg." 와의 충돌 방지 (RegistrationSetupStageView)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct OnlineRegistrationStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "online-registration"

    @AppStorage("or2.bizRegDone")  private var bizRegDone  = false
    @AppStorage("or2.taxType")     private var taxType     = ""
    @AppStorage("or2.telecomDone") private var telecomDone = false
    @AppStorage("or2.done")        private var done        = false

    private let pages = ["사업자등록", "통신판매업 신고"]

    private struct TaxOption {
        let id: String; let name: String; let desc: String
    }

    private let taxOptions: [TaxOption] = [
        TaxOption(id: "simplified", name: "간이과세 (연매출 1억 400만원 미만 예상)", desc: "세금계산서 발행 불가(단, 직전 공급대가 4,800만원 이상은 발급 의무). 사업자 간 거래 제한. 초기 소규모에 적합."),
        TaxOption(id: "general",    name: "일반과세",                               desc: "세금계산서 발행 가능. 매입세액 공제. B2B 거래 필수."),
    ]

    public init() {}

    /// 게이트: 사업자등록 + 통신판매업 신고 완료.
    private var canCompleteStage: Bool { bizRegDone && telecomDone }

    private var advanceHint: String {
        if !bizRegDone { return "사업자등록 완료를 체크하세요" }
        if !telecomDone { return "통신판매업 신고 완료를 체크하세요" }
        return "등록 체크리스트 완료 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "사업자·통신판매 등록",
            stageEyebrow: "단계 7 · 온라인 사업자 등록",
            helperText: "온라인 사업자등록 = 스마트스토어 개설의 전제 조건. 홈택스에서 10분 만에 완료 가능.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["taxType": taxType])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["taxType": taxType]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 사업자등록 신청", detail: "홈택스 온라인 신청 — 업태·종목 「전자상거래 소매업」 + 임대차 없는 경우 자택 주소 가능"),
                .init(label: "2. 통신판매업 신고", detail: "관할 구청 또는 정부24 — 사업자등록증·구매안전서비스 이용 확인증 필요, 1~3일 발급"),
                .init(label: "3. 결제 PG·구매안전 가입", detail: "이니시스·KG이니시스·NICE 등 PG + 에스크로 또는 안심거래 의무"),
                .init(label: "4. 도메인·기본 셋업", detail: "스토어명 중복 검색 + 도메인 + 사업자 통장 + 카드 단말 셋업"),
                ],
                verifyItems: [
                "사업자등록 — 주소지 자택 가능하지만 임대차계약서 없으면 「확정일자」 못 받음, 보증금 보호 X",
                "통신판매업 신고 — 미신고 영업 시 1년 이하 징역 또는 1천만원 이하 벌금 (전자상거래법)",
                "구매안전서비스 — 결제 5만원 이상 거래는 에스크로 또는 보증서 의무, 위반 시 시정 명령",
                "표시·광고 — 「최저가」「1위」 등 비교 광고는 객관적 근거 필수, 위반 시 표시광고법 과징금",
                "청약철회 — 7일 이내 무조건 청약철회 의무 (예외: 맞춤제작·식품·디지털콘텐츠), 약관 명시 필수",
                "개인정보 처리방침 — 개인정보보호법 의무 게시 + 수집·이용·제공·파기 4항목 명문화",
                ],
                nextStageLabel: "공급처·소싱",
                nextSummary: "사업자등록·통신판매 신고 완료 → 공급처·소싱 단계로 진입"
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
                    case 0: bizRegPage
                    default: telecomPage
                    }
                }
            }
        }
    }

    // MARK: - Page 0: 사업자등록

    private var bizRegPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(spacing: 0) {
                    BUEyebrow("온라인 사업자등록 절차")
                        .padding(.bottom, BUSpacing.sm)
                    stepRow(num: 1, title: "홈택스(hometax.go.kr) → 신청/제출 → 사업자등록신청",
                            detail: nil)
                    stepRow(num: 2, title: "업태: 소매업 / 종목: 전자상거래 소매업",
                            detail: nil)
                    stepRow(num: 3, title: "개업일·사업장 주소·대표자 정보 입력",
                            detail: nil)
                    stepRow(num: 4, title: "보완 서류 없으면 당일~3일 내 발급",
                            detail: nil, isLast: true)
                }
            }

            BUHometaxLink()

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("세금 유형 선택")
                    VStack(spacing: BUSpacing.xs) {
                        ForEach(taxOptions, id: \.id) { opt in
                            taxButton(opt)
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $bizRegDone) {
                    Text("사업자등록 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        }
    }

    private func taxButton(_ opt: TaxOption) -> some View {
        let isSelected = taxType == opt.id
        return Button { taxType = opt.id } label: {
            HStack(spacing: BUSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08))
                        .frame(width: 26, height: 26)
                    Image(systemName: isSelected ? "checkmark" : "doc.text")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(isSelected ? .white : BUColor.inkMuted)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(opt.name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    Text(opt.desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
                Spacer()
            }
            .padding(BUSpacing.sm)
            .background(isSelected ? BUColor.midnight.opacity(0.05) : Color.clear, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous).strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 1.5))
        }
        .buttonStyle(.plain)
    }

    // MARK: - Page 1: 통신판매업 신고

    private var telecomPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("통신판매업 신고 — 왜 필요한가")
                    infoRow(text: "전자상거래 소비자 보호법에 따라 온라인으로 상품·서비스 판매 시 의무")
                    infoRow(text: "미신고 시 과태료 최대 1,000만원 (전자상거래법 §40)")
                    infoRow(text: "스마트스토어·쿠팡 등 플랫폼 입점 심사 시 신고증 요구")
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("신고 방법")
                    infoRow(text: "정부24 (gov.kr) 또는 관할 시·군·구청 온라인 접수")
                    infoRow(text: "필요 서류: 사업자등록증·통신판매 방법(인터넷·전화 등)")
                    infoRow(text: "처리 기간: 당일~5영업일 / 수수료 없음")
                }
            }

            BUCard(.card) {
                Toggle(isOn: $telecomDone) {
                    Text("통신판매업 신고 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("온라인 사업자 등록 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
            }
        }
    }

    // MARK: - Helpers

    private func stepRow(num: Int, title: String, detail: String?, isLast: Bool = false) -> some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                ZStack {
                    Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                    Text("\(num)").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    if let detail {
                        Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
                Spacer()
            }
            .padding(.horizontal, BUSpacing.md).padding(.vertical, 12)
            if !isLast {
                Divider().padding(.leading, 52)
            }
        }
    }

    private func infoRow(text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text("•").font(BUFont.bodyCaption).foregroundStyle(BUColor.midnight).padding(.top, 2)
            Text(text).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
        }
    }
}

#if DEBUG
#Preview("OnlineRegistration") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["online-registration"] }
    return OnlineRegistrationStageView().environment(store)
}
#endif

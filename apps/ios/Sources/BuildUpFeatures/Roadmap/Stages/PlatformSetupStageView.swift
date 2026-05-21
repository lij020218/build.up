//
//  PlatformSetupStageView.swift — 판매 플랫폼 선택 (iOS 네이티브)
//
//  stageId: "platform-setup"
//
//  2-page (segmented): 플랫폼 선택 / 셋업 체크리스트
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct PlatformSetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "platform-setup"

    @AppStorage("ps.platform")     private var platform     = ""
    @AppStorage("ps.businessReg")  private var businessReg  = false
    @AppStorage("ps.telecomSale")  private var telecomSale  = false
    @AppStorage("ps.pgConnected")  private var pgConnected  = false
    @AppStorage("ps.done")         private var done         = false

    private let pages = ["플랫폼 선택", "셋업 체크리스트"]

    private struct PlatformOption {
        let id: String; let name: String; let desc: String
    }

    private let platforms: [PlatformOption] = [
        PlatformOption(id: "smartstore", name: "네이버 스마트스토어", desc: "수수료 5.6%. 네이버 검색 연동 강점. 국내 1위 트래픽."),
        PlatformOption(id: "coupang",    name: "쿠팡",               desc: "로켓배송 입점 시 판매 급증. 단, 입점 심사 필요. 수수료 10-15%."),
        PlatformOption(id: "own",        name: "자체 쇼핑몰",         desc: "Shopify·카페24. 브랜드 구축에 유리. 트래픽은 직접 확보해야."),
        PlatformOption(id: "multi",      name: "멀티채널",             desc: "스마트스토어+쿠팡 동시 운영. 관리 부담은 증가."),
    ]

    public init() {}

    /// 게이트: 플랫폼 선택 완료.
    private var canCompleteStage: Bool { !platform.isEmpty }

    private var psChecksBinding: Binding<Set<String>> {
        Binding(
            get: {
                var s: Set<String> = []
                if businessReg { s.insert("biz") }
                if telecomSale { s.insert("telecom") }
                if pgConnected { s.insert("pg") }
                return s
            },
            set: { new in
                businessReg = new.contains("biz")
                telecomSale = new.contains("telecom")
                pgConnected = new.contains("pg")
            }
        )
    }

    private var advanceHint: String {
        if platform.isEmpty { return "판매 플랫폼을 선택하세요" }
        return "플랫폼 선택 완료 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "판매 플랫폼 선택",
            stageEyebrow: "단계 6 · 판매 플랫폼",
            helperText: "플랫폼 선택이 수수료·물류·고객 구조를 결정합니다. 첫 채널 하나에 집중 — 분산은 고객 100명 이후.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["platform": platform])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["platform": platform]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 판매 플랫폼 비교", detail: "스마트스토어·쿠팡·카카오·11번가 4축 수수료·MAU 비교"),
                .init(label: "2. 1차 플랫폼 결정", detail: "스마트스토어 우선 + 매출 안정 후 쿠팡 추가 순서 권장"),
                .init(label: "3. 멀티 채널 전략", detail: "2개 이상 운영 시 샵링커·올라 등 통합 솔루션 미리 검토"),
                .init(label: "4. 수수료·정산 시뮬", detail: "결제 수수료 + 카테고리 판매수수료 + 광고비 합산 마진 시뮬"),
                ],
                verifyItems: [
                "사업자등록 + 통신판매업 신고 사전 확인 — 스마트스토어 외 모든 플랫폼은 통신판매업 신고증 필수",
                "스마트스토어 — 일반과세자/간이과세자별 수수료 차이 + 매월 정산일·세금계산서 발급 일정",
                "쿠팡 — 월 정액비 55,000원 + 로켓그로스 입점 시 별도 수수료, 첫 매출 전 부담 인식",
                "오픈마켓 약관 — 분쟁 시 「플랫폼 책임 면책」 조항 다수, 사진·증빙 자체 보관 필수",
                "PG사 별도 — 일부 플랫폼은 자체 PG 강제, 통합 PG(이니시스·KG이니시스 등) 비교",
                "광고비 — 네이버 검색광고·쿠팡 광고 모두 ROAS 200% 이상 못 맞추면 적자, 단가 시뮬 필수",
                ],
                nextStageLabel: "온라인 사업자등록",
                nextSummary: "플랫폼 선택·개설 순서 확정 → 온라인 사업자등록·통신판매 신고 단계로 진입"
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
                    case 0: platformPage
                    default: checklistPage
                    }
                }
            }
        }
    }

    // MARK: - Page 0: 플랫폼 선택

    private var platformPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("주요 플랫폼 비교")
                    VStack(spacing: BUSpacing.xs) {
                        ForEach(platforms, id: \.id) { opt in
                            platformButton(opt)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("플랫폼별 수수료 비교")
                    feeRow(platform: "스마트스토어", fee: "결제수수료 3.74% + 네이버페이 수수료 = 약 5.6%")
                    feeRow(platform: "쿠팡 마켓플레이스", fee: "카테고리별 8-15%")
                    feeRow(platform: "자체 쇼핑몰 (카페24)", fee: "월 사용료 0-7만원 + PG 수수료 3%")
                }
            }
        }
    }

    private func platformButton(_ opt: PlatformOption) -> some View {
        let isSelected = platform == opt.id
        return Button { platform = opt.id } label: {
            HStack(spacing: BUSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.08))
                        .frame(width: 28, height: 28)
                    Image(systemName: isSelected ? "checkmark" : "storefront")
                        .font(.system(size: 12, weight: .semibold))
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

    private func feeRow(platform: String, fee: String) -> some View {
        HStack(alignment: .top, spacing: BUSpacing.sm) {
            Text(platform)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                .fixedSize(horizontal: false, vertical: true)
            Text(fee)
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
        }
    }

    // MARK: - Page 1: 셋업 체크리스트

    private var checklistPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUInteractiveChecklist(
                title: "온라인 커머스 필수 셋업",
                items: [
                    .init(id: "biz",     label: "사업자등록 완료",              detail: "통신판매업 신고용 — 홈택스에서 5분 무료 발급"),
                    .init(id: "telecom", label: "통신판매업 신고 완료",        detail: "공정위 ftc.go.kr 신고 — 법인 설립 후 14일 이내"),
                    .init(id: "pg",      label: "PG (결제 게이트웨이) 연동",   detail: "토스페이먼츠·KG이니시스·NHN KCP·나이스페이먼츠 중 선택"),
                ],
                checked: psChecksBinding
            )

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("통신판매업 신고 방법")
                    infoRow(text: "공정거래위원회 전자공정거래시스템 (ftc.go.kr) 온라인 신청")
                    infoRow(text: "필요 서류: 사업자등록증·대표자 신분증·통신판매 관련 정보")
                    infoRow(text: "처리 기간: 5-7 영업일")
                }
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("판매 플랫폼 셋업 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }
                .tint(BUColor.midnight)
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
#Preview("PlatformSetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["platform-setup"] }
    return PlatformSetupStageView().environment(store)
}
#endif

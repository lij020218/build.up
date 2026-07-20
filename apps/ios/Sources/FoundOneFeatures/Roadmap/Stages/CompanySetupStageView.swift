//
//  CompanySetupStageView.swift — 법인 설립·IP 보호 (iOS 네이티브)
//
//  stageId: "company-setup"
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct CompanySetupStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "company-setup"

    @State private var page = 0

    @AppStorage("cs.corpRegistered")  private var corpRegistered  = false
    @AppStorage("cs.patentFiled")     private var patentFiled     = false
    @AppStorage("cs.trademarkFiled")  private var trademarkFiled  = false
    @AppStorage("cs.bizAccount")      private var bizAccount      = false
    @AppStorage("cs.done")            private var done            = false

    private var currentInputs: [String: String] {
        ["corpRegistered": "\(corpRegistered)", "patentFiled": "\(patentFiled)", "trademarkFiled": "\(trademarkFiled)", "bizAccount": "\(bizAccount)", "done": "\(done)"]
    }

    private let pages = ["법인 설립", "IP 보호"]

    public init() {}

    /// 게이트: 법인 설립 결정 (등록) + IP 출원 계획 (특허 or 상표 중 하나).
    private var canCompleteStage: Bool {
        corpRegistered && (patentFiled || trademarkFiled)
    }

    private var advanceHint: String {
        if !corpRegistered { return "법인 설립 완료를 체크하세요" }
        if !(patentFiled || trademarkFiled) { return "IP 출원 (특허 또는 상표) 1개 이상 완료" }
        return "법인 + IP 출원 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "사업자등록 · 지식재산 보호 · 세무 기초",
            stageEyebrow: "단계 8 · 법인·IP",
            helperText: "법인은 MVP 직전에 설립하고, IP 출원은 MVP 공개 전에. 순서가 틀리면 IP 귀속 문제가 발생합니다.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: currentInputs)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: currentInputs) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 사업 형태 결정", detail: "개인사업자 vs 법인 — 매출·세금·투자 유치 고려 후 확정"),
                .init(label: "2. 사업자등록·법인 설립", detail: "홈택스 또는 등기소 — 자본금·이사·정관 작성"),
                .init(label: "3. 특허·상표 출원", detail: "핵심 IP·브랜드 사전 출원, 외부 노출 전 출원 완료"),
                .init(label: "4. 보안·약관·개인정보", detail: "이용약관·개인정보 처리방침·NDA·고용계약 사전 비치"),
                ],
                verifyItems: [
                "법인 vs 개인 — 투자 유치 시 법인 필수, 개인사업자는 투자·세제·신용 모두 한계",
                "정관 — 주식 종류·이사·감사·우선매수권 명문화, 모호하면 투자 유치 시 재작성",
                "특허·상표 — 외부 발표·전시 후 1년 grace period 한국만 적용, 해외는 출원 즉시 공개 시 특허성 상실",
                "투자자 친화 정관 — 우선주·전환사채·전환우선주 등 사전 정의, 미정의 시 투자 단계에서 재작성 비용",
                "스톡옵션 — 임직원 스톡옵션 풀 사전 확보 (보통 10~20%), vesting·exercise 조건 명문화",
                "개인정보 처리방침 — 개인정보보호법 의무 게시, 위반 시 매출 3% 이내 과징금",
                ],
                nextStageLabel: "MVP 빌드",
                nextSummary: "법인·특허·상표·약관 사전 셋업 완료 → MVP 빌드 단계로 진입"
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
                    case 0: corpPage
                    default: ipPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 법인 설립

    private var corpPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("법인 설립 절차")
                    let steps: [(String, String)] = [
                        ("상호 검색", "대법원 인터넷등기소 → 중복 확인"),
                        ("정관 작성 + 공증", "자본금 10억 미만 → 공증 생략 가능"),
                        ("법인등기", "법원 등기소 or 온라인 — 3-5 영업일"),
                        ("사업자등록", "홈택스, 법인등기 후 즉시"),
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

            BUHometaxLink()

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $corpRegistered) {
                        Text("법인 설립 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $bizAccount) {
                        Text("사업용 법인 통장 개설").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("법인 vs 개인사업자 비교 (2026년 세율)")
                    let rows: [(String, String, String)] = [
                        ("투자 유치", "✓ 가능", "✗ 불가"),
                        ("세율", "10·20·22·25%", "6~45%"),
                        ("설립 비용", "30~65만원", "무료"),
                        ("추천 시점", "팀 2명+ + 투자 계획", "1인 초기 검증"),
                    ]
                    // ⚠️ 2026.1.1 이후 사업연도부터 법인세 전 구간 1%p 인상 (9·19·21·24% → 10·20·22·25%).
                    HStack {
                        Text("").frame(maxWidth: .infinity, alignment: .leading)
                        Text("법인").font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight).frame(width: 90, alignment: .center)
                        Text("개인").font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.inkMuted).frame(width: 90, alignment: .center)
                    }
                    Divider()
                    ForEach(rows, id: \.0) { label, corp, individual in
                        HStack {
                            Text(label).font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).frame(maxWidth: .infinity, alignment: .leading)
                            Text(corp).font(BUFont.bodyCaption.weight(.semibold)).foregroundStyle(BUColor.midnight).frame(width: 90, alignment: .center)
                            Text(individual).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).frame(width: 90, alignment: .center)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 IP 보호

    private var ipPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("IP 우선순위")
                    let items: [(String, String, String)] = [
                        ("shield", "특허", "출원료 4.6~6.6만원/구분 + 등록 24,000원/년(1~3년차) + 우선심사 ₩160K. 일반 18-24개월·우선심사 5-7개월. 중소기업 자동 70% 감면 + 스타트업(3년 이내) 우선심사료 70% 감면."),
                        ("tag", "상표", "출원료 56,000~62,000원/구분·등록료 210,120원(10년). 일반 15개월·우선심사 5개월. 브랜드 모방 방지 핵심."),
                        ("doc.text", "저작권", "소스코드 자동 보호 (별도 등록 불필요). 분쟁 시 입증력 위해 저작권 등록(2만원/저작물) 권장."),
                    ]
                    ForEach(items, id: \.1) { icon, title, detail in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.08))
                                    .frame(width: 32, height: 32)
                                Image(systemName: icon)
                                    .font(.system(size: 14)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $patentFiled) {
                        Text("핵심 기술 특허 출원 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $trademarkFiled) {
                        Text("브랜드 상표 출원 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("과세 유형 (법인·개인 공통 핵심)")
                    let taxRows: [(String, String)] = [
                        ("간이과세자", "직전 연 매출 1억 400만원 미만 · VAT 1.5~4% · 4,800만원 미만 시 VAT 면제"),
                        ("일반과세자", "그 외 전부 · VAT 10% · 세금계산서 발급 가능 (B2B 필수)"),
                    ]
                    ForEach(taxRows, id: \.0) { label, detail in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(label)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(BUColor.midnight)
                                .padding(.horizontal, 8).padding(.vertical, 3)
                                .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                                .fixedSize(horizontal: true, vertical: true)
                            Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                    // B2B tech 경고 (2026-07-10, 웹 미러) — SW는 간이과세 배제 다수 + B2B 세금계산서·매입세액 환급 필요.
                    Text("⚠️ B2B SaaS·소프트웨어 개발/공급업은 간이과세 배제인 경우가 많고, 기업 고객 세금계산서 발급 + 초기 서버·인프라 매입세액 환급을 위해 일반과세가 유리·필요합니다 (법인은 자동 일반과세).")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.danger)
                        .lineSpacing(2)
                        .padding(.top, 2)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("IP 출원 기관")
                    let orgs: [(String, String, String)] = [
                        ("shield.checkered", "특허청 (kipo.go.kr) · KIPRIS (kipris.or.kr) 선행조사", "공개(데모·베타·보도자료) 전 출원 필수 — 신규성 상실"),
                        ("person.badge.shield.checkmark", "한국특허전략개발원", "스타트업 IP 바우처 최대 1000만원 지원"),
                    ]
                    ForEach(orgs, id: \.1) { icon, name, detail in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.08))
                                    .frame(width: 32, height: 32)
                                Image(systemName: icon).font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }
        }
    }
}

#if DEBUG
#Preview("CompanySetup") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["company-setup"] }
    return CompanySetupStageView().environment(store)
}
#endif

//
//  LoanGuideStageView.swift — 대출 가이드 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared-tail/LoanGuideStage.tsx
//  stageId: "loan-guide"
//
//  2026 검증 데이터:
//    - 소진공(SEMAS) 정책자금 기준금리: 2.96% (2026 기준)
//    - 소상공인정책자금 신청: ols.semas.or.kr
//    - 3~4월 신청 권장 (연간 예산 가장 많을 때)
//    - 비수도권 0.2%p 우대
//
//  3-page (세그먼트):
//    pg 0 — 예산별 자금 경로 매트릭스
//    pg 1 — 정책자금 기관 & 신청 방법
//    pg 2 — 대출 주의사항 & 체크리스트
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct LoanGuideStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0
    @State private var budgetText = "5000"

    @AppStorage("loan.pathSelected")     private var pathSelected     = ""
    @AppStorage("loan.reviewDone")       private var reviewDone       = false

    private var budgetWan: Int { Int(budgetText) ?? 5000 }
    private var budgetBucket: String {
        if budgetWan <= 5000  { return "small" }
        if budgetWan <= 20000 { return "medium" }
        return "large"
    }

    private let pages = ["자금 경로", "정책자금 기관", "주의사항"]

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
                                case 0: fundingPage
                                case 1: institutionPage
                                default: warningsPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("대출 가이드")
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

    // MARK: - pg 0 자금 경로

    private var fundingPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("대출 가이드 · 자금 경로")
                    Text("내 예산에 맞는 자금 경로 —\n3~4월 신청이 연중 최적")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("소상공인정책자금 연간 예산은 3~4월에 가장 많습니다. 하반기는 소진 가능 — 빠른 신청이 유리합니다.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("총 창업 자금 (만원)")
                    HStack(spacing: BUSpacing.md) {
                        TextField("예) 5000", text: $budgetText)
                            .font(BUFont.body).keyboardType(.numberPad)
                            .padding(.horizontal, 10).padding(.vertical, 8)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                        Text("만원")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("예산별 추천 자금 경로")
                    let paths: [(String, String, String, String, Bool)] = [
                        ("5천만원 이하", "소진공 직접 대출", "금리 2.96% (비수도권 -0.2%p). ols.semas.or.kr 온라인 신청. 현장 실사 1~2주 후 집행.", "small", budgetBucket == "small"),
                        ("5천만~2억원", "보증서 결합 대출", "신용보증기금(KODIT) or 기술보증기금(KIBO) 보증서 → 시중은행 대출. 정책금리 적용 가능.", "medium", budgetBucket == "medium"),
                        ("2억원 이상", "중진공 직접 대출", "중소벤처기업진흥공단 직접 대출 or IBK기업은행 소상공인 특화. 사업계획서 필수.", "large", budgetBucket == "large"),
                    ]
                    ForEach(paths, id: \.0) { range, name, detail, id, isMatch in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 6) {
                                Text(range).font(BUFont.eyebrow.weight(.bold))
                                    .foregroundStyle(isMatch ? BUColor.midnight : BUColor.inkMuted)
                                if isMatch {
                                    Text("내 상황").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                                        .padding(.horizontal, 6).padding(.vertical, 2)
                                        .background(BUColor.midnight, in: Capsule())
                                }
                            }
                            Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                        .padding(BUSpacing.sm)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(isMatch ? BUColor.midnight.opacity(0.06) : Color.clear, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                }
            }
        }
    }

    // MARK: - pg 1 정책자금 기관

    private var institutionPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("소상공인 정책자금 기관")
                    let orgs: [(String, String, String, String)] = [
                        ("소상공인진흥공단 (SEMAS)", "ols.semas.or.kr", "소상공인 직접 대출 2.96%. 창업 3년 이내 우대. 온라인 신청 → 현장 실사 → 집행.", "building.2"),
                        ("신용보증기금 (KODIT)", "kodit.co.kr", "신용 부족한 소상공인 보증서 발급 → 은행 대출 연계. 보증료 약 1%.", "shield.checkered"),
                        ("소상공인시장진흥공단", "semas.or.kr", "컨설팅·교육 병행. 경영 개선 자금 별도 운영.", "person.badge.shield.checkmark"),
                        ("IBK기업은행", "ibk.co.kr", "소상공인 특화 상품 多. 정책자금 연계 최강. 금리 협의 여지 있음.", "creditcard"),
                    ]
                    ForEach(orgs, id: \.0) { name, url, desc, icon in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous).fill(BUColor.midnight.opacity(0.08)).frame(width: 32, height: 32)
                                Image(systemName: icon).font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(url).font(.system(size: 10)).foregroundStyle(BUColor.midnight)
                                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("신청 절차 (소진공 기준)")
                    let steps: [(String, String)] = [
                        ("온라인 신청 (ols.semas.or.kr)", "자격 확인 → 필요 서류 업로드 → 신청 완료"),
                        ("현장 실사 (1~2주)", "소진공 직원 방문 — 사업장·서류 확인"),
                        ("자금 집행 (심사 통과 후)", "사업자 통장으로 직접 입금"),
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
                    Text("준비 서류: 사업자등록증·임대차계약서·사업계획서·대표자 신분증·통장 사본")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).padding(.top, 4)
                }
            }
        }
    }

    // MARK: - pg 2 주의사항

    private var warningsPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            warningCard(title: "대출 레드플래그 — 하지 말아야 할 것", items: [
                "보증금·월세 대출로 충당 → 매출 발생 전 이자 부담 = 폐업 가속",
                "카드론·대부업 고금리 → 10% 이상 금리는 사업 수익으로 감당 불가",
                "과다 차입 → 원리금 > 월 수익의 30% = 존폐 위기",
                "개인 명의 대출로 사업자금 = 세금·보증 불이익 + 개인 신용 훼손",
            ], color: .red)

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("현명한 대출 원칙")
                    let principles: [(String, String)] = [
                        ("운영자금이 아닌 투자자금", "설비·인테리어 등 자산 형성 용도로만. 월세·인건비는 매출로 감당해야."),
                        ("원리금 ≤ 월 예상 매출의 15%", "음식점 평균 순이익률 10~15% — 대출 이자가 이를 초과하면 구조적 손실."),
                        ("정책자금 우선, 시중은행 나중", "소진공 2.96% vs 시중은행 5~8% — 금리 차이가 수년간 수백만원 차이."),
                    ]
                    ForEach(principles, id: \.0) { title, detail in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "lightbulb.fill").foregroundStyle(.orange).font(.system(size: 11)).padding(.top, 2)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $reviewDone) {
                    Text("대출 가이드 검토 및 자금 계획 확정").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
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

#if DEBUG
#Preview("LoanGuide") { LoanGuideStageView() }
#endif

//
//  BizRegistrationStageView.swift — 사업자등록 최종 확인 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/BizRegistrationPanel.tsx
//  stageId: "biz-registration"
//
//  고유 가치 (이전 단계와 중복 없는 내용):
//    1. 상호명 (가게 이름) 최종 확정
//    2. 사업용 통장 개설 가이드 (IBK·카카오뱅크·우리은행·신한)
//    3. 이전 단계 결정 요약 (read-only)
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct BizRegistrationStageView: View {

    @Environment(\.dismiss) private var dismiss

    @AppStorage("biz.storeName")         private var storeName        = ""
    @AppStorage("biz.bankDone")          private var bankDone         = false
    @AppStorage("biz.storeNameFinal")    private var storeNameFinal   = false

    // 이전 단계 상태 (read-only 요약용)
    @AppStorage("reg.bizRegDone")        private var bizRegDone       = false
    @AppStorage("reg.taxTypeChoice")     private var taxTypeChoice    = ""
    @AppStorage("hiring.contractDone")   private var contractDone     = false

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.lg) {
                        heroBanner.padding(.horizontal, BUSpacing.md)
                        previousDecisions.padding(.horizontal, BUSpacing.md)
                        storeNameSection.padding(.horizontal, BUSpacing.md)
                        bankSection.padding(.horizontal, BUSpacing.md)
                        Spacer(minLength: BUSpacing.xxxl)
                    }
                    .padding(.top, BUSpacing.md)
                }
            }
            .navigationTitle("사업자등록 최종 확인")
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

    // MARK: - Hero

    private var heroBanner: some View {
        BUCard(.hero) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("단계 10 · 사업자등록 최종 확인")
                Text("이 단계에서 꼭 할 일 —\n사업용 통장 + 상호명 최종 확정")
                    .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                Text("사업자등록·과세유형·세무사 결정은 이전 단계에서 완료. 이 단계는 마지막 두 가지 — 사업용 통장과 상호명 — 만 처리합니다.")
                    .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
            }
        }
    }

    // MARK: - 이전 결정 요약 (read-only)

    private var previousDecisions: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("이전 단계에서 결정된 사항")
                let decisions: [(String, String, Bool)] = [
                    ("사업자등록·영업신고", "10번 단계 — 홈택스 또는 세무서", bizRegDone),
                    ("과세유형 결정 (간이/일반)", taxTypeChoice.isEmpty ? "11번 단계 세무 가이드" : "선택: \(taxTypeChoice == "simplified" ? "간이과세" : "일반과세")", !taxTypeChoice.isEmpty),
                    ("근로계약서 작성·교부", "16번 단계 — 채용 설정", contractDone),
                ]
                ForEach(decisions, id: \.0) { label, hint, done in
                    HStack(spacing: BUSpacing.sm) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                .fill(done ? BUColor.success.opacity(0.12) : BUColor.midnight.opacity(0.06))
                                .frame(width: 32, height: 32)
                            Image(systemName: done ? "checkmark.circle.fill" : "clock")
                                .font(.system(size: 14)).foregroundStyle(done ? BUColor.success : BUColor.inkMuted)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text(label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text(hint).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                        Spacer()
                        Text(done ? "완료" : "미확인")
                            .font(BUFont.eyebrow.weight(.bold))
                            .foregroundStyle(done ? BUColor.success : BUColor.inkMuted)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background((done ? BUColor.success : BUColor.inkSubtle).opacity(0.12), in: Capsule())
                    }
                }
            }
        }
    }

    // MARK: - 상호명

    private var storeNameSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("상호명 (가게 이름) 최종 확정")
                TextField("예) 연남동 삼겹집, 홍대 떡볶이", text: $storeName)
                    .font(BUFont.body)
                    .padding(.horizontal, 10).padding(.vertical, 10)
                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                Text("사업자등록증·간판·메뉴판·SNS·세금계산서까지 모두 동일한 이름을 사용합니다. 등록 후 변경 시 등록증 재발급이 필요하므로 신중히 확정하세요.")
                    .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                Toggle(isOn: $storeNameFinal) {
                    Text("상호명 최종 확정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }

    // MARK: - 사업용 통장

    private var bankSection: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.red).font(.system(size: 13))
                    VStack(alignment: .leading, spacing: 2) {
                        Text("개인 통장과 사업 통장은 반드시 분리")
                            .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(.red)
                        Text("혼용 시 세무조사에서 사업 비용 입증 불가 → 전부 과세 대상. 사업자등록증 발급 직후 즉시 개설하세요.")
                            .font(BUFont.bodyCaption).foregroundStyle(Color(red: 0.7, green: 0.1, blue: 0.1)).lineSpacing(2)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("사업용 통장 추천 (소상공인)")
                    let banks: [(String, String, String)] = [
                        ("기업은행 IBK", "소상공인 특화 상품 多 · 정책자금 연계 유리 · 전국 지점", "정책자금 연계"),
                        ("카카오뱅크 사업자", "비대면 즉시 개설 · 수수료 0원 · 앱 거래 관리 간편", "비대면"),
                        ("우리은행 위비기업", "지역 네트워크 강점 · 세무사·노무사 무료 상담 포함", "상담 포함"),
                        ("신한은행 SOL Biz", "디지털 전환 강점 · 신한카드 결제 단말 연계", "디지털"),
                    ]
                    ForEach(banks, id: \.0) { name, desc, badge in
                        HStack(spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.08)).frame(width: 36, height: 36)
                                Image(systemName: "building.columns").font(.system(size: 15)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 6) {
                                    Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                    Text(badge).font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(BUColor.midnight)
                                        .padding(.horizontal, 6).padding(.vertical, 2)
                                        .background(BUColor.midnight.opacity(0.08), in: Capsule())
                                }
                                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").font(.system(size: 11)).foregroundStyle(BUColor.inkSubtle)
                        }
                    }
                    Text("준비물: 사업자등록증 원본 · 대표자 신분증 · 도장 (선택)")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).padding(.top, 4)
                }
            }

            BUCard(.card) {
                Toggle(isOn: $bankDone) {
                    Text("사업용 통장 개설 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("BizRegistration") { BizRegistrationStageView() }
#endif

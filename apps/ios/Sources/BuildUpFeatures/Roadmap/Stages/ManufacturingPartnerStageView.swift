//
//  ManufacturingPartnerStageView.swift — 양산 파트너 선정 (iOS 네이티브)
//
//  stageId: "manufacturing-partner"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct ManufacturingPartnerStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("mfg.emsSelected")  private var emsSelected  = false
    @AppStorage("mfg.auditDone")    private var auditDone    = false
    @AppStorage("mfg.firstRunQty")  private var firstRunQty  = ""
    @AppStorage("mfg.done")         private var done         = false

    private let pages = ["EMS 선정", "첫 양산 계획"]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
                    Picker("탭", selection: $page) {
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
                                case 0: emsPage
                                default: productionPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("양산 파트너 선정")
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

    // MARK: - pg 0 EMS 선정

    private var emsPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("양산 파트너 선정")
                    Text("EMS 파트너 = 하드웨어 스타트업의 공장\n관계가 제품 품질을 결정")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("EMS(Electronics Manufacturing Services): 설계 외 제조 전체를 위탁하는 파트너")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("EMS 선정 기준")
                    let items = [
                        "최소 주문 수량(MOQ): 초기엔 500개 이하 가능한 곳",
                        "소통 능력: 영어/한국어 PM 보유 여부",
                        "포트폴리오: 유사 제품 생산 경험",
                        "위치: 중국(선전/쑤저우) vs 국내(경기·충남) — 단가·QC 트레이드오프",
                    ]
                    ForEach(items, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "circle.fill").font(.system(size: 5)).foregroundStyle(BUColor.inkMuted).padding(.top, 5)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("국내외 EMS 유형")
                    let types: [(String, String, String)] = [
                        ("국내 소규모", "100–500개 소량 생산 가능. 단가 높음. 소통 쉬움."),
                        ("중국 대형 EMS", "선전 지역. 1,000개 이상. 단가 낮음. 품질 관리 직접 필요."),
                        ("ODM", "기존 제품 베이스로 커스터마이징. 개발 비용 절감."),
                    ].map { ($0.0, $0.0, $0.1) }
                    ForEach(types, id: \.0) { _, label, desc in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(label).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                            Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $emsSelected) {
                        Text("EMS 파트너 선정 완료 (견적 3곳 이상 비교)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $auditDone) {
                        Text("공장 방문·감사(Audit) 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }

    // MARK: - pg 1 첫 양산 계획

    private var productionPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("첫 양산 수량 결정")
                    TextField("예) 500", text: $firstRunQty)
                        .font(BUFont.bodySmall)
                        .keyboardType(.numberPad)
                        .padding(.horizontal, 10).padding(.vertical, 10)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    Text("첫 양산 목표 수량")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                    Text("초기 스타트업 권장: 300–1,000개. 재고 부담 vs 단가 트레이드오프.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("양산 전 최종 게이트")
                    let items = [
                        "PVT 완료 후 양산 지시 (ECO — Engineering Change Order 반영)",
                        "인증(KC/CE) 취득 후 마킹 적용",
                        "포장·라벨링 최종 확인",
                        "물류·창고 계획 확정 (3PL or 직접 관리)",
                    ]
                    ForEach(items, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "checkmark.circle").font(.system(size: 13)).foregroundStyle(BUColor.midnight)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 완료")
                    Toggle(isOn: $done) {
                        Text("양산 파트너·계획 확정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("ManufacturingPartner") { ManufacturingPartnerStageView() }
#endif

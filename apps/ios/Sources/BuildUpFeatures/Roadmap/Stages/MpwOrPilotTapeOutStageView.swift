//
//  MpwOrPilotTapeOutStageView.swift — MPW·테이프아웃 (iOS 네이티브)
//
//  stageId: "mpw-or-pilot-tape-out"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct MpwOrPilotTapeOutStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("mpw.tapeOutType")   private var tapeOutType  = ""
    @AppStorage("mpw.designFrozen")  private var designFrozen = false
    @AppStorage("mpw.submitted")     private var submitted    = false
    @AppStorage("mpw.done")          private var done         = false

    private let pages = ["MPW vs 풀마스크", "테이프아웃 준비"]

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
                                case 0: mpwPage
                                default: tapeOutPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("MPW·테이프아웃")
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

    // MARK: - pg 0 MPW vs 풀마스크

    private var mpwPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("MPW·테이프아웃")
                    Text("테이프아웃 = 설계 완료의 선언\n되돌리면 수십억이 날아간다")
                        .font(.system(size: 22, weight: .bold)).foregroundStyle(BUColor.midnightDeep).tracking(-0.3).lineSpacing(4)
                    Text("MPW(Multi-Project Wafer): 여러 칩이 웨이퍼 하나를 나눠 사용 → 비용 90–95% 절감")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    BUEyebrow("MPW vs 풀마스크 선택")
                    let options: [(String, String, String)] = [
                        ("mpw", "MPW (공동 웨이퍼)", "비용 2,000만~5,000만원. 개수 50–200개. 초기 검증에 필수. TSMC·삼성 CMP(Customer Multi-Project) 통해 신청."),
                        ("full", "풀 마스크셋", "28nm: 100억원+ / 7nm: 1,000억원+. 본격 양산 전 단계. MPW 검증 후에만."),
                    ]
                    ForEach(options, id: \.0) { id, title, desc in
                        let isSelected = tapeOutType == id
                        Button {
                            tapeOutType = isSelected ? "" : id
                        } label: {
                            HStack(alignment: .top, spacing: BUSpacing.sm) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(title).font(BUFont.bodySmall.weight(.bold))
                                        .foregroundStyle(isSelected ? BUColor.midnightDeep : BUColor.ink)
                                    Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                        .multilineTextAlignment(.leading)
                                }
                                Spacer()
                                if isSelected {
                                    Image(systemName: "checkmark.circle.fill").font(.system(size: 16)).foregroundStyle(BUColor.midnight)
                                }
                            }
                            .padding(BUSpacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(isSelected ? BUColor.midnight.opacity(0.06) : BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                                    .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 1.5)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("한국 MPW 접근 방법")
                    let items = [
                        "TSMC OIP CMP 파트너 (한국: 씨제이씨·더존 EDA 등) 통해 신청",
                        "IMEC ePIXfab (포토닉스), EuroPra (유럽 공공 MPW)",
                        "삼성 파운드리 MPW: 국내 스타트업 우선 배정 있음",
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
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("테이프아웃 전 반드시 확인")
                    let warnings = [
                        "DRC (Design Rule Check) 100% 통과 — 미통과 시 제조 거절",
                        "LVS (Layout vs Schematic) 일치 확인",
                        "EMIR (전류 밀도) 검증",
                        "파운드리 테이프아웃 체크리스트 전항목 완료",
                    ]
                    ForEach(warnings, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "exclamationmark.triangle.fill").font(.system(size: 13)).foregroundStyle(Color.red.opacity(0.8))
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 테이프아웃 준비

    private var tapeOutPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("테이프아웃 체크리스트")
                    Toggle(isOn: $designFrozen) {
                        Text("설계 Freeze — RTL·레이아웃 변경 금지").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $submitted) {
                        Text("파운드리 테이프아웃 데이터 제출 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("테이프아웃 이후 일정")
                    let schedule: [(String, String)] = [
                        ("웨이퍼 제조", "8–16주 (공정 노드에 따라)"),
                        ("다이 출하·패키징", "4–8주"),
                        ("초도 샘플 테스트", "2–4주"),
                        ("첫 샘플까지 총", "6–28주"),
                    ]
                    ForEach(schedule, id: \.0) { label, value in
                        HStack(spacing: BUSpacing.sm) {
                            Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted).frame(width: 96, alignment: .leading)
                            Text(value).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("최종 완료")
                    Toggle(isOn: $done) {
                        Text("MPW·테이프아웃 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("MpwOrPilotTapeOut") { MpwOrPilotTapeOutStageView() }
#endif

//
//  BusinessModelStageView.swift — 운영 모델 선택 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/selection/BusinessModelSelectionStage.tsx
//  stageId: "business-model"
//
//  외식 path 운영 모델 옵션:
//    delivery-hybrid       — 배달 중심 (도시락·배달 전문)
//    dine-in-restaurant    — 홀 매장 중심
//    takeout-focused       — 테이크아웃 전문
//    self-serve-light      — 셀프서비스 / 무인
//
//  + 영업 시간 설정 (오프라인 공통)
//  + 수익 모델: 오프라인은 "one-time" 자동, 별도 선택 불필요
//
//  데이터:
//    @AppStorage "stage.bizModel.selected"   — 운영 모델 ID
//    @AppStorage "stage.bizModel.openHour"   — Int (예: 9)
//    @AppStorage "stage.bizModel.closeHour"  — Int (예: 21)
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

// MARK: - BusinessModelStageView

public struct BusinessModelStageView: View {

    @Environment(\.dismiss) private var dismiss
    @AppStorage("stage.bizModel.selected")  private var selected  = ""
    @AppStorage("stage.bizModel.openHour")  private var openHour  = 9
    @AppStorage("stage.bizModel.closeHour") private var closeHour = 21

    private let models: [BizModelOption] = [
        BizModelOption(
            id: "delivery-hybrid",
            icon: "box.truck.fill",
            titleKo: "배달 중심",
            descKo: "배달 앱 + 픽업 병행\n도시락·배달 전문점에 최적",
            tagKo: "추천"
        ),
        BizModelOption(
            id: "dine-in-restaurant",
            icon: "fork.knife",
            titleKo: "홀 매장 중심",
            descKo: "테이블 식사 위주\n홀 서비스 인력 필요",
            tagKo: nil
        ),
        BizModelOption(
            id: "takeout-focused",
            icon: "bag.fill",
            titleKo: "테이크아웃 전문",
            descKo: "픽업 전문, 좌석 최소화\n회전율 높음",
            tagKo: nil
        ),
        BizModelOption(
            id: "self-serve-light",
            icon: "rectangle.and.hand.point.up.left.fill",
            titleKo: "셀프서비스 / 무인",
            descKo: "키오스크 중심\n인건비 절감",
            tagKo: nil
        ),
    ]

    private var isDone: Bool { !selected.isEmpty }

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()

                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.lg) {

                        heroBanner
                            .padding(.horizontal, BUSpacing.md)

                        // 운영 모델 선택
                        VStack(alignment: .leading, spacing: BUSpacing.sm) {
                            BUEyebrow("운영 방식 선택")
                                .padding(.horizontal, BUSpacing.md)

                            LazyVGrid(
                                columns: [GridItem(.flexible()), GridItem(.flexible())],
                                spacing: BUSpacing.sm
                            ) {
                                ForEach(models) { model in
                                    BizModelCard(option: model, isSelected: selected == model.id) {
                                        selected = model.id
                                    }
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                        }

                        // 선택된 모델 경고 (배달 중심)
                        if selected == "delivery-hybrid" {
                            deliveryNote
                                .padding(.horizontal, BUSpacing.md)
                        }

                        // 영업 시간
                        businessHoursSection
                            .padding(.horizontal, BUSpacing.md)

                        wrapupSection
                            .padding(.horizontal, BUSpacing.md)

                        Spacer(minLength: BUSpacing.xxxl)
                    }
                    .padding(.top, BUSpacing.md)
                }
            }
            .navigationTitle("운영 모델 선택")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }
                        .foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
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
                BUEyebrow("단계 3 · 운영 모델")
                Text("어떻게 영업하실\n건가요?")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(BUColor.midnightDeep)
                    .tracking(-0.3)
                    .lineSpacing(4)
                Text("운영 방식에 따라 인허가 종류·인건비·POS 구성이 달라집니다.")
                    .font(BUFont.bodySmall)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)

                HStack(spacing: BUSpacing.sm) {
                    miniStat(icon: "person.2.fill",      value: "인력", label: "배달=1-2명")
                    miniStat(icon: "doc.text.fill",      value: "허가", label: "모델별 상이")
                    miniStat(icon: "percent",            value: "수수료", label: "배달 17-28%")
                }
                .padding(.top, 4)
            }
        }
    }

    private func miniStat(icon: String, value: String, label: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundStyle(BUColor.midnight)
            Text(value)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BUColor.midnightDeep)
            Text(label)
                .font(BUFont.eyebrow)
                .foregroundStyle(BUColor.inkMuted)
        }
        .padding(BUSpacing.sm)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous))
    }

    // MARK: - Delivery note

    private var deliveryNote: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.xs) {
                HStack(spacing: 6) {
                    Image(systemName: "info.circle.fill")
                        .foregroundStyle(Color.orange)
                    Text("배달 중심 — 주의사항")
                        .font(BUFont.bodySmall.weight(.semibold))
                        .foregroundStyle(BUColor.ink)
                }
                VStack(alignment: .leading, spacing: 5) {
                    noteRow("배달 배민·쿠팡이츠 수수료 평균 17-28% — 이후 원가 설계에 반드시 반영")
                    noteRow("배달 전문은 휴게음식점 미허가 시 영업 불가 (일반음식점과 다름)")
                    noteRow("포장재 비용 별도 발생 — 메뉴 설계 단계에서 원가에 포함")
                }
            }
        }
    }

    private func noteRow(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Text("•")
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.midnight.opacity(0.6))
            Text(text)
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
        }
    }

    // MARK: - Business hours

    private var businessHoursSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("영업 시간")

                HStack(spacing: BUSpacing.lg) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("오픈")
                            .font(BUFont.eyebrow)
                            .foregroundStyle(BUColor.inkMuted)
                        Picker("오픈", selection: $openHour) {
                            ForEach(0..<24, id: \.self) { h in
                                Text(String(format: "%02d:00", h)).tag(h)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(height: 100)
                        .clipped()
                    }
                    .frame(maxWidth: .infinity)

                    Text("~")
                        .font(BUFont.cardTitleSmall)
                        .foregroundStyle(BUColor.inkMuted)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("마감")
                            .font(BUFont.eyebrow)
                            .foregroundStyle(BUColor.inkMuted)
                        Picker("마감", selection: $closeHour) {
                            ForEach(0..<24, id: \.self) { h in
                                Text(String(format: "%02d:00", h)).tag(h)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(height: 100)
                        .clipped()
                    }
                    .frame(maxWidth: .infinity)
                }

                let hoursPerDay = closeHour > openHour ? closeHour - openHour : (24 - openHour + closeHour)
                HStack(spacing: 6) {
                    Image(systemName: hoursPerDay > 12 ? "exclamationmark.triangle" : "checkmark.circle")
                        .font(.system(size: 12))
                        .foregroundStyle(hoursPerDay > 12 ? Color.orange : BUColor.success)
                    Text("하루 \(hoursPerDay)시간 영업 · 주 6일 기준 주 \(hoursPerDay * 6)시간")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                    if hoursPerDay > 12 {
                        Text("(근로기준법 주 52시간 검토 필요)")
                            .font(BUFont.eyebrow)
                            .foregroundStyle(Color.orange)
                    }
                }
            }
        }
    }

    // MARK: - Wrapup

    private var wrapupSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("완료 체크리스트")
                BizCheckRow(label: "운영 모델 선택 완료", done: !selected.isEmpty)
                BizCheckRow(label: "영업 시간 설정 완료", done: openHour != closeHour)
                if selected == "delivery-hybrid" {
                    BizCheckRow(label: "배달 수수료(17-28%) 원가에 반영 예정", done: false)
                }
            }
        }
    }
}

// MARK: - Sub-views

private struct BizModelOption: Identifiable {
    let id: String
    let icon: String
    let titleKo: String
    let descKo: String
    let tagKo: String?
}

private struct BizModelCard: View {
    let option: BizModelOption
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: option.icon)
                        .font(.system(size: 18))
                        .foregroundStyle(isSelected ? BUColor.midnight : BUColor.inkMuted)
                    Spacer()
                    if let tag = option.tagKo {
                        Text(tag)
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(BUColor.midnight.opacity(0.1), in: Capsule())
                    }
                }

                Text(option.titleKo)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(isSelected ? BUColor.midnightDeep : BUColor.ink)

                Text(option.descKo)
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
                    .multilineTextAlignment(.leading)
            }
            .padding(BUSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                isSelected ? BUColor.midnight.opacity(0.06) : BUColor.surfaceElevated,
                in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                    .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
    }
}

private struct BizCheckRow: View {
    let label: String
    let done: Bool
    var body: some View {
        HStack(spacing: BUSpacing.sm) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 16))
                .foregroundStyle(done ? BUColor.success : BUColor.inkSubtle)
            Text(label)
                .font(BUFont.bodySmall)
                .foregroundStyle(done ? BUColor.ink : BUColor.inkMuted)
            Spacer()
        }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("BusinessModel") {
    BusinessModelStageView()
}
#endif

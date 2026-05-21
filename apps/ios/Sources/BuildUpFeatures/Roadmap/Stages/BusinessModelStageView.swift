//
//  BusinessModelStageView.swift — 운영 모델 선택 (iOS 네이티브, 웹 SSOT 미러)
//
//  웹 SSOT: apps/web/app/lib/components/stages/selection/BusinessModelSelectionStage.tsx
//  stageId: "business-model"
//
//  레이아웃 (BUStageShell):
//   ① helper line
//   ② 2-col 운영 모델 그리드 (배달·홀·테이크아웃·셀프)
//   ③ 배달 선택 시 주의 카드 (수수료·인허가·포장재)
//   ④ 영업시간 — 오픈/마감 시간 wheel picker
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

private struct BizModelOption: Identifiable {
    let id: String
    let icon: String
    let color: Color
    let titleKo: String
    let descKo: String
    let tagKo: String?
}

public struct BusinessModelStageView: View {

    @Environment(RoadmapStore.self) private var roadmapStore
    @Environment(\.dismiss) private var dismiss
    @AppStorage("stage.bizModel.selected")  private var selected  = ""
    @AppStorage("stage.bizModel.openHour")  private var openHour  = 9
    @AppStorage("stage.bizModel.closeHour") private var closeHour = 21
    private let stageId = "business-model"

    // 웹 SSOT (packages/shared/starter-data.ts food 카테고리) 와 1:1 일치:
    //   dine-in-restaurant / takeout-focused / delivery-hybrid 세 개만.
    //   ⚠️ 2026-05-20 사장님 신고: 한국 외식 현실은 "홀+배달" 하이브리드가 표준인데
    //   기존엔 delivery-hybrid 를 "배달 중심" 으로 잘못 라벨 → 사장님이 본인 케이스 못 찾음.
    //   웹의 summary "walk-in demand and delivery demand together" 의 정확한 의미로 라벨 재작성.
    //   self-serve-light 는 food 가 아닌 cafe-dessert 카테고리 옵션이라 제거.
    private let models: [BizModelOption] = [
        BizModelOption(
            id: "delivery-hybrid",
            icon: "box.truck.fill",
            color: Color(red: 0.918, green: 0.345, blue: 0.047),
            titleKo: "하이브리드 (홀+배달)",
            descKo: "홀 식사·배달·픽업 모두 운영",
            tagKo: "추천"
        ),
        BizModelOption(
            id: "dine-in-restaurant",
            icon: "fork.knife",
            color: Color(red: 0.149, green: 0.388, blue: 0.922),
            titleKo: "홀 매장 중심",
            descKo: "테이블 식사·홀 서비스 위주",
            tagKo: nil
        ),
        BizModelOption(
            id: "takeout-focused",
            icon: "bag.fill",
            color: Color(red: 0.020, green: 0.588, blue: 0.412),
            titleKo: "테이크아웃 전문",
            descKo: "픽업·포장 위주·좌석 최소",
            tagKo: nil
        ),
    ]

    public init() {}

    private var canContinue: Bool { !selected.isEmpty && openHour != closeHour }

    private var hoursPerDay: Int {
        closeHour > openHour ? closeHour - openHour : (24 - openHour + closeHour)
    }

    private var advanceHint: String {
        if selected.isEmpty { return "운영 방식을 선택하세요" }
        return "하루 \(hoursPerDay)시간 영업 — 다음 단계로 진행"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "운영 방식 선택",
            stageEyebrow: "단계 3 · 운영 모델",
            helperText: "운영 방식에 따라 인허가·인건비·POS 구성이 달라집니다.",
            canAdvance: canContinue,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(
                    currentStageId: stageId,
                    inputs: ["model": selected, "openHour": "\(openHour)", "closeHour": "\(closeHour)"]
                )
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(currentStageId: stageId,
                    inputs: ["model": selected, "openHour": "\(openHour)", "closeHour": "\(closeHour)"])
            },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 운영 모델 선택", detail: "고정매장 / 배달 중심 / 하이브리드 / 무인 등 업종별 운영 모델 결정"),
                .init(label: "2. 시그니처 메뉴·서비스 확정", detail: "스페셜티 4-tier(코어·시그니처·확장·실험) 분기로 메뉴 우선순위 정의"),
                .init(label: "3. 영업시간·요일 설정", detail: "주중·주말·휴무일 패턴 + 피크타임 시간대 정의"),
                .init(label: "4. 수익 모델 결정", detail: "단품 판매·구독·멤버십·시간제 등 카테고리별 매출 흐름 모델 확정"),
                ],
                verifyItems: [
                "운영 모델별 인허가 차이 확인 — 배달 전문은 「휴게음식점 미허가 시」 영업불가, 무인은 24시간 신고 별도",
                "시그니처 메뉴 — 식자재 원가율 30% 이내 + 조리 시간 5분 이내 + 폐기율 10% 이하 모두 충족 검증",
                "영업시간 — 근로기준법 1주 52시간 한도 + 1일 11시간 휴게(주휴) 사전 시뮬",
                "수익 모델 — 객단가 × 회전수 × 영업일수로 월매출 시뮬 후 손익분기 계산 (BEP < 보유자본 6개월)",
                "프랜차이즈인 경우 본사 정해진 메뉴·시간 변경 가능 여부 (계약서 「본사 동의 필수」 조항 확인)",
                "배달 중심 모델 — 배민·쿠팡이츠 수수료(평균 17~28%) 반영 후에도 마진 20% 이상 확보 가능한지",
                ],
                nextStageLabel: "자본·일정 설정",
                nextSummary: "운영 모델·메뉴·시간 확정 → 자본·일정 설정 단계로 진입"
            )
        ) {
            VStack(alignment: .leading, spacing: 16) {
                LazyVGrid(
                    columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
                    spacing: 12
                ) {
                    ForEach(models) { model in
                        BizModelCard(option: model, isSelected: selected == model.id) {
                            withAnimation(.snappy(duration: 0.18)) { selected = model.id }
                        }
                    }
                }

                if selected == "delivery-hybrid" {
                    deliveryNote
                }

                businessHoursSection
            }
        }
    }

    private var deliveryNote: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 7) {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(Color.orange)
                    .font(.system(size: 13, weight: .bold))
                Text("하이브리드 운영 — 주의사항")
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
            }
            VStack(alignment: .leading, spacing: 6) {
                noteRow("배민·쿠팡이츠 수수료 평균 17~28% — 원가 설계에 반드시 반영")
                noteRow("일반음식점 허가 필수 — 홀 좌석 1석 이상이면 휴게음식점 불가")
                noteRow("포장재 + 배달비 별도 — 메뉴 가격 책정에 포함")
                noteRow("주방 동선: 홀 서빙 + 픽업 + 배달 라이더 픽업 3 흐름 분리 권장")
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [Color.orange.opacity(0.07), Color.orange.opacity(0.02)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 16, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(Color.orange.opacity(0.22), lineWidth: 1)
        )
    }

    private func noteRow(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 7) {
            Circle().fill(Color.orange).frame(width: 4, height: 4).padding(.top, 7)
            Text(text)
                .font(.system(size: 12))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
        }
    }

    private var businessHoursSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            BUStageSectionHeader(
                eyebrow: "Step 2 — 영업 시간",
                hint: "오픈·마감을 정하면 주 영업 시간 자동 계산"
            )

            HStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("오픈")
                        .font(.system(size: 11, weight: .semibold))
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
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(BUColor.inkMuted)

                VStack(alignment: .leading, spacing: 4) {
                    Text("마감")
                        .font(.system(size: 11, weight: .semibold))
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

            HStack(spacing: 6) {
                Image(systemName: hoursPerDay > 12 ? "exclamationmark.triangle" : "checkmark.circle")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(hoursPerDay > 12 ? Color.orange : BUColor.success)
                Text("하루 \(hoursPerDay)시간 · 주 6일 기준 주 \(hoursPerDay * 6)시간")
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                if hoursPerDay > 12 {
                    Text("(주 52시간 검토 필요)")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(Color.orange)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(Color.black.opacity(0.05), lineWidth: 1)
        )
    }
}

private struct BizModelCard: View {
    let option: BizModelOption
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    ZStack {
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(option.color.opacity(isSelected ? 0.18 : 0.08))
                        Image(systemName: option.icon)
                            .font(.system(size: 20, weight: .regular))
                            .foregroundStyle(option.color.opacity(isSelected ? 1.0 : 0.8))
                    }
                    .frame(width: 44, height: 44)
                    Spacer()
                    if let tag = option.tagKo {
                        Text(tag)
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(option.color)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(option.color.opacity(0.1), in: Capsule())
                    }
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(option.titleKo)
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(isSelected ? option.color : BUColor.ink)
                    Text(option.descKo)
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(2)
                        .multilineTextAlignment(.leading)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity, minHeight: 130, alignment: .topLeading)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: isSelected
                                ? [option.color.opacity(0.08), option.color.opacity(0.04)]
                                : [option.color.opacity(0.03), Color.white.opacity(0.9)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(
                        isSelected ? option.color.opacity(0.4) : option.color.opacity(0.1),
                        lineWidth: 1.5
                    )
            )
            .shadow(color: isSelected ? option.color.opacity(0.08) : .clear, radius: 4, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }
}

#if DEBUG
#Preview("BusinessModel") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["business-model"] }
    return BusinessModelStageView().environment(store)
}
#endif

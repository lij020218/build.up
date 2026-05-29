//
//  DailyOpsRitualCard.swift — 일일 운영 체크리스트 (웹 DailyOpsRitualCard.tsx 미러)
//
//  웹 SSOT: apps/web/app/lib/components/dashboard/DailyOpsRitualCard.tsx
//
//  업종별 일일 의식 체크리스트:
//   • 외식/카페: 오픈 점검 / 식자재 입고 / 영업 마감 / 위생 점검
//   • 미용: 예약 확인 / 노쇼 회수 / 도구 세척
//   • 피트니스: 시설 점검 / 회원 출석 / 강사 일정
//   • 펫/병원: 예약 확인 / 청소 / 약품 재고
//   • 스타트업/온라인: 일간 매출 / CS 응대 / 푸시 발송
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

// MARK: - Ritual Item

public struct RitualItem: Identifiable, Sendable, Hashable {
    public let id = UUID()
    public let label: String
    public let detail: String
    public let symbol: String
    public var completed: Bool

    public init(label: String, detail: String, symbol: String, completed: Bool = false) {
        self.label = label
        self.detail = detail
        self.symbol = symbol
        self.completed = completed
    }
}

// MARK: - DailyOpsRitualCard

public struct DailyOpsRitualCard: View {

    let category: IndustryCategory
    let ko: Bool

    @State private var items: [RitualItem]

    public init(category: IndustryCategory, ko: Bool = true) {
        self.category = category
        self.ko = ko
        self._items = State(initialValue: Self.defaultItems(for: category))
    }

    private var completedCount: Int { items.filter(\.completed).count }
    private var progress: Double {
        items.isEmpty ? 0 : Double(completedCount) / Double(items.count)
    }

    public var body: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                headerSection
                progressBar
                ForEach(items.indices, id: \.self) { idx in
                    itemRow(items[idx], index: idx)
                }
            }
        }
    }

    private var headerSection: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(BUColor.midnight08)
                    .frame(width: 36, height: 36)
                Image(systemName: "checklist")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(ko ? "오늘 운영 의식" : "Today's Ritual")
                    .buSectionEyebrowStyle()
                Text(ko
                     ? "\(completedCount) / \(items.count) 완료"
                     : "\(completedCount) / \(items.count) done")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .monospacedDigit()
            }
            Spacer()
        }
    }

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(BUColor.midnight08)
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [BUColor.success, BUColor.success.opacity(0.7)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geo.size.width * CGFloat(progress))
                    .animation(.easeOut(duration: 0.4), value: progress)
            }
        }
        .frame(height: 5)
    }

    private func itemRow(_ item: RitualItem, index: Int) -> some View {
        Button {
            #if canImport(UIKit)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            #endif
            withAnimation(.snappy(duration: 0.18)) {
                items[index].completed.toggle()
            }
        } label: {
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 7, style: .continuous)
                        .fill(item.completed ? BUColor.success.opacity(0.18) : BUColor.midnight08)
                        .frame(width: 28, height: 28)
                    Image(systemName: item.completed ? "checkmark" : item.symbol)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(item.completed ? BUColor.success : BUColor.midnight)
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text(item.label)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(item.completed ? BUColor.inkMuted : BUColor.ink)
                        .strikethrough(item.completed, color: BUColor.inkSubtle)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(item.detail)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 7)
            .background(
                item.completed
                    ? BUColor.success.opacity(0.05)
                    : BUColor.surfaceElevated.opacity(0.6),
                in: RoundedRectangle(cornerRadius: 10)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(
                        item.completed ? BUColor.success.opacity(0.18) : BUColor.borderSubtle,
                        lineWidth: 0.6
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - 업종별 기본 아이템

    private static func defaultItems(for category: IndustryCategory) -> [RitualItem] {
        switch category {
        case .restaurant, .cafe:
            return [
                .init(label: "오픈 점검", detail: "냉장고 온도 · 식자재 신선도 · 좌석 청결", symbol: "sunrise.fill"),
                .init(label: "식자재 입고", detail: "양 · 단가 · 유통기한 기록", symbol: "shippingbox.fill"),
                .init(label: "위생 점검", detail: "주방 · 화장실 · 손씻기 (식약처 22개 중 5개)", symbol: "hand.wave.fill"),
                .init(label: "영업 마감", detail: "POS 정산 · 매출 입력 · 다음 날 준비", symbol: "moon.stars.fill"),
            ]
        case .beauty:
            return [
                .init(label: "예약 확인", detail: "오늘 예약 + 노쇼 위험 회수", symbol: "calendar.badge.clock"),
                .init(label: "시설 점검", detail: "도구 세척 · 수건 준비 · 음악", symbol: "scissors"),
                .init(label: "리뷰 응답", detail: "어제 리뷰 + 평점 회수", symbol: "star.fill"),
                .init(label: "영업 마감", detail: "POS 정산 · 매출 입력", symbol: "moon.stars.fill"),
            ]
        case .fitness:
            return [
                .init(label: "시설 점검", detail: "기구 · 수건 · 락커 점검", symbol: "dumbbell.fill"),
                .init(label: "출석 확인", detail: "오늘 등원 · 결석 회원 회수", symbol: "person.crop.circle.badge.checkmark"),
                .init(label: "강사 일정", detail: "그룹 클래스 출석 + PT 일정", symbol: "person.2.fill"),
                .init(label: "마감 정산", detail: "POS · 매출 입력", symbol: "moon.stars.fill"),
            ]
        case .pet:
            return [
                .init(label: "예약 확인", detail: "오늘 예약 · 노쇼 회수", symbol: "calendar.badge.clock"),
                .init(label: "케어 룸 청소", detail: "공간별 청소 · 약품 재고", symbol: "sparkles"),
                .init(label: "고객 안내", detail: "픽업 · 카톡 안내 발송", symbol: "message.fill"),
                .init(label: "마감", detail: "POS · 매출 입력", symbol: "moon.stars.fill"),
            ]
        case .education:
            return [
                .init(label: "교실 점검", detail: "강의실 · 자료 · 음향", symbol: "graduationcap.fill"),
                .init(label: "출석 확인", detail: "결석 학생 회수 + 학부모 안내", symbol: "person.crop.circle.badge.checkmark"),
                .init(label: "강사 일정", detail: "오늘 일정 + 보강 협의", symbol: "person.2.fill"),
                .init(label: "마감", detail: "POS · 매출 입력", symbol: "moon.stars.fill"),
            ]
        case .retail, .ecommerce:
            return [
                .init(label: "재고 점검", detail: "베스트 · 품절 임박 확인", symbol: "shippingbox.fill"),
                .init(label: "주문 응대", detail: "오늘 주문 · CS · 환불 처리", symbol: "envelope.badge.fill"),
                .init(label: "리뷰 응답", detail: "어제 리뷰 + 별점 회수", symbol: "star.fill"),
                .init(label: "마감", detail: "POS · 매출 입력", symbol: "moon.stars.fill"),
            ]
        case .livingService, .space:
            return [
                .init(label: "예약 확인", detail: "오늘 예약 · 변경 처리", symbol: "calendar.badge.clock"),
                .init(label: "시설 점검", detail: "청소 · 비품 · 안전 확인", symbol: "sparkles"),
                .init(label: "고객 안내", detail: "픽업 · 배정 · 카톡 발송", symbol: "message.fill"),
                .init(label: "마감", detail: "POS · 매출 입력", symbol: "moon.stars.fill"),
            ]
        case .startupTech:
            return [
                .init(label: "일간 매출 확인", detail: "어제 MRR · 신규 가입 · 이탈", symbol: "chart.line.uptrend.xyaxis"),
                .init(label: "CS 응대", detail: "이메일 · 인터컴 · 슬랙 응답", symbol: "envelope.badge.fill"),
                .init(label: "푸시 발송", detail: "리텐션 · 신기능 안내", symbol: "bell.badge.fill"),
                .init(label: "팀 standup", detail: "오늘 할 일 · 블로커 공유", symbol: "person.2.fill"),
            ]
        case .general:
            return [
                .init(label: "오픈 점검", detail: "시설 · 청결 · 준비물", symbol: "sunrise.fill"),
                .init(label: "고객 응대", detail: "오늘 예약 + 문의 응답", symbol: "person.crop.circle"),
                .init(label: "마감 정산", detail: "POS · 매출 입력", symbol: "moon.stars.fill"),
            ]
        }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("DailyOpsRitualCard — 외식") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            DailyOpsRitualCard(category: .restaurant)
                .padding(BUSpacing.md)
        }
    }
}

#Preview("DailyOpsRitualCard — 미용") {
    ZStack {
        BUBackgroundSurface()
        ScrollView {
            DailyOpsRitualCard(category: .beauty)
                .padding(BUSpacing.md)
        }
    }
}
#endif

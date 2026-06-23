//
//  CoachingFeedbackRow.swift — AI 코칭 피드백(도움됐어요/안 맞아요 + 이유칩) — iOS.
//
//  웹 SSOT: apps/web/app/lib/components/dashboard/CoachingFeedback.tsx
//  POST /api/ai/coaching-feedback → "안 맞아요"는 다음 코칭 prompt 에 주입돼 자가개선.
//  신호등 색 금지 — 미드나잇 한 톤.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

struct CoachingFeedbackRow: View {

    let headline: String
    let industryCategoryId: String?
    let specialtyId: String?

    private enum Phase { case idle, downReason, done }
    @State private var phase: Phase = .idle
    @State private var verdict: CoachingFeedbackRepository.Verdict?

    private var repo: CoachingFeedbackRepository {
        CoachingFeedbackRepository(supabase: BUSupabase.shared.client)
    }

    private static let reasons: [(CoachingFeedbackRepository.Reason, String)] = [
        (.industryMismatch, "우리 업종과 안 맞아요"),
        (.alreadyKnow, "이미 알아요"),
        (.inaccurate, "부정확해요"),
        (.hardToAct, "실행 어려워요"),
    ]

    private func send(_ v: CoachingFeedbackRepository.Verdict, reason: CoachingFeedbackRepository.Reason? = nil) {
        Task {
            await repo.submit(
                headline: headline, verdict: v, reason: reason,
                industryCategoryId: industryCategoryId, specialtyId: specialtyId
            )
        }
    }

    var body: some View {
        switch phase {
        case .done:
            Text(verdict == .up
                 ? "고맙습니다 — 비슷한 코칭을 더 보여드릴게요."
                 : "반영했어요 — 다음엔 이런 코칭을 줄일게요.")
                .font(.system(size: 11))
                .foregroundStyle(BUColor.inkMuted)

        case .downReason:
            VStack(alignment: .leading, spacing: 6) {
                Text("어떤 점이 안 맞았나요?")
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkMuted)
                FlowChips {
                    ForEach(Self.reasons, id: \.0.rawValue) { (reason, label) in
                        Button {
                            send(.down, reason: reason); verdict = .down; phase = .done
                        } label: { chipLabel(label) }
                        .buttonStyle(.plain)
                    }
                }
            }

        case .idle:
            HStack(spacing: 8) {
                Text("이 코칭, 도움이 됐나요?")
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkMuted)
                Button { send(.up); verdict = .up; phase = .done } label: { chipLabel("도움됐어요") }
                    .buttonStyle(.plain)
                Button { phase = .downReason } label: { chipLabel("안 맞아요") }
                    .buttonStyle(.plain)
                Spacer(minLength: 0)
            }
        }
    }

    private func chipLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(BUColor.midnight)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(BUColor.midnight.opacity(0.06), in: Capsule())
            .overlay(Capsule().strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1))
    }
}

/// 간단한 wrap 레이아웃 — 이유칩이 한 줄을 넘으면 다음 줄로.
private struct FlowChips<Content: View>: View {
    @ViewBuilder let content: Content
    var body: some View {
        // 칩 4개라 2열 그리드로 충분(복잡한 flow 불필요).
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 6), GridItem(.flexible(), spacing: 6)], alignment: .leading, spacing: 6) {
            content
        }
    }
}

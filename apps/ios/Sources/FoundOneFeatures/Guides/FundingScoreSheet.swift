//
//  FundingScoreSheet.swift — AI 점수 평가 시트 (펀딩)
//
//  웹 SSOT: apps/web/app/lib/components/surfaces/FundingScoreModal.tsx
//  서버:     /api/ai/funding/score (POST, Supabase Bearer, OpenAI gpt-5.4-mini,
//                                   일일 20회 / 분당 5회 rate limit)
//
//  로드 → 점수 + 강점·약점·개선 + 항목별 breakdown 표시.
//  429 → 친화적 한도 메시지 노출.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData
import FoundOneCore

struct FundingScoreSheet: View {

    let program: FundingProgram
    let profile: FundingProfileSnapshot

    @Environment(\.dismiss) private var dismiss

    @State private var loading: Bool = true
    @State private var error: String? = nil
    @State private var result: FundingScoreResult? = nil

    var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        programHeader

                        if loading {
                            loadingView
                        } else if let err = error {
                            errorView(err)
                        } else if let r = result {
                            scoreHero(r)
                            verdictBlock(r)
                            if !r.strengths.isEmpty {
                                strengthsBlock(r.strengths)
                            }
                            if !r.weaknesses.isEmpty {
                                weaknessesBlock(r.weaknesses)
                            }
                            if !r.improvements.isEmpty {
                                improvementsBlock(r.improvements)
                            }
                            if !r.breakdown.isEmpty {
                                breakdownBlock(r)
                            }
                            if !r.bonusEligible.isEmpty {
                                bonusBlock(r.bonusEligible)
                            }
                            if !r.disqualified.isEmpty {
                                disqualifiedBlock(r.disqualified)
                            }
                            frameworkFootnote(r)
                        }

                        Color.clear.frame(height: 32)
                    }
                    .padding(.horizontal, BUSpacing.screenMargin)
                    .padding(.top, BUSpacing.md)
                }
            }
            .navigationTitle("AI 평가")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
        }
        .task { await loadScore() }
    }

    // MARK: - Header

    private var programHeader: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("평가 대상")
                .font(.system(size: 10, weight: .semibold))
                .tracking(0.8)
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                .textCase(.uppercase)
            Text(program.name)
                .font(.system(size: 18, weight: .heavy))
                .foregroundStyle(BUColor.ink)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 6) {
                Text(program.organizer)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
                if let amount = program.amount, !amount.isEmpty {
                    Text("·")
                        .foregroundStyle(BUColor.inkMuted.opacity(0.5))
                    Text(amount)
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(BUColor.midnightDeep)
                }
            }
        }
    }

    // MARK: - States

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
            Text("AI 가 평가 중입니다…")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
            Text("최대 30초가 걸릴 수 있습니다")
                .font(.system(size: 10.5, weight: .medium))
                .foregroundStyle(BUColor.inkMuted.opacity(0.65))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 50)
    }

    private func errorView(_ message: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "exclamationmark.triangle")
                    .foregroundStyle(Color(red: 0.706, green: 0.137, blue: 0.094))
                Text("평가 불러오기 실패")
                    .font(.system(size: 14, weight: .heavy))
            }
            Text(message)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            Button {
                Task { await loadScore() }
            } label: {
                Text("다시 시도")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 10)
                    .frame(minHeight: BUSpacing.minTapTarget)
                    .background(BUColor.midnight, in: Capsule())
            }
            .buttonStyle(.plain)
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(cardSurface)
    }

    // MARK: - Result blocks

    private func scoreHero(_ r: FundingScoreResult) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("\(r.score)")
                    .font(.system(size: 56, weight: .black))
                    .foregroundStyle(levelColor(r.level))
                    .tracking(-2)
                Text("/ 100")
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundStyle(BUColor.inkMuted)
                Spacer(minLength: 0)
                LevelBadge(level: r.level)
            }
            Text(r.headline)
                .font(.system(size: 14, weight: .heavy))
                .foregroundStyle(BUColor.ink)
                .fixedSize(horizontal: false, vertical: true)
            // 합격선 시각화
            ScoreBar(score: r.score, passingScore: r.passingScore)
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(cardSurface)
    }

    private func verdictBlock(_ r: FundingScoreResult) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            sectionTitle("총평")
            Text(r.verdict)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(BUColor.ink.opacity(0.88))
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(cardSurface)
    }

    private func strengthsBlock(_ items: [String]) -> some View {
        bulletBlock(title: "강점", color: Color(red: 0.020, green: 0.588, blue: 0.412), icon: "checkmark.circle.fill", items: items)
    }

    private func weaknessesBlock(_ items: [String]) -> some View {
        bulletBlock(title: "약점", color: Color(red: 0.706, green: 0.137, blue: 0.094), icon: "exclamationmark.circle.fill", items: items)
    }

    private func improvementsBlock(_ items: [String]) -> some View {
        bulletBlock(title: "개선 액션", color: BUColor.midnight, icon: "arrow.up.right.circle.fill", items: items)
    }

    private func bonusBlock(_ items: [String]) -> some View {
        bulletBlock(title: "받을 수 있는 가점", color: Color(red: 0.918, green: 0.345, blue: 0.047), icon: "plus.circle.fill", items: items)
    }

    private func disqualifiedBlock(_ items: [String]) -> some View {
        bulletBlock(title: "미충족 자격", color: Color(red: 0.706, green: 0.137, blue: 0.094), icon: "minus.circle.fill", items: items)
    }

    private func bulletBlock(title: String, color: Color, icon: String, items: [String]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(color)
                Text(title)
                    .font(.system(size: 12, weight: .heavy))
                    .tracking(0.3)
                    .foregroundStyle(BUColor.ink)
            }
            VStack(alignment: .leading, spacing: 5) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text("•")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(color.opacity(0.7))
                        Text(item)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(BUColor.ink.opacity(0.88))
                            .lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                }
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(cardSurface)
    }

    private func breakdownBlock(_ r: FundingScoreResult) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle("항목별 점수 (\(r.framework))")
            VStack(spacing: 8) {
                ForEach(Array(r.breakdown.enumerated()), id: \.offset) { _, item in
                    BreakdownRow(item: item)
                }
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(cardSurface)
    }

    private func frameworkFootnote(_ r: FundingScoreResult) -> some View {
        Text("평가 프레임워크: \(r.framework.uppercased()) · 합격선 \(r.passingScore)점 / 100점")
            .font(.system(size: 10.5, weight: .medium))
            .foregroundStyle(BUColor.inkMuted.opacity(0.7))
            .padding(.top, 2)
    }

    // MARK: - Helpers

    private func sectionTitle(_ s: String) -> some View {
        Text(s)
            .font(.system(size: 11, weight: .heavy))
            .tracking(0.5)
            .textCase(.uppercase)
            .foregroundStyle(BUColor.inkMuted.opacity(0.75))
    }

    private func levelColor(_ level: String) -> Color {
        switch level {
        case "high":   return Color(red: 0.020, green: 0.588, blue: 0.412)
        case "low":    return Color(red: 0.706, green: 0.137, blue: 0.094)
        default:       return Color(red: 0.918, green: 0.345, blue: 0.047)
        }
    }

    private var cardSurface: some View {
        RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
            .fill(Color.white.opacity(0.85))
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                    .strokeBorder(BUColor.cardBorder, lineWidth: 1)
            )
    }

    // MARK: - Load

    private func loadScore() async {
        loading = true
        error = nil
        result = nil
        defer { loading = false }

        let repo = FundingRepository(supabase: BUSupabase.shared.client)
        let scoreInput = FundingScoreProgramInput(
            name: program.name,
            organizer: program.organizer,
            category: program.category,
            target: program.target,
            benefit: program.benefit,
            amount: program.amount,
            season: program.season,
            requiredDocs: program.requiredDocs.isEmpty ? nil : program.requiredDocs,
            eligibility: nil
        )
        var ctx = FundingProfileRepository.makeScoreContext(from: profile)
        ctx.matchScore = program.matchScore
        ctx.eligible = program.eligible

        do {
            self.result = try await repo.scoreProgram(program: scoreInput, user: ctx)
        } catch {
            self.error = (error as? (any LocalizedError))?.errorDescription ?? error.localizedDescription
        }
    }
}

// MARK: - Level badge

private struct LevelBadge: View {
    let level: String

    var body: some View {
        let (label, color): (String, Color) = {
            switch level {
            case "high":   return ("가능성 높음", Color(red: 0.020, green: 0.588, blue: 0.412))
            case "low":    return ("거리 멀음", Color(red: 0.706, green: 0.137, blue: 0.094))
            default:       return ("노력 필요", Color(red: 0.918, green: 0.345, blue: 0.047))
            }
        }()
        return Text(label)
            .font(.system(size: 11, weight: .heavy))
            .foregroundStyle(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(color, in: Capsule())
    }
}

// MARK: - Score bar (with passing line)

private struct ScoreBar: View {
    let score: Int
    let passingScore: Int

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(BUColor.inkMuted.opacity(0.15))
                RoundedRectangle(cornerRadius: 4)
                    .fill(LinearGradient(
                        colors: [BUColor.midnight, BUColor.midnight.opacity(0.7)],
                        startPoint: .leading, endPoint: .trailing
                    ))
                    .frame(width: width * CGFloat(min(100, max(0, score))) / 100.0)
                // passing line
                Rectangle()
                    .fill(Color.white)
                    .frame(width: 2, height: 12)
                    .offset(x: width * CGFloat(passingScore) / 100.0 - 1)
            }
        }
        .frame(height: 8)
    }
}

// MARK: - Breakdown row

private struct BreakdownRow: View {
    let item: FundingScoreBreakdown

    private var pct: Double {
        guard item.weight > 0 else { return 0 }
        return Double(item.itemScore) / Double(item.weight)
    }

    private var color: Color {
        if pct >= 0.8 { return Color(red: 0.020, green: 0.588, blue: 0.412) }
        if pct >= 0.5 { return Color(red: 0.918, green: 0.345, blue: 0.047) }
        return Color(red: 0.706, green: 0.137, blue: 0.094)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(item.item)
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                    .lineLimit(1)
                Spacer(minLength: 6)
                Text("\(item.itemScore)/\(item.weight)점")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(color)
            }
            GeometryReader { proxy in
                let w = proxy.size.width
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(BUColor.inkMuted.opacity(0.12))
                    RoundedRectangle(cornerRadius: 3)
                        .fill(color)
                        .frame(width: w * CGFloat(min(1.0, max(0.0, pct))))
                }
            }
            .frame(height: 5)
            Text(item.reason)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

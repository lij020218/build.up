//
//  MarketingCoachCard.swift — AI 마케팅 코칭 (3 액션 전체 인라인 — 웹과 동일)
//
//  웹 SSOT: MarketingSurface.tsx (460–637) — Personalized Marketing Coaching.
//  각 액션이 풀 카드 (priority + title + why + howToExecute steps + expectedImpact + tools)
//  로 모두 한 화면에 표시. 클릭 시트로 detail 가지 않음.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

struct MarketingCoachCard: View {
    let loading: Bool
    let error: String?
    let actions: [CoachAction]
    let onRefresh: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header
            if loading && actions.isEmpty {
                skeletonBlock
            } else if let err = error, actions.isEmpty {
                errorBlock(err)
            } else if actions.isEmpty {
                emptyBlock
            } else {
                VStack(spacing: 10) {
                    ForEach(actions) { action in
                        ActionFullCard(action: action)
                    }
                }
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                .fill(Color.white.opacity(0.85))
        )
        .overlay(
            RoundedRectangle(cornerRadius: BURadius.nestedCard, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    private var header: some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text("내 가게 맞춤 코칭")
                    .font(.system(size: 10, weight: .heavy))
                    .tracking(0.8)
                    .foregroundStyle(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.65))
                    .textCase(.uppercase)
                Text("이번 주 우선순위 3 액션")
                    .font(.system(size: 16, weight: .bold))
                    .tracking(-0.32)
                    .foregroundStyle(BUColor.ink)
                Text("매출·채널·ROAS 기반으로 AI 가 매주 새로 생성")
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .padding(.top, 2)
            }
            Spacer(minLength: 6)
            Button(action: onRefresh) {
                HStack(spacing: 4) {
                    Image(systemName: loading ? "arrow.triangle.2.circlepath" : "arrow.clockwise")
                        .font(.system(size: 11, weight: .heavy))
                    Text(loading ? "생성 중" : "재생성")
                        .font(.system(size: 11, weight: .heavy))
                }
                .foregroundStyle(Color(red: 0.122, green: 0.275, blue: 0.659))
                .padding(.horizontal, 10).padding(.vertical, 6)
                .background(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .strokeBorder(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.2), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .disabled(loading)
        }
    }

    private var skeletonBlock: some View {
        VStack(spacing: 10) {
            ForEach(0..<3, id: \.self) { _ in
                VStack(alignment: .leading, spacing: 8) {
                    RoundedRectangle(cornerRadius: 4).fill(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.1)).frame(height: 12).frame(maxWidth: 70)
                    RoundedRectangle(cornerRadius: 4).fill(BUColor.midnight.opacity(0.08)).frame(height: 14).frame(maxWidth: 220)
                    RoundedRectangle(cornerRadius: 4).fill(BUColor.inkMuted.opacity(0.08)).frame(height: 11)
                    RoundedRectangle(cornerRadius: 4).fill(BUColor.inkMuted.opacity(0.08)).frame(height: 11).frame(maxWidth: 280)
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.inkMuted.opacity(0.02), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
        }
    }

    private func errorBlock(_ msg: String) -> some View {
        Text(msg)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(Color(red: 0.624, green: 0.102, blue: 0.176))
            .padding(14)
            .frame(maxWidth: .infinity)
            .background(Color(red: 1, green: 0.231, blue: 0.188).opacity(0.04), in: RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .strokeBorder(Color(red: 1, green: 0.231, blue: 0.188).opacity(0.16), lineWidth: 1)
            )
    }

    private var emptyBlock: some View {
        Text("아직 코칭이 생성되지 않았습니다. 재생성으로 시작하세요.")
            .font(.system(size: 12.5, weight: .medium))
            .foregroundStyle(BUColor.inkMuted)
            .multilineTextAlignment(.center)
            .padding(20)
            .frame(maxWidth: .infinity)
            .background(BUColor.inkMuted.opacity(0.03), in: RoundedRectangle(cornerRadius: 14))
    }
}

// MARK: - Action full card (full inline — 시트 없음)

private struct ActionFullCard: View {
    let action: CoachAction

    @Environment(\.openURL) private var openURL

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            PriorityBadge(priority: action.priority)

            Text(action.title)
                .font(.system(size: 15, weight: .heavy))
                .tracking(-0.15)
                .foregroundStyle(BUColor.ink)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)

            Text(action.why)
                .font(.system(size: 12.5, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(2)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)

            if !action.howToExecute.isEmpty {
                stepsBlock
            }

            if !action.expectedImpact.isEmpty {
                impactBlock
            }

            if !action.tools.isEmpty {
                toolsBlock
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.white.opacity(0.96))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
    }

    private var stepsBlock: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("실행 단계")
                .font(.system(size: 10.5, weight: .heavy))
                .tracking(0.6)
                .textCase(.uppercase)
                .foregroundStyle(Color(red: 0, green: 0.478, blue: 1.0))
            VStack(alignment: .leading, spacing: 7) {
                ForEach(Array(action.howToExecute.enumerated()), id: \.offset) { idx, step in
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text("\(idx + 1)")
                            .font(.system(size: 10.5, weight: .heavy))
                            .foregroundStyle(.white)
                            .frame(width: 18, height: 18)
                            .background(Color(red: 0, green: 0.478, blue: 1.0), in: RoundedRectangle(cornerRadius: 5))
                        Text(step)
                            .font(.system(size: 12.5, weight: .medium))
                            .foregroundStyle(BUColor.ink)
                            .lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                            .multilineTextAlignment(.leading)
                        Spacer(minLength: 0)
                    }
                }
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.04), in: RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .strokeBorder(Color(red: 0, green: 0.478, blue: 1.0).opacity(0.1), lineWidth: 1)
        )
    }

    private var impactBlock: some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text("기대 효과")
                .font(.system(size: 10.5, weight: .heavy))
                .tracking(0.4)
                .textCase(.uppercase)
                .foregroundStyle(Color(red: 0.204, green: 0.78, blue: 0.349))
            Text(action.expectedImpact)
                .font(.system(size: 12.5, weight: .semibold))
                .foregroundStyle(BUColor.ink)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
                .multilineTextAlignment(.leading)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 12).padding(.vertical, 9)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(red: 0.204, green: 0.78, blue: 0.349).opacity(0.05), in: RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .strokeBorder(Color(red: 0.204, green: 0.78, blue: 0.349).opacity(0.1), lineWidth: 1)
        )
    }

    private var toolsBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("추천 도구")
                .font(.system(size: 10.5, weight: .heavy))
                .tracking(0.4)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted)
            VStack(spacing: 6) {
                ForEach(action.tools, id: \.name) { tool in
                    CoachToolPill(tool: tool, openURL: openURL)
                }
            }
        }
        .padding(.top, 2)
    }
}

// MARK: - Priority badge

private struct PriorityBadge: View {
    let priority: String

    private var info: (label: String, color: Color) {
        switch priority {
        case "now":       return ("지금 당장", Color(red: 0.706, green: 0.137, blue: 0.094))
        case "this-week": return ("이번 주", Color(red: 0.918, green: 0.345, blue: 0.047))
        default:          return ("이번 달", Color(red: 0, green: 0.478, blue: 1.0))
        }
    }

    var body: some View {
        Text(info.label)
            .font(.system(size: 10, weight: .heavy))
            .foregroundStyle(info.color)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(info.color.opacity(0.10), in: Capsule())
            .overlay(
                Capsule().strokeBorder(info.color.opacity(0.22), lineWidth: 1)
            )
    }
}

// MARK: - Tool pill

private struct CoachToolPill: View {
    let tool: CoachTool
    let openURL: OpenURLAction

    private var tierColor: Color {
        switch tool.tier {
        case "free":  return Color(red: 0.204, green: 0.78, blue: 0.349)
        case "paid":  return Color(red: 0, green: 0.478, blue: 1.0)
        default:      return Color(red: 0.918, green: 0.345, blue: 0.047)
        }
    }

    private var tierLabel: String {
        switch tool.tier {
        case "free":  return "무료"
        case "paid":  return "유료"
        default:      return "부분 무료"
        }
    }

    var body: some View {
        Button {
            if let urlStr = tool.url, let url = URL(string: urlStr) { openURL(url) }
        } label: {
            HStack(spacing: 8) {
                Text(tool.name)
                    .font(.system(size: 12.5, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text(tierLabel)
                    .font(.system(size: 10, weight: .heavy))
                    .foregroundStyle(tierColor)
                    .padding(.horizontal, 6).padding(.vertical, 1.5)
                    .background(tierColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 5))
                Text(tool.purpose)
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineLimit(1)
                Spacer(minLength: 0)
                if tool.url != nil {
                    Text("→")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(tierColor)
                }
            }
            .padding(.horizontal, 11).padding(.vertical, 9)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(red: 0.97, green: 0.97, blue: 0.98), in: RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(tierColor.opacity(0.13), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .disabled(tool.url == nil)
    }
}

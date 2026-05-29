//
//  OnboardingChoiceView.swift — 신규 사장님 시작 경로 선택 (모바일 미러)
//
//  웹 SSOT: apps/web/app/lib/components/onboarding/OnboardingChoiceScreen.tsx
//
//  3 가지 선택:
//   1. 직접 로드맵 (Compass) — 단계별 안내, 약 30분
//   2. AI 맞춤 로드맵 (Sparkles, "추천" 배지) — 5분 + AI
//   3. 이미 운영 중 (Store) — 즉시 운영 대시보드, 약 3분
//
//  모바일 최적화:
//   • 데스크탑 3-column grid → 모바일 1-column 세로 스택
//   • 카드 높이 압축 — viewport 안에 3카드 모두 보이게
//   • 추천 배지 우상단 floating
//   • Apple Settings 톤 (미드나이트 단색, 색 분리 X)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

public enum OnboardingPath: String, Sendable, Hashable {
    case manual    // 직접 로드맵
    case ai        // AI 맞춤
    case existing  // 이미 운영 중
}

public struct OnboardingChoiceView: View {

    let onChoose: (OnboardingPath) -> Void

    public init(onChoose: @escaping (OnboardingPath) -> Void) {
        self.onChoose = onChoose
    }

    public var body: some View {
        ZStack {
            BUBackgroundSurface()

            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 18) {
                    // ── 헤더 ──
                    headerSection
                        .padding(.top, 36)
                        .padding(.bottom, 12)

                    // ── 3 카드 ──
                    VStack(spacing: 12) {
                        // 웹 SSOT: apps/web/app/lib/components/onboarding/OnboardingChoiceScreen.tsx
                        // 카피·단계 수·effort 라벨 모두 동일.
                        ChoiceCard(
                            icon: "safari",
                            title: "직접 로드맵",
                            description: "업종 선택부터 개업까지, 19단계를 직접 차근차근 진행합니다.",
                            effort: "약 30분",
                            effortIcon: "clock",
                            recommended: false,
                            action: { onChoose(.manual) }
                        )

                        ChoiceCard(
                            icon: "sparkles",
                            title: "AI 맞춤 로드맵",
                            description: "아이디어 한 줄만 입력하면 AI가 예산·상권·공급업체·일정까지 전부 설계합니다.",
                            effort: "5분 + AI",
                            effortIcon: "bolt.fill",
                            recommended: true,
                            action: { onChoose(.ai) }
                        )

                        ChoiceCard(
                            icon: "storefront",
                            title: "이미 운영 중",
                            description: "기존 가게 정보 (상호·매출·비용) 만 입력하면 운영 대시보드 즉시 사용.",
                            effort: "약 3분",
                            effortIcon: "clock",
                            recommended: false,
                            action: { onChoose(.existing) }
                        )
                    }
                    .padding(.horizontal, BUSpacing.md)

                    // ── 푸터 안내 ──
                    Text("어떤 선택이든 언제든 다른 모드로 전환 가능 · 데이터는 자동 저장")
                        .font(.system(size: 11.5, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, BUSpacing.lg)
                        .padding(.top, 20)
                        .padding(.bottom, 32)
                }
            }
        }
    }

    private var headerSection: some View {
        VStack(spacing: 14) {
            HStack(spacing: 5) {
                Image(systemName: "sparkles")
                    .font(.system(size: 10, weight: .semibold))
                Text("BUILD.UP")
                    .font(.system(size: 10.5, weight: .heavy))
                    .tracking(1.6)
            }
            .foregroundStyle(BUColor.midnight)
            .padding(.horizontal, 11)
            .padding(.vertical, 5)
            .background(BUColor.midnight.opacity(0.06), in: Capsule())

            Text("어디서부터 시작할까요?")
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(BUColor.midnightDeep)
                .tracking(-0.9)
                .multilineTextAlignment(.center)

            Text("한 번 선택하면 이후 화면이 자동으로 정리됩니다.\n언제든 설정에서 바꿀 수 있어요.")
                .font(.system(size: 13.5, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .multilineTextAlignment(.center)
                .lineSpacing(2)
                .padding(.horizontal, BUSpacing.lg)
        }
    }
}

// MARK: - ChoiceCard

private struct ChoiceCard: View {
    let icon: String
    let title: String
    let description: String
    let effort: String
    let effortIcon: String
    let recommended: Bool
    let action: () -> Void

    var body: some View {
        Button(action: {
            #if canImport(UIKit)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            #endif
            action()
        }) {
            ZStack(alignment: .topTrailing) {
                cardBody

                if recommended {
                    HStack(spacing: 3) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 9, weight: .bold))
                        Text("추천")
                            .font(.system(size: 9.5, weight: .heavy))
                            .tracking(0.5)
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 4)
                    .background(BUColor.midnight, in: Capsule())
                    .shadow(color: BUColor.midnight.opacity(0.28), radius: 6, x: 0, y: 3)
                    .offset(x: -14, y: -8)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var cardBody: some View {
        HStack(alignment: .top, spacing: 14) {
            // 아이콘 박스
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(BUColor.midnight.opacity(0.08))
                    .frame(width: 46, height: 46)
                Image(systemName: icon)
                    .font(.system(size: 19, weight: .regular))
                    .foregroundStyle(BUColor.midnight)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(BUColor.midnightDeep)
                    .tracking(-0.45)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)

                Text(description)
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2.5)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)

                // 푸터 — effort + arrow
                HStack(spacing: 6) {
                    HStack(spacing: 4) {
                        Image(systemName: effortIcon)
                            .font(.system(size: 10, weight: .semibold))
                        Text(effort)
                            .font(.system(size: 11, weight: .semibold))
                    }
                    .foregroundStyle(BUColor.inkMuted.opacity(0.75))

                    Spacer(minLength: 0)

                    HStack(spacing: 3) {
                        Text("시작")
                            .font(.system(size: 12, weight: .heavy))
                        Image(systemName: "arrow.right")
                            .font(.system(size: 10, weight: .bold))
                    }
                    .foregroundStyle(BUColor.midnight)
                }
                .padding(.top, 8)
            }
        }
        .padding(EdgeInsets(top: 18, leading: 16, bottom: 16, trailing: 16))
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0.98),
                            BUColor.midnight.opacity(0.018),
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .strokeBorder(
                    recommended ? BUColor.midnight.opacity(0.18) : BUColor.midnight.opacity(0.08),
                    lineWidth: recommended ? 1.2 : 0.8
                )
        )
        .shadow(
            color: BUColor.midnight.opacity(recommended ? 0.10 : 0.05),
            radius: recommended ? 16 : 10,
            x: 0,
            y: recommended ? 8 : 4
        )
    }
}

// MARK: - Preview

#if DEBUG
#Preview("OnboardingChoice") {
    OnboardingChoiceView { path in
        print("선택: \(path.rawValue)")
    }
}
#endif

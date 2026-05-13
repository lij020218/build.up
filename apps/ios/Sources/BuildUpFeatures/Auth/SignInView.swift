//
//  SignInView.swift — 로그인 화면 (웹 /auth/page.tsx 정확 미러)
//
//  웹 SSOT: apps/web/app/auth/page.tsx 의 hero section (1699줄 landing + auth)
//
//   • 다크 톤 배경 (#0a0a14 베이스)
//   • 푸른 톤 hero eyebrow (#5B8CFF)
//   • 거대 hero title (clamp 44-80px → 모바일 40pt)
//   • 부제목 (rgba(255,255,255,0.7))
//   • CTA gradient (#1E2A55 → #2C4F80, radius 980, shadow)
//   • radial-gradient overlay (rgba(91,140,255,0.15))
//   • minHeight: 100vh — viewport 꽉 채움
//

import SwiftUI
import AuthenticationServices
import BuildUpDesignSystem
import BuildUpAuth
import BuildUpData

#if canImport(UIKit)
import UIKit
#endif

public struct SignInView: View {

    @Bindable public var coordinator: AuthCoordinator

    public init(coordinator: AuthCoordinator) {
        self.coordinator = coordinator
    }

    public var body: some View {
        ZStack {
            // 다크 베이스
            AuthDarkBackground()

            ScrollView {
                VStack(spacing: BUSpacing.xl) {
                    Spacer(minLength: BUSpacing.xxxl)

                    // ── Hero ──
                    HeroBlock()

                    // ── CTA 버튼 그룹 ──
                    VStack(spacing: BUSpacing.sm) {
                        KakaoButton {
                            Task { await coordinator.signInWithKakao() }
                        }
                        AppleButton {
                            Task { await coordinator.signInWithApple() }
                        }
                        EmailButton {
                            // TODO: email sheet
                        }
                    }
                    .padding(.horizontal, BUSpacing.lg)

                    // ── 상태 + footer ──
                    statusView
                        .padding(.top, BUSpacing.sm)

                    Spacer(minLength: BUSpacing.xxl)

                    LegalFooter()
                        .padding(.horizontal, BUSpacing.lg)
                        .padding(.bottom, BUSpacing.lg)
                }
                .frame(maxWidth: .infinity, minHeight: 700)
            }
        }
        .preferredColorScheme(.dark)
        .ignoresSafeArea(.container, edges: .all)
    }

    @ViewBuilder
    private var statusView: some View {
        switch coordinator.state {
        case .authenticating:
            HStack(spacing: 6) {
                ProgressView()
                    .controlSize(.small)
                    .tint(.white)
                Text("로그인 중")
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.7))
            }
        case .failed(let msg):
            Text(msg)
                .font(.system(size: 13))
                .foregroundStyle(Color(red: 1.0, green: 0.42, blue: 0.42))
                .multilineTextAlignment(.center)
                .padding(.horizontal, BUSpacing.lg)
        default:
            EmptyView()
        }
    }
}

// MARK: - Dark background (웹 auth bg)

private struct AuthDarkBackground: View {
    var body: some View {
        ZStack {
            // 베이스 — 깊은 미드나잇 다크
            Color(red: 0x0A/255, green: 0x0A/255, blue: 0x18/255)
                .ignoresSafeArea()

            // Radial glow 1 — 가운데 푸른 톤 (radial-gradient(ellipse 80% 60% at 50% 40%, rgba(91,140,255,0.15)))
            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [
                            Color(red: 0x5B/255, green: 0x8C/255, blue: 0xFF/255).opacity(0.22),
                            Color(red: 0x5B/255, green: 0x8C/255, blue: 0xFF/255).opacity(0.0),
                        ],
                        center: .center,
                        startRadius: 30,
                        endRadius: 400
                    )
                )
                .frame(width: 700, height: 500)
                .offset(x: 0, y: -150)
                .blur(radius: 20)
                .allowsHitTesting(false)

            // Radial glow 2 — 하단 보조
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            Color(red: 0x1E/255, green: 0x2A/255, blue: 0x55/255).opacity(0.4),
                            .clear,
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: 300
                    )
                )
                .frame(width: 500, height: 500)
                .offset(x: -100, y: 350)
                .allowsHitTesting(false)
        }
    }
}

// MARK: - Hero (eyebrow + title + sub)

private struct HeroBlock: View {
    var body: some View {
        VStack(spacing: BUSpacing.md) {
            // eyebrow — 푸른 톤 #5B8CFF
            Text("매일 5초로 시작하는")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Color(red: 0x5B/255, green: 0x8C/255, blue: 0xFF/255))
                .tracking(0.3)

            // Title — clamp(44-80px) → 모바일 40
            VStack(spacing: 4) {
                Text("사장님 옆에 함께,")
                    .font(.system(size: 36, weight: .bold, design: .default))
                    .foregroundStyle(.white)
                    .tracking(-1.4)
                Text("build.up")
                    .font(.system(size: 44, weight: .bold, design: .default))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [
                                .white,
                                Color(red: 0x5B/255, green: 0x8C/255, blue: 0xFF/255),
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .tracking(-1.8)
            }

            // Sub — rgba(255,255,255,0.7)
            Text("매출 한 줄, 매일 30초.\nAI 가 위기 신호와 코칭을 같이 봐드려요.")
                .font(.system(size: 15, weight: .regular))
                .foregroundStyle(.white.opacity(0.65))
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .tracking(-0.2)
                .padding(.top, 4)
        }
        .padding(.horizontal, BUSpacing.lg)
        .padding(.top, BUSpacing.xl)
    }
}

// MARK: - Kakao Button (다크 위 노란 — 카카오 표준)

private struct KakaoButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: "message.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.black.opacity(0.85))
                Text("카카오로 시작하기")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.black.opacity(0.85))
            }
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(
                Color(red: 0.99, green: 0.85, blue: 0.0),
                in: Capsule()
            )
        }
        .buttonStyle(PressableButtonStyle())
    }
}

// MARK: - Apple Button (gradient — 웹과 동일 #1E2A55 → #2C4F80)

private struct AppleButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: "apple.logo")
                    .font(.system(size: 16, weight: .medium))
                    .offset(y: -1.5)
                Text("Apple로 시작하기")
                    .font(.system(size: 15, weight: .semibold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(
                LinearGradient(
                    colors: [
                        Color(red: 0x1E/255, green: 0x2A/255, blue: 0x55/255),
                        Color(red: 0x2C/255, green: 0x4F/255, blue: 0x80/255),
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ),
                in: Capsule()
            )
            .shadow(
                color: Color(red: 0x1E/255, green: 0x2A/255, blue: 0x55/255).opacity(0.32),
                radius: 10,
                x: 0,
                y: 2
            )
        }
        .buttonStyle(PressableButtonStyle())
    }
}

// MARK: - Email — outline button (다크 위 흰 outline)

private struct EmailButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text("이메일로 계속하기")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.white.opacity(0.85))
                .frame(maxWidth: .infinity, minHeight: 50)
                .background(
                    .clear,
                    in: Capsule()
                )
                .overlay(
                    Capsule()
                        .strokeBorder(.white.opacity(0.2), lineWidth: 1)
                )
        }
        .buttonStyle(PressableButtonStyle())
    }
}

// MARK: - Footer

private struct LegalFooter: View {
    var body: some View {
        VStack(spacing: 6) {
            Text("로그인 시 약관에 동의합니다")
                .font(.system(size: 11))
                .foregroundStyle(.white.opacity(0.4))

            HStack(spacing: BUSpacing.sm) {
                Button("이용약관") {}
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.white.opacity(0.55))
                Text("·")
                    .font(.system(size: 11))
                    .foregroundStyle(.white.opacity(0.3))
                Button("개인정보처리방침") {}
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.white.opacity(0.55))
            }
        }
    }
}

// MARK: - Press style

private struct PressableButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .opacity(configuration.isPressed ? 0.88 : 1.0)
            .animation(.spring(response: 0.22, dampingFraction: 0.75), value: configuration.isPressed)
    }
}

// MARK: - Preview

#if DEBUG
@MainActor
private func makePreviewCoordinator() -> AuthCoordinator {
    let supabase = BUSupabase.makeForTest(env: .mockForPreview).client
    return AuthCoordinator(supabase: supabase)
}

#Preview("SignInView") {
    SignInView(coordinator: makePreviewCoordinator())
}
#endif

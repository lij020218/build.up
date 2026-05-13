//
//  SignInView.swift — 모바일 전용 로그인 화면
//
//  사장님 지침 (2026-05-14): "모바일 전용 로그인 페이지를 만들자"
//
//   • 웹의 다크 hero / mockup preview 패턴 안 따라감 — 모바일에 안 맞음
//   • 라이트 모드 + Aurora 배경 (앱 전체 톤 통일)
//   • Apple iOS 표준 onboarding 패턴 — Brand mark + 가치 제안 + 3 버튼 + 정책
//   • Dynamic Type 자동 지원 / 모든 Text fixedSize wrap
//   • viewport 꽉 채움 (status bar~home indicator)
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
            BUBackgroundSurface()  // Aurora — 앱 전체와 동일 톤

            VStack(spacing: 0) {
                Spacer(minLength: 0)

                BrandMark()
                    .padding(.bottom, BUSpacing.xl)

                ValuePropositions()
                    .padding(.horizontal, BUSpacing.lg)
                    .padding(.bottom, BUSpacing.xl)

                Spacer(minLength: 0)

                VStack(spacing: 10) {
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
                .padding(.horizontal, BUSpacing.md)

                statusView
                    .padding(.top, BUSpacing.sm)

                LegalFooter()
                    .padding(.top, BUSpacing.md)
                    .padding(.bottom, BUSpacing.lg)
                    .padding(.horizontal, BUSpacing.lg)
            }
        }
    }

    @ViewBuilder
    private var statusView: some View {
        switch coordinator.state {
        case .authenticating:
            HStack(spacing: 6) {
                ProgressView()
                    .controlSize(.small)
                Text("로그인 중")
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
            }
        case .failed(let msg):
            Text(msg)
                .font(.system(size: 12.5, weight: .medium))
                .foregroundStyle(BUColor.danger)
                .multilineTextAlignment(.center)
                .padding(.horizontal, BUSpacing.lg)
                .fixedSize(horizontal: false, vertical: true)
        default:
            EmptyView()
        }
    }
}

// MARK: - Brand Mark

private struct BrandMark: View {
    var body: some View {
        VStack(spacing: BUSpacing.md) {
            // Logo mark — 둥근 사각 + Aurora 그라디언트 (BrandBar 와 동일 톤)
            ZStack {
                LinearGradient(
                    colors: [BUColor.auroraNavy, BUColor.auroraBlue, BUColor.auroraTeal],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                Text("b")
                    .font(.system(size: 36, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .tracking(-0.5)
            }
            .frame(width: 72, height: 72)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .shadow(color: BUColor.midnightInk.opacity(0.18), radius: 16, x: 0, y: 8)

            // Wordmark
            HStack(spacing: 0) {
                Text("Build")
                    .font(.system(size: 30, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                Text(".")
                    .font(.system(size: 30, weight: .bold))
                    .foregroundStyle(BUColor.midnightInk)
                Text("UP")
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
            }
            .tracking(-1.1)

            // 부제목
            Text("매일 5초, 사장님 옆에 함께")
                .font(.system(size: 14.5, weight: .regular))
                .foregroundStyle(BUColor.inkSecondary)
                .multilineTextAlignment(.center)
                .tracking(-0.2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: - Value Propositions

private struct ValuePropositions: View {
    var body: some View {
        VStack(spacing: 10) {
            valueRow(
                icon: "chart.line.uptrend.xyaxis",
                title: "매일 30초 코칭",
                detail: "어제 매출 + 오늘 행동 1개"
            )
            valueRow(
                icon: "exclamationmark.shield.fill",
                title: "현금 위기 7일 전 알림",
                detail: "통장 부족 예상 즉시 푸시"
            )
            valueRow(
                icon: "map.fill",
                title: "46단계 로드맵",
                detail: "사장님 단계 맞춤 카드"
            )
        }
    }

    private func valueRow(icon: String, title: String, detail: String) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(BUColor.midnight08)
                    .frame(width: 36, height: 36)
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text(detail)
                    .font(.system(size: 11.5, weight: .regular))
                    .foregroundStyle(BUColor.inkMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }
}

// MARK: - Buttons

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
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
        }
        .buttonStyle(PressableButtonStyle())
    }
}

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
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
            .shadow(
                color: Color(red: 0x1E/255, green: 0x2A/255, blue: 0x55/255).opacity(0.20),
                radius: 8,
                x: 0,
                y: 2
            )
        }
        .buttonStyle(PressableButtonStyle())
    }
}

private struct EmailButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text("이메일로 계속하기")
                .font(.system(size: 13.5, weight: .medium))
                .foregroundStyle(BUColor.inkSecondary)
                .frame(maxWidth: .infinity, minHeight: 44)
        }
        .buttonStyle(.plain)
    }
}

private struct LegalFooter: View {
    var body: some View {
        VStack(spacing: 6) {
            Text("로그인 시 약관에 동의합니다")
                .font(.system(size: 11, weight: .regular))
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))

            HStack(spacing: BUSpacing.sm) {
                Button("이용약관") {}
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkSecondary)
                Text("·")
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkSubtle)
                Button("개인정보처리방침") {}
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(BUColor.inkSecondary)
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

#Preview("SignInView — Mobile Native") {
    SignInView(coordinator: makePreviewCoordinator())
}
#endif

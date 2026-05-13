//
//  SignInView.swift — 로그인 화면
//
//  카카오 (가장 큰, 한국 표준) + Apple Sign In + 이메일.
//  Liquid Glass 카드 위에 로고 + 가치 제안 + 3 버튼.
//

import SwiftUI
import AuthenticationServices
import BuildUpDesignSystem
import BuildUpAuth
import BuildUpData

public struct SignInView: View {

    @Bindable public var coordinator: AuthCoordinator

    public init(coordinator: AuthCoordinator) {
        self.coordinator = coordinator
    }

    public var body: some View {
        ZStack {
            BUBackgroundSurface()

            VStack(spacing: 0) {
                Spacer()

                // ── 로고 + 가치 제안 ──
                VStack(spacing: BUSpacing.md) {
                    Image(systemName: "chart.line.uptrend.xyaxis.circle.fill")
                        .font(.system(size: 64, weight: .light))
                        .foregroundStyle(BUColor.midnight)

                    VStack(spacing: 6) {
                        Text("build.up")
                            .font(.system(size: 34, weight: .bold))
                            .foregroundStyle(BUColor.midnightDeep)
                            .tracking(-1)

                        Text("매일 5초, 사장님 옆에 함께")
                            .font(BUFont.body)
                            .foregroundStyle(BUColor.inkSecondary)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.top, BUSpacing.xxxl)

                Spacer()

                // ── 로그인 버튼들 ──
                VStack(spacing: BUSpacing.xs) {
                    KakaoButton {
                        Task { await coordinator.signInWithKakao() }
                    }

                    AppleButton {
                        Task { await coordinator.signInWithApple() }
                    }
                    .frame(height: 52)

                    Button {
                        // TODO: Email sheet 표시
                    } label: {
                        Text("이메일로 로그인")
                            .font(BUFont.label)
                            .foregroundStyle(BUColor.inkSecondary)
                            .frame(maxWidth: .infinity, minHeight: 52)
                            .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.md, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: BURadius.md, style: .continuous)
                                    .strokeBorder(BUColor.border, lineWidth: 0.5)
                            )
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, BUSpacing.md)

                // ── 상태 (loading / 에러) ──
                statusView
                    .padding(.top, BUSpacing.md)

                // ── 정책 안내 ──
                VStack(spacing: 4) {
                    Text("로그인 시 [이용약관]과 [개인정보처리방침]에 동의합니다")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkMuted)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, BUSpacing.lg)
                .padding(.top, BUSpacing.lg)
                .padding(.bottom, BUSpacing.xl)
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
                Text("로그인 중...")
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)
            }
        case .failed(let msg):
            Text(msg)
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.danger)
                .multilineTextAlignment(.center)
                .padding(.horizontal, BUSpacing.lg)
        default:
            EmptyView()
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
                    .font(.system(size: 16, weight: .semibold))
                Text("카카오로 시작하기")
                    .font(BUFont.label)
            }
            .foregroundStyle(Color(red: 0.20, green: 0.20, blue: 0.20))
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(Color(red: 1.0, green: 0.90, blue: 0.0), in: RoundedRectangle(cornerRadius: BURadius.md, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private struct AppleButton: View {
    let action: () -> Void
    var body: some View {
        SignInWithAppleButton(.signIn) { _ in
            // request 설정은 AppleAuthProvider 내부에서 처리
        } onCompletion: { _ in
            action()
        }
        .signInWithAppleButtonStyle(.black)
        .cornerRadius(BURadius.md)
    }
}

// MARK: - Preview (Coordinator mock)

#if DEBUG
@MainActor
private func makePreviewCoordinator() -> AuthCoordinator {
    // 실제 supabase 의존성 — preview 에선 더미.
    // mockForPreview 환경 사용
    let supabase = BUSupabase.makeForTest(env: .mockForPreview).client
    return AuthCoordinator(supabase: supabase)
}

#Preview("SignInView") {
    SignInView(coordinator: makePreviewCoordinator())
}

#Preview("SignInView — Dark") {
    SignInView(coordinator: makePreviewCoordinator())
        .preferredColorScheme(.dark)
}
#endif

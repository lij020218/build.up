//
//  ResetPasswordView.swift — 앱 네이티브 비밀번호 재설정 화면
//
//  비밀번호 재설정 메일의 링크(foundone://auth/reset?code=…)를 같은 기기에서 열면
//  앱이 다시 열리고 AuthCoordinator 가 복구 세션을 만든 뒤 이 화면을 cover 로 표시.
//  사용자는 웹으로 이동하지 않고 앱 안에서 바로 새 비밀번호를 설정한다.
//
//  ⚠️ 웹(apps/web/app/auth/callback) 의 "새 비밀번호 설정" 화면과 내용·문구 동일하게 유지.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneAuth

struct ResetPasswordView: View {
    @Bindable var coordinator: AuthCoordinator

    @State private var newPassword = ""
    @State private var submitting = false
    @State private var errorText: String?
    @State private var done = false
    @FocusState private var focused: Bool

    /// 웹과 동일 규칙: 8자 이상 + 숫자 포함.
    private var strong: Bool {
        newPassword.count >= 8 &&
        newPassword.range(of: #"[0-9]"#, options: .regularExpression) != nil
    }

    var body: some View {
        ZStack {
            BUBackgroundSurface()

            ScrollView {
                VStack(spacing: BUSpacing.md) {
                    Spacer(minLength: 40)

                    if coordinator.recoveryError != nil {
                        errorCard
                    } else if done {
                        successCard
                    } else {
                        formCard
                    }

                    Spacer(minLength: 24)
                }
                .padding(.horizontal, BUSpacing.md)
                .frame(maxWidth: 460)
                .frame(maxWidth: .infinity)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .onAppear { focused = true }
    }

    // MARK: - 새 비밀번호 입력

    private var formCard: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: 14) {
                iconBadge(systemName: "lock.rotation", tint: BUColor.midnightInk)

                Text("새 비밀번호 설정")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .tracking(-0.5)

                Text("8자 이상, 숫자를 포함한 새 비밀번호를 입력해 주세요.")
                    .font(.system(size: 14))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                SecureField("새 비밀번호", text: $newPassword)
                    .textContentType(.newPassword)
                    .focused($focused)
                    .submitLabel(.done)
                    .onSubmit(submit)
                    .padding(.horizontal, 14)
                    .frame(height: 50)
                    .background(BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.md, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: BURadius.md, style: .continuous)
                            .strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1)
                    )

                // 강도 힌트
                if !newPassword.isEmpty && !strong {
                    Text("8자 이상이며 숫자를 1개 이상 포함해야 합니다.")
                        .font(.system(size: 12.5, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }

                if let errorText {
                    Text(errorText)
                        .font(.system(size: 12.5, weight: .medium))
                        .foregroundStyle(BUColor.danger)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Button(action: submit) {
                    HStack(spacing: 8) {
                        if submitting { ProgressView().tint(.white) }
                        Text(submitting ? "변경 중…" : "비밀번호 변경")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 52)
                    .background(
                        LinearGradient(
                            colors: [BUColor.auroraNavy, BUColor.midnightInk],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ),
                        in: RoundedRectangle(cornerRadius: BURadius.md, style: .continuous)
                    )
                    .opacity(strong && !submitting ? 1 : 0.5)
                }
                .buttonStyle(.plain)
                .disabled(!strong || submitting)
                .padding(.top, 2)

                Button {
                    Task { await coordinator.cancelPasswordRecovery() }
                } label: {
                    Text("취소하고 로그인으로 돌아가기")
                        .font(.system(size: 13.5, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - 성공

    private var successCard: some View {
        BUCard(.card) {
            VStack(spacing: 14) {
                iconBadge(systemName: "checkmark", tint: BUColor.success)

                Text("비밀번호가 변경되었습니다")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .multilineTextAlignment(.center)

                Text("새 비밀번호로 로그인된 상태입니다. 잠시 후 서비스로 이동합니다.")
                    .font(.system(size: 14))
                    .foregroundStyle(BUColor.inkSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
            }
            .frame(maxWidth: .infinity)
        }
    }

    // MARK: - 진입 실패 (만료/위변조)

    private var errorCard: some View {
        BUCard(.card) {
            VStack(spacing: 14) {
                iconBadge(systemName: "exclamationmark.triangle", tint: BUColor.danger)

                Text("링크를 확인할 수 없어요")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(BUColor.ink)
                    .multilineTextAlignment(.center)

                Text(coordinator.recoveryError ?? "비밀번호 재설정을 다시 요청해 주세요.")
                    .font(.system(size: 14))
                    .foregroundStyle(BUColor.inkSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                Button {
                    Task { await coordinator.cancelPasswordRecovery() }
                } label: {
                    Text("로그인으로 돌아가기")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 52)
                        .background(
                            LinearGradient(
                                colors: [BUColor.auroraNavy, BUColor.midnightInk],
                                startPoint: .topLeading, endPoint: .bottomTrailing
                            ),
                            in: RoundedRectangle(cornerRadius: BURadius.md, style: .continuous)
                        )
                }
                .buttonStyle(.plain)
                .padding(.top, 2)
            }
            .frame(maxWidth: .infinity)
        }
    }

    // MARK: - Helpers

    private func iconBadge(systemName: String, tint: Color) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(tint.opacity(0.12))
                .frame(width: 48, height: 48)
            Image(systemName: systemName)
                .font(.system(size: 21, weight: .semibold))
                .foregroundStyle(tint)
        }
    }

    private func submit() {
        guard strong, !submitting else { return }
        focused = false
        submitting = true
        errorText = nil
        Task {
            do {
                try await coordinator.updatePassword(newPassword)
                submitting = false
                withAnimation { done = true }
                try? await Task.sleep(nanoseconds: 1_300_000_000)
                coordinator.completePasswordRecovery()
            } catch {
                submitting = false
                errorText = "비밀번호 변경에 실패했어요. 8자 이상·숫자 포함인지 확인하고 다시 시도해 주세요."
            }
        }
    }
}

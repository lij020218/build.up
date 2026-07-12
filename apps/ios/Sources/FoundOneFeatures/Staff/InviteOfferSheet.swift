//
//  InviteOfferSheet.swift — 받은 채용 초대장 자동 표시 (2026-07-12, 웹 InviteOfferModal 미러)
//
//  동작: 앱 진입 후(owner 역할 확정 시) my_pending_invites 에 지정 초대가 있으면
//    초대장 시트가 자동으로 뜬다:
//      "「가게명」 업장에 직원으로 채용되셨습니다. 본인이 맞다면 수락 버튼을 눌러주세요."
//    [수락] → accept_store_invite → .buildupRoleMayHaveChanged 발신 →
//    AppRoot 역할 게이트가 재조회 → 직원 대시보드(StaffDashboardView)로 즉시 전환.
//    [나중에] → 이 세션 동안 그 초대는 다시 안 띄움 — 내 정보 › 가게 연결에서 언제든 수락.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

public struct InviteOfferSheet: View {

    @Environment(\.dismiss) private var dismiss

    private let invite: TeamPendingInvite
    private let onDismissLater: () -> Void

    public init(invite: TeamPendingInvite, onDismissLater: @escaping () -> Void) {
        self.invite = invite
        self.onDismissLater = onDismissLater
    }

    @State private var status: AcceptStatus = .idle
    private enum AcceptStatus { case idle, accepting, done, error }

    private var repo: TeamRepository { TeamRepository(supabase: BUSupabase.shared.client) }
    private var roleLabel: String { invite.role == "manager" ? "매니저" : "직원" }

    public var body: some View {
        ZStack {
            BUBackgroundSurface()
            VStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(BUColor.midnight.opacity(0.06))
                        .frame(width: 56, height: 56)
                    Image(systemName: "checkmark.seal")
                        .font(.system(size: 26, weight: .medium))
                        .foregroundStyle(BUColor.midnight)
                }
                .padding(.top, 26)

                Text("채용 초대장")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(BUColor.midnight)
                    .textCase(.uppercase)
                    .tracking(1)

                Text("「\(invite.storeName)」 업장에\n\(roleLabel)으로 채용되셨습니다")
                    .font(.system(size: 19, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)

                Text("본인이 맞다면 수락 버튼을 눌러주세요.\n수락하면 이 계정은 직원 모드로 전환되고\n근무표·출퇴근·연차 화면이 열립니다.")
                    .font(.system(size: 13.5))
                    .foregroundStyle(BUColor.inkSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)

                if status == .done {
                    Text("수락 완료! 직원 화면으로 이동합니다…")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(BUColor.midnight)
                        .padding(.vertical, 14)
                } else {
                    VStack(spacing: 8) {
                        Button {
                            Task { await accept() }
                        } label: {
                            Text(status == .accepting ? "수락 중…" : "본인이 맞아요 — 수락하기")
                                .font(.system(size: 15, weight: .heavy))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 13))
                        }
                        .buttonStyle(.plain)
                        .disabled(status == .accepting)

                        Button {
                            onDismissLater()
                            dismiss()
                        } label: {
                            Text("나중에 (내 정보 › 가게 연결에서 수락 가능)")
                                .font(.system(size: 12.5, weight: .semibold))
                                .foregroundStyle(BUColor.inkSecondary)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(.white, in: RoundedRectangle(cornerRadius: 13))
                                .overlay(RoundedRectangle(cornerRadius: 13).strokeBorder(BUColor.midnight.opacity(0.14), lineWidth: 1))
                        }
                        .buttonStyle(.plain)

                        if status == .error {
                            Text("수락에 실패했어요. 잠시 후 다시 시도하거나, 내 정보 › 가게 연결에서 수락해 주세요.")
                                .font(.system(size: 12))
                                .foregroundStyle(BUColor.danger)
                                .multilineTextAlignment(.center)
                        }
                    }
                    .padding(.top, 6)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, BUSpacing.lg)
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
        .interactiveDismissDisabled(status == .accepting)
    }

    private func accept() async {
        status = .accepting
        do {
            let result = try await repo.acceptInvite(code: invite.inviteCode)
            if result.ok {
                status = .done
                // 역할 게이트가 재조회해 직원 대시보드로 전환 (AppRoot .buildupRoleMayHaveChanged 수신)
                try? await Task.sleep(nanoseconds: 1_200_000_000)
                NotificationCenter.default.post(name: .buildupRoleMayHaveChanged, object: nil)
                dismiss()
            } else {
                status = .error
            }
        } catch {
            status = .error
        }
    }
}

//
//  StoreConnectSheet.swift — 직원용 「가게 연결」 시트 (2026-07-12)
//
//  웹 SSOT 미러: apps/web/app/lib/components/profile/StoreConnectCard.tsx
//
//  두 가지 연결 방법:
//    1) 받은 초대 — 사장이 내 이메일로 지정 초대한 경우 자동 표시 (my_pending_invites RPC,
//       마이그레이션 20260712_000001 미적용 환경에선 조용히 숨김)
//    2) 초대 코드 입력 — 사장이 불러준 8자리 코드 (accept_store_invite RPC)
//
//  ⚠️ 수락하면 business_profiles.user_role 이 staff 로 전환된다. iOS 는 아직 직원 전용
//    화면(역할 분기)이 없어 연결 후에도 사장 화면이 보인다 — 직원 대시보드 이식은 후속.
//    (웹에서는 직원 대시보드가 즉시 제공됨을 안내.)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

public struct StoreConnectSheet: View {

    @Environment(\.dismiss) private var dismiss

    @State private var pending: [TeamPendingInvite] = []
    @State private var codeInput = ""
    @State private var status: ConnectStatus = .idle
    @State private var errMsg: String? = nil
    @State private var connectedStore: String? = nil

    private enum ConnectStatus { case idle, loading, done, error }

    private var repo: TeamRepository { TeamRepository(supabase: BUSupabase.shared.client) }

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        Text("다른 가게에 직원으로 연결하면 근무표·연차를 이 계정으로 관리합니다. 연결 시 이 계정은 직원 모드로 전환돼요.")
                            .font(.system(size: 12.5))
                            .foregroundStyle(BUColor.inkSecondary)
                            .lineSpacing(3)

                        if status == .done {
                            successCard
                        } else {
                            if !pending.isEmpty { pendingCard }
                            codeEntryCard
                        }
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("가게 연결")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarLeading) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                #endif
            }
            .task {
                // RPC 미배포 환경에선 조용히 빈 목록 (웹 미러)
                pending = (try? await repo.pendingInvites()) ?? []
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // ── 받은 초대 (이메일 지정) ──
    private var pendingCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 8) {
                Text("받은 초대")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(BUColor.midnight)
                    .textCase(.uppercase)
                    .tracking(0.5)
                ForEach(pending) { inv in
                    HStack(spacing: 10) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(inv.storeName)
                                .font(.system(size: 13.5, weight: .heavy))
                                .foregroundStyle(BUColor.ink)
                            Text(inv.role == "manager" ? "매니저" : "직원")
                                .font(.system(size: 11.5))
                                .foregroundStyle(BUColor.inkSecondary)
                        }
                        Spacer(minLength: 0)
                        Button {
                            Task { await accept(code: inv.inviteCode, storeName: inv.storeName) }
                        } label: {
                            Text("수락")
                                .font(.system(size: 12.5, weight: .heavy))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 14).padding(.vertical, 8)
                                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 9))
                        }
                        .disabled(status == .loading)
                    }
                    .padding(10)
                    .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 12))
                }
            }
        }
    }

    // ── 초대 코드 직접 입력 ──
    private var codeEntryCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                Text("초대 코드 입력")
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text("사장님이 불러준 8자리 코드를 입력하세요.")
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                HStack(spacing: 8) {
                    TextField("예: A1B2C3D4", text: $codeInput)
                        .font(.system(size: 14, weight: .semibold, design: .monospaced))
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .onChange(of: codeInput) { _, v in codeInput = v.uppercased() }
                    Button {
                        Task { await accept(code: codeInput, storeName: nil) }
                    } label: {
                        Text(status == .loading ? "연결 중…" : "연결")
                            .font(.system(size: 13, weight: .heavy))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 16).padding(.vertical, 9)
                            .background(
                                codeInput.trimmingCharacters(in: .whitespaces).count >= 6 ? BUColor.midnight : BUColor.midnight.opacity(0.25),
                                in: RoundedRectangle(cornerRadius: 10)
                            )
                    }
                    .disabled(codeInput.trimmingCharacters(in: .whitespaces).count < 6 || status == .loading)
                }
                if let errMsg {
                    Text(errMsg)
                        .font(.system(size: 12))
                        .foregroundStyle(BUColor.danger)
                        .lineSpacing(2)
                }
            }
        }
    }

    private var successCard: some View {
        BUCard(.outer) {
            VStack(spacing: 10) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(BUColor.midnight)
                Text("연결 완료\(connectedStore.map { " — \($0)" } ?? "")!")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text("근무표·출퇴근·연차는 웹 직원 화면에서 바로 쓸 수 있어요.\niOS 직원 화면은 준비 중입니다.")
                    .font(.system(size: 12.5))
                    .foregroundStyle(BUColor.inkSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
    }

    private func accept(code: String, storeName: String?) async {
        status = .loading
        errMsg = nil
        do {
            let result = try await repo.acceptInvite(code: code)
            if result.ok {
                connectedStore = storeName
                status = .done
                // 역할이 staff 로 전환됨 — AppRoot 역할 게이트가 재조회해 직원 화면으로 전환.
                NotificationCenter.default.post(name: .buildupRoleMayHaveChanged, object: nil)
            } else {
                errMsg = Self.reasonKo(result.reason ?? "unknown")
                status = .error
            }
        } catch {
            errMsg = "연결에 실패했어요. 네트워크를 확인해 주세요."
            status = .error
        }
    }

    private static func reasonKo(_ reason: String) -> String {
        switch reason {
        case "not-found": return "코드를 찾을 수 없어요. 코드를 다시 확인해 주세요."
        case "used": return "이미 사용된 초대예요. 사장님께 새 초대를 요청하세요."
        case "expired": return "만료된 초대예요 (7일 유효). 사장님께 새 초대를 요청하세요."
        case "self": return "본인 가게의 초대는 수락할 수 없어요."
        case "wrong-account": return "이 초대는 다른 이메일 계정으로 지정됐어요. 해당 계정으로 로그인해 주세요."
        case "not-authenticated": return "로그인이 필요해요."
        default: return "연결에 실패했어요. 잠시 후 다시 시도해 주세요."
        }
    }
}

//
//  OnboardingAccountSheet.swift — 온보딩 중 "내 정보" (로그아웃 · 계정 삭제)
//
//  2026-08-19 사장님 지시: 가입 직후 온보딩을 끝내지 않아도 로그아웃·계정 삭제가 가능해야 한다
//  (웹 OnboardingAccountMenu 와 동일 동작). App Review 도 가입 → 즉시 삭제 경로를 확인한다.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneAuth

/// 온보딩 화면 우상단 계정 버튼 — 어떤 온보딩 경로(선택·수동·AI·기존가게)에서도 항상 보인다.
struct OnboardingAccountButton: View {
    let coordinator: AuthCoordinator?
    @State private var showSheet = false

    var body: some View {
        Button {
            showSheet = true
        } label: {
            Image(systemName: "person.crop.circle")
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(BUColor.midnight)
                .padding(8)
                .background(.ultraThinMaterial, in: Circle())
        }
        .accessibilityLabel("내 정보")
        .sheet(isPresented: $showSheet) {
            OnboardingAccountSheet(coordinator: coordinator)
        }
    }
}

struct OnboardingAccountSheet: View {
    let coordinator: AuthCoordinator?
    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteConfirm = false
    @State private var isDeleting = false
    @State private var deleteFailedMsg: String? = nil

    private var email: String { coordinator?.currentSession?.email ?? "" }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 12) {
                        Image(systemName: "person.crop.circle.fill")
                            .font(.system(size: 34))
                            .foregroundStyle(BUColor.midnight.opacity(0.7))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(email.isEmpty ? "로그인 계정" : email)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(BUColor.ink)
                            Text("온보딩 진행 중 — 언제든 로그아웃하거나 계정을 지울 수 있어요")
                                .font(.system(size: 12))
                                .foregroundStyle(BUColor.inkMuted)
                        }
                    }
                    .padding(.vertical, 4)
                }
                Section {
                    Button {
                        Task { await coordinator?.signOut(); dismiss() }
                    } label: {
                        Label("로그아웃", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                    .disabled(coordinator == nil)
                    Button(role: .destructive) {
                        showDeleteConfirm = true
                    } label: {
                        HStack {
                            Label("계정 삭제", systemImage: "trash")
                            if isDeleting { Spacer(); ProgressView().controlSize(.small) }
                        }
                    }
                    .disabled(coordinator == nil || isDeleting)
                } footer: {
                    Text("계정 삭제는 즉시·영구 처리되며 서버의 모든 데이터가 함께 지워져요. 다시 가입하면 처음부터 시작합니다.")
                }
            }
            .navigationTitle("내 정보")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } } }
        }
        .presentationDetents([.medium])
        .alert("계정을 삭제하시겠어요?", isPresented: $showDeleteConfirm) {
            Button("취소", role: .cancel) {}
            Button("삭제", role: .destructive) {
                guard let coordinator else { return }
                isDeleting = true
                Task {
                    let ok = await coordinator.deleteAccount()
                    isDeleting = false
                    if ok { dismiss() } else { deleteFailedMsg = coordinator.deleteError }
                }
            }
        } message: {
            Text("되돌릴 수 없어요. 로그인 정보와 지금까지 입력한 내용이 모두 삭제됩니다.")
        }
        .alert("계정 삭제에 실패했습니다", isPresented: Binding(get: { deleteFailedMsg != nil }, set: { if !$0 { deleteFailedMsg = nil; coordinator?.clearDeleteError() } })) {
            Button("확인", role: .cancel) {}
        } message: {
            Text(deleteFailedMsg ?? "")
        }
    }
}

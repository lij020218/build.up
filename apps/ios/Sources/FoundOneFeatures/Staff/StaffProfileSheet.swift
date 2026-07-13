//
//  StaffProfileSheet.swift — 직원용 「내 정보」 시트 (2026-07-13)
//
//  웹 SSOT 미러: apps/web/app/lib/components/surfaces/StaffProfileModal.tsx
//    ① 계정(이름·이메일) ② 소속 가게(가게명·역할)
//    ③ 가게 연결(StoreConnectSheet 열기 — 다른 가게 초대 수락·코드 입력) ④ 로그아웃
//
//  배경: 직원 계정은 StaffDashboardView 단일 화면이라 내 정보·로그아웃 접근이
//    없었음(사장님 지적). 사장 ProfileView 재사용 대신 직원 필수 항목만 담은 경량 시트.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

public struct StaffProfileSheet: View {

    @Environment(\.dismiss) private var dismiss

    private let storeName: String
    private let role: String
    private let onSignOut: () -> Void

    public init(storeName: String, role: String, onSignOut: @escaping () -> Void) {
        self.storeName = storeName
        self.role = role
        self.onSignOut = onSignOut
    }

    @State private var email: String? = nil
    @State private var name: String? = nil
    @State private var showStoreConnect = false

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        accountCard
                        workplaceCard
                        storeConnectCard
                        signOutButton
                        Color.clear.frame(height: 30)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("내 정보")
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
            .sheet(isPresented: $showStoreConnect) { StoreConnectSheet() }
            .task {
                if let user = BUSupabase.shared.currentUser {
                    email = user.email
                    if let meta = user.userMetadata["name"]?.stringValue { name = meta }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    // ① 계정
    private var accountCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                Label("계정", systemImage: "person.crop.circle")
                    .font(.system(size: 13, weight: .heavy)).foregroundStyle(BUColor.midnight)
                if let name {
                    infoRow(label: "이름", value: name)
                }
                infoRow(label: "이메일", value: email ?? "…")
            }
        }
    }

    // ② 소속 가게
    private var workplaceCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 10) {
                Label("소속 가게", systemImage: "storefront")
                    .font(.system(size: 13, weight: .heavy)).foregroundStyle(BUColor.midnight)
                HStack(spacing: 8) {
                    Text(storeName).font(.system(size: 14, weight: .heavy)).foregroundStyle(BUColor.ink)
                    Text(role == "manager" ? "매니저" : "직원")
                        .font(.system(size: 11, weight: .heavy)).foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 8).padding(.vertical, 2)
                        .background(BUColor.midnight.opacity(0.07), in: Capsule())
                }
            }
        }
    }

    // ③ 가게 연결 (다른 가게 초대 수락·코드 입력)
    private var storeConnectCard: some View {
        Button { showStoreConnect = true } label: {
            BUCard(.outer) {
                HStack(spacing: 10) {
                    Image(systemName: "person.badge.key")
                        .font(.system(size: 16, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("다른 가게 연결").font(.system(size: 13.5, weight: .heavy)).foregroundStyle(BUColor.ink)
                        Text("받은 초대 수락·초대 코드 입력").font(.system(size: 11.5)).foregroundStyle(BUColor.inkSecondary)
                    }
                    Spacer(minLength: 0)
                    Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                }
            }
        }
        .buttonStyle(.plain)
    }

    // ④ 로그아웃
    private var signOutButton: some View {
        Button(action: onSignOut) {
            Label("로그아웃", systemImage: "rectangle.portrait.and.arrow.right")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.inkSecondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 13)
                .background(.white, in: RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(BUColor.midnight.opacity(0.14), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private func infoRow(label: String, value: String) -> some View {
        HStack(spacing: 8) {
            Text(label).font(.system(size: 11.5, weight: .heavy)).foregroundStyle(BUColor.inkMuted).frame(width: 56, alignment: .leading)
            Text(value).font(.system(size: 13, weight: .semibold)).foregroundStyle(BUColor.ink).lineLimit(1)
            Spacer(minLength: 0)
        }
    }
}

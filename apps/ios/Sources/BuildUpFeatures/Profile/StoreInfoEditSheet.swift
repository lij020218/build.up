//
//  StoreInfoEditSheet.swift — 가게 이름 + 영업시간 편집 (Profile 카드 → 시트).
//
//  웹 SSOT: StoreNameInput.tsx + BusinessHoursInput.tsx (stages/shared).
//  Supabase 컬럼: user_store_data.store_name / business_open_time / business_close_time.
//  업종이 online-digital / startup-tech 면 영업시간 섹션 숨김.
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpData
import BuildUpCore

struct StoreInfoEditSheet: View {
    let initialStoreName: String
    let initialOpen: String?
    let initialClose: String?
    let industryCategoryId: String?
    let onSaved: (String, String?, String?) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var name: String
    @State private var open: String
    @State private var close: String
    @State private var saving: Bool = false
    @State private var error: String? = nil

    private let presets: [(label: String, open: String, close: String)] = [
        ("음식점 (11–22시)",   "11:00", "22:00"),
        ("카페 (08–22시)",     "08:00", "22:00"),
        ("야간 (17–02시)",     "17:00", "02:00"),
        ("주간 (09–18시)",     "09:00", "18:00"),
    ]

    private var hideHours: Bool {
        // iOS IndustryCategory.rawValue 와 매핑: ecommerce / startupTech
        // 웹 categoryId 도 함께 처리 (online-digital / startup-tech) — 향후 통합 시 대비.
        let id = industryCategoryId ?? ""
        return id == "ecommerce" || id == "startupTech"
            || id == "online-digital" || id == "startup-tech"
    }

    init(
        initialStoreName: String,
        initialOpen: String?,
        initialClose: String?,
        industryCategoryId: String?,
        onSaved: @escaping (String, String?, String?) -> Void
    ) {
        self.initialStoreName = initialStoreName
        self.initialOpen = initialOpen
        self.initialClose = initialClose
        self.industryCategoryId = industryCategoryId
        self.onSaved = onSaved
        _name  = State(initialValue: initialStoreName)
        _open  = State(initialValue: initialOpen ?? "")
        _close = State(initialValue: initialClose ?? "")
    }

    var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.md) {
                        Text("가게 정보 편집")
                            .font(.system(size: 22, weight: .heavy))
                            .foregroundStyle(BUColor.ink)

                        nameCard
                        if !hideHours {
                            hoursCard
                            presetCard
                        }

                        if let err = error {
                            Text(err)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(Color(red: 0.624, green: 0.102, blue: 0.176))
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color(red: 1, green: 0.231, blue: 0.188).opacity(0.06), in: RoundedRectangle(cornerRadius: 12))
                        }

                        saveButton

                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.screenMargin)
                    .padding(.top, BUSpacing.md)
                }
            }
            .navigationTitle("가게 정보")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") { dismiss() }
                }
            }
        }
    }

    // MARK: - Sections

    private var nameCard: some View {
        formCard {
            label("가게 이름")
            TextField("예: 큰맘할매순대국", text: $name)
                .font(.system(size: 16, weight: .heavy))
                .foregroundStyle(BUColor.ink)
                .textInputAutocapitalization(.never)
                .submitLabel(.done)
        }
    }

    private var hoursCard: some View {
        formCard {
            label("영업시간")
            HStack(spacing: 8) {
                hourField(title: "오픈", text: $open)
                Text("~")
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.inkMuted)
                hourField(title: "마감", text: $close)
            }
            Text("HH:MM 24시간 형식. 24시간 운영이면 둘 다 비워두세요.")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
        }
    }

    private var presetCard: some View {
        formCard {
            label("프리셋")
            VStack(spacing: 6) {
                ForEach(Array(presets.enumerated()), id: \.offset) { _, p in
                    Button {
                        open = p.open
                        close = p.close
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "clock")
                                .font(.system(size: 11, weight: .heavy))
                                .foregroundStyle(BUColor.midnight)
                            Text(p.label)
                                .font(.system(size: 13, weight: .heavy))
                                .foregroundStyle(BUColor.ink)
                            Spacer(minLength: 0)
                            if open == p.open && close == p.close {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 13, weight: .heavy))
                                    .foregroundStyle(BUColor.midnight)
                            }
                        }
                        .padding(.horizontal, 12).padding(.vertical, 10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(open == p.open && close == p.close ? BUColor.midnight.opacity(0.08) : Color.white.opacity(0.6))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                }
                Button {
                    open = ""
                    close = ""
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "infinity")
                            .font(.system(size: 11, weight: .heavy))
                        Text("24시간 운영")
                            .font(.system(size: 13, weight: .heavy))
                        Spacer(minLength: 0)
                        if open.isEmpty && close.isEmpty {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 13, weight: .heavy))
                        }
                    }
                    .foregroundStyle(BUColor.ink)
                    .padding(.horizontal, 12).padding(.vertical, 10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(open.isEmpty && close.isEmpty ? BUColor.midnight.opacity(0.08) : Color.white.opacity(0.6))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .strokeBorder(BUColor.cardBorder, lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var saveButton: some View {
        Button {
            Task { await save() }
        } label: {
            HStack(spacing: 6) {
                if saving { ProgressView().scaleEffect(0.85).tint(.white) }
                Text(saving ? "저장 중…" : "저장")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(.white)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(canSave ? BUColor.midnight : BUColor.inkMuted.opacity(0.4), in: Capsule())
        }
        .buttonStyle(.plain)
        .disabled(!canSave || saving)
    }

    private var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
    }

    // MARK: - Save

    private func save() async {
        guard let uid = BUSupabase.shared.currentUser?.id else {
            error = "로그인이 필요합니다."
            return
        }
        saving = true
        error = nil
        defer { saving = false }

        let repo = StoreProfileRepository(supabase: BUSupabase.shared.client, userId: uid)
        do {
            let openVal: String? = hideHours ? nil : (open.isEmpty ? nil : open)
            let closeVal: String? = hideHours ? nil : (close.isEmpty ? nil : close)
            try await repo.updateAll(
                storeName: name,
                open: openVal,
                close: closeVal
            )
            onSaved(name.trimmingCharacters(in: .whitespaces), openVal, closeVal)
            dismiss()
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    // MARK: - Building blocks

    @ViewBuilder
    private func formCard<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            content()
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

    private func label(_ s: String) -> some View {
        Text(s)
            .font(.system(size: 11, weight: .heavy))
            .tracking(0.5)
            .textCase(.uppercase)
            .foregroundStyle(BUColor.inkMuted.opacity(0.75))
    }

    private func hourField(title: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted.opacity(0.65))
            TextField("--:--", text: text)
                .keyboardType(.numbersAndPunctuation)
                .font(.system(size: 16, weight: .heavy))
                .foregroundStyle(BUColor.ink)
                .padding(.horizontal, 10).padding(.vertical, 9)
                .background(Color.white.opacity(0.96), in: RoundedRectangle(cornerRadius: 8))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .strokeBorder(BUColor.cardBorder, lineWidth: 1)
                )
        }
    }
}

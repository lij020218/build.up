//
//  HeroAtAGlance.swift — 내 가게 페이지 최상단 Hero (Phase A.5 폴리시)
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/components/my-store/HeroAtAGlance.tsx
//
//  포함:
//   • 사진 placeholder (dashed border 빈 상태, AsyncImage 표시) — 업로드는 다음 piece
//   • 가게명·미션·주소·전화 (Apple-style 타이포)
//   • 주소 탭 → confirmationDialog → 애플맵/카카오맵/네이버지도
//   • 전화 탭 → tel: 통화
//   • 영업시간 weekly grid (offline cluster 전용) — 휴무일 회색+strike, breakTime 표시
//   • 6 metrics: 잔고·직원·거래처·인허가·보험·갱신임박 (만료 임박 시 dot)
//   • D-Day pill (urgency 1건+ 있을 때만) — 탭 → DDayListSheet
//
//  다음 piece:
//   • PhotosPicker + Supabase Storage 업로드 (탭 → 카메라/앨범)
//   • 영업시간 텍스트 자체는 user_store_data.business_open_time 에서 fetch 필요 (별도 데이터)
//

import SwiftUI
import PhotosUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct HeroAtAGlance: View {

    @ObservedObject var store: StoreInfoStore
    let photoUploader: StorePhotoUploader?

    @AppStorage("roadmap.cluster") private var clusterRaw = "offline-food"

    @State private var showAddressActions = false
    @State private var showDDayList = false

    // 사진 업로드 UI state
    @State private var pickerItem: PhotosPickerItem?
    @State private var uploadState: UploadState = .idle
    @State private var uploadError: String?

    private enum UploadState: Equatable {
        case idle
        case loading      // PhotosPickerItem → Data 로딩 중
        case uploading    // Supabase Storage 진행 중
        case failed
    }

    public init(store: StoreInfoStore, photoUploader: StorePhotoUploader? = nil) {
        self.store = store
        self.photoUploader = photoUploader
    }

    private var s: StoreInfoState { store.state }

    private var dDayItems: [DDayItem] {
        DDayCalculator.collect(from: s)
    }

    private var hasAnyDDay: Bool {
        dDayItems.contains(where: { $0.daysRemaining <= 30 })
    }

    private var isOfflineCluster: Bool {
        clusterRaw.hasPrefix("offline-")
    }

    private var hasHoursInfo: Bool {
        !s.weeklyHolidays.isEmpty || !s.breakTime.isEmpty
    }

    public var body: some View {
        BUCard(.hero) {
            VStack(alignment: .leading, spacing: BUSpacing.md) {
                topRow

                if isOfflineCluster && hasHoursInfo {
                    Divider().background(BUColor.midnight.opacity(0.08))
                    businessHoursSection
                }

                Divider().background(BUColor.midnight.opacity(0.08))
                metricsSection

                if hasAnyDDay {
                    dDayPill
                }
            }
        }
        .confirmationDialog(
            "지도에서 열기",
            isPresented: $showAddressActions,
            titleVisibility: .visible,
            actions: { addressDialogActions },
            message: { Text(s.addressRoad).font(.caption) }
        )
        .sheet(isPresented: $showDDayList) {
            DDayListSheet(items: dDayItems)
        }
        .onChange(of: pickerItem) { _, newItem in
            guard let newItem else { return }
            Task { await handlePicked(newItem) }
        }
        .alert("사진 업로드 실패", isPresented: uploadFailedBinding) {
            Button("확인", role: .cancel) {}
        } message: {
            Text(uploadError ?? "다시 시도해주세요")
        }
    }

    // MARK: - Photo upload flow

    private var uploadFailedBinding: Binding<Bool> {
        Binding(
            get: { uploadError != nil },
            set: { newValue in
                if !newValue {
                    uploadError = nil
                    if case .failed = uploadState { uploadState = .idle }
                }
            }
        )
    }

    private func handlePicked(_ item: PhotosPickerItem) async {
        guard let uploader = photoUploader else {
            uploadError = "업로더가 준비되지 않았어요"
            uploadState = .failed
            pickerItem = nil
            return
        }

        uploadState = .loading
        uploadError = nil

        // 1) PhotosPickerItem → Data
        let data: Data?
        do {
            data = try await item.loadTransferable(type: Data.self)
        } catch {
            uploadState = .failed
            uploadError = "사진을 불러올 수 없어요"
            pickerItem = nil
            return
        }
        guard let data else {
            uploadState = .failed
            uploadError = "사진 데이터가 비어있어요"
            pickerItem = nil
            return
        }

        // 2) Supabase Storage 업로드
        uploadState = .uploading
        do {
            let photo = try await uploader.upload(data)
            // 새 사진을 맨 앞으로
            store.commit { state in
                state.storePhotos = [photo] + state.storePhotos
            }
            await store.flushImmediate()
            uploadState = .idle
        } catch {
            uploadState = .failed
            uploadError = (error as? LocalizedError)?.errorDescription
                ?? error.localizedDescription
        }

        pickerItem = nil
    }

    // MARK: - Top Row (photo + info)

    private var topRow: some View {
        HStack(alignment: .top, spacing: BUSpacing.md) {
            photoArea

            VStack(alignment: .leading, spacing: 6) {
                storeName

                if !s.mission.isEmpty {
                    Text(s.mission)
                        .font(.system(size: 12))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(2)
                        .lineLimit(2)
                }

                if !s.addressRoad.isEmpty {
                    addressRow
                }

                if !s.phone.isEmpty {
                    phoneRow
                }

                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Photo (area = PhotosPicker wrapper + overlay)

    @ViewBuilder
    private var photoArea: some View {
        if photoUploader != nil {
            PhotosPicker(
                selection: $pickerItem,
                matching: .images,
                photoLibrary: .shared()
            ) {
                photoPlaceholder
                    .overlay(uploadOverlay)
            }
            .buttonStyle(.plain)
            .disabled(uploadState == .uploading || uploadState == .loading)
            .accessibilityLabel(
                s.storePhotos.isEmpty
                ? "사진 추가 — 탭하여 앨범에서 선택"
                : "사진 변경 — 탭하여 다른 사진 선택"
            )
        } else {
            photoPlaceholder
        }
    }

    @ViewBuilder
    private var uploadOverlay: some View {
        switch uploadState {
        case .loading, .uploading:
            ZStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(.black.opacity(0.5))
                VStack(spacing: 4) {
                    ProgressView().controlSize(.regular).tint(.white)
                    Text(uploadState == .uploading ? "업로드 중" : "불러오는 중")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.white)
                }
            }
        case .failed:
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(.red.opacity(0.65), lineWidth: 1.5)
        case .idle:
            EmptyView()
        }
    }

    // MARK: - Photo placeholder

    private var photoPlaceholder: some View {
        ZStack {
            if let first = s.storePhotos.first, let url = URL(string: first.url) {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(BUColor.midnight.opacity(0.05))
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        ProgressView().controlSize(.small)
                    case .success(let image):
                        image.resizable().scaledToFill()
                    case .failure:
                        Image(systemName: "photo.badge.exclamationmark")
                            .font(.system(size: 22))
                            .foregroundStyle(BUColor.inkMuted)
                    @unknown default:
                        EmptyView()
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            } else {
                emptyPhotoPlaceholder
            }
        }
        .frame(width: 96, height: 96)
        .accessibilityLabel(s.storePhotos.isEmpty ? "가게 사진을 추가하세요" : "가게 사진")
    }

    private var emptyPhotoPlaceholder: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(BUColor.midnight.opacity(0.04))
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(
                    BUColor.midnight.opacity(0.25),
                    style: StrokeStyle(lineWidth: 1.5, dash: [5, 4])
                )
            VStack(spacing: 6) {
                Image(systemName: "camera.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(BUColor.midnight.opacity(0.55))
                Text("사진 추가")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(BUColor.midnight.opacity(0.6))
            }
        }
    }

    // MARK: - Store name

    private var storeName: some View {
        Group {
            if s.shortDescription.isEmpty {
                Text("가게 이름을 입력하세요")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                    .tracking(-0.3)
            } else {
                Text(s.shortDescription)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(BUColor.midnightDeep)
                    .tracking(-0.3)
                    .lineLimit(2)
                    .lineSpacing(2)
            }
        }
        .accessibilityAddTraits(.isHeader)
    }

    // MARK: - Address (tap → ConfirmationDialog → Maps)

    private var addressRow: some View {
        Button {
            showAddressActions = true
        } label: {
            HStack(spacing: 4) {
                Image(systemName: "mappin.and.ellipse")
                    .font(.system(size: 10))
                    .foregroundStyle(BUColor.inkMuted)
                Text(displayAddress)
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineLimit(1)
            }
        }
        .buttonStyle(.plain)
        .accessibilityHint("지도 앱에서 위치 확인")
    }

    private var displayAddress: String {
        if s.addressDetail.isEmpty { return s.addressRoad }
        return "\(s.addressRoad) \(s.addressDetail)"
    }

    @ViewBuilder
    private var addressDialogActions: some View {
        Button("애플맵에서 열기") {
            openInMaps(scheme: "maps://", host: "?q=")
        }
        Button("카카오맵에서 열기") {
            openInMaps(scheme: "kakaomap://", host: "search?q=")
        }
        Button("네이버지도에서 열기") {
            openInMaps(scheme: "nmap://", host: "search?query=")
        }
        Button("주소 복사") {
            #if canImport(UIKit)
            UIPasteboard.general.string = displayAddress
            #endif
        }
        Button("취소", role: .cancel) {}
    }

    private func openInMaps(scheme: String, host: String) {
        let encoded = displayAddress.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let url: URL?
        if scheme == "maps://" {
            // 애플맵 universal link 도 같이 시도
            url = URL(string: "http://maps.apple.com/?q=\(encoded)")
        } else {
            url = URL(string: "\(scheme)\(host)\(encoded)")
        }
        #if canImport(UIKit)
        if let url, UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        } else if let fallback = URL(string: "http://maps.apple.com/?q=\(encoded)") {
            UIApplication.shared.open(fallback)
        }
        #endif
    }

    // MARK: - Phone (tap → tel:)

    private var phoneRow: some View {
        let digits = StoreInfoValidators.digitsOnly(s.phone)
        let url = URL(string: "tel:\(digits)")
        return Group {
            if let url {
                Link(destination: url) {
                    HStack(spacing: 4) {
                        Image(systemName: "phone.fill")
                            .font(.system(size: 10))
                        Text(StoreInfoFormatters.phone(s.phone))
                            .font(.system(size: 11, weight: .medium))
                    }
                    .foregroundStyle(BUColor.midnight)
                }
                .accessibilityHint("탭하여 통화")
            } else {
                HStack(spacing: 4) {
                    Image(systemName: "phone.fill")
                        .font(.system(size: 10))
                    Text(StoreInfoFormatters.phone(s.phone))
                        .font(.system(size: 11, weight: .medium))
                }
                .foregroundStyle(BUColor.midnight)
            }
        }
    }

    // MARK: - Business hours (offline only)

    private var businessHoursSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("영업 시간")
                    .font(BUFont.eyebrow)
                    .foregroundStyle(BUColor.inkMuted)
                Spacer()
                if !s.breakTime.isEmpty {
                    Text("브레이크 \(s.breakTime)")
                        .font(.system(size: 10))
                        .foregroundStyle(BUColor.inkSecondary)
                }
            }
            weekdayChipsRow
        }
    }

    private var weekdayChipsRow: some View {
        let days: [(id: String, label: String)] = [
            ("mon","월"), ("tue","화"), ("wed","수"), ("thu","목"),
            ("fri","금"), ("sat","토"), ("sun","일"),
        ]
        return HStack(spacing: 6) {
            ForEach(days, id: \.id) { d in
                let isHoliday = s.weeklyHolidays.contains(d.id)
                Text(d.label)
                    .font(.system(size: 11, weight: isHoliday ? .regular : .semibold))
                    .foregroundStyle(isHoliday ? BUColor.inkMuted.opacity(0.6) : BUColor.midnight)
                    .strikethrough(isHoliday, color: BUColor.inkMuted.opacity(0.7))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .background(
                        isHoliday
                            ? BUColor.midnight.opacity(0.03)
                            : BUColor.midnight.opacity(0.08),
                        in: RoundedRectangle(cornerRadius: 8, style: .continuous)
                    )
            }
        }
    }

    // MARK: - Metrics (3×2 grid)

    private struct Metric: Identifiable {
        let id: String
        let label: String
        let value: String
        let hasAlert: Bool
    }

    private var metrics: [Metric] {
        let balance = s.currentBalanceManualKrw ?? 0
        let employees = s.peopleDirectory.filter { $0.kind.hasPrefix("employee") }.count
        let vendors   = s.peopleDirectory.filter { $0.kind.hasPrefix("vendor")   }.count
        let permits   = s.permits.count
        let policies  = s.insurancePolicies.count
        let upcoming  = dDayItems.filter { $0.daysRemaining >= 0 && $0.daysRemaining <= 30 }.count

        let permitsAlert  = dDayItems.contains { $0.sectionId == "legal"     && $0.daysRemaining <= 30 }
        let insureAlert   = dDayItems.contains { $0.sectionId == "insurance" && $0.daysRemaining <= 30 }
        let upcomingAlert = dDayItems.contains { $0.daysRemaining < 0 }   // overdue 있으면 강조

        return [
            Metric(id: "balance",
                   label: "잔고",
                   value: s.currentBalanceManualKrw == nil ? "—" : StoreInfoFormatters.krwAdaptive(balance),
                   hasAlert: false),
            Metric(id: "staff",
                   label: "직원",
                   value: "\(employees)명",
                   hasAlert: false),
            Metric(id: "vendors",
                   label: "거래처",
                   value: "\(vendors)곳",
                   hasAlert: false),
            Metric(id: "permits",
                   label: "인허가",
                   value: "\(permits)건",
                   hasAlert: permitsAlert),
            Metric(id: "insurance",
                   label: "보험",
                   value: "\(policies)건",
                   hasAlert: insureAlert),
            Metric(id: "upcoming",
                   label: "갱신 임박",
                   value: "\(upcoming)건",
                   hasAlert: upcomingAlert),
        ]
    }

    private var metricsSection: some View {
        LazyVGrid(
            columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())],
            spacing: 8
        ) {
            ForEach(metrics) { m in
                metricCell(m)
            }
        }
    }

    private func metricCell(_ m: Metric) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                Text(m.label)
                    .font(BUFont.eyebrow)
                    .foregroundStyle(BUColor.inkMuted)
                if m.hasAlert {
                    Circle()
                        .fill(.orange)
                        .frame(width: 5, height: 5)
                        .accessibilityLabel("주의 필요")
                }
            }
            Text(m.value)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(BUColor.midnightDeep)
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(
            BUColor.midnight.opacity(0.05),
            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
        )
    }

    // MARK: - D-Day pill

    private var dDayPill: some View {
        let summary = DDayCalculator.summary(from: s)
        let hasOverdue = dDayItems.contains { $0.daysRemaining < 0 }
        let tint: Color = hasOverdue ? .red.opacity(0.85) : .orange

        return Button {
            showDDayList = true
        } label: {
            HStack(spacing: 6) {
                Image(systemName: hasOverdue ? "exclamationmark.triangle.fill" : "clock.badge.exclamationmark")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(tint)
                Text(summary)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                Spacer()
                Text("자세히")
                    .font(.system(size: 11))
                    .foregroundStyle(BUColor.inkMuted)
                Image(systemName: "chevron.right")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(
                tint.opacity(0.08),
                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(tint.opacity(0.18), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .accessibilityHint("탭하여 만료 항목 자세히 보기")
    }
}

// MARK: - DDayListSheet

private struct DDayListSheet: View {
    let items: [DDayItem]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()

                if items.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 0) {
                            // Overdue 섹션
                            let overdue = items.filter { $0.daysRemaining < 0 }
                            if !overdue.isEmpty {
                                groupHeader("이미 만료", tint: .red.opacity(0.85))
                                ForEach(overdue) { row($0) }
                                Spacer(minLength: BUSpacing.md)
                            }

                            // 임박
                            let urgent = items.filter { $0.daysRemaining >= 0 && $0.daysRemaining <= 7 }
                            if !urgent.isEmpty {
                                groupHeader("7일 이내", tint: .orange)
                                ForEach(urgent) { row($0) }
                                Spacer(minLength: BUSpacing.md)
                            }

                            // 30일 이내
                            let soon = items.filter { $0.daysRemaining > 7 && $0.daysRemaining <= 30 }
                            if !soon.isEmpty {
                                groupHeader("30일 이내", tint: BUColor.midnight)
                                ForEach(soon) { row($0) }
                                Spacer(minLength: BUSpacing.md)
                            }

                            // 그 외
                            let later = items.filter { $0.daysRemaining > 30 }
                            if !later.isEmpty {
                                groupHeader("그 외", tint: BUColor.inkMuted)
                                ForEach(later) { row($0) }
                            }

                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.horizontal, BUSpacing.md)
                        .padding(.top, BUSpacing.md)
                    }
                }
            }
            .navigationTitle("만료·갱신 일정")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }
                        .foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } }
                #endif
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func groupHeader(_ title: String, tint: Color) -> some View {
        HStack(spacing: 6) {
            Circle().fill(tint).frame(width: 6, height: 6)
            Text(title)
                .font(BUFont.eyebrow.weight(.bold))
                .foregroundStyle(BUColor.inkSecondary)
                .tracking(0.5)
            Spacer()
        }
        .padding(.bottom, 8)
    }

    private func row(_ item: DDayItem) -> some View {
        HStack(alignment: .center, spacing: BUSpacing.md) {
            VStack(spacing: 2) {
                Text(item.dDayLabel)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.white)
                    .monospacedDigit()
                Text(item.relativeLabel)
                    .font(.system(size: 9))
                    .foregroundStyle(.white.opacity(0.85))
            }
            .frame(width: 52, height: 52)
            .background(
                tint(for: item.urgency),
                in: RoundedRectangle(cornerRadius: 10, style: .continuous)
            )

            VStack(alignment: .leading, spacing: 2) {
                Text(item.itemTitle)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                    .lineLimit(1)
                HStack(spacing: 6) {
                    Text(item.sectionLabel)
                        .font(.system(size: 11))
                        .foregroundStyle(BUColor.inkMuted)
                    if let kind = item.kindLabel {
                        Text("·")
                            .foregroundStyle(BUColor.inkMuted.opacity(0.5))
                        Text(kind)
                            .font(.system(size: 11))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineLimit(1)
                    }
                }
                Text(StoreInfoFormatters.dateDotted(item.expiresAt))
                    .font(.system(size: 10))
                    .foregroundStyle(BUColor.inkMuted.opacity(0.7))
                    .padding(.top, 1)
            }
            Spacer()
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 12)
        .background(BUColor.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .padding(.bottom, 8)
    }

    private func tint(for u: StoreInfoFormatters.ExpiryUrgency) -> Color {
        switch u {
        case .overdue: return .red.opacity(0.85)
        case .urgent:  return .orange
        case .soon:    return BUColor.midnight.opacity(0.7)
        case .later:   return BUColor.inkMuted
        case .none:    return BUColor.inkMuted
        }
    }

    private var emptyState: some View {
        VStack(spacing: BUSpacing.sm) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 40))
                .foregroundStyle(BUColor.success.opacity(0.7))
            Text("만료 임박 항목이 없습니다")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(BUColor.ink)
            Text("인허가·보험·임대 등 만료일을 입력하면\n여기서 통합 관리할 수 있어요.")
                .font(.system(size: 12))
                .foregroundStyle(BUColor.inkSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(2)
        }
        .padding(.horizontal, BUSpacing.lg)
    }
}

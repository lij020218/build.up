//
//  BusinessDocumentsCard.swift — 사업 서류 라이브러리 (4 그룹 13 kind).
//
//  웹 SSOT: apps/web/app/lib/components/my-store/BusinessDocumentsLibraryCard.tsx
//
//  Layer 2 (중앙 라이브러리). Layer 1 = StoreInfoState.businessDocuments (Supabase 동기화 완료).
//  2026-08-19: 실 파일 업로드(.fileImporter → BusinessDocumentUploader → Storage) + 열람·삭제 — 웹과 동일 버킷·경로.
//

import SwiftUI
import UniformTypeIdentifiers
import FoundOneDesignSystem
import FoundOneData

struct BusinessDocumentsCard: View {

    @ObservedObject var storeInfo: StoreInfoStore
    /// nil 이면(데모·미로그인) 업로드 버튼 대신 안내만
    var uploader: BusinessDocumentUploader? = nil

    @State private var importerKind: BusinessDocumentKind? = nil
    @State private var showImporter: Bool = false
    @State private var detailKind: KindBox? = nil
    private struct KindBox: Identifiable { let kind: BusinessDocumentKind; var id: String { kind.rawValue } }
    @State private var isUploading: Bool = false
    @State private var uploadError: String? = nil

    private static let allowedTypes: [UTType] = [.pdf, .jpeg, .png, .webP]

    private struct DocGroup: Identifiable {
        let id: String
        let titleKo: String
        let kinds: [BusinessDocumentKind]
    }

    private let groups: [DocGroup] = [
        DocGroup(id: "biz-tax",          titleKo: "사업·세무",   kinds: [.bizRegistration, .ventureCert]),
        DocGroup(id: "operating",        titleKo: "영업 인허가", kinds: [.bizReportFood, .bizReportPet, .bizReportBeauty, .telecomSales, .fireSafety]),
        DocGroup(id: "hygiene-staff",    titleKo: "직원·위생",   kinds: [.hygieneCert, .healthCert]),
        DocGroup(id: "ip-cert",          titleKo: "인증·IP",    kinds: [.trademark, .patent]),
    ]

    private var allKinds: [BusinessDocumentKind] {
        groups.flatMap { $0.kinds }
    }

    private var filledKinds: Set<BusinessDocumentKind> {
        Set(storeInfo.state.businessDocuments.map(\.kind))
    }

    private var filledCount: Int {
        allKinds.filter { filledKinds.contains($0) }.count
    }

    private var totalDocs: Int { storeInfo.state.businessDocuments.count }

    private var expiringSoonCount: Int {
        let now = Date()
        let limit = Calendar.current.date(byAdding: .day, value: 30, to: now)!
        return storeInfo.state.businessDocuments.filter { doc in
            guard let exp = doc.expiresAt, let d = parseISODate(exp) else { return false }
            return d > now && d < limit
        }.count
    }

    private var expiredCount: Int {
        let now = Date()
        return storeInfo.state.businessDocuments.filter { doc in
            guard let exp = doc.expiresAt, let d = parseISODate(exp) else { return false }
            return d < now
        }.count
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            header
            statsRow
            ForEach(groups) { group in
                groupBlock(group)
            }
        }
        .padding(BUSpacing.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.85))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(BUColor.cardBorder, lineWidth: 1)
        )
        .fileImporter(isPresented: $showImporter, allowedContentTypes: Self.allowedTypes, allowsMultipleSelection: false) { result in
            guard let kind = importerKind else { return }
            switch result {
            case .success(let urls):
                if let url = urls.first { Task { await upload(kind: kind, fileURL: url) } }
            case .failure(let err):
                uploadError = err.localizedDescription
            }
        }
        .alert("업로드 실패", isPresented: Binding(get: { uploadError != nil }, set: { if !$0 { uploadError = nil } })) {
            Button("확인", role: .cancel) {}
        } message: {
            Text(uploadError ?? "")
        }
        .sheet(item: $detailKind) { box in
            BusinessDocumentKindSheet(kind: box.kind, storeInfo: storeInfo, uploader: uploader) {
                detailKind = nil
                beginUpload(box.kind)
            }
        }
        .overlay {
            if isUploading {
                ZStack {
                    Color.black.opacity(0.08)
                    ProgressView("업로드 중…").padding(16)
                        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                }
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
        }
    }

    // MARK: - Upload flow

    private func beginUpload(_ kind: BusinessDocumentKind) {
        guard uploader != nil else {
            uploadError = "로그인 후 업로드할 수 있어요. (PDF/JPG/PNG/WebP, 10MB 이하)"
            return
        }
        importerKind = kind
        showImporter = true
    }

    private func upload(kind: BusinessDocumentKind, fileURL: URL) async {
        guard let uploader else { return }
        isUploading = true
        defer { isUploading = false }
        let scoped = fileURL.startAccessingSecurityScopedResource()
        defer { if scoped { fileURL.stopAccessingSecurityScopedResource() } }
        do {
            let data = try Data(contentsOf: fileURL)
            let doc = try await uploader.upload(kind: kind, filename: fileURL.lastPathComponent, data: data)
            storeInfo.commit { $0.businessDocuments.append(doc) }
        } catch {
            uploadError = error.localizedDescription
        }
    }

    // MARK: - Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("사업 서류 라이브러리 · DOCUMENTS")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.6)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
            Text("내 가게 서류 한 곳에 보관")
                .font(.system(size: 17, weight: .bold))
                .tracking(-0.3)
                .foregroundStyle(BUColor.ink)
            Text("사업자등록증·영업신고증·위생교육·상표등록증 등 모든 서류를 중앙 관리. 만료 임박도 자동 알림.")
                .font(.system(size: 11.5, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .padding(.top, 2)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var statsRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                statChip(label: "\(filledCount)/\(allKinds.count) 항목 채움", color: BUColor.midnight)
                if totalDocs > 0 {
                    statChip(label: "\(totalDocs)건 보관", color: BUColor.success)
                }
                if expiringSoonCount > 0 {
                    statChip(label: "\(expiringSoonCount)건 30일 내 만료", color: BUColor.warn)
                }
                if expiredCount > 0 {
                    statChip(label: "\(expiredCount)건 만료됨", color: BUColor.danger)
                }
            }
        }
    }

    private func statChip(label: String, color: Color) -> some View {
        Text(label)
            .font(.system(size: 11, weight: .heavy))
            .foregroundStyle(color)
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(color.opacity(0.08), in: Capsule())
            .overlay(Capsule().strokeBorder(color.opacity(0.18), lineWidth: 1))
    }

    private func groupBlock(_ group: DocGroup) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(group.titleKo)
                .font(.system(size: 10.5, weight: .heavy))
                .tracking(0.5)
                .textCase(.uppercase)
                .foregroundStyle(BUColor.inkMuted.opacity(0.7))
            ForEach(group.kinds, id: \.self) { kind in
                kindRow(kind)
            }
        }
    }

    private func kindRow(_ kind: BusinessDocumentKind) -> some View {
        let docs = storeInfo.state.businessDocuments.filter { $0.kind == kind }
        let filled = !docs.isEmpty
        let warningDoc = docs.first { doc in
            guard let exp = doc.expiresAt, let d = parseISODate(exp) else { return false }
            return d < Calendar.current.date(byAdding: .day, value: 30, to: Date()) ?? Date.distantFuture
        }

        return Button {
            if filled { detailKind = KindBox(kind: kind) } else { beginUpload(kind) }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: filled ? "checkmark.circle.fill" : "doc.text")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(filled ? BUColor.success : BUColor.inkMuted.opacity(0.4))
                    .frame(width: 18)
                VStack(alignment: .leading, spacing: 1) {
                    Text(kind.labelKo)
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                    if filled {
                        Text("\(docs.count)건 보관")
                            .font(.system(size: 10.5, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                    } else {
                        Text("미등록")
                            .font(.system(size: 10.5, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted.opacity(0.6))
                    }
                }
                Spacer(minLength: 0)
                if warningDoc != nil {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(BUColor.warn)
                }
                Image(systemName: filled ? "chevron.right" : "plus.circle")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(filled ? BUColor.inkMuted.opacity(0.45) : BUColor.midnight)
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.inkMuted.opacity(0.02), in: RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(BUColor.cardBorder.opacity(0.4), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Helpers

    private func parseISODate(_ s: String) -> Date? {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Asia/Seoul")
        if let d = f.date(from: s) { return d }
        return ISO8601DateFormatter().date(from: s)
    }
}


// MARK: - Kind detail sheet (보관 문서 열람·삭제·추가)

private struct BusinessDocumentKindSheet: View {
    let kind: BusinessDocumentKind
    @ObservedObject var storeInfo: StoreInfoStore
    let uploader: BusinessDocumentUploader?
    let onAddMore: () -> Void

    @Environment(\.openURL) private var openURL
    @Environment(\.dismiss) private var dismiss
    @State private var opening: String? = nil

    private var docs: [BusinessDocument] { storeInfo.state.businessDocuments.filter { $0.kind == kind } }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(docs) { doc in
                        Button { open(doc) } label: {
                            HStack(spacing: 10) {
                                Image(systemName: doc.filename.lowercased().hasSuffix(".pdf") ? "doc.richtext" : "photo")
                                    .foregroundStyle(BUColor.midnight)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(doc.filename).font(.system(size: 14, weight: .semibold)).foregroundStyle(BUColor.ink).lineLimit(1)
                                    Text(metaLine(doc)).font(.system(size: 11)).foregroundStyle(BUColor.inkMuted)
                                }
                                Spacer()
                                if opening == doc.id { ProgressView().controlSize(.small) }
                            }
                        }
                    }
                    .onDelete { idx in
                        let targets = idx.map { docs[$0] }
                        storeInfo.commit { st in st.businessDocuments.removeAll { d in targets.contains { $0.id == d.id } } }
                        if let uploader { Task { for t in targets { await uploader.remove(t) } } }
                    }
                } footer: {
                    Text("왼쪽으로 밀어 삭제. 열람 링크는 1시간마다 새로 발급돼요.")
                }
                Section {
                    Button { onAddMore() } label: {
                        Label("\(kind.labelKo) 추가 업로드", systemImage: "plus.circle.fill")
                    }
                    .disabled(uploader == nil)
                }
            }
            .navigationTitle(kind.labelKo)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } } }
        }
        .presentationDetents([.medium, .large])
    }

    private func metaLine(_ doc: BusinessDocument) -> String {
        var parts: [String] = []
        if let b = doc.sizeBytes { parts.append(ByteCountFormatter.string(fromByteCount: Int64(b), countStyle: .file)) }
        parts.append("업로드 " + String(doc.uploadedAt.prefix(10)))
        if let e = doc.expiresAt { parts.append("만료 " + String(e.prefix(10))) }
        return parts.joined(separator: " · ")
    }

    private func open(_ doc: BusinessDocument) {
        opening = doc.id
        Task {
            defer { opening = nil }
            if let uploader, let url = await uploader.signedURL(for: doc) { openURL(url); return }
            if let url = URL(string: doc.url), !doc.url.isEmpty { openURL(url) }
        }
    }
}

//
//  CsvUploadSheet.swift — 매출 CSV/Excel 업로드 시트
//
//  웹 SSOT: apps/web/app/lib/components/profile/CsvUploadCard.tsx
//
//  iOS 통합:
//   • DataConnectionSheet 의 availableSection 에서 진입
//   • SwiftUI .fileImporter 로 .csv / .tsv / .txt 파일 선택
//   • 업로드 성공 → 결과 표시 (행 수 + 총 매출) + 최근 업로드 리스트 갱신
//
//  서버 제한: 5MB / 10,000 행 / 10초 timeout
//

import SwiftUI
import UniformTypeIdentifiers
import FoundOneCore
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct CsvUploadSheet: View {

    @Environment(\.dismiss) private var dismiss

    /// 파일 선택 — .fileImporter 트리거
    @State private var showFilePicker = false
    @State private var sourceLabel: String = ""

    /// 업로드 phase — idle → uploading → success / error
    enum Phase: Equatable {
        case idle
        case uploading
        case success(rowCount: Int, totalAmount: Int, filename: String)
        case error(String)
    }
    @State private var phase: Phase = .idle

    /// 최근 업로드 리스트
    @State private var recentUploads: [CsvUploadRecord] = []
    @State private var listError: String?

    /// 외부 콜백 — 업로드 완료 시 부모 (DataConnectionSheet) 가 데이터 갱신할 수 있도록
    public var onUploaded: (() -> Void)?

    public init(onUploaded: (() -> Void)? = nil) {
        self.onUploaded = onUploaded
    }

    public var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BUBackgroundSurface()
                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.lg) {
                        introBlock
                        formCard
                        if case .uploading = phase {
                            uploadingIndicator
                        }
                        if case .success(let rowCount, let total, let filename) = phase {
                            successCard(rowCount: rowCount, totalAmount: total, filename: filename)
                        }
                        if case .error(let msg) = phase {
                            errorCard(msg)
                        }
                        recentUploadsBlock
                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, BUSpacing.sm)
                }
            }
            .navigationTitle("엑셀/CSV 업로드")
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
                ToolbarItem(placement: .confirmationAction) {
                    Button("닫기") { dismiss() }
                }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .fileImporter(
            isPresented: $showFilePicker,
            allowedContentTypes: [.commaSeparatedText, .plainText, .tabSeparatedText],
            allowsMultipleSelection: false
        ) { result in
            handlePickedFile(result: result)
        }
        .task { await loadRecent() }
    }

    // MARK: - Subviews

    private var introBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("엑셀·구글시트에서 매출을 export 한 파일 그대로 업로드.")
                .font(.system(size: 14, weight: .heavy))
                .foregroundStyle(BUColor.ink)
            Text("\"날짜·매출\" 같은 헤더만 있으면 자동 인식합니다. 최대 5MB · 10,000행.")
                .font(.system(size: 12))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var formCard: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.md) {
                // 출처 메모 (선택)
                VStack(alignment: .leading, spacing: 4) {
                    Text("출처 메모 (선택)")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(BUColor.inkMuted)
                    TextField("예: 스마트스토어, 쿠팡, 직접 입력", text: $sourceLabel)
                        .textFieldStyle(.roundedBorder)
                        .disabled(phase == .uploading)
                        .autocorrectionDisabled()
                }

                // 파일 선택 버튼
                Button {
                    phase = .idle
                    showFilePicker = true
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "doc.badge.arrow.up")
                            .font(.system(size: 16, weight: .bold))
                        Text(phase == .uploading ? "업로드 중…" : "파일 선택")
                            .font(.system(size: 14.5, weight: .heavy))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(
                        LinearGradient(
                            colors: [BUColor.midnight, BUColor.midnight.opacity(0.82)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                    )
                }
                .disabled(phase == .uploading)
                .buttonStyle(.plain)
            }
        }
    }

    private var uploadingIndicator: some View {
        HStack(spacing: 8) {
            ProgressView()
            Text("업로드 중…")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.inkSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(.vertical, 6)
    }

    private func successCard(rowCount: Int, totalAmount: Int, filename: String) -> some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(BUColor.success)
                    Text("완료")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                }
                Text("\(filename)")
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
                HStack(spacing: 14) {
                    valuePill(label: "행 수", value: "\(rowCount)")
                    valuePill(label: "총 매출", value: formatWonShort(totalAmount))
                }
            }
        }
    }

    private func errorCard(_ msg: String) -> some View {
        BUCard(.outer) {
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(BUColor.danger)
                Text(msg)
                    .font(.system(size: 12.5, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                    .lineSpacing(2)
            }
        }
    }

    private var recentUploadsBlock: some View {
        VStack(alignment: .leading, spacing: 8) {
            if !recentUploads.isEmpty {
                Text("최근 업로드")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(BUColor.inkMuted)
                    .textCase(.uppercase)
                    .tracking(0.5)

                ForEach(recentUploads.prefix(5)) { record in
                    HStack(spacing: 8) {
                        Text(record.filename)
                            .font(.system(size: 12.5, weight: .semibold))
                            .foregroundStyle(BUColor.ink)
                            .lineLimit(1)
                            .truncationMode(.middle)
                        Spacer(minLength: 8)
                        Text("\(record.row_count)행 · \(formatWonShort(record.total_amount))")
                            .font(.system(size: 11.5, weight: .medium))
                            .foregroundStyle(BUColor.inkSecondary)
                            .monospacedDigit()
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(BUColor.midnight08, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            } else if listError != nil {
                Text("최근 업로드 목록을 불러올 수 없습니다.")
                    .font(.system(size: 11.5))
                    .foregroundStyle(BUColor.inkMuted)
            }
        }
    }

    private func valuePill(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(BUColor.inkMuted)
                .textCase(.uppercase)
                .tracking(0.5)
            Text(value)
                .font(.system(size: 15, weight: .heavy))
                .foregroundStyle(BUColor.midnight)
                .monospacedDigit()
        }
    }

    // MARK: - Actions

    private func handlePickedFile(result: Result<[URL], any Error>) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }
            uploadFile(url: url)
        case .failure(let error):
            phase = .error("파일 선택 실패: \(error.localizedDescription)")
        }
    }

    private func uploadFile(url: URL) {
        phase = .uploading

        Task {
            do {
                // iOS sandbox 외부 파일은 security-scoped resource 필요
                let scoped = url.startAccessingSecurityScopedResource()
                defer { if scoped { url.stopAccessingSecurityScopedResource() } }

                let fileData = try Data(contentsOf: url)
                let filename = url.lastPathComponent

                // 5MB 한도 — 서버에서도 한 번 더 검증
                if fileData.count > 5 * 1024 * 1024 {
                    phase = .error("파일이 너무 큽니다 (최대 5MB).")
                    return
                }

                let repo = CsvUploadRepository(supabase: BUSupabase.shared.client)
                let response = try await repo.uploadCsv(
                    fileData: fileData,
                    filename: filename,
                    sourceLabel: sourceLabel.isEmpty ? nil : sourceLabel
                )

                if response.ok, let rowCount = response.rowCount, let total = response.totalAmount {
                    phase = .success(rowCount: rowCount, totalAmount: total, filename: filename)
                    sourceLabel = ""
                    await loadRecent()
                    onUploaded?()
                } else {
                    phase = .error(response.error ?? "업로드 실패")
                }
            } catch let repoError as CsvUploadRepositoryError {
                phase = .error(repoError.errorDescription ?? "업로드 실패")
            } catch {
                phase = .error("파일 읽기 실패: \(error.localizedDescription)")
            }
        }
    }

    private func loadRecent() async {
        guard BUSupabase.shared.currentUser != nil else {
            recentUploads = []
            return
        }
        let repo = CsvUploadRepository(supabase: BUSupabase.shared.client)
        do {
            let response = try await repo.listUploads(fromDays: 30)
            if response.ok {
                recentUploads = response.uploads ?? []
                listError = nil
            } else {
                listError = response.error
            }
        } catch {
            // silent — 메인 업로드 화면 차단하지 않음
            listError = error.localizedDescription
            recentUploads = []
        }
    }

    /// 원 단위 → "1만5천원" / "2백만원" 식 압축. CsvUploadCard.tsx 의 `${(total / 10000).toLocaleString()}만` 미러.
    private func formatWonShort(_ won: Int) -> String {
        let abs = Swift.abs(won)
        if abs >= 100_000_000 {
            let eok = abs / 100_000_000
            let man = (abs % 100_000_000) / 10_000
            return man > 0 ? "\(eok)억 \(man)만원" : "\(eok)억원"
        }
        if abs >= 10_000 {
            let man = abs / 10_000
            return "\(man)만원"
        }
        return "\(abs)원"
    }
}

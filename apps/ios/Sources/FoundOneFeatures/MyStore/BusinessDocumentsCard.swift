//
//  BusinessDocumentsCard.swift — 사업 서류 라이브러리 (4 그룹 13 kind).
//
//  웹 SSOT: apps/web/app/lib/components/my-store/BusinessDocumentsLibraryCard.tsx
//
//  Layer 2 (중앙 라이브러리). Layer 1 = StoreInfoState.businessDocuments (Supabase 동기화 완료).
//  업로드 시트는 placeholder — 실 파일 업로드는 Storage 통합 후속 작업.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneData

struct BusinessDocumentsCard: View {

    @ObservedObject var storeInfo: StoreInfoStore

    @State private var showUploadHint: Bool = false
    @State private var selectedKindLabel: String = ""

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
        .alert("문서 업로드", isPresented: $showUploadHint) {
            Button("확인", role: .cancel) {}
        } message: {
            Text("\"\(selectedKindLabel)\" 업로드는 곧 추가됩니다. 그 전엔 웹에서 업로드해주세요. (PDF/JPG/PNG, 10MB 이하)")
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
                    statChip(label: "\(totalDocs)건 보관", color: Color(red: 0.020, green: 0.588, blue: 0.412))
                }
                if expiringSoonCount > 0 {
                    statChip(label: "\(expiringSoonCount)건 30일 내 만료", color: Color(red: 0.918, green: 0.345, blue: 0.047))
                }
                if expiredCount > 0 {
                    statChip(label: "\(expiredCount)건 만료됨", color: Color(red: 0.706, green: 0.137, blue: 0.094))
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
            selectedKindLabel = kind.labelKo
            showUploadHint = true
        } label: {
            HStack(spacing: 10) {
                Image(systemName: filled ? "checkmark.circle.fill" : "doc.text")
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(filled ? Color(red: 0.020, green: 0.588, blue: 0.412) : BUColor.inkMuted.opacity(0.4))
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
                        .foregroundStyle(Color(red: 0.918, green: 0.345, blue: 0.047))
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

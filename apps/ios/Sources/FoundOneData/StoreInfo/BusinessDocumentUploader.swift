//
//  BusinessDocumentUploader.swift — 사업 서류 Supabase Storage 업로드 actor
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/services/business-documents.ts (2026-08-19 iOS 미러)
//
//  컨벤션 (웹과 동일):
//   • Bucket:        "business-documents" (private — RLS: 본인 폴더만)
//   • Path:          {userId}/{kind}/{docId}.{ext}
//   • 허용 형식:     PDF · JPEG · PNG · WebP, 10MB 이하
//   • URL:           signed URL 1시간 (열람 시 재발급 → signedURL(for:))
//   • Upsert:        false
//

import Foundation
import Supabase

public enum BusinessDocumentUploadError: LocalizedError, Sendable {
    case tooLarge
    case unsupportedType(String)
    case authRequired
    case storageFailed(message: String)

    public var errorDescription: String? {
        switch self {
        case .tooLarge:                 return "파일이 10MB를 넘어요"
        case .unsupportedType(let t):   return "지원하지 않는 형식(\(t)) — PDF·JPG·PNG·WebP만 가능해요"
        case .authRequired:             return "로그인이 필요해요"
        case .storageFailed(let m):     return "업로드 실패: \(m)"
        }
    }
}

public actor BusinessDocumentUploader {

    public static let maxBytes = 10 * 1024 * 1024
    /// 확장자 → Content-Type (웹 ALLOWED_DOC_TYPES 미러)
    public static let allowedExtensions: [String: String] = [
        "pdf": "application/pdf",
        "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
    ]

    private let supabase: SupabaseClient
    private let getUserId: @Sendable () async throws -> UUID
    private let bucket: String

    public init(
        supabase: SupabaseClient,
        getUserId: @escaping @Sendable () async throws -> UUID,
        bucket: String = "business-documents"
    ) {
        self.supabase = supabase
        self.getUserId = getUserId
        self.bucket = bucket
    }

    /// 파일 데이터 업로드 → BusinessDocument (url = 1시간 signed URL, 실패 시 빈 문자열 — 웹과 동일)
    public func upload(kind: BusinessDocumentKind, filename: String, data: Data) async throws -> BusinessDocument {
        guard data.count <= Self.maxBytes else { throw BusinessDocumentUploadError.tooLarge }
        let ext = (filename as NSString).pathExtension.lowercased()
        guard let contentType = Self.allowedExtensions[ext] else {
            throw BusinessDocumentUploadError.unsupportedType(ext.isEmpty ? "?" : ext)
        }
        let userId: UUID
        do { userId = try await getUserId() } catch { throw BusinessDocumentUploadError.authRequired }

        let docId = UUID().uuidString.lowercased()
        let path = "\(userId.uuidString.lowercased())/\(kind.rawValue)/\(docId).\(ext)"

        do {
            try await supabase.storage.from(bucket).upload(
                path, data: data,
                options: FileOptions(cacheControl: "3600", contentType: contentType, upsert: false)
            )
        } catch {
            throw BusinessDocumentUploadError.storageFailed(message: error.localizedDescription)
        }

        let signed = (try? await supabase.storage.from(bucket).createSignedURL(path: path, expiresIn: 3600))?.absoluteString ?? ""
        return BusinessDocument(
            id: docId, kind: kind, filename: filename, url: signed,
            sizeBytes: data.count, uploadedAt: ISO8601DateFormatter().string(from: Date())
        )
    }

    /// 열람용 signed URL 재발급 (저장된 url 은 1시간 만료)
    public func signedURL(for document: BusinessDocument) async -> URL? {
        guard let path = Self.extractPath(from: document.url, bucket: bucket) else { return nil }
        return try? await supabase.storage.from(bucket).createSignedURL(path: path, expiresIn: 3600)
    }

    /// Storage 객체 제거 — 실패해도 throw 안 함 (store 배열 제거가 우선, 웹과 동일)
    public func remove(_ document: BusinessDocument) async {
        guard let path = Self.extractPath(from: document.url, bucket: bucket) else { return }
        _ = try? await supabase.storage.from(bucket).remove(paths: [path])
    }

    /// signed/public URL 에서 bucket 이후 경로 추출 (웹 extractStoragePath 미러)
    static func extractPath(from urlString: String, bucket: String) -> String? {
        guard let url = URL(string: urlString) else { return nil }
        let marker = "/\(bucket)/"
        guard let r = url.path.range(of: marker) else { return nil }
        let p = String(url.path[r.upperBound...])
        return p.removingPercentEncoding ?? p
    }
}

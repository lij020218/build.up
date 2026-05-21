//
//  StorePhotoUploader.swift — 가게 사진 Supabase Storage 업로드 actor
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/components/my-store/StorePhotoUploader.tsx
//
//  컨벤션 (웹과 동일):
//   • Bucket:        "store-photos"
//   • Path:          {userId}/{photoId}.jpg
//   • Content-Type:  image/jpeg
//   • Cache-Control: 3600s
//   • Upsert:        false (덮어쓰기 금지 — 새 사진은 새 UUID)
//
//  자동 압축 (사용자 인지 없이):
//   1. 긴 변 > 2048pt → 다운샘플
//   2. JPEG quality 0.85 시작 → 1.5MB 이내까지 0.1씩 감소 (최저 0.3)
//
//  UI side state 는 Hero 가 @State 로 관리 — actor 는 비즈니스 로직만.
//

import Foundation
import Supabase
import UIKit

// MARK: - Error

public enum StorePhotoUploadError: LocalizedError, Sendable {
    case invalidImage
    case compressionFailed
    case storageFailed(message: String)
    case authRequired

    public var errorDescription: String? {
        switch self {
        case .invalidImage:           return "이미지를 읽을 수 없어요"
        case .compressionFailed:      return "이미지 압축 중 오류"
        case .storageFailed(let m):   return "업로드 실패: \(m)"
        case .authRequired:           return "로그인이 필요해요"
        }
    }
}

// MARK: - Uploader

public actor StorePhotoUploader {

    private let supabase: SupabaseClient
    private let getUserId: @Sendable () async throws -> UUID
    private let bucket: String

    public init(
        supabase: SupabaseClient,
        getUserId: @escaping @Sendable () async throws -> UUID,
        bucket: String = "store-photos"
    ) {
        self.supabase = supabase
        self.getUserId = getUserId
        self.bucket = bucket
    }

    // MARK: upload

    /// 원본 이미지 데이터 → 압축 + Supabase Storage 업로드 → public URL 가진 StorePhoto.
    /// 진행 단계 (압축/업로드) 는 호출 측에서 별도 UI state 로 추적.
    public func upload(_ imageData: Data) async throws -> StorePhoto {
        let userId: UUID
        do {
            userId = try await getUserId()
        } catch {
            throw StorePhotoUploadError.authRequired
        }

        // 1) 이미지 디코드 + 다운샘플 + JPEG 압축
        guard let compressed = Self.compress(imageData) else {
            throw StorePhotoUploadError.invalidImage
        }

        // 2) Path 생성
        let photoId = UUID().uuidString.lowercased()
        let path = "\(userId.uuidString.lowercased())/\(photoId).jpg"

        // 3) Supabase Storage 업로드
        do {
            try await supabase.storage
                .from(bucket)
                .upload(
                    path,
                    data: compressed,
                    options: FileOptions(
                        cacheControl: "3600",
                        contentType: "image/jpeg",
                        upsert: false
                    )
                )
        } catch {
            throw StorePhotoUploadError.storageFailed(message: error.localizedDescription)
        }

        // 4) Public URL
        let url: URL
        do {
            url = try supabase.storage.from(bucket).getPublicURL(path: path)
        } catch {
            throw StorePhotoUploadError.storageFailed(message: "URL 생성 실패")
        }

        return StorePhoto(url: url.absoluteString, caption: nil)
    }

    // MARK: remove

    /// Public URL 에서 path 를 추출해 Storage 에서 제거.
    /// 실패해도 throw 하지 않음 — store array 에서는 빼는 게 우선.
    public func remove(_ photo: StorePhoto) async {
        guard let path = Self.extractPath(from: photo.url, bucket: bucket) else { return }
        _ = try? await supabase.storage.from(bucket).remove(paths: [path])
    }

    // MARK: - Compression

    private static func compress(_ raw: Data, maxBytes: Int = 1_500_000) -> Data? {
        guard let image = UIImage(data: raw) else { return nil }

        // 다운샘플
        let resized = downsample(image, maxDimension: 2048)

        // JPEG quality 점진 감소
        var quality: CGFloat = 0.85
        guard var output = resized.jpegData(compressionQuality: quality) else {
            return nil
        }
        while output.count > maxBytes && quality > 0.3 {
            quality -= 0.1
            if let next = resized.jpegData(compressionQuality: quality) {
                output = next
            } else {
                break
            }
        }
        return output
    }

    private static func downsample(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let longest = max(image.size.width, image.size.height)
        guard longest > maxDimension else { return image }
        let scale = maxDimension / longest
        let newSize = CGSize(
            width:  image.size.width  * scale,
            height: image.size.height * scale
        )
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }

    private static func extractPath(from publicUrl: String, bucket: String) -> String? {
        // 패턴: ".../object/public/{bucket}/{path}"
        guard let range = publicUrl.range(of: "/object/public/\(bucket)/") else { return nil }
        let path = String(publicUrl[range.upperBound...])
        return path.isEmpty ? nil : path
    }
}

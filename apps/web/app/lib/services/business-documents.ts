/**
 * Business document Supabase Storage helpers.
 *
 * 2026-05-12 P1 #13 — 사장님 사업 서류 (사업자등록증·영업신고증·통신판매신고·상표등록증
 * 등) 의 PDF/이미지 업로드·삭제·signed URL 관리.
 *
 *  ── 저장 위치 ───────────────────────────────────────────
 *  · Supabase Storage 버킷: `business-documents` (private)
 *  · 경로: `{user_id}/{kind}/{uuid}.{ext}`
 *  · public:false + signed URL 로 접근 (사업자등록번호 같은 민감정보 보호)
 *  ─────────────────────────────────────────────────────
 *
 *  ── 보안 ────────────────────────────────────────────────
 *  · 버킷은 private — 직접 URL 접근 불가
 *  · 다운로드는 매번 signed URL 발급 (만료 1시간)
 *  · RLS: `(auth.uid())::text = (storage.foldername(name))[1]` — 본인 폴더만 접근
 *  · 이 정책은 마이그레이션 SQL 의 주석으로 가이드. Supabase Studio 에서 적용.
 *  ─────────────────────────────────────────────────────
 */

import { supabase } from "../../../lib/supabase";
import type { BusinessDocument, BusinessDocumentKind } from "../stores/store-info-store";

const BUCKET = "business-documents";
export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function newDocId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function fileExt(name: string): string {
  const parts = name.split(".");
  if (parts.length < 2) return "bin";
  return parts[parts.length - 1].toLowerCase();
}

/** Storage path 추출 — 삭제·재서명 시 필요. URL 변형 시 안전하게 추출. */
export function extractStoragePath(url: string): string | null {
  // signed URL format: .../object/sign/business-documents/{path}?token=...
  // public URL format:  .../object/public/business-documents/{path}
  const match = /\/business-documents\/([^?]+)/.exec(url);
  return match?.[1] ?? null;
}

/**
 * 사업 서류 업로드.
 *
 *  @param kind — 사업 서류 종류 (biz-registration·trademark 등)
 *  @param file — File 객체 (file input 또는 drop)
 *  @param metadata — 발급일자·만료일·등록번호 등 메타데이터 (선택)
 *  @returns 저장된 BusinessDocument (id·url·메타 포함)
 *  @throws Error — 파일 크기/형식 위반, 인증 누락, 업로드 실패
 */
export async function uploadBusinessDocument(
  kind: BusinessDocumentKind,
  file: File,
  metadata?: Pick<BusinessDocument, "issuedAt" | "expiresAt" | "registrationNumber" | "notes">,
): Promise<BusinessDocument> {
  // 검증
  if (file.size > MAX_DOC_BYTES) {
    throw new Error(`파일 ${file.name} 이 10MB 초과 — 업로드 거부`);
  }
  if (!ALLOWED_DOC_TYPES.includes(file.type)) {
    throw new Error(`파일 형식 ${file.type} 미지원. PDF·JPG·PNG·WebP 만 가능`);
  }

  // 사용자 인증
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("로그인이 필요합니다 (익명 계정도 가능)");
  }

  const id = newDocId();
  const ext = fileExt(file.name);
  const path = `${user.id}/${kind}/${id}.${ext}`;

  // 업로드
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
  if (upErr) {
    throw new Error(`업로드 실패: ${upErr.message}`);
  }

  // signed URL — 1시간 (사장님이 즉시 확인용). 다운로드 시점에 매번 재발급 (getDocumentUrl).
  const { data: urlData, error: urlErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);
  if (urlErr) {
    // URL 발급 실패해도 객체는 이미 업로드됨 — store 에는 path 만 저장
    console.warn("[business-documents] signed URL fail (continuing):", urlErr.message);
  }

  return {
    id,
    kind,
    filename: file.name,
    url: urlData?.signedUrl ?? "",
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    issuedAt: metadata?.issuedAt,
    expiresAt: metadata?.expiresAt,
    registrationNumber: metadata?.registrationNumber,
    notes: metadata?.notes,
  };
}

/**
 * 사업 서류 삭제 — Storage object + 호출 측에서 store array 에서도 제거.
 *
 *  Storage 삭제 실패해도 throw 안 함 (orphan path 정도는 cleanup job 으로 처리).
 *  사장님이 즉시 UI 에서 사라지는 게 더 중요.
 */
export async function deleteBusinessDocument(document: BusinessDocument): Promise<void> {
  const path = extractStoragePath(document.url);
  if (!path) {
    console.warn("[business-documents] cannot extract path from URL — skipping storage delete:", document.url);
    return;
  }
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    console.warn("[business-documents] storage delete failed (continuing):", error.message);
  }
}

/**
 * 다운로드용 signed URL 발급 (만료 1시간). 이미 저장된 URL 이 만료됐을 때 새로 발급.
 *
 *  사장님이 PDF 클릭 시 호출 — 권한 있는 본인만 다운로드 가능.
 *  실패 시 null 반환 (호출 측에서 처리).
 */
export async function getBusinessDocumentSignedUrl(document: BusinessDocument): Promise<string | null> {
  const path = extractStoragePath(document.url);
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);
  if (error) {
    console.warn("[business-documents] re-sign failed:", error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

"use client";

/**
 * BusinessDocumentUpload — 단일 서류 종류에 고정된 inline 업로드 컴포넌트.
 *
 *  사용 위치 (Phase 2 — 단계별 inline trigger):
 *   - registration-setup 단계 — kind="biz-registration" (사업자등록증)
 *   - biz-registration 단계 — kind="other" (사업용 통장 사본 등)
 *   - operations-setup 단계 — kind="biz-report-food" + "hygiene-cert" + "health-cert"
 *   - online-registration 단계 — kind="telecom-sales"
 *
 *  사용 위치 (Phase 1 — 이번 PR):
 *   - registration-setup 단계 — 사업자등록증
 *   - 내 가게 페이지의 BusinessDocumentsLibraryCard 가 이 컴포넌트로 모든 kind 처리
 *
 *  Design 토큰: MIDNIGHT 네이비 + Apple Human Interface (StorePhotoUploader 참고).
 */

import { useRef, useState } from "react";
import { Upload, Check, AlertCircle, Loader2, FileText, ExternalLink, Trash2 } from "lucide-react";
import { ConfirmModal } from "../ConfirmModal";
import { useStoreInfoStore, type BusinessDocumentKind } from "../../stores/store-info-store";
import {
  uploadBusinessDocument,
  deleteBusinessDocument,
  getBusinessDocumentSignedUrl,
  ALLOWED_DOC_TYPES,
  MAX_DOC_BYTES,
} from "../../services/business-documents";

const MIDNIGHT = "#191970";

type Props = {
  ko: boolean;
  /** 강제 서류 종류 — 사장님이 헷갈리지 않도록 kind 별 단일 업로드 UI */
  kind: BusinessDocumentKind;
  /** 라벨 (예: "사업자등록증") — 한글 사용자 친화적 표시 */
  label: string;
  /** 보조 설명 (예: "홈택스에서 발급 받은 PDF 또는 사진") */
  hint?: string;
  /** 같은 kind 가 여러 개 가능한지 (예: trademark — 여러 개) — default false */
  multiple?: boolean;
};

export function BusinessDocumentUpload({ ko, kind, label, hint, multiple = false }: Props) {
  const documents = useStoreInfoStore((s) => s.businessDocuments);
  const addDoc = useStoreInfoStore((s) => s.addBusinessDocument);
  const removeDoc = useStoreInfoStore((s) => s.removeBusinessDocument);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const existing = documents.filter((d) => d.kind === kind);
  const acceptStr = ALLOWED_DOC_TYPES.join(",");

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const toUpload = multiple ? Array.from(files) : [files[0]];
      for (const file of toUpload) {
        try {
          const doc = await uploadBusinessDocument(kind, file);
          addDoc(doc);
        } catch (err) {
          setError(err instanceof Error ? err.message : "업로드 실패");
        }
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    setDeleteTarget(docId);
  };

  const handleView = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    // signed URL 만료 가능성 — 매번 재발급
    const fresh = await getBusinessDocumentSignedUrl(doc);
    if (fresh) {
      window.open(fresh, "_blank", "noopener,noreferrer");
    } else if (doc.url) {
      window.open(doc.url, "_blank", "noopener,noreferrer");
    } else {
      alert(ko ? "URL 발급 실패 — 재업로드 권장" : "URL fetch failed — re-upload recommended");
    }
  };

  const deleteDoc = existing.find((d) => d.id === deleteTarget);

  return (
    <>
    <ConfirmModal
      open={!!deleteTarget}
      title={ko ? "파일 삭제" : "Delete file"}
      message={deleteDoc ? (ko ? `${deleteDoc.filename} 을 삭제하시겠습니까?` : `Delete ${deleteDoc.filename}?`) : ""}
      confirmLabel={ko ? "삭제" : "Delete"}
      cancelLabel={ko ? "취소" : "Cancel"}
      danger
      onConfirm={async () => {
        if (!deleteDoc) { setDeleteTarget(null); return; }
        try { await deleteBusinessDocument(deleteDoc); } catch (err) { console.warn("[BusinessDocumentUpload] storage delete error:", err); }
        removeDoc(deleteDoc.id);
        setDeleteTarget(null);
      }}
      onCancel={() => setDeleteTarget(null)}
    />
    <div style={{
      background: "white",
      borderRadius: 14,
      border: `1px solid rgba(25,25,112,0.10)`,
      padding: "14px 16px",
      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 9,
          background: existing.length > 0 ? "rgba(25,25,112,0.10)" : "rgba(25,25,112,0.08)",
          color: existing.length > 0 ? "#1d3557" : MIDNIGHT,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {existing.length > 0 ? <Check size={16} strokeWidth={2.4} /> : <FileText size={16} strokeWidth={1.8} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", lineHeight: 1.4 }}>
            {label}
            {existing.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: "#1d3557" }}>
                · {existing.length}{ko ? "개 보관 중" : ` uploaded`}
              </span>
            )}
          </div>
          {hint && (
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, marginTop: 2 }}>
              {hint}
            </div>
          )}
        </div>
      </div>

      {/* 업로드 버튼 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" }}>
        <button
          type="button"
          disabled={uploading || (!multiple && existing.length > 0)}
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 12px", borderRadius: 9,
            fontSize: 12.5, fontWeight: 600,
            background: uploading || (!multiple && existing.length > 0) ? "rgba(0,0,0,0.04)" : MIDNIGHT,
            color: uploading || (!multiple && existing.length > 0) ? "rgba(0,0,0,0.4)" : "white",
            border: "none",
            cursor: uploading ? "wait" : (!multiple && existing.length > 0) ? "default" : "pointer",
          }}
        >
          {uploading
            ? <><Loader2 size={13} className="spin" /> {ko ? "업로드 중..." : "Uploading..."}</>
            : <><Upload size={13} strokeWidth={2} /> {ko ? (multiple || existing.length === 0 ? "파일 선택" : "이미 업로드됨") : (multiple || existing.length === 0 ? "Upload" : "Uploaded")}</>}
        </button>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>
          {ko ? "PDF·JPG·PNG, 최대 10MB" : "PDF/JPG/PNG, max 10MB"}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptStr}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 6,
          marginTop: 8, padding: "8px 10px", borderRadius: 8,
          background: "rgba(182,76,76,0.06)", border: "1px solid rgba(182,76,76,0.12)",
          color: "#b64c4c", fontSize: 12,
        }}>
          <AlertCircle size={13} strokeWidth={1.8} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* 업로드된 서류 리스트 */}
      {existing.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {existing.map((doc) => (
            <div key={doc.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 9,
              background: "rgba(25,25,112,0.03)",
              border: "1px solid rgba(25,25,112,0.08)",
            }}>
              <FileText size={14} strokeWidth={1.6} style={{ color: MIDNIGHT, opacity: 0.7, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", overflow: "hidden" as const, textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  {doc.filename}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}>
                  {new Date(doc.uploadedAt).toLocaleDateString(ko ? "ko-KR" : "en-US")}
                  {doc.sizeBytes && ` · ${(doc.sizeBytes / 1024).toFixed(0)} KB`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleView(doc.id)}
                title={ko ? "열기" : "Open"}
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 28, height: 28, borderRadius: 7,
                  background: "rgba(25,25,112,0.06)", color: MIDNIGHT,
                  border: "none", cursor: "pointer",
                }}
              >
                <ExternalLink size={13} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                title={ko ? "삭제" : "Delete"}
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 28, height: 28, borderRadius: 7,
                  background: "rgba(182,76,76,0.06)", color: "#b64c4c",
                  border: "none", cursor: "pointer",
                }}
              >
                <Trash2 size={13} strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
    </>
  );
}

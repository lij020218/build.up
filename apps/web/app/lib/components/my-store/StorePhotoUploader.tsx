"use client";

/**
 * StorePhotoUploader — 매장 사진 업로드/삭제/순서 변경.
 *
 * 실제 동작 (거짓 기능 0):
 *  · file input → Supabase Storage `store-photos` 버킷 업로드
 *  · 경로: {user_id}/{uuid}.{ext}
 *  · public URL 받아서 store-info-store.storePhotos 에 저장
 *  · usePersistence 가 5초 인터벌 + flushStoreDataImmediate 로 Supabase 동기화
 *  · 삭제 = Storage object 제거 + storePhotos 배열에서 제거
 *
 * 첫 사진이 Hero 의 표지로 사용됨.
 */

import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2, Star, AlertCircle } from "lucide-react";
import { useStoreInfoStore, type StorePhoto } from "../../stores/store-info-store";
import { supabase } from "../../../../lib/supabase";
import { PALETTE } from "./styles";

const MAX_PHOTOS = 8;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];

type Props = {
  ko: boolean;
  /** Hero 안에서 사용 시 작은 갤러리 / 큰 hero 모드 분기 */
  variant?: "hero" | "gallery";
};

function fileExt(name: string): string {
  const parts = name.split(".");
  if (parts.length < 2) return "jpg";
  return parts[parts.length - 1].toLowerCase();
}

function newPhotoId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function StorePhotoUploader({ ko, variant = "hero" }: Props) {
  const photos = useStoreInfoStore((s) => s.storePhotos);
  const setField = useStoreInfoStore((s) => s.setField);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busyMap, setBusyMap] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setBusy = (key: string, on: boolean) => {
    setBusyMap((prev) => {
      const n = new Set(prev);
      if (on) n.add(key); else n.delete(key);
      return n;
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    // 1) 인증 체크 — 익명 사용자도 어차피 user.id 있음 (ensureAccountUser)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError(ko ? "로그인이 필요합니다 (익명 계정도 가능)" : "Sign in required (anonymous OK)");
      return;
    }

    setUploading(true);
    try {
      const remainingSlots = MAX_PHOTOS - photos.length;
      const toUpload = Array.from(files).slice(0, remainingSlots);
      const uploaded: StorePhoto[] = [];

      for (const file of toUpload) {
        // 검증
        if (file.size > MAX_BYTES) {
          setError(ko ? `${file.name} — 10MB 초과로 건너뜀` : `${file.name} — exceeds 10MB, skipped`);
          continue;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(ko ? `${file.name} — 지원하지 않는 형식` : `${file.name} — unsupported type`);
          continue;
        }

        // 업로드
        const id = newPhotoId();
        const ext = fileExt(file.name);
        const path = `${user.id}/${id}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("store-photos")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });
        if (upErr) {
          console.error("[StorePhotoUploader] upload failed", upErr);
          setError(ko ? `업로드 실패: ${upErr.message}` : `Upload failed: ${upErr.message}`);
          continue;
        }

        // public URL
        const { data: pub } = supabase.storage.from("store-photos").getPublicUrl(path);
        if (pub?.publicUrl) {
          uploaded.push({ url: pub.publicUrl, caption: "" });
        }
      }

      if (uploaded.length > 0) {
        setField("storePhotos", [...photos, ...uploaded]);
      }
      if (toUpload.length < files.length) {
        setError(ko ? `최대 ${MAX_PHOTOS}장까지 — 일부 건너뜀` : `Max ${MAX_PHOTOS} photos — some skipped`);
      }
    } catch (err) {
      console.error("[StorePhotoUploader] unexpected error", err);
      setError(ko ? "예상치 못한 오류" : "Unexpected error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (photo: StorePhoto, index: number) => {
    const key = `del-${index}`;
    setBusy(key, true);
    setError(null);
    try {
      // Supabase Storage URL 에서 path 추출 (.../store-photos/{user_id}/{id}.{ext})
      const match = /\/store-photos\/(.+)$/.exec(photo.url);
      const path = match?.[1];
      if (path) {
        const { error: delErr } = await supabase.storage.from("store-photos").remove([path]);
        if (delErr) {
          // Storage 삭제 실패해도 일단 store 에서는 제거 — public URL 끊어짐
          console.warn("[StorePhotoUploader] storage delete failed (continuing)", delErr);
        }
      }
      const next = photos.filter((_, i) => i !== index);
      setField("storePhotos", next);
    } catch (err) {
      console.error("[StorePhotoUploader] delete failed", err);
      setError(ko ? "삭제 실패" : "Delete failed");
    } finally {
      setBusy(key, false);
    }
  };

  const setCover = (index: number) => {
    if (index === 0) return;
    const next = [photos[index], ...photos.filter((_, i) => i !== index)];
    setField("storePhotos", next);
  };

  const updateCaption = (index: number, caption: string) => {
    const next = photos.map((p, i) => (i === index ? { ...p, caption } : p));
    setField("storePhotos", next);
  };

  // ── Hero 변형: 큰 hero 사진 + 작은 추가 버튼 ──
  if (variant === "hero") {
    const hero = photos[0];
    return (
      <div style={{ position: "relative" as const, width: "100%", height: "100%", minHeight: 240, background: hero ? "transparent" : "linear-gradient(135deg, rgba(25,25,112,0.06) 0%, rgba(25,25,112,0.12) 100%)" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: "none" }}
        />
        {hero ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.url}
              alt=""
              style={{ width: "100%", height: "100%", minHeight: 240, objectFit: "cover" as const, display: "block" }}
            />
            {/* hover 컨트롤 */}
            <div style={{
              position: "absolute" as const,
              top: 8, right: 8,
              display: "flex", gap: 6,
            }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || photos.length >= MAX_PHOTOS}
                style={ctrlButton}
                title={ko ? "사진 추가" : "Add photo"}
              >
                {uploading ? <Loader2 size={13} strokeWidth={1.5} className="msu-spin" /> : <Upload size={13} strokeWidth={1.5} />}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(hero, 0)}
                disabled={busyMap.has("del-0")}
                style={{ ...ctrlButton, color: PALETTE.DANGER }}
                title={ko ? "사진 삭제" : "Delete"}
              >
                <X size={13} strokeWidth={1.5} />
              </button>
            </div>
            {/* 추가 사진 thumbnail strip */}
            {photos.length > 1 && (
              <div style={{
                position: "absolute" as const,
                bottom: 8, left: 8, right: 8,
                display: "flex", gap: 6, overflowX: "auto" as const,
              }}>
                {photos.slice(1).map((p, idx) => {
                  const realIndex = idx + 1;
                  return (
                    <button
                      key={realIndex}
                      type="button"
                      onClick={() => setCover(realIndex)}
                      title={ko ? "표지 사진으로 설정" : "Set as cover"}
                      style={{
                        width: 44, height: 44, flexShrink: 0,
                        background: `url(${p.url}) center/cover`,
                        border: "2px solid white",
                        borderRadius: 8,
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                        position: "relative" as const,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              width: "100%", height: "100%", minHeight: 240,
              background: "linear-gradient(135deg, rgba(25,25,112,0.04) 0%, rgba(91,107,255,0.06) 100%)",
              border: "none",
              cursor: "pointer",
              display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 10,
              fontFamily: "inherit",
              transition: "background 0.2s ease",
              opacity: uploading ? 0.6 : 1,
              padding: 16,
            }}
            onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.background = "linear-gradient(135deg, rgba(25,25,112,0.07) 0%, rgba(91,107,255,0.10) 100%)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(25,25,112,0.04) 0%, rgba(91,107,255,0.06) 100%)"; }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "white",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(25,25,112,0.10)",
              color: PALETTE.MIDNIGHT,
            }}>
              {uploading ? <Loader2 size={22} strokeWidth={1.5} className="msu-spin" /> : <ImageIcon size={22} strokeWidth={1.5} />}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em", color: PALETTE.MIDNIGHT_DEEP }}>
              {uploading ? (ko ? "업로드 중…" : "Uploading…") : (ko ? "사진 추가하기" : "Add photo")}
            </span>
            <span style={{ fontSize: 11, fontWeight: 500, color: PALETTE.HINT, lineHeight: 1.45, textAlign: "center" as const }}>
              {ko ? "JPG · PNG · WebP · 최대 10MB" : "JPG · PNG · WebP · max 10MB"}
            </span>
          </button>
        )}
        {error && (
          <div style={{
            position: "absolute" as const,
            bottom: 8, left: 8, right: 8,
            background: "rgba(182,76,76,0.95)",
            color: "white",
            padding: "6px 10px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            display: "flex",
            alignItems: "center" as const,
            gap: 5,
          }}>
            <AlertCircle size={11} strokeWidth={1.5} />
            {error}
          </div>
        )}
        <style jsx>{`
          :global(.msu-spin) { animation: msu-rot 0.8s linear infinite; }
          @keyframes msu-rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ── Gallery 변형: 그리드 + 캡션 편집 ──
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: "none" }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
        {photos.map((p, i) => (
          <div key={p.url} style={{ borderRadius: 12, overflow: "hidden" as const, border: `1px solid ${PALETTE.MIDNIGHT_BORDER}`, background: "white", display: "flex", flexDirection: "column" as const }}>
            <div style={{ position: "relative" as const, paddingBottom: "75%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption ?? ""} style={{ position: "absolute" as const, inset: 0, width: "100%", height: "100%", objectFit: "cover" as const }} />
              {i === 0 && (
                <span style={{
                  position: "absolute" as const, top: 6, left: 6,
                  display: "inline-flex", alignItems: "center" as const, gap: 3,
                  padding: "2px 7px", borderRadius: 999,
                  background: "rgba(25,25,112,0.92)", color: "white",
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.02em",
                }}>
                  <Star size={9} strokeWidth={2} fill="white" /> {ko ? "표지" : "Cover"}
                </span>
              )}
              <div style={{ position: "absolute" as const, top: 6, right: 6, display: "flex", gap: 4 }}>
                {i !== 0 && (
                  <button type="button" onClick={() => setCover(i)} style={ctrlButton} title={ko ? "표지로" : "Make cover"}>
                    <Star size={11} strokeWidth={1.5} />
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(p, i)} disabled={busyMap.has(`del-${i}`)} style={{ ...ctrlButton, color: PALETTE.DANGER }} title={ko ? "삭제" : "Delete"}>
                  <X size={11} strokeWidth={1.5} />
                </button>
              </div>
            </div>
            <input
              type="text"
              value={p.caption ?? ""}
              onChange={(e) => updateCaption(i, e.target.value)}
              placeholder={ko ? "캡션 (선택)" : "Caption (optional)"}
              style={{
                border: "none",
                borderTop: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
                padding: "8px 10px",
                fontSize: 11,
                color: PALETTE.INK,
                outline: "none",
                fontFamily: "inherit",
                background: "white",
              }}
            />
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              minHeight: 140,
              border: `2px dashed ${PALETTE.MIDNIGHT_BORDER}`,
              borderRadius: 12,
              background: "transparent",
              cursor: "pointer",
              display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 6,
              color: PALETTE.MIDNIGHT, opacity: uploading ? 0.6 : 0.7,
              fontFamily: "inherit",
            }}
          >
            {uploading ? <Loader2 size={20} strokeWidth={1.5} className="msu-spin" /> : <Upload size={20} strokeWidth={1.5} />}
            <span style={{ fontSize: 11, fontWeight: 600 }}>
              {uploading ? (ko ? "업로드 중" : "Uploading") : (ko ? "사진 추가" : "Add photo")}
            </span>
            <span style={{ fontSize: 10, fontWeight: 500, color: PALETTE.HINT }}>
              {ko ? `${photos.length}/${MAX_PHOTOS}장` : `${photos.length}/${MAX_PHOTOS}`}
            </span>
          </button>
        )}
      </div>
      {error && (
        <div style={{
          padding: "8px 12px",
          borderRadius: 10,
          background: "rgba(182,76,76,0.06)",
          border: "1px solid rgba(182,76,76,0.2)",
          color: PALETTE.DANGER,
          fontSize: 11.5,
          fontWeight: 600,
          display: "flex",
          alignItems: "center" as const,
          gap: 6,
        }}>
          <AlertCircle size={12} strokeWidth={1.5} />
          {error}
        </div>
      )}
      <style jsx>{`
        :global(.msu-spin) { animation: msu-rot 0.8s linear infinite; }
        @keyframes msu-rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const ctrlButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  width: 28, height: 28,
  borderRadius: 8,
  border: "none",
  background: "rgba(255,255,255,0.92)",
  color: PALETTE.MIDNIGHT,
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  transition: "transform 0.12s ease",
  fontFamily: "inherit",
};

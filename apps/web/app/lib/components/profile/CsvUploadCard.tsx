"use client";

/**
 * CsvUploadCard — 매출 CSV 업로드 (모든 사장님 fallback).
 * PG/POS 없는 사장님이 엑셀에서 export 한 매출을 그대로 업로드.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

const card: React.CSSProperties = {
  background: "#fff", borderRadius: "16px",
  border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden",
  marginTop: "12px",
  fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
};
const sectionLabel: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "var(--muted)",
  textTransform: "uppercase" as const, letterSpacing: "0.07em",
  padding: "16px 18px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)",
};
const primaryBtn: React.CSSProperties = {
  fontSize: "13px", fontWeight: 650, padding: "10px 18px",
  borderRadius: "10px", border: "none",
  background: "linear-gradient(135deg, #1d3557 0%, #2c4f80 100%)",
  color: "#fff", cursor: "pointer",
  letterSpacing: "-0.01em",
  boxShadow: "0 2px 8px rgba(29,53,87,0.18)",
};

export function CsvUploadCard({ ko }: { ko: boolean }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState<Array<{ id: string; filename: string; row_count: number; total_amount: number; uploaded_at: string }>>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState("");

  const load = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    const token = s.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/integrations/csv/list", {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    const d = await res.json();
    if (d.ok) setUploads(d.uploads ?? []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const { data: s } = await supabase.auth.getSession();
      const fd = new FormData();
      fd.append("file", file);
      if (sourceLabel.trim()) fd.append("sourceLabel", sourceLabel.trim());
      const res = await fetch("/api/integrations/csv/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${s.session?.access_token}` },
        body: fd,
      });
      const d = await res.json();
      if (d.ok) {
        setMsg(ko
          ? `완료 — ${d.rowCount}행 · 총 ${(d.totalAmount / 10000).toLocaleString()}만원`
          : `Done — ${d.rowCount} rows · ${d.totalAmount}`);
        await load();
      } else {
        setMsg(`❌ ${d.error}`);
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <article style={card}>
      <div style={sectionLabel}>{ko ? "엑셀/CSV 업로드" : "CSV / Excel Upload"}</div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #1d3557 0%, #1d3557 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
            flexShrink: 0,
          }}>
            <FileSpreadsheet size={18} strokeWidth={1.75} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
              {ko ? "어떤 사장님이든 가능" : "Works for everyone"}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5, marginTop: "3px" }}>
              {ko
                ? "엑셀·구글시트에서 매출을 export → 그대로 업로드. 헤더는 \"날짜·매출\" 자동 인식 (영문도 OK)."
                : "Export from Excel/Sheets → upload directly. Headers like \"date·amount\" auto-detected."}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" as const }}>
          <input
            type="text"
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
            placeholder={ko ? "출처 메모 (선택, 예: \"스마트스토어\")" : "Source label (optional)"}
            style={{
              flex: 1, minWidth: 0,
              padding: "9px 12px", borderRadius: "9px",
              border: "1px solid rgba(15,23,42,0.12)",
              fontSize: "12.5px", outline: "none", background: "#f8fafc",
            }}
          />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} style={primaryBtn}>
            {busy ? (ko ? "업로드 중…" : "Uploading…") : ko ? "파일 선택" : "Choose file"}
          </button>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={onFile} style={{ display: "none" }} />
        </div>

        {msg && (
          <div style={{
            padding: "8px 12px", borderRadius: "9px",
            background: msg.startsWith("❌") ? "rgba(182,76,76,0.06)" : "rgba(25,25,112,0.06)",
            color: msg.startsWith("❌") ? "#b64c4c" : "#1d3557",
            fontSize: "12.5px", fontWeight: 600,
            marginBottom: "10px",
          }}>{msg}</div>
        )}

        {uploads.length > 0 && (
          <div style={{ display: "grid", gap: "6px", marginTop: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
              {ko ? "최근 업로드" : "Recent uploads"}
            </div>
            {uploads.slice(0, 5).map((u) => (
              <div key={u.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 10px", borderRadius: "8px",
                background: "rgba(15,23,42,0.025)",
                fontSize: "12px",
              }}>
                <span style={{ color: "#0f172a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, minWidth: 0, flex: 1 }}>
                  {u.filename}
                </span>
                <span style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" as const, marginLeft: "10px" }}>
                  {u.row_count}행 · {(u.total_amount / 10000).toLocaleString()}만
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

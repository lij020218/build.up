"use client";
/**
 * MarketSnapshotPanel — 지역 입력 시 실측 스냅샷 자동 표시 (LLM 무관, 2026-08-03)
 *
 * 구 검색 패널 3종(프랜차이즈 주변 매장·동종 경쟁 밀도·인구 패널) 흡수.
 *  버튼 없이 디바운스(700ms) 자동 — 사장님 결정 "입력하거나 추천받을 때 같이".
 *  축별 null = 미표시 (실측 없음을 값처럼 그리지 않는다).
 */
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../../../lib/supabase";

type SnapshotAxes = {
  competition: string | null;
  competitionMap: string | null;
  franchise: string | null;
  population: string | null;
  rent: string | null;
  trend: string | null;
  brandRegional: string | null;
};

const AXIS_ORDER: Array<{ key: keyof SnapshotAxes; icon: string; label: string }> = [
  { key: "competition", icon: "🏪", label: "동종 경쟁" },
  { key: "competitionMap", icon: "🗺️", label: "동종 경쟁" },
  { key: "franchise", icon: "🏢", label: "프랜차이즈" },
  { key: "population", icon: "👥", label: "배후 인구" },
  { key: "rent", icon: "💰", label: "임대 시세" },
  { key: "trend", icon: "📈", label: "개폐업 추이" },
  { key: "brandRegional", icon: "🗾", label: "시도 분포" },
];

export default function MarketSnapshotPanel({
  region, categoryId, subIndustryId, franchiseBrandId, language,
}: {
  region: string;
  categoryId: string;
  subIndustryId?: string;
  franchiseBrandId?: string;
  language: "ko" | "en";
}) {
  const [axes, setAxes] = useState<SnapshotAxes | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    const trimmed = region.trim();
    const key = `${trimmed}|${subIndustryId ?? categoryId}|${franchiseBrandId ?? ""}`;
    if (trimmed.length < 2) { setAxes(null); lastKeyRef.current = ""; return; }
    if (key === lastKeyRef.current) return;         // 동일 입력 skip

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        if (!token) { setLoading(false); return; }   // 비로그인 — 조용히 생략
        const res = await fetch("/api/data/market-snapshot", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ region: trimmed, categoryId, subIndustryId, franchiseBrandId: franchiseBrandId || undefined }),
          signal: ac.signal,
        });
        const data = await res.json().catch(() => null);
        if (ac.signal.aborted) return;
        if (res.ok && data?.ok && data.snapshot?.axes) {
          setAxes(data.snapshot.axes as SnapshotAxes);
          lastKeyRef.current = key;
        } else {
          setAxes(null);                             // 위치 못 찾음 등 — 실패 화면 아님, 그냥 미표시
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") setAxes(null);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [region, categoryId, subIndustryId, franchiseBrandId]);

  const rows = axes ? AXIS_ORDER.filter((a) => axes[a.key]) : [];
  if (!loading && rows.length === 0) return null;

  return (
    <div style={{
      display: "grid", gap: "6px", padding: "12px 14px", borderRadius: "12px",
      background: "rgba(29,53,87,0.04)", border: "1px solid var(--border)",
    }}>
      <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
        {language === "ko" ? "입력 지역 실측" : "Measured data"}
        {loading && <span style={{ fontWeight: 400 }}> {language === "ko" ? "· 조회 중…" : "· loading…"}</span>}
      </p>
      {rows.map((a) => (
        <p key={a.key} style={{ margin: 0, fontSize: "12.5px", color: "var(--text-primary)", lineHeight: 1.5 }}>
          {a.icon} {axes![a.key]}
        </p>
      ))}
    </div>
  );
}

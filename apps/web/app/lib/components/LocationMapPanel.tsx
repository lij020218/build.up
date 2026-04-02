"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function LocationMapPanel(props: {
  candidates: Array<{ id: string; title: string; score?: number | null; meta?: Record<string, unknown> }>;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  language: "ko" | "en";
  region: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const overlaysRef = useRef<unknown[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const ko = props.language === "ko";

  useEffect(() => {
    if (!mapRef.current) return;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const w = window as any;
    const kakao = w.kakao;
    if (!kakao?.maps) {
      setMapError(ko ? "카카오맵 SDK가 로드되지 않았습니다." : "Kakao Maps SDK not loaded.");
      return;
    }

    const init = () => {
      try {
        // 이전 오버레이 정리
        for (const o of overlaysRef.current) {
          (o as any).setMap(null);
        }
        overlaysRef.current = [];

        const maps = kakao.maps;
        const center = new maps.LatLng(37.5665, 126.978);
        const map = new maps.Map(mapRef.current, { center, level: 7 });
        setMapLoaded(true);

        if (!maps.services) return;
        const ps = new maps.services.Places();
        const geo = new maps.services.Geocoder();
        const bounds = new maps.LatLngBounds();
        const overlays: any[] = [];

        const addPin = (c: typeof props.candidates[0], lat: number, lng: number) => {
          const pos = new maps.LatLng(lat, lng);
          bounds.extend(pos);

          const scoreColor = (c.score ?? 0) >= 85 ? "#34c759" : (c.score ?? 0) >= 70 ? "#007aff" : "#ff9f0a";
          const isSelected = c.id === props.selectedId;

          const el = document.createElement("div");
          el.style.cssText = `display:flex;align-items:center;gap:6px;padding:6px 12px 6px 8px;border-radius:20px;background:${isSelected ? "#1d3557" : "#fff"};border:1.5px solid ${isSelected ? "#1d3557" : "rgba(0,0,0,0.1)"};box-shadow:0 2px 10px rgba(0,0,0,0.15);cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,sans-serif;white-space:nowrap;`;
          el.innerHTML = `<span style="min-width:24px;height:24px;border-radius:8px;background:${scoreColor}20;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${scoreColor}">${c.score ?? "-"}</span><span style="font-size:12px;font-weight:600;color:${isSelected ? "#fff" : "#1d1d1f"}">${c.title}</span>`;
          el.onclick = () => props.onSelect(c.id);

          const overlay = new maps.CustomOverlay({ position: pos, content: el, yAnchor: 1.4 });
          overlay.setMap(map);
          overlays.push(overlay);
          overlaysRef.current.push(overlay);
        };

        // Search candidates SEQUENTIALLY — Kakao Places API cancels concurrent calls
        const searchNext = (idx: number) => {
          if (idx >= props.candidates.length) {
            if (overlays.length > 0) map.setBounds(bounds);
            return;
          }
          const c = props.candidates[idx];
          const district = c.meta?.districtName ? String(c.meta.districtName) : "";
          const region = props.region.trim();

          const tryGeo = () => {
            const addr = district || `${region} ${c.title}`;
            geo.addressSearch(addr, (result: any[], s: string) => {
              if (s === maps.services.Status.OK && result.length > 0) {
                addPin(c, parseFloat(result[0].y), parseFloat(result[0].x));
              }
              searchNext(idx + 1);
            });
          };

          const tryDistrict = () => {
            const q = district || c.title;
            ps.keywordSearch(q, (d: any[], s: string) => {
              if (s === maps.services.Status.OK && d.length > 0) {
                addPin(c, parseFloat(d[0].y), parseFloat(d[0].x));
                searchNext(idx + 1);
              } else {
                tryGeo();
              }
            }, { size: 1 });
          };

          const q1 = `${c.title} ${region}`;
          ps.keywordSearch(q1, (d: any[], s: string) => {
            if (s === maps.services.Status.OK && d.length > 0) {
              addPin(c, parseFloat(d[0].y), parseFloat(d[0].x));
              searchNext(idx + 1);
            } else {
              tryDistrict();
            }
          }, { size: 1 });
        };
        searchNext(0);
      } catch (err: any) {
        setMapError(err?.message ?? "Map init failed");
      }
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (kakao.maps.load) {
      kakao.maps.load(init);
    } else {
      init();
    }
  }, [props.candidates, props.selectedId, props.region]);

  return (
    <div style={{
      borderRadius: "20px",
      overflow: "hidden",
      border: "1px solid var(--border)",
      background: "#e8e8ed",
      marginBottom: "16px"
    }}>
      {mapError ? (
        <div style={{ padding: "40px 20px", textAlign: "center", fontSize: "13px", color: "var(--muted)" }}>
          {mapError}
        </div>
      ) : (
        <div
          ref={mapRef}
          style={{ width: "100%", height: "300px" }}
        />
      )}
      <div style={{
        padding: "10px 16px",
        background: "rgba(255,255,255,0.88)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--muted)" }}>
          {ko ? `추천 입지 ${props.candidates.length}곳` : `${props.candidates.length} recommended locations`}
        </span>
        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
          {mapLoaded ? (ko ? "지도에서 핀을 클릭하여 선택" : "Click pins to select") : (ko ? "지도 로딩 중..." : "Loading map...")}
        </span>
      </div>
    </div>
  );
}

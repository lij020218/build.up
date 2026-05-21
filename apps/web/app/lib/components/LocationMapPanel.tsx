"use client";

import { useEffect, useRef, useState, useCallback } from "react";
// 2026-05-13: kakao-maps.d.ts 글로벌 타입 — any 캐스트 제거
import type {
  KakaoLatLng, KakaoMap, KakaoMarker, KakaoCustomOverlay,
  KakaoGeocoderResult, KakaoPlacesResult,
} from "../types/kakao-maps";

export function LocationMapPanel(props: {
  candidates: Array<{ id: string; title: string; score?: number | null; meta?: Record<string, unknown> }>;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  language: "ko" | "en";
  region: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const overlaysRef = useRef<Array<KakaoMarker | KakaoCustomOverlay>>([]);
  // 후보별 좌표 캐시 — 카드 클릭 시 panTo 가능하도록
  const pinPosRef = useRef<Map<string, KakaoLatLng>>(new Map());
  const mapInstanceRef = useRef<KakaoMap | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const ko = props.language === "ko";

  useEffect(() => {
    if (!mapRef.current) return;

    const kakao = typeof window !== "undefined" ? window.kakao : undefined;
    const maps = kakao?.maps;
    if (!maps) {
      setMapError(ko ? "카카오맵 SDK가 로드되지 않았습니다." : "Kakao Maps SDK not loaded.");
      return;
    }

    const init = () => {
      try {
        // 이전 오버레이 정리
        for (const o of overlaysRef.current) {
          o.setMap(null);
        }
        overlaysRef.current = [];
        const center = new maps.LatLng(37.5665, 126.978);
        if (!mapRef.current) return;
        const map = new maps.Map(mapRef.current, { center, level: 7 });
        mapInstanceRef.current = map;
        pinPosRef.current = new Map();
        setMapLoaded(true);

        if (!maps.services) return;
        const ps = new maps.services.Places();
        const geo = new maps.services.Geocoder();
        const bounds = new maps.LatLngBounds();
        const overlays: Array<KakaoMarker | KakaoCustomOverlay> = [];
        // 동일 좌표 충돌 방지 — 동일 lat/lng 에 핀이 이미 있으면 미세하게 offset.
        //  built-in 데이터가 같은 districtName 만 가지고 있을 때 (예: "도봉구") 여러 후보가
        //  같은 구청 좌표로 매칭되는 경우 시각적으로 구분되지 않음 → 작은 분산.
        const usedKeys = new Set<string>();
        const ensureUnique = (lat: number, lng: number): { lat: number; lng: number } => {
          let l = lat, g = lng, attempt = 0;
          while (usedKeys.has(`${l.toFixed(4)},${g.toFixed(4)}`) && attempt < 8) {
            // 작은 spiral offset (~50m 단위)
            const angle = attempt * (Math.PI / 4);
            l = lat + Math.cos(angle) * 0.0005;
            g = lng + Math.sin(angle) * 0.0005;
            attempt++;
          }
          usedKeys.add(`${l.toFixed(4)},${g.toFixed(4)}`);
          return { lat: l, lng: g };
        };

        const addPin = (c: typeof props.candidates[0], lat: number, lng: number) => {
          const unique = ensureUnique(lat, lng);
          const pos = new maps.LatLng(unique.lat, unique.lng);
          bounds.extend(pos);
          pinPosRef.current.set(c.id, pos);

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

        // Geocoding — title 에서 noise suffix 를 벗겨 core POI 를 추출하고,
        //  검색 결과 중 카테고리 우선순위로 픽 (SW8 지하철역 > AT4 관광명소 > AG2 부동산 > 첫 결과).
        //  Kakao keyword search 가 "도봉역 상권" 같은 컴파운드 query 에 산(山) POI 를 첫 결과로
        //  돌려주는 fuzzy 매칭 문제 해결.
        //
        //  ① meta.lat/lng (AI 라이브)              — instant
        //  ② strip suffix → core POI keyword search → SW8/AT4 우선 픽
        //  ③ address(districtName) — districtName 이 ≥2 토큰일 때만
        //  ④ keyword(districtName)
        //  ⑤ address("서울 " + core)
        const NOISE_SUFFIXES = ["상권", "거리", "골목", "역세권", "타운"];
        const stripNoise = (t: string): string => {
          let core = t.trim();
          for (let pass = 0; pass < 3; pass++) {
            let changed = false;
            for (const sfx of NOISE_SUFFIXES) {
              if (core.endsWith(sfx)) {
                core = core.slice(0, -sfx.length).trim();
                changed = true;
                break;
              }
            }
            if (!changed) break;
          }
          return core;
        };
        // 카테고리 우선순위 — 지하철역이면 SW8 가 가장 정확한 좌표
        const PREFERRED_CATEGORIES = ["SW8", "AT4", "AG2", "FD6", "CE7"];
        // KakaoPlacesResult 에 category_group_code 는 부분 타입 외 — 안전 cast
        type KakaoPlaceWithCategory = KakaoPlacesResult & { category_group_code?: string };
        const pickBestResult = (results: KakaoPlacesResult[]): KakaoPlaceWithCategory | null => {
          if (!results || results.length === 0) return null;
          const typed = results as KakaoPlaceWithCategory[];
          for (const code of PREFERRED_CATEGORIES) {
            const hit = typed.find((r) => r.category_group_code === code);
            if (hit) return hit;
          }
          return typed[0];
        };

        const searchNext = (idx: number) => {
          if (idx >= props.candidates.length) {
            const selectedPos = props.selectedId ? pinPosRef.current.get(props.selectedId) : null;
            if (selectedPos) {
              map.setLevel(4, { animate: true });
              map.panTo(selectedPos);
            } else if (overlays.length > 0) {
              map.setBounds(bounds);
            }
            return;
          }
          const c = props.candidates[idx];
          const next = () => searchNext(idx + 1);

          // ① Fast path
          const metaLat = typeof c.meta?.lat === "number" ? c.meta.lat : Number(c.meta?.lat);
          const metaLng = typeof c.meta?.lng === "number" ? c.meta.lng : Number(c.meta?.lng);
          if (isFinite(metaLat) && isFinite(metaLng) && metaLat !== 0 && metaLng !== 0) {
            addPin(c, metaLat, metaLng);
            next();
            return;
          }

          const district = c.meta?.districtName ? String(c.meta.districtName).trim() : "";
          const title = c.title.trim();
          const core = stripNoise(title);  // "창동역 상권" → "창동역", "홍대 거리" → "홍대"
          const districtIsPrecise = district.split(/\s+/).length >= 2;

          const tryAddrWithCity = () => {
            const variants = [`서울 ${core}`, `서울특별시 ${core}`];
            const tryOne = (i: number) => {
              if (i >= variants.length) return next();
              geo.addressSearch(variants[i], (result: KakaoGeocoderResult[], s) => {
                if (s === maps.services.Status.OK && result.length > 0) {
                  addPin(c, parseFloat(result[0].y), parseFloat(result[0].x));
                  next();
                } else {
                  tryOne(i + 1);
                }
              });
            };
            tryOne(0);
          };

          const tryKeywordDistrict = () => {
            if (!district) return tryAddrWithCity();
            ps.keywordSearch(district, (d: KakaoPlacesResult[], s) => {
              if (s === maps.services.Status.OK && d.length > 0) {
                const pick = pickBestResult(d);
                if (pick) {
                  addPin(c, parseFloat(pick.y), parseFloat(pick.x));
                  return next();
                }
              }
              tryAddrWithCity();
            }, { size: 15 });
          };

          const tryAddrDistrict = () => {
            if (!districtIsPrecise) return tryKeywordDistrict();
            geo.addressSearch(district, (result: KakaoGeocoderResult[], s) => {
              if (s === maps.services.Status.OK && result.length > 0) {
                addPin(c, parseFloat(result[0].y), parseFloat(result[0].x));
                next();
              } else {
                tryKeywordDistrict();
              }
            });
          };

          // ② keyword search on core (suffix-stripped) + SW8/AT4 우선 픽.
          //   "창동역 상권" → core="창동역" → SW8 우선 → 정확히 창동역
          //   "홍대 거리" → core="홍대" → SW8 우선 → 홍대입구역 (없으면 첫 결과)
          //   "도봉역 상권" → core="도봉역" → SW8 우선 → 도봉역 (도봉산 X)
          ps.keywordSearch(core, (d: KakaoPlacesResult[], s) => {
            if (s === maps.services.Status.OK && d && d.length > 0) {
              const pick = pickBestResult(d);
              if (pick) {
                addPin(c, parseFloat(pick.y), parseFloat(pick.x));
                return next();
              }
            }
            tryAddrDistrict();
          }, { size: 15 });
        };
        searchNext(0);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Map init failed";
        setMapError(msg);
      }
    };

    if (maps.load) {
      maps.load(init);
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
          // ⚠️ 2026-05-19 모바일: 고정 300px → 모바일에서 50% 차지 + 핀 겹침. viewport-aware 로
          //   화면 비율 따라 360-480px (모바일 일수록 큼).
          style={{ width: "100%", height: "clamp(300px, 60vw, 480px)" }}
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

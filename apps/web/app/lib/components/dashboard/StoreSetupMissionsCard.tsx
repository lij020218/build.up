"use client";

/**
 * StoreSetupMissionsCard — "가게 세팅" 미션 카드 (2026-07-28)
 *
 *  대상: **기존 가게 등록으로 들어온 사장님만** (setup-missions.ts 판정 — 마커+휴리스틱).
 *  로드맵·AI 로드맵 진행자에게는 렌더 자체가 안 됨 (사장님 지시).
 *
 *  역할: 온보딩(5화면)에서 뺀 정밀 입력들의 귀착지 — 각 미션에 "하면 무엇이 열리는지"
 *  보상을 명시. 전 항목 완료 시 자동 소멸, X 로 수동 닫기(서버 동기화되는 dismissed 플래그).
 *
 *  정직성: 완료 판정은 실데이터(entries·monthlyCosts·inventory)만. 판정 불가 항목은
 *  아예 목록에 넣지 않는다 (예: 오퍼링 hidden 업종은 메뉴 미션 없음).
 */

import { useStoreInfoStore } from "../../stores/store-info-store";
import { readSetupMeta, isExistingBusinessRegistration, SETUP_META_KEY } from "../../setup-missions";
import { resolveOfferingKind } from "@foundone/shared";

type Mission = { id: string; label: string; reward: string; done: boolean };

type Props = {
  ko: boolean;
  decisions: Record<string, { completedAt?: string | null } | undefined>;
  categoryId: string | null;
  subIndustryId: string | null;
  entriesCount: number;
  monthlyCostsTotal: number;
  inventoryCount: number;
};

const OFFERING_MISSION_LABEL: Record<string, { ko: string; en: string }> = {
  "menu-bom": { ko: "메뉴 등록", en: "Add menu items" },
  "stocked-goods": { ko: "상품 등록", en: "Add products" },
  "service-menu": { ko: "시술·서비스 메뉴 등록", en: "Add service menu" },
  "membership": { ko: "이용권·상품 등록", en: "Add passes" },
  "space-booking": { ko: "이용권·공간 상품 등록", en: "Add space passes" },
};

export function StoreSetupMissionsCard({
  ko, decisions, categoryId, subIndustryId,
  entriesCount, monthlyCostsTotal, inventoryCount,
}: Props) {
  const industrySpecifics = useStoreInfoStore((s) => s.industrySpecifics);
  const setIndustrySpecific = useStoreInfoStore((s) => s.setIndustrySpecific);
  const meta = readSetupMeta(industrySpecifics);

  // ⚠️ 노출 게이트 — 기존 가게 등록자만. 로드맵/AI 로드맵 유저는 여기서 차단.
  if (!isExistingBusinessRegistration(meta, decisions)) return null;
  if (meta?.dismissed) return null;

  const offeringKind = resolveOfferingKind(subIndustryId, categoryId);
  const offeringLabel = OFFERING_MISSION_LABEL[offeringKind];

  const missions: Mission[] = [
    { id: "profile", label: ko ? "업종·가게 정보" : "Business profile", reward: "", done: true },
    { id: "channels", label: ko ? "운영 채널" : "Channels", reward: "", done: true },
    {
      id: "revenue",
      label: ko ? "매출 연동 또는 첫 매출 입력" : "Connect or log revenue",
      reward: ko ? "진단이 실측으로" : "Real diagnostics",
      done: entriesCount > 0,
    },
    {
      id: "costs",
      label: ko ? "월 고정비 입력" : "Enter monthly costs",
      reward: ko ? "손익분기 열림" : "Unlocks break-even",
      done: monthlyCostsTotal > 0,
    },
    // 오퍼링 hidden 업종(스타트업 계열)은 이 미션 자체가 없음 — 업종 분기 원칙
    ...(offeringLabel
      ? [{
          id: "offerings",
          label: ko ? offeringLabel.ko : offeringLabel.en,
          reward: ko ? "원가율·재고 도구 열림" : "Unlocks cost ratio",
          done: inventoryCount > 0,
        }]
      : []),
  ];

  const doneCount = missions.filter((m) => m.done).length;
  if (doneCount === missions.length) return null; // 전 항목 완료 → 자동 소멸

  return (
    <section
      style={{
        borderRadius: 20,
        border: "1px solid rgba(29,53,87,0.14)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.88) 100%)",
        boxShadow: "0 10px 26px rgba(25,25,112,0.07)",
        padding: "18px 20px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--text)" }}>
            {ko ? "가게 세팅" : "Store setup"}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--primary)" }}>
            {doneCount} / {missions.length} {ko ? "완료" : "done"}
          </span>
        </div>
        <button
          type="button"
          aria-label={ko ? "세팅 카드 닫기" : "Dismiss"}
          onClick={() => setIndustrySpecific(SETUP_META_KEY, { ...(meta ?? {}), dismissed: true })}
          style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 15, cursor: "pointer", padding: "2px 4px" }}
        >
          ✕
        </button>
      </div>

      <div style={{ height: 4, borderRadius: 2, background: "rgba(29,53,87,0.10)", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ width: `${(doneCount / missions.length) * 100}%`, height: "100%", background: "var(--primary)", borderRadius: 2, transition: "width 0.3s ease" }} />
      </div>

      <div>
        {missions.map((m, i) => (
          <div
            key={m.id}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 2px",
              borderBottom: i < missions.length - 1 ? "1px solid rgba(17,17,17,0.05)" : "none",
            }}
          >
            <span
              style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: m.done ? "var(--primary)" : "transparent",
                border: m.done ? "none" : "1.5px solid rgba(29,53,87,0.35)",
                color: "#fff", fontSize: 10, fontWeight: 900,
              }}
            >
              {m.done ? "✓" : ""}
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: m.done ? "var(--muted)" : "var(--text)", textDecoration: m.done ? "line-through" : "none" }}>
              {m.label}
            </span>
            {!m.done && m.reward && (
              <span style={{
                marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "var(--primary)",
                background: "rgba(29,53,87,0.07)", borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap",
              }}>
                {m.reward}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

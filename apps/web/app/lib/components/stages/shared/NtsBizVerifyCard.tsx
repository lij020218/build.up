"use client";

/**
 * NtsBizVerifyCard — 사업자등록을 국세청에서 실확인 (2026-08-03, 감사 P1-2).
 *
 * "완료 체크"는 자기신고다 — 이 카드는 사업자번호를 국세청 상태조회 API 로 대조해
 * "등록이 실제로 살아있다"는 증거를 보여준다.
 *
 * 정직성 규칙 (2026-08-03 국세청 감사에서 확정):
 *  · 미등록 응답 ≠ 등록 실패 — 갓 발급된 번호는 전산 반영 전일 수 있다. 완료를 막지 않는다.
 *  · 5xx/네트워크 오류 ≠ 미등록 — 재시도 상태로만 (2026-08-03 실측: 국세청 점검 시 503).
 *  · "확인됨" 배지는 세션 한정 — 조회 시점의 사실만 말하고, 오래된 확인을 저장해
 *    영구 배지로 굳히지 않는다 (번호만 가게 정보에 저장).
 */
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "../../../../../lib/supabase";
import { useStoreInfoStore } from "../../../stores/store-info-store";

const MIDNIGHT = "#191970";

type VerifyState =
  | { s: "idle" }
  | { s: "loading" }
  | { s: "confirmed"; taxTypeLabel: string; isActive: boolean | null }
  | { s: "notfound" }
  | { s: "error" };

export function NtsBizVerifyCard({ language }: { language: string }) {
  const ko = language === "ko";
  const bizNo = useStoreInfoStore((st) => st.bizRegistrationNumber);
  const setField = useStoreInfoStore((st) => st.setField);
  const [state, setState] = useState<VerifyState>({ s: "idle" });

  const digits = bizNo.replace(/[^\d]/g, "");

  const check = async () => {
    if (digits.length !== 10 || state.s === "loading") return;
    setState({ s: "loading" });
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/data/business/status", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ businessNumbers: [digits] }),
      });
      if (!res.ok) { setState({ s: "error" }); return; }
      const json = await res.json();
      const item = json?.data?.[0];
      if (!item) { setState({ s: "error" }); return; }
      if (item.operatingStatus === "unregistered") { setState({ s: "notfound" }); return; }
      setState({
        s: "confirmed",
        taxTypeLabel: String(item.taxType ?? "").replace("부가가치세 ", ""),
        isActive: item.operatingStatus === "active" ? true
          : item.operatingStatus === "suspended" || item.operatingStatus === "closed" ? false
          : null,
      });
    } catch {
      setState({ s: "error" });
    }
  };

  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <ShieldCheck size={15} strokeWidth={1.8} color={MIDNIGHT} />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#16181d" }}>
          {ko ? "국세청으로 등록 확인" : "Verify with NTS"}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(15,23,42,0.4)" }}>
          {ko ? "선택 — 체크 대신 증거" : "optional"}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "rgba(15,23,42,0.55)", lineHeight: 1.55, marginBottom: 10 }}>
        {ko
          ? "발급받은 사업자등록번호를 넣으면 국세청 상태조회로 등록·과세유형을 확인해드려요."
          : "Enter your business number to check it against NTS records."}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={bizNo}
          onChange={(e) => { setField("bizRegistrationNumber", e.target.value); if (state.s !== "idle") setState({ s: "idle" }); }}
          placeholder={ko ? "사업자등록번호 10자리" : "10-digit number"}
          inputMode="numeric"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13.5, minWidth: 0 }}
        />
        <button
          type="button"
          onClick={check}
          disabled={state.s === "loading" || digits.length !== 10}
          style={{
            padding: "0 16px", borderRadius: 10, border: "none", background: MIDNIGHT, color: "white",
            fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            opacity: digits.length === 10 && state.s !== "loading" ? 1 : 0.4,
          }}
        >
          {state.s === "loading" ? (ko ? "확인 중..." : "Checking...") : (ko ? "확인" : "Check")}
        </button>
      </div>

      {state.s === "confirmed" && (
        <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "rgba(25,25,112,0.07)", border: "1px solid rgba(25,25,112,0.16)", fontSize: 12.5, fontWeight: 700, color: MIDNIGHT }}>
          ✓ {state.taxTypeLabel}
          {state.isActive !== null && <> · {state.isActive ? (ko ? "계속사업자" : "Active") : (ko ? "휴·폐업 상태" : "Inactive")}</>}
          {" — "}{ko ? "국세청 확인 (방금 조회)" : "NTS verified (just now)"}
        </div>
      )}
      {state.s === "notfound" && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.55 }}>
          {ko
            ? "국세청에서 찾을 수 없는 번호예요. 방금 등록하셨다면 전산 반영 전일 수 있어요 — 등록 자체가 잘못된 건 아니니, 하루 이틀 뒤 다시 확인해보세요."
            : "Not found in NTS records — if you just registered, it may not be reflected yet. Try again in a day or two."}
        </div>
      )}
      {state.s === "error" && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: "#b64c4c", lineHeight: 1.55 }}>
          {ko
            ? "조회에 실패했어요 (국세청 서버 점검 중일 수 있어요). 미등록이라는 뜻이 아니니 잠시 후 다시 시도해주세요."
            : "Lookup failed (NTS may be under maintenance) — this does not mean unregistered. Try again shortly."}
        </div>
      )}
    </div>
  );
}

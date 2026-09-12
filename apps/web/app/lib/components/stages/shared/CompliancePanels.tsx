"use client";

/**
 * CompliancePanels — 앱·플랫폼 규제·계약 도구(웹). SSOT interactive ref → React.
 *   authChannelPicker : 요건 → 채널 순위·월 비용·콘솔 클릭 경로 (@foundone/shared recommendIdentityChannel)
 *   pgPrecheck        : URL → /api/compliance/pg-precheck → 항목별 통과/미달·반려 문구
 *   docRequestDecoder : 메일 본문 → 용어별 '어디서·어떤 형식' + 체크리스트 (@foundone/shared decodeDocumentRequest)
 * iOS 미러: BUCompliancePanels.swift (같은 데이터 compliance-data.json, 같은 API).
 */

import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Check, ChevronRight, Search, ShieldCheck, X } from "lucide-react";
import {
  IDENTITY_CHANNELS,
  recommendIdentityChannel,
  decodeDocumentRequest,
  type ChannelVerdict,
  type IdentityRequirements,
  type PgPrecheckResult,
  type PrecheckItem,
} from "@foundone/shared";
import { supabase } from "../../../../../lib/supabase";
import { MIDNIGHT, MIDNIGHT_SOFT, MIDNIGHT_BORDER } from "../startup/StartupStageShell";

const DANGER = "#b64c4c";
const WARN = "#b8860b";
const OK = "#2f8f4e";

type WidgetConfig = { title?: string; note?: string };

function Card({ title, note, icon, children }: { title?: string; note?: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div style={{ marginBottom: "16px", background: "white", borderRadius: "14px", border: `1px solid ${MIDNIGHT_BORDER}`, boxShadow: "0 1px 3px rgba(25,25,112,0.04)", overflow: "hidden" }}>
      <div style={{ padding: "16px 18px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: MIDNIGHT_SOFT, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{title ?? ""}</div>
        </div>
        {note && <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55 }}>{note}</div>}
      </div>
      <div style={{ padding: "14px 18px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>{children}</div>
    </div>
  );
}

function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "10px", border: `1px solid ${value ? MIDNIGHT : "rgba(0,0,0,0.1)"}`, background: value ? "rgba(25,25,112,0.05)" : "white", cursor: "pointer" }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: value ? "none" : "1.5px solid rgba(0,0,0,0.25)", background: value ? MIDNIGHT : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {value && <Check size={12} strokeWidth={3} color="white" />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0f172a" }}>{label}</div>
        {hint && <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.55)", marginTop: "2px" }}>{hint}</div>}
      </div>
    </button>
  );
}

const STATUS_STYLE: Record<ChannelVerdict["status"], { label: string; color: string; bg: string }> = {
  recommended: { label: "추천", color: "white", bg: MIDNIGHT },
  possible: { label: "가능", color: MIDNIGHT, bg: MIDNIGHT_SOFT },
  excluded: { label: "제외", color: DANGER, bg: "rgba(182,76,76,0.08)" },
};

/** 본인인증 채널 선택기(웹). */
export function AuthChannelPickerWidget({ config, ko }: { config?: Record<string, unknown>; ko: boolean }) {
  const c = (config ?? {}) as WidgetConfig;
  const [req, setReq] = useState<IdentityRequirements>({ needsGender: true, needsForeigner: false, monthlyCases: 300, needsPreLaunchTest: false, acceptsPayments: false });
  const rec = useMemo(() => recommendIdentityChannel(req), [req]);
  const set = <K extends keyof IdentityRequirements>(k: K, v: IdentityRequirements[K]) => setReq((p) => ({ ...p, [k]: v }));

  return (
    <Card title={c.title} note={c.note} icon={<ShieldCheck size={16} strokeWidth={2.2} color={MIDNIGHT} />}>
      <div style={{ display: "grid", gap: "8px" }}>
        <ToggleRow label={ko ? "성별이 서비스 로직에 필요" : "Needs gender"} hint={ko ? "성별 격리·매칭이 있으면 켜세요 — 통합인증은 성별을 주지 않습니다" : undefined} value={req.needsGender} onChange={(v) => set("needsGender", v)} />
        <ToggleRow label={ko ? "내외국인 구분 필요" : "Needs foreigner flag"} value={req.needsForeigner} onChange={(v) => set("needsForeigner", v)} />
        <ToggleRow label={ko ? "출시 전에 실제 인증 흐름을 테스트해야 함" : "Needs pre-launch test"} hint={ko ? "다날은 계약 전 테스트 채널이 없습니다" : undefined} value={req.needsPreLaunchTest} onChange={(v) => set("needsPreLaunchTest", v)} />
        <ToggleRow label={ko ? "결제(카드 등)도 같이 받음" : "Also accepts payments"} hint={ko ? "끄면 '본인인증만' 시나리오 — 카드 PG 가입비 함정 경고를 붙입니다" : undefined} value={req.acceptsPayments} onChange={(v) => set("acceptsPayments", v)} />
        <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.1)" }}>
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#0f172a", flex: 1 }}>{ko ? "월 예상 인증 건수" : "Monthly verifications"}</span>
          <input type="number" min={0} step={50} value={req.monthlyCases} onChange={(e) => set("monthlyCases", Math.max(0, Number(e.target.value) || 0))} style={{ width: "110px", fontSize: "14px", padding: "6px 10px", borderRadius: "8px", border: `1px solid ${MIDNIGHT_BORDER}`, textAlign: "right" }} />
          <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)" }}>건</span>
        </label>
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        {rec.verdicts.map((v) => {
          const st = STATUS_STYLE[v.status];
          const ch = IDENTITY_CHANNELS.find((x) => x.id === v.channelId);
          return (
            <div key={v.channelId} style={{ padding: "12px 14px", borderRadius: "12px", border: `1px solid ${v.status === "recommended" ? MIDNIGHT : "rgba(0,0,0,0.08)"}`, background: v.status === "excluded" ? "rgba(0,0,0,0.02)" : "white", opacity: v.status === "excluded" ? 0.75 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "999px", color: st.color, background: st.bg }}>{st.label}</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{v.name}</span>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: MIDNIGHT }}>{v.monthlyCostLabel}</div>
              {ch && <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.55)", marginTop: "2px" }}>{ch.method} · {ko ? "계약 소요" : "Lead time"}: {ch.contractLeadTime}</div>}
              {v.reasons.length > 0 && <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", marginTop: "6px" }}>{v.reasons.join(" · ")}</div>}
              {v.warnings.map((w) => (
                <div key={w} style={{ display: "flex", gap: "6px", alignItems: "flex-start", marginTop: "6px", fontSize: "12px", color: WARN }}>
                  <AlertTriangle size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{w}</span>
                </div>
              ))}
              {v.status === "recommended" && ch && ch.documents.length > 0 && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>
                  <b>{ko ? "계약 서류(개인사업자)" : "Documents"}:</b> {ch.documents.join(" · ")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rec.globalWarnings.length > 0 && (
        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(182,76,76,0.05)", border: "1px solid rgba(182,76,76,0.18)" }}>
          {rec.globalWarnings.map((w) => (
            <div key={w} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "12.5px", color: DANGER, fontWeight: 600, lineHeight: 1.5 }}>
              <AlertTriangle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {rec.consoleSteps.length > 0 && (
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(15,23,42,0.6)", marginBottom: "6px" }}>{ko ? "포트원 콘솔에서 — 본인인증만 신청하는 클릭 경로" : "PortOne console — identity-only path"}</div>
          <ol style={{ margin: 0, paddingLeft: "18px", display: "grid", gap: "5px" }}>
            {rec.consoleSteps.map((s) => (
              <li key={s} style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.75)", lineHeight: 1.55 }}>{s.replaceAll("**", "")}</li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}

const ITEM_STYLE: Record<PrecheckItem["status"], { color: string; icon: ReactNode; label: string }> = {
  pass: { color: OK, icon: <Check size={13} strokeWidth={3} />, label: "통과" },
  fail: { color: DANGER, icon: <X size={13} strokeWidth={3} />, label: "미달" },
  warn: { color: WARN, icon: <AlertTriangle size={13} strokeWidth={2.5} />, label: "주의" },
  info: { color: "rgba(15,23,42,0.45)", icon: <ChevronRight size={13} strokeWidth={2.5} />, label: "참고" },
};

/** PG 심사 프리체크(웹) — 서버 검사 호출. */
export function PgPrecheckWidget({ config, ko }: { config?: Record<string, unknown>; ko: boolean }) {
  const c = (config ?? {}) as WidgetConfig;
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<PgPrecheckResult | null>(null);

  const run = async () => {
    if (!url.trim()) return;
    setStatus("loading");
    setError("");
    try {
      const session = await supabase.auth.getSession();
      const tk = session.data.session?.access_token;
      const res = await fetch("/api/compliance/pg-precheck", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(tk ? { Authorization: `Bearer ${tk}` } : {}) },
        body: JSON.stringify({ url: url.trim() }),
      });
      const body = (await res.json()) as { ok: boolean; error?: string; result?: PgPrecheckResult };
      if (!body.ok || !body.result) {
        setError(body.error ?? "검사에 실패했습니다.");
        setStatus("error");
        return;
      }
      setResult(body.result);
      setStatus("done");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  };

  return (
    <Card title={c.title} note={c.note} icon={<Search size={16} strokeWidth={2.2} color={MIDNIGHT} />}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input
          type="url"
          placeholder="https://your-service.app"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void run(); }}
          style={{ flex: 1, minWidth: "220px", fontSize: "14px", padding: "9px 12px", borderRadius: "10px", border: `1px solid ${MIDNIGHT_BORDER}` }}
        />
        <button type="button" onClick={() => void run()} disabled={status === "loading" || !url.trim()} style={{ fontSize: "13px", fontWeight: 700, color: "white", background: MIDNIGHT, border: "none", borderRadius: "10px", padding: "9px 16px", cursor: "pointer", opacity: status === "loading" || !url.trim() ? 0.5 : 1 }}>
          {status === "loading" ? (ko ? "검사 중…" : "Checking…") : (ko ? "검사" : "Check")}
        </button>
      </div>
      {status === "error" && <div style={{ fontSize: "12.5px", color: DANGER, lineHeight: 1.5 }}>{error}</div>}
      {result && (
        <>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "white", background: result.rejectRiskCount === 0 ? OK : DANGER, padding: "4px 10px", borderRadius: "999px" }}>
              {result.rejectRiskCount === 0 ? (ko ? "반려 위험 0 — 제출 가능" : "0 reject risks") : (ko ? `반려 위험 ${result.rejectRiskCount}건` : `${result.rejectRiskCount} reject risks`)}
            </span>
            {result.warnCount > 0 && <span style={{ fontSize: "12px", fontWeight: 700, color: WARN }}>{ko ? `주의 ${result.warnCount}건` : `${result.warnCount} warnings`}</span>}
            {result.spaSuspect && <span style={{ fontSize: "12px", fontWeight: 700, color: WARN }}>{ko ? "본문 텍스트가 거의 없음 — 클라이언트 렌더(SPA) 사이트면 미검출일 수 있습니다" : "Very little text — SPA?"}</span>}
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {result.items.map((it) => {
              const st = ITEM_STYLE[it.status];
              const bad = it.status === "fail" || it.status === "warn";
              return (
                <div key={it.id} style={{ padding: "10px 12px", borderRadius: "10px", border: `1px solid ${bad ? `${st.color}40` : "rgba(0,0,0,0.06)"}`, background: bad ? `${st.color}0d` : "white" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: st.color, display: "flex" }}>{st.icon}</span>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", flex: 1 }}>{it.label}</span>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: st.color }}>{st.label}</span>
                  </div>
                  {it.evidence && it.status === "pass" && <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.5)", marginTop: "3px", marginLeft: "21px" }}>{ko ? "근거" : "Evidence"}: {it.evidence}</div>}
                  {bad && (
                    <div style={{ marginLeft: "21px", marginTop: "4px", fontSize: "12px", lineHeight: 1.55 }}>
                      <div style={{ color: st.color, fontWeight: 600 }}>{ko ? "심사 결과로 돌아오는 문구" : "Rejected as"}: {it.rejectAs}</div>
                      <div style={{ color: "rgba(15,23,42,0.7)" }}>{ko ? "고치기" : "Fix"}: {it.fix}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55, padding: "10px 12px", borderRadius: "10px", background: MIDNIGHT_SOFT }}>{result.appOnlyNote}</div>
        </>
      )}
    </Card>
  );
}

/** 서류 요청 메일 해석기(웹). */
export function DocRequestDecoderWidget({ config, ko }: { config?: Record<string, unknown>; ko: boolean }) {
  const c = (config ?? {}) as WidgetConfig;
  const [text, setText] = useState("");
  const decoded = useMemo(() => (text.trim() ? decodeDocumentRequest(text) : null), [text]);

  return (
    <Card title={c.title} note={c.note} icon={<ChevronRight size={16} strokeWidth={2.2} color={MIDNIGHT} />}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={ko ? "예) 계약서 원본 2부, 사업자등록증 사본, 인감증명서(전자계약 시 생략), 대표자 신분증 사본(마스킹 없이), 고객정보 및 실제소유자 확인서…" : "Paste the document request email"}
        rows={4}
        style={{ width: "100%", fontSize: "13px", lineHeight: 1.55, padding: "10px 12px", borderRadius: "10px", border: `1px solid ${MIDNIGHT_BORDER}`, resize: "vertical", fontFamily: "inherit" }}
      />
      {decoded && decoded.matches.length === 0 && <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.55)" }}>{ko ? "사전에 있는 서류 용어를 찾지 못했습니다 — 용어 사전을 확인하거나 문구를 알려주세요." : "No known terms found."}</div>}
      {decoded && decoded.matches.length > 0 && (
        <>
          <div style={{ display: "grid", gap: "8px" }}>
            {decoded.matches.map((m) => (
              <div key={m.term.id} style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: MIDNIGHT }}>{m.term.term} <span style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", fontWeight: 600 }}>({ko ? "메일 표기" : "as written"}: {m.hits.join(", ")})</span></div>
                <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.55, marginTop: "3px" }}>{m.term.meaning}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: MIDNIGHT, background: MIDNIGHT_SOFT, padding: "3px 8px", borderRadius: "6px" }}>{ko ? "어디서" : "Where"} · {m.term.where}</span>
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: "rgba(15,23,42,0.7)", background: "rgba(0,0,0,0.05)", padding: "3px 8px", borderRadius: "6px" }}>{ko ? "형식" : "Format"} · {m.term.format}</span>
                </div>
              </div>
            ))}
          </div>
          {decoded.eContractHint && <div style={{ fontSize: "12.5px", color: WARN, fontWeight: 600, lineHeight: 1.5 }}>{decoded.eContractHint}</div>}
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(15,23,42,0.6)", marginBottom: "6px" }}>{ko ? "자동 생성 준비 체크리스트" : "Checklist"}</div>
            <ul style={{ margin: 0, paddingLeft: "18px", display: "grid", gap: "4px" }}>
              {decoded.checklist.map((line) => <li key={line} style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.75)", lineHeight: 1.5 }}>{line}</li>)}
            </ul>
          </div>
        </>
      )}
    </Card>
  );
}

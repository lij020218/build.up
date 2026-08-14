// 임시 진단 라우트 (2026-08-14 펀딩 400 사고) — 프로드 람다에서 K-Startup 게이트웨이 응답을
// 파라미터 조합별로 직접 관찰한다. 원인 확정 후 제거 예정. CRON_SECRET 필수.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = "https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const key = process.env.KSTARTUP_API_KEY ?? "";
  const egress = await fetch("https://api.ipify.org?format=json", { cache: "no-store" })
    .then((r) => r.json())
    .catch(() => null);

  const cases: Record<string, string> = {
    minimal: `${BASE}?serviceKey=${key}&returnType=json&page=1&perPage=3`,
    encoded: `${BASE}?${new URLSearchParams({ serviceKey: key, returnType: "json", page: "1", perPage: "3" })}`,
    full: `${BASE}?${(() => { const s = new URLSearchParams({ serviceKey: key, returnType: "json", page: "1", perPage: "500" }); s.set("Rcrt_prgs_yn", "Y"); return s; })()}`,
  };
  const results: Record<string, unknown> = {};
  for (const [name, url] of Object.entries(cases)) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      const body = await r.text();
      results[name] = { status: r.status, body: body.slice(0, 200).replace(/\s+/g, " ") };
    } catch (e) {
      results[name] = { error: e instanceof Error ? e.message : String(e) };
    }
  }
  return NextResponse.json({
    egressIp: egress,
    keyLen: key.length,
    keyHead: key.slice(0, 4),
    keyTail: key.slice(-4),
    results,
  });
}

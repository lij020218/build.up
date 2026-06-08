/**
 * GET /api/integrations/csv/list — 사장님이 업로드한 CSV 이력 + 일별 합계
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  const { data: uploads } = await supabase
    .from("csv_revenue_uploads")
    .select("id, filename, source_label, row_count, total_amount, uploaded_at")
    .eq("user_id", auth.userId)
    .order("uploaded_at", { ascending: false })
    .limit(20);

  const url = new URL(request.url);
  const fromDays = Number(url.searchParams.get("fromDays") ?? "30");
  const safeDays = Number.isFinite(fromDays) && fromDays > 0 && fromDays <= 365 ? fromDays : 30;
  const from = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // upload 의 uploaded_at 을 함께 가져온다(최신 업로드 우선 판정용).
  const { data: entries } = await supabase
    .from("csv_revenue_entries")
    .select("date, amount, customer_count, upload_id, csv_revenue_uploads(uploaded_at)")
    .eq("user_id", auth.userId)
    .gte("date", from)
    .order("date", { ascending: true });

  type EntryRow = {
    date: string; amount: number | string; customer_count: number | string | null;
    upload_id: string; csv_revenue_uploads: { uploaded_at: string } | { uploaded_at: string }[] | null;
  };

  // 날짜별 *단일 출처* — 같은 날짜가 여러 파일에 있으면 합산하지 않고 **가장 최근 업로드**만 채택.
  //   (POS 전체매출 + 카드 부분매출을 합산하던 이중계상 버그 방지. 사용자 선택: 최신 우선.)
  //   겹친 날짜는 overlapDates 로 표시해 "최신 파일 기준" 임을 알린다(과소계상 가시화).
  type Daily = { date: string; sales: number; customers: number; source: "csv"; _uploadedAt: string; _uploads: Set<string> };
  const dailyMap = new Map<string, Daily>();
  const overlap = new Set<string>();

  for (const raw of (entries ?? []) as EntryRow[]) {
    const up = Array.isArray(raw.csv_revenue_uploads) ? raw.csv_revenue_uploads[0] : raw.csv_revenue_uploads;
    const uploadedAt = up?.uploaded_at ?? "";
    const cur = dailyMap.get(raw.date);
    if (!cur) {
      dailyMap.set(raw.date, {
        date: raw.date, sales: Number(raw.amount), customers: Number(raw.customer_count ?? 0),
        source: "csv", _uploadedAt: uploadedAt, _uploads: new Set([raw.upload_id]),
      });
      continue;
    }
    cur._uploads.add(raw.upload_id);
    if (cur._uploads.size > 1) overlap.add(raw.date);
    // 더 최근 업로드의 값으로 교체(합산 금지).
    if (uploadedAt > cur._uploadedAt) {
      cur.sales = Number(raw.amount);
      cur.customers = Number(raw.customer_count ?? 0);
      cur._uploadedAt = uploadedAt;
    }
  }

  const dailyEntries = Array.from(dailyMap.values()).map(({ _uploadedAt, _uploads, ...rest }) => rest);

  return NextResponse.json({
    ok: true,
    uploads: uploads ?? [],
    dailyEntries,
    // 여러 파일에 걸친 날짜 — UI 가 "최신 업로드 기준 표시" 경고에 사용.
    overlapDates: Array.from(overlap).sort(),
  });
}

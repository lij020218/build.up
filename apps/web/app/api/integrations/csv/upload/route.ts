/**
 * POST /api/integrations/csv/upload
 *
 * 사장님이 CSV 파일 업로드 → 매출 자동 import.
 * Body: multipart/form-data { file, sourceLabel? }
 *
 * 지원 컬럼 (자동 감지, 한글/영문 모두):
 *   날짜·일자·date  | 매출·금액·amount·sales | 고객수·customers·count
 *
 * 결과: csv_revenue_uploads + csv_revenue_entries 에 저장.
 *       대시보드 매출 흐름 카드에 자동 반영.
 */
import { NextResponse } from "next/server";
import { requireApiUser } from "../../../_lib/auth";
import { checkSimpleRateLimit } from "../../../_lib/rate-limit";
import { getSupabaseAdmin } from "../../../_lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_ROWS = 10_000;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const PARSE_TIMEOUT_MS = 10_000;   // 2026-05-27 보안: pathological CSV → Lambda hang 방지

// CSV cell formula prefix — 재출력 시 Excel/Sheets 가 수식으로 실행. RFC: OWASP CSV Injection.
const FORMULA_PREFIX_PATTERN = /^[=+@\-\t\r]/;
function sanitizeCsvCell(value: string): string {
  // 수식 시작 문자가 있으면 작은따옴표로 escape (Excel 표준 수식 비활성화)
  return FORMULA_PREFIX_PATTERN.test(value) ? `'${value}` : value;
}

/** Promise + setTimeout 으로 외부 작업 timeout 구현 (file.text() 는 AbortSignal 미지원). */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
    promise.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
  });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  const rl = await checkSimpleRateLimit({ key: `csv-upload:${auth.userId}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: rl.error }, { status: rl.status });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 form 데이터" }, { status: 400 });
  }

  const file = formData.get("file");
  const sourceLabel = (formData.get("sourceLabel") as string | null) ?? null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "파일을 선택해 주세요." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "파일이 너무 큽니다 (최대 5MB)." }, { status: 400 });
  }

  // 2026-05-27 보안 (P0-3): file.text() + parseCsv 양쪽에 10초 timeout. 악성 CSV 로 Lambda hang 방지.
  let text: string;
  try {
    text = await withTimeout(file.text(), PARSE_TIMEOUT_MS, "file.text()");
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `파일 읽기 실패: ${(e as Error).message}` },
      { status: 408 }
    );
  }

  // 빠른 사전 가드 — 줄 수 한도 초과면 파싱 시도조차 안 함 (regex/split 폭주 방지)
  const lineCountApprox = (text.match(/\n/g) ?? []).length;
  if (lineCountApprox > MAX_ROWS + 100) { // +100 = 헤더/공백 줄 여유
    return NextResponse.json(
      { ok: false, error: `행 수 한도 초과 (대략 ${lineCountApprox}줄, 최대 ${MAX_ROWS})` },
      { status: 400 }
    );
  }

  let parsed: ReturnType<typeof parseCsv>;
  try {
    // parseCsv 자체는 동기지만 안전 망 — 매우 큰 파일 처리 중 V8 GC 폭주 등 케이스
    parsed = await withTimeout(Promise.resolve().then(() => parseCsv(text)), PARSE_TIMEOUT_MS, "parseCsv()");
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `CSV 분석 실패: ${(e as Error).message}` },
      { status: 408 }
    );
  }
  if (parsed.entries.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error ?? "유효한 행을 찾지 못했습니다. 첫 줄에 '날짜, 매출' 같은 헤더가 있어야 합니다.",
        detectedHeaders: parsed.headers,
      },
      { status: 400 }
    );
  }
  if (parsed.entries.length > MAX_ROWS) {
    return NextResponse.json({ ok: false, error: `행 수 한도 초과 (최대 ${MAX_ROWS})` }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "DB 설정 오류" }, { status: 500 });

  // 1. 업로드 레코드 — 멱등: 같은 *파일명* 재업로드면 기존 row 재사용(내용이 바뀌어도).
  //    ⚠️ 과거: dedup 키가 (파일명·행수·총액)이라, 같은 파일을 *수정* 재업로드하면 행수/총액이
  //    달라져 새 upload 가 생기고, csv/list 가 날짜별로 여러 upload 를 합산해 이중계상됐음.
  //    → 파일명 1개당 upload 1개로 고정하고, 재업로드 시 기존 entries 를 비운 뒤 새로 넣어 깨끗이 교체.
  const totalAmount = parsed.entries.reduce((s, e) => s + e.amount, 0);
  let uploadId: string | null = null;

  const { data: existingUpload } = await supabase
    .from("csv_revenue_uploads")
    .select("id")
    .eq("user_id", auth.userId)
    .eq("filename", file.name)
    .maybeSingle();

  if (existingUpload) {
    uploadId = existingUpload.id;
    await supabase
      .from("csv_revenue_uploads")
      .update({ source_label: sourceLabel, row_count: parsed.entries.length, total_amount: totalAmount })
      .eq("id", existingUpload.id);
    // 기존 entries 전부 제거 후 새로 삽입 — 수정 재업로드 시 옛 날짜/금액이 남아 합산되는 것 방지.
    const { error: clearErr } = await supabase
      .from("csv_revenue_entries")
      .delete()
      .eq("user_id", auth.userId)
      .eq("upload_id", uploadId);
    if (clearErr) {
      console.error("[csv/upload] clear old entries failed", clearErr);
      return NextResponse.json({ ok: false, error: "엔트리 교체 실패" }, { status: 500 });
    }
  } else {
    const { data: upload, error: upErr } = await supabase
      .from("csv_revenue_uploads")
      .insert({
        user_id: auth.userId,
        filename: file.name,
        source_label: sourceLabel,
        row_count: parsed.entries.length,
        total_amount: totalAmount,
      })
      .select("id")
      .single();

    if (upErr || !upload) {
      console.error("[csv/upload] insert upload failed", upErr);
      return NextResponse.json({ ok: false, error: "업로드 기록 저장 실패" }, { status: 500 });
    }
    uploadId = upload.id;
  }

  // 2. 엔트리들 — 같은 날짜 여러 행(거래단위 CSV)을 날짜로 사전 합산.
  //    ⚠️ csv_revenue_entries 는 unique(user_id,upload_id,date) 라, 한 배치에 같은 날짜가 2건↑이면
  //    upsert 가 21000 (ON CONFLICT ... cannot affect row a second time) 로 *전체* 실패한다.
  //    POS·카드단말기·은행 export 는 대부분 "거래 1건=1행" → 날짜 중복이 흔하므로 반드시 합산.
  //    (csv/list 도 날짜 합산하므로 업로드 단계와 정책 일치.)
  const byDate = new Map<string, { amount: number; customers: number; description: string | null; raw: Record<string, string> | null }>();
  for (const e of parsed.entries) {
    const cur = byDate.get(e.date);
    if (cur) {
      cur.amount += e.amount;
      cur.customers += e.customers ?? 0;
    } else {
      byDate.set(e.date, { amount: e.amount, customers: e.customers ?? 0, description: e.description ?? null, raw: e.raw ?? null });
    }
  }
  const rows = [...byDate.entries()].map(([date, v]) => ({
    upload_id: uploadId,
    user_id: auth.userId,
    date,
    amount: v.amount,
    customer_count: v.customers,
    description: v.description,
    raw: v.raw,
  }));
  const { error: entryErr } = await supabase.from("csv_revenue_entries").upsert(rows, {
    onConflict: "user_id,upload_id,date",
  });
  if (entryErr) {
    console.error("[csv/upload] entries upsert failed", entryErr);
    return NextResponse.json({ ok: false, error: "엔트리 저장 실패" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    uploadId,
    rowCount: parsed.entries.length,
    totalAmount,
    detectedHeaders: parsed.headers,
    sample: parsed.entries.slice(0, 3),
  });
}

// ─── 간단한 CSV 파서 (의존성 없음) ────────────────────────────────────

type ParsedEntry = {
  date: string; // YYYY-MM-DD
  amount: number;
  customers?: number;
  description?: string;
  raw?: Record<string, string>;
};

function parseCsv(text: string): { entries: ParsedEntry[]; headers: string[]; error?: string } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { entries: [], headers: [], error: "데이터 행이 없습니다." };

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));

  // 컬럼 매핑 자동 감지
  const dateCol = findColumn(headers, ["date", "날짜", "일자", "거래일", "결제일"]);
  const amountCol = findColumn(headers, ["amount", "매출", "금액", "가격", "sales", "revenue", "결제금액", "총매출"]);
  const customersCol = findColumn(headers, ["customers", "고객수", "주문수", "건수", "count"]);
  const descCol = findColumn(headers, ["description", "설명", "메모", "비고", "내역"]);

  if (dateCol === -1) return { entries: [], headers, error: "날짜 컬럼을 찾을 수 없습니다 (예상 헤더: 날짜·일자·date)" };
  if (amountCol === -1) return { entries: [], headers, error: "매출 컬럼을 찾을 수 없습니다 (예상 헤더: 매출·금액·amount)" };

  const entries: ParsedEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], delimiter).map((c) => c.trim().replace(/^"|"$/g, ""));
    const dateRaw = cols[dateCol] ?? "";
    const amountRaw = cols[amountCol] ?? "";
    const date = normalizeDate(dateRaw);
    const amount = parseAmount(amountRaw);
    if (!date || !Number.isFinite(amount)) continue;
    // 2026-05-27 보안 (P2-1): raw 저장 시 수식 prefix 무력화 (재출력 시 Excel 자동실행 방지)
    const raw = Object.fromEntries(headers.map((h, idx) => [h, sanitizeCsvCell(cols[idx] ?? "")]));
    entries.push({
      date,
      amount: Math.round(amount),
      customers: customersCol >= 0 ? parseInt(cols[customersCol] ?? "0", 10) || 0 : 0,
      description: descCol >= 0 ? sanitizeCsvCell(cols[descCol]) : undefined,
      raw,
    });
  }

  return { entries, headers };
}

function detectDelimiter(line: string): string {
  const candidates = [",", "\t", ";", "|"];
  let best = ",";
  let bestCount = 0;
  for (const c of candidates) {
    const count = line.split(c).length - 1;
    if (count > bestCount) { best = c; bestCount = count; }
  }
  return best;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  // 쌍따옴표 안의 delimiter 보호
  const result: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; continue; }
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === delimiter && !inQuote) { result.push(current); current = ""; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

function findColumn(headers: string[], candidates: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase().replace(/\s+/g, "");
    for (const c of candidates) {
      if (h.includes(c.toLowerCase())) return i;
    }
  }
  return -1;
}

function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim();
  // 2026-04-25, 2026/04/25, 20260425, 2026.04.25
  const m1 = trimmed.match(/^(\d{4})[-/.]?(\d{1,2})[-/.]?(\d{1,2})/);
  if (m1) {
    const y = m1[1];
    const mo = m1[2].padStart(2, "0");
    const d = m1[3].padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }
  // 04/25/2026 (US)
  const m2 = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) return `${m2[3]}-${m2[1].padStart(2, "0")}-${m2[2].padStart(2, "0")}`;
  return null;
}

function parseAmount(raw: string): number {
  // "1,234,567원", "1.234.567", "₩123,000", "10,000.50"
  const cleaned = raw.replace(/[^\d.-]/g, "").replace(/(?<=\d),/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

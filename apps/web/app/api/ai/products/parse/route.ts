import { createAiClient } from "@foundone/ai/utils/client";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireApiUser } from "../../../_lib/auth";
import { getAnthropicApiKey } from "../../../_lib/env";
import { checkSimpleRateLimit, checkDailyRateLimit } from "../../../_lib/rate-limit";

type ParsedProduct = {
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
};

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel function timeout

/** Excel 셀 값을 안전하게 문자열로. (formula/richText/hyperlink/date/error 모두 처리) */
function cellToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("text" in o && typeof o.text === "string") return o.text;            // hyperlink
    if ("result" in o && o.result != null) return String(o.result);          // formula → 계산값
    if (Array.isArray(o.richText)) return o.richText.map((r) => (r as { text?: string }).text ?? "").join(""); // richText
    if ("error" in o) return "";                                             // #DIV/0! 등
  }
  return "";
}

/** xlsx/xls 바이너리 → CSV 텍스트(첫 시트). exceljs 사용 (npm xlsx 는 prototype-pollution 취약 → 미사용).
 *  헤더-키 객체를 만들지 않고 셀 값을 직접 CSV 로 직렬화 → prototype pollution 위험 없음. */
async function xlsxToCsv(data: ArrayBuffer): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  const sheet = workbook.worksheets[0];
  if (!sheet) return "";
  const lines: string[] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    // row.values 는 1-based 배열(인덱스 0 = null). 빈 칸 보존 위해 길이만큼 순회.
    const raw = row.values as unknown[];
    const cells: string[] = [];
    for (let i = 1; i < raw.length; i++) {
      const s = cellToString(raw[i]).replace(/\r?\n/g, " ").trim();
      // CSV escaping — 쉼표/따옴표 포함 시 큰따옴표로 감싸기.
      cells.push(/[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    }
    if (cells.some((c) => c.length > 0)) lines.push(cells.join(","));
  });
  return lines.join("\n");
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request).catch(() => null);
  if (!auth || !auth.ok) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const rl = await checkSimpleRateLimit({
    key: `ai-products-parse:${auth.userId}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  // 2026-05-27 보안: 일일 한도로 LLM 비용 폭탄 차단 (분당 한도만으로는 24h 지속 호출 가능)
  const dailyLimit = await checkDailyRateLimit({
    userId: auth.userId,
    feature: "products-parse",
    // 파일 파싱은 출력 8192 로 호출당 비용이 커, 하루 30번 할 일은 드묾 (2026-07: 30→10 하향).
    limit: 10,
    message: "오늘 사용량을 초과했습니다. 내일 다시 시도해 주세요.",
  });
  if (!dailyLimit.ok) {
    return NextResponse.json({ error: dailyLimit.error }, { status: dailyLimit.status });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    console.error("[products/parse] ANTHROPIC_API_KEY not found");
    return NextResponse.json({ error: "AI 서비스를 일시적으로 사용할 수 없습니다. 서버를 재시작하거나 관리자에게 문의하세요." }, { status: 503 });
  }

  let body: { text?: string; fileBase64?: string; fileName?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ko = body.language === "ko";

  // xlsx/xls 파일은 서버에서 CSV 로 변환(클라이언트는 파일 base64 만 보냄 — iOS 는 네이티브 파싱 불가).
  let text = body.text?.trim() ?? "";
  const fileNameLower = (body.fileName ?? "").toLowerCase();
  const isXlsx = fileNameLower.endsWith(".xlsx") || fileNameLower.endsWith(".xls");
  if (body.fileBase64 && isXlsx) {
    if (body.fileBase64.length > 8_000_000) { // base64 ≈ 6MB raw 상한
      return NextResponse.json({ error: ko ? "파일이 너무 큽니다 (최대 6MB)." : "File too large (max 6MB)." }, { status: 413 });
    }
    try {
      const nodeBuf = Buffer.from(body.fileBase64, "base64");
      const ab = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.byteLength) as ArrayBuffer;
      text = (await xlsxToCsv(ab)).trim();
    } catch (e) {
      console.error("[products/parse] xlsx parse error:", e instanceof Error ? e.message : e);
      return NextResponse.json({ error: ko ? "엑셀 파일을 읽을 수 없습니다. 파일이 손상되지 않았는지 확인해 주세요." : "Could not read the Excel file." }, { status: 400 });
    }
  }

  if (!text || text.length < 5) {
    return NextResponse.json({ error: ko ? "데이터를 찾을 수 없습니다." : "No data provided" }, { status: 400 });
  }
  // 텍스트 직접 입력은 50KB 초과 거부, xlsx 변환분은 안전하게 컷.
  if (!body.fileBase64 && text.length > 50_000) {
    return NextResponse.json({ error: "Data too large (max 50KB)" }, { status: 400 });
  }
  text = text.slice(0, 50_000);

  // 사용자 입력을 로그에 노출하지 않음 (보안)

  try {
    const client = createAiClient(apiKey);
    const response = await client.messages.create({
      model: "gpt-5.6-luna", // 2026-07-27 luna — 파싱 전용(CSV·엑셀 임포트 포함)
      max_tokens: 8192,
      system: ko
        ? `엑셀/CSV/텍스트에서 추출한 제품 데이터를 JSON 배열로 정리하는 파서입니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

[
  { "name": "제품명", "category": "카테고리", "price": 판매가(원), "cost": 원가(원), "stock": 재고수, "unit": "단위" }
]

규칙:
- 제공된 데이터에 있는 제품만 추출하세요. 절대로 데이터에 없는 제품을 만들어내지 마세요.
- 데이터를 파싱할 수 없거나 제품 정보가 없으면 빈 배열 []을 반환하세요.
- 컬럼 매핑(헤더가 있으면 헤더로, 없으면 위치·내용으로 추론):
  · name  ← 품목명 / 상품명 / 제품명 / 품명 / 메뉴 / 메뉴명 / 이름 / name / item
  · stock ← 수량 / 재고 / 재고수량 / 현재고 / 보유수량 / qty / stock
  · price ← 판매가 / 단가 / 가격 / 소비자가 / 정가 / price
  · cost  ← 원가 / 매입가 / 매입단가 / 공급가 / 사입가 / cost
  · unit  ← 단위 / 규격
  · category ← 분류 / 카테고리 / 구분 / 종류
- name(품목명)이 비어 있으면 그 행은 제외. 같은 품목이 여러 행이면 각각 별도 항목으로 유지(임의 합치기 금지).
- price, cost는 원 단위 정수. "5,000원"·"5,000" → 5000. 없으면 0. (단가/판매가 헷갈리면 더 큰 값을 price 로.)
- stock은 정수. "12개"·"12" → 12. 소수면 반올림. 없으면 0.
- unit은 "개", "잔", "인분", "팩", "켤레", "장", "박스" 등. 데이터에서 추론. 없으면 "개".
- category는 데이터에서 추론. 없으면 "기타".
- 헤더 행·소계/합계/총계 행·빈 행은 제외.
- 데이터가 카페/음식 제품이 아니어도 그대로 추출하세요 (양말, 의류, 전자제품 등 모든 종류).`
        : `Parse product data from Excel/CSV/text into a JSON array. Respond ONLY with JSON.

[
  { "name": "Product name", "category": "Category", "price": sellingPrice, "cost": costPrice, "stock": stockQty, "unit": "unit" }
]

Rules:
- ONLY extract products that exist in the provided data. NEVER fabricate products.
- If data cannot be parsed or contains no products, return empty array [].
- price/cost in integer won. stock as integer.
- unit from data context. Defaults to "개".
- Skip header/total rows. Extract ALL product types (clothing, electronics, food, etc).`,
      messages: [{ role: "user", content: `<user_input>${text}</user_input>` }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected AI response" }, { status: 502 });
    }

    let products: ParsedProduct[];
    try {
      // AI 응답 정리: 마크다운 블록 제거 + 배열 추출 + 잘린 JSON 복구
      let cleaned = content.text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();

      // [ 부터 ] 까지 추출
      const start = cleaned.indexOf("[");
      let end = cleaned.lastIndexOf("]");
      if (start !== -1) {
        if (end !== -1 && end > start) {
          cleaned = cleaned.slice(start, end + 1);
        } else {
          // ] 가 없음 = 잘린 응답 → 마지막 완전한 객체까지만 사용
          cleaned = cleaned.slice(start);
          // 마지막 완전한 } 찾기
          const lastBrace = cleaned.lastIndexOf("}");
          if (lastBrace > 0) {
            cleaned = cleaned.slice(0, lastBrace + 1) + "]";
          }
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("[products/parse] Cleaned (first 300):", cleaned.slice(0, 300));
      }
      products = JSON.parse(cleaned);
      if (!Array.isArray(products)) throw new Error("Not an array");
      products = products.filter(
        (p) => p && typeof p.name === "string" && p.name.trim().length > 0
      ).map((p) => ({
        name: String(p.name).trim(),
        category: String(p.category || "기타").trim(),
        price: Math.max(0, Math.round(Number(p.price) || 0)),
        cost: Math.max(0, Math.round(Number(p.cost) || 0)),
        stock: Math.max(0, Math.round(Number(p.stock) || 0)),
        unit: String(p.unit || "개").trim(),
      }));
    } catch (parseErr) {
      console.error("[products/parse] Parse error:", parseErr instanceof Error ? parseErr.message : parseErr);
      console.error("[products/parse] AI text length:", content.text.length);
      return NextResponse.json({ error: `AI 응답 파싱 실패: ${content.text.slice(0, 100)}` }, { status: 502 });
    }

    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[products/parse] Error:", message);
    return NextResponse.json({ error: `제품 데이터 파싱 중 오류: ${message}` }, { status: 500 });
  }
}

import { supabase } from "../../lib/supabase";

/**
 * 재고 파일 import 공용 헬퍼 — InventoryOpsCard(대시보드) + InventoryManagementCard(분석) 공유.
 *
 *  지원 형식: CSV / TSV / TXT(텍스트 직접 전송) + XLSX / XLS(파일 base64 → 서버 exceljs 변환).
 *  xlsx 는 바이너리라 클라이언트에서 텍스트로 못 읽으므로 base64 로 보내고, 서버
 *  /api/ai/products/parse 가 exceljs 로 CSV 변환 후 LLM 추출(iOS 와 동일 경로 — iOS 네이티브 xlsx 불가).
 */

export type ParsedInventoryProduct = {
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
};

/** input[type=file] accept 값 — 양쪽 카드 통일. */
export const INVENTORY_IMPORT_ACCEPT = ".csv,.tsv,.txt,.xlsx,.xls";

const MAX_FILE_BYTES = 6 * 1024 * 1024; // 6MB

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const CHUNK = 0x8000; // 큰 파일에서 String.fromCharCode 스택 초과 방지
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/**
 * 재고 파일(CSV/TSV/TXT/XLSX/XLS) → 파싱된 제품 목록.
 * 실패 시 throw (호출부에서 사용자 메시지로 표시).
 */
export async function importInventoryFromFile(
  file: File,
  language?: string,
): Promise<ParsedInventoryProduct[]> {
  const ko = language === "ko";
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(ko ? "파일이 너무 큽니다 (최대 6MB)." : "File too large (max 6MB).");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  let bodyObj: Record<string, unknown>;

  if (ext === "xlsx" || ext === "xls") {
    // 엑셀: 서버가 변환 (exceljs)
    bodyObj = { fileBase64: await fileToBase64(file), fileName: file.name, language };
  } else {
    // 텍스트: utf-8 우선, 실패 시 euc-kr (한국 CSV 다수)
    const bytes = new Uint8Array(await file.arrayBuffer());
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      text = new TextDecoder("euc-kr", { fatal: false }).decode(bytes);
    }
    if (text.includes("\0")) {
      throw new Error(
        ko
          ? "이 파일 형식은 지원하지 않습니다. CSV, TSV, TXT 또는 엑셀(.xlsx) 파일을 올려주세요."
          : "Unsupported file. Upload CSV, TSV, TXT, or Excel (.xlsx).",
      );
    }
    bodyObj = { text: text.slice(0, 50_000), language };
  }

  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

  const res = await fetch("/api/ai/products/parse", {
    method: "POST",
    headers,
    body: JSON.stringify(bodyObj),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.error) {
    throw new Error(payload.error ?? (ko ? "파싱에 실패했습니다." : "Parse failed."));
  }
  return (payload.products ?? []) as ParsedInventoryProduct[];
}

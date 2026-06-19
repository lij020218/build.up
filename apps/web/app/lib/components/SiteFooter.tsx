import Link from "next/link";
import { BUSINESS_INFO } from "../businessInfo";

/**
 * SiteFooter — 전자상거래법 §10 사업자정보 푸터 (사이버몰 초기화면 표시 의무).
 *
 * 값 SSOT = lib/businessInfo.ts. 미신고 항목(사업자등록번호·통신판매업 신고번호·주소·전화)은
 * 아직 null → "준비 중"으로 표기(가짜 번호 넣지 않음). 신고 완료 시 Vercel 환경변수만 채우면 자동 노출.
 *
 * 디자인: Apple 미니멀 — 미드나잇 톤, 작은 muted 텍스트, 상단 헤어라인. 신호등 컬러 0.
 */
export function SiteFooter() {
  const b = BUSINESS_INFO;
  const pending = "준비 중";

  // [라벨, 값] — 값 null 이면 "준비 중"
  const rows: Array<[string, string]> = [
    ["상호", b.serviceName],
    ["대표자", b.representative],
    ["사업자등록번호", b.businessRegNo ?? pending],
    ["통신판매업 신고번호", b.mailOrderRegNo ?? pending],
    ["주소", b.address ?? pending],
    ["연락처", b.phone ?? pending],
    ["이메일", b.email],
    ["호스팅 제공자", b.hostingProvider],
  ];

  return (
    <footer
      style={{
        borderTop: "1px solid rgba(25,25,112,0.08)",
        background: "linear-gradient(180deg, #ffffff 0%, #f7f8fe 100%)",
        padding: "24px 20px 32px",
        fontFamily: '"Pretendard Variable", Pretendard, -apple-system, sans-serif',
        color: "#64748b",
        fontSize: 12,
        lineHeight: 1.7,
        letterSpacing: "-0.01em",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: "#191970", marginBottom: 8 }}>
          {b.serviceName}
        </div>

        {/* 사업자정보 — 라벨:값 인라인 나열 (구분점) */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px" }}>
          {rows.map(([label, value], i) => {
            const isPending = value === pending;
            return (
              <span key={label} style={{ whiteSpace: "nowrap" }}>
                <span style={{ color: "#94a3b8" }}>{label}</span>{" "}
                <span style={{ color: isPending ? "#b64c4c" : "#475569", fontWeight: isPending ? 600 : 500 }}>
                  {value}
                </span>
                {i < rows.length - 1 && <span style={{ color: "#cbd5e1", marginLeft: 14 }} aria-hidden>·</span>}
              </span>
            );
          })}
        </div>

        {/* 법적 링크 + 카피라이트 */}
        <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 16px" }}>
          <Link href="/legal/terms" style={{ color: "#475569", fontWeight: 600, textDecoration: "none" }}>
            이용약관
          </Link>
          <Link href="/legal/privacy" style={{ color: "#475569", fontWeight: 600, textDecoration: "none" }}>
            개인정보처리방침
          </Link>
          <span style={{ color: "#94a3b8" }}>© {new Date().getFullYear()} {b.serviceName}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

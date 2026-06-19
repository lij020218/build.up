// ════════════════════════════════════════════════════════════════════════
// businessInfo.ts — 사업자정보 SSOT (전자상거래법 §10 사이버몰 표기 의무)
// ════════════════════════════════════════════════════════════════════════
//
// 전자상거래 등에서의 소비자보호에 관한 법률 §10 + 시행령: 사이버몰 운영자는
// 초기화면(통상 푸터)에 상호·대표자·주소·전화·이메일·사업자등록번호·통신판매업
// 신고번호·이용약관·호스팅제공자를 표시해야 한다.
//
// ⚠️ 일부 값은 아직 신고 전(통신판매업 신고번호 등) → null. SiteFooter 가 "준비 중"으로 표기.
//    신고 완료 시 **이 파일을 고칠 필요 없이** Vercel 환경변수만 채우면 자동 노출된다:
//      NEXT_PUBLIC_BIZ_REG_NO         사업자등록번호
//      NEXT_PUBLIC_MAIL_ORDER_NO      통신판매업 신고번호
//      NEXT_PUBLIC_BIZ_ADDRESS        영업소 주소
//      NEXT_PUBLIC_BIZ_PHONE          연락처 전화
//
// 정직성: 값이 없으면 가짜 번호를 넣지 않고 null → "준비 중" 표기. (가짜숫자 0 원칙)

export type BusinessInfo = {
  /** 서비스/상호명 */
  serviceName: string;
  /** 대표자(운영 책임자) 성명 */
  representative: string;
  /** 고객문의 이메일 */
  email: string;
  /** 호스팅 서비스 제공자 상호 (전상법 표시 의무 항목) */
  hostingProvider: string;
  /** 사업자등록번호 — 미발급/미입력 시 null */
  businessRegNo: string | null;
  /** 통신판매업 신고번호 — 미신고 시 null */
  mailOrderRegNo: string | null;
  /** 영업소 소재지 주소 — 미입력 시 null */
  address: string | null;
  /** 연락처 전화 — 미입력 시 null */
  phone: string | null;
};

function envOrNull(v: string | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

export const BUSINESS_INFO: BusinessInfo = {
  serviceName: "Found.One",
  representative: "이영준",
  email: "lki720412@gmail.com",
  hostingProvider: "Vercel Inc.",
  businessRegNo: envOrNull(process.env.NEXT_PUBLIC_BIZ_REG_NO),
  mailOrderRegNo: envOrNull(process.env.NEXT_PUBLIC_MAIL_ORDER_NO),
  address: envOrNull(process.env.NEXT_PUBLIC_BIZ_ADDRESS),
  phone: envOrNull(process.env.NEXT_PUBLIC_BIZ_PHONE),
};

/** 아직 채워지지 않은(준비 중) 필수 항목이 하나라도 있는지 — 출시 전 점검용. */
export function hasPendingBusinessInfo(info: BusinessInfo = BUSINESS_INFO): boolean {
  return !info.businessRegNo || !info.mailOrderRegNo || !info.address || !info.phone;
}

/**
 * compliance/doc-request.ts — 서류 요청 해석기(용어 SSOT + 순수 함수).
 *
 * 문제(구함 사례 2026-09): 대행사·PG 계약 메일의 "사업자등록증 사본", "인감증명서(전자계약 시 생략)",
 *   "고객정보 및 실제소유자 확인서", "신분증 마스킹 없이" 는 1인 창업자에게 외국어다. 사본이 다른 서류인 줄 알고,
 *   등록증과 등록증명을 구분 못 하고, jpg 로 되는지 물어봐야 안다.
 *
 * 파운드원이 대신 하는 것: 메일 본문을 붙여넣으면 용어를 찾아 "= 무엇 · 어디서 · 어떤 형식으로" 를 붙이고
 *   준비 체크리스트를 자동으로 만든다. 웹·iOS 동일(iOS 는 compliance-data.json 코드젠으로 같은 사전 사용).
 *
 * 출처: 다날 신청 절차(서류 목록), 캠페인어스(PG 서류·통신판매업 구매안전서비스 확인증), 홈택스 민원증명,
 *   sminfo(소상공인확인서 신규 창업 즉시 발급), 구함 문서(마스킹·사본 혼동).
 */

export type DocTerm = {
  id: string;
  term: string;
  /** 메일에 등장하는 표기들(소문자 비교). */
  aliases: string[];
  meaning: string;
  where: string;
  format: string;
  /** 준비 체크리스트 문구. */
  checklist: string;
};

export const DOC_TERMS: readonly DocTerm[] = [
  {
    id: "copy",
    term: "사본",
    aliases: ["사본", "복사본", "스캔본"],
    meaning: "원본을 복사·스캔한 것. 별도 서류가 아닙니다. '사업자등록증 사본' = 사업자등록증을 촬영·스캔한 파일.",
    where: "내가 가진 원본을 복사",
    format: "PDF 또는 이미지. jpg 허용 여부는 제출처마다 달라 미확인 — 제출 전 확인",
    checklist: "요청된 서류의 사본(스캔/촬영 파일) 준비",
  },
  {
    id: "original",
    term: "원본",
    aliases: ["원본"],
    meaning: "서명·날인이 된 실물 문서. '계약서 원본 2부' = 같은 계약서 2부를 작성해 양쪽이 1부씩 보관.",
    where: "직접 작성·날인 후 우편 (전자계약 선택 시 실물 불필요)",
    format: "실물",
    checklist: "원본 요구 서류는 전자계약으로 대체 가능한지 먼저 확인",
  },
  {
    id: "biz-cert",
    term: "사업자등록증",
    aliases: ["사업자등록증"],
    meaning: "사업자등록 때 발급되는 증서. '사업자등록증명'(증명원)과 다른 서류입니다.",
    where: "홈택스 → 사업자등록 → 발급/재발급",
    format: "PDF·이미지 사본",
    checklist: "사업자등록증 사본(사업자번호·상호·대표자가 계약 신청서와 완전히 일치하는지 확인)",
  },
  {
    id: "biz-cert-proof",
    term: "사업자등록증명",
    aliases: ["사업자등록증명", "등록증명원", "사업자등록증명원", "증명원"],
    meaning: "현재 등록 상태를 확인하는 국세청 민원증명. 금융기관·관공서 제출용. 글자 끝(증/증명)으로 구분.",
    where: "홈택스 → 민원증명 → 사업자등록증명 (무인발급기·세무서도 가능)",
    format: "PDF 즉시 발급",
    checklist: "사업자등록증명(민원증명) 발급 — 요청이 '증명'인지 '증'인지 재확인",
  },
  {
    id: "seal-cert",
    term: "인감증명서",
    aliases: ["인감증명서", "인감 증명서", "법인인감증명서", "인감증명"],
    meaning: "등록된 인감(도장)이 본인 것임을 증명하는 서류. 다날은 전자계약을 선택하면 제외.",
    where: "개인: 주민센터 / 법인: 인터넷등기소·등기소 — 최근 3개월 이내",
    format: "실물 원본(요청 시) 또는 사본",
    checklist: "전자계약이면 생략 가능 여부 확인 → 필요 시 최근 3개월 이내 발급",
  },
  {
    id: "id-copy",
    term: "대표자 신분증 사본",
    aliases: ["신분증", "신분증 사본", "주민등록증", "운전면허증"],
    meaning: "대표자 본인 확인용. 앞·뒤 모두. '마스킹 없이' 요구되면 주민번호 뒷자리를 가리지 않은 사본.",
    where: "본인 신분증 촬영·스캔",
    format: "앞·뒤 이미지. 마스킹 여부는 요청 문구 그대로(다날 개인사업자: 마스킹 없이 — 구함 확인 / 다날 FAQ: 뒷자리 마스킹 — 충돌, 담당자에게 확인)",
    checklist: "신분증 앞·뒤 사본 — 마스킹 여부를 요청 문구대로",
  },
  {
    id: "masking",
    term: "마스킹",
    aliases: ["마스킹", "가림"],
    meaning: "주민번호 뒷자리 등 일부를 가리는 것. '마스킹 없이'면 가리지 말라는 뜻, '마스킹 후'면 가리라는 뜻.",
    where: "—",
    format: "요청 문구 그대로 따를 것",
    checklist: "마스킹 지시(있음/없음) 확인",
  },
  {
    id: "owner-form",
    term: "고객정보 및 실제소유자 확인서",
    aliases: ["실제소유자", "실제 소유자", "고객정보 확인서", "고객확인"],
    meaning: "계약 상대(대행사)가 특정금융정보법상 실제 소유자를 확인하려고 받는 양식. 다날 개인사업자 서류에 포함.",
    where: "대행사(다날)가 양식 제공 — 담당자 메일 첨부",
    format: "양식 작성 후 서명",
    checklist: "대행사 양식 수령 → 대표자 정보 기입·서명",
  },
  {
    id: "bank-copy",
    term: "통장 사본",
    aliases: ["통장 사본", "통장사본", "계좌 사본", "입금 통장"],
    meaning: "정산·입금 계좌 확인용. 통장 첫 장 또는 은행 앱의 계좌 확인서.",
    where: "은행 앱 → 계좌 확인서(통장 사본) 발급",
    format: "PDF·이미지",
    checklist: "사업용 계좌의 통장 사본(예금주 = 상호 또는 대표자)",
  },
  {
    id: "surety-bond",
    term: "보증보험",
    aliases: ["보증보험", "이행보증", "서울보증"],
    meaning: "거래 사고 대비 보험. 다날 절차에 가입 단계(1년, 만료 시 재가입)가 있으며 본인확인 서비스 소개 절차에도 포함. 보험료는 미확인.",
    where: "대행사 안내에 따라 보증보험사 가입",
    format: "가입 후 증권",
    checklist: "보증보험 필요 여부·보험료를 담당자에게 확인(본인인증 단독 계약 포함)",
  },
  {
    id: "e-contract",
    term: "전자계약",
    aliases: ["전자계약", "전자 계약"],
    meaning: "우편 없이 휴대폰 인증으로 진행하는 계약. 다날: 전자계약 선택 시 인감증명서 제외.",
    where: "대행사가 보내는 전자계약 링크",
    format: "온라인 서명",
    checklist: "전자계약 선택 → 인감증명서·원본 우편 생략",
  },
  {
    id: "special-terms",
    term: "통합계약서 · 특약서",
    aliases: ["특약서", "통합계약서", "특약"],
    meaning: "다날 본인확인은 통합계약서 + 특약서 세트. '계약서 원본 2부'가 이 둘을 뜻함.",
    where: "대행사 제공",
    format: "원본 2부 또는 전자계약",
    checklist: "통합계약서 + 특약서 서명(원본 2부 또는 전자계약)",
  },
  {
    id: "small-biz-cert",
    term: "소상공인확인서",
    aliases: ["소상공인확인서", "소상공인 확인서", "1인창조기업 확인"],
    meaning: "위치정보법 소상공인 특례 신고에 첨부. 신규 창업(전년·당년 설립)은 서류 없이 신청서만으로 즉시 발급.",
    where: "중소기업현황정보시스템(sminfo.mss.go.kr) → 소상공인확인서 발급",
    format: "PDF 즉시 발급",
    checklist: "sminfo 회원가입 → 신청서 작성 → 즉시 발급(신규 창업)",
  },
  {
    id: "escrow-cert",
    term: "구매안전서비스 이용확인증",
    aliases: ["구매안전서비스", "에스크로 확인증", "구매안전"],
    meaning: "통신판매업 신고 시 첨부. PG 가맹점 페이지에서 다운로드 — PG 계약이 먼저. 앱스토어·플레이 결제만이면 '비적용 확인서'.",
    where: "PG사 가맹점 관리자 페이지",
    format: "PDF",
    checklist: "PG 계약 완료 후 확인증 다운로드 → 정부24 통신판매업 신고 첨부",
  },
  {
    id: "corp-registry",
    term: "법인등기부등본(등기사항전부증명서)",
    aliases: ["등기부등본", "등기사항전부증명서", "법인등기"],
    meaning: "법인 사업자만. PG 계약 서류(법인)에 포함.",
    where: "인터넷등기소",
    format: "PDF·실물",
    checklist: "법인이면 최근 발급본 준비 (개인사업자는 해당 없음)",
  },
];

export type DocMatch = {
  term: DocTerm;
  /** 본문에서 실제로 발견된 표기. */
  hits: string[];
};

export type DocRequestDecoded = {
  matches: DocMatch[];
  /** 자동 생성 체크리스트(중복 제거). */
  checklist: string[];
  /** 메일에 '전자계약' 이 언급되면 생략 가능 항목 안내. */
  eContractHint: string | null;
};

/** 메일 본문 → 용어 매칭. 대소문자·공백 차이를 무시하고 별칭으로 찾는다. */
export function decodeDocumentRequest(text: string): DocRequestDecoded {
  const norm = text.replace(/\s+/g, " ").toLowerCase();
  const matches: DocMatch[] = [];
  for (const term of DOC_TERMS) {
    const hits = term.aliases.filter((a) => norm.includes(a.replace(/\s+/g, " ").toLowerCase()));
    if (hits.length > 0) matches.push({ term, hits });
  }
  // '사본' 은 다른 서류명과 함께 나오면 그 서류 항목이 이미 설명하므로, 단독 매칭일 때만 상단 노출되도록 뒤로 보낸다.
  matches.sort((a, b) => {
    if (a.term.id === "copy") return 1;
    if (b.term.id === "copy") return -1;
    return 0;
  });
  const checklist = [...new Set(matches.map((m) => m.term.checklist))];
  const eContract = matches.some((m) => m.term.id === "e-contract");
  return {
    matches,
    checklist,
    eContractHint: eContract ? "전자계약이 언급됐습니다 — 인감증명서·원본 우편은 생략될 수 있으니 담당자에게 확정 목록을 요청하세요." : null,
  };
}

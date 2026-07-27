/**
 * 직원 구인 채널 SSOT (2026-07-25).
 *
 * 배경: 직원관리 "구인 바로가기"가 웹 TeamSurface / iOS TeamManagementView 에
 * 각각 하드코딩돼 채용 단계(hiring-setup.ts)와 채널 목록이 어긋나 있었다
 * (직원관리엔 당근 없음, 단계엔 고용24 없음). 여기가 단일 정본.
 *
 * 사장님 피드백(2026-07-25): "요새 당근에서 알바 많이 구한다 — 방법도 올려달라"
 *  → 당근알바 채널 추가(2순위) + 구하는 법 가이드(팝업용) 신설.
 *
 * URL 정책: 공식 자사 도메인만 (프랜차이즈 URL 정책과 동일).
 * iOS 는 TeamManagementView.swift / DaangnHiringGuideSheet.swift 수동 미러 —
 * 드리프트는 hiring-channels-ios-sync.test.ts 가 CI 에서 차단.
 */

export type HiringChannel = {
  key: string;
  label: string;      // ko
  labelEn: string;
  url: string;
  /** "정부·무료" 같은 4자 내외 보조 배지 */
  badge?: { ko: string; en: string };
};

/** 직원관리 "구인 바로가기" 채널 — 순서가 곧 노출 순서. */
export const HIRING_QUICK_CHANNELS: HiringChannel[] = [
  { key: "albamon",   label: "알바몬",   labelEn: "Albamon",   url: "https://www.albamon.com" },
  // 2026-07-25 신설 — 하이퍼로컬 구인(걸어서 10분 거리 매칭). 사장님 피드백 반영 2순위.
  { key: "daangn",    label: "당근알바", labelEn: "Daangn",    url: "https://www.daangn.com/kr/jobs/", badge: { ko: "동네 기반", en: "Local" } },
  { key: "albacheon", label: "알바천국", labelEn: "Alba.co.kr", url: "https://www.alba.co.kr" },
  { key: "saramin",   label: "사람인",   labelEn: "Saramin",   url: "https://www.saramin.co.kr" },
  { key: "jobkorea",  label: "잡코리아", labelEn: "JobKorea",  url: "https://www.jobkorea.co.kr" },
  { key: "work24",    label: "고용24",   labelEn: "Work24",    url: "https://www.work24.go.kr", badge: { ko: "정부·무료", en: "Gov·Free" } },
];

/** 가이드 아이콘 키 — 웹 lucide / iOS SF Symbol 매핑은 각 렌더러가 담당. */
export type HiringGuideIcon = "write" | "applicants" | "chat" | "ads" | "law";

export type HiringGuideItem = {
  icon: HiringGuideIcon;
  title: { ko: string; en: string };
  desc: { ko: string; en: string };
};

/**
 * "당근으로 알바 구하기" 가이드 — 팝업(웹 모달 / iOS 시트) 콘텐츠.
 *
 * 전 항목 공식 출처 기반 (2026-07-25 원문 확인):
 *  · 3단계 절차 = 당근알바 공식 소개 페이지 (daangn.com/kr/jobs/about/)
 *  · 광고 선택·CPC = 당근 고객센터 FAQ 25455
 *  · 성별·연령 문구 금지 = 남녀고용평등법 (당근은 해당 타겟 광고 자체를 제공하지 않음, 동 FAQ)
 * 비용 금액은 단정하지 않는다 — CPC 단가는 지역·경쟁에 따라 변동(앱에서 확인 안내).
 */
export const DAANGN_HIRING_GUIDE = {
  channelKey: "daangn",
  title: { ko: "당근으로 알바 구하기", en: "Hire part-timers on Daangn" },
  subtitle: {
    ko: "걸어서 10분 거리 동네 주민과 매칭 — 공고부터 면접 약속까지 앱에서 끝나요.",
    en: "Match with neighbors within a 10-minute walk — post to interview, all in the app.",
  },
  url: "https://www.daangn.com/kr/jobs/",
  steps: [
    {
      icon: "write",
      title: { ko: "당근 앱에서 공고 작성", en: "Post a job in the Daangn app" },
      desc: { ko: "알바 탭 → 공고 등록. 근무 요일·시간·시급을 입력하면 우리 동네에 노출돼요.", en: "Jobs tab → create a post with days, hours, and pay." },
    },
    {
      icon: "applicants",
      title: { ko: "지원자 확인", en: "Review applicants" },
      desc: { ko: "가까이 사는 지원자가 오는 게 강점 — 출퇴근이 짧을수록 오래 다녀요.", en: "Applicants live nearby — shorter commutes keep staff longer." },
    },
    {
      icon: "chat",
      title: { ko: "채팅으로 면접 약속", en: "Set up interviews via chat" },
      desc: { ko: "전화번호 노출 없이 당근 채팅으로 바로 면접 시간을 잡아요.", en: "No phone numbers exposed — schedule directly in chat." },
    },
  ] as HiringGuideItem[],
  tips: [
    {
      icon: "ads",
      title: { ko: "광고는 선택이에요", en: "Ads are optional" },
      desc: { ko: "공고는 광고 없이 올릴 수 있어요. 더 노출하려면 클릭당 과금(CPC) 광고 — 비용은 앱에서 확인하세요.", en: "Posting works without ads. Optional CPC ads boost exposure — check pricing in-app." },
    },
    {
      icon: "law",
      // 법령 정확성 (2026-07-25 냉정리뷰 수정): 성별 차별=남녀고용평등법 §7, 연령 제한=연령차별금지법 §4의4.
      // 당근 FAQ 는 뭉뚱그려 남녀고용평등법만 언급하지만 우리는 관할 법령을 정확히 구분해 표기.
      title: { ko: "성별·연령 조건은 쓰지 마세요", en: "No gender/age requirements" },
      desc: { ko: "'20대 여성만' 같은 문구는 위법 소지 — 성별은 남녀고용평등법, 연령은 연령차별금지법이 금지해요. 당근은 성별·연령 타겟 광고 자체가 없어요.", en: "Gender/age conditions can violate equal-employment and age-discrimination laws." },
    },
  ] as HiringGuideItem[],
  sources: [
    { name: { ko: "당근알바 공식 소개", en: "Daangn Jobs intro" }, url: "https://www.daangn.com/kr/jobs/about/" },
    { name: { ko: "당근 고객센터 — 알바 광고", en: "Daangn help — job ads" }, url: "https://cs.kr.karrotmarket.com/wv/faqs/25455" },
  ],
} as const;

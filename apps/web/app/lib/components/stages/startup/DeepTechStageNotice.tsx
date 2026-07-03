"use client";

/**
 * DeepTechStageNotice — 딥테크·하드웨어 스타트업용 단계 안내 (2026-07-02 업종 정합 감사)
 *
 *  배경: MvpBuild/LaunchGtm/GoLive 세 단계는 전 스타트업 서브타입이 공유하지만
 *        본문이 SW(Next.js·Vercel·App Store·Product Hunt·Hacker News)에 전면 하드코딩돼
 *        하드웨어·딥테크 창업자에게 부적합했다. (starter-data 확인 — 딥테크도 mvp-build·launch-gtm 경유)
 *
 *  딥테크는 이미 로드맵에 전용 단계(hardware-prototype·lab-setup·mpw 등)를 갖는다.
 *  → SW 본문을 게이팅하고, 여기서 클러스터별 흐름 + 전용 단계 안내 + 공통 펀더멘털만 보여준다.
 *
 *  클러스터(clusters.ts):
 *    • tech-hardware        → hardware  (하드웨어·IoT: EVT/DVT/PVT · BOM · KC/CE/FCC · EMS)
 *    • tech-deeptech-lab    → lab       (로보틱스·바이오: 랩 · 프로토타입 반복 · 필드/임상 · 규제)
 *    • tech-extreme-deeptech→ extreme   (반도체·기후에너지: EDA · MPW/tape-out · 파운드리·파일럿라인)
 */

import { Rocket, Route, ListChecks } from "lucide-react";
import type { ClusterId } from "@foundone/shared";
import {
  StartupKeyActionHero,
  StartupSection,
  StartupListItem,
} from "./StartupStageShell";

export type DeepTechKind = "hardware" | "lab" | "extreme";
export type DeepTechStageKey = "mvp" | "launch" | "golive";

/** SW 클러스터(tech-software)가 아닌 딥테크/하드웨어면 kind 반환, SW면 null. */
export function deepTechKindOf(cluster: ClusterId | null): DeepTechKind | null {
  switch (cluster) {
    case "tech-hardware": return "hardware";
    case "tech-deeptech-lab": return "lab";
    case "tech-extreme-deeptech": return "extreme";
    default: return null; // tech-software 및 비스타트업
  }
}

const KIND_LABEL: Record<DeepTechKind, { ko: string; en: string }> = {
  hardware: { ko: "하드웨어·IoT 트랙", en: "Hardware / IoT track" },
  lab: { ko: "딥테크·랩 트랙", en: "Deep-tech (lab) track" },
  extreme: { ko: "극딥테크 트랙", en: "Extreme deep-tech track" },
};

// ─── 단계 × 클러스터 콘텐츠 매트릭스 ───
type StageContent = {
  heroTitle: { ko: string; en: string };
  heroSubtitle: { ko: string; en: string };
  // 이 단계의 딥테크 흐름 (클러스터별) — 로드맵 전용 단계로 안내
  flowTitle: { ko: string; en: string };
  flow: Record<DeepTechKind, { ko: string[]; en: string[] }>;
};

const STAGE_CONTENT: Record<DeepTechStageKey, StageContent> = {
  mvp: {
    heroTitle: {
      ko: "MVP = 코드 배포가 아니라 '작동하는 물리 증거'",
      en: "Your MVP is working physical proof — not a code deploy",
    },
    heroSubtitle: {
      ko: "SW 처럼 Next.js·Vercel 로 끝나지 않습니다. 당신의 MVP 는 프로토타입·벤치 데이터·시제로 핵심 가설을 증명하는 것입니다. 로드맵의 전용 단계가 세부 절차를 안내합니다.",
      en: "No Next.js/Vercel finish line. Your MVP proves the core hypothesis with a prototype, bench data, or first silicon. Dedicated stages below cover the specifics.",
    },
    flowTitle: { ko: "이 단계의 딥테크 흐름", en: "Your MVP flow" },
    flow: {
      hardware: {
        ko: [
          "핵심 기능 검증 보드(EVT) 제작 — 회로 + 펌웨어 최소 기능으로 '되는지' 먼저 증명",
          "3D 프린팅·목업으로 기구(폼팩터) 검증 — 양산 금형 전 반복",
          "BOM 초안 작성 — 핵심 부품 리드타임·단가·대체품 확보",
          "리드 유저 3~5명 실사용 테스트 → 다음: 로드맵 '하드웨어 프로토타입(EVT/DVT/PVT)' 단계",
        ],
        en: [
          "Build an EVT board — prove the core function with circuit + minimal firmware",
          "Validate form factor with 3D-printed mockups before tooling",
          "Draft the BOM — secure key-part lead time, cost, alternates",
          "Test with 3-5 lead users → next: 'Hardware Prototype (EVT/DVT/PVT)' stage",
        ],
      },
      lab: {
        ko: [
          "랩 환경 프로토타입 — 통제된 조건에서 핵심 원리·알고리즘 검증",
          "벤치 데이터 확보 — 재현 가능한 측정으로 가설 증명(논문·IR 근거)",
          "바이오/의료면 사전 규제 확인 — IRB·동물실험·GLP 필요 여부 조기 점검",
          "→ 다음: 로드맵 '랩 셋업'·'프로토타입 반복' 단계",
        ],
        en: [
          "Lab prototype — validate the core principle/algorithm in controlled conditions",
          "Gather reproducible bench data as evidence",
          "For bio/med: check IRB / animal study / GLP needs early",
          "→ next: 'Lab Setup' & 'Prototype Iteration' stages",
        ],
      },
      extreme: {
        ko: [
          "EDA 설계·시뮬레이션 — 파운드리 PDK 기반으로 설계 검증",
          "MPW(멀티프로젝트 웨이퍼) 셔틀 tape-out 예약 — 소량 시제 칩으로 비용 최소화",
          "테스트 벤치 준비 — 시제 반환 후 특성 평가 계획",
          "→ 다음: 로드맵 'EDA 툴링'·'MPW/파일럿 tape-out' 단계",
        ],
        en: [
          "EDA design & simulation against the foundry PDK",
          "Book an MPW shuttle tape-out to prove the design at minimal cost",
          "Prepare a test bench for characterization on return",
          "→ next: 'EDA Tooling' & 'MPW / Pilot Tape-out' stages",
        ],
      },
    },
  },
  launch: {
    heroTitle: {
      ko: "출시 = Product Hunt 가 아니라 파일럿 고객·디자인윈",
      en: "Launch = pilot customers & design wins, not Product Hunt",
    },
    heroSubtitle: {
      ko: "딥테크 GTM 은 Product Hunt·Hacker News·앱스토어가 아닙니다. 파일럿 도입·레퍼런스·인증·규제 승인이 시장 진입의 핵심입니다.",
      en: "Deep-tech GTM isn't Product Hunt/Hacker News/app stores. Pilots, references, certification and regulatory approval unlock the market.",
    },
    flowTitle: { ko: "이 단계의 딥테크 GTM 흐름", en: "Your GTM flow" },
    flow: {
      hardware: {
        ko: [
          "파일럿 고객 3~5곳 확보 — 실사용 레퍼런스·케이스 스터디가 다음 계약의 열쇠",
          "인증 준비(KC·CE·FCC 등) — 미인증 판매 불가. 리드타임 사전 확보",
          "판매 채널 결정 — B2B 직판 / 크라우드펀딩(와디즈·킥스타터) / 총판",
          "→ 다음: 로드맵 '인증(KC/CE)'·'양산 파트너(EMS)' 단계",
        ],
        en: [
          "Secure 3-5 pilot customers — references/case studies drive the next deals",
          "Prep certification (KC/CE/FCC) — no sales without it; plan lead time",
          "Pick channels — B2B direct / crowdfunding / distributors",
          "→ next: 'Certification (KC/CE)' & 'Manufacturing Partner (EMS)' stages",
        ],
      },
      lab: {
        ko: [
          "필드/임상 테스트 설계 — 실환경 성능·안전 데이터 확보",
          "규제 승인 경로 확정 — 인허가·임상 단계별 계획(식약처·FDA 등)",
          "초기 파일럿 도입처(병원·현장) 확보 — 레퍼런스 + 논문·학회 발표",
          "→ 다음: 로드맵 '필드·임상 테스트'·'규제 제출' 단계",
        ],
        en: [
          "Design field/clinical tests for real-world performance & safety data",
          "Lock the regulatory pathway (MFDS/FDA, phased plan)",
          "Land pilot sites (hospitals/field) + papers/conference talks",
          "→ next: 'Field/Clinical Test' & 'Regulatory Submission' stages",
        ],
      },
      extreme: {
        ko: [
          "리드 커스터머 디자인윈 — 샘플 공급 후 고객 설계 채택이 최대 마일스톤",
          "파운드리·파트너 파일럿 라인 확보 — 양산 전환 경로 확정",
          "레퍼런스·표준 대응 — 데이터시트·평가 키트 제공",
          "→ 다음: 로드맵 '파트너·파일럿 라인' 단계",
        ],
        en: [
          "Land a lead-customer design win — sample → customer design adoption is the milestone",
          "Secure a foundry/partner pilot line and the path to volume",
          "Provide datasheets / eval kits for references & standards",
          "→ next: 'Partner / Pilot Line' stage",
        ],
      },
    },
  },
  golive: {
    heroTitle: {
      ko: "실출시 = 웹 배포가 아니라 초도 양산·현장 배포",
      en: "Go-live = first production & field deployment, not a web deploy",
    },
    heroSubtitle: {
      ko: "도메인·SSL·앱스토어 제출이 아닙니다. 당신의 '출시'는 초도 양산 출하·파일럿 현장 배포·리드 커스터머 공급입니다.",
      en: "Not domain/SSL/app-store submission. Your go-live is first production shipment, field deployment, or lead-customer supply.",
    },
    flowTitle: { ko: "이 단계의 딥테크 출시 흐름", en: "Your go-live flow" },
    flow: {
      hardware: {
        ko: [
          "초도 양산(파일럿 로트) 출하 — 품질·수율 검증 후 확대",
          "크라우드펀딩 오픈 또는 B2B 파일럿 배포 — 채널에 맞춰 실행",
          "A/S·RMA·펌웨어 OTA 체계 준비 — 출시 직후 필수",
        ],
        en: [
          "Ship the first production (pilot lot); scale after yield/QA",
          "Open crowdfunding or deploy B2B pilots per your channel",
          "Stand up A/S, RMA, and firmware OTA before day one",
        ],
      },
      lab: {
        ko: [
          "규제 승인 후 파일럿 현장 배포 — 병원·연구소·현장 도입",
          "초기 도입 고객 온보딩·교육 — 프로토콜·SOP 제공",
          "실사용 데이터 수집 → 승인 확대·차기 적응증 근거",
        ],
        en: [
          "Deploy to pilot sites after approval (hospitals/field/labs)",
          "Onboard & train early adopters with protocols/SOPs",
          "Collect real-world data to expand approval/indications",
        ],
      },
      extreme: {
        ko: [
          "파일럿 라인 가동 — 리드 커스터머 샘플 공급 시작",
          "양산 전환 준비 — 파운드리 캐파·수율 램프 계획",
          "품질·신뢰성 인증(자동차 AEC-Q 등) 필요 시 병행",
        ],
        en: [
          "Run the pilot line; start lead-customer sample supply",
          "Prep the volume ramp — foundry capacity & yield plan",
          "Run reliability/qual (e.g., AEC-Q) where required",
        ],
      },
    },
  },
};

// 전 딥테크 공통 펀더멘털 (SW·딥테크 무관하게 유지되는 것)
const UNIVERSAL: Record<"ko" | "en", string[]> = {
  ko: [
    "고객 인터뷰·레퍼런스 확보 — 어떤 트랙이든 '누가 왜 사는가'가 1순위",
    "핵심 지표 트래킹 — 파일럿 전환율·수율·리텐션 등 트랙에 맞는 지표",
    "B2B 마케팅 — 전시회·논문·파트너십·업계 미디어 (개인 소비자 채널 아님)",
  ],
  en: [
    "Customer interviews & references — 'who buys and why' comes first on any track",
    "Track the right metrics — pilot conversion, yield, retention",
    "B2B marketing — expos, papers, partnerships, trade media (not consumer channels)",
  ],
};

export function DeepTechStageNotice({
  stage,
  kind,
  ko,
}: {
  stage: DeepTechStageKey;
  kind: DeepTechKind;
  ko: boolean;
}) {
  const c = STAGE_CONTENT[stage];
  const lang = ko ? "ko" : "en";
  const flow = c.flow[kind][lang];
  const universal = UNIVERSAL[lang];

  return (
    <div className="bento-fade-in" style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      <StartupKeyActionHero
        eyebrow={ko ? KIND_LABEL[kind].ko : KIND_LABEL[kind].en}
        title={ko ? c.heroTitle.ko : c.heroTitle.en}
        subtitle={ko ? c.heroSubtitle.ko : c.heroSubtitle.en}
      />

      <StartupSection icon={Route} title={ko ? c.flowTitle.ko : c.flowTitle.en}>
        {flow.map((t, i) => (
          <StartupListItem key={i} name={t} priority="primary" isLast={i === flow.length - 1} />
        ))}
      </StartupSection>

      <StartupSection
        icon={ListChecks}
        title={ko ? "트랙 무관 공통 — 이건 그대로 챙기세요" : "Universal fundamentals — keep these"}
      >
        {universal.map((t, i) => (
          <StartupListItem key={i} name={t} priority="recommended" isLast={i === universal.length - 1} />
        ))}
      </StartupSection>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          padding: "12px 14px",
          borderRadius: "12px",
          background: "rgba(25,25,112,0.05)",
          border: "1px solid rgba(25,25,112,0.14)",
        }}
      >
        <Rocket size={15} strokeWidth={2.2} color="#191970" style={{ flexShrink: 0, marginTop: "1px" }} />
        <span style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.55 }}>
          {ko
            ? "세부 실행 절차는 위에 언급된 당신 트랙 전용 단계에서 이어집니다. SW 전용 출시 가이드(Vercel·앱스토어·Product Hunt)는 이 트랙에 해당하지 않아 숨겼습니다."
            : "Detailed steps continue in your track's dedicated stages above. SW-only launch guides (Vercel, app stores, Product Hunt) are hidden — they don't apply to your track."}
        </span>
      </div>
    </div>
  );
}

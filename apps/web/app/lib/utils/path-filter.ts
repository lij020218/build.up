/**
 * path-filter.ts — 로드맵 경로(cluster)별 stage 가시성 단일 SSOT.
 *
 *  업종 카테고리(offline / online-digital / startup-tech)와 sub-industry(클러스터 B/C/D),
 *  창업유형(franchise)에 따라 특정 stage 가 "내 경로"에 속하는지 판정한다.
 *
 *  ⚠️ 종전엔 이 로직이 useComputedDashboard·useDataLoading·usePersistence 3곳에 각각 복제돼 있었고,
 *     useDataLoading 의 startupOnly 집합에 'go-live' 가 누락돼 online 업종 진행률 카운터가
 *     다른 결과를 내는 diverge 가 발생했다. 이 파일을 단일 출처로 사용한다.
 *
 *  사용:
 *    const isPathStage = makeIsPathStage({ industryCategoryId, selectedIndustryId, startupType });
 *    roadmap.stages.filter(s => isPathStage(s.stageId));
 */

const ONLINE_ONLY = new Set([
  "platform-setup", "online-registration", "sourcing-setup", "store-setup", "online-marketing",
]);

// 클러스터 B/C/D (startup-tech sub-industry 별 전용 단계).
const CLUSTER_B = new Set(["hardware-prototype", "bom-supply-chain", "certification-kc-ce", "manufacturing-partner"]);
const CLUSTER_C = new Set(["lab-setup", "prototype-iteration", "field-or-clinical-test", "regulatory-submission"]);
const CLUSTER_D = new Set(["eda-tooling-setup", "mpw-or-pilot-tape-out", "packaging-and-test", "partner-foundation-or-pilot-line"]);
const ALL_CLUSTER = new Set([...CLUSTER_B, ...CLUSTER_C, ...CLUSTER_D]);

// startup-tech 전용 단계 (공통 startup 단계 + 모든 클러스터 단계). 'go-live' 포함 필수.
const STARTUP_ONLY = new Set([
  "startup-foundation", "customer-discovery", "mvp-build", "launch-gtm", "go-live",
  "growth-engine", "company-setup", "fundraising-readiness", "venture-certification",
  ...ALL_CLUSTER,
]);

const OFFLINE_ONLY = new Set([
  "permit-check", "location-candidates", "contract-review", "construction-setup", "vendor-setup",
  "registration-setup", "insurance-tax-setup", "hiring-setup", "operations-setup", "pre-launch",
]);

const FRANCHISE_ONLY = new Set(["franchise-application"]);

export type PathFilterInput = {
  industryCategoryId: string;
  selectedIndustryId?: string | null;
  startupType?: string | null;
};

/** 경로 입력으로 isPathStage(stageId) 판정 함수를 생성. */
export function makeIsPathStage(input: PathFilterInput): (stageId: string) => boolean {
  const isStartup = input.industryCategoryId === "startup-tech";
  const isDigital = input.industryCategoryId === "online-digital" || isStartup;
  const sub = input.selectedIndustryId ?? "";
  const isClusterB = sub === "hardware-iot";
  const isClusterC = sub === "robotics-physical-ai" || sub === "biotech-medtech";
  const isClusterD = sub === "semiconductor" || sub === "climate-energy";
  const isFranchise = input.startupType === "franchise";

  return (stageId: string): boolean => {
    if (isStartup) {
      if (ONLINE_ONLY.has(stageId) || OFFLINE_ONLY.has(stageId) || FRANCHISE_ONLY.has(stageId)) return false;
      // 클러스터 단계는 해당 sub-industry 만 표시.
      if (CLUSTER_B.has(stageId)) return isClusterB;
      if (CLUSTER_C.has(stageId)) return isClusterC;
      if (CLUSTER_D.has(stageId)) return isClusterD;
      return true;
    }
    if (isDigital) {
      // online-digital
      if (OFFLINE_ONLY.has(stageId) || STARTUP_ONLY.has(stageId)) return false;
      if (FRANCHISE_ONLY.has(stageId) && !isFranchise) return false;
      return true;
    }
    // offline (음식·카페·소매·미용 등) — cluster·startup-only·online-only 모두 제외.
    if (ONLINE_ONLY.has(stageId) || STARTUP_ONLY.has(stageId)) return false;
    if (ALL_CLUSTER.has(stageId)) return false;
    if (FRANCHISE_ONLY.has(stageId) && !isFranchise) return false;
    return true;
  };
}

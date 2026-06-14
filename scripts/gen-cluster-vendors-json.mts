/**
 * gen-cluster-vendors-json.mts
 * 웹 SSOT(cluster-stage-vendors.ts)의 하드웨어·딥테크 단계별 추천 공급사·도구를
 * iOS 가 읽는 cluster-stage-vendors.json 으로 직렬화. getClusterStageVendors 를 호출해
 * (stageId[, vertical]) 조합을 미리 resolve 한 flat 맵을 만든다.
 *
 * 실행: npx tsx scripts/gen-cluster-vendors-json.mts
 * 출력: packages/shared/src/cluster-stage-vendors.json
 *        (apps/ios/Sources/FoundOneCore/Resources/cluster-stage-vendors.json 가 심볼릭 링크)
 *
 * 키: 하드웨어 단계 = "stageId" / 딥테크 단계 = "stageId::vertical"(robotics|biotech|semiconductor|climate)
 */
import { writeFileSync } from "node:fs";

const mod = await import(
  new URL("../apps/web/app/lib/components/stages/startup/cluster-stage-vendors.ts", import.meta.url).href
);
const getClusterStageVendors = mod.getClusterStageVendors as (stageId: string, subId?: string) => unknown[];

const HARDWARE_STAGES = ["hardware-prototype", "bom-supply-chain", "certification-kc-ce", "manufacturing-partner"];
const LAB_STAGES = ["lab-setup", "prototype-iteration", "field-or-clinical-test", "regulatory-submission"];
const EXTREME_STAGES = ["eda-tooling-setup", "mpw-or-pilot-tape-out", "packaging-and-test", "partner-foundation-or-pilot-line"];
const SUB_FOR_VERTICAL: Record<string, string> = {
  robotics: "robotics-physical-ai",
  biotech: "biotech-medtech",
  semiconductor: "semiconductor",
  climate: "climate-energy",
};

const out: Record<string, unknown[]> = {};
for (const s of HARDWARE_STAGES) out[s] = getClusterStageVendors(s);
for (const s of LAB_STAGES) {
  for (const v of ["robotics", "biotech"]) out[`${s}::${v}`] = getClusterStageVendors(s, SUB_FOR_VERTICAL[v]);
}
for (const s of EXTREME_STAGES) {
  for (const v of ["semiconductor", "climate"]) out[`${s}::${v}`] = getClusterStageVendors(s, SUB_FOR_VERTICAL[v]);
}

const dest = new URL("../packages/shared/src/cluster-stage-vendors.json", import.meta.url);
writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
const total = Object.values(out).reduce((a, b) => a + b.length, 0);
console.log(`generated cluster-stage-vendors.json — keys: ${Object.keys(out).length}, vendors: ${total}`);

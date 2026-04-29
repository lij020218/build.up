"use client";

import { CircuitBoard, Zap, Factory, Clock } from "lucide-react";
import { ClusterStageTemplate, type ClusterStageContent } from "./ClusterStageTemplate";

/**
 * Cluster B — Hardware/IoT NPI 1/4: 프로토타입 (EVT → DVT → PVT)
 *
 * 검증 출처:
 *   • Titoma — EVT 10-50대 4-6주, PVT 최소 4주 (https://titoma.com/blog/evt-dvt-pvt-testing/)
 *   • OnLogic — DVT 50-200대, "most challenging stage"
 *   • Kaizen Dynamic / Hatch / OpenBOM — 동일 정의 교차 검증
 */
const defaultContent: ClusterStageContent = {
  keyAction: {
    title: "EVT → DVT → PVT 3단계를 빠뜨리지 말 것 — 단계 누락은 양산 후 결함 폐기로 이어집니다",
    detail: "EVT(10-50대, 4-6주)에서 회로/펌웨어 결함 → DVT(50-200대, 양산 공정 동일)에서 내구성·신뢰성 → PVT(첫 양산 5-10%, 최소 4주)에서 양산 가능성 검증. 모든 단계는 명확한 합격 기준이 있어야 함.",
  },
  facts: [
    {
      icon: Zap,
      label: "EVT (Engineering Validation)",
      value: "10-50대, 4-6주. 회로 정상 동작·펌웨어 통합·핵심 기능 검증",
      source: "Titoma 2026",
    },
    {
      icon: CircuitBoard,
      label: "DVT (Design Validation)",
      value: "50-200대, 양산 공정과 동일 제작. 환경 테스트·낙하·EMC·열사이클 — 가장 길고 어려운 단계",
      source: "Titoma · OnLogic",
    },
    {
      icon: Factory,
      label: "PVT (Production Validation)",
      value: "첫 정식 양산의 5-10%, 최소 4주. 양산 가능성·목표 단가·수율 검증, 판매 가능 수준",
      source: "Titoma · Hatch",
    },
    {
      icon: Clock,
      label: "전체 NPI 리드타임",
      value: "저인증 6개월~2년, 고인증 2~5년. EVT~PVT만 12-24주 + 인증 별도",
      source: "MistyWest · Xavor",
    },
  ],
  traps: [
    {
      label: "EVT 건너뛰고 바로 양산 — 가장 흔하고 가장 비싼 실수",
      text: "10대로 잡을 결함을 1만대 양산 후 발견하면 전량 폐기. EVT 비용은 양산 비용의 1% 미만이지만 95% 결함을 잡음.",
    },
    {
      label: "DVT 환경 테스트 생략 → 필드 고장 폭발",
      text: "낙하·EMC·열사이클·습도 테스트 안 하면 출하 후 RMA율이 양산 수익을 다 갉아먹음. 환경 매트릭스를 미리 정의해야.",
    },
    {
      label: "PVT 수율을 양산 수율로 착각",
      text: "PVT 수율 95%여도 양산에서 10배 규모 되면 새 결함 출현. PVT는 '판매 가능 입증' 이지 '양산 보장'이 아님.",
    },
  ],
  links: [
    { name: "EVT/DVT/PVT 정의 — Titoma (영문)", href: "https://titoma.com/blog/evt-dvt-pvt-testing/", desc: "검증된 NPI 단계별 가이드" },
    { name: "Hardware NPI 종합 가이드 — MistyWest", href: "https://www.mistywest.com/complete-guide-to-hardware-product-development/" },
  ],
};

export function HardwarePrototypeStage() {
  return (
    <ClusterStageTemplate
      stepLabel="Cluster B — Hardware NPI 1/4"
      title="하드웨어 프로토타입 (EVT → DVT → PVT)"
      contextLabel="9단계 / 22"
      contentBySubIndustry={{
        "hardware-iot": defaultContent,
      }}
      defaultContent={defaultContent}
    />
  );
}

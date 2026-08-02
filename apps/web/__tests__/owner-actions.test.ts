import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildOwnerActions,
  buildAiDoneList,
  ownerActionTrackFor,
  bankLabel,
} from "@foundone/shared";

/**
 * 분업 명세 가드 (2026-08-03).
 *  스펙 = 사용자 원문: "AI가 어려운 건 해결해주고 내가 해야 할 부분만 남겨주면 좋겠다."
 *  지키는 것: ① 결정론 ② 사장님 몫 정의(물리·법적 본인 행위만) ③ 딥링크 무결성 ④ 위조 금지.
 */

const HERE = dirname(fileURLToPath(import.meta.url));

const SAMPLE_PERMITS = [
  { name: "위생교육 수료", kind: "교육", where: "한국외식업중앙회", cost: "3만원", duration: "1일", required: true },
  { name: "일반음식점 영업신고", kind: "신고", where: "관할 구청 위생과", cost: "약 4만원", duration: "즉시~3일", required: true },
  { name: "사업자등록", kind: "등록", where: "홈택스 또는 세무서", cost: "무료", duration: "즉시~2일", required: true },
  { name: "옥외광고물 허가", kind: "허가", where: "관할 구청", cost: "수수료 별도", duration: "7일", required: false },
];

describe("결정론 + 트랙 분기", () => {
  it("같은 입력 → 같은 목록 (LLM 아님)", () => {
    const input = { track: "offline" as const, permitsDetailed: SAMPLE_PERMITS };
    expect(buildOwnerActions(input)).toEqual(buildOwnerActions(input));
  });

  it("오프라인 = 발품·서명·인허가·통장·시공", () => {
    const ids = buildOwnerActions({ track: "offline", permitsDetailed: SAMPLE_PERMITS }).map((a) => a.id);
    expect(ids).toContain("visit-candidates");
    expect(ids).toContain("sign-lease");
    expect(ids).toContain("open-bank");
    expect(ids).toContain("confirm-construction");
    expect(ids).not.toContain("incorporate");        // 스타트업 전용이 새면 안 된다
    expect(ids).not.toContain("open-store-account"); // 온라인 전용
  });

  it("프랜차이즈면 가맹 계약(숙려기간)이 추가된다", () => {
    const ids = buildOwnerActions({ track: "offline", startupType: "franchise" }).map((a) => a.id);
    expect(ids).toContain("franchise-contract");
    expect(buildOwnerActions({ track: "offline", startupType: "independent" }).map((a) => a.id))
      .not.toContain("franchise-contract");
  });

  it("온라인·스타트업은 발품·시공이 없다 (억지 일거리 금지)", () => {
    for (const track of ["online", "startup"] as const) {
      const ids = buildOwnerActions({ track }).map((a) => a.id);
      expect(ids).not.toContain("visit-candidates");
      expect(ids).not.toContain("confirm-construction");
    }
    expect(buildOwnerActions({ track: "online" }).map((a) => a.id)).toContain("open-store-account");
    expect(buildOwnerActions({ track: "startup" }).map((a) => a.id)).toContain("incorporate");
  });

  it("트랙 매핑 — startup-tech/online-digital/나머지", () => {
    expect(ownerActionTrackFor("startup-tech")).toBe("startup");
    expect(ownerActionTrackFor("online-digital")).toBe("online");
    expect(ownerActionTrackFor("food")).toBe("offline");
    expect(ownerActionTrackFor("beauty")).toBe("offline");
  });
});

describe("인허가 병합 — 실데이터만, required 만", () => {
  it("required=false 는 사장님 목록에 안 올린다 (선택 사항으로 목록 부풀리기 금지)", () => {
    const actions = buildOwnerActions({ track: "offline", permitsDetailed: SAMPLE_PERMITS });
    expect(actions.some((a) => a.id.includes("옥외광고물"))).toBe(false);
    expect(actions.some((a) => a.id.includes("영업신고"))).toBe(true);
  });

  it("비용·기간은 permitsDetailed 값 그대로 (재추정 위조 금지)", () => {
    const a = buildOwnerActions({ track: "offline", permitsDetailed: SAMPLE_PERMITS })
      .find((x) => x.id.includes("영업신고"))!;
    expect(a.cost).toBe("약 4만원");
    expect(a.estimate).toBe("즉시~3일");
    expect(a.title).toContain("관할 구청 위생과");
  });

  it("사업자등록→registration-setup, 통신판매업→online-registration 딥링크 분기", () => {
    const actions = buildOwnerActions({
      track: "online",
      permitsDetailed: [
        { name: "사업자등록", kind: "등록", where: "홈택스", cost: "무료", duration: "즉시", required: true },
        { name: "통신판매업 신고", kind: "신고", where: "정부24", cost: "등록면허세", duration: "1~3일", required: true },
      ],
    });
    expect(actions.find((a) => a.id.includes("사업자등록"))!.stageId).toBe("registration-setup");
    expect(actions.find((a) => a.id.includes("통신판매업"))!.stageId).toBe("online-registration");
  });
});

describe("딥링크 무결성 — 모든 stageId 가 실제 로드맵 시퀀스에 존재", () => {
  it("starter-data.ts 에 없는 stageId 를 가리키면 죽은 링크다", () => {
    const starter = readFileSync(join(HERE, "..", "..", "..", "packages", "shared", "src", "starter-data.ts"), "utf8");
    const validIds = new Set([...starter.matchAll(/stageId:\s*"([a-z-]+)"/g)].map((m) => m[1]!));
    const allActions = [
      ...buildOwnerActions({ track: "offline", startupType: "franchise", permitsDetailed: SAMPLE_PERMITS }),
      ...buildOwnerActions({ track: "online", permitsDetailed: SAMPLE_PERMITS }),
      ...buildOwnerActions({ track: "startup" }),
    ];
    for (const a of allActions) {
      expect(validIds.has(a.stageId), `${a.id} → ${a.stageId}`).toBe(true);
    }
  });
});

describe("AI가 끝낸 것 — 실제로 있는 것만 (없는 걸 했다고 말하면 위조)", () => {
  it("전부 없으면 빈 목록", () => {
    expect(buildAiDoneList({
      hasIndustryMatch: false, budgetAllocated: false, permitCount: 0, supplierCount: 0,
      channelCount: 0, hasTaxType: false, hasInsurance: false, hasMenuOrProducts: false,
    })).toEqual([]);
  });

  it("개수가 문구에 정확히 반영된다", () => {
    const done = buildAiDoneList({
      hasIndustryMatch: true, budgetAllocated: true, permitCount: 3, supplierCount: 5,
      channelCount: 2, hasTaxType: true, hasInsurance: true, hasMenuOrProducts: true,
    });
    expect(done.join(" ")).toContain("인허가 3건");
    expect(done.join(" ")).toContain("5곳");
    expect(done.length).toBe(8);
  });
});

describe("P1 회귀 가드 — 입지 프리필이 완료를 다시 찍지 않는다", () => {
  it("AI 위저드 경로의 location-candidates 프리필에 completedAt 이 없다", () => {
    // 두 경로를 구분한다:
    //  · AI 위저드(result.parsed.preferredRegion) — 예비 창업자. 입지는 아직 발품 전 → 완료 금지
    //  · 기존 사업자(result.preferredRegion) — 이미 영업 중인 주소 → 완료가 정당
    const src = readFileSync(join(HERE, "..", "app", "lib", "hooks", "useOnboardingHandlers.ts"), "utf8");
    const blocks = [...src.matchAll(/upsertStageDecision\(nextDecisions, "location-candidates",[\s\S]{0,500}?\}\);/g)]
      .map((m) => m[0]);
    const aiBlocks = blocks.filter((b) => b.includes("result.parsed.preferredRegion"));
    expect(aiBlocks.length).toBeGreaterThan(0);
    for (const b of aiBlocks) expect(b).not.toContain("completedAt");
  });
});

describe("iOS 패리티 — OwnerActionsRegistry.swift 가 웹 SSOT 와 문구 1:1", () => {
  const swift = readFileSync(
    join(HERE, "..", "..", "ios", "Sources", "FoundOneCore", "OwnerActionsRegistry.swift"),
    "utf8",
  );
  const wizardSwift = readFileSync(
    join(HERE, "..", "..", "ios", "Sources", "FoundOneFeatures", "Roadmap", "AIRoadmapWizardView.swift"),
    "utf8",
  );

  it("사장님 액션 제목·준비됨 문구가 동일하다", () => {
    for (const phrase of [
      "후보 자리 2~3곳을 직접 가서 보기",
      "임대차 계약서에 서명하기",
      "가맹 상담 후 정보공개서 숙려기간 지키고 계약하기",
      "시공 업체 견적 비교하고 계약하기",
      "판매 채널 계정 만들고 본인 인증하기",
      "법인 설립(또는 개인사업자) 등기·등록 마치기",
      "방문 시 확인할 체크리스트와 후보지 비교표를 입지 단계에 준비해뒀어요.",
      "업종코드와 과세 유형 추천까지 채워뒀어요. 홈택스에서 그대로 입력하면 됩니다.",
    ]) {
      expect(swift, phrase).toContain(phrase);
    }
  });

  it("AI가 끝낸 것 문구가 동일하다 (개수 보간 포함)", () => {
    expect(swift).toContain("업종 분류와 그에 맞는 로드맵 구성");
    expect(swift).toContain("건의 순서·장소·비용 정리");
    expect(swift).toContain("곳 선별 (검증 풀 기반)");
  });

  it("iOS 리뷰 화면에 분업 섹션이 배선돼 있다", () => {
    expect(wizardSwift).toContain("DivisionOfLaborSection(result: result)");
    expect(wizardSwift).toContain("사장님만 할 수 있는 일");
    expect(wizardSwift).toContain("사장님이 직접 하실 일은");
  });

  it("required 필터·트랙 분기가 미러됐다", () => {
    expect(swift).toContain("for p in permits where p.required");
    expect(swift).toContain('== "startup-tech" { return .startup }');
  });
});

describe("표시 보조", () => {
  it("bankLabel — 알려진 id 만, 모르면 undefined (이상한 은행명 지어내기 금지)", () => {
    expect(bankLabel("toss")).toBe("토스뱅크");
    expect(bankLabel("other")).toBeUndefined();
    expect(bankLabel(undefined)).toBeUndefined();
  });
});

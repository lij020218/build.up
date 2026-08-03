/**
 * 국세청 확인 게이트 가드 (2026-08-03 사장님 스펙)
 *  — 사업자등록 단계: 번호 입력→국세청 확인→다음 단계, 「나중에 확인」 스킵 + 세팅 미션 후속.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isValidBizNumber, normalizeBizNumber, formatBizNumber } from "../../../packages/shared/src/biz-number";

const HERE = __dirname;
const read = (...p: string[]) => readFileSync(join(HERE, ...p), "utf8");

describe("체크섬 SSOT (iOS 검증기 shared 승격)", () => {
  it("유효/무효 번호 판별 — 국세청 표준 가중치", () => {
    // 유효 예: 국세청 예시·공공기관 번호 (체크섬 만족)
    expect(isValidBizNumber("1208147521")).toBe(true);   // 삼성전자
    expect(isValidBizNumber("120-81-47521")).toBe(true); // 하이픈 허용
    expect(isValidBizNumber("1208147522")).toBe(false);  // 체크 자리 오류
    expect(isValidBizNumber("123456789")).toBe(false);   // 9자리
    expect(isValidBizNumber("")).toBe(false);
    expect(normalizeBizNumber("120-81-47521")).toBe("1208147521");
    expect(formatBizNumber("1208147521")).toBe("120-81-47521");
  });

  it("iOS 검증기와 같은 가중치·같은 판정 (드리프트 가드)", () => {
    const ios = read("..", "..", "ios", "Sources", "FoundOneData", "StoreInfo", "StoreInfoValidators.swift");
    expect(ios).toContain("[1, 3, 7, 1, 3, 7, 1, 3, 5]");
    const shared = read("..", "..", "..", "packages", "shared", "src", "biz-number.ts");
    expect(shared).toContain("[1, 3, 7, 1, 3, 7, 1, 3, 5]");
  });
});

describe("게이트 배선 — 확인 or 건너뛰기 후에만 다음 단계", () => {
  it("콘텐츠 SSOT 에 bizVerify 블록 (웹·iOS 공용)", () => {
    const content = read("..", "..", "..", "packages", "shared", "src", "stages", "content", "registration-setup.ts");
    expect(content).toContain('ref: "bizVerify"');
    expect(content).toContain('platforms: ["web", "ios"]');
  });

  it("웹 — footer 게이트 + 기록은 __setupMeta (시점 라벨)", () => {
    const section = read("..", "app", "lib", "components", "surfaces", "GenericTaskStageSection.tsx");
    expect(section).toContain("bizVerifyGatePassed");
    expect(section).toContain("stageState.allDone && bizVerifyGatePassed");
    const renderer = read("..", "app", "lib", "components", "stages", "shared", "StageContentRenderer.tsx");
    expect(renderer).toContain("BizVerifyGateBlock");
    expect(renderer).toContain("bizVerifiedAt: new Date().toISOString().slice(0, 10)");
    expect(renderer).toContain("bizVerifySkipped: true");
  });

  it("웹 카드 — 체크섬 사전 차단 + 건너뛰기 버튼 (게이트 모드만)", () => {
    const card = read("..", "app", "lib", "components", "stages", "shared", "NtsBizVerifyCard.tsx");
    expect(card).toContain("isValidBizNumber");
    expect(card).toContain("나중에 확인할게요");
    expect(card).toContain("gateMode && state.s !== \"confirmed\"");
  });

  it("iOS — 게이트 섹션 + canComplete + 2기기 동기화", () => {
    const gate = read("..", "..", "ios", "Sources", "FoundOneFeatures", "Roadmap", "Stages", "NtsBizVerifyGateSection.swift");
    expect(gate).toContain("bizVerifiedAt");
    expect(gate).toContain("bizVerifySkipped");
    expect(gate).toContain("stage.regsetup.bizGatePassed");
    expect(gate).toContain("2기기 커버");
    const renderer = read("..", "..", "ios", "Sources", "FoundOneFeatures", "Roadmap", "Stages", "BUStageContentRenderer.swift");
    expect(renderer).toContain('refs.contains("bizVerify")');
    expect(renderer).toContain("NtsBizVerifyGateSection.gateFlagKey");
  });
});

describe("건너뛰기 후속 — 세팅 미션 (웹·iOS 미러)", () => {
  it("웹 — 로드맵 스킵 사용자에게도 노출 + biz-verify 미션 + 이동 액션", () => {
    const card = read("..", "app", "lib", "components", "dashboard", "StoreSetupMissionsCard.tsx");
    expect(card).toContain("bizVerifyPending");
    expect(card).toContain('"biz-verify"');
    expect(card).toContain("onVerifyBiz");
    const dash = read("..", "app", "lib", "components", "dashboard", "OperationalDashboard.tsx");
    expect(dash).toContain('setViewingStageId("registration-setup")');
  });

  it("iOS — 미러 (bizVerifyPending·미션·탭 이동)", () => {
    const card = read("..", "..", "ios", "Sources", "FoundOneFeatures", "Today", "StoreSetupMissionsCard.swift");
    expect(card).toContain("bizVerifyPending");
    expect(card).toContain("biz-verify");
    expect(card).toContain("onVerifyBiz");
    const today = read("..", "..", "ios", "Sources", "FoundOneFeatures", "Today", "TodayView.swift");
    expect(today).toContain("onVerifyBiz: { onSwitchTab?(.roadmap) }");
  });
});

describe("부수 수리 — 서버 하드닝 + iOS 온보딩 위조 제거", () => {
  it("status 라우트 체크섬 사전 필터 / verify 라우트 입력 검증", () => {
    const status = read("..", "app", "api", "data", "business", "status", "route.ts");
    expect(status).toContain("isValidBizNumber");
    const verify = read("..", "app", "api", "data", "business", "verify", "route.ts");
    expect(verify).toContain("Array.isArray(body?.businesses)");
    expect(verify).toContain(".slice(0, 10)");
  });

  it('iOS 온보딩 — `?? "active"` 계속사업자 위조 제거 + 미등록 분기', () => {
    const view = read("..", "..", "ios", "Sources", "FoundOneFeatures", "Onboarding", "ExistingStoreRegistrationView.swift");
    expect(view).not.toContain('?? "active"');
    expect(view).toContain('operatingStatus == "unregistered"');
    expect(view).toContain('operatingStatus == "active"');
  });
});

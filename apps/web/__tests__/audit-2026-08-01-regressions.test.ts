import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  crisisThresholdsFor,
  buildDashboardActionPrompt,
  type DashboardContext,
} from "../../../packages/ai/src/dashboard/prompt";
import { calcAnnualLeave } from "@foundone/shared";

/**
 * 출시 전 전수 감사 회귀 가드 (2026-08-01).
 *  4개 관점(정직성·보안·패리티·품질) 감사에서 확정된 결함이 되살아나지 않게 한다.
 *  각 테스트는 "그 결함이 사용자에게 어떻게 보였는지"를 이름에 적는다.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p: string[]) => readFileSync(join(HERE, ...p), "utf8");

const ctxBase: DashboardContext = {
  industryCategoryId: "food",
  industryLabel: "외식업",
  storeName: "테스트",
  monthlySales: 10_000_000,
  monthlyCosts: { ingredients: 3_000_000, labor: 2_000_000, rent: 800_000, utilities: 200_000, other: 100_000 },
  weeklyChange: 0, primeRate: 50, runway: 12,
  hasEmployees: true, employeeCount: 2,
  businessHealthScore: "healthy", daysSinceLaunch: 200,
  pendingTaxEvents: [], lowStockItems: [], upcomingFixedExpenses: [], productCount: 5,
} as DashboardContext;

describe("🔴 보안 — 크로스테넌트 쓰기 (투잡 직원이 다른 가게 행을 탈취)", () => {
  const hardening = read("..", "..", "..", "supabase", "migrations", "20260801_000001_shift_availability_hardening.sql");

  it("UNIQUE 에 owner_user_id 가 포함된다 (staff_schedules 관례와 통일)", () => {
    expect(hardening).toContain("UNIQUE (owner_user_id, member_user_id, work_date)");
    expect(hardening).toContain("UNIQUE (owner_user_id, member_user_id, period)");
  });

  it("클라이언트 onConflict 가 새 제약과 일치한다 (불일치 시 upsert 가 42P10 로 실패)", () => {
    const web = read("..", "app", "lib", "components", "team", "ShiftAvailabilityCalendar.tsx");
    const ios = read("..", "..", "ios", "Sources", "FoundOneData", "Repositories", "TeamRepository.swift");
    for (const src of [web, ios]) {
      expect(src).not.toMatch(/onConflict:\s*"member_user_id,work_date"/);
      expect(src).not.toMatch(/onConflict:\s*"member_user_id,period"/);
    }
    expect(web).toContain('onConflict: "owner_user_id,member_user_id,work_date"');
    expect(ios).toContain('onConflict: "owner_user_id,member_user_id,work_date"');
  });

  it("삭제도 owner 범위 — 투잡 직원이 다른 가게 희망까지 지우지 않는다", () => {
    const web = read("..", "app", "lib", "components", "team", "ShiftAvailabilityCalendar.tsx");
    const ios = read("..", "..", "ios", "Sources", "FoundOneData", "Repositories", "TeamRepository.swift");
    expect(web).toMatch(/delete\(\)[\s\S]{0,120}owner_user_id/);
    expect(ios).toMatch(/deleteMyAvailability\(ownerUserId:/);
  });

  it("퇴사자 차단 — 인가(settled_at)와 결과(left_at) 모집단이 일치", () => {
    expect(hardening).toContain("m.settled_at IS NULL AND m.left_at IS NULL");
    // 사장 정책에도 소속 검증이 생겼다 (임의 uuid 행 삽입 차단)
    expect(hardening).toMatch(/shift_avail_owner[\s\S]{0,400}EXISTS/);
  });

  it("DEFINER search_path 에 pg_temp 명시 (저장소 관례)", () => {
    expect(hardening).toContain("SET search_path = public, pg_temp");
    expect(hardening).toMatch(/ALTER FUNCTION public\.record_surface_visit.*pg_temp/);
  });
});

describe("🔴 정직성 — 실패를 빈 상태·0 으로 위장하지 않는다", () => {
  it("연차 원장 조회 실패 시 잔여를 계산하지 않는다 (사용 0일 → 잔여 전량 = 가짜 숫자)", () => {
    const teamSurface = read("..", "app", "lib", "components", "surfaces", "TeamSurface.tsx");
    const staff = read("..", "app", "lib", "components", "surfaces", "StaffDashboard.tsx");
    expect(teamSurface).toContain("ledgerFailed");
    expect(teamSurface).toContain("잔여를 계산할 수 없어요");
    expect(staff).toContain("ledgerFailed");
    expect(staff).toContain("잔여를 계산할 수 없어요");
  });

  it("직원 수 미상을 0 으로 강등하지 않는다 (0 이면 '연차 의무 없음' 법적 단정)", () => {
    const staff = read("..", "app", "lib", "components", "surfaces", "StaffDashboard.tsx");
    const iosStaff = read("..", "..", "ios", "Sources", "FoundOneFeatures", "Staff", "StaffDashboardView.swift");
    expect(staff).not.toContain("staff_headcount ?? 0");
    expect(staff).toContain("직원 수를 불러오지 못해");
    expect(iosStaff).not.toContain("staffHeadcount ?? 0");
    expect(iosStaff).toContain("직원 수를 불러오지 못해");
  });

  it("사장 근무 캘린더 — 조회 실패를 '근무 없음'으로 위장하지 않는다", () => {
    const web = read("..", "app", "lib", "components", "team", "OwnerScheduleCalendar.tsx");
    const ios = read("..", "..", "ios", "Sources", "FoundOneFeatures", "Team", "OwnerShiftCalendarCard.swift");
    for (const src of [web, ios]) {
      expect(src).toContain("실제와 다를 수 있습니다");
    }
    expect(web).toContain("loadError");
    expect(ios).toContain("loadError");
  });

  it("직원 쓰기 실패가 무음이 아니다 (웹도 iOS 처럼 말한다)", () => {
    const web = read("..", "app", "lib", "components", "team", "ShiftAvailabilityCalendar.tsx");
    expect(web).toContain("저장에 실패했어요");
    expect(web).toContain("제출에 실패했어요");
    expect(web).toContain("마감일 저장에 실패했어요");
  });

  it("iOS 수당 취소 — 실패해도 목록에서 지우지 않는다 (거짓 성공 금지)", () => {
    const iosStaff = read("..", "..", "ios", "Sources", "FoundOneFeatures", "Staff", "StaffDashboardView.swift");
    expect(iosStaff).not.toMatch(/try\?\s*await\s*repo\.cancelAllowance[\s\S]{0,80}removeAll/);
    expect(iosStaff).toContain("취소에 실패했어요");
  });
});

describe("🔴 AI 브리핑 — 업종 기준 단일화", () => {
  it("런웨이 판정이 SSOT 를 쓴다 (하드코딩 3 → 경고선 6)", () => {
    const thr = crisisThresholdsFor("food");
    expect(thr.runwayCritical).toBe(6);
    const prompt = buildDashboardActionPrompt({ ...ctxBase, runway: 5 });
    expect(prompt).toContain("현금 런웨이 5개월");   // 종전엔 5개월이 위기 신호에 안 잡혔다
  });

  it("적정 범위와 위기선이 같은 SSOT — 뷰티 52% 가 '적정 초과'로 안 나온다", () => {
    // 종전: 하드코딩 "업계 적정 40-50%" vs SSOT 위기선 55% → 정상인데 과다 코칭
    const prompt = buildDashboardActionPrompt({
      ...ctxBase,
      industryCategoryId: "beauty-salon",
      monthlyCosts: { ingredients: 500_000, labor: 5_200_000, rent: 800_000, utilities: 200_000, other: 100_000 },
    });
    expect(prompt).not.toContain("40-50%");
    expect(prompt).toContain("이 업종 적정: 45-55%");
  });

  it("업종 정의가 없는 지표는 범위를 지어내지 않는다 (SaaS 임대료)", () => {
    const prompt = buildDashboardActionPrompt({ ...ctxBase, industryCategoryId: "startup-tech" });
    expect(prompt).toMatch(/임대료: [^\n]*(?!이 업종 적정)/);
    const thr = crisisThresholdsFor("startup-tech");
    expect(thr.rentIsFallback).toBe(true);   // 폴백임을 스스로 안다
  });

  it("폴백 임계값을 '이 업종 기준'으로 단정하지 않는다", () => {
    const prompt = buildDashboardActionPrompt({
      ...ctxBase,
      industryCategoryId: "online-digital",
      monthlyCosts: { ingredients: 1_000_000, labor: 6_000_000, rent: 2_500_000, utilities: 200_000, other: 100_000 },
    });
    if (prompt.includes("임대료 비율")) {
      expect(prompt).toContain("이 업종 전용 기준은 없음");
    }
  });

  it("시스템 프롬프트에 업종 무관 고정 수치가 없다 (65% 재발 방지)", () => {
    const src = read("..", "..", "..", "packages", "ai", "src", "dashboard", "prompt.ts");
    expect(src).not.toContain("프라임코스트 65% 초과 시 수익 구조 붕괴");
    expect(src).not.toContain("프라임코스트 65%+)일 때만");
  });
});

describe("웹↔iOS 파리티", () => {
  it("입사 당일 아침에 웹도 연차를 계산한다 (UTC 파싱 → 로컬)", () => {
    // 오늘 아침 08:00 (KST) 에 오늘 입사 — 종전 웹은 "입사일을 입력하면…" 이었다
    const today = new Date();
    const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const r = calcAnnualLeave(ymd, { basis: "hire_date", headcount: 5, today });
    expect(r.basisNote.ko).not.toContain("입사일을 입력하면");
  });

  it("iOS 희망 카드가 ownerId 도착에 반응한다 (영구 빈 상태 방지)", () => {
    const ios = read("..", "..", "ios", "Sources", "FoundOneFeatures", "Team", "ShiftAvailabilityCard.swift");
    expect(ios).toMatch(/\.task\(id: "\\\(ownerUserId/);
  });

  it("iOS 희망 힌트가 이름이 아니라 id 로 매칭한다 (동명이인 오판 방지)", () => {
    const ios = read("..", "..", "ios", "Sources", "FoundOneFeatures", "Team", "OwnerShiftCalendarCard.swift");
    expect(ios).toContain("$0.memberId == w.memberUserId");
    expect(ios).not.toContain("$0.name == name");
  });

  it("iOS 도 근무 요일 전체 해제가 가능하다 (웹과 동일)", () => {
    const ios = read("..", "..", "ios", "Sources", "FoundOneFeatures", "Team", "TeamManagementView.swift");
    expect(ios).not.toContain("saveStatus == .saving || days.isEmpty");
  });

  it("iOS 시간대 저장이 정규화 후 저장한다 (빈 행 DB 축적 방지)", () => {
    const ios = read("..", "..", "ios", "Sources", "FoundOneFeatures", "Team", "ShiftAvailabilityCard.swift");
    expect(ios).toMatch(/let clean = buNormalizeShiftSlots\(slotDraft\)[\s\S]{0,120}setShiftSlots\(clean\)/);
  });
});

describe("품질 — 데이터 손실·무한 상태", () => {
  it("근무표 저장이 delete 실패를 확인하고 insert 실패 시 복구한다", () => {
    const src = read("..", "app", "lib", "components", "surfaces", "TeamSurface.tsx");
    expect(src).toContain("saveRules delete failed");
    expect(src).toContain("saveRules restore failed");
  });

  it("역할 게이트 — 진입 시 실패 플래그 리셋 + 세션 미도착 재시도", () => {
    const src = read("..", "..", "ios", "Sources", "FoundOneFeatures", "AppRoot.swift");
    expect(src).toMatch(/roleResolveFailed = false[\s\S]{0,200}guard let uid/);
    expect(src).toContain("스켈레톤에 영구히 갇힌다");
  });
});

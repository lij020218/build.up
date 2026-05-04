"use client";

/**
 * MyStoreView — "내 가게" 페이지.
 *
 * 회계·정적 정보 관점 — 운영 대시보드와 분리.
 * AI 호출 0 — 모두 사장 입력 + 정적 schema lookup + 산수.
 *
 * 구성:
 *   1) Hero At-a-Glance (사진 + 업종 + 위치 + 운영 N일째 + 핵심 6숫자)
 *   2) D-Day 통합 위젯 (sticky 우상단)
 *   3) Financial Snapshot (누적·분기·잔고·런웨이)
 *   4) 공통 코어 5섹션 (Identity / Legal / Money / People / Insurance)
 *   5) Footprint (오프라인=임대차, 온라인=도메인, 출장형=차량)
 *   6) 카테고리별 동적 섹션 (11개 카테고리)
 *   7) Sticky 좌측 TOC
 */

import { useMemo } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { useStoreInfoStore } from "../../stores/store-info-store";
import { HeroAtAGlance } from "../my-store/HeroAtAGlance";
import { FinancialSnapshotSection } from "../my-store/FinancialSnapshotSection";
import { SectionRenderer } from "../my-store/SectionRenderer";
import type { DDayItem } from "../my-store/DDayWidget";
import { StickyTOC } from "../my-store/StickyTOC";
import { useStoreInfoSaver } from "../my-store/useStoreInfoSaver";
import {
  COMMON_SECTIONS_PRIMARY,
  resolveCategorySections,
  resolveSubIndustryModifier,
  resolveFootprintSection,
  type CategoryId,
  type SectionSpec,
} from "../../data/store-info-schema";
import { PALETTE } from "../my-store/styles";

type DailyEntry = { date: string; sales: number; customers: number };

function fmtWonShort(n: number): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`;
  return `${n.toLocaleString()}원`;
}

export function MyStoreView() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const si = useStoreInfoStore();

  // 모든 변경 → 600ms debounce → flushStoreDataImmediate (Supabase 즉시 저장).
  // persistStatus 가 saving → saved/error 로 사용자에게 자동 노출.
  useStoreInfoSaver(d.flushStoreDataImmediate as undefined | (() => Promise<void>));

  const categoryId = (d.industryCategoryId ?? "") as CategoryId;
  const subIndustryId = (d.selectedIndustryId ?? "") as string;
  const businessModelId = (d.selectedBusinessModelId ?? "") as string;
  const subMod = resolveSubIndustryModifier(subIndustryId);

  // Hero metrics — 산수만
  const dailyEntries = (d.dailyEntries ?? []) as DailyEntry[];
  const monthlyCosts = (d.monthlyCosts ?? null) as Record<string, number> | null;
  const totalCapital = ((d.selectedBudget as number | undefined) ?? 0) + ((d.initialOperatingCapital as number | undefined) ?? 0);
  const cumulativeSales = useMemo(() => dailyEntries.reduce((s, e) => s + (e.sales ?? 0), 0), [dailyEntries]);
  const monthlyBurn = useMemo(() => {
    if (!monthlyCosts) return 0;
    return Object.values(monthlyCosts).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
  }, [monthlyCosts]);
  const balance = si.currentBalanceManualKrw ?? 0;
  const runwayMonths = monthlyBurn > 0 ? balance / monthlyBurn : null;
  const launchDate = (d.businessLaunchedDate as string | null | undefined) ?? null;
  const daysOperating = launchDate
    ? Math.max(0, Math.floor((Date.now() - new Date(launchDate).getTime()) / 86400000))
    : null;

  const employeeCount = si.peopleDirectory.filter((p) => p.kind?.startsWith("employee")).length;
  const vendorCount = si.peopleDirectory.filter((p) => p.kind?.startsWith("vendor")).length;

  // 업종별 한 단어 라벨 (Hero eyebrow용)
  const categoryLabel = useMemo(() => {
    const map: Record<string, string> = {
      food: ko ? "음식점" : "Food",
      "cafe-dessert": ko ? "카페·디저트" : "Café·Dessert",
      retail: ko ? "소매" : "Retail",
      beauty: ko ? "미용·뷰티" : "Beauty",
      fitness: ko ? "피트니스" : "Fitness",
      education: ko ? "교육" : "Education",
      pet: ko ? "반려동물" : "Pet",
      "living-service": ko ? "생활 서비스" : "Living service",
      space: ko ? "공간 임대" : "Space rental",
      "online-digital": ko ? "온라인·디지털" : "Online·Digital",
      "startup-tech": ko ? "스타트업·테크" : "Startup·Tech",
    };
    return map[categoryId] ?? categoryId;
  }, [categoryId, ko]);

  const subIndustryLabel = subMod?.hint ?? subIndustryId;

  // Hero metrics (6칸)
  const heroMetrics = useMemo(() => {
    const items: Array<{ label: string; value: string; tone?: "good" | "warn" | "bad" | "neutral" }> = [
      { label: ko ? "누적 매출" : "Cumul. sales", value: `₩${fmtWonShort(cumulativeSales)}` },
      { label: ko ? "잔고" : "Balance", value: `₩${fmtWonShort(balance)}` },
      {
        label: ko ? "런웨이" : "Runway",
        value: runwayMonths != null ? `${runwayMonths.toFixed(1)}${ko ? "개월" : "mo"}` : "—",
        tone: runwayMonths != null && runwayMonths < 6 ? "bad" : runwayMonths != null && runwayMonths < 12 ? "warn" : "good",
      },
      { label: ko ? "직원" : "Staff", value: `${employeeCount}${ko ? "명" : ""}` },
      { label: ko ? "거래처" : "Vendors", value: `${vendorCount}${ko ? "곳" : ""}` },
    ];
    // 업종별 1지표
    if (categoryId === "food" || categoryId === "cafe-dessert") {
      const menuArr = (si.industrySpecifics["menu-ingredients"] as Array<{ kind?: string }> | undefined) ?? [];
      const menuCount = menuArr.filter((m) => m.kind === "menu" || m.kind === "drink" || m.kind === "dessert").length;
      items.push({ label: ko ? "메뉴" : "Menu", value: `${menuCount}${ko ? "개" : ""}` });
    } else if (categoryId === "retail") {
      const products = (si.industrySpecifics["product-catalog"] as unknown[] | undefined) ?? [];
      items.push({ label: ko ? "상품" : "Products", value: `${products.length}` });
    } else if (categoryId === "fitness") {
      const insArr = (si.industrySpecifics["instructors"] as unknown[] | undefined) ?? [];
      items.push({ label: ko ? "강사" : "Coaches", value: `${insArr.length}${ko ? "명" : ""}` });
    } else if (categoryId === "beauty") {
      const menuArr = (si.industrySpecifics["service-menu"] as unknown[] | undefined) ?? [];
      items.push({ label: ko ? "시술" : "Services", value: `${menuArr.length}` });
    } else if (categoryId === "online-digital") {
      const channels = (si.industrySpecifics["sales-channels"] as unknown[] | undefined) ?? [];
      items.push({ label: ko ? "판매채널" : "Channels", value: `${channels.length}` });
    } else if (categoryId === "startup-tech") {
      const ip = (si.industrySpecifics["ip"] as unknown[] | undefined) ?? [];
      items.push({ label: "IP", value: `${ip.length}` });
    } else {
      items.push({ label: ko ? "보험" : "Insurance", value: `${si.insurancePolicies.length}` });
    }
    return items;
  }, [ko, cumulativeSales, balance, runwayMonths, employeeCount, vendorCount, categoryId, si.industrySpecifics, si.insurancePolicies.length]);

  // 모든 섹션 조립
  const footprintSection = resolveFootprintSection(subMod?.footprintMode);
  const categorySections = resolveCategorySections(categoryId);

  const allSections: SectionSpec[] = useMemo(() => {
    const out: SectionSpec[] = [];
    out.push(...COMMON_SECTIONS_PRIMARY);
    if (footprintSection) out.push(footprintSection);
    out.push(...categorySections);
    return out;
  }, [footprintSection, categorySections]);

  // TOC items — "정체성" 은 한국어로 부자연스럽고 Identity 섹션과 중복되어 "한눈에 보기"로 변경
  const tocItems = useMemo(() => {
    const items: Array<{ id: string; label: string }> = [
      { id: "hero", label: ko ? "한눈에 보기" : "At a glance" },
      { id: "financial", label: ko ? "재무 현황" : "Financial" },
    ];
    for (const s of allSections) {
      items.push({ id: s.id, label: ko ? s.title : s.titleEn ?? s.title });
    }
    return items;
  }, [allSections, ko]);

  // D-Day 모음 — 모든 섹션 trackExpiry 통합
  const ddayItems = useMemo(() => {
    const items: DDayItem[] = [];
    // 인허가
    for (const p of si.permits) {
      if (p.expiresAt) items.push({ sectionId: "legal", sectionLabel: ko ? "법적" : "Legal", itemTitle: p.name, date: p.expiresAt, kindLabel: ko ? "인허가" : "Permit" });
    }
    // 보험
    for (const p of si.insurancePolicies) {
      if (p.expiresAt) items.push({ sectionId: "insurance", sectionLabel: ko ? "보험" : "Insurance", itemTitle: p.name, date: p.expiresAt, kindLabel: ko ? "보험" : "Insurance" });
    }
    // 임대차
    if (si.tenancy.leaseEndDate) {
      items.push({ sectionId: "footprint", sectionLabel: ko ? "임대차" : "Lease", itemTitle: ko ? "임대차 종료" : "Lease end", date: si.tenancy.leaseEndDate, kindLabel: ko ? "임대" : "Lease" });
    }
    // 디지털 (도메인·SaaS·호스팅)
    for (const f of si.digitalFootprint) {
      if (f.expiresAt) items.push({ sectionId: "footprint", sectionLabel: ko ? "디지털 거점" : "Digital", itemTitle: f.name, date: f.expiresAt, kindLabel: f.kind === "domain" ? ko ? "도메인" : "Domain" : ko ? "구독" : "Subscription" });
    }
    // 차량
    for (const v of si.vehicles) {
      if (v.insuranceExpiresAt) items.push({ sectionId: "footprint", sectionLabel: ko ? "차량" : "Vehicle", itemTitle: v.name, date: v.insuranceExpiresAt, kindLabel: ko ? "자동차보험" : "Auto" });
    }
    // 카테고리별 (각 sectionId 의 expiryKey 추적)
    for (const sec of categorySections) {
      if (!sec.arrayItem?.expiryKey) continue;
      const arr = (si.industrySpecifics[sec.id] as Array<Record<string, unknown>> | undefined) ?? [];
      for (const it of arr) {
        const exp = it[sec.arrayItem.expiryKey] as string | undefined;
        const title = it[sec.arrayItem.titleField] as string | undefined;
        if (exp && title) {
          items.push({ sectionId: sec.id, sectionLabel: sec.title, itemTitle: title, date: exp, kindLabel: sec.title });
        }
      }
    }
    return items;
  }, [si.permits, si.insurancePolicies, si.tenancy, si.digitalFootprint, si.vehicles, si.industrySpecifics, categorySections, ko]);

  // ── 객체 형태 섹션 (Identity / Legal / Money / Tenancy 등) — 어떤 store 키에 매핑되는지 ──
  // 각 섹션의 fields 를 store 의 어느 필드로 보낼지 매핑.
  const objectSectionMap: Record<string, { get: () => Record<string, unknown>; set: (key: string, value: unknown) => void }> = {
    identity: {
      get: () => ({
        mission: si.mission,
        shortDescription: si.shortDescription,
        longDescription: si.longDescription,
        addressRoad: si.addressRoad,
        addressDetail: si.addressDetail,
        regionCode: si.regionCode,
        phone: si.phone,
        ownerPhone: si.ownerPhone,
        websiteUrl: si.websiteUrl,
        instagramUrl: si.instagramUrl,
        naverPlaceUrl: si.naverPlaceUrl,
        kakaoPlaceUrl: si.kakaoPlaceUrl,
        weeklyHolidays: si.weeklyHolidays,
        breakTime: si.breakTime,
      }),
      set: (key, value) => si.setField(key as never, value as never),
    },
    legal: {
      get: () => ({
        bizRegistrationNumber: si.bizRegistrationNumber,
        bizRegistrationDate: si.bizRegistrationDate,
        bizRegistrationType: si.bizRegistrationType,
        industryCode: si.industryCode,
        telecomSalesNumber: si.telecomSalesNumber,
        fourInsuranceEstablished: si.fourInsuranceEstablished,
      }),
      set: (key, value) => si.setField(key as never, value as never),
    },
    "money-infra": {
      get: () => ({
        bizBankName: si.bizBankName,
        bizBankAccountMasked: si.bizBankAccountMasked,
        bizCardIssued: si.bizCardIssued,
        posTerminal: si.posTerminal,
        taxHandling: si.taxHandling,
        cpaName: si.cpaName,
        cpaPhone: si.cpaPhone,
      }),
      set: (key, value) => si.setField(key as never, value as never),
    },
    footprint: {
      // tenancy 객체 (오프라인 path)
      get: () => si.tenancy as Record<string, unknown>,
      set: (key, value) => si.setField("tenancy", { ...si.tenancy, [key]: value } as never),
    },
  };

  // 배열 형태 섹션 매핑
  type ArrayKey = "permits" | "insurancePolicies" | "peopleDirectory" | "digitalFootprint" | "vehicles";
  const arraySectionMap: Record<string, ArrayKey | "industrySpecifics"> = {
    legal: "permits",
    insurance: "insurancePolicies",
    people: "peopleDirectory",
  };

  // Footprint 가 array (digital 또는 mobile) 일 때 처리
  const footprintIsArray = footprintSection?.arrayItem !== undefined;
  if (footprintIsArray) {
    if (subMod?.footprintMode === "digital") arraySectionMap["footprint"] = "digitalFootprint";
    else if (subMod?.footprintMode === "mobile") arraySectionMap["footprint"] = "vehicles";
  }

  // 카테고리 섹션 — industrySpecifics 안에 저장.
  // ⚠️ 직접 setState 대신 functional 헬퍼 사용 (stale closure 0 — 빠른 연속 입력에서 손실 없음)
  const getIndustryArray = (sectionId: string): Array<Record<string, unknown> & { id: string }> => {
    const v = si.industrySpecifics[sectionId];
    return Array.isArray(v) ? (v as Array<Record<string, unknown> & { id: string }>) : [];
  };

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start", maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
      {/* 좌측 sticky TOC (1100+ 만 노출) */}
      <div className="my-store-toc" style={{ display: "none" }}>
        <StickyTOC items={tocItems} ko={ko} />
      </div>

      {/* 메인 컨텐츠 */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const, gap: 18 }}>
        {/* Hero — 저장 상태 + D-Day 모두 Hero 카드 안 우상단으로 통합 (TOC 와 같은 y=0 시작) */}
        <div id="hero">
          <HeroAtAGlance
            ko={ko}
            storeName={(d.storeName as string) ?? ""}
            mission={si.mission}
            shortDescription={si.shortDescription}
            categoryLabel={categoryLabel}
            subIndustryLabel={subIndustryLabel}
            businessModelLabel={businessModelId}
            addressRoad={si.addressRoad}
            addressDetail={si.addressDetail}
            openTime={(d.businessOpenTime as string | null | undefined) ?? null}
            closeTime={(d.businessCloseTime as string | null | undefined) ?? null}
            daysOperating={daysOperating}
            launchDate={launchDate}
            storePhotos={si.storePhotos}
            metrics={heroMetrics}
            saveStatus={d.persistStatus as "idle" | "saving" | "saved" | "error" | undefined}
            saveLastSavedAt={d.persistLastSavedAt as string | null | undefined}
            saveError={d.persistError as string | null | undefined}
            ddayItems={ddayItems}
          />
        </div>

        {/* Financial Snapshot */}
        <FinancialSnapshotSection
          ko={ko}
          dailyEntries={dailyEntries}
          monthlyCosts={monthlyCosts}
          totalCapitalKrw={totalCapital}
          currentBalanceManualKrw={si.currentBalanceManualKrw}
          currentBalanceUpdatedAt={si.currentBalanceUpdatedAt}
          launchDate={launchDate}
          onUpdateBalance={(krw) => {
            si.setField("currentBalanceManualKrw", krw);
            si.setField("currentBalanceUpdatedAt", new Date().toISOString());
          }}
        />

        {/* 모든 섹션 동적 렌더 */}
        {allSections.map((section) => {
          const isObj = !!section.fields;
          const isArr = !!section.arrayItem;
          const objMap = objectSectionMap[section.id];
          const arrKey = arraySectionMap[section.id];

          // 카테고리 섹션은 industrySpecifics 에 저장
          const isCategorySection = !arrKey && !objMap && section.arrayItem !== undefined;

          // 권장 prefill (Insurance · Legal 만)
          const recommendedPrefills = section.id === "insurance"
            ? subMod?.recommendedInsurance?.map((p) => ({ name: p.name, type: p.type, helper: p.helper }))
            : section.id === "legal"
              ? subMod?.recommendedPermits?.map((p) => ({ name: p.name, helper: p.helper }))
              : undefined;

          if (isObj && objMap) {
            return (
              <SectionRenderer
                key={section.id}
                section={section}
                ko={ko}
                objectValue={objMap.get()}
                onObjectFieldChange={(k, v) => objMap.set(k, v)}
              />
            );
          }

          if (isArr && arrKey && arrKey !== "industrySpecifics") {
            const value = (si[arrKey] as Array<Record<string, unknown> & { id: string }>);
            return (
              <SectionRenderer
                key={section.id}
                section={section}
                ko={ko}
                arrayValue={value}
                onArrayAdd={(item) => si.addArrayItem(arrKey, item as never)}
                onArrayUpdate={(id, patch) => si.updateArrayItem(arrKey, id, patch as never)}
                onArrayRemove={(id) => si.removeArrayItem(arrKey, id)}
                recommendedPrefills={recommendedPrefills}
              />
            );
          }

          if (isCategorySection) {
            const value = getIndustryArray(section.id);
            return (
              <SectionRenderer
                key={section.id}
                section={section}
                ko={ko}
                arrayValue={value}
                onArrayAdd={(item) => si.addIndustryArrayItem(section.id, item)}
                onArrayUpdate={(id, patch) => si.updateIndustryArrayItem(section.id, id, patch)}
                onArrayRemove={(id) => si.removeIndustryArrayItem(section.id, id)}
              />
            );
          }

          // Object section (예: space-spec) — industrySpecifics 안에 객체로 저장
          if (section.fields && !objMap) {
            const value = (si.industrySpecifics[section.id] as Record<string, unknown> | undefined) ?? {};
            return (
              <SectionRenderer
                key={section.id}
                section={section}
                ko={ko}
                objectValue={value}
                onObjectFieldChange={(k, v) => si.setIndustrySpecific(section.id, { ...value, [k]: v })}
              />
            );
          }

          return null;
        })}

        {/* 페이지 푸터 — 회계 관점 안내 */}
        <div style={{
          padding: "20px 22px",
          borderRadius: 14,
          background: PALETTE.SUBTLE,
          border: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
          fontSize: 12,
          color: PALETTE.MUTED,
          lineHeight: 1.6,
          fontWeight: 500,
        }}>
          {ko
            ? "이 페이지의 모든 정보는 사장님이 직접 입력하신 정적 데이터로 구성되며, AI 호출 없이 산수와 룰 기반으로 동작합니다. 매일 보는 운영 KPI는 운영 대시보드에서 확인하세요."
            : "All info on this page is your direct input — pure data + rules + arithmetic. No AI calls. For daily operational KPIs, see the Operations Dashboard."}
        </div>
      </div>

      {/* 반응형: 1100+ 일 때 TOC 표시 */}
      <style jsx>{`
        @media (min-width: 1100px) {
          :global(.my-store-toc) {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

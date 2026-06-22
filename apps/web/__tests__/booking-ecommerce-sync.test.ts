/**
 * booking-store / ecommerce-store ↔ user_store_data 동기화 검증.
 *
 *  배경: 두 store 의 사장님 입력 데이터는 별도 DB 컬럼 없이 industry_specifics(jsonb)의
 *  예약 키 __bookings / __ecommerce 에 nest 해 동기화한다 (마이그레이션 0).
 *  핵심 불변식:
 *    1. 데모(isDemo) 데이터는 서버로 동기화되지 않는다 (가짜 숫자 금지).
 *    2. 실데이터 add 시 데모는 자동 제거된다.
 *    3. hydrate 는 서버 실데이터로 store 를 교체한다 (서버 = SSOT).
 *    4. collect→apply 라운드트립에서 예약 키가 보존되고, 삭제(빈 배열)도 반영된다.
 *    5. storeDataReadyRef(includeEmpties) 가드 — 로드 전엔 예약 키를 보내지 않아
 *       다른 기기의 빈 상태가 서버를 덮어쓰지 않는다.
 *
 *  store action 들은 self-contained Zustand 라 실제로 import 해 검증한다.
 *  collect/apply 의 nesting 변환부는 usePersistence.ts(React 전용 hook) 의 *순수 로직* 을
 *  미러한다 — 변경 시 usePersistence.ts:collectStoreData / applyStoreData 와 동기화 필요.
 */

// ⚠️ store import 보다 *먼저* — persist 가 모듈 로드 시점에 localStorage 를 캡처하므로.
import "./_install-localstorage";
import { beforeEach, describe, expect, it } from "vitest";
import { useBookingStore } from "../app/lib/stores/booking-store";
import { useEcommerceStore } from "../app/lib/stores/ecommerce-store";

beforeEach(() => {
  useBookingStore.getState().clearAll();
  useEcommerceStore.getState().clearAll();
});

describe("booking-store 동기화 불변식", () => {
  it("seedDemo 항목은 isDemo:true 로 마킹된다", () => {
    useBookingStore.getState().seedDemo("beauty");
    const { bookings, providers } = useBookingStore.getState();
    expect(bookings.length).toBeGreaterThan(0);
    expect(bookings.every((b) => b.isDemo === true)).toBe(true);
    expect(providers.every((p) => p.isDemo === true)).toBe(true);
  });

  it("실제 예약 add 시 데모 항목이 자동 제거된다", () => {
    useBookingStore.getState().seedDemo("beauty");
    useBookingStore.getState().addBooking({
      date: "2026-06-22", time: "10:00", customerName: "김사장",
      service: "컷", price: 30000, status: "confirmed", source: "phone",
    });
    const { bookings } = useBookingStore.getState();
    expect(bookings.some((b) => b.isDemo)).toBe(false);
    expect(bookings).toHaveLength(1);
    expect(bookings[0].customerName).toBe("김사장");
  });

  it("hydrate 는 서버 실데이터로 통째 교체한다", () => {
    useBookingStore.getState().seedDemo("beauty");
    useBookingStore.getState().hydrate(
      [{ id: "s1", date: "2026-06-01", time: "09:00", customerName: "서버고객", service: "펌", price: 80000, status: "completed", source: "phone", createdAt: "2026-06-01T00:00:00Z" }],
      [{ id: "sp1", name: "서버디자이너", role: "디자이너", isActive: true }],
    );
    const { bookings, providers } = useBookingStore.getState();
    expect(bookings).toHaveLength(1);
    expect(bookings[0].id).toBe("s1");
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe("sp1");
  });
});

describe("ecommerce-store 동기화 불변식", () => {
  it("seedDemo 항목은 isDemo:true 로 마킹된다", () => {
    useEcommerceStore.getState().seedDemo();
    const { adSpends, returns } = useEcommerceStore.getState();
    expect(adSpends.length).toBeGreaterThan(0);
    expect(adSpends.every((a) => a.isDemo === true)).toBe(true);
    expect(returns.every((r) => r.isDemo === true)).toBe(true);
  });

  it("실제 광고비 add 시 데모 항목이 자동 제거된다", () => {
    useEcommerceStore.getState().seedDemo();
    useEcommerceStore.getState().addAdSpend({
      date: "2026-06-22", channel: "naver", spend: 10000, conversions: 1, conversionValue: 30000,
    });
    const { adSpends } = useEcommerceStore.getState();
    expect(adSpends.some((a) => a.isDemo)).toBe(false);
    expect(adSpends).toHaveLength(1);
  });

  it("clearDemo 는 데모만 제거하고 실데이터는 보존한다", () => {
    useEcommerceStore.getState().seedDemo();
    useEcommerceStore.getState().addReturn({ date: "2026-06-22", orderAmount: 5000, reason: "변심" });
    // addReturn 이 데모 returns 를 제거하므로, 데모 adSpends 만 남아있는 상태에서 clearDemo
    useEcommerceStore.getState().clearDemo();
    const { adSpends, returns } = useEcommerceStore.getState();
    expect(adSpends).toHaveLength(0);
    expect(returns).toHaveLength(1);
    expect(returns[0].reason).toBe("변심");
  });
});

/**
 * usePersistence.ts:collectStoreData / applyStoreData 의 nesting 변환 미러.
 *  변경 시 양쪽 같이 수정 필요.
 */
type IndSpec = Record<string, unknown>;

/** collectStoreData 의 industrySpecifics 병합부 (includeEmpties=true 분기) 미러 */
function collectIndustrySpecifics(baseIndSpec: IndSpec): IndSpec {
  const bs = useBookingStore.getState();
  const es = useEcommerceStore.getState();
  return {
    ...baseIndSpec,
    __bookings: {
      bookings: bs.bookings.filter((b) => !b.isDemo),
      providers: bs.providers.filter((p) => !p.isDemo),
    },
    __ecommerce: {
      adSpends: es.adSpends.filter((a) => !a.isDemo),
      returns: es.returns.filter((r) => !r.isDemo),
    },
  };
}

/** applyStoreData 의 예약 키 추출 + store-info 정리부 미러 */
function applyIndustrySpecifics(indSpec: IndSpec): { cleanIndSpec: IndSpec } {
  const bk = indSpec.__bookings as { bookings?: unknown[]; providers?: unknown[] } | undefined;
  if (bk && typeof bk === "object") {
    useBookingStore.getState().hydrate(
      (Array.isArray(bk.bookings) ? bk.bookings : []) as never,
      (Array.isArray(bk.providers) ? bk.providers : []) as never,
    );
  }
  const ec = indSpec.__ecommerce as { adSpends?: unknown[]; returns?: unknown[] } | undefined;
  if (ec && typeof ec === "object") {
    useEcommerceStore.getState().hydrate(
      (Array.isArray(ec.adSpends) ? ec.adSpends : []) as never,
      (Array.isArray(ec.returns) ? ec.returns : []) as never,
    );
  }
  const cleanIndSpec = { ...indSpec };
  delete cleanIndSpec.__bookings;
  delete cleanIndSpec.__ecommerce;
  return { cleanIndSpec };
}

describe("collect → apply 라운드트립", () => {
  it("실데이터만 예약 키에 nest 되고, 기존 industrySpecifics 섹션은 보존된다", () => {
    useBookingStore.getState().seedDemo("beauty");
    useBookingStore.getState().addBooking({
      date: "2026-06-22", time: "10:00", customerName: "실고객", service: "컷", price: 30000, status: "confirmed", source: "phone",
    });
    const out = collectIndustrySpecifics({ "menu-ingredients": [{ id: "x", name: "양파" }] });
    // 기존 섹션 보존
    expect(out["menu-ingredients"]).toEqual([{ id: "x", name: "양파" }]);
    // 데모 제외, 실데이터만
    const nested = out.__bookings as { bookings: unknown[] };
    expect(nested.bookings).toHaveLength(1);
  });

  it("다른 기기에서 apply 하면 store 가 서버 실데이터로 복원되고 store-info 는 예약 키를 갖지 않는다", () => {
    // 기기 A: 실데이터 입력 후 collect
    useBookingStore.getState().addBooking({
      date: "2026-06-22", time: "10:00", customerName: "A고객", service: "컷", price: 30000, status: "confirmed", source: "phone",
    });
    useEcommerceStore.getState().addAdSpend({ date: "2026-06-22", channel: "naver", spend: 10000, conversions: 1, conversionValue: 30000 });
    const serverIndSpec = collectIndustrySpecifics({ "menu-ingredients": [] });

    // 기기 B: 빈 상태에서 apply
    useBookingStore.getState().clearAll();
    useEcommerceStore.getState().clearAll();
    const { cleanIndSpec } = applyIndustrySpecifics(serverIndSpec);

    expect(useBookingStore.getState().bookings).toHaveLength(1);
    expect(useBookingStore.getState().bookings[0].customerName).toBe("A고객");
    expect(useEcommerceStore.getState().adSpends).toHaveLength(1);
    // store-info 의 industrySpecifics 에는 예약 키가 들어가지 않는다 (오염 방지)
    expect(cleanIndSpec.__bookings).toBeUndefined();
    expect(cleanIndSpec.__ecommerce).toBeUndefined();
    expect(cleanIndSpec["menu-ingredients"]).toEqual([]);
  });

  it("마지막 항목 삭제(빈 배열)도 동기화돼 다른 기기에서 비워진다", () => {
    // 기기 A: 비운 상태 collect → 빈 배열 전송
    const serverIndSpec = collectIndustrySpecifics({});
    expect((serverIndSpec.__bookings as { bookings: unknown[] }).bookings).toHaveLength(0);

    // 기기 B: 로컬에 데이터가 있어도 apply 하면 비워진다 (삭제 반영)
    useBookingStore.getState().addBooking({
      date: "2026-06-22", time: "10:00", customerName: "오래된", service: "컷", price: 30000, status: "confirmed", source: "phone",
    });
    applyIndustrySpecifics(serverIndSpec);
    expect(useBookingStore.getState().bookings).toHaveLength(0);
  });
});

/**
 * Zustand persist 미들웨어용 localStorage in-memory 폴리필.
 *
 *  persist 의 createJSONStorage 는 store *모듈 로드 시점* 에 localStorage 참조를 1회 캡처한다.
 *  따라서 store import 보다 먼저 실행돼야 한다 — 테스트 파일 최상단에서 *side-effect import*
 *  (`import "./_install-localstorage"`) 로 store import 앞에 둘 것. (ESM 은 import 를 소스 순서로 평가.)
 *
 *  happy-dom 의 기본 localStorage 가 setItem 을 제대로 구현 안 하는 경우가 있어 무조건 교체한다.
 */
const mem = new Map<string, string>();
const shim = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, String(v)); },
  removeItem: (k: string) => { mem.delete(k); },
  clear: () => { mem.clear(); },
  key: (i: number) => Array.from(mem.keys())[i] ?? null,
  get length() { return mem.size; },
} as Storage;

Object.defineProperty(globalThis, "localStorage", { value: shim, configurable: true, writable: true });

export {};

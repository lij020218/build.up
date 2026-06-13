# 상권 추천(market-recommend) 로직 전수 점검 — 2026-06-11

> 대상: `apps/web/app/api/data/market-recommend/route.ts` (683줄) + 호출처
> `LocationCandidatesStage.tsx`. **웹 전용 기능** (iOS는 별도 정적 구현 — 아래 §7).

---

## 1. 한 줄 요약

사용자가 입력한 "희망 지역" → **Kakao Local API로 주변 동(洞) 후보를 실시간 발굴** → 각 후보의 경쟁·유동·접근성 메트릭 수집 → **LLM(gpt-5.4-mini)이 5축 프레임워크로 0~100점 점수·이유·경고 생성**. 정적 데이터가 아니라 라이브 호출 기반이라 "어느 지역이든" 동작하는 게 설계 의도.

---

## 2. 호출 경로 (API 계약)

- **호출처**: `LocationCandidatesStage.tsx:113` — 로드맵 "입지 후보" 단계에서 `POST /api/data/market-recommend` (Bearer 토큰).
- **요청**: `{ region, categoryId, subIndustryId?, capital?, language }`
- **응답(성공)**: `{ ok:true, items: RecommendationItem[], centerLat, centerLng, source:"kakao+ai", tookMs, cache }`
  - 각 item: `id, title, score(0~100), summary, reasons[], warnings[], meta{districtName,lat,lng,competitionCount,cafeCount,subwayCount,cultureCount}, freshness{Kakao+AI 출처·날짜}`
- **에러**: 400(region 없음/JSON오류) · 404(지오코딩 실패/후보 0) · 500(키 없음) · 502(LLM 실패). 클라이언트는 에러 문구를 그대로 표시하고 **무관한 정적 추천으로 폴백하지 않음**(과거 "봉은사 검색→창동 추천" 버그는 수정됨).

---

## 3. 파이프라인 (5단계)

| 단계 | 함수 | 동작 |
|---|---|---|
| 0. 게이트 | POST | requireApiUser → rate limit(분10·일50) → body 파싱 → 키 확인(Kakao·LLM) |
| ① 지오코딩 | `geocodeRegion` | 지역명 → 좌표. 변형 순차 시도(원문 / "서울 "+ / "+역") → address 검색 → keyword 검색 → 마지막 토큰. 최대 ~9 Kakao 호출 |
| ② 후보 발굴 | `discoverSubAreas` | 중심 3km 반경 category(CE7/FD6/SW8) + keyword(맛집/거리) 검색 → **동 단위 클러스터** → 중심 가까운 순 최대 6개. 1개 이하면 5km fallback, 그래도 0이면 입력지역 단일 후보 |
| ③ 메트릭 | `gatherMetrics` | 후보별(최대 5개) 500m 반경 4종 병렬 검색: 동종업종 경쟁·카페밀도(유동proxy)·지하철(접근성)·문화시설(앵커) |
| ④ 점수화 | `scoreWithClaude` | LLM에 5축 프레임워크 system + 후보 메트릭 user → JSON 배열(점수·이유·경고) |
| ⑤ 정리 | POST | ScoredItem → RecommendationItem(좌표·메트릭·freshness 포함) → 응답 |

**Kakao 호출량(최악)**: 지오코딩 ~9 + 발굴 ~7 + 메트릭 4×5=20 ≈ **요청당 최대 ~36회**.

---

## 4. 데이터 소스

- **Kakao Local API** (`dapi.kakao.com/v2/local`): address/keyword/category 검색. ⚠️ `KA` 헤더 필수(`sdk/1.0.0 os/javascript origin/<NEXT_PUBLIC_APP_URL>`) — 2025+ 정책.
- **LLM**: `claude-sonnet-4-6` 명목 → 어댑터가 **gpt-5.4-mini**로 매핑(실호출 확인). 점수·이유·경고 생성.
- **키**: `KAKAO_REST_API_KEY`, `getAnthropicApiKey()`(=OPENAI 우선). 둘 다 `getEnvVar`(.env.local 폴백) 사용.

---

## 5. 점수화 로직 (5축 + 임대료 밴드)

LLM system 프롬프트에 인코딩된 도메인 규칙:
1. **경쟁 강도**(500m 동종업종): 0~3 미성숙(60점+위험) / 4~15 적정 / 16~35 활성(차별화) / 36~60 과밀(-10~15) / 61+ 레드오션(-20)
2. **유동 proxy**(카페밀도): 30+ +10 / 10~29 +5 / 5~9 ±0 / 0~4 -5~10
3. **접근성**(지하철): 1+ +5 / 0 ±0
4. **앵커**(문화시설): 5+ +5 / 1~4 ±0 / 0 -3(앵커 의존업종만)
5. **업종-입지 적합성**(정성): 미용=주거+상권혼합, 학원=주거+학교, 펫=주거, 숙박=관광·역세권 등
- **임대료 밴드**: 1군(800만+ 강남·홍대·성수)/2군(300~700 망원·연남)/3군(100~250 일반주거). 자본금<1억+1군=warning, 자본금 3억+3군=warning.
- 출력: 점수순 정렬, districtName 에코(매칭키), 점수 0~100 클램프.

---

## 6. 비용·쿼터·캐싱

- **레이트 리밋**: 분당 10 / 일 50 (사용자별). 어뷰즈는 막으나 **한 사용자가 여러 지역 비교 시 빠르게 소진** 가능.
- **결과 캐싱 없음**: 매 호출마다 Kakao ~36회 + LLM 1회 풀 재실행. 같은 (지역,업종) 반복 호출도 캐시 안 됨.
- **프롬프트 캐싱 — ⚠️ 현재 무효(아래 §8-2)**.

---

## 7. iOS 패리티 — ⚠️ 갭

이 기능은 **웹 전용**입니다. iOS는 `MarketDistrictRegistry.swift`(정적 행정동 데이터)를 쓰고 이 엔드포인트를 **호출하지 않음**. 즉 웹=Kakao+AI 라이브, iOS=정적. 웹↔iOS 패리티 원칙상 갭이나, iOS가 이 엔드포인트를 부르도록 하는 게 정공법(출시 후 작업 가능).

---

## 8. 점검 결과

### ✅ 정상 / 잘 된 점
- 인증·레이트리밋(분/일 이중)·키 graceful 가드 정상.
- 에러 상태 정직(404/502) + **무관한 정적 폴백 제거됨**("봉은사→창동" 버그 해소 확인).
- 그라운딩: LLM에 "메트릭 숫자 인용 / 임의 생성 금지" 지시, districtName 에코, 점수 클램프, freshness 출처(Kakao) 표기.
- 지오코딩 견고: 도시 prefix·역 키워드·마지막 토큰 등 다중 변형 fallback.

### ✅ 직전 수정 (2026-06-11, 라이브 검증)
- **`region_3depth_name` 의존 → 후보 발굴 100% 무작동** 버그. Kakao가 더 이상 그 필드를 안 줘서 항상 입력지역 1개로만 떨어지던 조용한 고장. `districtKeyFromPlace`(address_name 동 추출)로 복구 → 강남역 → 5개 동 후보 정상 발굴 확인.

### 🔴 출시 전 반드시 확인 (prod 차단 위험)
- **KA 헤더 origin = `NEXT_PUBLIC_APP_URL`** → 이 도메인이 **Kakao 개발자 콘솔에 등록돼 있지 않으면 prod에서 전 호출 401** → 상권추천 전체 무작동. 현재 콘솔엔 localhost만 등록(LAUNCH_CHECKLIST 기재). **`foundone.dev`·`www.foundone.dev` 등록 + `NEXT_PUBLIC_APP_URL=https://foundone.dev` 설정 필수.**

### ⚠️ 개선 권장 (출시 후 가능)
1. **죽은 프롬프트 캐싱 + 거짓 텔레메트리**: 코드는 `cache_control:{ephemeral}` + `cache_creation/read_input_tokens`를 읽고 주석에 "Sonnet 4.6 / 90% 절감"이라 적었으나, 실제론 gpt-5.4-mini(어댑터)라 `cache_control` 무시·캐시 토큰 항상 0. 기능엔 무해하나 "90% 절감"은 사실 아님. → 주석·텔레메트리 정리(OpenAI 자동 프롬프트 캐싱은 별개로 일부 적용될 수 있음).
2. **결과 캐싱 부재**: (region,category) 단위 짧은 TTL 캐시 추가하면 Kakao 쿼터·LLM 비용·지연 크게 절감.
3. **메트릭 집계 불일치**: 경쟁·카페는 `meta.pageable_count`(15 초과 가능), 지하철·문화는 `documents.length`(size=15 캡). 500m라 보통 문제 없으나 캡 일관화 권장. pageable_count 자체도 Kakao 근사치.
4. **LLM districtName 매칭 취약**: 점수 결과를 `districtName` 정확 일치로 후보에 매핑, 불일치 시 `candidates[0]` 폴백 → 메트릭·좌표 오배정 가능(낮은 확률). id 기반 매칭이 더 안전.
5. **stale 주석**: 파일 전반 "Claude/Anthropic/Sonnet" 언급이 실제 OpenAI와 불일치(코스메틱).
6. **iOS 패리티**(§7).

---

## 9. 결론

핵심 파이프라인(지오코딩→발굴→메트릭→AI점수)은 견고하고, 직전 발굴 버그도 수정·라이브 검증됨. **출시 차단 리스크는 단 하나 — Kakao 콘솔 도메인 등록 + `NEXT_PUBLIC_APP_URL`**(없으면 prod 401). 나머지(캐싱·텔레메트리·iOS 패리티)는 출시 후 개선 항목.

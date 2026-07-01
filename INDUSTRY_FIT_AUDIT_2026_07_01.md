# 로드맵 업종 정합 전수 감사 (2026-07-01)

전 스테이지(웹 69파일)를 4개 병렬 에이전트로 감사. "여러 업종 공통 노출인데 특정 업종(외식/SW 등)으로 하드코딩된 사용자 텍스트"만 수집.

기준: 업종 조건(`industryCategoryId`/`offlineKind`/`cluster`/`selectedIndustryId`) 게이팅 없고 specialty-override(resolveSpecialtyKeyAction)도 없는 사용자 노출 텍스트.

---

## 🔴 HIGH

### 초기 선택 단계 (전 업종 공통 — 노출도 최상)
- `selection/IndustrySelectionStage.tsx:205-206` — KeyActionHero "입지·**메뉴**·인허가·세무" (업종 고르기 **전** 노출). → "메뉴"→"운영".
- `selection/BusinessModelSelectionStage.tsx` StageWrapup(≈271,277,279,281) — "시그니처 메뉴·서비스"/"식자재 원가율 30%"/"객단가×회전수×영업일수"/"배달 배민·쿠팡이츠 차등수수료". 전 업종 노출. → 범용화 or industryCategoryId 분기.
- `selection/LocationCandidatesStage.tsx:336` — 면적 "테이블 6~10개·홀 직원" 계산(외식). 전 오프라인 노출. → 업종 분기.
- `selection/LocationCandidatesStage.tsx:340-343` — "음식점·카페는 외부 환기 덕트 필수" 무조건 노출. → food/cafe 게이팅.
- `selection/LocationCandidatesStage.tsx:1174,1176` — 마무리 "메뉴"·"음식점 용도지역". → 범용화/분기.

### 오프라인 대형 병소
- `offline/OperationsSetupStage.tsx` — keyActions[0](259 배민·쿠팡 입점)·whyMatters[0](281 배달 30~50%)·howFlow[0]/whatNeeded[0](339~ 배민·메뉴 사진·식품접객업)·renderPos(1090 메뉴·배달연동)·stepBridges[0](1185)·최종 StageWrapup(1637~ 배달수수료·위생교육·원산지). opsStep로만 키잉, 업종 무관. → **업종 분기 필요(대)**.

### 공유 가이드 렌더러
- `shared/StageGuideViewer.tsx:1425` — `step3 = beauty?…:fitness?…:step3Food` → 소매·펫·교육·생활·무인이 "식품위생교육 6시간·영업신고"(step3Food) 봄. ⚠️**실사용 여부(StageContentRenderer와 중복?) 확인 후**.
- `shared/StageGuideViewer.tsx:377` — `stepDataMap[cat] ?? stepDataMap["food"]` → space/online/startup이 "CJ프레시웨이 식자재" 공급처 폴백.

### 스타트업 SW 편향 (하드웨어·딥테크에 SW 출시 노출)
- `startup/GoLiveStage.tsx` — 전체가 Vercel·App Store·Google Play·PH·HN. hardware-iot/semiconductor/biotech/robotics/climate에 부적합. 게이팅 없음.
- `startup/MvpBuildStage.tsx:81-160+` — pages 전체 "Next.js·Supabase·Vercel 배포". 딥테크 MVP=프로토타입/테이프아웃/웻랩.
- `startup/LaunchGtmStage.tsx` — 출시스택(Sentry/Vercel)·PH·HN·App Store 매트릭스. 딥테크 GTM=디자인윈·파일럿·규제.

## 🟡 MED
- `offline/VendorSetupStage.tsx` (408~,447,542~,560~) — 데이터는 업종별인데 히어로·섹션명·팁·마무리 "식자재·가스 KC·HACCP·폐기율" 외식 chrome.
- `offline/OperationsSetupStage.tsx:1578-1602` — "음식점·소매업은 법정 신고" 인트로가 뷰티·헬스 등 누락 서술.
- `shared/StageGuideViewer.tsx:48-53` — step4Supplies "마켓컬리·aT 농수산" 무조건.
- `shared/StageGuideViewer.tsx:1073-1075` — 운영 팁 "배민·쿠팡이츠" 무조건.
- `selection/StartupTypeSelectionStage.tsx:139,141,142` — 마무리 "메뉴·식자재·메뉴시연".
- `selection/BusinessModelSelectionStage.tsx:270,283` — 모델목록 "배달/하이브리드"·nextSummary "메뉴".
- `online/SourcingSetupStage.tsx`·`online/StoreSetupStage.tsx` — 중국소싱·택배계약·KC 물리상품. digital-products/creator에 부적합.
- `online/OnlineRegistrationStage.tsx:86-92`·`online/PlatformSetupStage.tsx` — 47911·스마트스토어/쿠팡 리셀러. 디지털상품에 부적합.

## 🟢 LOW
- `selection/LocationCandidatesStage.tsx:185`(food 폴백), `:274`(메뉴 변경 예시).
- `offline/InitialOrderPlanCard.tsx:212`·`offline/MyIngredientsPlanCard.tsx:131`(식자재 placeholder).
- `shared/StageGuideViewer.tsx:1164`·`shared/StoreNameInput.tsx:88-91`(메뉴판 default).
- `online/OnlineMarketingStage.tsx`, `startup/GrowthEngineStage.tsx:434`, `startup/CompanySetupStage.tsx:673`.

## ✅ 깨끗(게이팅/오버라이드 확인)
Construction(11 카테고리 map)·보험세무·RegistrationSetup(SSOT)·MenuDesign·TargetCustomer·BudgetInsight·12개 클러스터 스테이지·StartupFoundation/CustomerDiscovery/Fundraising 등.

---
**진행:** Tier1(초기 선택단계 텍스트 범용화)부터 웹+iOS 수정. Operations·StageGuideViewer·online/startup은 대형 구조 분기 — 순차 진행.

# Zustand Store Architecture

> useDashboard.ts (158 useState) → 6개 도메인별 Zustand 스토어로 분해

## 스토어 분류

### 1. onboarding-store.ts (12 states)
```
showOnboardingChoice, showExistingOnboarding, showAIRoadmapWizard,
showRoleSelection, userRole, isResetting, resetProgress,
authLabel, persistenceLabel, persistenceReady, authResolved, requiresAuth
```
- localStorage 의존: 없음 (Supabase 연동)
- persist: 불필요

### 2. profile-store.ts (15 states)
```
selectedIndustryId, selectedIndustryCategoryId, selectedBusinessModelId,
selectedBudget, budgetInputText, selectedOpenDate, selectedLocationId,
preferredRegionInput, locationMode, startupType, selectedFranchiseBrandId,
showFranchisePicker, storeName, cpaDecision, selectedInteriorConcept,
profile, saveStatus
```
- localStorage 의존: selectedIndustryCategoryId, storeName, cpaDecision 등
- persist: ✅ (Zustand persist 미들웨어)

### 3. roadmap-store.ts (25 states)
```
decisions, roadmap, taskMap, viewingStageId,
recommendedMarkets, customMarketName, customMarketReason,
manualMarketEvaluation, manualAlternative, locationOptions, locationSourceLabel,
vendorSelections, vendorCustomInputs,
opsSelections, opsPosChecks, opsStep,
softOpenChecks, softOpenPricing, softOpenStep, softOpenSkips,
taxChecks, loanChecks,
stageGuideContent, guideStepIndex, guideSelections
```
- localStorage 의존: decisions, roadmap, taskMap, vendorSelections, opsSelections 등 (15+키)
- persist: ✅

### 4. finance-store.ts (22 states)
```
showFinancePanel, financeCapitalText, financeMonthlyRentText,
financeLaborText, financeRevenueText, financeMarketStyle, financeRentBand,
financeStatus, financeError, financeResult, financeInterpretation,
dailyEntries, monthlyCosts, costHistory,
costIngredientsText, costLaborText, costRentText, costUtilitiesText, costOtherText,
dailyDateInput, dailySalesInput, dailyCustomersInput
```
- localStorage 의존: dailyEntries, monthlyCosts, costHistory, costTexts
- persist: ✅

### 5. operations-store.ts (45 states)
```
// 재고
inventory, invForm, invCategoryFilter, invWasteTarget, invWasteQty, invWasteReason,
// 직원
employees, empFormOpen, empEditId, empName, empWage, empHours, empInsured,
// 고정비
fixedExpenses, fexpFormOpen, fexpEditId, fexpName, fexpAmount, fexpDueDay, fexpCategory,
// 배달
deliveryPlatforms, monthlyDeliverySales, dlvFormOpen, dlvEditId, dlvName, dlvRate, dlvAd,
// 상품
products, prodFormOpen, prodEditId, prodName, prodCategory, prodPrice, prodCost, prodStock, prodUnit,
// 통합상품/서비스/온라인
unifiedProducts, serviceMenuItems, taxSettings,
onlinePlatformSales, onlineSelectedPlatforms, onlineSelectedCourier, onlineMonthlyParcels,
// 회원
members, memFormOpen, memName, memPlan, memFee, memEnd
```
- localStorage 의존: inventory, employees, fixedExpenses, deliveryPlatforms, products 등
- persist: ✅

### 6. ai-store.ts (20 states)
```
// 계약서
selectedContractTaskId, contractText, contractAnalysisStatus, contractAnalysisError, contractAnalysis,
// 가이드 Q&A
selectedGuideSectionKey, guideQuestion, guideQaStatus, guideQaError, guideAnswer,
knowledgeQaText, knowledgeQaStatus, knowledgeQaError,
// 지식베이스
permitGuides, taxGuides, loanGuides,
// 대시보드 코치
aiActions, aiActionsLoading
```
- localStorage 의존: 없음 (서버 데이터)
- persist: 불필요

### 나머지 (starter-stage-demo.tsx에 남는 것, ~19 states)
```
mounted, welcomed, filterCat, expandedId,
competitorResults, competitorLoading,
bpLoading, bpSections, bpSummary, bpError, bpExpandedIdx,
onboardingDismissed, progFilter, liveProgramsData, liveProgramsLoading,
liveMarketInsights, regPage, livePermitInsights, liveBudgetBenchmark
```
→ 이것들은 LocalStageState로 유지 (DashboardContext)

## 마이그레이션 순서
1. operations-store.ts (가장 독립적, 45 states, 다른 스토어와 의존 없음)
2. finance-store.ts (operations와 약간 연결되나 독립적)
3. ai-store.ts (서버 데이터, 독립적)
4. profile-store.ts (여러 스토어가 참조)
5. roadmap-store.ts (profile에 의존)
6. onboarding-store.ts (auth 로직, 가장 마지막)

## localStorage 키 매핑
기존 키 → Zustand persist namespace로 자동 마이그레이션 필요
```
inventoryItems → buildup-operations.inventory
employees → buildup-operations.employees
fixedExpenses → buildup-operations.fixedExpenses
deliveryPlatforms → buildup-operations.deliveryPlatforms
monthlyDeliverySales → buildup-operations.monthlyDeliverySales
products → buildup-operations.products
unifiedProducts → buildup-operations.unifiedProducts
serviceMenuItems → buildup-operations.serviceMenuItems
taxSettings → buildup-operations.taxSettings
onlinePlatformSales → buildup-operations.onlinePlatformSales
onlineSelectedPlatforms → buildup-operations.onlineSelectedPlatforms
onlineSelectedCourier → buildup-operations.onlineSelectedCourier
onlineMonthlyParcels → buildup-operations.onlineMonthlyParcels
members → buildup-operations.members
dailyEntries → buildup-finance.dailyEntries
monthlyCosts → buildup-finance.monthlyCosts
costHistory → buildup-finance.costHistory
__buildup_decisions → buildup-roadmap.decisions
__buildup_roadmap → buildup-roadmap.roadmap
__buildup_taskmap → buildup-roadmap.taskMap
```

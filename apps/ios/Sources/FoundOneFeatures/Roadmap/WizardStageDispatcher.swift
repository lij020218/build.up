//
//  WizardStageDispatcher.swift — stageId → stage view 매핑 (공용 dispatcher).
//
//  OnboardingFlow (AppRoot) 와 RoadmapView 모두 NavigationStack(path: [String]) +
//  navigationDestination(for: String.self) 패턴으로 wizard chain 을 구성한다.
//  이 dispatcher 는 stageId 를 받아 해당 stage view 를 반환한다.
//

import SwiftUI

@MainActor
@ViewBuilder
public func wizardStageView(for stageId: String) -> some View {
    switch stageId {
    case "franchise-application":    FranchiseApplicationStageView()
    case "industry-selection":       IndustrySelectionStageView()
    case "startup-type":             StartupTypeStageView()
    case "business-model":           BusinessModelStageView()
    case "target-customer-definition": TargetCustomerStageView()
    case "budget-setup":             BudgetSetupStageView()
    case "permit-check":             PermitCheckStageView()
    case "location-candidates":      LocationCandidatesStageView()
    case "contract-review":          ContractReviewStageView()
    case "registration-setup":       RegistrationSetupStageView()
    case "biz-registration":         BizRegistrationStageView()
    case "construction-setup":       ConstructionSetupStageView()
    case "menu-design":              MenuDesignStageView()
    case "vendor-setup":             VendorSetupStageView()
    case "hiring-setup":             HiringSetupStageView()
    case "insurance-tax-setup":      InsuranceTaxSetupStageView()
    case "operations-setup":         OperationsSetupStageView()
    case "pre-launch":               PreLaunchStageView()
    case "platform-setup":           PlatformSetupStageView()
    case "online-registration":      OnlineRegistrationStageView()
    case "sourcing-setup":           SourcingSetupStageView()
    case "store-setup":              StoreSetupStageView()
    case "online-marketing":         OnlineMarketingStageView()
    // 스타트업 단계 = 본문 + 추천 도구 패널 (웹 GenericTaskStageBody + StartupToolkitPanel 패리티, 2026-08-05)
    case "startup-foundation":       VStack(spacing: 14) { StartupFoundationStageView(); StartupToolkitPanelView(stageId: "startup-foundation") }
    case "customer-discovery":       VStack(spacing: 14) { CustomerDiscoveryStageView(); StartupToolkitPanelView(stageId: "customer-discovery") }
    case "company-setup":            VStack(spacing: 14) { CompanySetupStageView(); StartupToolkitPanelView(stageId: "company-setup") }
    case "mvp-build":                VStack(spacing: 14) { MvpBuildStageView(); StartupToolkitPanelView(stageId: "mvp-build") }
    case "launch-gtm":               VStack(spacing: 14) { LaunchGtmStageView(); StartupToolkitPanelView(stageId: "launch-gtm") }
    case "go-live":                  GoLiveStageView()
    case "growth-engine":            VStack(spacing: 14) { GrowthEngineStageView(); StartupToolkitPanelView(stageId: "growth-engine") }
    case "fundraising-readiness":    VStack(spacing: 14) { FundraisingReadinessStageView(); StartupToolkitPanelView(stageId: "fundraising-readiness") }
    case "venture-certification":    VentureCertificationStageView()
    case "hardware-prototype":       HardwarePrototypeStageView()
    case "bom-supply-chain":         BomSupplyChainStageView()
    case "certification-kc-ce":      CertificationKcCeStageView()
    case "manufacturing-partner":    ManufacturingPartnerStageView()
    case "lab-setup":                LabSetupStageView()
    case "prototype-iteration":      PrototypeIterationStageView()
    case "field-or-clinical-test":   FieldOrClinicalTestStageView()
    case "regulatory-submission":    RegulatorySubmissionStageView()
    case "eda-tooling-setup":        EdaToolingSetupStageView()
    case "mpw-or-pilot-tape-out":    MpwOrPilotTapeOutStageView()
    case "packaging-and-test":       PackagingAndTestStageView()
    case "partner-foundation-or-pilot-line": PartnerFoundationOrPilotLineStageView()
    case "tax-guide":                TaxGuideStageView()
    case "loan-guide":               LoanGuideStageView()
    case "financial-review":         FinancialReviewStageView()
    case "pre-launch-final":         PreLaunchFinalStageView()
    default:                         EmptyView()
    }
}

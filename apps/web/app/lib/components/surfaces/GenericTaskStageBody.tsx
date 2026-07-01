"use client";

import { HIRING_SETUP_CONTENT, PERMIT_CHECK_CONTENT } from "@foundone/shared";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { InvestmentGlossary } from "../knowledge/InvestmentGlossary";
import { BizRegistrationPanel } from "../stages/offline/BizRegistrationPanel";
import { ConstructionSetupStage } from "../stages/offline/ConstructionSetupStage";
import { InsuranceTaxSetupStage } from "../stages/offline/InsuranceTaxSetupStage";
import { OperationsSetupStage } from "../stages/offline/OperationsSetupStage";
import { PreLaunchStage } from "../stages/offline/PreLaunchStage";
import { RegistrationSetupStage } from "../stages/offline/RegistrationSetupStage";
import { VendorSetupStage } from "../stages/offline/VendorSetupStage";
import { OnlineMarketingStage } from "../stages/online/OnlineMarketingStage";
import { OnlineRegistrationStage } from "../stages/online/OnlineRegistrationStage";
import { PlatformSetupStage } from "../stages/online/PlatformSetupStage";
import { SourcingSetupStage } from "../stages/online/SourcingSetupStage";
import { StoreSetupStage } from "../stages/online/StoreSetupStage";
import { FranchiseApplicationStage } from "../stages/franchise/FranchiseApplicationStage";
import { FranchiseSupplyPanel } from "../stages/franchise/FranchiseSupplyPanel";
import { FinancialReviewStage } from "../stages/shared-tail/FinancialReviewStage";
import { PreLaunchFinalStage } from "../stages/shared-tail/PreLaunchFinalStage";
import { StageContentRenderer } from "../stages/shared/StageContentRenderer";
import { StageGuideViewer } from "../stages/shared/StageGuideViewer";
import { MenuDesignStage } from "../stages/shared/MenuDesignStage";
import { TargetCustomerStage } from "../stages/shared/TargetCustomerStage";
import { BomSupplyChainStage } from "../stages/startup/BomSupplyChainStage";
import { CertificationKcCeStage } from "../stages/startup/CertificationKcCeStage";
import { CompanySetupStage } from "../stages/startup/CompanySetupStage";
import { CustomerDiscoveryStage } from "../stages/startup/CustomerDiscoveryStage";
import { EdaToolingSetupStage } from "../stages/startup/EdaToolingSetupStage";
import { FieldOrClinicalTestStage } from "../stages/startup/FieldOrClinicalTestStage";
import { FundraisingReadinessStage } from "../stages/startup/FundraisingReadinessStage";
import { GoLiveStage } from "../stages/startup/GoLiveStage";
import { GrowthEngineStage } from "../stages/startup/GrowthEngineStage";
import { HardwarePrototypeStage } from "../stages/startup/HardwarePrototypeStage";
import { LabSetupStage } from "../stages/startup/LabSetupStage";
import { LaunchGtmStage } from "../stages/startup/LaunchGtmStage";
import { ManufacturingPartnerStage } from "../stages/startup/ManufacturingPartnerStage";
import { MpwOrPilotTapeOutStage } from "../stages/startup/MpwOrPilotTapeOutStage";
import { MvpBuildStage } from "../stages/startup/MvpBuildStage";
import { PackagingAndTestStage } from "../stages/startup/PackagingAndTestStage";
import { PartnerFoundationOrPilotLineStage } from "../stages/startup/PartnerFoundationOrPilotLineStage";
import { PrototypeIterationStage } from "../stages/startup/PrototypeIterationStage";
import { RegulatorySubmissionStage } from "../stages/startup/RegulatorySubmissionStage";
import { StartupFoundationStage } from "../stages/startup/StartupFoundationStage";
import { StartupToolkitPanel } from "../stages/startup/StartupToolkitPanel";
import { VentureCertificationStage } from "../stages/startup/VentureCertificationStage";
import { shouldRenderStageGuideViewer } from "./generic-task-stage-routing";

export function GenericTaskStageBody() {
  const {
    currentStage,
    industryCategoryId,
    language,
    selectedFranchiseBrandId,
    stageGuideContent,
    startupType,
  } = useDashboardCtx();
  const stageCode = currentStage.code;
  const isStartupCategory = industryCategoryId === "startup-tech";

  return (
    <>
      {stageCode === "online_registration" && <OnlineRegistrationStage />}
      {stageCode === "platform_setup" && <PlatformSetupStage />}
      {stageCode === "online_marketing" && <OnlineMarketingStage />}
      {stageCode === "permit_check" && <StageContentRenderer content={PERMIT_CHECK_CONTENT} />}

      {stageCode === "company_setup" && <CompanySetupStage />}
      {stageCode === "fundraising_readiness" && <FundraisingReadinessStage />}
      {stageCode === "startup_foundation" && <StartupFoundationStage />}
      {stageCode === "customer_discovery" && <CustomerDiscoveryStage />}
      {stageCode === "growth_engine" && <GrowthEngineStage />}
      {stageCode === "mvp_build" && <MvpBuildStage />}
      {isStartupCategory && stageCode !== "mvp_build" && stageCode !== "launch_gtm" && (
        <StartupToolkitPanel />
      )}
      {stageCode === "launch_gtm" && <LaunchGtmStage />}
      {stageCode === "go_live" && <GoLiveStage />}
      {stageCode === "venture_certification" && <VentureCertificationStage />}

      {stageCode === "hardware_prototype" && <HardwarePrototypeStage />}
      {stageCode === "bom_supply_chain" && <BomSupplyChainStage />}
      {stageCode === "certification_kc_ce" && <CertificationKcCeStage />}
      {stageCode === "manufacturing_partner" && <ManufacturingPartnerStage />}

      {stageCode === "lab_setup" && <LabSetupStage />}
      {stageCode === "prototype_iteration" && <PrototypeIterationStage />}
      {stageCode === "field_or_clinical_test" && <FieldOrClinicalTestStage />}
      {stageCode === "regulatory_submission" && <RegulatorySubmissionStage />}

      {stageCode === "eda_tooling_setup" && <EdaToolingSetupStage />}
      {stageCode === "mpw_or_pilot_tape_out" && <MpwOrPilotTapeOutStage />}
      {stageCode === "packaging_and_test" && <PackagingAndTestStage />}
      {stageCode === "partner_foundation_or_pilot_line" && <PartnerFoundationOrPilotLineStage />}

      {(stageCode as string) === "franchise_application" && <FranchiseApplicationStage />}
      {stageCode === "financial_review" && <FinancialReviewStage />}

      {stageCode === "registration_setup" && <RegistrationSetupStage />}
      {stageCode === "insurance_tax_setup" && <InsuranceTaxSetupStage />}
      {stageCode === "vendor_setup" && startupType === "franchise" && selectedFranchiseBrandId && (
        <FranchiseSupplyPanel />
      )}
      {stageCode === "vendor_setup" && startupType !== "franchise" && <VendorSetupStage />}
      {shouldRenderStageGuideViewer(stageCode, !!stageGuideContent) && <StageGuideViewer />}

      {stageCode === "store_setup" && <StoreSetupStage />}
      {stageCode === "sourcing_setup" && <SourcingSetupStage />}
      {stageCode === "fundraising_readiness" && (
        <div style={{ marginBottom: "16px" }}>
          <InvestmentGlossary ko={language === "ko"} />
        </div>
      )}
      {stageCode === "hiring_setup" && <StageContentRenderer content={HIRING_SETUP_CONTENT} />}
      {stageCode === "operations_setup" && <OperationsSetupStage />}
      {stageCode === "pre_launch" && <PreLaunchStage />}
      {stageCode === "construction_setup" && <ConstructionSetupStage />}
      {stageCode === "biz_registration" && <BizRegistrationPanel />}
      {stageCode === "pre_launch_final" && <PreLaunchFinalStage />}
      {stageCode === "target_customer_definition" && <TargetCustomerStage />}
      {stageCode === "menu_design" && <MenuDesignStage />}
    </>
  );
}

import { describe, expect, it } from "vitest";
import {
  GENERIC_TASK_STAGE_ID_BY_CODE,
  getGenericTaskStageId,
  isGenericTaskStageCode,
  shouldRenderStageGuideViewer,
  STAGE_GUIDE_VIEWER_EXCLUDED_CODES,
  STAGE_GUIDE_VIEWER_EXCLUSION_REASONS,
  type GenericTaskStageCode,
} from "../app/lib/components/surfaces/generic-task-stage-routing";

const expectedStageIds: Record<GenericTaskStageCode, string> = {
  permit_check: "permit-check",
  construction_setup: "construction-setup",
  vendor_setup: "vendor-setup",
  registration_setup: "registration-setup",
  insurance_tax_setup: "insurance-tax-setup",
  hiring_setup: "hiring-setup",
  operations_setup: "operations-setup",
  pre_launch: "pre-launch",
  platform_setup: "platform-setup",
  online_registration: "online-registration",
  sourcing_setup: "sourcing-setup",
  store_setup: "store-setup",
  online_marketing: "online-marketing",
  startup_foundation: "startup-foundation",
  customer_discovery: "customer-discovery",
  mvp_build: "mvp-build",
  launch_gtm: "launch-gtm",
  go_live: "go-live",
  growth_engine: "growth-engine",
  company_setup: "company-setup",
  fundraising_readiness: "fundraising-readiness",
  venture_certification: "venture-certification",
  biz_registration: "biz-registration",
  pre_launch_final: "pre-launch-final",
  financial_review: "financial-review",
  hardware_prototype: "hardware-prototype",
  bom_supply_chain: "bom-supply-chain",
  certification_kc_ce: "certification-kc-ce",
  manufacturing_partner: "manufacturing-partner",
  lab_setup: "lab-setup",
  prototype_iteration: "prototype-iteration",
  field_or_clinical_test: "field-or-clinical-test",
  regulatory_submission: "regulatory-submission",
  eda_tooling_setup: "eda-tooling-setup",
  mpw_or_pilot_tape_out: "mpw-or-pilot-tape-out",
  packaging_and_test: "packaging-and-test",
  partner_foundation_or_pilot_line: "partner-foundation-or-pilot-line",
  franchise_application: "franchise-application",
  target_customer_definition: "target-customer-definition",
  menu_design: "menu-design",
};

describe("generic task stage routing", () => {
  it("keeps generic task stage codes and stage ids in one map", () => {
    expect(GENERIC_TASK_STAGE_ID_BY_CODE).toEqual(expectedStageIds);
  });

  it("detects only generic task stages", () => {
    for (const stageCode of Object.keys(expectedStageIds)) {
      expect(isGenericTaskStageCode(stageCode)).toBe(true);
    }

    expect(isGenericTaskStageCode("contract_review")).toBe(false);
    expect(isGenericTaskStageCode("tax_guide")).toBe(false);
    expect(isGenericTaskStageCode("industry_selection")).toBe(false);
  });

  it("returns the preserved task-map id for every generic task stage", () => {
    for (const [stageCode, stageId] of Object.entries(expectedStageIds)) {
      expect(getGenericTaskStageId(stageCode as GenericTaskStageCode)).toBe(stageId);
    }
  });

  it("keeps StageGuideViewer exclusion rules explicit", () => {
    const excludedCodes = [
      "financial_review",
      "franchise_application",
      "fundraising_readiness",
      "hiring_setup",
      "insurance_tax_setup",
      "loan_guide",
      "menu_design",
      "online_registration",
      "operations_setup",
      "platform_setup",
      "pre_launch",
      "registration_setup",
      "target_customer_definition",
      "vendor_setup",
    ];

    expect([...STAGE_GUIDE_VIEWER_EXCLUDED_CODES].sort()).toEqual(excludedCodes);
    expect(Object.keys(STAGE_GUIDE_VIEWER_EXCLUSION_REASONS).sort()).toEqual(excludedCodes);
    expect(STAGE_GUIDE_VIEWER_EXCLUSION_REASONS.vendor_setup).toContain("vendor setup");

    expect(shouldRenderStageGuideViewer("construction_setup", true)).toBe(true);
    expect(shouldRenderStageGuideViewer("construction_setup", false)).toBe(false);
    expect(shouldRenderStageGuideViewer("pre_launch", true)).toBe(false);
    expect(shouldRenderStageGuideViewer("menu_design", true)).toBe(false);
  });
});

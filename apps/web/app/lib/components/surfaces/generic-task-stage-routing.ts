export const GENERIC_TASK_STAGE_ID_BY_CODE = {
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
} as const;

export type GenericTaskStageCode = keyof typeof GENERIC_TASK_STAGE_ID_BY_CODE;

export const STAGE_GUIDE_VIEWER_EXCLUSION_REASONS = {
  pre_launch: "Renders a dedicated multi-page soft-open stage.",
  operations_setup: "Renders a dedicated operations setup stage.",
  hiring_setup: "Uses shared hiring setup content in the current surface.",
  platform_setup: "Renders a dedicated platform setup stage.",
  online_registration: "Renders a dedicated registration stage.",
  franchise_application: "Renders a dedicated franchise application stage.",
  fundraising_readiness: "Renders a dedicated funding readiness stage and glossary.",
  registration_setup: "Renders a dedicated registration setup stage.",
  insurance_tax_setup: "Renders a dedicated insurance/tax setup stage.",
  loan_guide: "Handled by the guide-stage branch with its own footer gate.",
  financial_review: "Renders a dedicated financial review stage.",
  vendor_setup: "Renders franchise or independent vendor setup panels.",
  target_customer_definition: "Renders a dedicated target customer stage.",
  menu_design: "Renders a dedicated menu/service lineup stage.",
} as const;

export const STAGE_GUIDE_VIEWER_EXCLUDED_CODES = new Set(
  Object.keys(STAGE_GUIDE_VIEWER_EXCLUSION_REASONS),
);

export function isGenericTaskStageCode(stageCode: string) {
  return Object.prototype.hasOwnProperty.call(GENERIC_TASK_STAGE_ID_BY_CODE, stageCode);
}

export function getGenericTaskStageId(stageCode: string): string {
  // Keep the legacy fallback for call sites that have not narrowed stageCode yet.
  // CurrentStageView calls this only after isGenericTaskStageCode().
  return GENERIC_TASK_STAGE_ID_BY_CODE[stageCode as GenericTaskStageCode] ?? stageCode.replace(/_/g, "-");
}

export function shouldRenderStageGuideViewer(stageCode: string, hasStageGuideContent: boolean) {
  return hasStageGuideContent && !STAGE_GUIDE_VIEWER_EXCLUDED_CODES.has(stageCode);
}

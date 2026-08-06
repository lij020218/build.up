const HOME_GRID_COLUMNS = "minmax(0, 1.18fr) minmax(340px, 0.92fr)";
// auto: 콘텐츠 기준으로 카드 높이 자동 정렬 (이전 fixed 640px 는 좌/우 카드 높이 어긋남 발생)
const HOME_SHOWCASE_HEIGHT = "auto";

export const styles = {
  shell: {
    maxWidth: "1080px",
    margin: "0 auto",
    padding: "48px 24px 72px"
  },
  hero: {
    display: "grid",
    gap: "16px",
    padding: "52px 0 28px"
  },
  eyebrow: {
    fontSize: "14px",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: "var(--primary)"
  },
  title: {
    fontSize: "clamp(40px, 7vw, 76px)",
    lineHeight: 0.96,
    fontWeight: 700,
    letterSpacing: "-0.05em"
  },
  subtitle: {
    maxWidth: "700px",
    fontSize: "18px",
    lineHeight: 1.5,
    color: "var(--muted)"
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
    marginTop: "28px"
  },
  card: {
    background: "var(--surface)",
    backdropFilter: "blur(18px)",
    border: "1px solid var(--border)",
    borderRadius: "28px",
    padding: "24px",
    display: "grid",
    gap: "14px",
  },
  cardTitle: {
    fontSize: "22px",
    fontWeight: 650
  },
  list: {
    margin: 0,
    paddingLeft: "18px",
    color: "var(--muted)",
    lineHeight: 1.8
  },
  section: {
    marginTop: "42px",
    marginBottom: "32px",  // ← nav 바와 surface 첫 카드 사이 간격 (사용자 피드백: 너무 붙어있어)
  },
  surfaceNav: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
    padding: "7px",
    borderRadius: "999px",
    border: "1px solid rgba(15,23,42,0.06)",
    background: "rgba(255,255,255,0.88)",
    backdropFilter: "blur(24px) saturate(160%)",
    WebkitBackdropFilter: "blur(24px) saturate(160%)" as const,
    boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 8px 22px rgba(17,17,17,0.06)",
    position: "sticky" as const,
    top: "16px",
    zIndex: 20
  },
  surfaceNavButton: {
    borderRadius: "999px",
    border: "1px solid transparent",
    background: "transparent",
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: "14px",
    color: "var(--muted)"
  },
  surfaceNavButtonInner: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px"
  },
  surfaceNavButtonSelected: {
    border: "1px solid rgba(255,255,255,0.82)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.62) 100%)",
    color: "var(--primary)",
    fontWeight: 600,
    boxShadow: "0 8px 20px rgba(17,17,17,0.05), inset 0 -1px 0 rgba(29,53,87,0.08)"
  },
  sectionTitle: {
    fontSize: "14px",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "var(--muted)",
    marginBottom: "14px"
  },
  homeShowcase: {
    display: "grid",
    gridTemplateColumns: HOME_GRID_COLUMNS,
    gridTemplateRows: HOME_SHOWCASE_HEIGHT,
    gap: "20px",
    alignItems: "stretch"
  },
  homeMainPanel: {
    marginTop: "18px",
    borderRadius: "34px",
    padding: "30px",
    border: "1px solid rgba(255,255,255,0.82)",
    background:
      "radial-gradient(circle at top left, rgba(117,163,255,0.12), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.76) 100%)",
    boxShadow: "0 18px 40px rgba(17,17,17,0.05)",
    display: "grid",
    gridTemplateRows: "auto auto auto auto auto auto",
    gap: "20px",
    backdropFilter: "blur(20px)"
  },
  homePanelEyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    width: "fit-content",
    borderRadius: "999px",
    padding: "8px 12px",
    border: "1px solid rgba(29,53,87,0.08)",
    background: "rgba(255,255,255,0.72)",
    fontSize: "12px",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--primary)"
  },
  homeMainTitle: {
    fontSize: "clamp(30px, 4vw, 48px)",
    lineHeight: 1.02,
    fontWeight: 680,
    letterSpacing: "-0.04em",
    maxWidth: "12ch"
  },
  homeMainBody: {
    fontSize: "16px",
    lineHeight: 1.7,
    color: "var(--muted)",
    maxWidth: "52ch"
  },
  homeStageRail: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px"
  },
  homeStageRailCard: {
    borderRadius: "20px",
    padding: "16px 18px",
    border: "1px solid rgba(17,17,17,0.06)",
    background: "rgba(255,255,255,0.74)",
    display: "grid",
    gap: "8px",
    minHeight: "132px",
    alignContent: "start"
  },
  homeStageRailLabel: {
    fontSize: "12px",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--muted)"
  },
  homeStageRailTitle: {
    fontSize: "18px",
    lineHeight: 1.28,
    fontWeight: 600
  },
  homeStageRailBody: {
    fontSize: "14px",
    lineHeight: 1.6,
    color: "var(--muted)"
  },
  homeSideStack: {
    marginTop: "18px",
    display: "grid",
    gap: "20px",
    // auto: 두 사이드 카드를 콘텐츠 기반 높이로 (좌측 메인 카드와 자연스럽게 정렬)
    gridTemplateRows: "auto auto",
    alignSelf: "stretch"
  },
  homeInfoPanel: {
    borderRadius: "28px",
    padding: "22px",
    border: "1px solid rgba(255,255,255,0.78)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.72) 100%)",
    boxShadow: "0 14px 30px rgba(17,17,17,0.04)",
    display: "grid",
    gap: "14px",
    backdropFilter: "blur(18px)",
    alignContent: "start"
  },
  homeInfoTitle: {
    fontSize: "13px",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "var(--muted)"
  },
  homeMetricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px"
  },
  homeMetricCard: {
    borderRadius: "18px",
    padding: "16px",
    border: "1px solid rgba(17,17,17,0.06)",
    background: "rgba(255,255,255,0.84)",
    display: "grid",
    gap: "6px",
    minHeight: "92px"
  },
  homeMetricLabel: {
    fontSize: "12px",
    color: "var(--muted)"
  },
  homeMetricValue: {
    fontSize: "18px",
    lineHeight: 1.3,
    fontWeight: 600
  },
  homeProgressTrack: {
    height: "6px",
    borderRadius: "999px",
    background: "rgba(17,17,17,0.05)",
    overflow: "hidden",
  },
  homeProgressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #1d3557 0%, #457b9d 50%, #a8dadc 100%)",
    transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
  },
  homeMiniList: {
    display: "grid",
    gap: "4px"
  },
  homeMiniRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "14px 0",
    borderTop: "1px solid rgba(17,17,17,0.06)"
  },
  homeMiniLabel: {
    fontSize: "13px",
    color: "var(--muted)"
  },
  homeMiniValue: {
    fontSize: "14px",
    fontWeight: 600,
    textAlign: "right" as const
  },
  homeLowerGrid: {
    marginTop: "40px",
    display: "grid",
    gridTemplateColumns: HOME_GRID_COLUMNS,
    gap: "20px",
    alignItems: "stretch"
  },
  homeLowerPanel: {
    borderRadius: "28px",
    padding: "24px",
    border: "1px solid rgba(255,255,255,0.78)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(255,255,255,0.72) 100%)",
    boxShadow: "0 14px 30px rgba(17,17,17,0.04)",
    display: "grid",
    gap: "14px",
    minHeight: "100%"
  },
  homePrincipleGrid: {
    display: "grid",
    gap: "12px"
  },
  homePrincipleCard: {
    borderRadius: "20px",
    padding: "16px 18px",
    border: "1px solid rgba(17,17,17,0.06)",
    background: "rgba(255,255,255,0.82)",
    display: "grid",
    gap: "6px"
  },
  homePrincipleTitle: {
    fontSize: "16px",
    fontWeight: 600
  },
  homePrincipleBody: {
    fontSize: "14px",
    lineHeight: 1.6,
    color: "var(--muted)"
  },
  financePanel: {
    display: "grid",
    gap: "16px",
    padding: "22px",
    borderRadius: "28px",
    border: "1px solid rgba(255,255,255,0.78)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.76) 100%)",
    boxShadow: "0 12px 28px rgba(17,17,17,0.04)"
  },
  financePanelHeader: {
    display: "grid",
    gap: "6px"
  },
  financePanelTitle: {
    fontSize: "22px",
    lineHeight: 1.2,
    fontWeight: 650
  },
  financePanelBody: {
    fontSize: "14px",
    lineHeight: 1.65,
    color: "var(--muted)",
    maxWidth: "58ch"
  },
  financeFieldGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px"
  },
  financeField: {
    display: "grid",
    gap: "8px"
  },
  financeFieldLabel: {
    fontSize: "13px",
    color: "var(--muted)"
  },
  financeAssistText: {
    fontSize: "12px",
    lineHeight: 1.5,
    color: "var(--muted)"
  },
  financeResultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "12px"
  },
  financeResultCard: {
    borderRadius: "20px",
    padding: "16px",
    border: "1px solid rgba(17,17,17,0.06)",
    background: "rgba(255,255,255,0.84)",
    display: "grid",
    gap: "6px",
    minHeight: "94px"
  },
  financeResultLabel: {
    fontSize: "12px",
    color: "var(--muted)"
  },
  financeResultValue: {
    fontSize: "18px",
    lineHeight: 1.3,
    fontWeight: 620
  },
  financeInlineNote: {
    fontSize: "12px",
    color: "var(--muted)"
  },
  currentStage: {
    marginTop: "18px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.76) 100%)",
    border: "1px solid rgba(255,255,255,0.76)",
    borderRadius: "28px",
    padding: "24px",
    display: "grid",
    gap: "16px",
    boxShadow: "0 14px 34px rgba(17,17,17,0.045)",
    backdropFilter: "blur(18px)"
  },
  currentMeta: {
    fontSize: "13px",
    color: "var(--primary)",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const
  },
  currentTitle: {
    fontSize: "28px",
    lineHeight: 1.1,
    fontWeight: 650
  },
  currentBody: {
    color: "var(--muted)",
    lineHeight: 1.6,
    maxWidth: "760px"
  },
  transitionNotice: {
    borderRadius: "16px",
    border: "1px solid rgba(29,53,87,0.12)",
    background: "rgba(29,53,87,0.06)",
    padding: "12px 14px",
    display: "grid",
    gap: "4px"
  },
  transitionNoticeTitle: {
    fontSize: "12px",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--primary)",
    fontWeight: 700
  },
  transitionNoticeBody: {
    fontSize: "14px",
    lineHeight: 1.6,
    color: "var(--primary)"
  },
  helper: {
    fontSize: "14px",
    lineHeight: 1.7,
    color: "var(--muted)"
  },
  summaryBar: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.72)",
    background: "rgba(255,255,255,0.5)",
    overflow: "hidden"
  },
  summarySegment: {
    padding: "9px 13px",
    fontSize: "12px",
    color: "var(--muted)",
    borderRight: "1px solid rgba(17,17,17,0.06)"
  },
  pillRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap" as const
  },
  currentActionRail: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap" as const,
    alignItems: "center"
  },
  currentUtilityButton: {
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.78)",
    background: "rgba(255,255,255,0.62)",
    padding: "12px 14px",
    cursor: "pointer",
    fontSize: "14px",
    color: "var(--muted)"
  },
  currentStateChip: {
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.78)",
    background: "rgba(255,255,255,0.46)",
    padding: "12px 14px",
    fontSize: "14px",
    color: "var(--muted)"
  },
  stageFooter: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap" as const,
    alignItems: "center",
    position: "sticky" as const,
    // ⚠️ 2026-05-19 모바일: bottom 을 safe-area 만큼 띄움 (iPhone 홈 인디케이터 충돌 회피).
    //   상수 16px 대신 max(16px, env(safe-area-inset-bottom)) — 노치 없는 기기는 그대로 16px.
    bottom: "max(16px, env(safe-area-inset-bottom))",
    padding: "12px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.72)",
    background: "rgba(247,246,243,0.74)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
  },
  stageNavRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap" as const,
    alignItems: "center",
    justifyContent: "space-between" as const,
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: "1px solid rgba(29,53,87,0.08)"
  },
  stageInlineActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap" as const,
    alignItems: "center"
  },
  taskChecklist: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px"
  },
  taskCheckItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px 24px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.78)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.8) 100%)",
    cursor: "pointer",
    textAlign: "left" as const,
    boxShadow: "0 6px 18px rgba(17,17,17,0.04)",
    backdropFilter: "blur(16px)"
  },
  taskCheckItemDone: {
    background: "linear-gradient(180deg, rgba(240,248,240,0.92) 0%, rgba(230,245,230,0.8) 100%)",
    border: "1px solid rgba(34,139,34,0.2)"
  },
  taskCheckCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "2px solid rgba(29,53,87,0.25)",
    background: "transparent",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  taskCheckCircleDone: {
    background: "var(--primary)",
    border: "2px solid var(--primary)"
  },
  taskCheckTitle: {
    fontSize: "17px",
    fontWeight: 580,
    letterSpacing: "-0.2px",
    flex: 1
  },
  taskCheckTitleDone: {
    color: "var(--muted)",
    textDecoration: "line-through"
  },
  taskProgress: {
    fontSize: "13px",
    color: "var(--muted)",
    fontWeight: 500
  },
  quickActionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px"
  },
  quickActionCard: {
    display: "grid",
    gap: "8px",
    textAlign: "left" as const,
    borderRadius: "22px",
    border: "1px solid rgba(255,255,255,0.78)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.74) 100%)",
    padding: "18px",
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(17,17,17,0.05)",
    backdropFilter: "blur(16px)"
  },
  quickActionTitle: {
    fontSize: "16px",
    fontWeight: 600
  },
  quickActionBody: {
    fontSize: "14px",
    lineHeight: 1.6,
    color: "var(--muted)"
  },
  pill: {
    borderRadius: "999px",
    border: "1px solid var(--border)",
    padding: "10px 14px",
    fontSize: "14px",
    color: "var(--muted)",
    background: "var(--surface)"
  },
  optionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
  },
  optionCard: {
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: "4px",
    textAlign: "center" as const,
    borderRadius: "18px",
    border: "1.5px solid rgba(0,0,0,0.04)",
    background: "rgba(255,255,255,0.8)",
    padding: "28px 16px",
    cursor: "pointer",
    boxShadow: "none",
    transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
  },
  optionCardSelected: {
    border: "1.5px solid var(--primary)",
    background: "rgba(29,53,87,0.05)",
    boxShadow: "0 0 0 3px rgba(29,53,87,0.07)",
  },
  optionTitle: {
    fontSize: "14px",
    fontWeight: 640,
    letterSpacing: "-0.01em",
    lineHeight: 1.35,
    color: "#0f172a",
  },
  optionSummary: {
    color: "var(--muted)",
    lineHeight: 1.6
  },
  compactOptionSummary: {
    color: "var(--muted)",
    lineHeight: 1.5,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden"
  },
  recommendationTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px"
  },
  scoreBadge: {
    borderRadius: "999px",
    background: "rgba(29,53,87,0.08)",
    color: "var(--primary)",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 600
  },
  metricRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap" as const
  },
  metricChip: {
    borderRadius: "999px",
    border: "1px solid var(--border)",
    padding: "8px 10px",
    fontSize: "13px",
    color: "var(--muted)",
    background: "var(--surface)"
  },
  freshnessText: {
    fontSize: "13px",
    color: "var(--muted)"
  },
  warningText: {
    fontSize: "14px",
    lineHeight: 1.6,
    color: "var(--warning)"
  },
  criticalText: {
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#B64C4C"
  },
  startupTypeRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap" as const
  },
  categoryTabBar: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap" as const,
    padding: "6px 0",
    marginBottom: "8px",
  },
  categoryTab: {
    borderRadius: "10px",
    border: "1px solid rgba(0,0,0,0.06)",
    background: "transparent",
    color: "var(--muted)",
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 520,
    letterSpacing: "0",
    transition: "all 0.15s ease",
  },
  categoryTabSelected: {
    background: "#0f172a",
    border: "1px solid #0f172a",
    color: "#fff",
    fontWeight: 600,
    boxShadow: "0 2px 8px rgba(15,23,42,0.15)",
  },
  bigOptionCard: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    textAlign: "left" as const,
    borderRadius: "18px",
    border: "1.5px solid rgba(0,0,0,0.05)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.88) 100%)",
    padding: "22px 20px",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
    width: "100%",
    transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
  },
  bigOptionTitle: {
    fontSize: "16px",
    fontWeight: 660,
    letterSpacing: "-0.02em",
    lineHeight: 1.3,
  },
  bigOptionSubtitle: {
    fontSize: "15px",
    color: "var(--muted)",
    lineHeight: 1.5
  },
  budgetPanel: {
    display: "grid",
    gap: "18px",
    padding: "22px",
    borderRadius: "24px",
    border: "1px solid var(--border)",
    background: "rgba(255,255,255,0.88)"
  },
  budgetHeader: {
    display: "grid",
    gap: "6px"
  },
  budgetLabel: {
    fontSize: "13px",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--muted)"
  },
  budgetValue: {
    fontSize: "34px",
    lineHeight: 1.05,
    fontWeight: 650
  },
  budgetInput: {
    width: "100%",
    borderRadius: "18px",
    border: "1px solid var(--border)",
    background: "#fff",
    padding: "14px 16px",
    fontSize: "16px",
    color: "var(--text)"
  },
  textInput: {
    width: "100%",
    borderRadius: "18px",
    border: "1px solid var(--border)",
    background: "#fff",
    padding: "14px 16px",
    fontSize: "16px",
    color: "var(--text)"
  },
  textarea: {
    width: "100%",
    minHeight: "88px",
    borderRadius: "18px",
    border: "1px solid var(--border)",
    background: "#fff",
    padding: "14px 16px",
    fontSize: "15px",
    lineHeight: 1.6,
    color: "var(--text)",
    resize: "vertical" as const,
    fontFamily: "inherit"
  },
  aiTextarea: {
    minHeight: "76px"
  },
  segmentedRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap" as const
  },
  inlinePanel: {
    display: "grid",
    gap: "14px",
    padding: "20px",
    borderRadius: "24px",
    border: "1px solid var(--border)",
    background: "rgba(255,255,255,0.88)"
  },
  inlinePanelHeader: {
    display: "grid",
    gap: "4px"
  },
  inlinePanelMetaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap" as const
  },
  inlineSummaryRow: {
    display: "grid",
    gap: "4px",
    padding: "14px 16px",
    borderRadius: "18px",
    border: "1px solid var(--border)",
    background: "rgba(255,255,255,0.64)"
  },
  inlineSummaryLabel: {
    fontSize: "12px",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--muted)"
  },
  inlineSummaryValue: {
    fontSize: "14px",
    lineHeight: 1.5,
    fontWeight: 600,
    color: "var(--text)"
  },
  aiInlineSummaryRow: {
    padding: "11px 13px",
    gap: "3px"
  },
  confidenceBadge: {
    borderRadius: "999px",
    border: "1px solid rgba(17,17,17,0.08)",
    background: "rgba(255,255,255,0.9)",
    padding: "6px 10px",
    fontSize: "12px",
    color: "var(--muted)"
  },
  aiInlinePanel: {
    gap: "10px",
    padding: "16px 18px"
  },
  aiHelper: {
    fontSize: "13px",
    lineHeight: 1.58,
    color: "var(--muted)",
    maxWidth: "62ch"
  },
  budgetRange: {
    width: "100%",
    accentColor: "var(--primary)"
  },
  budgetRangeMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "13px",
    color: "var(--muted)"
  },
  compactChoiceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "8px",
  },
  compactChoiceCard: {
    borderRadius: "16px",
    border: "1.5px solid rgba(0,0,0,0.05)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.82) 100%)",
    padding: "16px 14px",
    cursor: "pointer",
    textAlign: "left" as const,
    display: "grid",
    gap: "4px",
    transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
  },
  compactChoiceCardSelected: {
    border: "1.5px solid var(--primary)",
    background: "linear-gradient(180deg, rgba(29,53,87,0.06) 0%, rgba(29,53,87,0.1) 100%)",
    boxShadow: "0 0 0 3px rgba(29,53,87,0.08), 0 4px 12px rgba(29,53,87,0.06)",
    color: "var(--primary)",
  },
  compactChoiceTitle: {
    fontSize: "14px",
    fontWeight: 650,
    letterSpacing: "-0.01em",
  },
  compactChoiceCaption: {
    fontSize: "12px",
    lineHeight: 1.5,
    color: "var(--muted)",
  },
  button: {
    borderRadius: "14px",
    border: "1px solid rgba(0,0,0,0.08)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)",
    padding: "12px 18px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 550,
    color: "#0f172a",
    transition: "all 0.15s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  buttonSelected: {
    border: "1px solid var(--primary)",
    color: "var(--primary)",
    background: "rgba(29,53,87,0.04)",
    boxShadow: "0 0 0 3px rgba(29,53,87,0.06)",
  },
  primaryButton: {
    borderRadius: "14px",
    border: "none",
    // 미드나이트 블루 (#191970) 포인트 — top 은 살짝 밝게, bottom 으로 갈수록 깊은 미드나이트
    background: "linear-gradient(180deg, #1d2b7a 0%, #0d0d4d 100%)",
    color: "#fff",
    padding: "14px 22px",
    fontSize: "15px",
    fontWeight: 650,
    cursor: "pointer",
    // glow 도 미드나이트 톤 — 떠 있는 느낌이 푸르스름하게
    boxShadow: "0 6px 18px rgba(25,25,112,0.28), 0 1px 0 rgba(255,255,255,0.12) inset",
    transition: "all 0.2s ease",
    letterSpacing: "-0.01em",
  },
  flow: {
    display: "grid",
    gap: "12px"
  },
  roadmapList: {
    display: "grid",
    gap: "0",
    position: "relative" as const,
    paddingLeft: "28px",
  },
  roadmapRow: {
    display: "grid",
    gap: "6px",
    borderRadius: "20px",
    border: "1px solid rgba(0,0,0,0.04)",
    // 배경(라벤더 미스트)이 비쳐야 흰 판이 이어 붙은 화면으로 보이지 않는다 (2026-08-06).
    background: "linear-gradient(180deg, rgba(255,255,255,0.58) 0%, rgba(247,248,254,0.52) 100%)",
    padding: "18px 20px",
    marginBottom: "8px",
    position: "relative" as const,
    transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
  },
  roadmapRowCurrent: {
    border: "1px solid rgba(29,53,87,0.12)",
    // 2026-08-06: 흰색 하드코딩 → 브랜드 라벤더 계열 (iOS heroGradientMid/End 와 같은 계열).
    background: "linear-gradient(135deg, rgba(238,240,251,0.96) 0%, rgba(229,232,247,0.94) 100%)",
    boxShadow: "0 8px 32px rgba(29,53,87,0.06), 0 1px 0 rgba(255,255,255,0.9) inset",
    padding: "22px 24px",
    marginBottom: "12px",
  },
  /** 아직 잠긴 먼 단계 — 가장 가볍게. 목록이 흰 판의 반복으로 보이지 않게 한다 (2026-08-06). */
  roadmapRowLocked: {
    background: "rgba(255,255,255,0.26)",
    border: "1px solid rgba(29,53,87,0.05)",
    padding: "14px 20px",
    color: "rgba(15,23,42,0.55)",
  },
  roadmapRowCompleted: {
    background: "rgba(255,255,255,0.34)",
    border: "1px solid rgba(0,0,0,0.03)",
    padding: "14px 20px",
  },
  roadmapRowTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px"
  },
  roadmapIndex: {
    fontSize: "11px",
    fontWeight: 650,
    color: "var(--primary)",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  },
  roadmapTitle: {
    fontSize: "17px",
    fontWeight: 660,
    letterSpacing: "-0.02em",
    lineHeight: 1.25,
  },
  roadmapStatus: {
    fontSize: "12px",
    fontWeight: 550,
    color: "var(--muted)",
  },
  roadmapStatusQuiet: {
    color: "rgba(91,97,110,0.55)"
  },
  roadmapTitleQuiet: {
    color: "rgba(17,17,17,0.52)"
  },
  step: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.88) 100%)",
    border: "1px solid rgba(0,0,0,0.04)",
    borderRadius: "28px",
    padding: "28px 26px",
    display: "grid",
    gap: "10px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.02), 0 1px 0 rgba(255,255,255,0.8) inset",
  },
  stepMeta: {
    fontSize: "11px",
    fontWeight: 650,
    color: "var(--primary)",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
  },
  stepTitle: {
    fontSize: "24px",
    fontWeight: 720,
    letterSpacing: "-0.035em",
    lineHeight: 1.15,
    color: "#0f172a",
  },
  stepBody: {
    color: "var(--muted)",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  profileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px"
  },
  profileItem: {
    borderRadius: "20px",
    border: "1px solid var(--border)",
    background: "#fff",
    padding: "16px",
    display: "grid",
    gap: "6px"
  },
  profileLabel: {
    fontSize: "12px",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "var(--muted)"
  },
  profileValue: {
    fontSize: "18px",
    fontWeight: 600,
    lineHeight: 1.4
  },
  guideSection: {
    display: "grid",
    gap: "10px",
    paddingTop: "6px"
  },
  guideSectionTitle: {
    fontSize: "12px",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "var(--muted)"
  },
  sourceLink: {
    color: "var(--primary)",
    textDecoration: "none"
  },
  authGate: {
    marginTop: "42px",
    background: "rgba(255,255,255,0.88)",
    border: "1px solid var(--border)",
    borderRadius: "28px",
    padding: "30px 26px",
    display: "grid",
    gap: "14px",
    maxWidth: "640px"
  },
  guideCard: {
    background: "rgba(255,255,255,0.88)",
    borderRadius: "24px",
    padding: "32px 28px 24px",
    border: "1px solid rgba(17,17,17,0.07)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0px"
  },
  guidePager: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between" as const,
    marginBottom: "28px"
  },
  guidePagerLabel: {
    fontSize: "12px",
    fontWeight: 500,
    color: "var(--muted)",
    letterSpacing: "0.02em"
  },
  guideDots: {
    display: "flex",
    gap: "6px",
    alignItems: "center"
  },
  guideOverline: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--muted)",
    marginBottom: "10px"
  },
  guideHeadline: {
    fontSize: "22px",
    fontWeight: 700,
    color: "var(--text)",
    letterSpacing: "-0.5px",
    lineHeight: "1.25",
    marginBottom: "14px"
  },
  guideBody: {
    fontSize: "15px",
    lineHeight: "1.75",
    color: "#444",
    margin: "0 0 20px"
  },
  guideLinkButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--primary)",
    textDecoration: "none",
    padding: "10px 18px",
    borderRadius: "100px",
    background: "rgba(29,53,87,0.06)",
    border: "1px solid rgba(29,53,87,0.12)",
    marginBottom: "20px",
    alignSelf: "flex-start" as const
  },
  guideTip: {
    fontSize: "13px",
    lineHeight: "1.65",
    color: "#555",
    padding: "12px 16px",
    background: "rgba(17,17,17,0.03)",
    borderRadius: "14px",
    marginBottom: "12px"
  },
  guideCostBadge: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#1a4a8a",
    padding: "5px 14px",
    background: "rgba(100,150,255,0.08)",
    borderRadius: "100px",
    display: "inline-block",
    alignSelf: "flex-start" as const
  },
  guideWarningItem: {
    fontSize: "14px",
    lineHeight: "1.7",
    padding: "14px 18px",
    borderRadius: "16px",
    marginBottom: "10px"
  },
  guideMetaRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
    marginBottom: "24px"
  },
  guideMetaChip: {
    fontSize: "12px",
    fontWeight: 500,
    color: "var(--muted)",
    padding: "5px 14px",
    borderRadius: "100px",
    background: "rgba(17,17,17,0.04)",
    border: "1px solid rgba(17,17,17,0.07)"
  },
  guideCardNav: {
    display: "flex",
    justifyContent: "space-between" as const,
    alignItems: "center",
    marginTop: "28px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(17,17,17,0.06)"
  },
  // kept for AI tool open link
  stageGuideStepLink: {
    fontSize: "13px",
    fontWeight: 580,
    color: "var(--primary)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  }
};

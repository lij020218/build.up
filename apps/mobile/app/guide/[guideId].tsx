import {
  bootstrapAccountWorkspace,
  completeCurrentStage,
  getFreshnessPresentation,
  getUiCopy,
  loadKnowledgeRecordById,
  localizeGuideRecord,
  saveRoadmapState,
  upsertStageDecision,
  type GuideQaAnswer,
  type FreshnessMeta,
  type KnowledgeItemRecord,
  type KnowledgeItemSourceRecord
} from "@foundone/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuroraBackground, colors, radii, shadows } from "../../lib/design";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../lib/language-provider";

type GuideRecord = KnowledgeItemRecord & {
  sources: KnowledgeItemSourceRecord[];
  freshness?: FreshnessMeta;
};

function formatConfidenceBadge(
  confidence: GuideQaAnswer["confidence"],
  language: "ko" | "en"
) {
  if (language === "ko") {
    if (confidence === "high") return "신뢰 높음";
    if (confidence === "medium") return "신뢰 보통";
    return "추가 확인 필요";
  }

  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  return "Check needed";
}

function getGuideSections(guide: GuideRecord | null) {
  if (!guide) {
    return [];
  }

  return Object.entries(guide.payload)
    .filter(([, value]) => Array.isArray(value))
    .map(([key, value]) => ({
      key,
      title: key.replaceAll("_", " "),
      items: (value as unknown[]).map((item) => String(item))
    }));
}

export default function GuideDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ guideId?: string; stageId?: string }>();
  const { language } = useLanguage();
  const copy = getUiCopy(language);
  const [guide, setGuide] = useState<GuideRecord | null>(null);
  const [status, setStatus] = useState<string>(copy.common.loadingGuide);
  const [completionState, setCompletionState] = useState<string>("idle");
  const [question, setQuestion] = useState("");
  const [qaStatus, setQaStatus] = useState<"idle" | "loading" | "error">("idle");
  const [qaError, setQaError] = useState("");
  const [answer, setAnswer] = useState<GuideQaAnswer | null>(null);
  const apiBaseUrl = process.env.EXPO_PUBLIC_WEB_API_BASE ?? "http://localhost:3001";

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!params.guideId) {
        setStatus(copy.common.guideNotFound);
        return;
      }

      try {
        const record = await loadKnowledgeRecordById(supabase, params.guideId);

        if (cancelled) {
          return;
        }

        if (!record) {
          setGuide(null);
          setStatus(copy.common.guideNotFound);
          return;
        }

        setGuide(localizeGuideRecord(record, language));
        setStatus("");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus(error instanceof Error ? error.message : copy.common.failedToLoadGuide);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [params.guideId, language]);

  const sections = getGuideSections(guide);
  const freshness = getFreshnessPresentation(guide?.freshness);
  const completionLabel =
    params.stageId === "permit-guide"
      ? copy.guide.markPermitReviewedAndReturn
      : params.stageId === "tax-guide"
        ? copy.guide.markTaxReviewedAndReturn
        : params.stageId === "loan-guide"
          ? copy.guide.markLoanReviewedAndReturn
          : null;

  const handleMarkReviewed = async () => {
    if (!params.stageId) {
      return;
    }

    try {
      setCompletionState("saving");
      const workspace = await bootstrapAccountWorkspace(supabase);
      const nextDecisions = upsertStageDecision(workspace.state.decisions, params.stageId, {
        stageId: params.stageId,
        inputs: {
          reviewed: true
        },
        completedAt: new Date().toISOString()
      });
      const transition = completeCurrentStage(
        workspace.state.roadmap,
        nextDecisions,
        workspace.state.tasks
      );

      await saveRoadmapState(
        supabase,
        {
          roadmap: transition.roadmap,
          decisions: nextDecisions,
          tasks: workspace.state.tasks
        },
        workspace.user
      );

      router.replace("/(tabs)/current");
    } catch (error) {
      setCompletionState("error");
    }
  };

  const handleAsk = async () => {
    if (!guide || !question.trim()) {
      return;
    }

    try {
      setQaStatus("loading");
      setQaError("");
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          language === "ko" ? "로그인 세션을 다시 확인해 주세요." : "Please refresh your login session."
        );
      }

      const response = await fetch(`${apiBaseUrl}/api/ai/guides/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          guideId: guide.id,
          question: question.trim(),
          language
        })
      });

      const payload = (await response.json()) as GuideQaAnswer & {
        error?: string;
      };

      if (!response.ok || payload.error) {
        throw new Error(
          payload.error ??
            (language === "ko" ? "가이드 질문에 실패했습니다." : "Failed to answer the guide question.")
        );
      }

      const nextAnswer = payload;
      setAnswer(nextAnswer);
      setQaStatus("idle");
    } catch (error) {
      setQaStatus("error");
      setQaError(error instanceof Error ? error.message : "Failed to answer question.");
    }
  };

  return (
    <AuroraBackground>
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.button}>
            <Text style={styles.buttonText}>{copy.common.back}</Text>
          </Pressable>
          <View style={styles.navGroup}>
            <Pressable onPress={() => router.replace("/(tabs)/home")} style={styles.navButton}>
              <Text style={styles.navButtonText}>{copy.common.home}</Text>
            </Pressable>
            <Pressable onPress={() => router.replace("/(tabs)/current")} style={styles.navButton}>
              <Text style={styles.navButtonText}>{language === "ko" ? "현재 단계" : "Current"}</Text>
            </Pressable>
            <View style={[styles.navButton, styles.navButtonActive]}>
              <Text style={styles.navButtonTextActive}>{language === "ko" ? "가이드" : "Guides"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          {guide ? (
            <>
              <Text style={styles.meta}>{guide.domain}</Text>
              <Text style={styles.title}>{guide.title}</Text>
              <Text style={styles.body}>{guide.summary}</Text>
              <Text
                style={
                  freshness.tone === "critical"
                    ? styles.critical
                    : freshness.tone === "warning"
                      ? styles.warning
                      : styles.helper
                }
              >
                {freshness.summary}
              </Text>
              {guide.freshness?.notes ? <Text style={styles.helper}>{guide.freshness.notes}</Text> : null}
              {sections.map((section) => (
                <View key={section.key} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.items.map((item) => (
                    <Text key={item} style={styles.helper}>
                      {item}
                    </Text>
                  ))}
                </View>
              ))}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{copy.common.sources}</Text>
                {guide.sources.map((source) => (
                  <Pressable
                    key={source.id}
                    style={styles.sourceCard}
                    onPress={() => Linking.openURL(source.sourceUrl)}
                  >
                    <Text style={styles.sourceName}>{source.sourceName}</Text>
                    <Text style={styles.helper}>{source.sourceUrl}</Text>
                    <Text style={styles.helper}>
                      {copy.common.verified} {source.verifiedAt.slice(0, 10)}
                      {source.expiresAt ? ` · ${copy.common.expires} ${source.expiresAt.slice(0, 10)}` : ""}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{language === "ko" ? "가이드 Q&A" : "Guide Q&A"}</Text>
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder={
                    language === "ko"
                      ? "현재 가이드에 대해 궁금한 점을 적어보세요."
                      : "Ask a question about this guide."
                  }
                  multiline
                  style={styles.input}
                />
                <Pressable
                  onPress={handleAsk}
                  disabled={!question.trim() || qaStatus === "loading"}
                  style={[styles.button, (!question.trim() || qaStatus === "loading") && styles.buttonDisabled]}
                >
                  <Text style={styles.buttonText}>
                    {qaStatus === "loading"
                      ? language === "ko" ? "해석 중..." : "Answering..."
                      : language === "ko" ? "질문하기" : "Ask"}
                  </Text>
                </Pressable>
                {qaError ? <Text style={styles.warning}>{qaError}</Text> : null}
                {answer ? (
                  <View style={styles.answerCard}>
                    <View style={styles.answerMetaRow}>
                      <Text style={styles.sectionTitle}>
                        {language === "ko" ? "AI 해석 · 가이드 근거 기반" : "AI interpretation · grounded in guide content"}
                      </Text>
                      <Text style={styles.confidenceBadge}>{formatConfidenceBadge(answer.confidence, language)}</Text>
                    </View>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>{language === "ko" ? "짧은 답" : "Short answer"}</Text>
                      <Text style={styles.body}>{answer.shortAnswer}</Text>
                    </View>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>{language === "ko" ? "근거" : "Reasoning"}</Text>
                      <Text style={styles.helper}>{answer.explanation}</Text>
                    </View>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>{language === "ko" ? "주의할 점" : "Cautions"}</Text>
                      {answer.cautions.map((item) => (
                        <Text key={item} style={styles.helper}>• {item}</Text>
                      ))}
                    </View>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>{language === "ko" ? "다음 행동" : "Next actions"}</Text>
                      {answer.nextActions.map((item) => (
                        <Text key={item} style={styles.helper}>• {item}</Text>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
              {completionLabel ? (
                <View style={styles.section}>
                  <Pressable
                    onPress={() => void handleMarkReviewed()}
                    disabled={completionState === "saving"}
                    style={[styles.button, completionState === "saving" && styles.buttonDisabled]}
                  >
                    <Text style={styles.buttonText}>
                      {completionState === "saving" ? copy.common.saving : completionLabel}
                    </Text>
                  </Pressable>
                  {completionState === "error" ? (
                    <Text style={styles.warning}>{copy.common.guideReviewSaveFailed}</Text>
                  ) : null}
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.helper}>{status}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent"
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 20
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  },
  navGroup: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    padding: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: "rgba(255,255,255,0.5)"
  },
  button: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.82)",
    backgroundColor: "rgba(255,255,255,0.74)",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  navButton: {
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  navButtonActive: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.82)",
    backgroundColor: "rgba(255,255,255,0.72)"
  },
  buttonText: {
    color: "#101820",
    fontSize: 14,
    fontWeight: "500"
  },
  navButtonText: {
    color: "#637083",
    fontSize: 13,
    fontWeight: "500"
  },
  navButtonTextActive: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600"
  },
  buttonDisabled: {
    opacity: 0.55
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.76)",
    borderRadius: radii.card,
    padding: 22,
    gap: 16,
    ...shadows.glassCard
  },
  meta: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.primary
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    color: "#101820"
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: "#637083"
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 104,
    textAlignVertical: "top",
    fontSize: 16,
    lineHeight: 24,
    color: "#101820"
  },
  helper: {
    fontSize: 15,
    lineHeight: 24,
    color: "#637083"
  },
  warning: {
    fontSize: 14,
    lineHeight: 22,
    color: "#C58B2A"
  },
  critical: {
    fontSize: 14,
    lineHeight: 22,
    color: "#B64C4C"
  },
  section: {
    gap: 10,
    paddingTop: 4
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#637083"
  },
  answerCard: {
    gap: 12,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 18
  },
  answerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap"
  },
  confidenceBadge: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: "#637083"
  },
  sourceCard: {
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(17,17,17,0.08)"
  },
  sourceName: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    color: colors.primary
  }
});

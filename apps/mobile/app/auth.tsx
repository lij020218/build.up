import {
  bootstrapAccountWorkspace,
  getAuthErrorMessage,
  getUiCopy,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  updateCurrentUserPassword,
  type Language
} from "@build-up/shared";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useLanguage } from "./language-provider";

type AuthMode = "signup" | "login" | "password";

export default function AuthScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = getUiCopy(language);
  const storyCards = useMemo(() => getStoryCards(language), [language]);
  const modeHints = useMemo(() => getModeHints(language), [language]);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [message, setMessage] = useState<string>(copy.auth.initialMessage);
  const [loading, setLoading] = useState(false);

  const run = async (action: () => Promise<void>) => {
    try {
      setLoading(true);
      await action();
    } catch (error) {
      setMessage(getAuthErrorMessage(error) || copy.auth.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () =>
    run(async () => {
      await signUpWithEmail(supabase, {
        name,
        email,
        password
      });

      const result = await bootstrapAccountWorkspace(supabase);
      setMessage(result.isNew ? copy.auth.accountCreatedNew : copy.auth.accountCreatedExisting);
      router.replace("/");
    });

  const handleLogin = () =>
    run(async () => {
      await signInWithEmail(supabase, {
        email,
        password
      });

      const result = await bootstrapAccountWorkspace(supabase);
      setMessage(result.isNew ? copy.auth.loggedInNew : copy.auth.loggedIn);
      router.replace("/");
    });

  const handlePasswordChange = () =>
    run(async () => {
      await updateCurrentUserPassword(supabase, nextPassword);
      setMessage(copy.auth.passwordUpdated);
      setNextPassword("");
    });

  const handleLogout = () =>
    run(async () => {
      await signOutUser(supabase);
      setMessage(copy.auth.signedOut);
    });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>build.up</Text>
          </View>
          <Pressable style={styles.ghostButton} onPress={() => router.replace("/")}>
            <Text style={styles.ghostButtonText}>{language === "ko" ? "서비스" : "App"}</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>{copy.auth.eyebrow}</Text>
          </View>
          <Text style={styles.title}>
            {language === "ko" ? "차분하게 시작하고\n같은 흐름을 계속 이어가세요." : "Start calmly,\nthen keep the same flow moving."}
          </Text>
          <Text style={styles.subtitle}>
            {language === "ko"
              ? "로그인과 회원가입은 단순하게, 서비스 설명은 아래에서 천천히 보이도록 정리했습니다."
              : "Authentication stays simple. The service explains itself gradually as you scroll."}
          </Text>
        </View>

        <View style={styles.authCard}>
          <View style={styles.authHeader}>
            <Text style={styles.authLabel}>{language === "ko" ? "계정" : "Account"}</Text>
            <Text style={styles.authTitle}>
              {language === "ko" ? "회원가입, 로그인,\n비밀번호 변경" : "Sign up, log in,\nor update password"}
            </Text>
            <Text style={styles.authBody}>{copy.auth.subtitle}</Text>
          </View>

          <View style={styles.modeRow}>
            {(["signup", "login", "password"] as const).map((nextMode) => (
              <Pressable
                key={nextMode}
                onPress={() => setMode(nextMode)}
                style={[styles.modeChip, mode === nextMode && styles.modeChipSelected]}
              >
                <Text style={[styles.modeTitle, mode === nextMode && styles.modeTitleSelected]}>
                  {authModeLabel(nextMode, language)}
                </Text>
                <Text style={styles.modeHint}>{modeHints[nextMode]}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{authModeHeading(mode, language)}</Text>
            <Text style={styles.formBody}>{authModeBody(mode, language)}</Text>

            {mode === "signup" ? (
              <View style={styles.form}>
                <Field label={copy.auth.name} value={name} onChangeText={setName} />
                <Field label={copy.auth.email} value={email} onChangeText={setEmail} keyboardType="email-address" />
                <Field label={copy.auth.passwordLabel} value={password} onChangeText={setPassword} secureTextEntry />
                <Pressable style={styles.primaryButton} onPress={handleSignup} disabled={loading}>
                  <Text style={styles.primaryButtonText}>{copy.auth.createAccount}</Text>
                </Pressable>
              </View>
            ) : null}

            {mode === "login" ? (
              <View style={styles.form}>
                <Field label={copy.auth.email} value={email} onChangeText={setEmail} keyboardType="email-address" />
                <Field label={copy.auth.passwordLabel} value={password} onChangeText={setPassword} secureTextEntry />
                <View style={styles.buttonRow}>
                  <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
                    <Text style={styles.primaryButtonText}>{copy.auth.logIn}</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryButton} onPress={handleLogout} disabled={loading}>
                    <Text style={styles.secondaryButtonText}>{copy.auth.logOut}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {mode === "password" ? (
              <View style={styles.form}>
                <Field
                  label={copy.auth.newPassword}
                  value={nextPassword}
                  onChangeText={setNextPassword}
                  secureTextEntry
                />
                <Pressable style={styles.primaryButton} onPress={handlePasswordChange} disabled={loading}>
                  <Text style={styles.primaryButtonText}>{copy.auth.updatePassword}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>{language === "ko" ? "현재 상태" : "Current status"}</Text>
            <Text style={styles.statusMessage}>{message}</Text>
          </View>
        </View>

        <View style={styles.storyStack}>
          {storyCards.map((card) => (
            <View key={card.title} style={styles.storyCard}>
              <Text style={styles.storyLabel}>{card.label}</Text>
              <Text style={styles.storyTitle}>{card.title}</Text>
              <Text style={styles.storyBody}>{card.body}</Text>
              <View style={styles.storyMetrics}>
                {card.metrics.map((metric) => (
                  <View key={metric.label} style={styles.storyMetric}>
                    <Text style={styles.storyMetricLabel}>{metric.label}</Text>
                    <Text style={styles.storyMetricValue}>{metric.value}</Text>
                    <Text style={styles.storyMetricBody}>{metric.body}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function authModeLabel(mode: AuthMode, language: Language) {
  if (language === "ko") {
    return mode === "signup" ? "회원가입" : mode === "login" ? "로그인" : "비밀번호";
  }

  return mode === "signup" ? "Sign up" : mode === "login" ? "Log in" : "Password";
}

function authModeHeading(mode: AuthMode, language: Language) {
  if (language === "ko") {
    return mode === "signup"
      ? "새 계정 만들기"
      : mode === "login"
        ? "저장된 흐름 이어가기"
        : "비밀번호 바꾸기";
  }

  return mode === "signup"
    ? "Create your account"
    : mode === "login"
      ? "Return to your roadmap"
      : "Update password";
}

function authModeBody(mode: AuthMode, language: Language) {
  if (language === "ko") {
    return mode === "signup"
      ? "이름, 이메일, 비밀번호만 입력하면 바로 build.up 흐름을 시작할 수 있습니다."
      : mode === "login"
        ? "저장된 진행 상태와 최근 분석을 계정 기준으로 다시 불러옵니다."
        : "현재 세션을 유지한 채 계정 비밀번호를 업데이트합니다.";
  }

  return mode === "signup"
    ? "Create an account with only your name, email, and password."
    : mode === "login"
      ? "Restore saved progress and recent analysis from your account."
      : "Update the current account password while keeping this session active.";
}

function getModeHints(language: Language) {
  if (language === "ko") {
    return {
      signup: "새 계정과 첫 로드맵",
      login: "저장 상태 복귀",
      password: "현재 계정 보안"
    };
  }

  return {
    signup: "Fresh account",
    login: "Resume saved flow",
    password: "Account security"
  };
}

function getStoryCards(language: Language) {
  if (language === "ko") {
    return [
      {
        label: "roadmap",
        title: "지금 필요한 단계만\n앞으로 꺼내줍니다",
        body: "build.up은 많은 대시보드 대신, 지금 처리해야 할 단계와 바로 다음 흐름만 남겨둡니다.",
        metrics: [
          { label: "현재 단계", value: "1개", body: "지금 해야 할 행동만 크게 보여줍니다." },
          { label: "저장", value: "계정 기준", body: "진행 상황과 최근 분석이 함께 복원됩니다." }
        ]
      },
      {
        label: "verified guidance",
        title: "가이드는 출처와\n최신성 기준으로 설명합니다",
        body: "인허가, 세무, 대출 정보는 출처와 검증 시점을 같이 보여주고, AI는 그 안에서만 해석합니다.",
        metrics: [
          { label: "출처", value: "명시", body: "가이드마다 근거가 함께 남습니다." },
          { label: "AI", value: "해석 중심", body: "결정을 대신하지 않고 판단을 돕습니다." }
        ]
      },
      {
        label: "analysis layer",
        title: "계약서와 재무 결과도\n같은 흐름 안에 남깁니다",
        body: "위험 조항과 재무 시뮬레이션 해석은 저장되고, 다시 돌아왔을 때 같은 단계 안에서 이어집니다.",
        metrics: [
          { label: "계약서", value: "위험 플래그", body: "누락 항목과 특약 이상 여부를 먼저 짚습니다." },
          { label: "재무", value: "해석 카드", body: "숫자 결과를 행동 권고로 번역합니다." }
        ]
      }
    ];
  }

  return [
    {
      label: "roadmap",
      title: "Only the next useful step\nstays in front of you",
      body: "build.up replaces a noisy dashboard with the current stage and the next move that matters.",
      metrics: [
        { label: "Current step", value: "1", body: "Only the next action is emphasized." },
        { label: "State", value: "Account-based", body: "Progress and analysis restore together." }
      ]
    },
    {
      label: "verified guidance",
      title: "Guidance stays grounded\nin sources and freshness",
      body: "Permits, tax, and loan guidance remain tied to source-backed content with visible verification timing.",
      metrics: [
        { label: "Sources", value: "Visible", body: "Every guide shows where it comes from." },
        { label: "AI", value: "Interpretive", body: "It helps reasoning without replacing decisions." }
      ]
    },
    {
      label: "analysis layer",
      title: "Contract and finance insight\nstay in the same flow",
      body: "Risk flags and financial interpretation are saved so you can resume them without losing context.",
      metrics: [
        { label: "Contracts", value: "Flagged", body: "Missing checks and risky clauses surface early." },
        { label: "Finance", value: "Interpreted", body: "Simulation output turns into action guidance." }
      ]
    }
  ];
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType}
        autoCapitalize="none"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA"
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 18
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "rgba(255,255,255,0.76)"
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#075E66"
  },
  brandText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#101820"
  },
  ghostButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "rgba(255,255,255,0.76)"
  },
  ghostButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#101820"
  },
  hero: {
    gap: 14,
    paddingTop: 8,
    paddingHorizontal: 4
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "rgba(255,255,255,0.74)"
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 8,
    backgroundColor: "#075E66"
  },
  eyebrowText: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#075E66"
  },
  title: {
    fontSize: 42,
    lineHeight: 42,
    fontWeight: "700",
    letterSpacing: -1.9,
    color: "#0E1116"
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 28,
    color: "#637083"
  },
  authCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
    padding: 18,
    gap: 16,
    shadowColor: "#101820",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 }
  },
  authHeader: {
    gap: 8
  },
  authLabel: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#7B8290"
  },
  authTitle: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "700",
    letterSpacing: -1.2,
    color: "#101820"
  },
  authBody: {
    fontSize: 14,
    lineHeight: 23,
    color: "#637083"
  },
  modeRow: {
    gap: 10
  },
  modeChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "rgba(255,255,255,0.86)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4
  },
  modeChipSelected: {
    borderColor: "rgba(7,94,102,0.2)",
    backgroundColor: "rgba(7,94,102,0.06)"
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#101820"
  },
  modeTitleSelected: {
    color: "#075E66"
  },
  modeHint: {
    fontSize: 12,
    lineHeight: 18,
    color: "#7B8290"
  },
  formCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.07)",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 16,
    gap: 14
  },
  formTitle: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "700",
    color: "#101820"
  },
  formBody: {
    fontSize: 14,
    lineHeight: 22,
    color: "#637083"
  },
  form: {
    gap: 14
  },
  field: {
    gap: 8
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#324255"
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#101820"
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap"
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: "#075E66",
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600"
  },
  secondaryButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButtonText: {
    color: "#101820",
    fontSize: 15,
    fontWeight: "500"
  },
  statusCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.07)",
    backgroundColor: "rgba(245,247,250,0.9)",
    padding: 14,
    gap: 6
  },
  statusLabel: {
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#7B8290"
  },
  statusMessage: {
    fontSize: 14,
    lineHeight: 22,
    color: "#324255"
  },
  storyStack: {
    gap: 14
  },
  storyCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
    backgroundColor: "rgba(255,255,255,0.78)",
    padding: 20,
    gap: 16,
    shadowColor: "#101820",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 }
  },
  storyLabel: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#7B8290"
  },
  storyTitle: {
    fontSize: 26,
    lineHeight: 29,
    fontWeight: "700",
    letterSpacing: -1,
    color: "#101820"
  },
  storyBody: {
    fontSize: 15,
    lineHeight: 25,
    color: "#637083"
  },
  storyMetrics: {
    gap: 10
  },
  storyMetric: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.07)",
    backgroundColor: "rgba(255,255,255,0.72)",
    padding: 14,
    gap: 6
  },
  storyMetricLabel: {
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#7B8290"
  },
  storyMetricValue: {
    fontSize: 19,
    lineHeight: 21,
    fontWeight: "700",
    color: "#101820"
  },
  storyMetricBody: {
    fontSize: 13,
    lineHeight: 20,
    color: "#637083"
  }
});

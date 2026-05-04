import type { Language } from "@build-up/shared";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, shadows } from "./design";

let memoryLanguage: Language = "en";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider(props: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(memoryLanguage);

  const setLanguage = (next: Language) => {
    memoryLanguage = next;
    setLanguageState(next);
  };

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {props.children}
      <View pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.toggle}>
          {(["ko", "en"] as const).map((next) => (
            <Pressable
              key={next}
              onPress={() => setLanguage(next)}
              style={[styles.button, language === next && styles.buttonActive]}
            >
              <Text style={[styles.buttonText, language === next && styles.buttonTextActive]}>
                {next === "ko" ? "한국어" : "EN"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 52,
    right: 18,
    zIndex: 1000
  },
  toggle: {
    flexDirection: "row",
    gap: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: "rgba(255,255,255,0.82)",
    padding: 4,
    ...shadows.glassCard
  },
  button: {
    minHeight: 32,
    borderRadius: radii.sm,
    paddingHorizontal: 9,
    paddingVertical: 7
  },
  buttonActive: {
    backgroundColor: colors.primary
  },
  buttonText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted
  },
  buttonTextActive: {
    color: "#FFFFFF"
  }
});

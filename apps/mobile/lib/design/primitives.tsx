import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, shadows } from "./tokens";

export function GlassCard(props: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  return (
    <BlurView intensity={36} tint="light" style={[cardStyles.glassCard, props.compact && cardStyles.glassCardCompact, props.style]}>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.88)", "rgba(255,255,255,0.62)"]}
        style={StyleSheet.absoluteFill}
      />
      {props.children}
    </BlurView>
  );
}

export function GradientButton(props: Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { children, style, textStyle, ...pressableProps } = props;
  return (
    <Pressable
      {...pressableProps}
      style={({ pressed }) => [
        buttonStyles.gradientButtonFrame,
        pressed && buttonStyles.gradientButtonPressed,
        style
      ]}
    >
      <LinearGradient
        colors={[colors.primaryTop, colors.primaryBottom]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={buttonStyles.gradientButton}
      >
        {typeof children === "string" ? (
          <Text style={[buttonStyles.gradientButtonText, textStyle]}>{children}</Text>
        ) : children}
      </LinearGradient>
    </Pressable>
  );
}

export function SectionLabel(props: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[textStyles.sectionLabel, props.style]}>{props.children}</Text>;
}

const cardStyles = StyleSheet.create({
  glassCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    backgroundColor: "rgba(255,255,255,0.62)",
    padding: 20,
    gap: 12,
    overflow: "hidden",
    ...shadows.glassCard
  },
  glassCardCompact: {
    borderRadius: radii.xl,
    padding: 16
  }
});

const buttonStyles = StyleSheet.create({
  gradientButtonFrame: {
    minHeight: 46,
    borderRadius: radii.md,
    overflow: "hidden",
    ...shadows.primaryButton
  },
  gradientButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 13
  },
  gradientButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }]
  },
  gradientButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600"
  }
});

const textStyles = StyleSheet.create({
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: colors.muted
  }
});

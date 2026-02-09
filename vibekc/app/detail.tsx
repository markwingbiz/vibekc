// app/detail.tsx
import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { BrandBackground } from "./ui/BrandBackground";
import { BrandCard } from "./ui/BrandCard";
import { BrandHeader } from "./ui/BrandHeader";
import { spacing, theme } from "./ui/theme";

export default function DetailScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <BrandBackground />

      <View style={styles.container}>
        <BrandHeader tagline="Pick a vibe. Pick a plan." />

        <BrandCard>
          <Text style={styles.h2}>Detail</Text>
          <Text style={styles.sub}>This screen is now using spacing + theme correctly.</Text>
        </BrandCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl, // ✅ FIXED: was SPACING.xl
  },

  h2: {
    color: theme.text, // ✅ FIXED: was COLORS.textPrimary
    fontSize: 22,
    fontWeight: "900",
  },

  sub: {
    color: theme.subtext, // ✅ FIXED: was COLORS.textSecondary
    marginTop: 8,
    fontWeight: "700",
  },
});

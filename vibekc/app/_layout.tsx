// app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* These are your main pages */}
      <Stack.Screen name="index" />
      <Stack.Screen name="events" />
      <Stack.Screen name="personal" />

      {/* Separate persona builder page */}
      <Stack.Screen name="persona" />
    </Stack>
  );
}

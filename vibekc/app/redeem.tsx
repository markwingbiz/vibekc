// app/redeem.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { useRouter } from "expo-router";

import { createQrToken, QrTokenRecord, clearAllTokens } from "../lib/qrTokens";

export default function RedeemScreen() {
  const router = useRouter();
  const [record, setRecord] = useState<QrTokenRecord | null>(null);

  const qrValue = useMemo(() => {
    if (!record) return "";
    // Payload format (simple + demo-friendly):
    // vibekc://redeem?token=OAB-XXXX
    return `vibekc://redeem?token=${encodeURIComponent(record.token)}`;
  }, [record]);

  async function onGenerate() {
    const r = await createQrToken({
      // optional: attach metadata later
      offerId: "first-time-credit",
      venueId: "demo-venue",
      valueCents: 1000,
    });
    setRecord(r);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#000000", "#0b1020", "#140a2b", "#000000"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.wrap}>
        <Text style={styles.title}>QR Token Generator</Text>
        <Text style={styles.sub}>
          Generate a redeemable token and show it as a QR code.
        </Text>

        <View style={styles.card}>
          {record ? (
            <>
              <View style={styles.qrBox}>
                <QRCode value={qrValue} size={220} />
              </View>

              <Text style={styles.label}>Token</Text>
              <Text style={styles.token}>{record.token}</Text>

              <Text style={styles.meta}>
                Created: {new Date(record.createdAtISO).toLocaleString()}
              </Text>

              <Pressable style={styles.btn} onPress={() => router.push("/scan")}>
                <Text style={styles.btnText}>Open Scanner</Text>
              </Pressable>

              <Pressable style={[styles.btn, styles.btnGhost]} onPress={onGenerate}>
                <Text style={[styles.btnText, styles.btnGhostText]}>Generate New</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.empty}>No token yet.</Text>
              <Pressable style={styles.btn} onPress={onGenerate}>
                <Text style={styles.btnText}>Generate Token</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => router.push("/scan")}
              >
                <Text style={[styles.btnText, styles.btnGhostText]}>Open Scanner</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, styles.btnDanger]}
                onPress={async () => {
                  await clearAllTokens();
                  setRecord(null);
                }}
              >
                <Text style={styles.btnText}>Reset Demo Tokens</Text>
              </Pressable>
            </>
          )}
        </View>

        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 18, justifyContent: "center" },
  title: { color: "white", fontSize: 26, fontWeight: "900", marginBottom: 6 },
  sub: { color: "rgba(255,255,255,0.75)", marginBottom: 14 },

  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  qrBox: {
    alignSelf: "center",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    marginBottom: 14,
  },

  label: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  token: { color: "white", fontSize: 18, fontWeight: "900", marginTop: 4 },
  meta: { color: "rgba(255,255,255,0.7)", marginTop: 10 },

  empty: { color: "rgba(255,255,255,0.8)", marginBottom: 12 },

  btn: {
    marginTop: 12,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  btnText: { color: "#0b0b0b", fontWeight: "900", fontSize: 16 },

  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  btnGhostText: { color: "white" },

  btnDanger: {
    backgroundColor: "rgba(255, 80, 80, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 80, 80, 0.35)",
  },

  back: { marginTop: 14, alignSelf: "center", padding: 10 },
  backText: { color: "rgba(255,255,255,0.8)" },
});

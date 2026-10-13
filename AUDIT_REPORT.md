# VibeKC / Bownd — Code Audit Report

**Date:** 2026-10-12
**Branch audited:** `muse/vibekc-recovery` (working tree clean)
**Scope:** `~/workspace/vibekc/vibekc/` (the real Expo app)
**Method:** Read-only static audit — no files modified, no installs run, no builds executed. Findings are from direct source reading (file + line references). Nothing below was verified by running the app.

## 0. Repository layout (confirmed)

- **Repo root `~/workspace/vibekc/` is a stale scaffold** — `App.js` is just `import "expo-router/entry"`, `app/index.tsx` is the Expo "Hello World" template, and its `package.json` mirrors the nested app's. It is **not** the application.
- **The real app is `~/workspace/vibekc/vibekc/`**: Expo SDK 54, expo-router v6 (`expo-router/entry`), TypeScript strict, ~7,300 lines across `app/`, `components/`, `src/`, `lib/`, `data/`.
- **No `package-lock.json` and no `node_modules/` exist inside `vibekc/`** — reproducible installs cannot currently be verified for the real app. (A lockfile exists only at the stale repo root.)
- `package.json` pins `react: 19.1.0` with `react-native: ^0.81.5` (floating) — the known ERESOLVE conflict (RN 0.81.x peer range vs React 19.1.0) lives here; dependency repair is tracked separately.

---

## 1. Home screen and tab navigation (expo-router) — PARTIAL

- There is **no `app/(tabs)/_layout.tsx`**. Without it, the `(tabs)` group renders under the root `Stack`, so there is **no real tab navigator** — "tabs" are faked with pill buttons that call `router.push()`.
- `app/(tabs)/home.tsx` `go()` (line ~108) pushes `/(tabs)/home`, `/(tabs)/events`, `/(tabs)/personal` onto the stack on every tap — the stack grows unboundedly and the OS back button walks back through duplicate tab screens instead of exiting.
- `app/(tabs)/events.tsx` "Personal" top-nav button calls `router.push("/personal")`, and `components/ui/TopTabs.tsx` `go("personal")` does the same — **but `app/personal.tsx` does not exist**. Root `_layout.tsx` even declares `<Stack.Screen name="personal" />` for this phantom route. Tapping it leads to an unmatched route (blank/error screen). BROKEN link inside an otherwise working screen.
- `@react-navigation/bottom-tabs` and `@react-navigation/native` are in `package.json` but **imported nowhere** — dead weight; the app doesn't use them.

## 2. Events list and event details (incl. EventDetailsModal) — PARTIAL

- Two events screens exist and both render: `app/(tabs)/events.tsx` (rich: search, time chips, Tailored/Spotlight/Top Venues rails, persona toggle) and `app/events.tsx` (simpler list with Personalized/All + quick filters). Both read live relative dates from `data/events.ts` (`isoInHours()`), so content never goes stale.
- `app/detail.tsx` is a **placeholder** — it renders static "Detail" text and **ignores the `id` param** that `app/list.tsx` passes via `router.push({ pathname: "/detail", params: { id } })`. The event→detail flow is a dead end.
- `components/EventDetailsModal.tsx` (65 lines) is **defined but imported nowhere** — the intended event-detail UI is unused.
- `data/events.data.ts` is a **stale duplicate** of `data/events.ts` with hardcoded January-2026 dates (expired) and an extra `distanceMi` field. It is imported nowhere (the one `from "../data/events.data"` match is inside a comment in `app/events.tsx`). Dead file, but a trap for future editors.

## 3. Venue listings and discovery — PARTIAL

- `data/venues.ts` has 25 KC venues with `lat`/`lng`, and both events screens render venue names plus "Top Venues" horizontal lists.
- There is **no venue detail screen, no venue search/dedicated discovery screen, and no distance-based sorting** — "discovery" is just horizontal rails of names. Tapping a venue navigates to the events list (`router.push("/(tabs)/events")`), not to anything venue-specific.

## 4. Personalized experiences / persona — BROKEN

- **The reachable persona builder silently discards input.** `app/persona.tsx` (the `/persona` route linked from every "Change persona" button) defines `savePersonaLocal()` (line 27) as an explicit **no-op placeholder** ("wire to AsyncStorage or your existing personaStore"). Tapping "Save Persona" saves nothing.
- **The working builder is unreachable.** `app/(tabs)/persona.tsx` correctly uses `savePersona` from `lib/personaStore.ts`, but no navigation targets `/(tabs)/persona` — all in-app links point at the broken `/persona`.
- **The "Personalized" filter on the tabs events screen is a silent no-op.** `app/(tabs)/events.tsx` `matchesPersona()` reads `persona.audienceTags` / `persona.vibeTags`, but `lib/personaStore.ts` `normalizePersona()` strips everything except `{audience, vibe}` — those fields are always `undefined`, so the filter's empty-array fallback returns `true` for every event. (It is also a TypeScript strict-mode error: `PersonaProfile` has no `audienceTags`.) The root `app/events.tsx` version (using singular `persona.audience`/`persona.vibe`) is the only correct one.
- Three divergent persona type definitions exist: `lib/personaStore.ts`, `app/persona.tsx` (local), `data/persona.ts` (imported nowhere; its `vibe` union omits `"sporty"`).

## 5. Location and distance filtering — MISSING

- `expo-location` is in `package.json` but **never imported or called anywhere** — no permission request, no `getCurrentPositionAsync`, no distance filtering on any screen.
- `lib/location.ts` is **only Haversine math** (`distanceMiles`, `LatLng{latitude,longitude}`) despite its name; `lib/distance.ts` is a **duplicate Haversine** (`milesBetween`, `LatLng{lat,lng}`) with a conflicting coordinate shape. Both are imported nowhere — dead duplicated code.
- Venues carry `lat`/`lng` but nothing ever computes distance to the user.

## 6. Firebase configuration and initialization — PARTIAL

- `lib/firebase.ts` init code is structurally correct: `getApps().length ? getApp() : initializeApp(...)` guard, exports `db` via `getFirestore`.
- **A hardcoded Firebase `apiKey` (plus full project config) is committed in `lib/firebase.ts`.** Presence flagged only — value not reproduced. (Firebase client keys are public-by-design, but committing them is still poor hygiene; rotation/moved-to-env is recommended.)
- **Nothing imports `lib/firebase.ts`.** No auth, no Firestore reads/writes are wired into any screen. Firebase is effectively unintegrated.

## 7. User authentication and profiles — MISSING

- Zero auth code in the codebase: no `getAuth`, `signIn*`, `onAuthStateChanged`, or user-profile screens. There is no login, signup, session, or profile feature at all.

## 8. QR code generation and scanning — PARTIAL

- `app/redeem.tsx` **works in isolation**: `createQrToken()` from `lib/qrTokens.ts` (SecureStore-backed, with `getTokenRecord`/`redeemToken`) + renders via `react-native-qrcode-svg` (declared dep ✓). **But it has zero navigation references — unreachable.**
- `app/qr.tsx` and `app/scan.tsx` are **duplicate QR scanners** (both `CameraView` + permission flow). Neither generates a QR code, and neither validates scanned data — both just `Alert.alert()` the raw string. Neither calls `lib/qrTokens.ts`.
- `app/(tabs)/personal.tsx` QR section is placeholder: fake `OUTNABOUT-XXXX` token from `Math.random()`, an `Ionicons` "qr-code-outline" glyph, and the literal text **"Add real QR render later"** (line 272).
- `components/ui/PersonalQrPanel.tsx` (a proper QR display panel) is imported nowhere; its default `scannerRoute = "/redeem"` is wrong anyway (`/redeem` is the generator, the scanner is `/scan`).
- `expo-camera` permission handling in both scanners is reasonable; camera scanning needs a dev build or Expo Go with camera support (unverified here).

## 9. Rewards and redemptions — PARTIAL

- `lib/redemptions.ts` is a **complete Firestore redemption flow** (`createRedemption`, `validateAndRedeem` with NEW/REDEEMED/EXPIRED states, `serverTimestamp`) — but **imported nowhere** (and depends on the unintegrated Firebase above). Token uses client-side `Math.random()` for Firestore doc IDs (demo-grade, predictable).
- `app/(tabs)/personal.tsx` Rewards section is **hardcoded demo**: `points = 420`, `nextTierAt = 600`, and the "Redeem" `Pressable` has an empty `onPress={() => {}}` (line ~323). The manual-code redeem there just `Alert.alert("Redeemed!")` without touching `lib/qrTokens` or `lib/redemptions`.
- The real redeem screen (`/redeem`) is unreachable (see §8).

## 10. Favorites and saved experiences — PARTIAL

- `app/(tabs)/personal.tsx` renders Favorite Venues / Favorite Events / Recent Adventures, but all are **hardcoded `useMemo` demo arrays** — no AsyncStorage/SecureStore persistence, no add/remove actions. Every tile's `onPress={() => {}}` is dead.
- No favorites state exists anywhere else in the app.

## 11. Visual components and premium styling — PARTIAL

- The premium kit largely exists and is used: `GlassCard`, `GlowButton`, `GlowPill`, `GlowOption`, `BrandBackground`, `BrandCard` (`app/ui/`) with a coherent dark/glass/purple design language; `SpaceUI` (`SpaceBackground`, `Glass`, `PrimaryButton`, `GhostButton`, `THEME`) backs the tabs persona screen.
- **CRITICAL: `BrandHeader` is default-exported but imported as a named import.** `app/ui/BrandHeader.tsx` has only `export default function BrandHeader()` (and takes no props), yet `app/detail.tsx` (line 4), `app/list.tsx` (line 6), and `app/vibe.tsx` (line 8) all do `import { BrandHeader } from "./ui/BrandHeader"` → `BrandHeader` is `undefined` → **"Element type is invalid" runtime crash** on all three screens (they also pass a `tagline` prop the component ignores).
- **Three near-duplicate theme files** with slightly different values: `app/theme.ts` (imported nowhere — dead), `app/ui/theme.ts` (used by `app/ui/*`), `src/ui/theme.ts` (used by `src/*`; has `colors.bgBottom` vs `bgBot` naming drift).
- **Nine dead UI components** with zero importers: `ActionButtons`, `ExploreBackground`, `HomeActionCard`, `HomeTabs`, `ParallaxOrb`, `PersonalQrPanel`, `ScreenBackground`, `SpotlightCard`, `TabsRow` (all in `components/ui/`), plus the entire `components/home/` subtree (`ColorBandCard`, `EventCards`, `PillRow`, `VenueAvatarsRow`).
- Duplicate `GlassCard`: `app/ui/GlassCard.tsx` vs `src/ui/GlassCard.tsx` (both define it; only `src`'s is used, by the unwired PlanningScreen).
- `@expo/vector-icons` is imported by 3 files (`(tabs)/home.tsx`, `(tabs)/personal.tsx`, `app/persona.tsx`) but **not declared in `package.json`** — it resolves transitively via the `expo` package (confirmed in root lockfile), so it works today, but a clean `npx expo install` won't guarantee it. Should be added explicitly.
- Unused deps in `package.json`: `@react-native-community/slider`, `@react-navigation/bottom-tabs`, `@react-navigation/native`, `expo-crypto` (none imported anywhere).

## 12. Planning screen (`src/screens/PlanningScreen.tsx`) — BROKEN

- **Not wired into navigation** — zero references from any route or screen.
- **Requires 4 image assets that don't exist**: `require("../../assets/nebula.png")` (actual file is `assets/backgrounds/nebula.png`), plus `orb_pink.png`, `orb_purple.png`, `orb_blue.png` (nonexistent; only `assets/overlays/orb.png` exists). Metro fails to bundle on unresolvable `require()` — **importing this file would break the build**.
- Its `OptionRow`/`PrimaryButton` usages pass no `onPress` (allowed — optional props) so buttons would be dead but not crash; `theme.colors.bgBottom` does resolve in `src/ui/theme.ts`.

---

## Cross-cutting issue index

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 1 | Named import of default-exported `BrandHeader` → runtime crash | `app/detail.tsx:4`, `app/list.tsx:6`, `app/vibe.tsx:8` vs `app/ui/BrandHeader.tsx:3` | Critical |
| 2 | No `app/(tabs)/_layout.tsx` — fake push-based "tabs", unbounded stack growth | `app/(tabs)/` | High |
| 3 | `router.push("/personal")` → route file doesn't exist | `app/(tabs)/events.tsx`, `components/ui/TopTabs.tsx`; phantom `<Stack.Screen name="personal" />` in `app/_layout.tsx` | High |
| 4 | Reachable persona builder is a no-op (`savePersonaLocal` placeholder); working builder unreachable; tabs "Personalized" filter reads fields the store strips | `app/persona.tsx:27`, `app/(tabs)/persona.tsx`, `app/(tabs)/events.tsx` `matchesPersona` | High |
| 5 | PlanningScreen `require()`s 4 missing PNGs → Metro bundle failure if imported | `src/screens/PlanningScreen.tsx:19-37` | High |
| 6 | Hardcoded Firebase apiKey + config committed | `lib/firebase.ts:7-14` (presence only) | Medium |
| 7 | `expo-location` never used; location/distance filtering absent; duplicate dead Haversine libs with conflicting `LatLng` shapes | `lib/location.ts`, `lib/distance.ts` | Medium |
| 8 | Duplicate scanner screens (`qr.tsx` + `scan.tsx`); scanned data never validated/redeemed; real generator (`redeem.tsx`) unreachable | `app/qr.tsx`, `app/scan.tsx`, `app/redeem.tsx` | Medium |
| 9 | Stale duplicate data file with expired Jan-2026 dates | `data/events.data.ts` | Low |
| 10 | 3 duplicate theme files; `app/theme.ts` dead | `app/theme.ts`, `app/ui/theme.ts`, `src/ui/theme.ts` | Low |
| 11 | `@expo/vector-icons` undeclared (transitive-only); 4 unused deps | `package.json` | Low |
| 12 | `EventDetailsModal`, `components/home/*`, 9 `components/ui/*` components, `data/persona.ts`, `lib/backgrounds.ts` (empty) — all dead code | various | Low |

### Orphaned screens (exist but unreachable via navigation)
`app/qr.tsx`, `app/redeem.tsx`, `app/vibe.tsx`, `app/list.tsx`, `app/(tabs)/persona.tsx`, `src/screens/PlanningScreen.tsx`

### Routes referenced but missing files
`/personal` (referenced 2× + declared in root `_layout.tsx`)

---

## Feature status summary

| # | Feature | Status | One-line evidence |
|---|---------|--------|-------------------|
| 1 | Home + tab navigation | PARTIAL | No `(tabs)/_layout`; pills `router.push` fake tabs; `/personal` route missing |
| 2 | Events list + details | PARTIAL | Both events lists render; `detail.tsx` is a static placeholder ignoring params; `EventDetailsModal` unused |
| 3 | Venue listings/discovery | PARTIAL | Static venue rails from `data/venues.ts`; no venue detail/search/distance |
| 4 | Persona / personalization | BROKEN | Reachable builder is a no-op; personalized filter reads fields the store strips |
| 5 | Location + distance filtering | MISSING | `expo-location` never called; dead duplicate Haversine helpers |
| 6 | Firebase init | PARTIAL | Correct init shape, but hardcoded key and imported nowhere |
| 7 | Auth + profiles | MISSING | Zero auth code anywhere |
| 8 | QR generation + scanning | PARTIAL | Generator works but unreachable; two duplicate scanners that only `Alert` raw data |
| 9 | Rewards + redemptions | PARTIAL | Firestore flow complete but unused; Personal rewards hardcoded 420pts demo |
| 10 | Favorites | PARTIAL | Hardcoded demo arrays, no persistence, dead buttons |
| 11 | Visual components/styling | PARTIAL | Premium kit exists; `BrandHeader` import mismatch crashes 3 screens; 9+ dead components |
| 12 | PlanningScreen | BROKEN | Unwired; 4 missing-asset `require()`s would break Metro bundling |

**Counts: COMPLETE 0 · PARTIAL 8 · BROKEN 2 · MISSING 2**

## Top 5 most critical broken items
1. **`BrandHeader` named-import vs default-export mismatch** (`app/detail.tsx:4`, `app/list.tsx:6`, `app/vibe.tsx:8`) — renders `undefined` component → "Element type is invalid" crash on all three screens.
2. **No `app/(tabs)/_layout.tsx`** — tab navigation is faked with `router.push`, so every pill tap pushes a duplicate screen and the back button traverses tab history instead of exiting.
3. **`router.push("/personal")` targets a nonexistent route** (`app/(tabs)/events.tsx`, `components/ui/TopTabs.tsx`; also declared as `<Stack.Screen name="personal">` in root `_layout.tsx`) — tapping "Personal" from Events hits an unmatched route.
4. **Persona pipeline is broken end-to-end**: the only reachable builder (`/persona`) never persists (`savePersonaLocal` no-op), and the tabs events "Personalized" filter reads `audienceTags`/`vibeTags` that `personaStore.normalizePersona` strips — personalization silently does nothing.
5. **`PlanningScreen` requires 4 nonexistent PNGs** (`assets/nebula.png`, `orb_pink.png`, `orb_purple.png`, `orb_blue.png`) — importing it would fail the Metro bundler; it is also unwired from navigation.

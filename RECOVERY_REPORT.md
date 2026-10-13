# VibeKC / Bownd — Recovery & Repair Report

**Branch:** `muse/vibekc-recovery` (based on `main` @ `1eb2c4f`)
**Date:** 2026-10-12/13
**Scope:** The real Expo app lives in `vibekc/` (nested). The repo root is a stale
Expo template scaffold (Hello World) — left untouched.

---

## 1. What was broken

### Dependencies (the reported `npm install` failure)
- `package.json` pinned `react: 19.1.0` while `react-native: ^0.81.5` floated to
  `0.81.6`, whose peer requirement is `react ^19.1.4` → **ERESOLVE**.
- The nested project had **no `package-lock.json` and no `node_modules`** — installs
  were unreproducible.
- **Missing dependencies** (would crash or fail at runtime):
  - `react-native-svg` (required peer of `react-native-qrcode-svg`, used by QR screens)
  - `expo-constants` (required peer of `expo-router` — app crashes outside Expo Go without it)
  - `@expo/vector-icons` (imported by 3 files, only resolved transitively)

### App crashes / broken routes
- `BrandHeader` is default-exported but imported as a **named import** in
  `detail.tsx`, `list.tsx`, `vibe.tsx` → `undefined` component → **"Element type is invalid"
  crash on all three screens**.
- `router.push("/personal")` (TopTabs, `(tabs)/events`) targeted a **nonexistent route**;
  root `_layout.tsx` declared a phantom `<Stack.Screen name="personal" />`.
- Tab switches used `router.push`, growing the stack unboundedly (back button walked
  through duplicate tab screens).
- `detail.tsx` was a static placeholder that **ignored the `id` param** — event→detail was a dead end.
- `PlanningScreen` had 4 unresolvable asset `require()`s (would break Metro if imported).

### Broken features
- **Persona pipeline broken end-to-end:** the reachable `/persona` builder's save was an
  explicit no-op placeholder (nothing persisted); the tabs events "Personalized" filter read
  `audienceTags`/`vibeTags` arrays that `personaStore.normalizePersona` strips, so
  personalization silently matched everything (also a TS strict-mode error).

### Type errors (6) and config gaps
- `shadow.soft` referenced by `GlassCard` but missing from `app/ui/theme`.
- Invalid `fontWeight: "650"` in `SpaceUI`.
- `app.json` had **no `expo-camera` config plugin** — the native build would omit the
  CAMERA permission, so QR scanners couldn't work on device.

---

## 2. Fixes completed

| # | Fix | Files |
|---|-----|-------|
| 1 | Aligned to Expo SDK 54 validated matrix: `react 19.1.0` + `react-native 0.81.5` (exact pins); `@react-native-community/slider 5.0.1`; clean `npm install` with no `--legacy-peer-deps`/`--force` | `vibekc/package.json` |
| 2 | Added missing `react-native-svg@15.12.1` (SDK 54 bundled), `expo-constants@~18.0.14`, `@expo/vector-icons@~15.0.3`, `expo-font@~14.0.12` (prevents a v57 duplicate native module) | `vibekc/package.json` |
| 3 | Generated `package-lock.json` for the nested project (was missing) | `vibekc/package-lock.json` |
| 4 | Fixed `BrandHeader` imports (default import) and added the `tagline` prop the call sites expected | `app/ui/BrandHeader.tsx`, `app/detail.tsx`, `app/list.tsx`, `app/vibe.tsx` |
| 5 | Added `app/personal.tsx` re-exporting `(tabs)/personal` — `/personal` links now resolve | `vibekc/app/personal.tsx` (new) |
| 6 | Tab/section switches → `router.replace` (stops stack growth); drill-downs stay `push` | `(tabs)/home.tsx`, `(tabs)/events.tsx`, `(tabs)/personal.tsx`, `components/ui/TopTabs.tsx` |
| 7 | `/persona` save now persists via `lib/personaStore.savePersona` (AsyncStorage) | `app/persona.tsx` |
| 8 | `matchesPersona` now matches stored singular `audience`/`vibe` against event tags — personalization actually filters | `app/(tabs)/events.tsx` |
| 9 | `detail.tsx` now renders the selected experience (title, venue, price, duration, description, tags) with a not-found state | `app/detail.tsx` |
| 10 | Fixed 4 asset `require()`s to existing files (`assets/backgrounds/nebula.png`, `assets/overlays/orb.png`) | `src/screens/PlanningScreen.tsx` |
| 11 | Added `shadow.soft` to theme; fixed `fontWeight "650"` → `"600"` | `app/ui/theme.ts`, `components/ui/SpaceUI.tsx` |
| 12 | Registered `expo-camera` config plugin with camera permission prompt | `vibekc/app.json` |

**Verification:** `tsc --noEmit` clean (was 6 errors) · `expo-doctor` 17/18 (only advisory
react-navigation version notes — intentionally newer but compatible) ·
`npx expo export` produced Android + iOS bundles (3.94 MB each) ·
`npx expo start` boots Metro cleanly.

---

## 3. Feature status (post-repair)

| Feature | Status | Notes |
|---|---|---|
| Home + navigation | Working | Tab switches no longer stack; `/personal` resolves |
| Events list (both) | Working | Live relative dates; personalized filter now functional |
| Event detail | Working | Was placeholder; now renders the tapped experience |
| Venue discovery | Partial | Static rails from `data/venues.ts`; no venue detail/search/distance |
| Persona / personalization | Working | Builder persists; events filter honors it |
| Location + distance | Missing | `expo-location` installed but never called; dead Haversine helpers remain |
| Firebase | Partial | Init code correct; **not wired into any screen** |
| Auth / profiles | Missing | Zero auth code in the repo |
| QR generation (`/redeem`) | Working in isolation | Unreachable via navigation |
| QR scanning (`/scan`, `/qr`) | Partial | Duplicate screens; permission flow OK; scanned data only `Alert`ed, never validated |
| Rewards / redemptions | Partial | Firestore flow complete but unused; Personal tab shows hardcoded 420 pts demo |
| Favorites | Partial | Hardcoded demo arrays; no persistence |
| Visual kit | Working | Crash fixed; 3 near-duplicate theme files + dead components left as-is (documented) |
| PlanningScreen | Import-safe | Asset paths fixed; still unwired from navigation |

---

## 4. Security

- `npm audit` could not run in this sandbox (registry audit endpoint blocked by network
  policy), so the earlier "58 vulnerabilities / 2 critical" report (from a
  `--legacy-peer-deps` install) **could not be re-verified here**. Direct dependencies are
  all current for SDK 54 (`expo ~54.0.33`, `firebase ^12.7.0`, etc.). The remaining
  deprecation warnings (`glob@7`, `inflight`, `rimraf@3`, `uuid@7`) come from **build
  tooling** (Metro/Expo CLI) and are not shipped in the app bundle.
- **Flagged:** `lib/firebase.ts` commits a hardcoded Firebase `apiKey` + project config.
  (Firebase client keys are public-by-design, but this should move to env config —
  needs your approval since it changes build configuration.)
- **Action for you:** run `npm audit` / `npm audit fix` on your own machine where the
  registry audit endpoint is reachable.

---

## 5. Needs credentials / backend / manual testing

- **Firebase:** config is hardcoded; nothing reads/writes Firestore yet. Redemptions and
  any real backend features need your Firebase project wired up (and the key moved out
  of source — your call).
- **EAS:** `eas.json` has `projectId 02628eed-…` and a `development` profile with
  `developmentClient: true`.
- **Manual testing required (no device here):** camera QR scanning, persona persistence
  across restarts, event→detail flow, rewards redeem flow, and the full tab navigation
  on iOS + Android dev builds.
- **Not verified here:** push notifications, maps links, any store submission steps.

---

## 6. Run it

```bash
cd vibekc                 # the nested project is the real app
npm install               # clean install, no flags needed
npx expo start            # Metro dev server
```

**Dev build required (not Expo Go):** `eas.json` already configures a `development`
profile with `developmentClient: true`, and `@react-native-community/slider` is a native
module outside Expo Go's set. Build/run with:

```bash
eas build --profile development --platform android   # and/or ios
npx expo start --dev-client
```

---

## 7. Unfinished Bownd features (prioritized)

1. **Wire up Firebase** — auth (login/signup/session) then Firestore for redemptions,
   favorites, and user profiles. (Biggest gap: auth is 100% missing.)
2. **Location + distance** — request permission via `expo-location`, compute distance to
   venues/events, add distance filter/sort (needs the `expo-location` config plugin in `app.json`).
3. **Rewards end-to-end** — connect `/redeem` QR generation → `/scan` validation →
   `lib/redemptions.ts` Firestore flow; replace the hardcoded 420-pts demo.
4. **Favorites persistence** — AsyncStorage-backed add/remove instead of hardcoded arrays.
5. **Venue detail + discovery** — venue screen, search, distance-sorted discovery.
6. **Deduplicate QR scanners** — merge `/qr` + `/scan` into one validated scanner.
7. **Cleanup (low risk):** remove stale `data/events.data.ts`, dead `components/home/*` +
   unused `components/ui/*`, unify the 3 theme files; decide the root scaffold's fate
   (delete or document — it's a Hello-World leftover).
8. **Move Firebase config to env** (`eas.json` env / `.env`) and rotate the committed key.

---

## 8. Pull request

Branch `muse/vibekc-recovery` → `main`. 3 commits:
1. `fix(deps)` — SDK 54 matrix, missing peers, lockfile
2. `fix(app)` — crashes, routes, persona, detail screen, types
3. `fix(config)` — expo-camera plugin, tsconfig normalization

Full audit: `AUDIT_REPORT.md` (repo root, included in PR).

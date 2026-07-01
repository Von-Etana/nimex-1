# Production Dependency Advisory Strategy

## Current Policy

Do not use `npm audit fix --force` on this repo without a dedicated upgrade pass. The remaining advisories are behind framework compatibility boundaries and forced fixes select breaking versions.

## Web App

- Runtime production audit command: `npm run audit:production`
- Full tree audit command: `npm run audit:all`
- Current production runtime target: no moderate-or-higher advisories in `dependencies`.
- Dev-only advisories should be tracked, but they do not block web deployment unless the affected tool is exposed in production.

## Firebase Functions

- Runtime production audit command: `npm run audit:production` from `functions/`
- Current package track: `firebase-functions@7.x` with `firebase-admin@13.x`.
- `firebase-functions@7.2.5` still peers with `firebase-admin` up to `^13.x`; `firebase-admin@14.x` remains outside the supported peer range.
- Remaining `uuid` advisories are transitive through Firebase Admin / Google Cloud packages. Treat them as accepted residual risk until Firebase Functions officially supports a compatible patched Admin SDK or the Functions code is migrated to a supported Admin 14+ path.
- Do not force the audit recommendation that downgrades or otherwise breaks Firebase Admin/Functions compatibility.

## Expo Mobile

- Full audit command: `npm run audit:all` from `nimex-mobile/`
- Current package track: Expo SDK 57 with React Native 0.86.
- `expo-av` has been replaced with `expo-video`, and `expo-doctor` passes.
- The remaining audit finding is still a transitive `uuid` advisory through Expo CLI/config tooling; npm's suggested forced fix selects a regressive/breaking Expo package path and should not be applied blindly.
- Before app-store release, run full Android/iOS smoke testing for camera, location, notifications, payments, product video playback, and navigation.

## Launch Gate

Before launch:

1. Web: `npm run type-check`, `npm run test:run`, `npm run build`, `npm run audit:production`.
2. Functions: `npm run build`, `npm run audit:production`.
3. Mobile: `npm run type-check`, `npx expo-doctor`, `npm run audit:all`, and device/emulator smoke tests.
4. Rotate any credential that was ever present in a client-prefixed env var or local service account JSON.

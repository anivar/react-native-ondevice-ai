# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-08-08

The first release whose native code has ever been compiled. CI now assembles the
Kotlin inside an Android host app and builds the pod inside an iOS host app on
macOS, which surfaced defects that inspection had not.

### Fixed — the package did not work on either platform

- **Android was never linked.** Three independent causes: `react-native.config.js`
  set `sourceDir` to `'../android'`, which resolves outside the package; there
  was no `ReactPackage` for autolinking to instantiate; and the codegen spec file
  was named `NativeAIToolkitSpec.ts`, so codegen emitted `NativeAIToolkitSpecSpec`
  while the native code referred to `NativeAIToolkitSpec`. No release of this
  package has worked on Android.
- **Every iOS promise method was unreachable.** Eighteen of twenty exported
  methods used `resolver:`/`rejecter:` where codegen declares `resolve:`/`reject:`.
  ObjC dispatches by selector, so JavaScript called methods that did not exist.
  Clang reported this as a warning, on a platform CI had never built.
- **Seventeen iOS compile errors**, all against APIs that do not exist:
  `NLTaggerOptionsOmitWhitespace` (no such constant), `supportsOnDeviceRecognition`
  called as a class method (it is a per-locale instance property),
  `NLLanguageRecognizer.supportedLanguages`, `VNInstanceMaskObservation.boundingBox`,
  and three wrong members on `NLContextualEmbedding`.
- **iOS speech never requested authorization**, so `SFSpeechRecognizer.isAvailable`
  was always false and every call failed as `RECOGNIZER_UNAVAILABLE` — reading as
  "your device cannot do this" when nobody had been asked.
- **`translateText` could hang forever.** `DownloadConditions.requireWifi()` makes
  ML Kit wait for conditions rather than fail them, so on cellular the promise
  never settled. Both model downloads are now bounded, rejecting
  `MODEL_DOWNLOAD_TIMEOUT`.
- **`analyzeText` returned `[]` when entity extraction failed**, indistinguishable
  from text with no entities. It now omits the field and sets `degraded`.
- **`analyzeImage` counted outstanding tasks in a plain `var`** mutated from ML Kit
  callbacks — a lost write left the promise pending forever.
- **The manifest forced `CAMERA` and `RECORD_AUDIO` on every consuming app.**
  Neither was ever needed; images arrive as base64 and nothing records audio.
- **Four podspec bugs** that had shipped in five releases, including a platform
  floor React Native could never satisfy and a dependency on a `React` pod that
  does not exist.

### Added

- `availability`: per-feature state and reason, from ML Kit's `checkFeatureStatus()`
  and Apple's `SystemLanguageModel.availability` — signals both platforms already
  produced and this package discarded.
- `explainCall()`: what a call will do on this device, without running it.
- `AIError` with a stable code taxonomy over 43 unrenamed native codes, plus
  `isAIError` and `isTransient`.
- `summarize()` with a deterministic extractive fallback for devices with no
  generative model. Selects sentences, never composes, always reports `degraded`.
- An Expo config plugin, and an Expo example app that exercises it.
- Five CI gates: no network in native sources, no unjustified Android permissions,
  iOS selector conformance, Android link assertion, Expo prebuild assertion.

### Changed

- Baselines raised deliberately: iOS 17 (where `NLContextualEmbedding` exists),
  Android API 26 (ML Kit GenAI's own minimum — API 24 could never have merged),
  React Native 0.86.2, AGP 8.12.0, Kotlin 2.1.20.
- `TurboModuleRegistry.getEnforcing` → `get`, so importing the package no longer
  crashes the bundle where the native module is absent.
- The boolean `features` map is removed. It reported Android generative support
  from `Class.forName` — an APK-linkage check — and iOS support from
  `NSClassFromString("WTWritingToolsCoordinator")`, true on every iOS 18.1 device.
- `privateMode` was dead code on both platforms; it now blocks the two Android
  model downloads and is documented as a no-op on iOS.

## [2.1.0-rc.5] - 2026-04-27

### Fixed
- Move `App.tsx` under `example/src/` triggered `biome check .` (which `prepublishOnly` runs) over a wider file set; rc.4's publish job failed on JSX formatting + a stray `'a' + b` concat. Reformatted via biome and dropped an unused `React` default import (RN 0.80 + React 19 use the new JSX transform).

## [2.1.0-rc.4] - 2026-04-27

### Added
- Real RN scaffolding under `example/`: `package.json`, `metro.config.js` (with workspace resolver against the parent package), `babel.config.js`, `index.js`, `app.json`. `App.tsx` lives at `example/src/App.tsx`.
- Root `typecheck` / `typecheck:example` scripts and a CI step that type-checks the example against the library source. The library typecheck is now part of CI on every push and PR.

### Fixed
- Android: removed the dangling `manifest.srcFile "src/main/AndroidManifestNew.xml"` override (the file did not exist; consumers on AGP 7.3+ would have hit a missing-manifest error). The namespace is still declared via `android.namespace`, and the package attribute on `AndroidManifest.xml` is dropped to avoid the AGP 7+ namespace/package conflict.

## [2.1.0-rc.3] - 2026-04-27

### Added
- Podspec declares `FoundationModels` as a `weak_framework` so the package builds on Xcode versions where the framework is unavailable; runtime calls are still gated by `@available(iOS 26.0, *)` and `SystemLanguageModel.default.availability`.
- `example/tsconfig.json` so the example app actually typechecks against the package's real exports (`getDeviceCapabilities`, `analyzeText`, `smartReplies`, `chat`, `enablePrivateMode`).

### Changed
- `example/App.tsx` rewritten against the real public API. The previous version called `AI.configure`/`AI.analyze`/`AI.smartReply`/`AI.chat` — none of which exist. It now consumes the actual `DeviceCapabilities` shape (`platform`, `osVersion`, `hasAppleIntelligence`, `hasGeminiNano`, `features.*`), the real `SmartReplyMessage` (`{ text, fromUser, timestampMs }`), and the real `ChatMessage` (`{ role, content }`).
- iOS: `isPrivateModeEnabled` is now a `RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD` so the JS side gets a real boolean instead of a Promise that never resolved through the bridge.
- Android: `transcribeAudioFile` rejects with `FILE_TRANSCRIPTION_UNSUPPORTED` instead of silently failing — stock `SpeechRecognizer` is microphone-only; file transcription needs OEM-specific APIs or a TFLite model.
- Brand: README, podspec-adjacent native sources, and Android module carry the OpenSLM project mark.

### Fixed
- Android: removed unused `Intent`, `Bundle`, `RecognitionListener`, `RecognizerIntent` imports.

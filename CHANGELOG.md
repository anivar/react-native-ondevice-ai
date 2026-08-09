# Changelog

Notable changes, newest first. This project follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-09

**First release.** On-device AI for React Native, built on the frameworks the
phone already ships — Apple Vision, NaturalLanguage, Speech and Foundation
Models on iOS, Google ML Kit on Android. Nothing leaves the device.

### What you get

**Text and vision, on every supported phone.** Language identification and
entities through one `analyzeText` call, plus sentiment on iOS. OCR, barcodes,
image labels, faces and person segmentation through `analyzeImage` and
friends. No model download, no setup, no AICore for any of it — the one
exception is entity extraction on Android, which downloads its model on first
use and then works offline.

**Generative, where the phone can do it.** `summarizeText`, `rewriteText`,
`generateText` and `chat`, routed to Apple Foundation Models on iOS 26 with
Apple Intelligence and to ML Kit GenAI on AICore devices. `proofreadText` is
generative on Android but a UITextChecker spelling pass on iOS, where it works
unconditionally rather than needing Apple Intelligence. On Android, where most
devices have no generative model, `summarizeText` falls back to a bundled
extractive summariser that picks sentences rather than writing them, so it
cannot invent a fact — and says so, with `degraded: true` and the route that
produced the result. iOS defaults to an honest rejection instead of that
fallback, since Apple ships a real summariser on eligible hardware; opt in
with `configure({ ios: { tiers: ['on-device', 'local-deterministic'] } })` if
you want it anyway.

**An honest answer about the device in front of you.** Most phones cannot run
a generative model, so the interesting question is not what the API does but
what this user's phone can. `availability` answers per feature, with a reason,
straight from ML Kit's `checkFeatureStatus()` and Apple's
`SystemLanguageModel.availability` — signals both platforms publish and most
wrappers flatten into a boolean. The reason separates the permanent
(`os-too-old`, `hardware-ineligible`, `no-platform-api`) from the temporary
(`user-disabled`, `model-not-ready`), so you know whether to hide a button
forever or offer it again in a minute — plus `unknown`, which is what Android
returns when AICore cannot itself tell "never" from "not yet". `explainCall`
gives the same answer as a sentence, without running anything.

**Platform differences stated, not papered over.** Embeddings and file
transcription are iOS-only; translation, smart replies and image description
are Android-only. A call a platform cannot serve rejects with a typed
`AIError` naming the reason — never a polyfill, never a placeholder string.

**Private mode.** One switch that refuses any call which would fetch a model,
so an offline-only build cannot reach the network by accident.

**Expo, first class.** A config plugin sets the Android `minSdkVersion`, the
iOS deployment target and the speech usage string, raising each only when your
project sits lower.

### How far it has been verified

CI compiles every line of Kotlin, Swift and ObjC++ on each pull request inside
a generated host app, and asserts this library was actually linked and that
none of its build tasks failed. It runs nothing — no job executes a native
path on a device or emulator. The native sources are also checked for
networking symbols and the Android manifest for permissions beyond an
allowlist.

The generative routes additionally need hardware no CI runner has at all: an
Apple Intelligence iPhone for Foundation Models, an AICore Android for ML Kit
GenAI. The example app ships a screen that exercises most of the public API
and produces a shareable report, and a report from one of those devices is
worth more than most code changes right now.

[0.1.0]: https://github.com/anivar/react-native-ai-gateway/releases/tag/v0.1.0

# @anivar/mobile-ai-toolkit

[![an OpenSLM project](https://img.shields.io/badge/an%20OpenSLM-project-0b1118?style=flat-square&labelColor=0b1118)](https://github.com/openslm-ai)

> **On-device AI for React Native.** One unified TypeScript API; each method is a thin TurboModule binding to a documented platform framework — Apple Foundation Models / Vision / NaturalLanguage / Speech on iOS, Google ML Kit (incl. ML Kit GenAI on AICore-enabled devices) on Android. Nothing leaves the device, nothing is mocked.

<p>
  <a href="https://www.npmjs.com/package/@anivar/mobile-ai-toolkit"><img alt="npm (latest)" src="https://img.shields.io/npm/v/@anivar/mobile-ai-toolkit/latest.svg?style=flat-square&label=npm%20latest&color=cb3837&logo=npm"></a>
  <a href="https://www.npmjs.com/package/@anivar/mobile-ai-toolkit?activeTab=versions"><img alt="npm (next)" src="https://img.shields.io/npm/v/@anivar/mobile-ai-toolkit/next.svg?style=flat-square&label=npm%20next&color=ff8800&logo=npm"></a>
  <a href="https://www.npmjs.com/package/@anivar/mobile-ai-toolkit"><img alt="downloads" src="https://img.shields.io/npm/dm/@anivar/mobile-ai-toolkit.svg?style=flat-square&color=0aa"></a>
  <a href="https://bundlephobia.com/package/@anivar/mobile-ai-toolkit"><img alt="bundle size" src="https://img.shields.io/bundlephobia/minzip/@anivar/mobile-ai-toolkit?style=flat-square&label=min%2Bgzip"></a>
  <a href="https://packagephobia.com/result?p=@anivar/mobile-ai-toolkit"><img alt="install size" src="https://badgen.net/packagephobia/install/@anivar/mobile-ai-toolkit?style=flat-square"></a>
</p>

<p>
  <a href="https://github.com/openslm-ai/mobile-ai-toolkit/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/openslm-ai/mobile-ai-toolkit/ci.yml?branch=main&style=flat-square&label=CI&logo=githubactions&logoColor=white"></a>
  <a href="https://github.com/openslm-ai/mobile-ai-toolkit/actions/workflows/release.yml"><img alt="Release" src="https://img.shields.io/github/actions/workflow/status/openslm-ai/mobile-ai-toolkit/release.yml?style=flat-square&label=release&logo=githubactions&logoColor=white"></a>
  <a href="https://docs.npmjs.com/generating-provenance-statements"><img alt="npm provenance" src="https://img.shields.io/badge/npm-provenance-success?style=flat-square&logo=npm"></a>
  <a href="https://github.com/openslm-ai/mobile-ai-toolkit/security/policy"><img alt="security policy" src="https://img.shields.io/badge/security-policy-informational?style=flat-square&logo=keybase"></a>
  <a href="https://www.npmjs.com/package/@anivar/mobile-ai-toolkit"><img alt="types: included" src="https://img.shields.io/npm/types/@anivar/mobile-ai-toolkit?style=flat-square&logo=typescript&logoColor=white"></a>
</p>

<p>
  <img alt="iOS 17+" src="https://img.shields.io/badge/iOS-17%2B-000?style=flat-square&logo=apple&logoColor=white">
  <img alt="Android API 26+" src="https://img.shields.io/badge/Android-API%2026%2B-3DDC84?style=flat-square&logo=android&logoColor=white">
  <img alt="React Native 0.86+" src="https://img.shields.io/badge/React%20Native-%E2%89%A50.86-61dafb?style=flat-square&logo=react">
  <img alt="React 19+" src="https://img.shields.io/badge/React-%E2%89%A519-61dafb?style=flat-square&logo=react">
  <img alt="New Architecture (TurboModule)" src="https://img.shields.io/badge/New%20Architecture-TurboModule-7c3aed?style=flat-square">
  <img alt="On-device" src="https://img.shields.io/badge/runs-on--device-22c55e?style=flat-square">
</p>

<p>
  <a href="https://github.com/openslm-ai/mobile-ai-toolkit/stargazers"><img alt="stars" src="https://img.shields.io/github/stars/openslm-ai/mobile-ai-toolkit?style=flat-square&logo=github"></a>
  <a href="https://github.com/openslm-ai/mobile-ai-toolkit/issues"><img alt="open issues" src="https://img.shields.io/github/issues/openslm-ai/mobile-ai-toolkit?style=flat-square&logo=github"></a>
  <a href="https://github.com/openslm-ai/mobile-ai-toolkit/pulls"><img alt="open PRs" src="https://img.shields.io/github/issues-pr/openslm-ai/mobile-ai-toolkit?style=flat-square&logo=github"></a>
  <a href="https://github.com/openslm-ai/mobile-ai-toolkit/commits/main"><img alt="last commit" src="https://img.shields.io/github/last-commit/openslm-ai/mobile-ai-toolkit?style=flat-square&logo=github"></a>
  <a href="https://github.com/sponsors/anivar"><img alt="sponsor" src="https://img.shields.io/github/sponsors/anivar?style=flat-square&logo=githubsponsors&color=ea4aaa"></a>
  <a href="https://opensource.org/licenses/MIT"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square"></a>
</p>

---

> ## ⚠️ 2.1 Release-Candidate Disclaimer
>
> **The iOS Foundation Models bridge in 2.1.x has not been verified on real Apple Intelligence hardware.** The maintainer does not currently have access to an iPhone 15 Pro / 16 / 17 series device, an Apple Developer account, or a paid macOS CI runner. The Swift code is written against publicly documented Apple API but has only been compile-checked on Linux via the JS / TypeScript / Biome surface — there is no proof the bridge runs end-to-end against the real `SystemLanguageModel`.
>
> **What this means for you:**
> - 2.1.0-rc.x ships under the `next` dist-tag, **not `latest`**. Default `npm install` still pulls the verified 2.0.
> - On Android (ML Kit + ML Kit GenAI), 2.1 is functionally identical to 2.0 — same verified surface.
> - On iOS ≤ 25, 2.1 behaves exactly like 2.0 (rejects generative methods).
> - On iOS 26+ with Apple Intelligence enabled, the new `summarizeText` / `rewriteText` / `generateText` / `chat()` methods *should* route to Foundation Models. They have not been observed doing so on real hardware.
>
> **Help wanted — see [Contributors needed](#contributors-needed-real-device-verification) below.** If you own an Apple-Intelligence-eligible device and want to help cut a verified 2.1.0 GA, even a single bug report would unblock the release.

## Why

One API shape, per-platform behaviour, fully disclosed. The two platforms do not offer the same features and this package does not pretend otherwise: where one has a real API and the other doesn't, the call resolves on one side and rejects with a stated reason on the other — never a polyfill, never a placeholder string. You write the call site once and handle a typed rejection, rather than writing two call sites.

## Install

Stable (verified surface — recommended for production):

```bash
npm install @anivar/mobile-ai-toolkit
cd ios && pod install
```

Release candidate (Apple Foundation Models bridge — see disclaimer):

```bash
npm install @anivar/mobile-ai-toolkit@next
cd ios && pod install
```

Requires React Native 0.86+ (new architecture / TurboModules), React 19+, iOS 17+ and Android API 26+.

Both floors are deliberate rather than inherited. iOS 17 is where `NLContextualEmbedding` — all of `embedText` — becomes available; below it this package is strictly less capable and carries dead availability branches. Android 26 is ML Kit GenAI's own minimum, so API 24-25 could never have worked: the manifest merge fails. React Native's own floors are lower (iOS 15.1, API 24); these are higher on purpose.

## Capability matrix

Every method below maps to a real platform call. ✅ = on-device. 🧪 = on-device but unverified on real hardware (see disclaimer). ⚠️ = on-device when supported by OEM/locale. ❌ = not implemented on that platform; the call rejects with `UNSUPPORTED_PLATFORM`.

| Method | iOS | Android |
|---|---|---|
| `getDeviceCapabilities()` | ✅ — feature probe | ✅ — feature probe |
| `analyzeText(text, opts)` | ✅ NaturalLanguage — sentiment + entities | ✅ ML Kit Language ID + Entity Extraction |
| `extractEntities(text)` | ✅ `NLTagSchemeNameType` | ✅ ML Kit `EntityExtraction` |
| `identifyLanguage(text)` | ✅ `NLLanguageRecognizer` | ✅ ML Kit `LanguageIdentification` |
| `embedText(text)` | ✅ `NLContextualEmbedding` (iOS 17+) | ❌ |
| `analyzeImage(b64, opts)` | ✅ Vision OCR + face rects + iOS 17 foreground mask | ✅ ML Kit text + objects + faces |
| `scanBarcodes(b64)` | ✅ `VNDetectBarcodesRequest` | ✅ ML Kit `BarcodeScanning` |
| `labelImage(b64)` | ✅ `VNClassifyImageRequest` | ✅ ML Kit `ImageLabeling` |
| `describeImage(b64)` | ❌ | ✅ ML Kit GenAI `ImageDescription` *(Beta, AICore)* |
| `segmentPerson(b64)` | ✅ `VNGeneratePersonSegmentationRequest` (iOS 15+) | ✅ ML Kit `SelfieSegmentation` |
| `proofreadText(text)` | ✅ `UITextChecker` *(spelling only)* | ✅ ML Kit GenAI `Proofreader` *(Beta, AICore)* |
| `summarizeText(text, fmt)` | 🧪 Foundation Models *(iOS 26+, Apple Intelligence — unverified, see disclaimer)* | ✅ ML Kit GenAI `Summarizer` *(Beta, AICore)* |
| `rewriteText(text, style)` | 🧪 Foundation Models *(iOS 26+, unverified)* | ✅ ML Kit GenAI `Rewriter` *(Beta, AICore)* |
| `generateText(prompt, opts)` | 🧪 Foundation Models *(iOS 26+, unverified)* | ✅ ML Kit GenAI `Prompt` API *(Beta, Gemini Nano / Gemma 4 via AICore)* |
| `chat(messages, opts)` | 🧪 Foundation Models *(iOS 26+, unverified)* | ✅ ML Kit GenAI `Prompt` API (history flattened to single-shot prompt) |
| `smartReplies(messages)` | ❌ — no public iOS equivalent | ✅ ML Kit `SmartReply` (GA) |
| `translateText(text, src, tgt)` | ❌ — Translation framework bridge tracked for v2.2 | ✅ ML Kit `Translator` (GA, downloads language pack on first use) |
| `transcribeAudioFile(path, opts)` | ✅ `SFSpeechRecognizer` with `requiresOnDeviceRecognition = true` | ❌ — rejects `FILE_TRANSCRIPTION_UNSUPPORTED`. Android's `SpeechRecognizer` is microphone-only on stock platforms |

### Knowing what will actually work

`getDeviceCapabilities().availability` gives a per-feature state with a reason:

```ts
const { availability } = await getDeviceCapabilities();
availability.summarize
// { state: 'downloadable', requiresNetwork: true,
//   detail: 'AICore can download the generative model for this device.' }
```

`state` is one of `available`, `downloadable`, `downloading` or `unavailable`. The
split that matters is permanence — `unavailable` carries a `reason`, and
`os-too-old`, `hardware-ineligible` and `no-platform-api` mean hide the button on
this device for good, while `user-disabled` and `model-not-ready` can change
without your app being updated.

On Android this comes from ML Kit's `checkFeatureStatus()`, and on iOS from
`SystemLanguageModel.availability` — the signals both platforms already had and
this package used to throw away.

`explainCall(feature)` answers the same question as a sentence, and with no
argument returns the plan for all 16 features. It runs no inference and touches
no network. Since the two platforms deliberately differ, it is the only way to
see the other platform's answer without owning the hardware.

### Expo

Expo SDK 55+ requires the New Architecture, which is what this package targets,
so a modern Expo app is a first-class host. Add the plugin:

```json
{ "expo": { "plugins": ["@anivar/mobile-ai-toolkit"] } }
```

It sets the Android `minSdkVersion` to 26, the iOS deployment target to 17, and
the speech usage string — raising each only if your project is lower, never
overwriting a higher value or a description you wrote yourself. Without it the
Android manifest merge fails, because Expo's default `minSdkVersion` is below
ML Kit GenAI's minimum.

You need a development build (`npx expo prebuild` or EAS). The native code
cannot exist in Expo Go — but importing the package there no longer crashes the
bundle, so a capability check degrades to a `MODULE_NOT_LINKED` rejection you
can catch instead of a white screen.

### Permissions

The library declares exactly one Android permission, `INTERNET`, and it is there
for two features: `translateText` and `extractEntities` download an ML Kit model
on first use. Both work offline afterwards, and `enablePrivateMode(true)` refuses
the download rather than performing it.

Nothing else is declared. A library's permissions merge into your app's manifest
and appear in your store listing, so this one is checked in CI against an
allowlist that names the feature requiring each entry.

On iOS, `transcribeAudioFile` needs `NSSpeechRecognitionUsageDescription` in your
Info.plist.

### Working with or without a network

Nothing in this package sends anything anywhere. There is no cloud tier, no
`fetch`, and CI fails the build if a networking symbol appears in the native
sources at all.

"Offline" still has two meanings worth separating. Inference is always local on
both platforms. But two Android features — translation and entity extraction —
download a model on first use, and that download needs a network. After it, they
work offline forever. `availability` marks those with `requiresNetwork: true`
while they are still `downloadable`.

`enablePrivateMode(true)` makes that explicit: a model already on the device
keeps working, and one that is missing rejects `MODEL_NOT_DOWNLOADED` rather
than quietly fetching it. On iOS there is no download path at all, so private
mode is a no-op there and the README says so rather than implying a control that
does not exist.

For devices with no generative model — most non-Pixel Android — `summarize()`
can fall back to a bundled extractive summariser:

```ts
const { value, tier, degraded, attempts } = await summarize(article);
// tier: 'on-device' | 'local-deterministic', degraded: true when it fell back
```

It selects sentences from the input and never composes new text, so it cannot
state anything the source did not. It ships no weights and adds no bytes to
your app. Results always carry `degraded: true` and the full `attempts` trace,
so you can tell a real model's output from a fallback's, and see why.

`summarizeText()` is unchanged and never falls back — it is the platform model
or a rejection, permanently. Fallback behaviour requires calling a differently
named function, so no upgrade can introduce it on your behalf. The fallback is
on by default on Android only; iOS gets an honest rejection instead, because
Apple ships a real summariser on eligible hardware and a silently worse result
is not a favour. Change it with `configure({ android: { tiers: ['on-device'] } })`.

There is no boolean `features` map. It existed, it was wrong in both directions,
and a flag that reads `true` for a model still downloading cannot answer "will
this call succeed" — so it was removed rather than deprecated.

Every rejection is an `AIError` with a `code` you can switch on — `FEATURE_UNAVAILABLE`, `MODEL_NOT_DOWNLOADED`, `MODEL_DOWNLOAD_TIMEOUT`, `INFERENCE_FAILED`, `MODULE_NOT_LINKED` and a few more — plus `platformCode`, the platform's own more specific string. `isTransient(err)` is true when the feature could work later on this device, which is the distinction a retry button needs.

## Quick start

```ts
import {
  getDeviceCapabilities,
  analyzeText,
  analyzeImage,
  scanBarcodes,
  labelImage,
  segmentPerson,
  summarizeText,
  rewriteText,
  generateText,
  chat,
  smartReplies,
  translateText,
  transcribeAudioFile,
} from '@anivar/mobile-ai-toolkit';

// 1. Probe once at startup, gate UI on the feature map.
const caps = await getDeviceCapabilities();

// 2. Universal text + image — works on every iOS/Android device.
const analysis = await analyzeText('I really like this app', {
  includeSentiment: true,
  includeEntities: true,
});
// → { language: 'en', sentiment: 0.6, entities: [...], confidence: 0.9 }

const img = await analyzeImage(base64png, { extractText: true, detectFaces: true });
const codes = await scanBarcodes(base64png);
const labels = await labelImage(base64png);
const { maskBase64, width, height } = await segmentPerson(base64png);

// 3. Generative — gate on the feature map.
if (caps.availability.summarize.state === 'available') {
  const tldr = await summarizeText(longArticle, 'bullets');
}
if (caps.availability.generate.state === 'available') {
  const reply = await generateText('Write a polite decline.', { maxOutputTokens: 80 });
}
if (caps.availability.chat.state === 'available') {
  const answer = await chat([
    { role: 'system', content: 'You are terse.' },
    { role: 'user', content: 'Why is the sky blue?' },
  ]);
}

// 4. Platform-specific calls reject cleanly when unsupported.
try {
  const replies = await smartReplies([
    { text: 'Want to grab lunch?', fromUser: false, timestampMs: Date.now() },
  ]);
} catch (e) {
  // iOS: { code: 'UNSUPPORTED_PLATFORM' }
}

// 5. On-device transcription.
const t = await transcribeAudioFile('/path/to/clip.m4a', { locale: 'en-US' });
```

### Privacy-mode flag

A boolean stored in the native module. It does not enforce anything by itself — read it from your app code before triggering methods that fetch model assets (e.g. `translateText` downloads a language pack on first use, ML Kit GenAI APIs may pull a model via AICore).

```ts
import { enablePrivateMode, isPrivateModeEnabled } from '@anivar/mobile-ai-toolkit';
enablePrivateMode(true);
```

## Device-class gotchas

- **iOS Foundation Models** (`summarizeText`, `rewriteText`, `generateText`, `chat` on iOS) require iOS 26+ on Apple-Intelligence-eligible hardware (iPhone 15 Pro / Pro Max, every iPhone 16 / 17, M-series iPad / Mac) **and** Apple Intelligence enabled in Settings. On any other configuration these methods reject `FEATURE_UNAVAILABLE` with a precise reason from `SystemLanguageModel.availability`. **The bridge itself is unverified — see the disclaimer at the top.**
- **ML Kit GenAI** (`summarizeText`, `rewriteText`, `proofreadText`, `describeImage`, `generateText`, `chat` on Android) runs only on AICore-enabled devices: Pixel 9+, Samsung S25+, and select 2024–2026 flagships from Xiaomi / OPPO / Honor with locked bootloaders. Pixel 10+ uses Gemma 4 via AICore. On unsupported devices these methods reject with `FEATURE_UNAVAILABLE` — check `caps.availability.<method>.state` first, or call `explainCall('<method>')`.
- **iOS on-device speech** (`SFSpeechRecognizer.supportsOnDeviceRecognition`) returns true on most modern devices but can be false for locales whose speech model isn't installed.
- **iOS proofread** uses `UITextChecker` and is spelling-only; the Apple Intelligence Writing Tools rewrite UI has no programmatic invocation API.
- **iOS embeddings** require iOS 17+ and a model loaded for the script of the input (Latin / CJK / Cyrillic / etc.); unsupported scripts reject with `FEATURE_UNAVAILABLE`.
- **`chat()` is single-shot.** Both platforms flatten the message list into one prompt and run a single inference pass — neither vendor exposes a stable persistent-session API across the bridge yet. State lives in *your* JS, not in the native module.

## What's NOT in this package

- **No streaming token callbacks.** Tracked for v2.2 on Android via the Prompt API streaming surface.
- **No iOS translation.** Apple's Translation framework requires SwiftUI host integration; bridge tracked for v2.2.
- **No iOS image description.** Apple's on-device foundation model is text-only; no public `describeImage` equivalent exists. Use `labelImage()` / `analyzeImage()` for visual data.
- **No intent classification.** No public on-device intent-classifier API on either platform that beats a hardcoded keyword matcher.
- **No iOS Writing Tools rewrite.** The system UI can be attached to a `UITextView`, but it has no programmatic API.
- **No cloud fallback.** Out of scope; call your own backend from JS if you need it.

## Contributors needed (real-device verification)

The 2.1 release-candidate ships an unverified Foundation Models bridge because the maintainer doesn't have access to the hardware to test it. **You can help cut a verified 2.1.0 GA in under 10 minutes if you own any of:**

- iPhone 15 Pro / 15 Pro Max
- any iPhone 16 / 16 Plus / 16 Pro / 16 Pro Max
- any iPhone 17 / 17 Pro / 17 Pro Max
- M1+ iPad or any Apple-silicon Mac, on macOS 26+ with Apple Intelligence enabled

**What we need:**

1. Install `@anivar/mobile-ai-toolkit@next` in any RN 0.80+ app on the device above.
2. Confirm Apple Intelligence is enabled in **Settings → Apple Intelligence & Siri**.
3. Run this snippet:
   ```ts
   import { getDeviceCapabilities, generateText, summarizeText, chat } from '@anivar/mobile-ai-toolkit';
   const caps = await getDeviceCapabilities();
   console.log('hasAppleIntelligence:', caps.hasAppleIntelligence);
   console.log('generate:', caps.availability.generate);
   console.log(await generateText('Write a one-line haiku about TurboModules.', { maxOutputTokens: 60 }));
   console.log(await summarizeText('React Native bridges JS to native code via TurboModules using JSI.', 'one-bullet'));
   console.log(await chat([
     { role: 'system', content: 'You are terse.' },
     { role: 'user', content: 'Why is the sky blue?' },
   ]));
   ```
4. Open an issue at <https://github.com/openslm-ai/mobile-ai-toolkit/issues> with the device model, iOS version, and the four output lines (or the full error stack if it threw).

That's it. Even a single confirmation flips 2.1 from RC to GA. Bug reports are equally valuable — if the bridge is wrong I'd rather know now than have it sit broken for months.

We also welcome:

- **Anyone with a paid macOS CI minute budget** — adding a workflow that does `xcodebuild build -scheme MobileAIToolkitExample -destination "platform=iOS Simulator,OS=26.0"` would catch compile-time regressions on every PR.
- **iOS / Swift devs** willing to review `ios/AIToolkitFoundationModels.swift` for correctness against the documented Foundation Models API.
- **Android / ML Kit GenAI users** with a Pixel 9+ or S25+ — bug reports against the Beta APIs are useful too.

## Supply chain & provenance

- Every release on npm is published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements) — the `Provenance` badge on the npm page links to the exact GitHub Actions run that built and signed the tarball.
- The package has zero runtime dependencies. `peerDependencies` are `react ≥19` and `react-native ≥0.86`.
- Releases are tagged on GitHub and built by the [release workflow](.github/workflows/release.yml) — the workflow file is the single source of truth for what gets published.

## About OpenSLM

`mobile-ai-toolkit` is part of [OpenSLM](https://github.com/openslm-ai) — an open
collection of on-device small-language-model and AI runtime tooling. If you find
this useful, the [OpenSLM org](https://github.com/openslm-ai) has more.

## License

MIT © [Anivar Aravind](https://github.com/anivar) / [OpenSLM](https://github.com/openslm-ai)

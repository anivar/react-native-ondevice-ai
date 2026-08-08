# @anivar/mobile-ai-toolkit

[![an OpenSLM project](https://img.shields.io/badge/an%20OpenSLM-project-1E2A78?style=flat-square&labelColor=0b1118)](https://openslm.ai)
[![Open Small Models Accord](https://img.shields.io/badge/Open%20Small%20Models-Accord-1E2A78?style=flat-square&labelColor=0b1118)](https://openslm.ai/accord)

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
  <img alt="Expo config plugin included" src="https://img.shields.io/badge/Expo-config%20plugin-000?style=flat-square&logo=expo&logoColor=white">
</p>

<p>
  <img alt="zero runtime dependencies" src="https://img.shields.io/badge/runtime%20deps-0-22c55e?style=flat-square">
  <img alt="one Android permission" src="https://img.shields.io/badge/Android%20permissions-1%20(INTERNET)-22c55e?style=flat-square">
  <img alt="no network in native sources" src="https://img.shields.io/badge/native%20network%20calls-none%20(CI%20enforced)-22c55e?style=flat-square">
  <img alt="LWD-R: Logic" src="https://img.shields.io/badge/LWD--R-Logic-1E2A78?style=flat-square">
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

> ## What is verified, and what is not
>
> Every line of Kotlin, Swift and ObjC++ in this package is compiled by CI on
> every pull request: Gradle assembles the Android module inside a host app,
> and Xcode builds the pod inside a host app on macOS against the iOS 26 SDK.
> CI additionally asserts that the library was actually linked — an earlier
> green run compiled none of it — and that the ObjC++ selectors match the
> generated TurboModule protocol exactly.
>
> **Compiling is not behaving.** The Apple Foundation Models path
> (`summarizeText` / `rewriteText` / `generateText` / `chat` on iOS 26+) needs
> Apple-Intelligence-eligible hardware that no CI runner has and the maintainer
> does not own. It is written against publicly documented API and it compiles
> against the real SDK, but nobody has watched it produce a token.
>
> Until someone has, generative-on-iOS stays a claim rather than a
> demonstration. Everything else — Vision, NaturalLanguage, Speech, all of ML
> Kit, and the whole availability and error surface — is compiled and gated.
> **If you own an eligible device, see [Contributors needed](#contributors-needed-real-device-verification); one report closes this.**

## Why

One API shape, per-platform behaviour, fully disclosed. The two platforms do not offer the same features and this package does not pretend otherwise: where one has a real API and the other doesn't, the call resolves on one side and rejects with a stated reason on the other — never a polyfill, never a placeholder string. You write the call site once and handle a typed rejection, rather than writing two call sites.

## Install

Stable:

```bash
npm install @anivar/mobile-ai-toolkit
cd ios && pod install
```

Pre-release channel:

```bash
npm install @anivar/mobile-ai-toolkit@next
cd ios && pod install
```

Requires React Native 0.86+ (new architecture / TurboModules), React 19+, iOS 17+ and Android API 26+.

Both floors are deliberate rather than inherited. iOS 17 is where `NLContextualEmbedding` — all of `embedText` — becomes available; below it this package is strictly less capable and carries dead availability branches. Android 26 is ML Kit GenAI's own minimum, so API 24-25 could never have worked: the manifest merge fails. React Native's own floors are lower (iOS 15.1, API 24); these are higher on purpose.

### Bare React Native

This package targets iOS 17, above React Native's own floor of 15.1, so raise
the deployment target in `ios/Podfile` before `pod install`:

```ruby
platform :ios, '17.0'
```

Without it CocoaPods refuses to resolve, with "they required a higher minimum
deployment target". On Android, set `minSdkVersion = 26` in
`android/build.gradle` — ML Kit GenAI's own minimum, below which the manifest
merge fails.

Expo projects get both automatically; see below.

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

## Capability matrix

Every method below maps to a real platform call. ✅ = on-device. 🧪 = compiled against the real SDK but never observed running on eligible hardware. ⚠️ = on-device when supported by OEM/locale. ❌ = not implemented on that platform; the call rejects with `UNSUPPORTED_PLATFORM`.

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
| `summarizeText(text, fmt)` | 🧪 Foundation Models *(iOS 26+, Apple Intelligence — unverified on hardware)* | ✅ ML Kit GenAI `Summarizer` *(Beta, AICore)* |
| `rewriteText(text, style)` | 🧪 Foundation Models *(iOS 26+, unverified)* | ✅ ML Kit GenAI `Rewriter` *(Beta, AICore)* |
| `generateText(prompt, opts)` | 🧪 Foundation Models *(iOS 26+, unverified)* | ✅ ML Kit GenAI `Prompt` API *(Beta, Gemini Nano / Gemma 4 via AICore)* |
| `chat(messages, opts)` | 🧪 Foundation Models *(iOS 26+, unverified)* | ✅ ML Kit GenAI `Prompt` API (history flattened to single-shot prompt) |
| `smartReplies(messages)` | ❌ — no public iOS equivalent | ✅ ML Kit `SmartReply` (GA) |
| `translateText(text, src, tgt)` | ❌ — `TranslationSession` needs a SwiftUI host; see below | ✅ ML Kit `Translator` (GA, downloads language pack on first use) |
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

### Private mode

```ts
import { enablePrivateMode, isPrivateModeEnabled } from '@anivar/mobile-ai-toolkit';
enablePrivateMode(true);
```

On Android this is enforced natively at the only two places in the module that
touch the network — the translation and entity-extraction model downloads. With
it on, a model already on the device keeps working offline and a missing one
rejects `MODEL_NOT_DOWNLOADED` instead of being fetched.

On iOS it is a no-op, and this document would rather say so than imply a control
that does not exist: there is no download path on that platform, and speech
recognition already refuses to fall back to Apple's servers for every caller.

## Device-class gotchas

- **iOS Foundation Models** (`summarizeText`, `rewriteText`, `generateText`, `chat` on iOS) require iOS 26+ on Apple-Intelligence-eligible hardware (iPhone 15 Pro / Pro Max, every iPhone 16 / 17, M-series iPad / Mac) **and** Apple Intelligence enabled in Settings. On any other configuration these methods reject `FEATURE_UNAVAILABLE` with a precise reason from `SystemLanguageModel.availability`. **Compiled against the real SDK, but never observed running on eligible hardware — see the note at the top.**
- **ML Kit GenAI** (`summarizeText`, `rewriteText`, `proofreadText`, `describeImage`, `generateText`, `chat` on Android) runs only on AICore-enabled devices: Pixel 9+, Samsung S25+, and select 2024–2026 flagships from Xiaomi / OPPO / Honor with locked bootloaders. Pixel 10+ uses Gemma 4 via AICore. On unsupported devices these methods reject with `FEATURE_UNAVAILABLE` — check `caps.availability.<method>.state` first, or call `explainCall('<method>')`.
- **iOS on-device speech** (`SFSpeechRecognizer.supportsOnDeviceRecognition`) returns true on most modern devices but can be false for locales whose speech model isn't installed.
- **iOS proofread** uses `UITextChecker` and is spelling-only; the Apple Intelligence Writing Tools rewrite UI has no programmatic invocation API.
- **iOS embeddings** require iOS 17+ and a model loaded for the script of the input (Latin / CJK / Cyrillic / etc.); unsupported scripts reject with `FEATURE_UNAVAILABLE`.
- **`chat()` is single-shot.** Both platforms flatten the message list into one prompt and run a single inference pass — neither vendor exposes a stable persistent-session API across the bridge yet. State lives in *your* JS, not in the native module.

## What this package does not do

- **No cloud, no network inference.** Nothing is sent anywhere. CI fails the
  build if a networking symbol appears in the native sources at all, so this is
  a gate rather than a promise. Call your own backend from JS if you need one.
- **No streaming.** Both platforms expose it — Apple's `streamResponse`, ML
  Kit's `generateContentStream` — and this package does not yet.
- **No structured output.** Same: both platforms have it, this does not.
- **No iOS translation.** `TranslationSession` can translate strings, but a
  session is only obtainable from a SwiftUI `translationTask` modifier, so it
  needs a hosted `UIHostingController`. Real, just not done.
- **No iOS image description.** Apple's on-device model is text-only. Use
  `labelImage()` or `analyzeImage()`.
- **No Android file transcription.** `SpeechRecognizer` is microphone-only on
  stock platforms. ML Kit's `genai-speech-recognition` can take a file
  descriptor, but it is alpha and wants 16 kHz mono PCM.
- **No iOS object detection.** Vision ships no general object detector, so
  `analyzeImage().objects` is empty on iOS and populated by ML Kit on Android.
- **No iOS Writing Tools rewrite.** The system UI attaches to a `UITextView`
  and has no programmatic API.

## Contributors needed (real-device verification)

One thing blocks a fully verified release, and it needs hardware rather than
effort. **If you own any of these, ten minutes closes it:**

- iPhone 15 Pro / Pro Max, any iPhone 16 or 17
- an M-series iPad or Apple-silicon Mac on macOS 26+

with Apple Intelligence enabled in **Settings → Apple Intelligence & Siri**.

```ts
import { getDeviceCapabilities, explainCall, generateText } from '@anivar/mobile-ai-toolkit';

console.log((await getDeviceCapabilities()).availability.generate);
console.log(await explainCall('generate'));
console.log(await generateText('Write a one-line haiku about TurboModules.', { maxOutputTokens: 60 }));
```

Open an issue with the device model, the OS version, and that output — or the
full error if it threw. A failure is as useful as a success; if the bridge is
wrong I would rather know now than have it sit broken.

Also welcome: Swift reviewers for `ios/AIToolkitFoundationModels.swift`, and
bug reports from Pixel 9+ / Galaxy S25+ owners against the ML Kit GenAI beta.

## Supply chain & provenance

- Zero runtime dependencies. `peerDependencies` are `react ≥19` and
  `react-native ≥0.86`; everything else is a devDependency and ships nothing.
- Published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements)
  — the badge on the npm page links to the exact GitHub Actions run that built
  and signed the tarball.
- Two claims about what this package does to *your* app are enforced in CI
  rather than asserted here: it declares exactly one Android permission, and its
  native sources contain no networking symbols at all. See
  [`scripts/`](./scripts) — both gates run again before publish.
- Every method's ObjC++ selector is checked against the generated TurboModule
  protocol on each pull request, and the Android job asserts the library was
  actually compiled rather than silently skipped.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) explains what each gate exists to catch.

## About OpenSLM

`mobile-ai-toolkit` is part of [OpenSLM](https://openslm.ai) — open small
language models and the runtimes that make them usable on the hardware people
actually own.

The npm package sits in the maintainer's personal scope (`@anivar`) for
historical reasons while the repository lives under the
[openslm-ai](https://github.com/openslm-ai) organisation. Same project; the
scope is just where it was first published.

It is built to the [Open Small Models Accord](https://openslm.ai/accord), and
two of its principles shape this package directly.

**§5, local inference.** Inference stays where the people it affects can reach
it. That is why there is no cloud tier and why the absence is CI-enforced rather
than asserted.

**§5 also names what this package is honest about.** Apple Foundation Models
and Gemini Nano are closed runtimes on proprietary NPUs, distributed through
app stores — local, but not *open*. Wrapping them is the pragmatic path, not the
principled one, and the Accord calls that hardware capture. This package says so
rather than presenting the two as equivalent. Portable formats such as GGUF and
ONNX are the named exit.

**§2 and §10, disclosure at the release.** Under the Accord's LWD-R layers this
package is **Logic only**: inference and routing code, MIT-licensed and
readable. It ships no weights, no training data, and no representational schema
of its own — those belong to Apple and Google, and neither is inspectable. What
you can fork here is the binding, not the model. Per §4 that is *inference*
forkability, not training forkability, and the difference matters.

## Citing this

Releases are archived with a DOI. `CITATION.cff` carries the metadata GitHub's
"Cite this repository" button reads, including the LWD-R disclosure, so a
citation records what layers the release actually meets rather than only its
name.

## License

MIT © [Anivar Aravind](https://github.com/anivar) / [OpenSLM](https://github.com/openslm-ai)

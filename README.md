# react-native-ondevice-ai

**On-device AI for React Native.** Text, vision, speech and generative models, using the frameworks the phone already ships — Apple Vision, NaturalLanguage, Speech and Foundation Models on iOS, Google ML Kit on Android.

Nothing leaves the device. There is no cloud tier and no `fetch`, and CI fails the build if a networking symbol appears in the native sources at all.

Needs iOS 17+, Android API 26+ and React Native 0.86+ on the New Architecture.
No JS runtime dependencies. MIT.

## Install

```bash
npm install react-native-ondevice-ai
```

**Expo** — add the plugin and rebuild. It sets the SDK floors and the speech usage string for you:

```json
{ "expo": { "plugins": ["react-native-ondevice-ai"] } }
```

**Bare React Native** — raise `ios/Podfile` to `platform :ios, '17.0'` and `minSdkVersion` to `26`, then `pod install`. Both floors are required, not advisory: [why](https://github.com/anivar/react-native-ondevice-ai/blob/main/docs/setup.md).

A development build, not Expo Go.

## Use it

```ts
import { getDeviceCapabilities, analyzeText, summarize } from 'react-native-ondevice-ai';

// Language ID and entities on every supported device, no model download.
// Sentiment is iOS only — NaturalLanguage has it, ML Kit does not.
const { language, sentiment } = await analyzeText('I really like this app', {
  includeSentiment: true,
});

// Generative features are not on every phone. Ask before you offer them.
const { availability } = await getDeviceCapabilities();
if (availability.summarize.state === 'available') {
  const { value, tier, degraded } = await summarize(longArticle);
}
```

## The part that makes this different

Most phones cannot run a generative model. Gemini Nano needs AICore and Apple Foundation Models needs an Apple-Intelligence device on iOS 26 — and even among AICore devices the coverage splits, with the Galaxy S25 family supporting `summarize` but not `generate`. AICore also updates its model through the system, so a device's answer changes without your app being touched. **So the interesting question is not what the API does, it is what your user's phone can do right now.**

`availability` answers that per feature, with a reason:

```ts
availability.summarize
// { state: 'downloadable', requiresNetwork: true,
//   detail: 'AICore can download the model for this feature.' }
```

`state` is `available`, `downloadable`, `downloading` or `unavailable`. When it is `unavailable` it carries a `reason` — and the distinction that matters is permanence: `os-too-old`, `hardware-ineligible` and `no-platform-api` mean hide the button forever; `user-disabled` and `model-not-ready` may change without your app being updated. Android often reports `unknown` instead of `hardware-ineligible` — AICore's own status cannot tell "never will" from "still fetching its configuration", so this package does not claim more certainty than the platform gives it. Treat `unknown` as "not now", not "never".

This comes from ML Kit's `checkFeatureStatus()` and Apple's `SystemLanguageModel.availability` — signals both platforms publish and most wrappers throw away in favour of a boolean.

`explainCall('summarize')` gives the same answer as a sentence, without running anything.

## What runs where

| | iOS | Android |
|---|---|---|
| Text: language ID, entities | ✅ | ✅ |
| Sentiment | ✅ | ❌ |
| Vision: OCR, barcodes, labels, faces, segmentation | ✅ | ✅ |
| Embeddings | ✅ | ❌ |
| Translate, smart replies, image description | ❌ | ✅ |
| File transcription | ✅ | ❌ |
| Proofread | ✅ (UITextChecker, always) | AICore, generative |
| Summarize, rewrite, generate, chat | iOS 26 + Apple Intelligence | AICore devices |

The two platforms genuinely differ, and this package does not pretend otherwise: a call that a platform cannot do rejects with a typed `AIError` naming the reason, never a polyfill or a placeholder string. Full table: [docs/capabilities.md](https://github.com/anivar/react-native-ondevice-ai/blob/main/docs/capabilities.md).

On Android, where most devices have no generative model, `summarize()` falls back to a bundled extractive summariser that selects sentences and never composes new text, so it cannot invent anything — results carry `degraded: true` and the route that produced them. iOS defaults to an honest rejection instead of that fallback, since Apple ships a real summariser on eligible hardware and a silently worse result on everything else is not a favour; opt in with `configure({ ios: { tiers: ['on-device', 'local-deterministic'] } })` if you want it anyway.

## Docs

- [Setup](https://github.com/anivar/react-native-ondevice-ai/blob/main/docs/setup.md) — platform floors, Expo plugin, the one Android permission
- [Capabilities](https://github.com/anivar/react-native-ondevice-ai/blob/main/docs/capabilities.md) — every method, and reading availability
- [Guide](https://github.com/anivar/react-native-ondevice-ai/blob/main/docs/guide.md) — usage, private mode, device-class gotchas
- [Provenance](https://github.com/anivar/react-native-ondevice-ai/blob/main/docs/provenance.md) — supply chain, citation

## Status

CI compiles every line of Kotlin, Swift and ObjC++ on each pull request, inside a generated host app, and asserts this library was actually linked and that none of its build tasks failed. It runs nothing — no job executes a native path on a device or emulator. The native sources are also checked for networking symbols, the Android manifest for permissions beyond an allowlist, and the podspec for agreement with the manifest it ships in.

The generative routes additionally need hardware no CI runner has at all: an Apple Intelligence iPhone for Foundation Models, an AICore Android for ML Kit GenAI. The example app has a screen that exercises the public API and produces a shareable report; if you own one of those devices, [that report is the most useful thing anyone can send](https://github.com/anivar/react-native-ondevice-ai/blob/main/docs/contributing-hardware.md).

## About

This repository ships no model weights and no training data. On iOS everything comes from system frameworks that were already on the phone. On Android, the ML Kit base APIs are bundled dependencies — they add their own model assets to your APK, which is a real cost this package does not hide — and entity extraction and translation additionally download a language pack on first use.

MIT © [Anivar Aravind](https://github.com/anivar)

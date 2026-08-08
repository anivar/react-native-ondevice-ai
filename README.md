# mobile-ai-toolkit

**On-device AI for React Native.** Text, vision, speech and generative models, using the frameworks the phone already ships — Apple Vision, NaturalLanguage, Speech and Foundation Models on iOS, Google ML Kit on Android.

Nothing leaves the device. There is no cloud tier and no `fetch`, and CI fails the build if a networking symbol appears in the native sources at all.

[![npm](https://img.shields.io/npm/v/mobile-ai-toolkit/latest.svg?style=flat-square&label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/mobile-ai-toolkit)
[![CI](https://img.shields.io/github/actions/workflow/status/openslm-ai/mobile-ai-toolkit/ci.yml?branch=main&style=flat-square&label=CI&logo=githubactions&logoColor=white)](https://github.com/openslm-ai/mobile-ai-toolkit/actions/workflows/ci.yml)
[![provenance](https://img.shields.io/badge/npm-provenance-success?style=flat-square&logo=npm)](https://docs.npmjs.com/generating-provenance-statements)
![runtime deps 0](https://img.shields.io/badge/runtime%20deps-0-22c55e?style=flat-square)
![iOS 17+](https://img.shields.io/badge/iOS-17%2B-000?style=flat-square&logo=apple&logoColor=white)
![Android API 26+](https://img.shields.io/badge/Android-API%2026%2B-3DDC84?style=flat-square&logo=android&logoColor=white)

## Install

```bash
npm install mobile-ai-toolkit
```

**Expo** — add the plugin and rebuild. It sets the SDK floors and the speech usage string for you:

```json
{ "expo": { "plugins": ["mobile-ai-toolkit"] } }
```

**Bare React Native** — raise `ios/Podfile` to `platform :ios, '17.0'` and `minSdkVersion` to `26`, then `pod install`. Both floors are required, not advisory: [why](https://github.com/openslm-ai/mobile-ai-toolkit/blob/main/docs/setup.md).

Needs React Native 0.86+ and the New Architecture. A development build, not Expo Go.

## Use it

```ts
import { getDeviceCapabilities, analyzeText, summarize } from 'mobile-ai-toolkit';

// Works on every supported device — no model download, no setup.
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

Most phones cannot run a generative model. Gemini Nano needs AICore — Pixel 9+, Galaxy S25+ — and Apple Foundation Models needs an Apple-Intelligence device on iOS 26. **So the interesting question is not what the API does, it is what your user's phone can actually do.**

`availability` answers that per feature, with a reason:

```ts
availability.summarize
// { state: 'downloadable', requiresNetwork: true,
//   detail: 'AICore can download the generative model for this device.' }
```

`state` is `available`, `downloadable`, `downloading` or `unavailable`. When it is `unavailable` it carries a `reason` — and the distinction that matters is permanence: `os-too-old`, `hardware-ineligible` and `no-platform-api` mean hide the button forever; `user-disabled` and `model-not-ready` may change without your app being updated.

This comes from ML Kit's `checkFeatureStatus()` and Apple's `SystemLanguageModel.availability` — signals both platforms publish and most wrappers throw away in favour of a boolean.

`explainCall('summarize')` gives the same answer as a sentence, without running anything.

## What runs where

| | iOS | Android |
|---|---|---|
| Text: language ID, entities, sentiment | ✅ | ✅ |
| Vision: OCR, barcodes, labels, faces, segmentation | ✅ | ✅ |
| Embeddings | ✅ | ❌ |
| Translate, smart replies, image description | ❌ | ✅ |
| File transcription | ✅ | ❌ |
| Generative: summarize, rewrite, generate, chat | iOS 26 + Apple Intelligence | AICore devices |

The two platforms genuinely differ, and this package does not pretend otherwise: a call that a platform cannot do rejects with a typed `AIError` naming the reason, never a polyfill or a placeholder string. Full table: [docs/capabilities.md](https://github.com/openslm-ai/mobile-ai-toolkit/blob/main/docs/capabilities.md).

For devices with no generative model, `summarize()` falls back to a bundled extractive summariser that selects sentences and never composes new text, so it cannot invent anything. Results carry `degraded: true` and the route that produced them.

## Docs

- [Setup](https://github.com/openslm-ai/mobile-ai-toolkit/blob/main/docs/setup.md) — platform floors, Expo plugin, the one Android permission
- [Capabilities](https://github.com/openslm-ai/mobile-ai-toolkit/blob/main/docs/capabilities.md) — every method, and reading availability
- [Guide](https://github.com/openslm-ai/mobile-ai-toolkit/blob/main/docs/guide.md) — usage, private mode, device-class gotchas
- [Provenance](https://github.com/openslm-ai/mobile-ai-toolkit/blob/main/docs/provenance.md) — supply chain, citation

## Status

Every line of Kotlin, Swift and ObjC++ is compiled by CI on each pull request, and CI asserts the library was actually linked. The Apple Foundation Models path compiles against the real SDK but has never been observed running on eligible hardware — nobody on the project owns one. If you do, [ten minutes closes it](https://github.com/openslm-ai/mobile-ai-toolkit/blob/main/docs/contributing-hardware.md).

## About

Part of [OpenSLM](https://openslm.ai), built to the [Open Small Models Accord](https://openslm.ai/accord). Under the Accord's LWD-R layers this package is Logic only: inference and routing code, no weights and no data.

MIT © [Anivar Aravind](https://github.com/anivar)

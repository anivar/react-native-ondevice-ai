# react-native-ondevice-ai

**On-device AI for React Native.** Text, vision, speech and generative models, using the frameworks the phone already ships — Apple Vision, NaturalLanguage, Speech and Foundation Models on iOS, Google ML Kit on Android.

Nothing leaves the device. There is no cloud tier and no `fetch`, and CI fails the build if a networking symbol appears in the native sources at all.

Needs iOS 17+, Android API 26+ and React Native 0.86+ on the New Architecture.
No runtime dependencies. MIT.

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

The two platforms genuinely differ, and this package does not pretend otherwise: a call that a platform cannot do rejects with a typed `AIError` naming the reason, never a polyfill or a placeholder string. Full table: [docs/capabilities.md](https://github.com/anivar/react-native-ondevice-ai/blob/main/docs/capabilities.md).

For devices with no generative model, `summarize()` falls back to a bundled extractive summariser that selects sentences and never composes new text, so it cannot invent anything. Results carry `degraded: true` and the route that produced them.

## Docs

- [Setup](https://github.com/anivar/react-native-ondevice-ai/blob/main/docs/setup.md) — platform floors, Expo plugin, the one Android permission
- [Capabilities](https://github.com/anivar/react-native-ondevice-ai/blob/main/docs/capabilities.md) — every method, and reading availability
- [Guide](https://github.com/anivar/react-native-ondevice-ai/blob/main/docs/guide.md) — usage, private mode, device-class gotchas
- [Provenance](https://github.com/anivar/react-native-ondevice-ai/blob/main/docs/provenance.md) — supply chain, citation

## Status

Every line of Kotlin, Swift and ObjC++ is compiled by CI on each pull request, and CI asserts the library was actually linked. The Apple Foundation Models path compiles against the real SDK but has never been observed running on eligible hardware — nobody on the project owns one. If you do, [ten minutes closes it](https://github.com/anivar/react-native-ondevice-ai/blob/main/docs/contributing-hardware.md).

## About

This package is inference and routing code only — no model weights, no training data, nothing bundled that you have not already installed with the OS.

MIT © [Anivar Aravind](https://github.com/anivar)

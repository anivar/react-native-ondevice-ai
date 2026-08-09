# Guide

Usage, private mode, and the things that differ by device.

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
} from 'react-native-ondevice-ai';

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
import { enablePrivateMode, isPrivateModeEnabled } from 'react-native-ondevice-ai';
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


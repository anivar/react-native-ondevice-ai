# Capabilities and availability

What each method maps to, and how to ask a device what it can do.

## Capability matrix

Every method below maps to a real platform call. ✅ = on-device. 🧪 = compiled against the real SDK but never observed running on eligible hardware. ❌ = not implemented on that platform; the call rejects with `code: 'FEATURE_UNAVAILABLE'` and `reason: 'no-platform-api'`. `platformCode` carries the platform's own string — `UNSUPPORTED_PLATFORM`, or `FILE_TRANSCRIPTION_UNSUPPORTED` for Android transcription.

| Method | iOS | Android |
|---|---|---|
| `getDeviceCapabilities()` | ✅ — feature probe | ✅ — feature probe |
| `analyzeText(text, opts)` | ✅ NaturalLanguage — sentiment + entities | ✅ ML Kit Language ID + Entity Extraction |
| `extractEntities(text)` | ✅ `NLTagSchemeNameType` | ✅ ML Kit `EntityExtraction` |
| `identifyLanguage(text)` | ✅ `NLLanguageRecognizer` | ✅ ML Kit `LanguageIdentification` |
| `embedText(text)` | ✅ `NLContextualEmbedding` (iOS 17+) | ❌ |
| `analyzeImage(b64, opts)` | ✅ Vision OCR + face rects — `objects` is always empty (Vision ships no general object detector) | ✅ ML Kit text + objects + faces |
| `scanBarcodes(b64)` | ✅ `VNDetectBarcodesRequest` | ✅ ML Kit `BarcodeScanning` |
| `labelImage(b64)` | ✅ `VNClassifyImageRequest` | ✅ ML Kit `ImageLabeling` |
| `describeImage(b64)` | ❌ | 🧪 ML Kit GenAI `ImageDescription` *(Beta, AICore — unverified on hardware)* |
| `segmentPerson(b64)` | ✅ `VNGeneratePersonSegmentationRequest` (iOS 15+) | ✅ ML Kit `SelfieSegmentation` |
| `proofreadText(text)` | ✅ `UITextChecker` *(spelling only, always on)* | 🧪 ML Kit GenAI `Proofreader` *(Beta, AICore — unverified on hardware)* |
| `summarizeText(text, fmt)` | 🧪 Foundation Models *(iOS 26+, Apple Intelligence — unverified on hardware)* | 🧪 ML Kit GenAI `Summarizer` *(Beta, AICore — unverified on hardware)* |
| `rewriteText(text, style)` | 🧪 Foundation Models *(iOS 26+, unverified)* | 🧪 ML Kit GenAI `Rewriter` *(Beta, AICore — unverified on hardware)* |
| `generateText(prompt, opts)` | 🧪 Foundation Models *(iOS 26+, unverified)* | 🧪 ML Kit GenAI `Prompt` API *(Beta, Gemini Nano via AICore — unverified on hardware; Galaxy S25 supports the four rows above but not this one)* |
| `chat(messages, opts)` | 🧪 Foundation Models *(iOS 26+, unverified)* | 🧪 ML Kit GenAI `Prompt` API *(unverified; history flattened to single-shot prompt, bounded to the model's context window)* |
| `smartReplies(messages)` | ❌ — no public iOS equivalent | ✅ ML Kit `SmartReply` (GA) |
| `translateText(text, src, tgt)` | ❌ — `TranslationSession` needs a SwiftUI host ([why](./guide.md#what-this-package-does-not-do)) | ✅ ML Kit `Translator` (GA, downloads language pack on first use) |
| `transcribeAudioFile(path, opts)` | ✅ `SFSpeechRecognizer` with `requiresOnDeviceRecognition = true` | ❌ — rejects `FILE_TRANSCRIPTION_UNSUPPORTED`. Android's `SpeechRecognizer` is microphone-only on stock platforms |

### Knowing what will actually work

`getDeviceCapabilities().availability` gives a per-feature state with a reason:

```ts
const { availability } = await getDeviceCapabilities();
availability.summarize
// { state: 'downloadable', requiresNetwork: true,
//   detail: 'AICore can download the model for this feature.' }
```

`state` is one of `available`, `downloadable`, `downloading` or `unavailable`. The
split that matters is permanence — `unavailable` carries a `reason`, and
`os-too-old`, `hardware-ineligible` and `no-platform-api` mean hide the button on
this device for good, while `user-disabled` and `model-not-ready` can change
without your app being updated.

On Android this comes from ML Kit's `checkFeatureStatus()`, and on iOS from
`SystemLanguageModel.availability` — signals both platforms publish and most
wrappers flatten into a boolean.

`explainCall(feature)` answers the same question as a sentence, and with no
argument returns the plan for all 16 features. It runs no inference and touches
no network. It reports the device it is running on — there is no static
cross-platform table, so run it on both platforms if you need to see whether a
feature is symmetric.

### Working with or without a network

Nothing in this package sends anything anywhere. There is no cloud tier, no
`fetch`, and CI fails the build if a networking symbol appears in the native
sources at all.

"Offline" still has two meanings worth separating. Inference is always local on
both platforms. But several Android features download a model on first use,
and that download needs a network: translation and entity extraction, plus
every ML Kit GenAI feature, whose model AICore fetches the first time you call
it. After that they work offline forever. `availability` marks those with
`requiresNetwork: true` while they are still `downloadable`.

`enablePrivateMode(true)` makes that explicit: a model already on the device
keeps working, and one that is missing rejects `MODEL_NOT_DOWNLOADED` rather
than quietly fetching it. On iOS there is no download path at all, so private
mode is a no-op there, which [the guide](./guide.md#private-mode) says outright
rather than implying a control that does not exist.

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

`summarizeText()` never falls back — it is the platform model or a rejection,
permanently. Fallback behaviour requires calling a differently named function,
so no upgrade can introduce it on your behalf. The fallback is on by default on
Android only; iOS gets an honest rejection instead, because Apple ships a real
summariser on eligible hardware and a silently worse result is not a favour.
Change it with `configure({ android: { tiers: ['on-device'] } })`.

There is no boolean `features` map. A flag that reads `true` for a model still
downloading cannot answer "will this call succeed", so this package does not
ship one.

Every rejection is an `AIError` with a `code` you can switch on — `FEATURE_UNAVAILABLE`, `MODEL_NOT_DOWNLOADED`, `MODEL_DOWNLOAD_TIMEOUT`, `INFERENCE_FAILED`, `MODULE_NOT_LINKED` and a few more — plus `platformCode`, the platform's own more specific string. `isTransient(err)` is true when the feature could work later on this device, which is the distinction a retry button needs.

## Languages the generative features accept

ML Kit's GenAI features are per-language models, and the sets differ. This
package identifies the language of your text and selects the matching model —
language identification is already a dependency, so it costs nothing — and
rejects with `UNSUPPORTED_LANGUAGE` when the text is in a language the feature
does not have. Text too short to identify falls back to English.

| Feature | Languages |
|---|---|
| `summarizeText` | English, Japanese, Korean |
| `rewriteText` | English, Japanese, German, French, Italian, Spanish, Korean |
| `proofreadText` | English, Japanese, German, French, Italian, Spanish, Korean |
| `describeImage` | English |

`generateText` and `chat` go through the Prompt API, which takes no language
parameter.

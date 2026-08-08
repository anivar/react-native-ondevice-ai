# Capabilities and availability

What each method maps to, and how to ask a device what it can do.

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


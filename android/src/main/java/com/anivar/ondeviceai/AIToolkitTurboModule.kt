// react-native-ai-gateway — https://github.com/anivar/react-native-ai-gateway
package com.anivar.ondeviceai

import android.graphics.BitmapFactory
import android.os.Build
import android.speech.SpeechRecognizer
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.google.android.gms.tasks.Task
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.common.GenAiException
import com.google.mlkit.genai.imagedescription.ImageDescriber
import com.google.mlkit.genai.imagedescription.ImageDescriberOptions
import com.google.mlkit.genai.imagedescription.ImageDescription
import com.google.mlkit.genai.imagedescription.ImageDescriptionRequest
import com.google.mlkit.genai.prompt.GenerateContentRequest
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.TextPart
import com.google.mlkit.genai.proofreading.Proofreader
import com.google.mlkit.genai.proofreading.ProofreaderOptions
import com.google.mlkit.genai.proofreading.Proofreading
import com.google.mlkit.genai.proofreading.ProofreadingRequest
import com.google.mlkit.genai.rewriting.Rewriter
import com.google.mlkit.genai.rewriting.RewriterOptions
import com.google.mlkit.genai.rewriting.Rewriting
import com.google.mlkit.genai.rewriting.RewritingRequest
import com.google.mlkit.genai.summarization.Summarization
import com.google.mlkit.genai.summarization.SummarizationRequest
import com.google.mlkit.genai.summarization.Summarizer
import com.google.mlkit.genai.summarization.SummarizerOptions
import com.google.mlkit.nl.entityextraction.EntityExtraction
import com.google.mlkit.nl.entityextraction.EntityExtractionParams
import com.google.mlkit.nl.entityextraction.EntityExtractorOptions
import com.google.mlkit.nl.languageid.LanguageIdentification
import com.google.mlkit.nl.smartreply.SmartReply
import com.google.mlkit.nl.smartreply.TextMessage
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.TranslateRemoteModel
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import com.google.mlkit.vision.objects.ObjectDetection
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions
import com.google.mlkit.vision.segmentation.Segmentation
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.ByteArrayOutputStream
import androidx.concurrent.futures.await
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

@ReactModule(name = AIToolkitTurboModule.NAME)
class AIToolkitTurboModule(private val reactContext: ReactApplicationContext) :
    NativeAIToolkitSpec(reactContext) {

    /**
     * The Prompt API is the one GenAI feature exposed as suspend functions
     * rather than Tasks, so it needs a scope. SupervisorJob keeps one failed
     * generation from cancelling the next; the scope is cancelled in
     * invalidate() so work does not outlive the module.
     */
    private val genAiScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    companion object {
        const val NAME = "AIToolkitTurboModule"

        /**
         * How long to wait for an on-device model download before giving the
         * caller an error instead of a promise that never settles. Generous,
         * because these are real multi-megabyte downloads on real networks;
         * the point is a bound, not a tight one.
         */
        private const val DOWNLOAD_TIMEOUT_MS = 90_000L

        /**
         * A capability probe is called to decide whether to draw a button. It
         * must answer fast or not at all.
         */
        private const val CAPABILITY_PROBE_TIMEOUT_MS = 2_000L
    }

    override fun getName(): String = NAME

    private var privateMode = false

    override fun getDeviceCapabilities(promise: Promise) {
        // The GenAI probe is asynchronous — checkFeatureStatus() talks to
        // AICore — so the whole response is assembled in the callback.
        probeGenAiAvailability { genAi ->
            val availability = Arguments.createMap().apply {
                // Always present: plain ML Kit, bundled, no download, no AICore.
                putMap("analyzeText", available())
                putMap("analyzeImage", available())
                putMap("smartReplies", available())
                putMap("scanBarcodes", available())
                putMap("labelImage", available())
                putMap("segmentPerson", available())

                // Downloads a model on first use, then works offline.
                putMap("extractEntities", downloadableOnFirstUse())
                putMap("translate", downloadableOnFirstUse())

                // GenAI: one answer per feature, because AICore gives one per
                // feature. `chat` rides on the Prompt API, same as `generate`.
                putMap("summarize", genAi.getValue("summarize").copy())
                putMap("rewrite", genAi.getValue("rewrite").copy())
                putMap("proofread", genAi.getValue("proofread").copy())
                putMap("describeImage", genAi.getValue("describeImage").copy())
                putMap("generate", genAi.getValue("generate").copy())
                putMap("chat", genAi.getValue("generate").copy())

                // No Android API at all for these two.
                putMap("embedText", unavailable("no-platform-api",
                    "ML Kit exposes no contextual text embedding on Android."))
                putMap("transcribe", unavailable("no-platform-api",
                    "Android's SpeechRecognizer is microphone-only; " +
                        "transcribeAudioFile takes a file path."))
            }

            val capabilities = Arguments.createMap().apply {
                putString("platform", "android")
                putString("osVersion", Build.VERSION.RELEASE)
                putBoolean("hasNeuralEngine", false)
                putBoolean("hasAppleIntelligence", false)
                val promptUsable = genAi.getValue("generate").getString("state") != "unavailable"
                val featureUsable = genAi.getValue("summarize").getString("state") != "unavailable"
                // hasGeminiNano is a Prompt-API-shaped question; hasMLKitGenAI
                // covers the wider feature-API set. They differ on real devices.
                putBoolean("hasGeminiNano", promptUsable)
                putBoolean("hasMLKitGenAI", featureUsable)
                // isRecognitionAvailable() answers "is there *a* recognizer",
                // including a network one, so it over-reports on-device
                // capability. The on-device question has its own API, added in
                // API 31; below that Android has no on-device recognizer to ask
                // about.
                putBoolean(
                    "hasOnDeviceSpeech",
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                        SpeechRecognizer.isOnDeviceRecognitionAvailable(reactContext)
                )

                putArray("supportedLanguages", Arguments.createArray().apply {
                    TranslateLanguage.getAllLanguages().forEach { pushString(it) }
                })

                putMap("availability", availability)
            }
            promise.resolve(capabilities)
        }
    }

    // ---- Availability helpers ----

    private fun availabilityMap(
        state: String,
        reason: String? = null,
        detail: String? = null,
        requiresNetwork: Boolean = false
    ): WritableMap = Arguments.createMap().apply {
        putString("state", state)
        reason?.let { putString("reason", it) }
        detail?.let { putString("detail", it) }
        putBoolean("requiresNetwork", requiresNetwork)
    }

    private fun available() = availabilityMap("available")

    private fun downloadableOnFirstUse() = availabilityMap(
        "downloadable",
        detail = "ML Kit downloads this model on first use, then works offline.",
        requiresNetwork = true
    )

    private fun unavailable(reason: String, detail: String) =
        availabilityMap("unavailable", reason = reason, detail = detail)

    /** WritableMap cannot be reused across keys, so each feature gets a copy. */
    private fun WritableMap.copy(): WritableMap = Arguments.createMap().apply {
        merge(this@copy)
    }


    /**
     * The honest GenAI answer, replacing a `Class.forName` check.
     *
     * `Class.forName` only says the ML Kit GenAI classes were compiled into the
     * APK. It is true on every device that built with the dependency, including
     * the overwhelming majority that have no AICore and where every generative
     * call fails — which is why `features.summarize` used to promise a feature
     * that could not run. It does still distinguish one real case: a build that
     * omitted the dependency, which is `not-linked`.
     *
     * checkFeatureStatus() is the API that actually knows, and its success
     * value carries the distinction that matters — AVAILABLE, DOWNLOADABLE or
     * DOWNLOADING.
     */
    /**
     * Awaits a Play Services Task. The GenAI features return Guava
     * ListenableFuture and have `await()` from androidx.concurrent; the rest of
     * ML Kit returns Task, which does not, and one small bridge is cheaper than
     * a dependency on kotlinx-coroutines-play-services for a single call.
     */
    private suspend fun <T> Task<T>.awaitTask(): T = suspendCancellableCoroutine { cont ->
        addOnSuccessListener { cont.resume(it) }
        addOnFailureListener { cont.resumeWithException(it) }
    }

    /**
     * Picks the model language for a GenAI feature from the text itself.
     *
     * These three features each take a language and each support a different
     * set of them — summarization does English, Japanese and Korean; rewriting
     * and proofreading add German, French, Italian and Spanish. Passing English
     * regardless, which is what this did, means Japanese input is handed to a
     * model configured for English and the caller is never told.
     *
     * Language identification is already a dependency of this package, so the
     * detection costs no bytes. Undetermined text falls back to English rather
     * than rejecting: it is usually short, and a rejection there would be
     * worse than a guess the caller can override by sending more text.
     *
     * Returns null when the language is determined and unsupported, which the
     * caller turns into UNSUPPORTED_LANGUAGE.
     */
    private suspend fun genAiLanguageFor(text: String, supported: Map<String, Int>): Int? {
        val tag = try {
            LanguageIdentification.getClient().identifyLanguage(text).awaitTask()
        } catch (_: Throwable) {
            "und"
        }
        if (tag == "und") return supported.getValue("en")
        return supported[tag.substringBefore('-').lowercase()]
    }

    private val summarizerLanguages = mapOf(
        "en" to SummarizerOptions.Language.ENGLISH,
        "ja" to SummarizerOptions.Language.JAPANESE,
        "ko" to SummarizerOptions.Language.KOREAN,
    )

    private val rewriterLanguages = mapOf(
        "en" to RewriterOptions.Language.ENGLISH,
        "ja" to RewriterOptions.Language.JAPANESE,
        "de" to RewriterOptions.Language.GERMAN,
        "fr" to RewriterOptions.Language.FRENCH,
        "it" to RewriterOptions.Language.ITALIAN,
        "es" to RewriterOptions.Language.SPANISH,
        "ko" to RewriterOptions.Language.KOREAN,
    )

    private val proofreaderLanguages = mapOf(
        "en" to ProofreaderOptions.Language.ENGLISH,
        "ja" to ProofreaderOptions.Language.JAPANESE,
        "de" to ProofreaderOptions.Language.GERMAN,
        "fr" to ProofreaderOptions.Language.FRENCH,
        "it" to ProofreaderOptions.Language.ITALIAN,
        "es" to ProofreaderOptions.Language.SPANISH,
        "ko" to ProofreaderOptions.Language.KOREAN,
    )

    /**
     * AICore says *why* it failed, and the reason is usually actionable.
     *
     * GenAiException carries an error code covering cases a caller can do
     * something about — the app is in the background, the battery quota is
     * spent, the disk is full, the system needs an update — and collapsing all
     * of them into one inference error throws away the only signal that tells a
     * user what to do next. A package whose thesis is honest failure reasons
     * should not discard the field that carries them.
     *
     * Returns null when the throwable is not a GenAiException, so the caller
     * keeps its own code.
     */
    private fun genAiRejectCode(e: Throwable): String? {
        val genAi = generateSequence(e) { it.cause }
            .filterIsInstance<GenAiException>()
            .firstOrNull()
            ?: return null

        return when (genAi.errorCode) {
            // The app must be the foreground activity. A foreground service is
            // not enough, which is the part that surprises people.
            GenAiException.ErrorCode.BACKGROUND_USE_BLOCKED -> "GENAI_BACKGROUND_BLOCKED"
            GenAiException.ErrorCode.PER_APP_BATTERY_USE_QUOTA_EXCEEDED -> "GENAI_QUOTA_EXCEEDED"
            GenAiException.ErrorCode.BUSY -> "GENAI_BUSY"
            GenAiException.ErrorCode.NOT_ENOUGH_DISK_SPACE -> "GENAI_NO_DISK_SPACE"
            GenAiException.ErrorCode.NEEDS_SYSTEM_UPDATE -> "GENAI_NEEDS_SYSTEM_UPDATE"
            GenAiException.ErrorCode.AICORE_INCOMPATIBLE -> "GENAI_AICORE_INCOMPATIBLE"
            GenAiException.ErrorCode.NOT_AVAILABLE -> "GENAI_UNAVAILABLE"
            GenAiException.ErrorCode.CANCELLED -> "GENAI_CANCELLED"
            GenAiException.ErrorCode.REQUEST_TOO_LARGE -> "GENAI_REQUEST_TOO_LARGE"
            GenAiException.ErrorCode.REQUEST_TOO_SMALL -> "GENAI_REQUEST_TOO_SMALL"
            GenAiException.ErrorCode.INVALID_INPUT_IMAGE -> "INVALID_IMAGE"
            else -> null
        }
    }

    /** The generative features, and the AICore client that actually answers for each. */
    private enum class GenAiFeature(val key: String) {
        SUMMARIZE("summarize"),
        REWRITE("rewrite"),
        PROOFREAD("proofread"),
        DESCRIBE_IMAGE("describeImage"),
        // The Prompt API. Separate from the four above in a way that matters:
        // it covers strictly fewer devices — the Galaxy S25 family supports the
        // feature APIs and not this one — so it needs its own probe.
        PROMPT("generate"),
    }

    /** Turns one AICore status into the availability shape the JS side reads. */
    private fun statusToAvailability(status: Int): WritableMap = when (status) {
        FeatureStatus.AVAILABLE -> available()
        FeatureStatus.DOWNLOADABLE -> availabilityMap(
            "downloadable",
            detail = "AICore can download the model for this feature.",
            requiresNetwork = true
        )
        FeatureStatus.DOWNLOADING -> availabilityMap(
            "downloading",
            detail = "AICore is downloading the model for this feature."
        )
        // Not `hardware-ineligible`, which this package defines as permanent.
        // A supported device also reports UNAVAILABLE while AICore fetches its
        // configuration, and no API distinguishes that from a device AICore
        // will never serve.
        else -> availabilityMap(
            "unavailable",
            reason = "unknown",
            detail = "AICore reports this feature unavailable here. That may be " +
                "permanent, or configuration it has not finished downloading."
        )
    }

    /**
     * Probes with the English model. AICore downloads models per language, so a
     * device could in principle answer differently for another one; nothing in
     * the API exposes that, and `availability` is a per-feature question here
     * rather than a per-language one. Worth revisiting if a device ever reports
     * available for English and not for Japanese.
     */
    private suspend fun probeFeature(feature: GenAiFeature): WritableMap = try {
        when (feature) {
            GenAiFeature.SUMMARIZE -> {
                val c = Summarization.getClient(
                    SummarizerOptions.builder(reactContext)
                        .setInputType(SummarizerOptions.InputType.ARTICLE)
                        .setOutputType(SummarizerOptions.OutputType.THREE_BULLETS)
                        .setLanguage(SummarizerOptions.Language.ENGLISH)
                        .build()
                )
                try {
                    statusToAvailability(c.checkFeatureStatus().await())
                } finally {
                    closeQuietly { c.close() }
                }
            }

            GenAiFeature.REWRITE -> {
                val c = Rewriting.getClient(
                    RewriterOptions.builder(reactContext)
                        .setOutputType(RewriterOptions.OutputType.REPHRASE)
                        .setLanguage(RewriterOptions.Language.ENGLISH)
                        .build()
                )
                try {
                    statusToAvailability(c.checkFeatureStatus().await())
                } finally {
                    closeQuietly { c.close() }
                }
            }

            GenAiFeature.PROOFREAD -> {
                val c = Proofreading.getClient(
                    ProofreaderOptions.builder(reactContext)
                        .setLanguage(ProofreaderOptions.Language.ENGLISH)
                        .build()
                )
                try {
                    statusToAvailability(c.checkFeatureStatus().await())
                } finally {
                    closeQuietly { c.close() }
                }
            }

            GenAiFeature.DESCRIBE_IMAGE -> {
                val c = ImageDescription.getClient(
                    ImageDescriberOptions.builder(reactContext).build()
                )
                try {
                    statusToAvailability(c.checkFeatureStatus().await())
                } finally {
                    closeQuietly { c.close() }
                }
            }

            GenAiFeature.PROMPT -> {
                val c = Generation.getClient()
                try {
                    statusToAvailability(c.checkStatus())
                } finally {
                    closeQuietly { c.close() }
                }
            }
        }
    } catch (e: Throwable) {
        availabilityMap(
            "unavailable",
            reason = "unknown",
            detail = "AICore did not answer for this feature. ${e.message}"
        )
    }

    /**
     * Probes each generative feature separately.
     *
     * One probe copied across all six was wrong in a way a user meets: the
     * feature APIs and the Prompt API do not cover the same devices, so a
     * Galaxy S25 was told `generate` was available and then had it reject.
     */
    private fun probeGenAiAvailability(callback: (Map<String, WritableMap>) -> Unit) {
        if (!isMLKitGenAIPresent()) {
            val absent = unavailable(
                "not-linked",
                "The ML Kit GenAI dependency is not in this build."
            )
            callback(GenAiFeature.entries.associate { it.key to absent.copy() })
            return
        }

        genAiScope.launch {
            // A capability probe must never be the thing that hangs a screen,
            // and five probes share one budget rather than each taking their own.
            val probed = withTimeoutOrNull(CAPABILITY_PROBE_TIMEOUT_MS) {
                coroutineScope {
                    GenAiFeature.entries
                        .map { feature -> feature to async { probeFeature(feature) } }
                        .associate { (feature, deferred) -> feature.key to deferred.await() }
                }
            }

            callback(
                probed ?: GenAiFeature.entries.associate {
                    it.key to availabilityMap(
                        "unavailable",
                        reason = "unknown",
                        detail = "AICore did not answer within ${CAPABILITY_PROBE_TIMEOUT_MS}ms."
                    )
                }
            )
        }
    }

    /**
     * Answers one question only: was the GenAI dependency compiled in? It
     * cannot tell whether this device can run it — see probeGenAiAvailability.
     */
    private fun isMLKitGenAIPresent(): Boolean = try {
        Class.forName("com.google.mlkit.genai.summarization.Summarization")
        true
    } catch (_: Throwable) {
        false
    }

    // ---- Text ----

    override fun analyzeText(text: String, options: ReadableMap, promise: Promise) {
        if (text.isEmpty()) {
            promise.reject("INVALID_INPUT", "Text cannot be empty")
            return
        }
        val result = Arguments.createMap()
        val client = LanguageIdentification.getClient()
        client.identifyPossibleLanguages(text)
            .addOnSuccessListener { languages ->
                val top = languages.firstOrNull()
                result.putString("language", top?.languageTag?.takeIf { it != "und" } ?: "unknown")
                result.putDouble("confidence", top?.confidence?.toDouble() ?: 0.0)

                val includeEntities = options.takeIf { it.hasKey("includeEntities") }?.getBoolean("includeEntities") == true
                if (!includeEntities) {
                    promise.resolve(result)
                    return@addOnSuccessListener
                }
                runEntityExtraction(text) { entitiesArray, err ->
                    if (err != null) {
                        // Omit the field rather than returning an empty array.
                        // A failed model download and "this text has no
                        // entities" produced identical results before, so a
                        // caller could not tell them apart or retry.
                        result.putBoolean("degraded", true)
                    } else {
                        result.putArray("entities", entitiesArray)
                    }
                    promise.resolve(result)
                }
            }
            .addOnFailureListener { e ->
                promise.reject("LANGUAGE_ID_ERROR", e.message, e)
            }
    }

    override fun extractEntities(text: String, promise: Promise) {
        runEntityExtraction(text) { array, err ->
            when {
                err is EntityModelNotDownloaded -> promise.reject("MODEL_NOT_DOWNLOADED", err.message)
                err != null -> promise.reject("ENTITY_EXTRACTION_ERROR", err.message, err)
                else -> promise.resolve(array)
            }
        }
    }

    /**
     * Distinguishes "private mode refused to download this" from every other
     * entity-extraction failure, so extractEntities() can reject the same
     * MODEL_NOT_DOWNLOADED code that translateText() already does for the
     * identical situation — rather than the generic INFERENCE_FAILED an
     * IOException produced here before, which broke private mode's own
     * contract silently.
     */
    private class EntityModelNotDownloaded : Exception(
        "Private mode is on and the entity-extraction model is not on this " +
            "device. Downloading it would require a network request."
    )

    private fun runEntityExtraction(text: String, callback: (WritableArray, Throwable?) -> Unit) {
        val extractor = EntityExtraction.getClient(
            EntityExtractorOptions.Builder(EntityExtractorOptions.ENGLISH).build()
        )
        // Same stall risk as translate: this downloads a model on first use and
        // a download waiting on the network never fails, it waits. The callback
        // fires exactly once, whichever of the three paths gets there first.
        val settled = java.util.concurrent.atomic.AtomicBoolean(false)
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            if (settled.compareAndSet(false, true)) {
                callback(
                    Arguments.createArray(),
                    java.util.concurrent.TimeoutException(
                        "The entity-extraction model did not finish downloading within " +
                            "${DOWNLOAD_TIMEOUT_MS / 1000}s."
                    )
                )
            }
        }, DOWNLOAD_TIMEOUT_MS)

        // Private mode: annotate with a model already on the device, but never
        // fetch one. isModelDownloaded answers locally.
        val work = if (privateMode) {
            extractor.isModelDownloaded.continueWithTask { downloaded ->
                if (downloaded.result != true) {
                    throw EntityModelNotDownloaded()
                }
                extractor.annotate(EntityExtractionParams.Builder(text).build())
            }
        } else {
            extractor.downloadModelIfNeeded()
                .continueWithTask { extractor.annotate(EntityExtractionParams.Builder(text).build()) }
        }

        work
            .addOnSuccessListener { annotations ->
                val arr = Arguments.createArray()
                annotations.forEach { ann ->
                    ann.entities.forEach { entity ->
                        arr.pushMap(Arguments.createMap().apply {
                            putString("text", ann.annotatedText)
                            putString("type", mapEntityType(entity.type))
                            putDouble("confidence", 0.85)
                            putArray("range", Arguments.createArray().apply {
                                pushInt(ann.start)
                                pushInt(ann.end)
                            })
                        })
                    }
                }
                if (settled.compareAndSet(false, true)) callback(arr, null)
            }
            .addOnFailureListener {
                if (settled.compareAndSet(false, true)) callback(Arguments.createArray(), it)
            }
    }

    private fun mapEntityType(typeId: Int): String = when (typeId) {
        1 -> "address"
        2 -> "date"
        3 -> "email"
        4 -> "phone"
        5 -> "money"
        9 -> "url"
        else -> "other"
    }

    override fun identifyLanguage(text: String, promise: Promise) {
        LanguageIdentification.getClient().identifyLanguage(text)
            .addOnSuccessListener { code -> promise.resolve(if (code == "und") "unknown" else code) }
            .addOnFailureListener { promise.reject("LANGUAGE_ID_ERROR", it.message, it) }
    }

    // ---- Image ----

    override fun analyzeImage(imageBase64: String, options: ReadableMap, promise: Promise) {
        try {
            val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return promise.reject("INVALID_IMAGE", "Failed to decode image")
            val image = InputImage.fromBitmap(bitmap, 0)

            val result = Arguments.createMap().apply {
                putString("text", "")
                putArray("objects", Arguments.createArray())
                putArray("faces", Arguments.createArray())
            }

            val tasks = mutableListOf<() -> Unit>()
            // ML Kit completion listeners run on the main looper by default but
            // are not guaranteed to, and a plain `var` decremented from more
            // than one of them can lose a write — leaving the promise pending
            // forever, or hitting zero twice and resolving twice. Both are
            // cheap to rule out.
            val pending = java.util.concurrent.atomic.AtomicInteger(0)
            val degraded = java.util.concurrent.atomic.AtomicBoolean(false)
            val complete = {
                if (pending.decrementAndGet() == 0) {
                    result.putBoolean("degraded", degraded.get())
                    promise.resolve(result)
                }
            }
            // A sub-analysis that fails still lets the others through, but the
            // caller is told, rather than reading an empty `objects` array as
            // "no objects in this image".
            val failed = {
                degraded.set(true)
                complete()
            }

            if (options.takeIf { it.hasKey("extractText") }?.getBoolean("extractText") == true) {
                pending.incrementAndGet()
                tasks += {
                    TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
                        .process(image)
                        .addOnSuccessListener { text -> result.putString("text", text.text); complete() }
                        .addOnFailureListener { failed() }
                }
            }
            if (options.takeIf { it.hasKey("detectObjects") }?.getBoolean("detectObjects") == true) {
                pending.incrementAndGet()
                tasks += {
                    val opts = ObjectDetectorOptions.Builder()
                        .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
                        .enableClassification()
                        .enableMultipleObjects()
                        .build()
                    ObjectDetection.getClient(opts).process(image)
                        .addOnSuccessListener { detected ->
                            val arr = Arguments.createArray()
                            detected.forEach { obj ->
                                arr.pushMap(Arguments.createMap().apply {
                                    val label = obj.labels.firstOrNull()
                                    putString("label", label?.text ?: "object")
                                    putDouble("confidence", label?.confidence?.toDouble() ?: 0.0)
                                    putMap("bounds", Arguments.createMap().apply {
                                        putDouble("x", obj.boundingBox.left.toDouble())
                                        putDouble("y", obj.boundingBox.top.toDouble())
                                        putDouble("width", obj.boundingBox.width().toDouble())
                                        putDouble("height", obj.boundingBox.height().toDouble())
                                    })
                                })
                            }
                            result.putArray("objects", arr)
                            complete()
                        }
                        .addOnFailureListener { failed() }
                }
            }
            if (options.takeIf { it.hasKey("detectFaces") }?.getBoolean("detectFaces") == true) {
                pending.incrementAndGet()
                tasks += {
                    val opts = FaceDetectorOptions.Builder()
                        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
                        .build()
                    FaceDetection.getClient(opts).process(image)
                        .addOnSuccessListener { faces ->
                            val arr = Arguments.createArray()
                            faces.forEach { face ->
                                arr.pushMap(Arguments.createMap().apply {
                                    putMap("bounds", Arguments.createMap().apply {
                                        putDouble("x", face.boundingBox.left.toDouble())
                                        putDouble("y", face.boundingBox.top.toDouble())
                                        putDouble("width", face.boundingBox.width().toDouble())
                                        putDouble("height", face.boundingBox.height().toDouble())
                                    })
                                })
                            }
                            result.putArray("faces", arr)
                            complete()
                        }
                        .addOnFailureListener { failed() }
                }
            }

            if (tasks.isEmpty()) {
                promise.resolve(result)
            } else {
                tasks.forEach { it() }
            }
        } catch (e: Exception) {
            promise.reject("IMAGE_ANALYSIS_ERROR", e.message, e)
        }
    }

    // ---- Generative (ML Kit GenAI, Beta) ----

    override fun summarizeText(text: String, format: String, promise: Promise) {
        genAiScope.launch {
            val language = genAiLanguageFor(text, summarizerLanguages)
            if (language == null) {
                promise.reject(
                    "UNSUPPORTED_LANGUAGE",
                    "ML Kit summarization supports English, Japanese and Korean."
                )
                return@launch
            }

            val summarizer: Summarizer = try {
                Summarization.getClient(
                    SummarizerOptions.builder(reactContext)
                        .setInputType(SummarizerOptions.InputType.ARTICLE)
                        .setOutputType(
                            if (format == "bullets") SummarizerOptions.OutputType.THREE_BULLETS
                            else SummarizerOptions.OutputType.ONE_BULLET
                        )
                        .setLanguage(language)
                        .build()
                )
            } catch (e: Throwable) {
                promise.reject(
                    "FEATURE_UNAVAILABLE",
                    "ML Kit GenAI is not installed in this build",
                    e
                )
                return@launch
            }

            run {
                try {
                    val status = summarizer.checkFeatureStatus().await()
                    if (!genAiStatusAllowsRun(status, "summarization", promise)) return@launch

                    try {
                        summarizer.prepareInferenceEngine().await()
                    } catch (e: Throwable) {
                        promise.reject("SUMMARIZE_PREPARE_ERROR", e.message, e)
                        return@launch
                    }

                    val request = SummarizationRequest.builder(text).build()
                    val sb = StringBuilder()
                    summarizer.runInference(request) { token -> sb.append(token) }.await()
                    promise.resolve(sb.toString())
                } catch (e: Throwable) {
                    promise.reject(genAiRejectCode(e) ?: "SUMMARIZE_INFERENCE_ERROR", e.message, e)
                } finally {
                    closeQuietly { summarizer.close() }
                }
            }
        }
    }

    override fun rewriteText(text: String, style: String, promise: Promise) {
        genAiScope.launch {
            val language = genAiLanguageFor(text, rewriterLanguages)
            if (language == null) {
                promise.reject(
                    "UNSUPPORTED_LANGUAGE",
                    "ML Kit rewriting supports English, Japanese, German, French, " +
                        "Italian, Spanish and Korean."
                )
                return@launch
            }

            val outputType = when (style) {
                // The union is ELABORATE, EMOJIFY, SHORTEN, FRIENDLY, PROFESSIONAL,
                // REPHRASE. There is no FORMAL or CASUAL.
                "professional" -> RewriterOptions.OutputType.PROFESSIONAL
                "friendly", "casual" -> RewriterOptions.OutputType.FRIENDLY
                "concise" -> RewriterOptions.OutputType.SHORTEN
                "creative", "elaborate" -> RewriterOptions.OutputType.ELABORATE
                else -> RewriterOptions.OutputType.REPHRASE
            }

            val rewriter: Rewriter = try {
                Rewriting.getClient(
                    RewriterOptions.builder(reactContext)
                        .setOutputType(outputType)
                        .setLanguage(language)
                        .build()
                )
            } catch (e: Throwable) {
                promise.reject(
                    "FEATURE_UNAVAILABLE",
                    "ML Kit GenAI is not installed in this build",
                    e
                )
                return@launch
            }

            run {
                try {
                    val status = rewriter.checkFeatureStatus().await()
                    if (!genAiStatusAllowsRun(status, "rewriting", promise)) return@launch

                    try {
                        rewriter.prepareInferenceEngine().await()
                    } catch (e: Throwable) {
                        promise.reject("REWRITE_PREPARE_ERROR", e.message, e)
                        return@launch
                    }

                    val request = RewritingRequest.builder(text).build()
                    val result = rewriter.runInference(request).await()
                    promise.resolve(result.results.firstOrNull()?.text ?: text)
                } catch (e: Throwable) {
                    promise.reject(genAiRejectCode(e) ?: "REWRITE_INFERENCE_ERROR", e.message, e)
                } finally {
                    closeQuietly { rewriter.close() }
                }
            }
        }
    }

    override fun proofreadText(text: String, promise: Promise) {
        genAiScope.launch {
            val language = genAiLanguageFor(text, proofreaderLanguages)
            if (language == null) {
                promise.reject(
                    "UNSUPPORTED_LANGUAGE",
                    "ML Kit proofreading supports English, Japanese, German, French, " +
                        "Italian, Spanish and Korean."
                )
                return@launch
            }

            val proofreader: Proofreader = try {
                Proofreading.getClient(
                    ProofreaderOptions.builder(reactContext)
                        .setLanguage(language)
                        .build()
                )
            } catch (e: Throwable) {
                promise.reject(
                    "FEATURE_UNAVAILABLE",
                    "ML Kit GenAI is not installed in this build",
                    e
                )
                return@launch
            }

            run {
                try {
                    val status = proofreader.checkFeatureStatus().await()
                    if (!genAiStatusAllowsRun(status, "proofreading", promise)) return@launch

                    try {
                        proofreader.prepareInferenceEngine().await()
                    } catch (e: Throwable) {
                        promise.reject("PROOFREAD_PREPARE_ERROR", e.message, e)
                        return@launch
                    }

                    val request = ProofreadingRequest.builder(text).build()
                    val result = proofreader.runInference(request).await()
                    promise.resolve(
                        Arguments.createMap().apply {
                            putString("correctedText", result.results.firstOrNull()?.text ?: text)
                            putArray("corrections", Arguments.createArray())
                        }
                    )
                } catch (e: Throwable) {
                    promise.reject(genAiRejectCode(e) ?: "PROOFREAD_INFERENCE_ERROR", e.message, e)
                } finally {
                    closeQuietly { proofreader.close() }
                }
            }
        }
    }

    override fun smartReplies(messages: ReadableArray, promise: Promise) {
        val conversation = mutableListOf<TextMessage>()
        for (i in 0 until messages.size()) {
            val m = messages.getMap(i) ?: continue
            val text = m.getString("text") ?: continue
            val fromUser = if (m.hasKey("fromUser")) m.getBoolean("fromUser") else false
            val ts = if (m.hasKey("timestampMs")) m.getDouble("timestampMs").toLong() else System.currentTimeMillis()
            val msg = if (fromUser) TextMessage.createForLocalUser(text, ts)
                      else TextMessage.createForRemoteUser(text, ts, "remote")
            conversation.add(msg)
        }
        SmartReply.getClient().suggestReplies(conversation)
            .addOnSuccessListener { result ->
                val arr = Arguments.createArray()
                result.suggestions.forEach { arr.pushString(it.text) }
                promise.resolve(arr)
            }
            .addOnFailureListener { promise.reject("SMART_REPLY_ERROR", it.message, it) }
    }

    override fun translateText(text: String, sourceLang: String, targetLang: String, promise: Promise) {
        val src = TranslateLanguage.fromLanguageTag(sourceLang)
        val tgt = TranslateLanguage.fromLanguageTag(targetLang)
        if (src == null || tgt == null) {
            promise.reject("UNSUPPORTED_LANGUAGE", "Unsupported language pair: $sourceLang -> $targetLang")
            return
        }
        val opts = TranslatorOptions.Builder()
            .setSourceLanguage(src)
            .setTargetLanguage(tgt)
            .build()
        val translator = Translation.getClient(opts)
        // No requireWifi(). ML Kit does not fail a download whose conditions are
        // unmet — it waits for them. On cellular the task therefore never
        // completes, and neither listener below ever runs, so the JS promise
        // stays pending forever with no error and no timeout. A caller who
        // wants a wifi-only policy can check connectivity before calling; a
        // caller who does not want one had no way to opt out.
        val conditions = DownloadConditions.Builder().build()
        val settled = rejectIfDownloadStalls(promise) { translator.close() }

        // Private mode: use the model if it is already here, refuse to fetch it
        // if it is not. RemoteModelManager answers without touching the network.
        if (privateMode) {
            RemoteModelManager.getInstance()
                .isModelDownloaded(TranslateRemoteModel.Builder(tgt).build())
                .addOnSuccessListener { present ->
                    if (!present) {
                        if (settled.compareAndSet(false, true)) {
                            blockedByPrivateMode(promise, "translation")
                            translator.close()
                        }
                    } else {
                        runTranslation(translator, text, promise, settled, conditions)
                    }
                }
                .addOnFailureListener {
                    if (settled.compareAndSet(false, true)) {
                        promise.reject("TRANSLATE_ERROR", it.message, it)
                        translator.close()
                    }
                }
            return
        }

        runTranslation(translator, text, promise, settled, conditions)
    }

    private fun runTranslation(
        translator: com.google.mlkit.nl.translate.Translator,
        text: String,
        promise: Promise,
        settled: java.util.concurrent.atomic.AtomicBoolean,
        conditions: DownloadConditions
    ) {
        translator.downloadModelIfNeeded(conditions)
            .continueWithTask { translator.translate(text) }
            .addOnSuccessListener { translated ->
                if (settled.compareAndSet(false, true)) {
                    promise.resolve(translated)
                    translator.close()
                }
            }
            .addOnFailureListener {
                if (settled.compareAndSet(false, true)) {
                    promise.reject("TRANSLATE_ERROR", it.message, it)
                    translator.close()
                }
            }
    }

    /**
     * Arms a timeout that rejects MODEL_DOWNLOAD_TIMEOUT, and returns the flag
     * that decides who settles the promise first.
     *
     * Model downloads are the one place in this module where a task can stall
     * indefinitely: they wait on the network and on Play Services, and a
     * stalled task never invokes a failure listener. Without this, a translate
     * on a flaky connection is indistinguishable from a hung app.
     *
     * The caller must guard its own listeners with the returned flag, so a
     * download that finishes after the timeout does not settle the promise a
     * second time.
     */
    private fun rejectIfDownloadStalls(
        promise: Promise,
        onTimeout: () -> Unit = {}
    ): java.util.concurrent.atomic.AtomicBoolean {
        val settled = java.util.concurrent.atomic.AtomicBoolean(false)
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            if (settled.compareAndSet(false, true)) {
                promise.reject(
                    "MODEL_DOWNLOAD_TIMEOUT",
                    "The on-device model did not finish downloading within " +
                        "${DOWNLOAD_TIMEOUT_MS / 1000}s. It may still be downloading in " +
                        "the background; retrying later often succeeds."
                )
                onTimeout()
            }
        }, DOWNLOAD_TIMEOUT_MS)
        return settled
    }

    // ---- Speech ----

    override fun transcribeAudioFile(filePath: String, options: ReadableMap, promise: Promise) {
        // Android's SpeechRecognizer is microphone-only on stock platforms; the
        // EXTRA_AUDIO_SOURCE path for file input is OEM-gated and not reliably
        // available across devices.
        //
        // There is now a real path: com.google.mlkit:genai-speech-recognition
        // takes a ParcelFileDescriptor via AudioSource.fromPfd(), which is
        // genuine file transcription. It is not adopted here yet — it is
        // 1.0.0-alpha1, needs API 31+ for its Basic mode, and requires 16-bit
        // PCM mono at 16 kHz, so it means owning a decode step rather than
        // accepting any file path this method's signature implies. Worth
        // revisiting when it reaches beta.
        //
        // Reject explicitly so callers can fall back
        // to a TFLite/whisper-on-device pipeline rather than silently
        // transcribing the live microphone (which the previous implementation
        // did, contradicting the filePath contract).
        promise.reject(
            "FILE_TRANSCRIPTION_UNSUPPORTED",
            "Android does not expose a stable file-based SpeechRecognizer API. " +
                "Android's SpeechRecognizer captures from the microphone only."
        )
    }

    // ---- Embeddings ----

    override fun embedText(text: String, promise: Promise) {
        promise.reject(
            "UNSUPPORTED_PLATFORM",
            "Contextual text embeddings are not exposed by ML Kit on Android. " +
                "Use a custom TFLite/LiteRT model if you need embeddings on Android."
        )
    }

    // ---- Generative: prompt ----

    // The Prompt API is coroutine-based, unlike the other four GenAI features,
    // which are Task-based. It has no PromptApi entry point and no
    // PromptRequest: the client comes from Generation.getClient(), status and
    // inference are suspend functions, and the reply arrives as a list of
    // candidates rather than a single .text.
    override fun generateText(prompt: String, options: ReadableMap, promise: Promise) {
        val maxTokens = if (options.hasKey("maxOutputTokens")) options.getInt("maxOutputTokens") else 512
        val temperature =
            if (options.hasKey("temperature")) options.getDouble("temperature").toFloat() else 0.7f

        genAiScope.launch {
            var model: GenerativeModel? = null
            try {
                model = Generation.getClient()

                val status = model.checkStatus()
                if (status != FeatureStatus.AVAILABLE) {
                    promise.reject(
                        "FEATURE_UNAVAILABLE",
                        "The ML Kit GenAI Prompt API reports status $status on this device."
                    )
                    return@launch
                }

                val request = GenerateContentRequest.Builder(TextPart(prompt)).apply {
                    maxOutputTokens = maxTokens
                    this.temperature = temperature
                }.build()

                val response = model.generateContent(request)
                val text = response.candidates.firstOrNull()?.text
                if (text == null) {
                    promise.reject("GENERATE_INFERENCE_ERROR", "The model returned no candidates.")
                } else {
                    promise.resolve(text)
                }
            } catch (e: Throwable) {
                promise.reject(genAiRejectCode(e) ?: "GENERATE_INFERENCE_ERROR", e.message, e)
            } finally {
                try {
                    model?.close()
                } catch (_: Throwable) {
                    // close() is best-effort; a failure here must not mask the result above
                }
            }
        }
    }

    // ---- Generative: chat (multi-turn, single-shot reply) ----

    override fun chat(messages: ReadableArray, options: ReadableMap, promise: Promise) {
        if (messages.size() == 0) {
            promise.reject("INVALID_INPUT", "chat() requires at least one message.")
            return
        }
        // The Prompt API is single-shot, so multi-turn history is replayed as
        // one tagged prompt.
        val instructions = StringBuilder()
        val turns = mutableListOf<String>()
        for (i in 0 until messages.size()) {
            val m = messages.getMap(i) ?: continue
            val role = m.getString("role") ?: continue
            val content = m.getString("content") ?: continue
            if (role == "system") {
                if (instructions.isNotEmpty()) instructions.append('\n')
                instructions.append(content)
            } else {
                turns.add("${role.replaceFirstChar { it.uppercaseChar() }}: $content")
            }
        }
        if (turns.isEmpty()) {
            promise.reject("INVALID_INPUT", "chat() requires at least one non-system message.")
            return
        }

        genAiScope.launch {
            // Every turn ever sent used to be concatenated with no bound, so a
            // long conversation eventually exceeded the model's context and
            // failed — later, mysteriously, and with the whole history to
            // blame. The Prompt API can say what the ceiling is and what a
            // prompt costs, so ask, and drop the oldest turns until it fits.
            val kept = try {
                fitToContext(instructions.toString(), turns)
            } catch (_: Throwable) {
                // If the model cannot be asked, send everything and let
                // REQUEST_TOO_LARGE surface as the typed rejection it now is.
                turns
            }

            if (kept.isEmpty()) {
                promise.reject(
                    "GENAI_REQUEST_TOO_LARGE",
                    "The most recent message alone exceeds this model's context window."
                )
                return@launch
            }

            val prompt = buildString {
                if (instructions.isNotEmpty()) {
                    append(instructions)
                    append("\n\n")
                }
                kept.forEach {
                    append(it)
                    append('\n')
                }
                append("Assistant:")
            }
            generateText(prompt, options, promise)
        }
    }

    /**
     * Drops the oldest turns until the prompt fits the model's context window,
     * keeping the system instructions and the most recent turns — the parts a
     * caller would keep by hand.
     *
     * Returns an empty list when even the newest turn does not fit, which is a
     * caller error rather than something to silently truncate.
     */
    private suspend fun fitToContext(instructions: String, turns: List<String>): List<String> {
        val model = Generation.getClient()
        try {
            val limit = model.getTokenLimit()

            var kept = turns
            while (kept.isNotEmpty()) {
                val candidate = buildString {
                    if (instructions.isNotEmpty()) {
                        append(instructions)
                        append("\n\n")
                    }
                    kept.forEach {
                        append(it)
                        append('\n')
                    }
                    append("Assistant:")
                }

                val request = GenerateContentRequest.Builder(TextPart(candidate)).build()
                if (model.countTokens(request).totalTokens <= limit) return kept

                kept = kept.drop(1)
            }
            return emptyList()
        } finally {
            closeQuietly { model.close() }
        }
    }

    // ---- Vision (extras) ----

    override fun scanBarcodes(imageBase64: String, promise: Promise) {
        try {
            val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return promise.reject("INVALID_IMAGE", "Failed to decode image")
            val image = InputImage.fromBitmap(bitmap, 0)
            val opts = BarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_ALL_FORMATS)
                .build()
            BarcodeScanning.getClient(opts).process(image)
                .addOnSuccessListener { barcodes ->
                    val arr = Arguments.createArray()
                    barcodes.forEach { b ->
                        arr.pushMap(Arguments.createMap().apply {
                            putString("rawValue", b.rawValue ?: "")
                            putString("format", barcodeFormatName(b.format))
                            val box = b.boundingBox
                            putMap("bounds", Arguments.createMap().apply {
                                putDouble("x", box?.left?.toDouble() ?: 0.0)
                                putDouble("y", box?.top?.toDouble() ?: 0.0)
                                putDouble("width", box?.width()?.toDouble() ?: 0.0)
                                putDouble("height", box?.height()?.toDouble() ?: 0.0)
                            })
                        })
                    }
                    promise.resolve(arr)
                }
                .addOnFailureListener { promise.reject("BARCODE_ERROR", it.message, it) }
        } catch (e: Exception) {
            promise.reject("BARCODE_ERROR", e.message, e)
        }
    }

    private fun barcodeFormatName(format: Int): String = when (format) {
        Barcode.FORMAT_QR_CODE -> "qrcode"
        Barcode.FORMAT_EAN_13 -> "ean13"
        Barcode.FORMAT_EAN_8 -> "ean8"
        Barcode.FORMAT_UPC_A -> "upca"
        Barcode.FORMAT_UPC_E -> "upce"
        Barcode.FORMAT_CODE_39 -> "code39"
        Barcode.FORMAT_CODE_93 -> "code93"
        Barcode.FORMAT_CODE_128 -> "code128"
        Barcode.FORMAT_PDF417 -> "pdf417"
        Barcode.FORMAT_DATA_MATRIX -> "datamatrix"
        Barcode.FORMAT_AZTEC -> "aztec"
        Barcode.FORMAT_ITF -> "itf"
        Barcode.FORMAT_CODABAR -> "codabar"
        else -> "unknown"
    }

    override fun labelImage(imageBase64: String, promise: Promise) {
        try {
            val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return promise.reject("INVALID_IMAGE", "Failed to decode image")
            val image = InputImage.fromBitmap(bitmap, 0)
            ImageLabeling.getClient(ImageLabelerOptions.DEFAULT_OPTIONS).process(image)
                .addOnSuccessListener { labels ->
                    val arr = Arguments.createArray()
                    labels.forEach { lbl ->
                        arr.pushMap(Arguments.createMap().apply {
                            putString("label", lbl.text)
                            putDouble("confidence", lbl.confidence.toDouble())
                        })
                    }
                    promise.resolve(arr)
                }
                .addOnFailureListener { promise.reject("LABEL_ERROR", it.message, it) }
        } catch (e: Exception) {
            promise.reject("LABEL_ERROR", e.message, e)
        }
    }

    override fun describeImage(imageBase64: String, promise: Promise) {
        try {
            val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return promise.reject("INVALID_IMAGE", "Failed to decode image")

            val opts = ImageDescriberOptions.builder(reactContext).build()
            val describer: ImageDescriber = ImageDescription.getClient(opts)
            genAiScope.launch {
                try {
                    val status = describer.checkFeatureStatus().await()
                    if (!genAiStatusAllowsRun(status, "image description", promise)) return@launch

                    try {
                        describer.prepareInferenceEngine().await()
                    } catch (e: Throwable) {
                        promise.reject("DESCRIBE_PREPARE_ERROR", e.message, e)
                        return@launch
                    }

                    val request = ImageDescriptionRequest.builder(bitmap).build()
                    val result = describer.runInference(request).await()
                    promise.resolve(result.description ?: "")
                } catch (e: Throwable) {
                    promise.reject(genAiRejectCode(e) ?: "DESCRIBE_INFERENCE_ERROR", e.message, e)
                } finally {
                    closeQuietly { describer.close() }
                }
            }
        } catch (e: Throwable) {
            promise.reject("FEATURE_UNAVAILABLE", "ML Kit GenAI Image Description is not installed", e)
        }
    }

    override fun segmentPerson(imageBase64: String, promise: Promise) {
        try {
            val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return promise.reject("INVALID_IMAGE", "Failed to decode image")
            val image = InputImage.fromBitmap(bitmap, 0)
            val opts = SelfieSegmenterOptions.Builder()
                .setDetectorMode(SelfieSegmenterOptions.SINGLE_IMAGE_MODE)
                .build()
            // Segmentation.getClient, not SelfieSegmentation: the selfie artifact
            // supplies the *options*, the client comes from the segmentation
            // package. There is no SelfieSegmentation type.
            Segmentation.getClient(opts).process(image)
                .addOnSuccessListener { mask ->
                    val w = mask.width
                    val h = mask.height
                    val buffer = mask.buffer
                    val maskBitmap = android.graphics.Bitmap.createBitmap(w, h, android.graphics.Bitmap.Config.ALPHA_8)
                    val pixels = ByteArray(w * h)
                    buffer.rewind()
                    for (i in 0 until w * h) {
                        val confidence = buffer.float
                        pixels[i] = (confidence * 255f).toInt().toByte()
                    }
                    val argb = IntArray(w * h)
                    for (i in 0 until w * h) {
                        val v = pixels[i].toInt() and 0xff
                        argb[i] = (0xff shl 24) or (v shl 16) or (v shl 8) or v
                    }
                    val rgbBitmap = android.graphics.Bitmap.createBitmap(argb, w, h, android.graphics.Bitmap.Config.ARGB_8888)
                    val baos = ByteArrayOutputStream()
                    rgbBitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, baos)
                    val b64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)
                    promise.resolve(Arguments.createMap().apply {
                        putString("maskBase64", b64)
                        putInt("width", w)
                        putInt("height", h)
                    })
                }
                .addOnFailureListener { promise.reject("SEGMENT_ERROR", it.message, it) }
        } catch (e: Exception) {
            promise.reject("SEGMENT_ERROR", e.message, e)
        }
    }

    // ---- Privacy ----

    /**
     * Private mode was dead code: stored here, returned by the getter, read by
     * nothing. It is now enforced at the two places in this module that touch
     * the network — the entity-extraction and translation model downloads.
     *
     * Inference itself never leaves the device on either platform, so those
     * downloads were the only network activity there was. With private mode on,
     * a feature whose model is already present keeps working offline, and one
     * whose model is missing rejects instead of quietly fetching it.
     */
    override fun enablePrivateMode(enabled: Boolean) {
        privateMode = enabled
    }

    override fun isPrivateModeEnabled(): Boolean = privateMode

    /**
     * Rejects when a model download is about to happen and private mode forbids
     * it. Returns true if the caller should stop.
     */
    override fun invalidate() {
        genAiScope.cancel()
        super.invalidate()
    }

    /**
     * Turns a FeatureStatus into the taxonomy the JS side documents, and
     * returns whether the caller should proceed.
     *
     * Every GenAI entry point used to call checkFeatureStatus() and throw the
     * answer away, so on a phone without AICore — most phones — the failure
     * surfaced from prepareInferenceEngine() as an inference error. The whole
     * point of the availability API is that a caller can tell "never here" from
     * "not yet", and that distinction was being discarded at the one place it
     * is actually known.
     */
    private fun genAiStatusAllowsRun(status: Int, feature: String, promise: Promise): Boolean =
        when (status) {
            FeatureStatus.AVAILABLE -> true

            // The model is not on the device but AICore can fetch it, which is
            // what prepareInferenceEngine() below will trigger. Private mode
            // forbids exactly that, so it gets the transient code.
            FeatureStatus.DOWNLOADABLE -> !blockedByPrivateMode(promise, feature)

            // A download is already running. Transient, and retrying later
            // works — which is why this is not hardware-ineligible.
            FeatureStatus.DOWNLOADING -> {
                promise.reject(
                    "GENAI_MODEL_DOWNLOADING",
                    "AICore is still downloading the $feature model. Try again once it finishes."
                )
                false
            }

            else -> {
                promise.reject(
                    "GENAI_UNAVAILABLE",
                    "This device cannot run ML Kit GenAI $feature (AICore reports status $status)."
                )
                false
            }
        }

    /**
     * close() on a GenAI client is best-effort teardown. A failure there must
     * not replace the result already handed to the promise, and a promise can
     * only be settled once.
     */
    private inline fun closeQuietly(close: () -> Unit) {
        try {
            close()
        } catch (_: Throwable) {
        }
    }

    private fun blockedByPrivateMode(promise: Promise, what: String): Boolean {
        if (!privateMode) return false
        promise.reject(
            "MODEL_NOT_DOWNLOADED",
            "Private mode is on and the $what model is not on this device. " +
                "Downloading it would require a network request. Turn private " +
                "mode off once to fetch the model, then it works offline."
        )
        return true
    }
}

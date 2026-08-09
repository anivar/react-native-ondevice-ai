/**
 * Native reject code -> public taxonomy.
 *
 * The native codes are deliberately NOT renamed. There are 46 of them across
 * Kotlin, ObjC++ and Swift, and not one line of any of those three languages is
 * compiled by CI today, so a rename is a silent regression waiting to happen.
 * Mapping in TypeScript is reversible, testable on the Linux runner the repo
 * already has, and can land before the compile gates exist.
 *
 * Two rules:
 *  - An unmapped code is not an error. It falls through to UNKNOWN with the
 *    native string preserved, so a new native code degrades to "something went
 *    wrong, here is exactly what" rather than crashing the mapper.
 *  - Where the two platforms disagree about the same user-visible situation,
 *    they map to the same public code. Unavailable embeddings are
 *    UNSUPPORTED_PLATFORM on Android and EMBEDDING_UNAVAILABLE or
 *    UNSUPPORTED_OS on iOS; a caller should not have to know that.
 *
 * `errorMap.test.ts` greps both native files and fails if a code exists there
 * and not here, which is what stops this drifting.
 */

import { type ErrorCode, ErrorCodes, type UnavailableReason } from './errors';

interface Mapping {
  code: ErrorCode;
  reason?: UnavailableReason;
}

export const NATIVE_ERROR_MAP: Readonly<Record<string, Mapping>> = Object.freeze({
  // ---- caller's fault, both platforms ----
  INVALID_INPUT: { code: ErrorCodes.INVALID_INPUT },
  INVALID_IMAGE: { code: ErrorCodes.INVALID_IMAGE },
  FILE_NOT_FOUND: { code: ErrorCodes.INVALID_INPUT },
  UNSUPPORTED_LANGUAGE: { code: ErrorCodes.UNSUPPORTED_LANGUAGE },
  UNSUPPORTED_LOCALE: { code: ErrorCodes.UNSUPPORTED_LANGUAGE },

  // ---- permanently unavailable here ----
  // The platform simply has no API for it: smartReplies/translate/describeImage
  // on iOS, embeddings and file transcription on Android.
  UNSUPPORTED_PLATFORM: { code: ErrorCodes.FEATURE_UNAVAILABLE, reason: 'no-platform-api' },
  EMBEDDING_UNAVAILABLE: { code: ErrorCodes.FEATURE_UNAVAILABLE, reason: 'no-platform-api' },
  FILE_TRANSCRIPTION_UNSUPPORTED: {
    code: ErrorCodes.FEATURE_UNAVAILABLE,
    reason: 'no-platform-api',
  },
  ON_DEVICE_UNSUPPORTED: { code: ErrorCodes.FEATURE_UNAVAILABLE, reason: 'no-platform-api' },
  UNSUPPORTED_OS: { code: ErrorCodes.FEATURE_UNAVAILABLE, reason: 'os-too-old' },
  // The precise cause is carried in the message on iOS (SystemLanguageModel
  // .availability). Until that is lifted into `reason`, this stays honestly
  // unknown rather than guessing.
  FEATURE_UNAVAILABLE: { code: ErrorCodes.FEATURE_UNAVAILABLE, reason: 'unknown' },
  // Deliberately not `hardware-ineligible`. FeatureStatus.UNAVAILABLE is also
  // what a supported device returns while AICore is still fetching its
  // configuration — Google documents that as taking anywhere from minutes to
  // hours — and nothing in the API distinguishes that from a device AICore will
  // never serve. `hardware-ineligible` means "hide this forever" here, so
  // claiming it from an ambiguous signal would tell callers to permanently
  // remove a feature that may appear on its own. The message carries the raw
  // status.
  GENAI_UNAVAILABLE: { code: ErrorCodes.FEATURE_UNAVAILABLE, reason: 'unknown' },
  RECOGNIZER_UNAVAILABLE: { code: ErrorCodes.FEATURE_UNAVAILABLE, reason: 'unknown' },
  // The user said no, or was never asked. Not a device limitation — it can be
  // reversed in Settings, which is why it is `user-disabled` and not
  // `hardware-ineligible`.
  SPEECH_PERMISSION_DENIED: { code: ErrorCodes.FEATURE_UNAVAILABLE, reason: 'user-disabled' },
  // Parental controls or an MDM policy. The user cannot reverse this one
  // themselves, but the device is capable, so it is still not a hardware fact.
  SPEECH_PERMISSION_RESTRICTED: { code: ErrorCodes.FEATURE_UNAVAILABLE, reason: 'user-disabled' },

  // ---- would work after a download ----
  EMBEDDING_ASSETS_UNAVAILABLE: { code: ErrorCodes.MODEL_NOT_DOWNLOADED },
  // prepareInferenceEngine is the call that triggers the AICore feature
  // download, so its failure is a download failure, not an inference one.
  SUMMARIZE_PREPARE_ERROR: { code: ErrorCodes.MODEL_DOWNLOAD_FAILED },
  REWRITE_PREPARE_ERROR: { code: ErrorCodes.MODEL_DOWNLOAD_FAILED },
  PROOFREAD_PREPARE_ERROR: { code: ErrorCodes.MODEL_DOWNLOAD_FAILED },
  GENERATE_PREPARE_ERROR: { code: ErrorCodes.MODEL_DOWNLOAD_FAILED },
  DESCRIBE_PREPARE_ERROR: { code: ErrorCodes.MODEL_DOWNLOAD_FAILED },

  // ---- ran, and failed ----
  SUMMARIZE_INFERENCE_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  REWRITE_INFERENCE_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  PROOFREAD_INFERENCE_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  GENERATE_INFERENCE_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  DESCRIBE_INFERENCE_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  // Swift names the same failures differently again.
  SUMMARIZATION_FAILED: { code: ErrorCodes.INFERENCE_FAILED },
  REWRITE_FAILED: { code: ErrorCodes.INFERENCE_FAILED },
  GENERATION_FAILED: { code: ErrorCodes.INFERENCE_FAILED },
  CHAT_FAILED: { code: ErrorCodes.INFERENCE_FAILED },
  // Vision / ML Kit execution failures. The *_HANDLER_ERROR variants are the
  // request handler failing rather than the request; same thing to a caller.
  IMAGE_ANALYSIS_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  BARCODE_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  BARCODE_HANDLER_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  LABEL_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  LABEL_HANDLER_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  SEGMENT_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  SEGMENT_HANDLER_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  SEGMENT_NO_RESULT: { code: ErrorCodes.INFERENCE_FAILED },
  SEGMENT_RENDER_FAILED: { code: ErrorCodes.INFERENCE_FAILED },
  LANGUAGE_ID_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  ENTITY_EXTRACTION_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  SMART_REPLY_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  TRANSLATE_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  RECOGNITION_ERROR: { code: ErrorCodes.INFERENCE_FAILED },
  EMBEDDING_LOAD_FAILED: { code: ErrorCodes.INFERENCE_FAILED },
  EMBEDDING_ERROR: { code: ErrorCodes.INFERENCE_FAILED },

  // ---- raised from Kotlin by the availability and privacy work ----
  MODEL_DOWNLOAD_TIMEOUT: { code: ErrorCodes.MODEL_DOWNLOAD_TIMEOUT },
  // Private mode is on and the model is not on the device, so fetching it
  // would mean a network request. Transient: it resolves the moment the model
  // is present, or private mode is turned off once.
  MODEL_NOT_DOWNLOADED: { code: ErrorCodes.MODEL_NOT_DOWNLOADED },
  // AICore is fetching the model right now. The device is capable and the call
  // will work shortly, so this is `model-not-ready` rather than an error the
  // caller should hide a feature over.
  GENAI_MODEL_DOWNLOADING: {
    code: ErrorCodes.FEATURE_UNAVAILABLE,
    reason: 'model-not-ready',
  },

  // ---- AICore said why, and the reason is actionable ----
  // From GenAiException.getErrorCode(). These used to arrive as a generic
  // inference failure, which told a caller nothing about what to do next.

  // Inference is only permitted while the app is the foreground activity — a
  // foreground service does not qualify. Retrying from the background will
  // never work; retrying when the user returns will.
  GENAI_BACKGROUND_BLOCKED: {
    code: ErrorCodes.FEATURE_UNAVAILABLE,
    reason: 'user-disabled',
  },
  // Per-app battery quota for on-device inference, refilled by the system.
  GENAI_QUOTA_EXCEEDED: { code: ErrorCodes.FEATURE_UNAVAILABLE, reason: 'model-not-ready' },
  // AICore is serving someone else. The definition of worth retrying.
  GENAI_BUSY: { code: ErrorCodes.TIMEOUT },
  GENAI_NO_DISK_SPACE: { code: ErrorCodes.MODEL_DOWNLOAD_FAILED },
  // A system update would fix it, so it is not permanent, but the app cannot.
  GENAI_NEEDS_SYSTEM_UPDATE: {
    code: ErrorCodes.FEATURE_UNAVAILABLE,
    reason: 'os-too-old',
  },
  // The AICore on this device cannot serve this build's request shape.
  GENAI_AICORE_INCOMPATIBLE: {
    code: ErrorCodes.FEATURE_UNAVAILABLE,
    reason: 'hardware-ineligible',
  },
  GENAI_CANCELLED: { code: ErrorCodes.CANCELLED },
  // The caller's fault, and fixable by them: the Prompt API has a token ceiling.
  GENAI_REQUEST_TOO_LARGE: { code: ErrorCodes.INVALID_INPUT },
  GENAI_REQUEST_TOO_SMALL: { code: ErrorCodes.INVALID_INPUT },
});

export function mapNativeCode(nativeCode: string): Mapping {
  return NATIVE_ERROR_MAP[nativeCode] ?? { code: ErrorCodes.UNKNOWN };
}

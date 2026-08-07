/**
 * The error a caller can actually branch on.
 *
 * Until now the only way to tell "this device will never do that" from "the
 * model has not downloaded yet" was to string-match a message, because the
 * codes lived in prose in the README and nowhere in the type system. The two
 * platforms also disagree: unavailable embeddings are `UNSUPPORTED_PLATFORM`
 * on Android and `EMBEDDING_UNAVAILABLE` or `UNSUPPORTED_OS` on iOS, for the
 * same user-visible situation.
 *
 * So `code` is a small closed set that means the same thing on both platforms
 * and is safe to switch on. The platform's own string is kept verbatim in
 * `platformCode`, because it is often more specific than the public code and
 * throwing it away would lose the only detail a bug report can use.
 */

/**
 * Why a feature is unavailable, when the code is FEATURE_UNAVAILABLE.
 *
 * The distinction that matters to a UI is permanence: `os-too-old` and
 * `hardware-ineligible` mean hide the button forever on this device, while
 * `user-disabled` and `model-not-ready` mean it may work later.
 */
export type UnavailableReason =
  | 'os-too-old'
  | 'hardware-ineligible'
  | 'not-linked'
  | 'user-disabled'
  | 'model-not-ready'
  | 'unsupported-language'
  | 'no-platform-api'
  | 'unknown';

export const ErrorCodes = {
  /** The argument was wrong. Fixable by the caller. */
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_IMAGE: 'INVALID_IMAGE',
  UNSUPPORTED_LANGUAGE: 'UNSUPPORTED_LANGUAGE',

  /** This device, OS or build cannot do this. See `reason`. */
  FEATURE_UNAVAILABLE: 'FEATURE_UNAVAILABLE',
  /** It could work, after a download. Not the same as unavailable. */
  MODEL_NOT_DOWNLOADED: 'MODEL_NOT_DOWNLOADED',
  MODEL_DOWNLOAD_FAILED: 'MODEL_DOWNLOAD_FAILED',
  MODEL_DOWNLOAD_TIMEOUT: 'MODEL_DOWNLOAD_TIMEOUT',

  /** It should have worked and did not. */
  INFERENCE_FAILED: 'INFERENCE_FAILED',
  TIMEOUT: 'TIMEOUT',
  CANCELLED: 'CANCELLED',

  /**
   * The native module is not present: Expo Go, react-native-web, the old
   * architecture, or a missing pod/gradle link. Previously this surfaced as a
   * hard throw at import time, which took the whole bundle down.
   */
  MODULE_NOT_LINKED: 'MODULE_NOT_LINKED',

  /** A native code this build does not know about. `platformCode` has it. */
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export interface AIErrorInit {
  code: ErrorCode;
  message: string;
  /** The verbatim native reject code, or 'MODULE_NOT_LINKED' when raised in JS. */
  platformCode: string;
  platform: 'ios' | 'android' | 'js';
  /** Which SDK method was called. */
  feature?: string;
  /** Only meaningful when code is FEATURE_UNAVAILABLE. */
  reason?: UnavailableReason;
  cause?: unknown;
}

export class AIError extends Error {
  readonly code: ErrorCode;
  readonly platformCode: string;
  readonly platform: 'ios' | 'android' | 'js';
  readonly feature?: string;
  readonly reason?: UnavailableReason;
  readonly cause?: unknown;

  constructor(init: AIErrorInit) {
    super(init.message);
    this.name = 'AIError';
    this.code = init.code;
    this.platformCode = init.platformCode;
    this.platform = init.platform;
    this.feature = init.feature;
    this.reason = init.reason;
    this.cause = init.cause;
    // Extending a built-in loses the prototype under ES5 downlevelling, which
    // is what `instanceof` and therefore `isAIError` rely on.
    Object.setPrototypeOf(this, AIError.prototype);
  }
}

export function isAIError(e: unknown): e is AIError {
  return e instanceof AIError;
}

/**
 * True when the feature could work later on this device — the model just is
 * not there yet. Worth separating from a permanent no, because the two want
 * different UI: a retry versus a hidden button.
 */
export function isTransient(e: unknown): boolean {
  return (
    isAIError(e) &&
    (e.code === ErrorCodes.MODEL_NOT_DOWNLOADED ||
      e.code === ErrorCodes.MODEL_DOWNLOAD_TIMEOUT ||
      e.code === ErrorCodes.MODEL_DOWNLOAD_FAILED ||
      e.code === ErrorCodes.TIMEOUT)
  );
}

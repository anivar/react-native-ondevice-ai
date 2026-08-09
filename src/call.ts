/**
 * The one place a native call is made, so there is one place errors are shaped.
 *
 * Two jobs.
 *
 * First: the native module may be absent. It is absent in Expo Go, on
 * react-native-web, under the old architecture, and whenever a pod or gradle
 * link is missing. Until now `TurboModuleRegistry.getEnforcing` threw at
 * *import* time, so a missing module did not fail the feature, it failed the
 * bundle — an app that merely imported this package to check a capability
 * would white-screen. The registry lookup is now nullable and the failure is
 * raised here, at call time, as a normal rejection a caller can catch.
 *
 * Second: native rejects with a platform-specific string code. That gets
 * translated into an AIError with a stable public code, keeping the native one
 * alongside it. See errorMap.ts for why the native codes are not renamed.
 */

import { Platform } from 'react-native';
import { mapNativeCode } from './errorMap';
import { AIError, ErrorCodes } from './errors';
import NativeAIToolkit, { type Spec } from './specs/NativeAIToolkit';

function currentPlatform(): 'ios' | 'android' | 'js' {
  return Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'js';
}

/** Throws if the native module is not linked. Callers should not need this. */
export function requireNative(feature: string): Spec {
  if (!NativeAIToolkit) {
    throw new AIError({
      code: ErrorCodes.MODULE_NOT_LINKED,
      message:
        'The react-native-ondeviceai native module is not linked. This is expected on ' +
        'Expo Go, react-native-web, and the old React Native architecture. Run ' +
        '`cd ios && pod install` (or rebuild the Android app) in a development ' +
        'build, and confirm the new architecture is enabled.',
      platformCode: 'MODULE_NOT_LINKED',
      platform: currentPlatform(),
      feature,
    });
  }
  return NativeAIToolkit;
}

/**
 * Anything thrown by a native reject, normalised.
 *
 * React Native surfaces a rejection as an Error carrying `code` and `message`
 * from the native side. Non-Error throws are possible in principle, so they are
 * handled rather than assumed away.
 */
function toAIError(e: unknown, feature: string): AIError {
  if (e instanceof AIError) return e;

  const nativeCode =
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    typeof (e as { code: unknown }).code === 'string'
      ? (e as { code: string }).code
      : '';
  const message = e instanceof Error ? e.message : String(e);
  const { code, reason } = mapNativeCode(nativeCode);

  return new AIError({
    code,
    reason,
    message,
    platformCode: nativeCode || 'UNKNOWN',
    platform: currentPlatform(),
    feature,
    cause: e,
  });
}

/**
 * Wraps one native method. `fn` receives the module, so the null check happens
 * once, here, rather than at every call site.
 */
export function call<T>(feature: string, fn: (native: Spec) => Promise<T>): Promise<T> {
  let native: Spec;
  try {
    native = requireNative(feature);
  } catch (e) {
    // A missing module must reject, not throw synchronously: every one of these
    // methods is documented as returning a promise, and a sync throw from an
    // async-looking call is the kind of thing that escapes a try/catch written
    // around an await.
    return Promise.reject(e);
  }
  return fn(native).catch((e: unknown) => {
    throw toAIError(e, feature);
  });
}

/** The synchronous pair (privateMode). Same null handling, no promise. */
export function callSync<T>(feature: string, fn: (native: Spec) => T): T {
  return fn(requireNative(feature));
}

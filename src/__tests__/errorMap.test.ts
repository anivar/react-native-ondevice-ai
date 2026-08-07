/**
 * Drift protection for errorMap.ts.
 *
 * This reads the Kotlin, ObjC++ and Swift sources and fails if any of them can
 * reject with a code the map does not know. It is the only test in the repo
 * that touches native reality, and it exists because CI compiles none of those
 * three languages — a native code added tomorrow would otherwise reach callers
 * as UNKNOWN with nobody noticing.
 *
 * It runs on the Linux runner the repo already has: it is text, not a build.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mapNativeCode, NATIVE_ERROR_MAP } from '../errorMap';
import { ErrorCodes } from '../errors';

const ROOT = join(__dirname, '..', '..');

const NATIVE_FILES = [
  'android/src/main/java/com/openslm/mobileaitoolkit/AIToolkitTurboModule.kt',
  'ios/AIToolkitTurboModule.mm',
  'ios/AIToolkitFoundationModels.swift',
];

/**
 * Matches the reject-code argument in all three dialects:
 *   Kotlin/Swift  promise.reject("CODE", ...)
 *   ObjC++        reject(@"CODE", ...)
 * Codes are SCREAMING_SNAKE by convention in every existing call site; the
 * character class is what keeps this from matching message strings.
 */
const REJECT_CODE = /reject\(\s*@?"([A-Z][A-Z0-9_]{2,})"/g;

function codesIn(relPath: string): string[] {
  const source = readFileSync(join(ROOT, relPath), 'utf8');
  const found = new Set<string>();
  for (const m of source.matchAll(REJECT_CODE)) found.add(m[1]);
  return [...found].sort();
}

describe('errorMap covers every native reject code', () => {
  for (const file of NATIVE_FILES) {
    it(`${file} has no unmapped codes`, () => {
      const codes = codesIn(file);
      // A zero-match result would make this test vacuously pass, which is the
      // failure mode a regex-based check actually has.
      expect(codes.length).toBeGreaterThan(0);

      const unmapped = codes.filter((c) => !(c in NATIVE_ERROR_MAP));
      expect(unmapped).toEqual([]);
    });
  }
});

describe('mapNativeCode', () => {
  it('preserves the caller-fault distinction', () => {
    expect(mapNativeCode('INVALID_INPUT').code).toBe(ErrorCodes.INVALID_INPUT);
    expect(mapNativeCode('UNSUPPORTED_LOCALE').code).toBe(ErrorCodes.UNSUPPORTED_LANGUAGE);
  });

  it('separates "will never work here" from "not downloaded yet"', () => {
    expect(mapNativeCode('UNSUPPORTED_PLATFORM')).toEqual({
      code: ErrorCodes.FEATURE_UNAVAILABLE,
      reason: 'no-platform-api',
    });
    expect(mapNativeCode('SUMMARIZE_PREPARE_ERROR').code).toBe(ErrorCodes.MODEL_DOWNLOAD_FAILED);
    expect(mapNativeCode('SUMMARIZE_INFERENCE_ERROR').code).toBe(ErrorCodes.INFERENCE_FAILED);
  });

  it('gives the two platforms the same public code for the same situation', () => {
    // Embeddings are absent on Android and can be unavailable on iOS; a caller
    // should not have to know which native string it got.
    expect(mapNativeCode('UNSUPPORTED_PLATFORM').code).toBe(
      mapNativeCode('EMBEDDING_UNAVAILABLE').code
    );
  });

  it('falls through rather than throwing on an unknown code', () => {
    expect(mapNativeCode('SOMETHING_ADDED_NEXT_YEAR').code).toBe(ErrorCodes.UNKNOWN);
    expect(mapNativeCode('').code).toBe(ErrorCodes.UNKNOWN);
  });
});

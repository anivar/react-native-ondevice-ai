/**
 * The mock is typed `Spec`, so a change to the native interface fails this
 * file rather than being discovered on a device. It had already drifted: the
 * `features` map was missing five of the flags DeviceCapabilities declares.
 *
 * Rejections carry a `code` property, which is how React Native actually
 * surfaces a native reject. The previous mock threw `new Error('...')` with the
 * code in the message, so the assertions — all `rejects.toThrow()` with no
 * argument — would have passed on a typo's TypeError just as happily.
 */

import type { FeatureAvailability, FeatureAvailabilityMap, Spec } from '../specs/NativeAIToolkit';

const YES: FeatureAvailability = { state: 'available' };
const NO_API: FeatureAvailability = {
  state: 'unavailable',
  reason: 'no-platform-api',
  detail: 'No public iOS API.',
};

/**
 * An eligible iOS 26 device whose Apple Intelligence model is still
 * downloading — the case a boolean flag could not represent, and the reason
 * `availability` exists.
 */
const availability: FeatureAvailabilityMap = {
  analyzeText: YES,
  analyzeImage: YES,
  proofread: YES,
  extractEntities: YES,
  scanBarcodes: YES,
  labelImage: YES,
  segmentPerson: YES,
  embedText: YES,
  transcribe: YES,
  summarize: { state: 'downloading', detail: 'Apple Intelligence model is downloading.' },
  rewrite: { state: 'downloading' },
  generate: { state: 'downloading' },
  chat: { state: 'downloading' },
  smartReplies: NO_API,
  translate: NO_API,
  describeImage: NO_API,
};

/** Builds the error shape React Native delivers from a native reject. */
function nativeReject(code: string): Error & { code: string } {
  return Object.assign(new Error(`native said ${code}`), { code });
}

const native: Spec = {
  getDeviceCapabilities: jest.fn(async () => ({
    platform: 'ios' as const,
    osVersion: '18.0',
    hasNeuralEngine: true,
    hasAppleIntelligence: false,
    hasGeminiNano: false,
    hasMLKitGenAI: false,
    hasOnDeviceSpeech: true,
    supportedLanguages: ['en', 'es'],
    availability,
  })),
  analyzeText: jest.fn(async () => ({
    language: 'en',
    sentiment: 0.5,
    confidence: 0.9,
  })),
  extractEntities: jest.fn(async () => []),
  identifyLanguage: jest.fn(async () => 'en'),
  embedText: jest.fn(async () => [0.1, 0.2]),
  analyzeImage: jest.fn(async () => ({ text: '', objects: [], faces: [] })),
  scanBarcodes: jest.fn(async () => []),
  labelImage: jest.fn(async () => []),
  describeImage: jest.fn(async () => {
    throw nativeReject('UNSUPPORTED_PLATFORM');
  }),
  segmentPerson: jest.fn(async () => ({ maskBase64: '', width: 1, height: 1 })),
  proofreadText: jest.fn(async (text: string) => ({
    correctedText: text,
    corrections: [],
  })),
  summarizeText: jest.fn(async () => {
    throw nativeReject('ON_DEVICE_UNSUPPORTED');
  }),
  rewriteText: jest.fn(async () => {
    throw nativeReject('UNSUPPORTED_OS');
  }),
  generateText: jest.fn(async () => {
    throw nativeReject('FEATURE_UNAVAILABLE');
  }),
  chat: jest.fn(async () => {
    throw nativeReject('CHAT_FAILED');
  }),
  smartReplies: jest.fn(async () => []),
  translateText: jest.fn(async () => {
    throw nativeReject('UNSUPPORTED_PLATFORM');
  }),
  transcribeAudioFile: jest.fn(async () => ({
    text: 'hello',
    confidence: 0.9,
    locale: 'en-US',
  })),
  enablePrivateMode: jest.fn(),
  isPrivateModeEnabled: jest.fn(() => false),
};

jest.mock('../specs/NativeAIToolkit', () => ({
  __esModule: true,
  default: native,
}));

import {
  AIError,
  analyzeImage,
  analyzeText,
  chat,
  ErrorCodes,
  enablePrivateMode,
  explainCall,
  extractEntities,
  generateText,
  getDeviceCapabilities,
  identifyLanguage,
  isPrivateModeEnabled,
  isTransient,
  proofreadText,
  rewriteText,
  smartReplies,
  summarizeText,
  transcribeAudioFile,
  translateText,
} from '../index';

describe('react-native-ondevice-ai', () => {
  test('exports a function-based API (no AI class)', () => {
    expect(typeof getDeviceCapabilities).toBe('function');
    expect(typeof analyzeText).toBe('function');
    expect(typeof analyzeImage).toBe('function');
    expect(typeof proofreadText).toBe('function');
    expect(typeof transcribeAudioFile).toBe('function');
  });

  test('availability separates "not yet" from "never here"', async () => {
    const caps = await getDeviceCapabilities();

    // The whole point: both of these read `true` in the deprecated boolean map,
    // and they are not the same answer.
    expect(caps.availability.summarize.state).toBe('downloading');
    expect(caps.availability.translate.state).toBe('unavailable');
    expect(caps.availability.translate.reason).toBe('no-platform-api');
  });

  test('explainCall answers without running inference', async () => {
    const plan = await explainCall('summarize');
    expect(plan.willSucceed).toBe(false);
    expect(plan.mayChangeLater).toBe(true);
    expect(plan.summary).toMatch(/downloading/i);

    const dead = await explainCall('translate');
    expect(dead.willSucceed).toBe(false);
    // no-platform-api is permanent, so a UI should hide this one for good.
    expect(dead.mayChangeLater).toBe(false);

    const works = await explainCall('analyzeText');
    expect(works.willSucceed).toBe(true);
  });

  test('explainCall with no argument covers every feature', async () => {
    const all = await explainCall();
    expect(all).toHaveLength(16);
    expect(all.every((p) => typeof p.summary === 'string')).toBe(true);
  });

  test('getDeviceCapabilities returns the availability map', async () => {
    const caps = await getDeviceCapabilities();
    expect(caps.platform).toBeDefined();
    expect(caps.availability.analyzeText.state).toBe('available');
    expect(Array.isArray(caps.supportedLanguages)).toBe(true);
  });

  test('analyzeText returns language + optional sentiment', async () => {
    const result = await analyzeText('I love this', { includeSentiment: true });
    expect(result.language).toBe('en');
    expect(result.sentiment).toBeGreaterThanOrEqual(-1);
    expect(result.sentiment as number).toBeLessThanOrEqual(1);
  });

  test('extractEntities and identifyLanguage are callable', async () => {
    await expect(extractEntities('hello')).resolves.toEqual([]);
    await expect(identifyLanguage('hello')).resolves.toBe('en');
  });

  test('analyzeImage returns text/objects/faces shape', async () => {
    const result = await analyzeImage('AAAA', { extractText: true });
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('objects');
    expect(result).toHaveProperty('faces');
  });

  test('proofread iOS path returns correctedText', async () => {
    const result = await proofreadText('helo wrld');
    expect(result.correctedText).toBeDefined();
    expect(Array.isArray(result.corrections)).toBe(true);
  });

  test('a platform without the API rejects FEATURE_UNAVAILABLE, not a bare Error', async () => {
    // Three different native codes, one public code: that is the point of the
    // taxonomy. The native string stays available for a bug report.
    for (const [call, platformCode] of [
      [() => summarizeText('long text'), 'ON_DEVICE_UNSUPPORTED'],
      [() => rewriteText('hello', 'professional'), 'UNSUPPORTED_OS'],
      [() => translateText('hello', 'en', 'es'), 'UNSUPPORTED_PLATFORM'],
      [() => generateText('hi', { maxOutputTokens: 10 }), 'FEATURE_UNAVAILABLE'],
    ] as const) {
      await expect(call()).rejects.toMatchObject({
        name: 'AIError',
        code: ErrorCodes.FEATURE_UNAVAILABLE,
        platformCode,
      });
    }
  });

  test('a failure that ran and broke is not reported as unavailable', async () => {
    await expect(
      chat([{ role: 'user', content: 'hi' }], { maxOutputTokens: 10 })
    ).rejects.toMatchObject({
      code: ErrorCodes.INFERENCE_FAILED,
      platformCode: 'CHAT_FAILED',
    });
  });

  test('unavailable is permanent, so nothing here is worth retrying', async () => {
    const err = await summarizeText('x').catch((e) => e);
    expect(isTransient(err)).toBe(false);
  });

  test('a mid-download or quota-exhausted feature is worth retrying', () => {
    // Both raised as FEATURE_UNAVAILABLE with reason model-not-ready — exactly
    // the "ask again shortly" case, and the one isTransient used not to cover.
    const midDownload = new AIError({
      code: ErrorCodes.FEATURE_UNAVAILABLE,
      reason: 'model-not-ready',
      message: 'AICore is downloading the model for this feature.',
      platformCode: 'GENAI_MODEL_DOWNLOADING',
      platform: 'android',
      feature: 'summarize',
    });
    expect(isTransient(midDownload)).toBe(true);

    const quotaExceeded = new AIError({
      code: ErrorCodes.FEATURE_UNAVAILABLE,
      reason: 'model-not-ready',
      message: 'The per-app battery quota is exhausted.',
      platformCode: 'GENAI_QUOTA_EXCEEDED',
      platform: 'android',
      feature: 'summarize',
    });
    expect(isTransient(quotaExceeded)).toBe(true);
  });

  test('unavailable for a reason other than model-not-ready is not transient', () => {
    const hardwareIneligible = new AIError({
      code: ErrorCodes.FEATURE_UNAVAILABLE,
      reason: 'hardware-ineligible',
      message: 'This device does not support ML Kit GenAI.',
      platformCode: 'GENAI_AICORE_INCOMPATIBLE',
      platform: 'android',
      feature: 'summarize',
    });
    expect(isTransient(hardwareIneligible)).toBe(false);
  });

  test('the feature name survives into the error', async () => {
    const err = await translateText('hello', 'en', 'es').catch((e) => e);
    expect(err.feature).toBe('translateText');
  });

  test('smartReplies returns array', async () => {
    const replies = await smartReplies([{ text: 'how are you?', fromUser: false, timestampMs: 0 }]);
    expect(Array.isArray(replies)).toBe(true);
  });

  test('private mode toggles', () => {
    enablePrivateMode(true);
    expect(typeof isPrivateModeEnabled()).toBe('boolean');
  });
});

/**
 * The extractive fallback is deterministic and dependency-free, which is the
 * whole reason it can be tested here instead of only on a device.
 */

import { splitSentences, summarizeExtractive } from '../fallbacks/summarizeExtractive';

const ARTICLE = [
  'The city council approved the new transit plan on Tuesday.',
  'The plan adds twelve bus routes and extends two rail lines.',
  'It rained.',
  'Council members said the transit plan would cut commute times across the city.',
  'Funding for the transit plan comes from a bond measure approved last year.',
].join(' ');

describe('summarizeExtractive', () => {
  test('splits sentences on terminal punctuation', () => {
    expect(splitSentences('One. Two! Three?')).toEqual(['One.', 'Two!', 'Three?']);
    expect(splitSentences('  ')).toEqual([]);
  });

  test('returns only sentences that appeared in the source', () => {
    const { text } = summarizeExtractive(ARTICLE);
    const source = splitSentences(ARTICLE);
    for (const sentence of splitSentences(text)) {
      // The property that makes this safe to ship: it selects, never composes,
      // so it cannot state something the source did not.
      expect(source).toContain(sentence);
    }
  });

  test('keeps the source ordering so the result reads as prose', () => {
    const { text } = summarizeExtractive(ARTICLE);
    const source = splitSentences(ARTICLE);
    const positions = splitSentences(text).map((s) => source.indexOf(s));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test('prefers topical sentences over incidental ones', () => {
    const { text } = summarizeExtractive(ARTICLE);
    // "It rained." shares no vocabulary with the rest of the document.
    expect(text).not.toContain('It rained');
    expect(text).toContain('transit plan');
  });

  test('is deterministic', () => {
    const a = summarizeExtractive(ARTICLE);
    const b = summarizeExtractive(ARTICLE);
    expect(a.text).toBe(b.text);
  });

  test('always reports itself as degraded', () => {
    const result = summarizeExtractive(ARTICLE);
    expect(result.degraded).toBe(true);
    expect(result.tier).toBe('local-deterministic');
  });

  test('headline format returns a single sentence', () => {
    const { text, kept } = summarizeExtractive(ARTICLE, { format: 'headline' });
    expect(kept).toBe(1);
    expect(splitSentences(text)).toHaveLength(1);
  });

  test('input shorter than the target is returned unchanged, not padded', () => {
    const short = 'Only one sentence here.';
    const { text, kept, total } = summarizeExtractive(short, { sentences: 3 });
    expect(text).toBe(short);
    expect(kept).toBe(1);
    expect(total).toBe(1);
  });

  test('handles empty input without throwing', () => {
    const { text, total } = summarizeExtractive('');
    expect(text).toBe('');
    expect(total).toBe(0);
  });
});

/**
 * Tier routing. The mock's summarizeText rejects the way a non-AICore Android
 * device does, so these exercise the real fallback decision.
 */
describe('summarize() tier routing', () => {
  const nativeReject = (code: string) => Object.assign(new Error(code), { code });

  beforeEach(() => {
    jest.resetModules();
  });

  function load(summarizeImpl: () => Promise<string>) {
    jest.doMock('../specs/NativeAIToolkitSpec', () => ({
      __esModule: true,
      default: { summarizeText: jest.fn(summarizeImpl) },
    }));
    return require('../summarize') as typeof import('../summarize');
  }

  test('uses the platform model when it works, and says so', async () => {
    const { summarize } = load(async () => 'a real summary');
    const result = await summarize(ARTICLE, { tiers: ['on-device', 'local-deterministic'] });
    expect(result.value).toBe('a real summary');
    expect(result.tier).toBe('on-device');
    expect(result.degraded).toBe(false);
  });

  test('falls back when the device cannot do it, and records why', async () => {
    const { summarize } = load(async () => {
      throw nativeReject('FEATURE_UNAVAILABLE');
    });
    const result = await summarize(ARTICLE, { tiers: ['on-device', 'local-deterministic'] });

    expect(result.tier).toBe('local-deterministic');
    expect(result.degraded).toBe(true);
    // The trace is the point: a developer can see the on-device attempt
    // happened and failed, rather than guessing why output looks different.
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts[0]).toMatchObject({ tier: 'on-device', ok: false });
    expect(result.attempts[0].error).toContain('FEATURE_UNAVAILABLE');
  });

  test('a genuine inference failure is raised, not hidden behind worse output', async () => {
    const { summarize } = load(async () => {
      throw nativeReject('SUMMARIZE_INFERENCE_ERROR');
    });
    await expect(
      summarize(ARTICLE, { tiers: ['on-device', 'local-deterministic'] })
    ).rejects.toMatchObject({ code: 'INFERENCE_FAILED' });
  });

  test('with no fallback tier configured, unavailable stays unavailable', async () => {
    const { summarize } = load(async () => {
      throw nativeReject('FEATURE_UNAVAILABLE');
    });
    await expect(summarize(ARTICLE, { tiers: ['on-device'] })).rejects.toMatchObject({
      code: 'FEATURE_UNAVAILABLE',
      platformCode: 'NO_TIER_AVAILABLE',
    });
  });
});

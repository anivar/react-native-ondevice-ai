/**
 * `summarize()` — the tiered entry point.
 *
 * Deliberately a different name from `summarizeText()`. That one is, and stays,
 * the platform model or nothing: a caller who wrote it in v2.0 gets exactly
 * what they got then, forever. Acquiring fallback behaviour requires typing a
 * different function name, which no upgrade can do on your behalf. It is the
 * cheapest control available and it costs a single identifier.
 *
 * Every result says where it came from. A summary is the kind of output whose
 * provenance a user may later be asked about, and `{ value }` alone cannot
 * answer it.
 */

import { AIError, ErrorCodes, isAIError } from './errors';
import { type ExtractiveOptions, summarizeExtractive } from './fallbacks/summarizeExtractive';
import { type SummaryFormat, summarizeText } from './index';
import { resolveTiers, type Tier } from './policy';

export interface SummarizeOptions extends ExtractiveOptions {
  format?: SummaryFormat;
  /** Overrides the configured policy for this call only. */
  tiers?: Tier[];
}

export interface Attempt {
  tier: Tier;
  ok: boolean;
  /** Why this tier was skipped or failed. Absent when it succeeded. */
  error?: string;
}

export interface SummarizeResult {
  value: string;
  /** Which tier produced `value`. */
  tier: Tier;
  /** True when this is the extractive fallback, not a language model. */
  degraded: boolean;
  /**
   * Every tier tried, in order, with why each failed.
   *
   * This is what lets a developer answer a question about a specific result
   * later: not "it used the fallback" but "the platform model was unavailable
   * because X, so the fallback ran".
   */
  attempts: Attempt[];
}

export async function summarize(
  text: string,
  options: SummarizeOptions = {}
): Promise<SummarizeResult> {
  const tiers = resolveTiers(options.tiers);
  const attempts: Attempt[] = [];

  for (const tier of tiers) {
    if (tier === 'on-device') {
      try {
        const value = await summarizeText(text, options.format ?? 'bullets');
        attempts.push({ tier, ok: true });
        return { value, tier, degraded: false, attempts };
      } catch (e) {
        // Only fall through when the platform genuinely cannot do it. An
        // inference failure on a capable device is a real error and hiding it
        // behind a worse result would make it undebuggable.
        const fatal = isAIError(e) && e.code === ErrorCodes.INFERENCE_FAILED;
        attempts.push({
          tier,
          ok: false,
          error: isAIError(e) ? `${e.code} (${e.platformCode})` : String(e),
        });
        if (fatal) throw e;
      }
      continue;
    }

    if (tier === 'local-deterministic') {
      const result = summarizeExtractive(text, options);
      attempts.push({ tier, ok: true });
      return { value: result.text, tier, degraded: true, attempts };
    }
  }

  throw new AIError({
    code: ErrorCodes.FEATURE_UNAVAILABLE,
    reason: 'no-platform-api',
    message:
      `No configured tier could summarise on this device. Tried: ` +
      `${attempts.map((a) => `${a.tier} (${a.error ?? 'skipped'})`).join(', ')}.`,
    platformCode: 'NO_TIER_AVAILABLE',
    platform: 'js',
    feature: 'summarize',
  });
}

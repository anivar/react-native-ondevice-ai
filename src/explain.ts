/**
 * Answering "what will this call actually do on this device?" without doing it.
 *
 * This matters more here than it would in a cross-platform SDK that guarantees
 * parity, because this one deliberately does not: `embedText` is iOS-only,
 * `describeImage` / `smartReplies` / `translateText` are Android-only, and
 * `proofreadText` is a generative proofreader on Android but a spelling checker
 * on iOS. A developer testing on one platform has no way to discover the other
 * platform's answer short of owning the hardware. This gives it to them.
 *
 * It runs no inference and touches no network.
 */

import { getDeviceCapabilities } from './index';
import type { FeatureAvailability, FeatureName } from './specs/NativeAIToolkit';

export interface CallExplanation {
  feature: FeatureName;
  /** Would a call succeed right now? */
  willSucceed: boolean;
  availability: FeatureAvailability;
  /** One sentence a developer can act on. */
  summary: string;
  /** True when the situation can change without an app update. */
  mayChangeLater: boolean;
}

const PERMANENT: ReadonlySet<string> = new Set([
  'no-platform-api',
  'os-too-old',
  'hardware-ineligible',
]);

function describe(feature: FeatureName, a: FeatureAvailability): string {
  switch (a.state) {
    case 'available':
      return `${feature} works on this device now.`;
    case 'downloading':
      return `${feature} is downloading its model. Calls will succeed once it finishes.`;
    case 'downloadable':
      return (
        `${feature} needs a one-time model download, which happens on first ` +
        `call and needs a network connection. It works offline after that.`
      );
    default:
      return `${feature} will not work on this device: ${a.detail ?? a.reason ?? 'unknown reason'}`;
  }
}

/**
 * Explains one feature, or every feature when called with no argument.
 *
 * ```ts
 * const plan = await explainCall('summarize');
 * if (!plan.willSucceed) console.warn(plan.summary);
 * ```
 */
export async function explainCall(feature: FeatureName): Promise<CallExplanation>;
export async function explainCall(): Promise<CallExplanation[]>;
export async function explainCall(
  feature?: FeatureName
): Promise<CallExplanation | CallExplanation[]> {
  const caps = await getDeviceCapabilities();

  const explain = (name: FeatureName): CallExplanation => {
    const availability = caps.availability[name];
    return {
      feature: name,
      // Only `available` means the next call goes through. `downloadable` is
      // the case a boolean flag got wrong: it will work, but not yet, and not
      // without a network.
      willSucceed: availability.state === 'available',
      availability,
      summary: describe(name, availability),
      mayChangeLater:
        availability.state !== 'unavailable' || !PERMANENT.has(availability.reason ?? 'unknown'),
    };
  };

  if (feature) return explain(feature);
  return (Object.keys(caps.availability) as FeatureName[]).map(explain);
}

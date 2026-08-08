/**
 * Which tiers a call may use, resolved per platform.
 *
 * Precedence: per-call > platform block > global > built-in default.
 *
 * The defaults differ by platform on purpose. Non-AICore Android has no
 * on-device summariser at all, so a deterministic extractive fallback is
 * strictly better than a rejection. iOS below 26 is a different situation:
 * Apple ships a real summariser on eligible hardware, so an app running on
 * ineligible hardware is better told the truth than handed quietly worse
 * output it did not ask for.
 *
 * Note what is absent: there is no `cloud` tier. Nothing in this package sends
 * anything anywhere, and the type below is the enforcement, not the docs.
 */

import { Platform } from 'react-native';

/**
 * `on-device` is the platform's real model. `local-deterministic` is the
 * bundled extractive fallback — no weights, no network, and always flagged
 * `degraded`.
 */
export type Tier = 'on-device' | 'local-deterministic';

export interface TierPolicy {
  tiers?: Tier[];
  ios?: { tiers?: Tier[] };
  android?: { tiers?: Tier[] };
}

const DEFAULTS: Record<string, Tier[]> = {
  ios: ['on-device'],
  android: ['on-device', 'local-deterministic'],
};

let globalPolicy: TierPolicy = {};

/**
 * Sets the default tier policy for the app.
 *
 * ```ts
 * configure({ android: { tiers: ['on-device'] } })  // opt out of the fallback
 * ```
 */
export function configure(policy: TierPolicy): void {
  globalPolicy = policy;
}

/** Exposed for tests; resets to built-in defaults. */
export function resetPolicy(): void {
  globalPolicy = {};
}

export function resolveTiers(perCall?: Tier[]): Tier[] {
  if (perCall) return perCall;

  const platform = Platform.OS === 'android' ? 'android' : 'ios';
  const platformBlock = platform === 'android' ? globalPolicy.android : globalPolicy.ios;

  return platformBlock?.tiers ?? globalPolicy.tiers ?? DEFAULTS[platform] ?? ['on-device'];
}

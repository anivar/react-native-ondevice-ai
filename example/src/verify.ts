/**
 * Device verification runner.
 *
 * CI compiles every line of native code, which proves the API shapes are right
 * and nothing else. Whether a call actually reaches the platform and comes back
 * is only answerable on hardware, and the generative paths need hardware CI
 * runners do not have: an AICore Android, or an Apple-Intelligence iPhone.
 *
 * This runs every public method once, records what came back, and produces a
 * report that can be pasted into an issue. A rejection is not a failure —
 * `FEATURE_UNAVAILABLE` on a device without AICore is the correct answer, and
 * the report says so. What matters is that each call settles, with a typed
 * error rather than a crash or a hang.
 */

import {
  type AIError,
  analyzeImage,
  analyzeText,
  chat,
  describeImage,
  extractEntities,
  generateText,
  getDeviceCapabilities,
  identifyLanguage,
  isAIError,
  labelImage,
  proofreadText,
  rewriteText,
  scanBarcodes,
  segmentPerson,
  smartReplies,
  summarize,
  translateText,
} from 'react-native-ondevice-ai';

/**
 * A 2x2 opaque PNG. The vision calls need *an* image, not a meaningful one:
 * the question here is whether the call reaches the platform and returns, and
 * an empty result set answers that as well as a populated one would. Keeping it
 * inline avoids an asset pipeline in a file whose whole job is to be runnable.
 */
const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAF0lEQVQI12P8//8/AzbAxIAHjEqTJg0AVU8DIJRnHfoAAAAASUVORK5CYII=';

const ARTICLE = [
  'The city council approved the new transit plan on Tuesday evening.',
  'The plan adds twelve bus routes and extends two rail lines into the eastern suburbs.',
  'Council members said it would cut average commute times across the city.',
  'Funding comes from a bond measure voters approved last year.',
].join(' ');

export type CheckOutcome = 'resolved' | 'rejected' | 'threw';

/** Sections in the report. Generative is the tier that needs real hardware. */
export type CheckGroup = 'Text' | 'Vision' | 'Generative';

export interface CheckResult {
  name: string;
  group: CheckGroup;
  outcome: CheckOutcome;
  ms: number;
  /** Present when rejected: the typed code and reason a caller would branch on. */
  code?: string;
  reason?: string;
  /** A short, human-readable trace of what came back. */
  detail: string;
}

interface Check {
  name: string;
  group: CheckGroup;
  run: () => Promise<unknown>;
  /** Turns a resolved value into something worth reading in a report. */
  describe?: (value: never) => string;
}

const CHECKS: Check[] = [
  {
    name: 'getDeviceCapabilities',
    group: 'Text',
    run: () => getDeviceCapabilities(),
    describe: (c: never) => {
      const caps = c as unknown as Awaited<ReturnType<typeof getDeviceCapabilities>>;
      return `${caps.platform} ${caps.osVersion}, genAI=${caps.hasMLKitGenAI ?? caps.hasAppleIntelligence}`;
    },
  },
  {
    name: 'analyzeText',
    group: 'Text',
    run: () => analyzeText('I really like this app', { includeSentiment: true }),
    describe: (v: never) => JSON.stringify(v).slice(0, 120),
  },
  {
    name: 'extractEntities',
    group: 'Text',
    run: () => extractEntities('Call me on 555-0100 tomorrow'),
  },
  { name: 'identifyLanguage', group: 'Text', run: () => identifyLanguage('bonjour tout le monde') },
  { name: 'translateText', group: 'Text', run: () => translateText('good morning', 'en', 'es') },
  {
    name: 'smartReplies',
    group: 'Text',
    run: () =>
      smartReplies([
        { text: 'Are we still on for lunch?', fromUser: false, timestampMs: 1_700_000_000_000 },
      ]),
  },

  { name: 'analyzeImage', group: 'Vision', run: () => analyzeImage(TINY_PNG) },
  { name: 'scanBarcodes', group: 'Vision', run: () => scanBarcodes(TINY_PNG) },
  { name: 'labelImage', group: 'Vision', run: () => labelImage(TINY_PNG) },
  { name: 'segmentPerson', group: 'Vision', run: () => segmentPerson(TINY_PNG) },

  // The generative tier. On a device without AICore or Apple Intelligence every
  // one of these should reject with FEATURE_UNAVAILABLE and a permanent reason,
  // which is a pass for this harness.
  { name: 'summarize', group: 'Generative', run: () => summarize(ARTICLE) },
  {
    name: 'rewriteText',
    group: 'Generative',
    run: () => rewriteText('the meeting got moved again', 'professional'),
  },
  {
    name: 'proofreadText',
    group: 'Generative',
    run: () => proofreadText('their going to the store'),
  },
  { name: 'generateText', group: 'Generative', run: () => generateText('Name three colours.') },
  {
    name: 'chat',
    group: 'Generative',
    run: () => chat([{ role: 'user', content: 'Say hello in five words.' }]),
  },
  { name: 'describeImage', group: 'Generative', run: () => describeImage(TINY_PNG) },
];

function preview(value: unknown, describe?: Check['describe']): string {
  if (describe) {
    try {
      return describe(value as never);
    } catch {
      // fall through to the generic path
    }
  }
  if (typeof value === 'string') return value.slice(0, 120);
  try {
    return JSON.stringify(value).slice(0, 120);
  } catch {
    return String(value);
  }
}

async function runOne(check: Check): Promise<CheckResult> {
  const started = Date.now();
  try {
    const value = await check.run();
    return {
      name: check.name,
      group: check.group,
      outcome: 'resolved',
      ms: Date.now() - started,
      detail: preview(value, check.describe),
    };
  } catch (e) {
    const ms = Date.now() - started;
    if (isAIError(e)) {
      const err = e as AIError;
      return {
        name: check.name,
        group: check.group,
        outcome: 'rejected',
        ms,
        code: err.code,
        reason: err.reason,
        detail: err.message.slice(0, 160),
      };
    }
    // Not an AIError: something escaped the taxonomy, which is the interesting
    // failure — every native rejection is supposed to arrive typed.
    return {
      name: check.name,
      group: check.group,
      outcome: 'threw',
      ms,
      detail: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    };
  }
}

/** Runs every check in order, reporting progress as each settles. */
export async function runVerification(
  onProgress?: (done: CheckResult[], total: number) => void
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  for (const check of CHECKS) {
    results.push(await runOne(check));
    onProgress?.([...results], CHECKS.length);
  }
  return results;
}

/** Counts for the summary bar. */
export function tally(results: CheckResult[]) {
  return {
    ok: results.filter((r) => r.outcome === 'resolved').length,
    rejected: results.filter((r) => r.outcome === 'rejected').length,
    untyped: results.filter((r) => r.outcome === 'threw').length,
  };
}

/** A plain-text report, sized to paste into an issue. */
export function formatReport(results: CheckResult[]): string {
  const lines = results.map((r) => {
    const head = `${r.outcome === 'resolved' ? 'ok  ' : r.outcome === 'rejected' ? 'rej ' : 'THREW'} ${r.name} (${r.ms}ms)`;
    const code = r.code ? ` [${r.code}${r.reason ? `/${r.reason}` : ''}]` : '';
    return `${head}${code}\n    ${r.detail}`;
  });

  const threw = results.filter((r) => r.outcome === 'threw').length;
  const summary =
    threw > 0
      ? `${threw} call(s) failed outside the error taxonomy — that is a defect.`
      : 'Every call settled, and every failure was typed.';

  return [`react-native-ondevice-ai device report`, '', ...lines, '', summary].join('\n');
}

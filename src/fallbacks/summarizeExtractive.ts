/**
 * A summariser for devices that have no summariser.
 *
 * Extractive, not generative: it selects sentences already in the input and
 * never writes new text. That is the property that makes it safe to ship as a
 * fallback — it cannot hallucinate, because it cannot compose. Every sentence
 * it returns appeared verbatim in the source.
 *
 * It exists because non-AICore Android has no on-device summariser at all, and
 * "this feature does not work on your phone" is a poor answer when a usable
 * one costs 100 lines and no bytes. It is deliberately NOT enabled on iOS
 * below 26: Apple ships a real generative summariser on eligible hardware, and
 * an app on ineligible hardware is better served by an honest rejection than
 * by a silently worse result. See policy.ts.
 *
 * No weights, no dependencies, no network, and deterministic — the same input
 * gives the same output on every device, which is why it can be tested here
 * rather than only on hardware.
 *
 * The scoring is a stripped-down TextRank: rank sentences by how much their
 * vocabulary overlaps with the rest of the document, prefer earlier ones on a
 * tie, then emit them in their original order so the result still reads as
 * prose. Results always carry `degraded: true`; a caller must be able to tell
 * this from a real model's output.
 */

/** Words carrying no topical signal; scoring them rewards long sentences. */
const STOPWORDS = new Set(
  `a an and are as at be but by for from has have he her his i in is it its of on or
   she that the their there they this to was were which who will with you your not
   do does did can could would should may might must if then than them us our we`.split(/\s+/)
);

const MIN_WORDS = 4;

export interface ExtractiveOptions {
  /** How many sentences to keep. Ignored when `format` is given. */
  sentences?: number;
  format?: 'one-bullet' | 'bullets' | 'headline';
}

export interface ExtractiveSummary {
  text: string;
  /** Always true. This is not a language model's output. */
  degraded: true;
  /** How the text was produced, so provenance survives into the caller. */
  tier: 'local-deterministic';
  /** Sentences kept, of sentences found. */
  kept: number;
  total: number;
}

/**
 * Splits on sentence-ending punctuation followed by whitespace.
 *
 * Abbreviations ("Dr. Smith", "e.g.") will over-split. That costs a slightly
 * short sentence in the output, never a wrong one, so it is not worth a
 * dictionary of exceptions here.
 */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function contentWords(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function sentenceCountFor(format: ExtractiveOptions['format'], total: number): number {
  switch (format) {
    case 'headline':
      return 1;
    case 'one-bullet':
      return 1;
    default:
      // Three is what ML Kit's THREE_BULLETS emits, so the two paths produce
      // comparably sized output.
      return Math.min(3, total);
  }
}

export function summarizeExtractive(
  text: string,
  options: ExtractiveOptions = {}
): ExtractiveSummary {
  const sentences = splitSentences(text);
  const want = options.sentences ?? sentenceCountFor(options.format, sentences.length);

  if (sentences.length <= want) {
    // Nothing to cut. Returning the input unchanged is the honest answer;
    // padding it to look like work would be the dishonest one.
    return {
      text: sentences.join(' '),
      degraded: true,
      tier: 'local-deterministic',
      kept: sentences.length,
      total: sentences.length,
    };
  }

  // Document frequency: how many sentences each word appears in.
  const df = new Map<string, number>();
  const perSentence = sentences.map((s) => {
    const words = new Set(contentWords(s));
    for (const w of words) df.set(w, (df.get(w) ?? 0) + 1);
    return words;
  });

  const scored = perSentence.map((words, index) => {
    const longEnough = words.size >= MIN_WORDS;
    let score = 0;
    for (const w of words) {
      // A word shared with other sentences is topical. One that appears
      // everywhere is not discriminating, hence the -1 and the normalisation.
      score += (df.get(w) ?? 1) - 1;
    }
    // Normalise by length so a rambling sentence does not win on volume alone.
    score = words.size > 0 ? score / words.size : 0;
    // A very short fragment is rarely a good summary sentence.
    if (!longEnough) score *= 0.5;
    return { index, score };
  });

  const chosen = scored
    .slice()
    // Descending score; earlier sentence wins a tie, which keeps the output
    // deterministic and biases towards the lead, where summaries usually live.
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, want)
    .map((s) => s.index)
    .sort((a, b) => a - b);

  return {
    text: chosen.map((i) => sentences[i]).join(' '),
    degraded: true,
    tier: 'local-deterministic',
    kept: chosen.length,
    total: sentences.length,
  };
}

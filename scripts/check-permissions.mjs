#!/usr/bin/env node
/**
 * Fails if the library's Android manifest declares a permission that is not on
 * the allowlist.
 *
 * A library's manifest merges into every app that installs it, and the result
 * appears in that app's Play listing. A permission added here is a permission
 * every consuming app is seen to request, whether or not it uses the feature.
 * CAMERA and RECORD_AUDIO sat in this manifest for five releases without a
 * single call site needing them.
 *
 * Same shape and same reason as check-no-network.mjs: a claim about what this
 * package does to a user's app should be a gate, not a sentence in a README.
 */

import { readFileSync } from 'node:fs';

const MANIFEST = new URL(
  '../android/src/main/AndroidManifest.xml',
  import.meta.url
);

/**
 * Each entry must name the feature that needs it. If nothing here needs a
 * permission any more, it comes out of both files.
 */
const ALLOWED = new Map([
  ['android.permission.INTERNET', 'ML Kit model download for translateText and extractEntities'],
]);

const xml = readFileSync(MANIFEST, 'utf8');

// Ignore commented-out blocks; the manifest explains removed permissions by
// name and those mentions must not count as declarations.
const withoutComments = xml.replace(/<!--[\s\S]*?-->/g, '');

const declared = [...withoutComments.matchAll(/uses-permission[^>]*android:name="([^"]+)"/g)].map(
  (m) => m[1]
);

const unexpected = declared.filter((p) => !ALLOWED.has(p));

if (unexpected.length > 0) {
  console.error('check-permissions: the library manifest declares permissions not on the allowlist:\n');
  for (const p of unexpected) console.error(`  ${p}`);
  console.error(
    `\nThese merge into every app that installs this package and appear in its\n` +
      `store listing. If one is genuinely needed, add it to ALLOWED in\n` +
      `scripts/check-permissions.mjs with the feature that requires it.`
  );
  process.exit(1);
}

console.log(
  `check-permissions: ${declared.length} permission(s), all justified.` +
    declared.map((p) => `\n  ${p} — ${ALLOWED.get(p)}`).join('')
);

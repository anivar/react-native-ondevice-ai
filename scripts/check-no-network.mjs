#!/usr/bin/env node
/**
 * Fails if the native sources can reach the network.
 *
 * "Nothing leaves the device" is the central claim this package makes, and
 * until now it was an assertion in a README. This makes it checkable: any
 * networking symbol appearing in the Kotlin, ObjC++ or Swift fails the build.
 *
 * If networking is ever needed, it goes in one designated file listed in
 * ALLOWED and everything else stays clean. That way a network call cannot be
 * introduced quietly at an inference site — it has to be moved into a file
 * whose diff everyone is watching.
 *
 * This checks source text, not behaviour: a dependency could still make
 * requests. It is a floor, not a proof, and it is the cheapest floor available.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SEARCH_DIRS = ['android/src', 'ios'];
const SOURCE_EXT = /\.(kt|java|m|mm|h|swift)$/;

/** Files permitted to contain networking. Empty until a cloud tier exists. */
const ALLOWED = new Set([]);

const FORBIDDEN = [
  // Apple
  [/\bURLSession\b/, 'URLSession'],
  [/\bNSURLConnection\b/, 'NSURLConnection'],
  [/\bNSURLRequest\b/, 'NSURLRequest'],
  [/\bCFNetwork\b/, 'CFNetwork'],
  [/\bNWConnection\b/, 'NWConnection'],
  // Android / JVM
  [/\bHttpURLConnection\b/, 'HttpURLConnection'],
  [/\bokhttp3?\b/i, 'OkHttp'],
  [/\bRetrofit\b/, 'Retrofit'],
  [/\bVolley\b/, 'Volley'],
  [/\bjava\.net\.Socket\b/, 'java.net.Socket'],
  [/\bWebView\b/, 'WebView'],
];

function* sources(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* sources(path);
    else if (SOURCE_EXT.test(name)) yield path;
  }
}

const violations = [];
let scanned = 0;

for (const dir of SEARCH_DIRS) {
  for (const path of sources(join(ROOT, dir))) {
    const rel = relative(ROOT, path);
    if (ALLOWED.has(rel)) continue;
    scanned++;
    const lines = readFileSync(path, 'utf8').split('\n');
    lines.forEach((line, i) => {
      // Skip comments: this file's own prose names these symbols, and so does
      // a comment explaining why one is not used.
      const code = line.trim();
      if (code.startsWith('//') || code.startsWith('*') || code.startsWith('/*')) return;
      for (const [pattern, label] of FORBIDDEN) {
        if (pattern.test(line)) violations.push(`${rel}:${i + 1}  ${label}  ${code}`);
      }
    });
  }
}

// A scan that found no files would pass silently, which is the failure mode
// this kind of check actually has.
if (scanned === 0) {
  console.error('check-no-network: found no native sources to scan. Wrong paths?');
  process.exit(1);
}

if (violations.length > 0) {
  console.error(`check-no-network: networking found in native sources:\n`);
  for (const v of violations) console.error(`  ${v}`);
  console.error(
    `\nThis package claims nothing leaves the device. If a network path is\n` +
      `intended, put it in a dedicated transport file and add that file to\n` +
      `ALLOWED in scripts/check-no-network.mjs, so the change is visible.`
  );
  process.exit(1);
}

console.log(`check-no-network: ${scanned} native sources clean.`);

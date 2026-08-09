#!/usr/bin/env node
/**
 * Fails if the ObjC++ implementation does not export exactly the selectors the
 * generated TurboModule protocol declares.
 *
 * This is not pedantry. A method spelled `resolver:`/`rejecter:` where codegen
 * declares `resolve:`/`reject:` is a method the JSI layer never calls, and
 * clang reports it as "does not conform to protocol" — a warning, which builds
 * happily ignore.
 *
 * Selector equality is the property that matters — ObjC dispatch is by selector
 * — so that is what this checks, ignoring parameter types. Codegen must have run
 * first; CI generates the artifacts into a temp directory before calling this.
 *
 * Usage: check-ios-conformance.mjs <path-to-generated-spec-header>
 */

import { readFileSync } from 'node:fs';

const headerPath = process.argv[2];
if (!headerPath) {
  console.error('usage: check-ios-conformance.mjs <AIToolkitTurboModuleSpec.h>');
  process.exit(1);
}

const IMPL = new URL('../ios/AIToolkitTurboModule.mm', import.meta.url);

/**
 * Selector from an ObjC method declaration or RCT_EXPORT_METHOD body.
 * Parenthesised types are blanked first so a C++ scope operator
 * (`JS::NativeAIToolkit::Foo &`) cannot be mistaken for selector labels.
 */
function selectorOf(decl) {
  const withoutTypes = decl.replace(/\([^()]*(?:\([^()]*\)[^()]*)*\)/g, '()');
  const labels = [...withoutTypes.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)].map((m) => m[1]);
  return labels.length > 0 ? `${labels.join(':')}:` : withoutTypes.trim();
}

const header = readFileSync(headerPath, 'utf8');
const start = header.indexOf('@protocol NativeAIToolkitSpec');
if (start === -1) {
  console.error(`check-ios-conformance: no NativeAIToolkitSpec protocol in ${headerPath}.`);
  console.error('Did codegen run, and is the spec file still src/specs/NativeAIToolkit.ts?');
  process.exit(1);
}
const protocol = header.slice(start, header.indexOf('@end', start));
const required = new Set(
  [...protocol.matchAll(/-\s*\([^)]*\)((?:[^;]|\n)*?);/g)].map((m) => selectorOf(m[1]))
);

const impl = readFileSync(IMPL, 'utf8');
const implemented = new Set();
for (const m of impl.matchAll(/RCT_EXPORT(?:_BLOCKING_SYNCHRONOUS)?_METHOD\(/g)) {
  let depth = 1;
  let j = m.index + m[0].length;
  const from = j;
  while (depth > 0 && j < impl.length) {
    if (impl[j] === '(') depth++;
    else if (impl[j] === ')') depth--;
    j++;
  }
  implemented.add(selectorOf(impl.slice(from, j - 1)));
}

if (required.size === 0 || implemented.size === 0) {
  console.error('check-ios-conformance: parsed nothing. Refusing to pass vacuously.');
  process.exit(1);
}

const missing = [...required].filter((s) => !implemented.has(s)).sort();
const extra = [...implemented].filter((s) => !required.has(s)).sort();

if (missing.length > 0 || extra.length > 0) {
  console.error('check-ios-conformance: the implementation does not match the generated protocol.\n');
  if (missing.length) {
    console.error('  Declared by codegen, not implemented — these would fail to dispatch:');
    for (const s of missing) console.error(`    ${s}`);
  }
  if (extra.length) {
    console.error('\n  Implemented, not declared — these are unreachable from JS:');
    for (const s of extra) console.error(`    ${s}`);
  }
  process.exit(1);
}

console.log(`check-ios-conformance: all ${required.size} selectors match the generated protocol.`);

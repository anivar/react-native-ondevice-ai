#!/usr/bin/env node
/**
 * The podspec has to agree with three other things, and each disagreement fails
 * somewhere expensive: minutes into a macOS job, or not until a user runs
 * `pod install`.
 *
 *   1. `s.name` must equal the filename — CocoaPods resolves the pod by file,
 *      so a mismatch is "No podspec found for <name>".
 *   2. `files` must list it, or the published tarball ships without a podspec
 *      and iOS autolinking finds nothing to link.
 *   3. An ObjC source must include the Swift interop header, whose name is
 *      derived from the module name, or the Swift half compiles out silently.
 *
 * All of it is string comparison. None of it needs a Mac.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const problems = [];

const podspecs = readdirSync(root).filter((f) => f.endsWith('.podspec'));

if (podspecs.length === 0) {
  problems.push('No .podspec at the package root. iOS autolinking has nothing to find.');
} else if (podspecs.length > 1) {
  problems.push(`More than one .podspec at the root: ${podspecs.join(', ')}.`);
}

if (podspecs.length === 1) {
  const [file] = podspecs;
  const stem = file.replace(/\.podspec$/, '');
  const source = readFileSync(join(root, file), 'utf8');

  const declared = source.match(/s\.name\s*=\s*["']([^"']+)["']/)?.[1];
  if (!declared) {
    problems.push(`${file} does not declare s.name.`);
  } else if (declared !== stem) {
    problems.push(
      `${file} declares s.name = "${declared}". CocoaPods resolves the pod by ` +
        `filename, so it must be "${stem}" or pod install fails with ` +
        `"No podspec found for ${declared}".`
    );
  }

  if (!pkg.files?.includes(file)) {
    problems.push(
      `package.json "files" does not list ${file}, so the published tarball ` +
        `would ship without a podspec and iOS would silently not link.`
    );
  }

  // Same class of omission on the other platform: react-native.config.js is
  // how autolinking is told where the Android sources are and which
  // ReactPackage to construct. Leaving it out of the tarball is invisible
  // locally, where the file is present, and breaks every consumer.
  if (existsSync(join(root, 'react-native.config.js')) &&
      !pkg.files?.includes('react-native.config.js')) {
    problems.push(
      'react-native.config.js exists but package.json "files" does not list ' +
        'it, so Android autolinking would have nothing to read.'
    );
  }

  // CocoaPods builds the Swift interop header from the module name: s.name
  // with every non-alphanumeric character replaced by an underscore.
  const expectedHeader = `${stem.replace(/[^A-Za-z0-9]/g, '_')}-Swift.h`;
  const swiftSources = readdirSync(join(root, 'ios')).filter((f) => f.endsWith('.swift'));
  if (swiftSources.length > 0) {
    const objcSources = readdirSync(join(root, 'ios')).filter(
      (f) => f.endsWith('.mm') || f.endsWith('.m')
    );
    const importsHeader = objcSources.some((f) =>
      readFileSync(join(root, 'ios', f), 'utf8').includes(expectedHeader)
    );
    if (!importsHeader) {
      problems.push(
        `ios/ has Swift sources but no ObjC source includes ${expectedHeader}. ` +
          `The bridge would compile out silently — __has_include just fails.`
      );
    }
  }
}

if (problems.length > 0) {
  console.error('check-podspec: podspec and manifest disagree:\n');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`check-podspec: ${podspecs[0]} consistent with package.json and ios/.`);

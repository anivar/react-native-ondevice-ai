#!/usr/bin/env node
/**
 * Release gates, run from the publish workflow with the tag in argv[2].
 *
 * The one that matters: the tag and package.json version must agree. Today
 * `git tag v2.1.0` on a tree reading 2.1.0-rc.5 would publish an RC to the
 * `latest` dist-tag, where every `npm install` picks it up. A prerelease must
 * also carry a prerelease tag, for the same reason.
 */

import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const tag = (process.argv[2] ?? '').replace(/^refs\/tags\//, '').replace(/^v/, '');

const problems = [];

if (!tag) {
  problems.push('No tag given. Usage: check-release.mjs <tag>');
} else if (tag !== pkg.version) {
  problems.push(`Tag ${tag} does not match package.json version ${pkg.version}.`);
}

const isPrerelease = /-(?:rc|beta|alpha|next)\./.test(pkg.version);
const distTag = process.env.NPM_DIST_TAG ?? 'latest';

if (isPrerelease && distTag === 'latest') {
  problems.push(
    `${pkg.version} is a prerelease but would publish to the "latest" dist-tag, ` +
      `where a plain \`npm install\` would pick it up. Set NPM_DIST_TAG=next.`
  );
}
if (!isPrerelease && distTag !== 'latest') {
  problems.push(`${pkg.version} is a release but would publish to "${distTag}".`);
}

if (pkg.files?.length) {
  // A `files` entry that does not exist ships nothing and misleads every reader
  // of the manifest.
  const { existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const root = new URL('..', import.meta.url).pathname;
  for (const entry of pkg.files) {
    // `!pattern` entries exclude rather than include, so there is nothing to
    // check for existence — and a missing one is the desired state.
    if (entry.startsWith('!')) continue;
    if (!existsSync(join(root, entry.replace(/\/$/, '')))) {
      problems.push(`package.json "files" lists ${entry}, which does not exist.`);
    }
  }
}

if (problems.length > 0) {
  console.error('check-release: refusing to publish:\n');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`check-release: ${pkg.version} → dist-tag "${distTag}". OK.`);

# Contributing

Contributions are welcome. This document is short and specific, because the
useful thing to know about this repository is what its gates check and why.

## Setup

```bash
git clone https://github.com/openslm-ai/mobile-ai-toolkit
cd mobile-ai-toolkit
npm install
npm test
```

That is enough for anything in `src/`. Native work needs more: a JDK 17 and the
Android SDK for Kotlin, and a Mac with Xcode 16.1+ for Swift and ObjC++. You do
not need either to open a pull request — CI compiles both on every PR.

## What CI checks, and why each one exists

Every gate here was added because something got through without it. If a check
seems paranoid, that is why.

| Gate | Guards against |
|---|---|
| `npm test` | The mock is typed `Spec`, so a change to the native interface fails the suite instead of surfacing on a device. |
| `errorMap.test.ts` | Greps the native sources; fails if a `reject()` code exists there and not in the map. Kotlin and Swift are not typechecked together, so nothing else notices. |
| `check-no-network.mjs` | Fails on any networking symbol in native sources. "Nothing leaves the device" is the central claim; this makes it a gate rather than a sentence. |
| `check-permissions.mjs` | A library's manifest merges into every consuming app. `CAMERA` and `RECORD_AUDIO` sat here for five releases with no call site needing them. |
| `check-ios-conformance.mjs` | Compares ObjC++ selectors to the generated TurboModule protocol. Eighteen of twenty methods once used `resolver:`/`rejecter:` where codegen declares `resolve:`/`reject:`, so they were unreachable from JS — and clang reported it only as a warning. |
| Android assemble | Compiles the Kotlin, and **asserts the library was linked**: an earlier green run built the host app while compiling none of this package. |
| iOS build | Compiles ObjC++ and Swift against the iOS 26 SDK, and asserts the SDK really is 26+ — `#if canImport(FoundationModels)` compiles to an empty branch otherwise, so a green build would prove nothing. |
| Expo prebuild | Asserts the config plugin actually set `minSdkVersion` 26, iOS 17, and the speech usage string. A plugin that silently no-ops looks identical to one that works. |

Run the fast ones locally:

```bash
npm run lint && npm run typecheck && npm test
node scripts/check-no-network.mjs
node scripts/check-permissions.mjs
```

## Working on native code

**Do not rename native reject codes.** They are mapped to a public taxonomy in
`src/errorMap.ts` instead. Renaming uncompiled code is how a regression ships
quietly; mapping in TypeScript is reversible and tested.

**Add a new `reject()` code to the map in the same commit.** The drift test will
tell you, but it is easier to do it while you remember what the code means.

**Check availability honestly.** If a feature cannot work on a device, say why
with a real `UnavailableReason`, and prefer the platform's own signal
(`checkFeatureStatus()`, `SystemLanguageModel.availability`) over inference from
which classes happen to be linked. That distinction is the reason this package
exists.

## Pull requests

Branch, commit, open a PR. Commit messages should say what was wrong and why the
change is right — a reader six months later needs the reasoning, not a
restatement of the diff.

Issues are welcome, especially device reports. If you own Apple-Intelligence
hardware or a Pixel 9+ / Galaxy S25+, see the "Contributors needed" section of
the [README](./README.md) — a single report on real hardware is worth more than
most code changes right now.

## Principles

This package is built to the [Open Small Models
Accord](https://openslm.ai/accord). Two clauses come up in review often enough
to state here:

- **Inference stays local.** There is no cloud tier, and a PR adding one would
  need to change the package description, the README, and the network gate in
  the same commit — deliberately, not incidentally.
- **Say what a thing is.** Apple Foundation Models and Gemini Nano are closed
  runtimes on proprietary hardware. Wrapping them is useful and this package
  does it, but the documentation does not call that "open".

## License

MIT. By contributing you agree your contributions are licensed under it.

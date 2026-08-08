# Supply chain, provenance and citation

## Supply chain & provenance

- Zero runtime dependencies. `peerDependencies` are `react ≥19` and
  `react-native ≥0.86`; everything else is a devDependency and ships nothing.
- Published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements)
  — the badge on the npm page links to the exact GitHub Actions run that built
  and signed the tarball.
- Two claims about what this package does to *your* app are enforced in CI
  rather than asserted here: it declares exactly one Android permission, and its
  native sources contain no networking symbols at all. See
  [`scripts/`](./scripts) — both gates run again before publish.
- Every method's ObjC++ selector is checked against the generated TurboModule
  protocol on each pull request, and the Android job asserts the library was
  actually compiled rather than silently skipped.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) explains what each gate exists to catch.

## About OpenSLM

`mobile-ai-toolkit` is part of [OpenSLM](https://openslm.ai) — open small
language models and the runtimes that make them usable on the hardware people
actually own.

This package was briefly published under a personal scope. That package has
been removed; `mobile-ai-toolkit` is the only name.

## Citing this

Releases are archived with a DOI. `CITATION.cff` carries the metadata GitHub's
"Cite this repository" button reads, including the LWD-R disclosure, so a
citation records what layers the release actually meets rather than only its
name.


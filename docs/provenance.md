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

## Names this package has had

It was published briefly as `@anivar/mobile-ai-toolkit`, then as
`mobile-ai-toolkit`. Both are gone; `react-native-ondevice-ai` is the only
name, and the repository redirects from the old ones.

## Citing this

Releases are archived with a DOI. `CITATION.cff` carries the metadata GitHub's
"Cite this repository" button reads, including what the release does and does not ship, so a citation records that
rather than only its name.


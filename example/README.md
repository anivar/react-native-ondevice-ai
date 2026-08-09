# Mobile AI Toolkit — example

An Expo app that shows what `react-native-ondevice-ai` can actually do **on
your device**, which is the only question that matters for a package like this.

Most on-device AI demos show generation working on the one phone the author
owns. The interesting case is the other 95% of phones — no AICore, no Apple
Intelligence — so this app leads with availability: every feature's state, the
reason when it is unavailable, and whether that reason is permanent. Then it
summarises an article and reports which route produced the result and whether
it was degraded.

It is also the first consumer of this package's own Expo config plugin, so if
the plugin breaks, this app stops building. CI runs `expo prebuild` on every
pull request for exactly that reason.

## Run it

Needs a development build — the native module cannot exist in Expo Go. (It will
not crash there: importing the package is safe, and calls reject with
`MODULE_NOT_LINKED`.)

```bash
cd example
npm install
npm run ios        # or: npm run android
```

Those scripts run `expo run:*`, which prebuilds the native projects on first
use. To regenerate them from scratch:

```bash
npm run prebuild   # expo prebuild --clean
```

`ios/` and `android/` are deliberately not committed — the config plugin
generates them, which keeps ~30k lines of scaffolding out of the repository and
means the plugin is exercised rather than trusted.

## What you should see

On a device without a generative model, `summarize` falls back to the bundled
extractive summariser on Android and rejects honestly on iOS. Either way the
result carries its route and an `attempts` trace, so a fallback is never
mistaken for a model.

The library is consumed through `file:..`, so edits to `../src` show up here
after `npm run build` in the repository root.

---

[react-native-ondevice-ai](https://github.com/anivar/react-native-ondevice-ai)

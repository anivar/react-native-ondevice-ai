# Example app

A development build that answers one question: **what can the phone in your
hand actually do?**

It reads `availability` for every feature straight from ML Kit's
`checkFeatureStatus()` and Apple's `SystemLanguageModel.availability`, then
lets you run every method once and read what came back.

## Run it on an Android device

You need a device with USB debugging on, Java 17 and the Android SDK. Expo Go
will not work — this package has native code, so it needs a development build.

```bash
# from the repository root: build the library the example links to
npm install
npm run build

cd example
npm install
npx expo run:android --device
```

`expo run:android` prebuilds the native project and installs it. The config
plugin sets `minSdkVersion` 26 for you.

## Run it on an iPhone

```bash
cd example
npm install
npx expo run:ios --device
```

## What to look at

**"What this device can do"** — one row per feature with a state and, when
unavailable, a reason. The reason is the interesting part: `hardware-ineligible`
and `os-too-old` mean hide the feature forever, while `model-not-ready` and
`user-disabled` can change without your app being updated. AICore updates its
model through the system, not through your app, so this answer is a live one
rather than a device list someone typed out once.

**"Verify on this device"** — runs every public method and reports how each
one settled: resolved, rejected with a typed code, or — the case worth
reporting — failed outside the taxonomy.

A rejection is usually the correct answer. On a phone without AICore or Apple
Intelligence, the generative methods **should** reject with
`FEATURE_UNAVAILABLE` and a permanent reason. What would be a defect is a call
that hangs, crashes, or comes back as an untyped error.

## If you have generative hardware

A Pixel 9 or 10, a Galaxy S25, or an iPhone with Apple Intelligence on iOS 26
can exercise paths that no CI runner can reach. The generative rows in the
report from such a device are the most useful thing anyone can contribute to
this project right now — long-press the report, share it, and open an issue
with it.

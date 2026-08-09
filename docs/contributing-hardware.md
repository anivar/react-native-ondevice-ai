# Real-device verification

## Contributors needed (real-device verification)

One thing blocks a fully verified release, and it needs hardware rather than
effort. **If you own any of these on iOS 26 / iPadOS 26 or later, ten minutes
closes it:**

- iPhone 15 Pro / Pro Max, any iPhone 16 or 17
- an M-series iPad

with Apple Intelligence enabled in **Settings → Apple Intelligence & Siri**.
This package has no macOS build — the podspec targets iOS only, and the
native sources depend on UIKit throughout — so an Apple-silicon Mac cannot run
this without going through iPadOS app compatibility, which is untested here.

Apple Intelligence itself shipped in iOS 18.1; the `FoundationModels` framework
this package binds is iOS 26+, which is the floor that matters here. On an
eligible device below iOS 26, `explainCall('generate')` returns reason
`os-too-old` — that means the OS version, not a broken bridge.

```ts
import { getDeviceCapabilities, explainCall, generateText } from 'react-native-ondeviceai';

console.log((await getDeviceCapabilities()).availability.generate);
console.log(await explainCall('generate'));
console.log(await generateText('Write a one-line haiku about TurboModules.', { maxOutputTokens: 60 }));
```

Open an issue with the device model, the OS version, and that output — or the
full error if it threw. A failure is as useful as a success; if the bridge is
wrong I would rather know now than have it sit broken.

Also welcome: Swift reviewers for `ios/AIToolkitFoundationModels.swift`, and
bug reports from AICore device owners against the ML Kit GenAI beta. A Pixel 9
or 10 exercises both the feature APIs and the Prompt API; a Galaxy S25 is
useful for the opposite reason — it should support `summarize` and reject
`generate`, and confirming that split on real hardware is worth as much as a
report where everything works.


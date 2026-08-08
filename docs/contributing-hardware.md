# Real-device verification

## Contributors needed (real-device verification)

One thing blocks a fully verified release, and it needs hardware rather than
effort. **If you own any of these, ten minutes closes it:**

- iPhone 15 Pro / Pro Max, any iPhone 16 or 17
- an M-series iPad or Apple-silicon Mac on macOS 26+

with Apple Intelligence enabled in **Settings → Apple Intelligence & Siri**.

```ts
import { getDeviceCapabilities, explainCall, generateText } from 'mobile-ai-toolkit';

console.log((await getDeviceCapabilities()).availability.generate);
console.log(await explainCall('generate'));
console.log(await generateText('Write a one-line haiku about TurboModules.', { maxOutputTokens: 60 }));
```

Open an issue with the device model, the OS version, and that output — or the
full error if it threw. A failure is as useful as a success; if the bridge is
wrong I would rather know now than have it sit broken.

Also welcome: Swift reviewers for `ios/AIToolkitFoundationModels.swift`, and
bug reports from Pixel 9+ / Galaxy S25+ owners against the ML Kit GenAI beta.


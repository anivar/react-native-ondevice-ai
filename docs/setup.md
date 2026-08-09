# Setup

Platform setup for `react-native-ondevice-ai`.

### Bare React Native

This package targets iOS 17, above React Native's own floor of 15.1, so raise
the deployment target in `ios/Podfile` before `pod install`:

```ruby
platform :ios, '17.0'
```

Without it CocoaPods refuses to resolve, with "they required a higher minimum
deployment target". On Android, two values in `android/build.gradle`:

```gradle
ext {
    minSdkVersion = 26      // ML Kit GenAI's own minimum
    kotlinVersion = "2.3.21"
}
```

`minSdkVersion` below 26 fails the manifest merge — that is ML Kit GenAI's
declared minimum. `kotlinVersion` matters for a less obvious reason: the ML Kit
GenAI artifacts are compiled with Kotlin 2.3, and a Kotlin 2.1 compiler refuses
to read their metadata at all. React Native 0.86 still defaults to 2.1.20, so
without this you get a wall of *"Module was compiled with an incompatible
version of Kotlin. The binary version of its metadata is 2.3.0, expected
version is 2.1.0"* — one per artifact, and none of them mentioning this package.

Expo projects get all three automatically; see below.

### Expo

Expo SDK 55+ requires the New Architecture, which is what this package targets,
so a modern Expo app is a first-class host. Add the plugin:

```json
{ "expo": { "plugins": ["react-native-ondevice-ai"] } }
```

It sets the Android `minSdkVersion` to 26 and `kotlinVersion` to 2.3.21, the
iOS deployment target to 17, and the speech usage string — raising each only if
your project is lower, never overwriting a higher value or a description you
wrote yourself. Without it the
Android manifest merge fails, because Expo's default `minSdkVersion` is below
ML Kit GenAI's minimum.

You need a development build (`npx expo prebuild` or EAS). The native code
cannot exist in Expo Go — but importing the package there no longer crashes the
bundle, so a capability check degrades to a `MODULE_NOT_LINKED` rejection you
can catch instead of a white screen.

### Permissions

The library declares exactly one Android permission, `INTERNET`, and it is there
for two features: `translateText` and `extractEntities` download an ML Kit model
on first use. Both work offline afterwards, and `enablePrivateMode(true)` refuses
the download rather than performing it.

Nothing else is declared. A library's permissions merge into your app's manifest
and appear in your store listing, so this one is checked in CI against an
allowlist that names the feature requiring each entry.

On iOS, `transcribeAudioFile` needs `NSSpeechRecognitionUsageDescription` in your
Info.plist.


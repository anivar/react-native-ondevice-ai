/**
 * Expo config plugin.
 *
 * Without this, an Expo project fails at build time: the default Android
 * minSdkVersion is below the 26 that ML Kit GenAI declares, so the manifest
 * merge fails, and there is no way to set the iOS 17 deployment target or the
 * speech usage string from app config.
 *
 * Expo SDK 55 requires the New Architecture, which is what this package has
 * always targeted — so a modern Expo app is a supported first-class host, not
 * a workaround. It does need a development build: the native code here cannot
 * exist in Expo Go. Importing the package in Expo Go no longer crashes the
 * bundle (the registry lookup is nullable), so a capability check degrades to
 * MODULE_NOT_LINKED instead of a white screen.
 *
 * Usage in app.json:
 *
 *   { "expo": { "plugins": ["react-native-ondevice-ai"] } }
 *
 * or, to customise the permission prompt:
 *
 *   { "expo": { "plugins": [["react-native-ondevice-ai", {
 *       "speechRecognitionPermission": "Used to transcribe your voice notes on device."
 *   }]] } }
 */

/**
 * `expo/config-plugins` is the documented entry point, but it only resolves
 * when this file is loaded from inside an app that has expo installed. A
 * library linked with `file:` — which is how the example and CI consume it —
 * resolves from the library's own directory instead, where it is absent. Fall
 * back to `@expo/config-plugins`, the package that subpath re-exports.
 */
function loadConfigPlugins() {
  try {
    return require('expo/config-plugins');
  } catch {
    return require('@expo/config-plugins');
  }
}

const { createRunOncePlugin, withInfoPlist, withGradleProperties, withPodfileProperties } =
  loadConfigPlugins();

const pkg = require('./package.json');

/** ML Kit GenAI's own minimum. Below this the manifest merge fails. */
const MIN_SDK_VERSION = 26;

/** Where NLContextualEmbedding — all of embedText — becomes available. */
const IOS_DEPLOYMENT_TARGET = '17.0';

/**
 * The ML Kit GenAI artifacts are compiled with Kotlin 2.3, and Kotlin refuses
 * to read metadata newer than the compiler: React Native 0.86's default of
 * 2.1.20 fails with "Module was compiled with an incompatible version of
 * Kotlin" on every one of them. Raising the app's Kotlin is the only fix that
 * is not "wait for ML Kit to publish a 2.1 build".
 */
const MIN_KOTLIN_VERSION = '2.3.21';

const DEFAULT_SPEECH_PERMISSION =
  'Allow $(PRODUCT_NAME) to transcribe audio on this device. Nothing is sent to a server.';

/**
 * Raises a numeric gradle property, never lowers it. An app that already
 * targets a higher minSdk for its own reasons keeps it.
 */
function raiseGradleProperty(properties, key, minimum) {
  const existing = properties.find((p) => p.type === 'property' && p.key === key);
  if (!existing) {
    properties.push({ type: 'property', key, value: String(minimum) });
    return properties;
  }
  const current = Number.parseInt(existing.value, 10);
  if (Number.isNaN(current) || current < minimum) {
    existing.value = String(minimum);
  }
  return properties;
}

/**
 * The same, for a dotted version string. Compares numerically per segment, so
 * 2.10.0 beats 2.9.0 — which a string comparison gets backwards.
 */
function raiseVersionProperty(properties, key, minimum) {
  const parse = (v) =>
    String(v)
      .split('.')
      .map((n) => Number.parseInt(n, 10) || 0);
  const isLower = (a, b) => {
    const [x, y] = [parse(a), parse(b)];
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) < (y[i] ?? 0);
    }
    return false;
  };

  const existing = properties.find((p) => p.type === 'property' && p.key === key);
  if (!existing) {
    properties.push({ type: 'property', key, value: minimum });
    return properties;
  }
  if (isLower(existing.value, minimum)) {
    existing.value = minimum;
  }
  return properties;
}

const withOnDeviceAI = (config, options = {}) => {
  const speechPermission = options.speechRecognitionPermission ?? DEFAULT_SPEECH_PERMISSION;

  config = withGradleProperties(config, (cfg) => {
    cfg.modResults = raiseGradleProperty(cfg.modResults, 'android.minSdkVersion', MIN_SDK_VERSION);
    cfg.modResults = raiseVersionProperty(
      cfg.modResults,
      'android.kotlinVersion',
      MIN_KOTLIN_VERSION
    );
    return cfg;
  });

  config = withPodfileProperties(config, (cfg) => {
    const current = cfg.modResults['ios.deploymentTarget'];
    if (!current || Number.parseFloat(current) < Number.parseFloat(IOS_DEPLOYMENT_TARGET)) {
      cfg.modResults['ios.deploymentTarget'] = IOS_DEPLOYMENT_TARGET;
    }
    return cfg;
  });

  // iOS terminates the process on the first speech request if this key is
  // absent, so it is set unconditionally rather than only when transcription
  // is used — a crash on someone else's device is not a good way to learn the
  // key was needed.
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.NSSpeechRecognitionUsageDescription =
      cfg.modResults.NSSpeechRecognitionUsageDescription ?? speechPermission;
    return cfg;
  });

  return config;
};

module.exports = createRunOncePlugin(withOnDeviceAI, pkg.name, pkg.version);

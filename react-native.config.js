/**
 * Autolinking descriptor.
 *
 * `sourceDir` was `'../android'`, which resolves outside the package, so
 * autolinking never found the Android module. A host app built and ran without
 * it — no error, just a missing native module at runtime — and because CI had
 * never compiled the library either, nothing reported the gap.
 *
 * `packageInstance` is required as well: autolinking needs a ReactPackage to
 * construct, not the module class.
 *
 * iOS needs no entry here. The podspec at the package root is discovered
 * automatically; the previous `project: 'ios/AIToolkitTurboModule.xcodeproj'`
 * pointed at a file that has never existed in this repo.
 */
module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: 'android',
        packageImportPath: 'import com.anivar.ondeviceai.AIToolkitPackage;',
        packageInstance: 'new AIToolkitPackage()',
      },
      ios: {},
    },
  },
};

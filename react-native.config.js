/**
 * Autolinking descriptor.
 *
 * `sourceDir` is relative to this package, so it must be `'android'` — a path
 * that resolves outside the package leaves the module unlinked, with no error
 * and no native module at runtime.
 *
 * `packageInstance` is required as well: autolinking constructs a ReactPackage,
 * not the module class.
 *
 * iOS needs no entry. The podspec at the package root is discovered
 * automatically.
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

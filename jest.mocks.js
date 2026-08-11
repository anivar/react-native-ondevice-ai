// Mock React Native for the Node test environment.
module.exports = {
  Platform: {
    OS: 'ios',
    Version: '17.0',
    select: (obj) => obj.ios || obj.default,
  },
  NativeModules: {},
  // `get` returns null when the module is not linked, which is exactly the
  // situation under test (and under Expo Go, web, and the old architecture).
  // Tests that need a working module mock the spec module directly.
  TurboModuleRegistry: {
    get: () => null,
    getEnforcing: () => {
      throw new Error('TurboModuleRegistry.getEnforcing should not be used by this package');
    },
  },
};

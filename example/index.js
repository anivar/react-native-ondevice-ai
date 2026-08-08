import { registerRootComponent } from 'expo';

import App from './src/App';

// registerRootComponent, not AppRegistry.registerComponent: app.json is now in
// Expo's shape, so there is no top-level `name` to read. Expo derives the
// component name itself and sets up the dev client in a development build.
registerRootComponent(App);

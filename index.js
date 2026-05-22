// PLAN 005 V5: il polyfill deve essere la PRIMA riga assoluta del bundle,
// prima di qualsiasi import che possa toccare crypto.getRandomValues
// (incluso @noble/ciphers usato da src/lib/crypto.ts).
import 'react-native-get-random-values';

/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

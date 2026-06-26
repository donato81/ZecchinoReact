module.exports = {
  preset: 'react-native',
  setupFiles: [
    'react-native-get-random-values',
  ],
  moduleNameMapper: {
    '@react-native-async-storage/async-storage': require.resolve(
      '@react-native-async-storage/async-storage/jest/async-storage-mock'
    ),
    // PLAN 008 T8: mock globale di NetInfo. I test dedicati
    // (__tests__/use-network-status.spec.ts) lo sovrascrivono con un
    // jest.mock locale prefissato 'mock' per esporre triggerNetInfo.
    '^@react-native-community/netinfo$': require.resolve(
      '@react-native-community/netinfo/jest/netinfo-mock'
    ),
    '^expo-haptics$': '<rootDir>/__mocks__/expo-haptics.js',
  },
};
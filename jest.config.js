module.exports = {
  preset: 'react-native',
  setupFiles: [
    'react-native-get-random-values',
  ],
  moduleNameMapper: {
    '@react-native-async-storage/async-storage': require.resolve(
      '@react-native-async-storage/async-storage/jest/async-storage-mock'
    ),
  },
};
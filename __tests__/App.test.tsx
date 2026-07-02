/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: jest.fn().mockReturnValue({ top: 20, bottom: 20, left: 0, right: 0 }),
}));

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import App from '../App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

test('renders correctly', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(() => {
    renderer.unmount();
  });
});

// Nuovi test Sessione E1
test('INTZ-01 | Renderizzare AppContent con insets di area sicura simulata', async () => {
  const mockUseSafeAreaInsets = useSafeAreaInsets as jest.Mock;
  mockUseSafeAreaInsets.mockClear();

  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  expect(mockUseSafeAreaInsets).toHaveBeenCalled();

  await ReactTestRenderer.act(() => {
    renderer.unmount();
  });
});

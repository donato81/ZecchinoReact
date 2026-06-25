import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';

interface ActivityDetectorViewProps {
  onActivity: () => void;
  children: ReactNode;
}

export function ActivityDetectorView({
  onActivity,
  children,
}: ActivityDetectorViewProps) {
  const handleStartShouldSetResponder = () => {
    onActivity();
    return false;
  };

  const handleMoveShouldSetResponder = () => false;

  const keyboardProps =
    Platform.OS === 'windows'
      ? {
          onKeyDown: () => {
            onActivity();
          },
        }
      : {};

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponder={handleStartShouldSetResponder}
      onMoveShouldSetResponder={handleMoveShouldSetResponder}
      {...keyboardProps}
    >
      {children}
    </View>
  );
}

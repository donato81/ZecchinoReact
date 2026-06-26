import { useState, useEffect } from 'react';
import { hapticSystem } from '@/lib/haptic-system';

export function useHaptic() {
  const [isEnabled, setIsEnabled] = useState(hapticSystem.isEnabled());
  const [isSupported, setIsSupported] = useState(hapticSystem.isSupported());

  useEffect(() => {
    setIsEnabled(hapticSystem.isEnabled());
    setIsSupported(hapticSystem.isSupported());
  }, []);

  const toggleEnabled = async (enabled: boolean) => {
    await hapticSystem.setEnabled(enabled);
    setIsEnabled(enabled);
  };

  return {
    isEnabled,
    isSupported,
    setEnabled: toggleEnabled,
    success: hapticSystem.success.bind(hapticSystem),
    error: hapticSystem.error.bind(hapticSystem),
    warning: hapticSystem.warning.bind(hapticSystem),
    selection: hapticSystem.selection.bind(hapticSystem),
    impactLight: hapticSystem.impactLight.bind(hapticSystem),
    impactMedium: hapticSystem.impactMedium.bind(hapticSystem),
    impactHeavy: hapticSystem.impactHeavy.bind(hapticSystem),
  };
}

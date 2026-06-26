import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export type HapticFeedbackType =
  | 'success'
  | 'error'
  | 'warning'
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy';

export interface HapticSettings {
  enabled: boolean;
}

export interface IHapticSystem {
  isEnabled(): boolean;
  setEnabled(enabled: boolean): Promise<void>;
  getSettings(): HapticSettings;
  isSupported(): boolean;

  // 7 feedback nativi
  success(): Promise<void>;
  error(): Promise<void>;
  warning(): Promise<void>;
  selection(): Promise<void>;
  impactLight(): Promise<void>;
  impactMedium(): Promise<void>;
  impactHeavy(): Promise<void>;
}

export class HapticSystem implements IHapticSystem {
  private settings: HapticSettings = {
    enabled: true,
  };
  private supportsVibration: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.supportsVibration = Platform.OS !== 'windows';
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('haptic-settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load haptic settings:', error);
    } finally {
      this.isInitialized = true;
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('haptic-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save haptic settings:', error);
    }
  }

  isEnabled(): boolean {
    return this.isInitialized && this.settings.enabled && this.supportsVibration;
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.settings.enabled = enabled;
    await this.saveSettings();
  }

  getSettings(): HapticSettings {
    return { ...this.settings };
  }

  isSupported(): boolean {
    return this.supportsVibration;
  }

  // 7 feedback nativi
  async success(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Haptic success failed:', error);
    }
  }

  async error(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.warn('Haptic error failed:', error);
    }
  }

  async warning(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.warn('Haptic warning failed:', error);
    }
  }

  async selection(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic selection failed:', error);
    }
  }

  async impactLight(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic impactLight failed:', error);
    }
  }

  async impactMedium(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic impactMedium failed:', error);
    }
  }

  async impactHeavy(): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.warn('Haptic impactHeavy failed:', error);
    }
  }

  // Strato di Compatibilità (Shim Deprecato)
  /** @deprecated Usare impactLight() */
  click(): void { this.impactLight(); }
  /** @deprecated Usare impactMedium() */
  buttonPress(): void { this.impactMedium(); }
  /** @deprecated Usare success() */
  pinSuccess(): void { this.success(); }
  /** @deprecated Usare error() */
  pinError(): void { this.error(); }
  /** @deprecated Usare success() */
  unlock(): void { this.success(); }
  /** @deprecated Usare success() */
  privateUnlock(): void { this.success(); }
  /** @deprecated Usare success() */
  accountCreated(): void { this.success(); }
  /** @deprecated Usare error() */
  accountDeleted(): void { this.error(); }
  /** @deprecated Usare impactMedium() */
  transactionCreated(): void { this.impactMedium(); }
  /** @deprecated Usare impactLight() */
  income(): void { this.impactLight(); }
  /** @deprecated Usare impactLight() */
  expense(): void { this.impactLight(); }
  /** @deprecated Usare impactMedium() */
  transfer(): void { this.impactMedium(); }
  /** @deprecated Usare success() */
  save(): void { this.success(); }
  /** @deprecated Usare error() */
  delete(): void { this.error(); }
  /** @deprecated Usare success() */
  budgetCreated(): void { this.success(); }
  /** @deprecated Usare error() */
  budgetDeleted(): void { this.error(); }
  /** @deprecated Usare warning() */
  budgetWarning(): void { this.warning(); }
  /** @deprecated Usare error() */
  budgetCritical(): void { this.error(); }
  /** @deprecated Usare error() */
  budgetExceeded(): void { this.error(); }
  /** @deprecated Usare success() */
  goalCreated(): void { this.success(); }
  /** @deprecated Usare success() */
  goalCompleted(): void { this.success(); }
  /** @deprecated Usare success() */
  export(): void { this.success(); }
  /** @deprecated Usare selection() */
  dialogOpen(): void { this.selection(); }
  /** @deprecated Usare selection() */
  dialogClose(): void { this.selection(); }
  /** @deprecated Usare selection() */
  tabChange(): void { this.selection(); }
  /** @deprecated Usare selection() */
  filterToggle(): void { this.selection(); }
  /** @deprecated Usare selection() */
  categoryToggle(): void { this.selection(); }
  /** @deprecated Usare selection() */
  alertDismissed(): void { this.selection(); }
  /** @deprecated Usare selection() */
  navigation(): void { this.selection(); }
  /** @deprecated Usare selection() */
  focus(): void { this.selection(); }
  /** @deprecated Usare selection() */
  swipe(): void { this.selection(); }
  /** @deprecated Usare selection() */
  longPress(): void { this.selection(); }
  /** @deprecated Usare selection() */
  refresh(): void { this.selection(); }
  /** @deprecated Usare success() o impactMedium() */
  custom(duration: number | number[]): void { this.impactMedium(); }
}

export const hapticSystem = new HapticSystem();

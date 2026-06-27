import { Platform, AppState, AppStateStatus } from 'react-native';

export type CanonicalSoundType =
  | 'click'
  | 'success'
  | 'error'
  | 'warning'
  | 'navigation';

export type LegacySoundType =
  | 'notification'
  | 'unlock'
  | 'lock'
  | 'income'
  | 'expense'
  | 'transfer'
  | 'focus'
  | 'hover'
  | 'delete'
  | 'save'
  | 'budget-warning'
  | 'budget-critical'
  | 'budget-exceeded'
  | 'milestone'
  | 'dialog-open'
  | 'dialog-close'
  | 'tab-change'
  | 'filter-toggle'
  | 'category-toggle'
  | 'export'
  | 'settings-change'
  | 'volume-change'
  | 'preset-applied'
  | 'account-created'
  | 'account-deleted'
  | 'goal-created'
  | 'goal-completed'
  | 'goal-progress'
  | 'budget-created'
  | 'budget-deleted'
  | 'chart-loaded'
  | 'data-refresh'
  | 'keyboard-shortcut'
  | 'pin-error'
  | 'pin-success'
  | 'private-unlock'
  | 'private-lock'
  | 'alert-dismissed'
  | 'period-change'
  | 'card-open'
  | 'card-close'
  | 'edit'
  | 'cancel'
  | 'confirm'
  | 'toggle-on'
  | 'toggle-off'
  | 'slider-change'
  | 'dropdown-open'
  | 'dropdown-close'
  | 'select-option'
  | 'form-submit'
  | 'form-error'
  | 'input-focus'
  | 'input-blur'
  | 'tooltip-show'
  | 'tooltip-hide'
  | 'account-edit'
  | 'transaction-edit'
  | 'budget-edit'
  | 'goal-edit'
  | 'category-created'
  | 'category-deleted'
  | 'category-edited'
  | 'import-start'
  | 'import-success'
  | 'import-error'
  | 'backup-created'
  | 'restore-complete'
  | 'list-scroll'
  | 'page-load'
  | 'refresh'
  | 'search-start'
  | 'search-complete'
  | 'filter-apply'
  | 'filter-clear'
  | 'sort-change'
  | 'menu-open'
  | 'menu-close'
  | 'submenu-open'
  | 'panel-expand'
  | 'panel-collapse'
  | 'test-sound'
  | 'preset-change'
  | 'settings-reset'
  | 'validation-error'
  | 'validation-success';

export type SoundType = CanonicalSoundType | LegacySoundType;

export interface AudioPersistCallbacks {
  onEnabledChange?: (enabled: boolean) => Promise<void>;
  onVolumeChange?: (volume: number) => Promise<void>;
}

class SoundSystem {
  private audioContext: import('react-native-audio-api').AudioContext | null = null;
  private masterGain: import('react-native-audio-api').GainNode | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;
  private persistCallbacks: AudioPersistCallbacks = {};

  constructor() {
    // Il costruttore deve essere vuoto.
  }

  initFromSettings(enabled: boolean, volume: number): void {
    this.enabled = enabled;
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  configure(callbacks: AudioPersistCallbacks): void {
    this.persistCallbacks = callbacks;
  }

  private ensureContext(): void {
    if (Platform.OS === 'windows') return;
    if (!this.enabled) return;

    try {
      if (!this.audioContext) {
        const { AudioContext } = require('react-native-audio-api');
        const ctx = new AudioContext();
        this.audioContext = ctx;
        const gain = ctx.createGain();
        gain.gain.value = this.volume;
        gain.connect(ctx.destination);
        this.masterGain = gain;
        this.registerAppStateListener();
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch((err: any) => {
          if (__DEV__) console.warn('Failed to resume AudioContext:', err);
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Fallback: impossibile inizializzare AudioContext nativo:', error);
      }
      this.enabled = false;
    }
  }

  private registerAppStateListener() {
    AppState.addEventListener('change', (nextStatus: AppStateStatus) => {
      if (this.audioContext) {
        if (nextStatus === 'background' || nextStatus === 'inactive') {
          this.audioContext.suspend().catch(() => {});
        } else if (nextStatus === 'active' && this.enabled) {
          this.audioContext.resume().catch(() => {});
        }
      }
    });
  }

  private normalizeSoundType(soundType: SoundType): CanonicalSoundType {
    switch (soundType) {
      // 1. error mapping
      case 'error':
      case 'pin-error':
      case 'validation-error':
      case 'form-error':
      case 'import-error':
      case 'budget-exceeded':
      case 'account-deleted':
      case 'budget-deleted':
      case 'category-deleted':
      case 'delete':
        return 'error';

      // 2. warning mapping
      case 'warning':
      case 'budget-critical':
      case 'budget-warning':
      case 'notification':
      case 'alert-dismissed':
        return 'warning';

      // 3. success mapping
      case 'success':
      case 'private-unlock':
      case 'pin-success':
      case 'save':
      case 'account-created':
      case 'goal-created':
      case 'goal-completed':
      case 'budget-created':
      case 'import-success':
      case 'backup-created':
      case 'restore-complete':
      case 'income':
      case 'export':
      case 'validation-success':
        return 'success';

      // 4. click mapping
      case 'expense':
      case 'click':
        return 'click';

      // 5. navigation mapping
      case 'transfer':
      case 'dialog-open':
      case 'dialog-close':
      case 'tab-change':
      case 'navigation':
        return 'navigation';

      // Delibera PA-01 (27/06/2026): lock e private-lock
      // appartengono alla famiglia navigation perché
      // rappresentano cambi di stato, non errori né successi.
      // unlock -> success perché è completamento riuscito.
      case 'lock':
      case 'private-lock':
        return 'navigation';
      case 'unlock':
        return 'success';

      default:
        return 'click';
    }
  }

  private playToneAt(
    frequency: number,
    type: 'sine' | 'square' | 'sawtooth' | 'triangle',
    startTime: number,
    duration: number,
    adsr?: { attack: number; decay: number; sustain: number; release: number }
  ) {
    if (!this.audioContext || !this.masterGain) return;

    try {
      const osc = this.audioContext.createOscillator();
      osc.type = type;
      osc.frequency.value = frequency;

      const gainNode = this.audioContext.createGain();

      const attack = adsr?.attack ?? 0.01;
      const decay = adsr?.decay ?? 0.1;
      const sustain = adsr?.sustain ?? 0.7;
      const release = adsr?.release ?? 0.1;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(1, startTime + attack);
      gainNode.gain.linearRampToValueAtTime(sustain, startTime + attack + decay);
      gainNode.gain.setValueAtTime(sustain, startTime + duration - release);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      if (__DEV__) console.warn('Failed to play tone at scheduled time:', e);
    }
  }

  private playSequence(
    notes: Array<{
      freq: number;
      duration: number;
      type?: 'sine' | 'square' | 'sawtooth' | 'triangle';
      delay?: number;
    }>
  ) {
    if (!this.audioContext || !this.masterGain) return;

    try {
      const now = this.audioContext.currentTime;
      let accumulatedTime = 0;

      notes.forEach((note, index) => {
        if (index > 0) {
          const prevNote = notes[index - 1];
          accumulatedTime += note.delay !== undefined ? note.delay / 1000 : prevNote.duration;
        }
        this.playToneAt(
          note.freq,
          note.type || 'sine',
          now + accumulatedTime,
          note.duration
        );
      });
    } catch (e) {
      if (__DEV__) console.warn('Failed to play tone sequence:', e);
    }
  }

  private playClick() {
    if (!this.audioContext) return;
    this.playToneAt(800, 'sine', this.audioContext.currentTime, 0.04, {
      attack: 0.001,
      decay: 0.02,
      sustain: 0.3,
      release: 0.03,
    });
  }

  private playSuccess() {
    this.playSequence([
      { freq: 523.25, duration: 0.1, type: 'sine' },
      { freq: 659.25, duration: 0.1, type: 'sine', delay: 80 },
      { freq: 783.99, duration: 0.1, type: 'sine', delay: 80 },
    ]);
  }

  private playError() {
    this.playSequence([
      { freq: 300, duration: 0.12, type: 'sawtooth' },
      { freq: 250, duration: 0.12, type: 'sawtooth', delay: 100 },
    ]);
  }

  private playWarning() {
    this.playSequence([
      { freq: 440, duration: 0.1, type: 'square' },
      { freq: 440, duration: 0.1, type: 'square', delay: 150 },
    ]);
  }

  private playNavigation() {
    if (!this.audioContext) return;
    this.playToneAt(600, 'sine', this.audioContext.currentTime, 0.04, {
      attack: 0.001,
      decay: 0.01,
      sustain: 0.5,
      release: 0.03,
    });
  }

  play(soundType: SoundType) {
    if (!this.enabled) return;

    this.ensureContext();

    const normalized = this.normalizeSoundType(soundType);

    switch (normalized) {
      case 'click':
        this.playClick();
        break;
      case 'success':
        this.playSuccess();
        break;
      case 'error':
        this.playError();
        break;
      case 'warning':
        this.playWarning();
        break;
      case 'navigation':
        this.playNavigation();
        break;
    }
  }

  async setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
    if (this.persistCallbacks.onVolumeChange) {
      await this.persistCallbacks.onVolumeChange(this.volume);
    }
  }

  async setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (this.persistCallbacks.onEnabledChange) {
      await this.persistCallbacks.onEnabledChange(this.enabled);
    }
  }

  getEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }
}

export const soundSystem = new SoundSystem();

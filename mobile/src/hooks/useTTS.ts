/**
 * useTTS Hook
 * Convenient hook for using TTS throughout the app
 */

import { useCallback } from 'react';
import { speakNumber, speakText, stopSpeaking, isSpeaking } from '../services/tts.service';
import { useTTS as useTTSContext } from '../contexts/TTSContext';
import type { TTSConfig } from '../services/tts.service';

export function useTTS() {
  const { settings, isEnabled } = useTTSContext();

  const speakNumberWithSettings = useCallback(
    async (number: number, customConfig?: Partial<TTSConfig>) => {
      if (!isEnabled()) {
        return;
      }

      const config = {
        rate: settings.rate,
        volume: settings.volume,
        pitch: settings.pitch,
        ...customConfig,
      };

      await speakNumber(number, config);
    },
    [settings, isEnabled]
  );

  const speakTextWithSettings = useCallback(
    async (text: string, customConfig?: Partial<TTSConfig>) => {
      if (!isEnabled()) {
        return;
      }

      const config = {
        rate: settings.rate,
        volume: settings.volume,
        pitch: settings.pitch,
        ...customConfig,
      };

      await speakText(text, config);
    },
    [settings, isEnabled]
  );

  const stop = useCallback(() => {
    stopSpeaking();
  }, []);

  const checkIsSpeaking = useCallback(async () => {
    return await isSpeaking();
  }, []);

  return {
    speakNumber: speakNumberWithSettings,
    speakText: speakTextWithSettings,
    stop,
    isSpeaking: checkIsSpeaking,
    isEnabled: isEnabled(),
    settings,
  };
}


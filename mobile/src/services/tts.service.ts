import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

export interface TTSConfig {
  language?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: Error) => void;
}

const DEFAULT_CONFIG: TTSConfig = {
  language: 'en-US',
  pitch: 1.0,
  rate: 0.75,
  volume: 1.0,
};

export function numberToWords(num: number): string {
  if (num < 0 || num > 100) return num.toString();
  const ones = [
    'zero','one','two','three','four','five','six','seven','eight','nine',
    'ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'
  ];
  const tens = ['', '', 'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  if (num < 20) return ones[num];
  if (num < 100) return num % 10 === 0 ? tens[Math.floor(num / 10)] : `${tens[Math.floor(num/10)]}-${ones[num%10]}`;
  return num === 100 ? 'one hundred' : num.toString();
}

export async function speakNumber(number: number, config?: Partial<TTSConfig>) {
  await speakText(numberToWords(number), config);
}

export async function speakText(text: string, config?: Partial<TTSConfig>) {
  if (!text?.trim()) return;

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (Platform.OS === 'web') {
    try {
      // Stop any currently speaking utterances immediately
      window.speechSynthesis.cancel();

      finalConfig.onStart?.();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = finalConfig.language;
      utterance.pitch = finalConfig.pitch;
      utterance.rate = finalConfig.rate;
      utterance.volume = finalConfig.volume;

      utterance.onend = () => finalConfig.onDone?.();
      utterance.onerror = (e) => finalConfig.onError?.(new Error(e.error));

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Web TTS error', err);
      finalConfig.onError?.(err as Error);
    }
    return;
  }

  // Mobile TTS
  return new Promise<void>((resolve, reject) => {
    Speech.stop(); // stops any current speech
    Speech.speak(text, {
      language: finalConfig.language,
      pitch: finalConfig.pitch,
      rate: finalConfig.rate,
      volume: finalConfig.volume,
      onStart: () => finalConfig.onStart?.(),
      onDone: () => { finalConfig.onDone?.(); resolve(); },
      onStopped: () => { finalConfig.onStopped?.(); resolve(); },
      onError: (err: Error) => { finalConfig.onError?.(err); reject(err); },
    });
  });
}

export function stopSpeaking() {
  if (Platform.OS === 'web') window.speechSynthesis.cancel();
  else Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  if (Platform.OS === 'web') return window.speechSynthesis.speaking;
  return Speech.isSpeakingAsync();
}
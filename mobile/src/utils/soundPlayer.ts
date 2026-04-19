/**
 * Sound Player Utility
 * Handles playing sound effects for game interactions
 * 
 * Note: For Expo, you can use expo-av for audio playback
 * This is a placeholder implementation that can be extended
 */

import * as Haptics from 'expo-haptics';

/**
 * Sound effect types
 */
export type SoundType = 
  | 'success' 
  | 'error' 
  | 'click' 
  | 'complete' 
  | 'star' 
  | 'levelup';

/**
 * Play a sound effect
 * Currently uses haptic feedback as a placeholder
 * Can be extended to use expo-av for actual audio playback
 */
export function playSound(type: SoundType): void {
  switch (type) {
    case 'success':
    case 'complete':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'click':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'star':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'levelup':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Could add a sequence of haptics for level up
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 100);
      break;
    default:
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/**
 * Play multiple sounds in sequence
 */
export function playSoundSequence(sounds: SoundType[], delay: number = 150): void {
  sounds.forEach((sound, index) => {
    setTimeout(() => {
      playSound(sound);
    }, index * delay);
  });
}

/**
 * Example usage with expo-av (commented out - requires installation):
 * 
 * import { Audio } from 'expo-av';
 * 
 * const soundMap: Record<SoundType, any> = {
 *   success: require('../assets/sounds/success.mp3'),
 *   error: require('../assets/sounds/error.mp3'),
 *   // ... other sounds
 * };
 * 
 * export async function playSound(type: SoundType): Promise<void> {
 *   try {
 *     const { sound } = await Audio.Sound.createAsync(soundMap[type]);
 *     await sound.playAsync();
 *     sound.setOnPlaybackStatusUpdate((status) => {
 *       if (status.didJustFinish) {
 *         sound.unloadAsync();
 *       }
 *     });
 *   } catch (error) {
 *     console.error('Error playing sound:', error);
 *   }
 * }
 */


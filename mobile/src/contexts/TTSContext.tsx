/**
 * TTS Context
 * Provides TTS settings and controls throughout the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TTS_SETTINGS_KEY = '@kidventure_tts_settings';

export interface TTSSettings {
  enabled: boolean;
  rate: number; // 0.0 to 1.0
  volume: number; // 0.0 to 1.0
  pitch: number; // 0.0 to 2.0
}

const DEFAULT_SETTINGS: TTSSettings = {
  enabled: true,
  rate: 0.75, // Slightly slower for kids
  volume: 1.0,
  pitch: 1.0,
};

interface TTSContextType {
  settings: TTSSettings;
  updateSettings: (newSettings: Partial<TTSSettings>) => Promise<void>;
  isEnabled: () => boolean;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

interface TTSProviderProps {
  children: ReactNode;
}

export function TTSProvider({ children }: TTSProviderProps) {
  const [settings, setSettings] = useState<TTSSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from storage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(TTS_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading TTS settings:', error);
      setIsLoaded(true);
    }
  };

  const updateSettings = async (newSettings: Partial<TTSSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      await AsyncStorage.setItem(TTS_SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving TTS settings:', error);
    }
  };

  const isEnabled = () => {
    return settings.enabled;
  };

  // Don't render children until settings are loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <TTSContext.Provider value={{ settings, updateSettings, isEnabled }}>
      {children}
    </TTSContext.Provider>
  );
}

export function useTTS(): TTSContextType {
  const context = useContext(TTSContext);
  if (context === undefined) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
}


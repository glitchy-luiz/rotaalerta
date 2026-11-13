import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const light = {
  bg: '#F4F6FA',
  card: '#FFFFFF',
  text: '#14213D',
  muted: '#475569',
  primary: '#1D4ED8',
  onPrimary: '#FFFFFF',
  border: '#CBD5E1',
  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
  success: '#15803D',
  successBg: '#DCFCE7',
};

const highContrast: Colors = {
  bg: '#000000',
  card: '#000000',
  text: '#FFFFFF',
  muted: '#E5E5E5',
  primary: '#FFD400',
  onPrimary: '#000000',
  border: '#FFFFFF',
  danger: '#FF8A8A',
  dangerBg: '#000000',
  success: '#6EE7A0',
  successBg: '#000000',
};

export type Colors = { [K in keyof typeof light]: string };
type Settings = { highContrast: boolean; largeText: boolean };

const DEFAULTS: Settings = { highContrast: false, largeText: false };
const KEY = '@rotaalerta:settings';

type ThemeValue = { colors: Colors; scale: number; settings: Settings; update: (p: Partial<Settings>) => void };
const Ctx = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => v && setSettings({ ...DEFAULTS, ...JSON.parse(v) }))
      .catch(() => {});
  }, []);

  const update = useCallback((p: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...p };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeValue>(
    () => ({
      colors: settings.highContrast ? highContrast : light,
      scale: settings.largeText ? 1.25 : 1,
      settings,
      update,
    }),
    [settings, update],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme precisa estar dentro de ThemeProvider');
  return v;
}

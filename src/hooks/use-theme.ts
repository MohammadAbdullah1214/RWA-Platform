'use client';

import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function useTheme() {
  const { theme, setTheme, systemTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  const isLight = theme === 'light' || (theme === 'system' && systemTheme === 'light');

  return {
    theme: mounted ? theme : 'light',
    systemTheme: mounted ? systemTheme : 'light',
    isDark,
    isLight,
    setTheme,
    toggleTheme,
    mounted,
  };
}
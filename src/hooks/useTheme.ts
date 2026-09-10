import { useEffect } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('legalcore-theme', 'dark');
  }, []);

  return { theme: 'dark' as Theme, toggle: () => {}, isDark: true };
}

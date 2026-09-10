import { useEffect } from 'react';

type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  return 'dark';
}

export function useTheme() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('legalcore-theme', 'dark');
  }, []);

  return { theme: 'dark' as Theme, toggle: () => {}, isDark: true };
}

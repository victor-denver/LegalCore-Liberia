import { useEffect, useState } from 'react';

/**
 * Theme switching. `<html data-theme="dark|light">` is the single source of truth —
 * every colour in the app resolves from the custom properties defined per theme in
 * index.css, so flipping the attribute repaints the whole site.
 *
 * First visit follows the operating system; after that the choice is remembered.
 */

export type Theme = 'dark' | 'light';

const KEY = 'legalcore-theme';
const listeners = new Set<(t: Theme) => void>();

function preferred(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function paint(t: Theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', t);
  root.style.colorScheme = t;
}

let current: Theme = preferred();

// Paint on import, before the first React render, so there is no flash of the wrong theme.
if (typeof document !== 'undefined') paint(current);

export function setTheme(t: Theme) {
  if (t === current) return;
  current = t;
  localStorage.setItem(KEY, t);
  paint(t);
  listeners.forEach((fn) => fn(t));
}

export function toggleTheme() {
  setTheme(current === 'dark' ? 'light' : 'dark');
}

export function useTheme() {
  const [theme, setLocal] = useState<Theme>(current);

  useEffect(() => {
    listeners.add(setLocal);
    return () => { listeners.delete(setLocal); };
  }, []);

  return { theme, isDark: theme === 'dark', toggle: toggleTheme, setTheme };
}

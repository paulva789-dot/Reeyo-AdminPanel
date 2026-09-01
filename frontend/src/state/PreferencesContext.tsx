import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PreferencesContext, THEME_KEY, LANGUAGE_KEY, readStored, writeStored,
} from './usePreferences';
import type { Theme, Language } from './usePreferences';

const THEMES: Theme[] = ['light', 'dark', 'system'];
const LANGUAGES: Language[] = ['fr', 'en'];

/** What "system" currently means, asked of the browser rather than assumed. */
function systemPrefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  // The inline script in index.html has already applied these; reading the same
  // values here keeps React's idea of the theme identical to the DOM's.
  const [theme, setThemeState] = useState<Theme>(
    () => readStored(THEME_KEY, THEMES, 'system'),
  );
  const [language, setLanguageState] = useState<Language>(
    () => readStored(LANGUAGE_KEY, LANGUAGES, 'fr'),
  );
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // Following the OS means following it while the console is open, not only at
  // load — someone switching their machine to dark at dusk expects this to move.
  useEffect(() => {
    let media: MediaQueryList;
    try {
      media = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return;
    }
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' = theme === 'system'
    ? (systemDark ? 'dark' : 'light')
    : theme;

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    writeStored(THEME_KEY, next);
    const root = document.documentElement;
    // "system" removes the attribute so the media query decides, which is what
    // the token file is written to expect.
    if (next === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', next);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    writeStored(LANGUAGE_KEY, next);
    document.documentElement.setAttribute('lang', next);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme, language, setLanguage }),
    [theme, setTheme, resolvedTheme, language, setLanguage],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

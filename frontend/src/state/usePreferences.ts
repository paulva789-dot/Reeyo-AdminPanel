// Theme and language — specification §2.1 and §2.2.
//
// Both are read before the first paint by the inline script in index.html, so
// the console never flashes the wrong theme or the wrong language on load. This
// module owns them afterwards.
//
// On persistence: the spec asks for these to be stored against the admin user
// account so they follow an operator to another machine. admin-api has no field
// for either, so they are stored on the device instead — which is what makes
// the pre-paint requirement achievable at all, since a network round trip
// cannot happen before first paint. When the backend grows the field, this is
// the only module that has to change.

import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'fr' | 'en';

export const THEME_KEY = 'reeyo.theme';
export const LANGUAGE_KEY = 'reeyo.language';

export interface PreferencesValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** What the theme currently resolves to, once System is followed. */
  resolvedTheme: 'light' | 'dark';

  language: Language;
  setLanguage: (language: Language) => void;
}

export const PreferencesContext = createContext<PreferencesValue | null>(null);

export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}

/** Reads a stored preference, tolerating a browser that refuses storage. */
export function readStored<T extends string>(key: string, allowed: T[], fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return allowed.includes(value as T) ? (value as T) : fallback;
  } catch {
    // Private windows and blocked-storage settings both throw on access.
    return fallback;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // A preference that cannot be saved still applies for this session.
  }
}

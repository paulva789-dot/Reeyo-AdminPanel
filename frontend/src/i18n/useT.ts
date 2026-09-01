import { useCallback } from 'react';
import { usePreferences } from '../state/usePreferences';
import { translate } from './strings';

export type Translate = (text: string, vars?: Record<string, string | number>) => string;

/**
 * The interface translator.
 *
 * Takes the English text, returns the French when there is one. Data — vendor
 * names, item names, addresses — is never passed through it; see strings.ts.
 */
export function useT(): Translate {
  const { language } = usePreferences();
  return useCallback(
    (text, vars) => translate(language, text, vars),
    [language],
  );
}

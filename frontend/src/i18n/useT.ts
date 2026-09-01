import { useCallback } from 'react';
import { usePreferences } from '../state/usePreferences';
import { translate } from './strings';
import type { StringKey } from './strings';

export type Translate = (key: StringKey, vars?: Record<string, string | number>) => string;

/** The interface translator. Data is never passed through it — see strings.ts. */
export function useT(): Translate {
  const { language } = usePreferences();
  return useCallback(
    (key, vars) => translate(language, key, vars),
    [language],
  );
}

/**
 * Order and payment vocabulary, which arrives as a value rather than a key.
 * Falls back to the value itself, so a status the dictionary has not caught up
 * with still reads as a word rather than as a missing translation.
 */
export function useVocabulary() {
  const { language } = usePreferences();
  return useCallback((prefix: 'status' | 'pay' | 'payStatus' | 'service', value: string) => {
    const key = `${prefix}.${value}` as StringKey;
    const translated = translate(language, key);
    return translated === key ? value : translated;
  }, [language]);
}

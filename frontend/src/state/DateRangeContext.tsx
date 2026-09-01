import { useState, useCallback, useMemo } from 'react';
import { DateRangeContext, rangeFor, customRange } from './useDateRange';
import type { DateRange, PresetKey } from './useDateRange';

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  // Today, because that is what an operator is looking at when they arrive.
  const [range, setRange] = useState<DateRange>(() => rangeFor('today'));

  const setPreset = useCallback((preset: Exclude<PresetKey, 'custom'>) => {
    setRange(rangeFor(preset));
  }, []);

  const setCustom = useCallback((from: Date, to: Date) => {
    setRange(customRange(from, to));
  }, []);

  const value = useMemo(
    () => ({ range, setPreset, setCustom }),
    [range, setPreset, setCustom],
  );

  return (
    <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>
  );
}

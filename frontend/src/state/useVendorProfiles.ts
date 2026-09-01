// Vendor profiles and their wallets — specification §4.
//
// Kept out of AppState because only the Vendors page needs them and a wallet
// ledger is heavy to carry on every screen.

import { useState, useCallback, useMemo } from 'react';
import { vendorProfiles as seed } from '../data/vendorSeed';
import { useAppState } from './useAppState';
import { useAuth } from './useAuth';
import type { VendorProfile, WalletEntry } from '../data/types';

/** The balance a vendor may not be taken below by a manual debit (§4.4). */
export const WALLET_FLOOR = 0;

export interface WalletMove {
  amount: number;
  reason: string;
  reference: string;
  note: string;
}

export interface VendorProfilesState {
  profiles: VendorProfile[];
  /** Every field entered at onboarding stays editable (§4). */
  save: (profile: VendorProfile) => void;
  create: (profile: VendorProfile) => void;
  credit: (id: string, move: WalletMove) => void;
  /** Returns an error string when the debit is refused, null when it went through. */
  debit: (id: string, move: WalletMove) => string | null;
  /** Nothing in a ledger is edited or deleted — only reversed (§4.4). */
  reverse: (id: string, entryId: string) => void;
}

let seq = 0;

export function useVendorProfiles(): VendorProfilesState {
  const { pushToast } = useAppState();
  const { admin } = useAuth();
  const [profiles, setProfiles] = useState<VendorProfile[]>(seed);

  const who = admin?.name ?? 'Admin';

  const append = useCallback((
    id: string,
    entry: Omit<WalletEntry, 'id' | 'at' | 'balanceAfter' | 'by'>,
  ) => {
    setProfiles((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const balanceAfter = p.walletBalance + entry.amount;
      const row: WalletEntry = {
        ...entry,
        id: `WE-new-${++seq}`,
        at: new Date().toISOString(),
        balanceAfter,
        by: who,
      };
      return { ...p, walletBalance: balanceAfter, wallet: [row, ...p.wallet] };
    }));
  }, [who]);

  const save = useCallback((profile: VendorProfile) => {
    setProfiles((prev) => prev.map((p) => (p.id === profile.id ? profile : p)));
    pushToast(`${profile.businessName} saved`);
  }, [pushToast]);

  const create = useCallback((profile: VendorProfile) => {
    setProfiles((prev) => [...prev, profile]);
    pushToast(`${profile.businessName} added`);
  }, [pushToast]);

  const credit = useCallback((id: string, move: WalletMove) => {
    append(id, {
      amount: Math.abs(move.amount),
      source: 'manual adjustment',
      reason: move.reason,
      reference: move.reference || null,
      note: move.note || null,
      reverses: null,
    });
    pushToast('Funds added');
  }, [append, pushToast]);

  const debit = useCallback((id: string, move: WalletMove): string | null => {
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return 'That vendor no longer exists.';

    const amount = Math.abs(move.amount);
    if (profile.walletBalance - amount < WALLET_FLOOR) {
      // Refused rather than clamped: a debit that silently takes out less than
      // asked leaves the books disagreeing with whatever prompted it.
      return `That would take the balance below ${WALLET_FLOOR}. `
        + `The most that can be removed is ${profile.walletBalance - WALLET_FLOOR}.`;
    }

    append(id, {
      amount: -amount,
      source: 'manual adjustment',
      reason: move.reason,
      reference: move.reference || null,
      note: move.note || null,
      reverses: null,
    });
    pushToast('Funds removed');
    return null;
  }, [profiles, append, pushToast]);

  const reverse = useCallback((id: string, entryId: string) => {
    const profile = profiles.find((p) => p.id === id);
    const entry = profile?.wallet.find((e) => e.id === entryId);
    if (!profile || !entry) return;

    append(id, {
      amount: -entry.amount,
      source: 'manual adjustment',
      reason: `Reversal of ${entry.reason}`,
      reference: entry.reference,
      note: null,
      reverses: entry.id,
    });
    pushToast('Entry reversed');
  }, [profiles, append, pushToast]);

  return useMemo(
    () => ({ profiles, save, create, credit, debit, reverse }),
    [profiles, save, create, credit, debit, reverse],
  );
}

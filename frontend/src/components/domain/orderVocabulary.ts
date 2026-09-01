// Parcel changes the words, not the layout — specification §3.8.
//
// For Food and Grocery the two parties are Customer and Vendor. For a Parcel
// they are Sender and Receiver, and a third party appears: the Recipient, the
// person actually collecting. Every label, notification and export follows the
// same naming, which is why it is decided in one place rather than per screen.

import type { Order } from '../../data/types';

export interface PartyWords {
  /** The party the goods leave from — the vendor, or the parcel sender. */
  from: string;
  /** The party the goods go to — the customer, or the parcel receiver. */
  to: string;
  /** Present only on a parcel, and only when someone else is collecting. */
  recipient: string | null;
}

export function partyWords(order: Order): PartyWords {
  if (order.vertical === 'parcel') {
    return { from: 'Sender', to: 'Receiver', recipient: 'Recipient' };
  }
  return { from: 'Vendor', to: 'Customer', recipient: null };
}

/**
 * A parcel names the sender first, so the list column that reads "Customer" for
 * food has to read "Sender" here. The list is mixed, so it takes the neutral
 * word unless every row is a parcel.
 */
export function columnWords(orders: Order[]): PartyWords {
  const allParcel = orders.length > 0 && orders.every((o) => o.vertical === 'parcel');
  return allParcel
    ? { from: 'Receiver', to: 'Sender', recipient: 'Recipient' }
    : { from: 'Vendor', to: 'Customer', recipient: null };
}

/** A Google Maps link for a party, preferring coordinates over the written address. */
export function mapsUrl(lat: number, lng: number, address: string): string {
  const query = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
    ? `${lat},${lng}`
    : address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

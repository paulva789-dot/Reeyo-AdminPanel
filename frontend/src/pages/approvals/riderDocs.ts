// Shared vocabulary for rider KYC, kept out of the component files so Fast
// Refresh stays happy (a module exporting both a component and a constant
// loses its refresh boundary).

import type { RiderDocument, RiderDocumentType } from '../../data/types';

export const DOCUMENT_LABEL: Record<RiderDocumentType, string> = {
  NATIONAL_ID: 'National ID',
  DRIVERS_LICENSE: "Driver's licence",
  VEHICLE_REGISTRATION: 'Vehicle registration',
  PROFILE_PHOTO: 'Profile photo',
  INSURANCE: 'Insurance',
};

/** What each document proves, so the reviewer knows what they are looking for. */
export const DOCUMENT_NOTE: Record<RiderDocumentType, string> = {
  NATIONAL_ID: 'Name and photo must match the applicant.',
  DRIVERS_LICENSE: 'Must be in date and cover the vehicle class.',
  VEHICLE_REGISTRATION: 'Plate must match the one on the application.',
  PROFILE_PHOTO: 'A clear face, used in the customer app.',
  INSURANCE: 'Must be current, third-party cover at minimum.',
};

/** How far through KYC a rider is — the number the queue is really sorted by. */
export function reviewed(docs: RiderDocument[]): number {
  return docs.filter((d) => d.status !== 'pending').length;
}

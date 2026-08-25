import { useState } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Segments from '../components/ui/Segments';
import { useAppState } from '../state/useAppState';
import MenuQueue from './approvals/MenuQueue';
import VendorQueue from './approvals/VendorQueue';
import RiderQueue from './approvals/RiderQueue';

/**
 * Three queues that all ask the same question — does this get onto the
 * platform — so they share one page rather than three rail entries. The tab
 * counts are what the rail badge adds up to.
 */
export default function Approvals() {
  const { approvals, pendingVendors, pendingRiders } = useAppState();
  const [queue, setQueue] = useState('menus');

  const waiting = (rows: { status: string }[]) =>
    rows.filter((r) => r.status === 'pending').length;

  return (
    <>
      <PageTitle>Approvals</PageTitle>

      <div style={{ marginBottom: 16 }}>
        <Segments
          ariaLabel="Choose an approval queue"
          value={queue}
          onChange={setQueue}
          segments={[
            { value: 'menus', label: 'Menu changes', count: waiting(approvals) },
            { value: 'vendors', label: 'Vendors', count: waiting(pendingVendors) },
            { value: 'riders', label: 'Riders', count: waiting(pendingRiders) },
          ]}
        />
      </div>

      {queue === 'menus' && <MenuQueue />}
      {queue === 'vendors' && <VendorQueue />}
      {queue === 'riders' && <RiderQueue />}
    </>
  );
}

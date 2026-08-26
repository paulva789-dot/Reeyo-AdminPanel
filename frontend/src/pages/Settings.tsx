import { useState } from 'react';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Toggle from '../components/ui/Toggle';
import LocalOnly from '../components/ui/LocalOnly';
import ApiKeysCard from './settings/ApiKeysCard';
import ConfigCard from './settings/ConfigCard';
import FeatureFlagsCard from './settings/FeatureFlagsCard';
import AdminUsersCard from './settings/AdminUsersCard';
import ChangePasswordCard from './settings/ChangePasswordCard';
import { usePlatformAdmin } from '../state/usePlatformAdmin';
import { PAYMENT_METHODS } from '../data/seed';

/** Which payment methods are accepted has no route on admin-api, so it stays local. */
function PaymentMethods() {
  const [methods, setMethods] = useState<string[]>(PAYMENT_METHODS.slice(0, 4));

  return (
    <Card title="Payment methods">
      <LocalOnly what="Payment method availability" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {PAYMENT_METHODS.map((m) => (
          <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
            <span style={{ flex: 1, fontSize: 12.5 }}>{m}</span>
            <Toggle
              checked={methods.includes(m)}
              onChange={(next) => setMethods((prev) => (next
                ? [...prev, m]
                : prev.filter((x) => x !== m)))}
              label={m}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Settings() {
  // One hook for the page: config, flags and admin accounts load together and
  // each card reports its own failure.
  const state = usePlatformAdmin();

  return (
    <>
      {/* Saving is per-card now. A single page-level "Save changes" button
          could not be honest about which of three separate endpoints it wrote
          to, or which of them failed. */}
      <PageTitle>Settings</PageTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="reeyo-split-even">
          <ConfigCard state={state} />
          <PaymentMethods />
        </div>

        <FeatureFlagsCard state={state} />

        <ChangePasswordCard />

        <ApiKeysCard />

        <AdminUsersCard state={state} />
      </div>
    </>
  );
}

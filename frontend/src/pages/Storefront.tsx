import { useState } from 'react';
import { useT } from '../i18n/useT';
import PageTitle from '../components/layout/PageTitle';
import Card from '../components/ui/Card';
import Toggle from '../components/ui/Toggle';
import Pill from '../components/ui/Pill';
import Segments from '../components/ui/Segments';
import NoEndpoint from '../components/ui/NoEndpoint';
import { useAppState } from '../state/useAppState';
import { useEngagement } from '../state/useEngagement';
import BannersPanel from './engagement/BannersPanel';
import PopupsPanel from './engagement/PopupsPanel';
import LoyaltyPanel from './engagement/LoyaltyPanel';
import AudiencePanel from './engagement/AudiencePanel';

/**
 * The section order the customer app scrolls through.
 *
 * This is the one thing on the page with no endpoint behind it: the reference
 * has no route for home-section ordering, so it stays local and says so.
 */
function Sections() {
  const { sections, toggleSection } = useAppState();

  return (
    <NoEndpoint
      what="Home section ordering"
      consequence="The order customers scroll the home screen in cannot be changed from here."
    >
      <Card title="Section order">
        <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-2)' }}>
          The order here decides what the customer scrolls past first.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {sections.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px',
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-card)',
              }}
            >
              <span
                className="mono"
                style={{
                  width: 22, height: 22, borderRadius: 'var(--r-pill)', flexShrink: 0,
                  background: 'var(--calm-soft)', color: 'var(--text-2)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11,
                }}
              >
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: 12.5, minWidth: 0 }}>{s.name}</span>
              {!s.active && <Pill status="hidden" token="calm" />}
              <Toggle
                checked={s.active}
                onChange={() => toggleSection(s.id)}
                label={`${s.name} visibility`}
              />
            </div>
          ))}
        </div>
      </Card>
    </NoEndpoint>
  );
}

export default function Storefront() {
  const t = useT();
  const [tab, setTab] = useState('banners');
  // One hook for the whole page: each panel reading its own would refetch the
  // entire engagement suite every time someone changed tabs.
  const engagement = useEngagement([
    'banners', 'popups', 'loyaltyRules', 'loyaltyRewards',
    'preferenceTags', 'trackingFacts', 'sharedCarts',
  ]);

  return (
    <>
      <PageTitle>{t('Storefront')}</PageTitle>

      <div style={{ marginBottom: 14 }}>
        <Segments
          ariaLabel="Storefront view"
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'banners', label: t('Banners'), count: engagement.banners.rows.length },
            { value: 'popups', label: t('Popups'), count: engagement.popups.rows.length },
            { value: 'loyalty', label: t('Loyalty') },
            { value: 'audience', label: t('Audience') },
            { value: 'sections', label: t('Sections') },
          ]}
        />
      </div>

      {tab === 'banners' && <BannersPanel engagement={engagement} />}
      {tab === 'popups' && <PopupsPanel engagement={engagement} />}
      {tab === 'loyalty' && <LoyaltyPanel engagement={engagement} />}
      {tab === 'audience' && <AudiencePanel engagement={engagement} />}
      {tab === 'sections' && <Sections />}
    </>
  );
}

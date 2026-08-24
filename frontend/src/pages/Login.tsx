import { useState } from 'react';
import Button from '../components/ui/Button';
import { useAuth } from '../state/AuthContext';
import { API_BASE_URL } from '../services/apiClient';
import { REGIONS, ZONES } from '../data/geography';

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}

/** Message per failure code — section 10: errors give the fix. */
function readError(code?: string, message?: string): string {
  switch (code) {
    case 'AUTH_INVALID_CREDENTIALS':
      return 'That email and password do not match. Check both and try again.';
    case 'ACCOUNT_SUSPENDED':
      return 'This account is suspended. A super admin has to restore it.';
    case 'NETWORK_ERROR':
      return `Could not reach the admin API at ${API_BASE_URL}. Check the connection, or continue with sample data.`;
    case 'VALIDATION_FAILED':
      return 'Enter a valid email address and a password.';
    case 'INTERNAL_SERVER_ERROR':
      // The deployed API answers 500 to any request from an origin outside its
      // allowlist, so this is far more often a configuration problem than a
      // genuine server fault. Say what to check.
      return 'The server rejected this request. If you are running the console '
        + 'locally, its origin has to be on the API allowlist.';
    default:
      return message || 'Sign in did not work. Try again.';
  }
}

export default function Login() {
  const { login, useSampleData } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password to sign in.');
      return;
    }
    setBusy(true);
    setError('');
    const result = await login(email.trim(), password);
    setBusy(false);
    if (!result.success) setError(readError(result.code, result.message));
  }

  const field = (name: string): React.CSSProperties => ({
    width: '100%',
    height: 42,
    borderRadius: 'var(--r-ctrl)',
    border: `1px solid ${focused === name ? 'var(--emerald)' : 'var(--line)'}`,
    boxShadow: focused === name ? '0 0 0 3px var(--focus-ring)' : 'none',
    background: 'var(--card)',
    color: 'var(--text)',
    fontFamily: 'var(--sans)',
    fontSize: 13,
    padding: '0 12px',
    outline: 'none',
    transition: 'border-color 160ms, box-shadow 160ms',
  });

  const label: React.CSSProperties = {
    display: 'block',
    fontSize: 11.5,
    fontWeight: 700,
    color: 'var(--text-2)',
    marginBottom: 6,
  };

  return (
    // Layout lives in layout.css, not inline: an inline grid-template-columns
    // would outrank the breakpoint that turns this into two columns.
    <div className="reeyo-login">
      {/* Brand panel — hidden below 860px so the form owns small screens */}
      <aside className="reeyo-login-brand">
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: -140, left: -90, width: 460, height: 340,
            background: 'radial-gradient(circle, rgba(0,191,99,.34) 0%, transparent 62%)',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 11 }}>
          <img
            src="/logo.svg" alt=""
            style={{ width: 34, height: 34, borderRadius: 9 }}
          />
          <span
            style={{
              color: 'var(--on-brand)', fontSize: 21, fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            reeyo
          </span>
        </div>

        <div style={{ position: 'relative', maxWidth: 380 }}>
          <h2
            style={{
              margin: 0, color: 'var(--on-brand)', fontSize: 27, fontWeight: 800,
              letterSpacing: '-0.03em', lineHeight: 1.25,
            }}
          >
            Everything moving across Cameroon, on one screen.
          </h2>
          <p
            style={{
              margin: '13px 0 0', color: 'var(--on-dark-1)',
              fontSize: 13.5, lineHeight: 1.6,
            }}
          >
            Food, grocery and parcel orders, the rider fleet, and every franc
            owed — across every region reeyo runs in, from the moment an order
            lands to the moment a payout clears.
          </p>

          <div style={{ display: 'flex', gap: 22, marginTop: 26, flexWrap: 'wrap' }}>
            {[
              ['Regions', String(REGIONS.length)],
              ['Delivery zones', String(ZONES.length)],
              ['Stages tracked', '7'],
            ].map(([k, v]) => (
              <div key={k}>
                <div
                  className="mono"
                  style={{ color: 'var(--mint)', fontSize: 20, fontWeight: 600 }}
                >
                  {v}
                </div>
                <div className="eyebrow" style={{ color: 'var(--on-dark-2)', marginTop: 2 }}>
                  {k}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p
          style={{
            position: 'relative', margin: 0,
            color: 'var(--on-dark-2)', fontSize: 11.5,
          }}
        >
          Operations console · Cameroon
        </p>
      </aside>

      {/* Form panel */}
      <main
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ width: '100%', maxWidth: 372 }}>
          {/* Logo repeats here for the narrow layout, where the panel is hidden */}
          <div className="reeyo-login-mark">
            <img src="/logo.svg" alt="" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span
              style={{
                fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em',
                color: 'var(--forest)',
              }}
            >
              reeyo
            </span>
          </div>

          <h1
            style={{
              margin: 0, fontSize: 26, fontWeight: 800,
              letterSpacing: '-0.03em', color: 'var(--forest)',
            }}
          >
            Sign in
          </h1>
          <p style={{ margin: '7px 0 24px', fontSize: 13, color: 'var(--text-2)' }}>
            Use the admin account issued for the reeyo platform.
          </p>

          <form onSubmit={submit} noValidate>
            <div style={{ marginBottom: 14 }}>
              <label htmlFor="email" style={label}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                autoComplete="username"
                autoFocus
                placeholder="you@reeyo.com"
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                style={field('email')}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label htmlFor="password" style={label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={reveal ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  placeholder="Your password"
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  style={{ ...field('password'), paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  aria-label={reveal ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: 4, top: 4,
                    width: 34, height: 34, borderRadius: 8,
                    border: 'none', background: 'none', cursor: 'pointer',
                    color: 'var(--text-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <EyeIcon off={reveal} />
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  margin: '0 0 16px', padding: '10px 12px',
                  background: 'var(--stop-soft)', color: 'var(--stop)',
                  borderRadius: 'var(--r-ctrl)', fontSize: 12.5, lineHeight: 1.5,
                }}
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={busy}
              style={{ width: '100%', height: 42 }}
            >
              {busy ? 'Signing in' : 'Sign in'}
            </Button>
          </form>

          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              margin: '22px 0 16px',
            }}
          >
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span className="eyebrow">or</span>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          {/* Explicit, never automatic: the console only shows seed data when
              someone chooses it here, and says so on every page afterwards. */}
          <Button
            variant="outline"
            onClick={useSampleData}
            style={{ width: '100%', height: 42 }}
          >
            Explore with sample data
          </Button>
          <p
            style={{
              margin: '10px 0 0', fontSize: 11.5,
              color: 'var(--text-3)', lineHeight: 1.5,
            }}
          >
            Sample data is local to this browser. Nothing you change is saved,
            and every screen is labelled while you are in it.
          </p>
        </div>
      </main>
    </div>
  );
}

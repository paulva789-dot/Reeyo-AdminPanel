import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Segments from '../../components/ui/Segments';
import Field, { TextArea } from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import { useAppState } from '../../state/useAppState';
import { useAuth } from '../../state/useAuth';
import { platform } from '../../services/platformResources';
import { ApiError } from '../../services/apiClient';

type Audience = 'users' | 'vendors' | 'riders';

const AUDIENCE: Record<Audience, { label: string; who: string }> = {
  users: { label: 'Customers', who: 'every customer with the app installed' },
  vendors: { label: 'Vendors', who: 'every vendor on the platform' },
  riders: { label: 'Riders', who: 'every rider on the platform' },
};

/** A send made in this session. The API keeps no history the console can read back. */
interface Sent {
  id: number;
  audience: Audience;
  title: string;
  body: string;
  at: string;
}

let sentSeq = 0;

export default function BroadcastPanel() {
  const { pushToast } = useAppState();
  const { mode } = useAuth();
  const isLive = mode === 'live';

  const [audience, setAudience] = useState<Audience>('users');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Sent[]>([]);

  const send = async () => {
    setSending(true);
    try {
      if (isLive) await platform.broadcast(audience, title.trim(), body.trim());
      setSent((prev) => [{
        id: ++sentSeq,
        audience,
        title: title.trim(),
        body: body.trim(),
        at: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      }, ...prev]);
      pushToast(
        isLive
          ? `Push sent to ${AUDIENCE[audience].label.toLowerCase()}`
          : 'Nothing was sent — sample mode has no push service',
      );
      setTitle('');
      setBody('');
      setConfirming(false);
    } catch (err) {
      setConfirming(false);
      setError(
        err instanceof ApiError
          ? `The push was not sent — ${err.message}`
          : 'The push was not sent.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="reeyo-split-even">
        <Card title="Compose a push">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div>
              <span
                style={{
                  display: 'block', fontSize: 11.5, fontWeight: 700,
                  color: 'var(--text-2)', marginBottom: 6,
                }}
              >
                Audience
              </span>
              <Segments
                ariaLabel="Choose who receives this push"
                value={audience}
                onChange={(v) => { setAudience(v as Audience); setError(''); }}
                segments={(Object.keys(AUDIENCE) as Audience[])
                  .map((key) => ({ value: key, label: AUDIENCE[key].label }))}
              />
              <p style={{ margin: '7px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
                Goes to {AUDIENCE[audience].who}. The API takes an id list to
                narrow it; this console does not send one, so there is no
                partial audience to mistake for a full one.
              </p>
            </div>

            <Field
              label="Title"
              value={title}
              onChange={(v) => { setTitle(v); setError(''); }}
              placeholder="Free delivery this Friday"
            />
            <TextArea
              label="Message"
              value={body}
              onChange={(v) => { setBody(v); setError(''); }}
              placeholder="In Molyko and Great Soppo, all day, no code needed."
              rows={4}
            />

            {error && (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--stop)' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
              <FooterSpacer />
              <Button
                variant="primary"
                onClick={() => {
                  if (!title.trim()) {
                    setError('A push needs a title — it is the line people see');
                    return;
                  }
                  if (!body.trim()) {
                    setError('Say what you want them to know');
                    return;
                  }
                  setError('');
                  setConfirming(true);
                }}
              >
                Review and send
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Sent from this session">
          {sent.length === 0 ? (
            <EmptyState
              heading="Nothing sent yet"
              line="The admin API keeps no push history the console can read back, so this
                lists only what you send from here, and only until you reload."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {sent.map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: 'var(--card)', border: '1px solid var(--line)',
                    borderRadius: 'var(--r-card)', padding: '11px 13px',
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--forest)' }}>
                    {s.title}
                  </div>
                  <p style={{ margin: '4px 0 8px', fontSize: 12, color: 'var(--text-2)' }}>
                    {s.body}
                  </p>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      fontSize: 11, color: 'var(--text-3)',
                    }}
                  >
                    <span>{AUDIENCE[s.audience].label}</span>
                    <FooterSpacer />
                    <span className="mono">{s.at}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {confirming && (
        <Modal
          title="Send this push"
          subtitle={`To ${AUDIENCE[audience].who}`}
          onClose={() => setConfirming(false)}
          width={470}
          footer={(
            <>
              <FooterSpacer />
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Keep editing
              </Button>
              <Button variant="primary" disabled={sending} onClick={() => void send()}>
                {sending ? 'Sending…' : 'Send now'}
              </Button>
            </>
          )}
        >
          <div
            style={{
              padding: '12px 14px', borderRadius: 'var(--r-ctrl)',
              background: 'var(--canvas)', border: '1px solid var(--line)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}>{title}</div>
            <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--text-2)' }}>{body}</p>
          </div>
          <p style={{ margin: '13px 0 0', fontSize: 12.5, color: 'var(--text-2)' }}>
            {isLive
              ? `This reaches every device at once and cannot be recalled. There is no
                 scheduling and no draft — sending is immediate.`
              : `Sample mode has no push service behind it, so nothing will leave the
                 console. It will only be listed on the right.`}
          </p>
        </Modal>
      )}
    </>
  );
}

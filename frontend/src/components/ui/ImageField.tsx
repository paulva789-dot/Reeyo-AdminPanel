import { useState, useRef } from 'react';
import { platform } from '../../services/platformResources';
import { ApiError } from '../../services/apiClient';
import { useAuth } from '../../state/useAuth';
import Button from './Button';

interface ImageFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

/** What POST /uploads accepts — checked here so a rejection is instant, not a round trip. */
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Picks an image for anything with an `image_url`.
 *
 * `POST /uploads` hands back a URL to paste into the field, so this uploads and
 * then stores that URL. In sample mode there is nowhere to upload to, and it
 * says so rather than pretending the file went somewhere.
 */
export default function ImageField({ label, value, onChange }: ImageFieldProps) {
  const { mode } = useAuth();
  const isLive = mode === 'live';
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async (file: File) => {
    if (!TYPES.includes(file.type)) {
      setError('Images must be JPEG, PNG or WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('The platform accepts images up to 5 MB.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const res = await platform.upload(file);
      const url = (res.data as { url?: string } | null)?.url;
      if (!url) throw new Error('The upload returned no URL.');
      onChange(url);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `Upload failed — ${err.message}`
          : 'Upload failed. The image was not saved.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span
        style={{
          display: 'block', fontSize: 11.5, fontWeight: 700,
          color: 'var(--text-2)', marginBottom: 6,
        }}
      >
        {label}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {value ? (
          <img
            src={value}
            alt=""
            style={{
              width: 64, height: 44, objectFit: 'cover',
              borderRadius: 8, border: '1px solid var(--line)', flexShrink: 0,
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{
              width: 64, height: 44, borderRadius: 8, flexShrink: 0,
              background: 'var(--calm-soft)', border: '1px solid var(--line)',
            }}
          />
        )}

        <input
          ref={input}
          type="file"
          accept={TYPES.join(',')}
          aria-label={label}
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void send(file);
            e.target.value = '';
          }}
        />

        <Button
          variant="outline"
          disabled={busy || !isLive}
          title={isLive ? undefined : 'Uploads need a live session'}
          onClick={() => input.current?.click()}
        >
          {busy ? 'Uploading…' : value ? 'Replace' : 'Choose image'}
        </Button>

        {value && (
          <Button variant="soft" onClick={() => onChange(null)}>Remove</Button>
        )}
      </div>

      {!isLive && (
        <p style={{ margin: '7px 0 0', fontSize: 11, color: 'var(--text-3)' }}>
          Sample mode has nowhere to upload to. Sign in against the live API to
          add an image.
        </p>
      )}
      {error && (
        <p style={{ margin: '7px 0 0', fontSize: 11.5, color: 'var(--stop)' }}>{error}</p>
      )}
    </div>
  );
}

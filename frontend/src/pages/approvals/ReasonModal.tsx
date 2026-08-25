import { useState } from 'react';
import Button from '../../components/ui/Button';
import { TextArea } from '../../components/ui/Field';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';

interface ReasonModalProps {
  title: string;
  subtitle: string;
  /** What the applicant will do with this text — shown above the box. */
  explain: string;
  placeholder: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/**
 * Every rejection on this page has to carry a reason — the API requires one and
 * the applicant reads it. Rather than repeat the same modal three times, the
 * queues share this one.
 */
export default function ReasonModal({
  title, subtitle, explain, placeholder, confirmLabel,
  cancelLabel = 'Keep waiting', onConfirm, onClose,
}: ReasonModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      width={470}
      footer={(
        <>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!reason.trim()) {
                setError('A reason is required — say what has to change');
                return;
              }
              onConfirm(reason.trim());
            }}
          >
            {confirmLabel}
          </Button>
        </>
      )}
    >
      <p style={{ margin: '0 0 13px', fontSize: 12.5, color: 'var(--text-2)' }}>{explain}</p>
      <TextArea
        label="Reason"
        value={reason}
        onChange={(v) => { setReason(v); setError(''); }}
        placeholder={placeholder}
        rows={3}
      />
      {error && (
        <p style={{ margin: '9px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

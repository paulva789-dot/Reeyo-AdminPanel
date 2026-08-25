import { useState } from 'react';
import Button from '../../components/ui/Button';
import Pill from '../../components/ui/Pill';
import { TextArea } from '../../components/ui/Field';
import { Modal, FooterSpacer } from '../../components/ui/Overlay';
import type { PendingRider, RiderDocument, RiderDocumentType } from '../../data/types';
import type { DocumentVerdict } from '../../services/platformResources';
import { DOCUMENT_LABEL, DOCUMENT_NOTE, reviewed } from './riderDocs';

interface DocumentReviewProps {
  rider: PendingRider;
  onSubmit: (decisions: DocumentVerdict[]) => void;
  onClose: () => void;
}

/** A decision taken in this sitting, before it is sent. */
type Draft = { status: 'APPROVED' | 'REJECTED'; reason: string };

function DocumentRow({
  doc, draft, onDraft,
}: {
  doc: RiderDocument;
  draft: Draft | undefined;
  onDraft: (next: Draft | undefined) => void;
}) {
  const missing = !doc.url;
  // What the row currently says: this sitting's draft wins over what was stored.
  const shown = draft
    ? (draft.status === 'APPROVED' ? 'approved' : 'rejected')
    : doc.status;

  return (
    <div
      style={{
        padding: '13px 0',
        borderTop: '1px solid var(--line-soft)',
        display: 'flex', flexDirection: 'column', gap: 9,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{DOCUMENT_LABEL[doc.type]}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
            {missing ? 'Not submitted — the rider has uploaded nothing here.' : DOCUMENT_NOTE[doc.type]}
          </div>
          {doc.reason && !draft && (
            <div style={{ fontSize: 11.5, color: 'var(--stop)', marginTop: 4 }}>
              Refused: {doc.reason}
            </div>
          )}
        </div>
        <Pill status={missing ? 'missing' : shown} token={missing ? 'stop' : undefined} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {doc.url && (
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, color: 'var(--emerald-ink)', fontWeight: 600 }}
          >
            Open file
          </a>
        )}
        <FooterSpacer />
        <Button
          variant={draft?.status === 'REJECTED' ? 'destructive' : 'soft'}
          onClick={() => onDraft(
            draft?.status === 'REJECTED' ? undefined : { status: 'REJECTED', reason: '' },
          )}
        >
          Refuse
        </Button>
        <Button
          variant={draft?.status === 'APPROVED' ? 'primary' : 'soft'}
          disabled={missing}
          title={missing ? 'Nothing was uploaded to accept' : undefined}
          onClick={() => onDraft(
            draft?.status === 'APPROVED' ? undefined : { status: 'APPROVED', reason: '' },
          )}
        >
          Accept
        </Button>
      </div>

      {draft?.status === 'REJECTED' && (
        <TextArea
          label="Why it was refused"
          value={draft.reason}
          onChange={(v) => onDraft({ status: 'REJECTED', reason: v })}
          placeholder="The expiry date is not legible."
          rows={2}
        />
      )}
    </div>
  );
}

/**
 * KYC review for one rider.
 *
 * Verifying documents deliberately does not approve the rider — the API treats
 * that as a separate act, and so does this screen: the footer says so, and
 * approving stays on the queue row behind "every document reviewed".
 */
export default function DocumentReview({ rider, onSubmit, onClose }: DocumentReviewProps) {
  const [drafts, setDrafts] = useState<Partial<Record<RiderDocumentType, Draft>>>({});
  const [error, setError] = useState('');

  const entries = Object.entries(drafts) as [RiderDocumentType, Draft][];
  const missingReason = entries.some(([, d]) => d.status === 'REJECTED' && !d.reason.trim());

  const setDraft = (type: RiderDocumentType, next: Draft | undefined) => {
    setError('');
    setDrafts((prev) => {
      const copy = { ...prev };
      if (next) copy[type] = next;
      else delete copy[type];
      return copy;
    });
  };

  const done = reviewed(rider.documents);

  return (
    <Modal
      title="Rider documents"
      subtitle={`${rider.name} · ${rider.vehicle} ${rider.plate}`}
      onClose={onClose}
      width={560}
      footer={(
        <>
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
            {done} of {rider.documents.length} reviewed
          </span>
          <FooterSpacer />
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            variant="primary"
            disabled={entries.length === 0}
            onClick={() => {
              if (missingReason) {
                setError('Every refusal needs a reason — the rider sees it');
                return;
              }
              onSubmit(entries.map(([document_type, d]) => ({
                document_type,
                status: d.status,
                ...(d.status === 'REJECTED' ? { reason: d.reason.trim() } : null),
              })));
              onClose();
            }}
          >
            {entries.length === 0
              ? 'Record decisions'
              : `Record ${entries.length} decision${entries.length === 1 ? '' : 's'}`}
          </Button>
        </>
      )}
    >
      <p style={{ margin: '0 0 4px', fontSize: 12.5, color: 'var(--text-2)' }}>
        Recording decisions here does not approve the rider. Once every document
        has been accepted, approve them from the queue.
      </p>

      {rider.documents.map((doc) => (
        <DocumentRow
          key={doc.type}
          doc={doc}
          draft={drafts[doc.type]}
          onDraft={(next) => setDraft(doc.type, next)}
        />
      ))}

      {error && (
        <p style={{ margin: '11px 0 0', fontSize: 12, color: 'var(--stop)' }}>{error}</p>
      )}
    </Modal>
  );
}

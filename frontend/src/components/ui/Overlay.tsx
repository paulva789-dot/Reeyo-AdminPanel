import { useEffect } from 'react';
import { CloseIcon } from '../layout/icons';

function useEscape(onClose: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
}

/** The shared veil — var(--veil) with 3px blur, section 5.6. */
function Veil({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'var(--veil)', backdropFilter: 'blur(3px)',
      }}
    />
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close"
      style={{
        width: 30, height: 30, borderRadius: 'var(--r-ctrl)',
        border: '1px solid var(--line)', background: 'var(--card)',
        color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <CloseIcon size={16} />
    </button>
  );
}

interface OverlayProps {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Drawer — inspecting something that exists. 530px, slides from the right,
 * 280ms cubic-bezier(.3,.9,.3,1). Section 5.6.
 */
export function Drawer({ title, subtitle, onClose, footer, children }: OverlayProps) {
  useEscape(onClose);

  return (
    <>
      <Veil onClose={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="reeyo-drawer"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 61,
          width: 530, maxWidth: '100vw',
          background: 'var(--canvas)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-18px 0 44px -24px rgba(6,56,49,.42)',
        }}
      >
        <header
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '16px 18px', background: 'var(--card)',
            borderBottom: '1px solid var(--line)', flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: 0, fontSize: 17, fontWeight: 800,
                letterSpacing: '-0.02em', color: 'var(--forest)',
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 3 }}>
                {subtitle}
              </div>
            )}
          </div>
          <CloseButton onClose={onClose} />
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>{children}</div>

        {footer && (
          <footer
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '13px 18px', background: 'var(--card)',
              borderTop: '1px solid var(--line)', flexShrink: 0,
              flexWrap: 'wrap',
            }}
          >
            {footer}
          </footer>
        )}
      </aside>
    </>
  );
}

/**
 * Modal — creating something new, or confirming something irreversible.
 * 570px, max-height 88vh, 18px radius, 200ms scale .98 -> 1. Section 5.6.
 */
export function Modal({
  title, subtitle, onClose, footer, children, width = 570,
}: OverlayProps & { width?: number }) {
  useEscape(onClose);

  return (
    <>
      <Veil onClose={onClose} />
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 61,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 18, pointerEvents: 'none',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="reeyo-modal"
          style={{
            width, maxWidth: '100%', maxHeight: '88vh',
            background: 'var(--canvas)', borderRadius: 18,
            display: 'flex', flexDirection: 'column', pointerEvents: 'auto',
            boxShadow: '0 26px 64px -22px rgba(6,56,49,.45)',
            overflow: 'hidden',
          }}
        >
          <header
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '16px 18px', background: 'var(--card)',
              borderBottom: '1px solid var(--line)', flexShrink: 0,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin: 0, fontSize: 16, fontWeight: 800,
                  letterSpacing: '-0.02em', color: 'var(--forest)',
                }}
              >
                {title}
              </h2>
              {subtitle && (
                <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 3 }}>
                  {subtitle}
                </div>
              )}
            </div>
            <CloseButton onClose={onClose} />
          </header>

          <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>{children}</div>

          {footer && (
            <footer
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '13px 18px', background: 'var(--card)',
                borderTop: '1px solid var(--line)', flexShrink: 0, flexWrap: 'wrap',
              }}
            >
              {footer}
            </footer>
          )}
        </div>
      </div>
    </>
  );
}

/** Pushes the primary action to the right: destructive · neutral · primary. */
export function FooterSpacer() {
  return <div style={{ flex: 1 }} />;
}

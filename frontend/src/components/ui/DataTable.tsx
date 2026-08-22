import type { CSSProperties } from 'react';
import EmptyState from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  /** Figures are right-aligned mono with tabular numerals — section 5.4. */
  align?: 'left' | 'right';
  width?: number | string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: { heading: string; line: string; action?: React.ReactNode };
  minWidth?: number;
}

const TH: CSSProperties = {
  background: 'var(--table-head)',
  fontFamily: 'var(--mono)',
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-2)',
  padding: '9px 15px',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

/** Section 5.4 — 44px rows, --line-soft dividers, horizontal scroll container. */
export default function DataTable<T>({
  columns, rows, rowKey, onRowClick, empty, minWidth = 660,
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) {
    return <EmptyState heading={empty.heading} line={empty.line} action={empty.action} />;
  }

  return (
    <div style={{ overflowX: 'auto', margin: -16 }}>
      <table
        style={{
          width: '100%', minWidth, borderCollapse: 'collapse', fontSize: 13,
        }}
      >
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  ...TH,
                  textAlign: c.align === 'right' ? 'right' : 'left',
                  width: c.width,
                }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className="reeyo-row"
              style={{
                borderBottom: i === rows.length - 1
                  ? 'none' : '1px solid var(--line-soft)',
                cursor: onRowClick ? 'pointer' : 'default',
                height: 44,
              }}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  style={{
                    padding: '12px 15px',
                    textAlign: c.align === 'right' ? 'right' : 'left',
                    color: 'var(--text)',
                    verticalAlign: 'middle',
                  }}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Toolbar above a table: title, mono count, filter pushed right — section 5.4. */
export function TableToolbar({
  title, count, children,
}: { title: string; count?: number; children?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 14, flexWrap: 'wrap',
      }}
    >
      <h2
        style={{
          margin: 0, fontSize: 14, fontWeight: 800,
          letterSpacing: '-0.02em', color: 'var(--forest)',
        }}
      >
        {title}
      </h2>
      {count !== undefined && (
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {count}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }} />
      {children}
    </div>
  );
}

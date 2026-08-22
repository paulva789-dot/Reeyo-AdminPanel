interface PageTitleProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
}

/** Page title: 26px / 800 / −3% tracking, --forest. One per screen — section 4. */
export default function PageTitle({ children, actions }: PageTitleProps) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, marginBottom: 18, flexWrap: 'wrap',
      }}
    >
      <h1
        style={{
          margin: 0, fontSize: 26, fontWeight: 800,
          letterSpacing: '-0.03em', color: 'var(--forest)',
        }}
      >
        {children}
      </h1>
      {actions}
    </div>
  );
}

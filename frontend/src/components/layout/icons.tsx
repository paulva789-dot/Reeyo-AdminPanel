// Hand-written inline SVG. No icon library — section 1.
// 17px stroke icons for the rail; the topbar uses the same set at its own size.

interface IconProps {
  size?: number;
  className?: string;
}

function Svg({ size = 17, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function OverviewIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="11" width="7" height="10" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </Svg>
  );
}

export function OrdersIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 2h9l4 4v16H6z" />
      <path d="M15 2v4h4" />
      <path d="M9.5 12h6M9.5 16h6" />
    </Svg>
  );
}

export function DispatchIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="10" r="3" />
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
    </Svg>
  );
}

export function VendorsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 9l1.6-5h14.8L21 9" />
      <path d="M4 9h16v11H4z" />
      <path d="M9 20v-6h6v6" />
    </Svg>
  );
}

export function RidersIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="5.5" cy="17" r="3.2" />
      <circle cx="18.5" cy="17" r="3.2" />
      <path d="M5.5 17l4-8h5l3.9 8" />
      <path d="M12 5h3.5" />
    </Svg>
  );
}

export function CustomersIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
      <path d="M16.5 5.2a3.4 3.4 0 0 1 0 6.6" />
      <path d="M18 14.6a6.2 6.2 0 0 1 3.2 5.4" />
    </Svg>
  );
}

export function StorefrontIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 13h8" />
    </Svg>
  );
}

export function MarketingIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 10v4a1 1 0 0 0 1 1h3l5 4V5L9 9H5a1 1 0 0 0-1 1z" />
      <path d="M17.5 8.5a5 5 0 0 1 0 7" />
    </Svg>
  );
}

export function PaymentsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
      <path d="M2.5 10h19" />
      <path d="M6.5 15h3" />
    </Svg>
  );
}

export function AnalyticsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </Svg>
  );
}

export function SettingsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1z" />
    </Svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </Svg>
  );
}

export function BellIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7z" />
      <path d="M13.7 20a2 2 0 0 1-3.4 0" />
    </Svg>
  );
}

export function RefreshIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20.5 11a8.5 8.5 0 1 0-.9 5" />
      <path d="M20.5 20v-5h-5" />
    </Svg>
  );
}

export function PinIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="10" r="2.6" />
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
    </Svg>
  );
}

export function MenuIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </Svg>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

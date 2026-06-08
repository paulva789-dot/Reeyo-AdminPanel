# Folder Structure — Reeyo Admin Panel

Root level overview
-------------------

```
Reeyo-AdminPanel/
├── frontend/                 # Main React + Vite application
│   ├── src/                  # Application source code
│   ├── supabase/             # Database migrations and configs
│   ├── package.json          # Dependencies and scripts
│   ├── vite.config.ts        # Vite build configuration
│   ├── tailwind.config.js    # Tailwind CSS customization
│   ├── eslint.config.js      # Code linting rules
│   ├── tsconfig.json         # TypeScript configuration
│   └── index.html            # Entry point for browser
├── docs/                     # Documentation files
└── README.md                 # Project overview
```

src/ - Source code directory
==============================

Main application files that handle routing, styling, and component rendering.

### src/index.css
- Global styles and Tailwind CSS imports
- Base typography and spacing definitions
- Used by all pages and components

### src/main.jsx
- React application entry point
- Mounts the App component to the DOM
- Sets up React DOM rendering

### src/App.jsx
- Root React component
- Configures main routes and layout wrapper
- Integrates context providers and themes

### src/components/
**Reusable UI components shared across pages**

- `layout/` — wrapper components (Header, Sidebar, Footer)
- `routing/` — router configuration components
- `ThemeToggle.jsx` — dark/light mode switcher

**Usage:** Import components in pages and other components for consistent UI.

```jsx
import { Header } from '@/components/layout/Header';
```

### src/pages/
**Page-level components mapped to routes**

Each folder represents a major section:

- `Announcements/` — broadcast messages to riders/users
- `Auth/` — login, registration, password recovery
- `CMS/` — content management (pages, banners, menus)
- `DashboardOverview.jsx` — main dashboard with stats and widgets
- `Finance/` — payments, transactions, wallets, settlements
- `Logistics/` — delivery zones, routes, performance tracking
- `Orders/` — order management, history, cancellations
- `Settings/` — admin settings, configurations
- `Users/` — user accounts, vendors, riders management

**Usage:** Pages are rendered via React Router based on URL.

### src/context/
**Global state management using React Context API**

- `AuthContext.jsx` — stores user login state, tokens, permissions
- `ThemeContext.jsx` — manages dark/light mode preference

**Usage:** Wrap components with providers in App.jsx, access with useContext().

```jsx
const { user, login } = useContext(AuthContext);
```

### src/data/
**Mock data and static configuration files**

- `announcementMocks.js` — sample announcements for UI testing
- `customerMocks.js` — fake user/customer records
- `financeMocks.js` — sample transactions and payments
- `menuApprovalMocks.js` — mock menu data for vendors
- `sidebarNav.js` — sidebar menu structure and links
- `trackingMocks.js` — sample delivery tracking data
- `zoneMocks.js` — geographic zone boundaries

**Usage:** Replaced with real API calls in production.

```jsx
import { announcementMocks } from '@/data/announcementMocks';
```

### src/lib/
**Utility libraries and API integrations**

- `supabase.js` — Supabase client initialization for DB/auth

**Usage:** Import to authenticate or query databases.

supabase/ - Database folder
============================

- `migrations/` — SQL migration files for database schema changes
- Run migrations to set up or update the database structure

Configuration files (root)
==========================

- `eslint.config.js` — code linting rules (checks for errors)
- `tailwind.config.js` — custom CSS utilities and theme extensions
- `tsconfig.json` — TypeScript compiler settings
- `vite.config.ts` — build tool config, plugins, optimizations
- `package.json` — npm dependencies, scripts, metadata
- `index.html` — HTML template for Vite

Development workflow
====================

1. Edit a component in `src/components/` or `src/pages/`
2. Styles from `index.css` and `tailwind.config.js` apply automatically
3. Context from `src/context/` is available via hooks
4. Data comes from `src/data/` (mock) or API
5. Vite hot-reloads the browser

Key patterns
============

**Component structure:**

```
src/components/layout/
├── Header.jsx         # Navigation bar
├── Sidebar.jsx        # Left menu
└── Footer.jsx         # Bottom section
```

**Page structure:**

```
src/pages/Orders/
├── OrderList.jsx      # List all orders
├── OrderDetail.jsx    # View single order
└── OrderForm.jsx      # Create/edit order
```

**Context usage:**

```jsx
// In a component
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

function AdminPanel() {
  const { user } = useContext(AuthContext);
  return <h1>Welcome, {user.name}</h1>;
}
```

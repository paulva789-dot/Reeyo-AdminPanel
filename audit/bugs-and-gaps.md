# Concrete bugs found during this audit

These are independent of the mock-vs-real migration — they're functional defects in code that otherwise looks finished.

## 1. There is no way to sign out of the app (High)

`AuthContext` (`frontend/src/context/AuthContext.jsx:52-59`) exposes a working `logout()` that calls `POST /auth/logout` and clears local state. It is never called from anywhere in the UI:

```
$ grep -rn "logout|Sign Out|signOut" frontend/src
src/context/AuthContext.jsx:52:  const logout = useCallback(async () => {
src/context/AuthContext.jsx:80:    logout,
src/components/layout/Header.jsx:327:      <span>Sign Out</span>
```

`frontend/src/components/layout/Header.jsx:322-328` renders a "Sign Out" button in the profile dropdown, but it's a bare `<motion.button>` with **no `onClick` handler at all**, and the file doesn't even import `useAuth`. Clicking it does nothing. The two other items in that same dropdown ("My Profile", "Account Settings" — lines 305-318) are also unwired, but those don't have obviously-expected behavior the way Sign Out does.

**Impact:** an admin who logs in has no in-app way to end their session (short of clearing cookies manually or waiting out the session). Given the app just went through a real auth migration, this is very likely a leftover from before `AuthContext` existed, rather than an intentional gap.

**Fix:** in `Header.jsx`, import `useAuth`, call `logout()` (and probably `navigate('/login')` after) from the Sign Out button's `onClick`.

## 2. Header displays a hardcoded identity, not the logged-in admin (Medium)

`frontend/src/components/layout/Header.jsx:267-270` and `:294-299` hardcode:

```jsx
<p className="text-sm font-semibold text-gray-900">Super Admin</p>
<p className="text-xs text-gray-500">admin@reeyo.com</p>
```

in both the collapsed header and the expanded profile dropdown. `AuthContext` already exposes the real `admin` object (with `role`) and `isSuperAdmin` (`frontend/src/context/AuthContext.jsx:73-82`) — `Header.jsx` just never imports or reads it. Every logged-in admin, regardless of who they actually are or what role they hold, sees "Super Admin / admin@reeyo.com" in the header.

**Impact:** confusing/misleading UI (a non-super-admin might think they have super-admin privileges from the header alone, though the actual route guards in `ProtectedRoute.jsx` still correctly restrict them), and it's a visible tell that this component predates the real-auth migration.

**Fix:** read `admin` from `useAuth()` and render `admin?.name ?? admin?.email`, and derive the role label from `role`/`isSuperAdmin` instead of the literal string.

## 3. Chat feature is fully static — not a data-loading gap, a missing feature (Medium)

`frontend/src/pages/Chat/components/Chatwindow.jsx` and `ChatSideBar.jsx` import fixed arrays (`chatMessages`, `chatUsers`, `currentAdmin`) from `frontend/src/data/chatMocks.js` and never call `apiClient`. Sending a message, switching conversations, etc. only mutates in-memory mock state — nothing persists or reaches a backend. This isn't a bug relative to today's backend (per `docs/BACKEND_ENDPOINT_REQUESTS.md`, there are no chat endpoints yet), but it means the "Chat" nav item currently ships a UI that looks functional and isn't. Worth an explicit "Coming soon" treatment if it's going to stay unwired for a while, so it doesn't read as broken.

## 4. Forgot Password flow never contacts a server (Medium)

`frontend/src/pages/Auth/components/ForgotPasswordForm.jsx:23-37` — `handleSubmit` does a client-only `setTimeout`, a trivial regex-free "contains @ and ." check, and then always reports success with "We've sent a password reset link to {email}." No `apiClient` call exists here or anywhere else for a password-reset endpoint. An admin who forgets their password will see a convincing success screen and never receive an email, because none was ever requested.

**Fix:** either wire this to a real `/auth/forgot-password`-style endpoint once one exists on the backend, or replace the fake success state with an honest "this isn't available yet, contact your super admin" message — the current behavior actively misleads a locked-out admin.

## 5. Settings tabs reveal existence of super-admin-only sections to all admins (Low)

Covered in detail in [security.md](security.md). `frontend/src/pages/Settings/SettingsPage.jsx` renders the "Admin Users" and "API Keys" tabs for every admin; only navigating into them triggers the `RequireSuperAdmin` block. Not a data leak, just avoidable confusion — filter the tab list by `isSuperAdmin` before rendering.

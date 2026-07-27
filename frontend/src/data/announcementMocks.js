// src/data/announcementMocks.js
//
// Announcements themselves are now sent via the real /broadcast API (see
// AnnouncementsPage.jsx) — there is no backend endpoint for app version
// gating, so AppVersionControl.jsx still runs on local mock state until
// that endpoint exists.
export const appVersions = [
    { name: 'User App (iOS)', key: 'user_ios', latest: '2.5.1', minimum: '2.3.0' },
    { name: 'User App (Android)', key: 'user_android', latest: '2.5.1', minimum: '2.3.0' },
    { name: 'Rider App (Android)', key: 'rider_android', latest: '1.8.0', minimum: '1.6.5' },
    { name: 'Vendor App (Web/PWA)', key: 'vendor_web', latest: '3.0.0', minimum: '2.9.5' },
];

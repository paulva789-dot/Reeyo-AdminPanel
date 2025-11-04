// src/data/announcementMocks.js (Complete and Fixed)

export const initialAnnouncements = [
    {
        id: 'A001',
        title: 'Platform Maintenance Scheduled',
        content: '<p>Heads up! We have scheduled system maintenance on <strong>Tuesday at 2:00 AM WAT</strong>. The platform will be down for approximately 30 minutes.</p>',
        target: 'All Users',
        status: 'Scheduled',
        startDate: '2025-10-28',
        endDate: '2025-10-28',
        author: 'Admin',
    },
    {
        id: 'A002',
        title: 'New Delivery Zone Added',
        content: '<p>A new zone, <strong>Buea Central</strong>, has been activated! Riders in this area should see more order requests starting immediately.</p>',
        target: 'Riders Only',
        status: 'Active',
        startDate: '2025-10-20',
        endDate: '2025-11-20',
        author: 'Logistics Team',
    },
    {
        id: 'A003',
        title: 'Vendor Commission Review',
        content: '<p>Reminder: All vendors are invited to a virtual meeting to discuss the Q4 commission structure. Check your email for the Zoom link.</p>',
        target: 'Vendors Only',
        status: 'Ended',
        startDate: '2025-09-01',
        endDate: '2025-10-01',
        author: 'Finance Team',
    },
];

export const generateAnnouncementId = () => `A${Math.floor(1000 + Math.random() * 9000)}`;

// FIX: Added the 'appVersions' array needed by AppVersionControl.jsx
export const appVersions = [
    { name: 'User App (iOS)', key: 'user_ios', latest: '2.5.1', minimum: '2.3.0' },
    { name: 'User App (Android)', key: 'user_android', latest: '2.5.1', minimum: '2.3.0' },
    { name: 'Rider App (Android)', key: 'rider_android', latest: '1.8.0', minimum: '1.6.5' },
    { name: 'Vendor App (Web/PWA)', key: 'vendor_web', latest: '3.0.0', minimum: '2.9.5' },
];


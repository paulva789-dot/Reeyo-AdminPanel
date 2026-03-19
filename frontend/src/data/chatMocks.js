// Mock data for chat users grouped by user role.
export const chatUsers = {
  riders: [
    {
      id: "r1",
      name: "John Rider",
      avatar: "https://i.pravatar.cc/150?img=12",
      isOnline: true,
      lastMessage: "I’m close to the delivery point",
      lastMessageTime: "2026-03-18T09:45:00Z",
    },
    {
      id: "r2",
      name: "Michael Speed",
      avatar: "https://i.pravatar.cc/150?img=15",
      isOnline: false,
      lastMessage: "Bike had an issue, resolved now",
      lastMessageTime: "2026-03-17T18:20:00Z",
    },
  ],

  vendors: [
    {
      id: "v1",
      name: "Mama’s Kitchen",
      avatar: "https://i.pravatar.cc/150?img=20",
      isOnline: true,
      lastMessage: "Menu updated for today",
      lastMessageTime: "2026-03-18T08:10:00Z",
    },
    {
      id: "v2",
      name: "Quick Bites",
      avatar: "https://i.pravatar.cc/150?img=25",
      isOnline: false,
      lastMessage: "We are out of stock on burgers",
      lastMessageTime: "2026-03-17T14:05:00Z",
    },
  ],

  customers: [
    {
      id: "c1",
      name: "Alice Johnson",
      avatar: "https://i.pravatar.cc/150?img=30",
      isOnline: true,
      lastMessage: "My order is delayed",
      lastMessageTime: "2026-03-18T10:05:00Z",
    },
    {
      id: "c2",
      name: "David Smith",
      avatar: "https://i.pravatar.cc/150?img=35",
      isOnline: false,
      lastMessage: "Thank you!",
      lastMessageTime: "2026-03-16T12:00:00Z",
    },
  ],
};

// Mock data for chat messages
export const chatMessages = {
  r1: [
    {
      id: "m1",
      senderId: "admin",
      content: "Hey John, are you on the way?",
      timestamp: "2026-03-18T09:40:00Z",
    },
    {
      id: "m2",
      senderId: "r1",
      content: "Yes, I’m heading there now",
      timestamp: "2026-03-18T09:42:00Z",
    },
    {
      id: "m3",
      senderId: "r1",
      content: "I’m close to the delivery point",
      timestamp: "2026-03-18T09:45:00Z",
    },
  ],

  v1: [
    {
      id: "m4",
      senderId: "admin",
      content: "Please confirm today's menu",
      timestamp: "2026-03-18T07:50:00Z",
    },
    {
      id: "m5",
      senderId: "v1",
      content: "Menu updated for today",
      timestamp: "2026-03-18T08:10:00Z",
    },
  ],

  c1: [
    {
      id: "m6",
      senderId: "c1",
      content: "My order is delayed",
      timestamp: "2026-03-18T10:05:00Z",
    },
    {
      id: "m7",
      senderId: "admin",
      content: "We’re checking it for you now",
      timestamp: "2026-03-18T10:07:00Z",
    },
  ],
};

// Mock data for admin and massage alignment
export const currentAdmin = {
  id: "admin",
  name: "Super Admin",
};

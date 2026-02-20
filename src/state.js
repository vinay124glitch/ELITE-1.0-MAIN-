// Multi-Tiered Storage Strategy
const DataStore = {
    savePersistent(key, data) {
        localStorage.setItem(`elite_${key}`, JSON.stringify(data));
    },
    loadPersistent(key, defaultVal) {
        const data = localStorage.getItem(`elite_${key}`);
        return data ? JSON.parse(data) : defaultVal;
    },
    saveSession(key, data) {
        sessionStorage.setItem(`elite_${key}`, JSON.stringify(data));
    },
    loadSession(key, defaultVal) {
        const data = sessionStorage.getItem(`elite_${key}`);
        return data ? JSON.parse(data) : defaultVal;
    }
};

const defaultEvents = [
    {
        id: 1,
        title: "Tech Summit 2024",
        description: "Annual technology conference featuring AI, Web3, and Cloud Computing tracks",
        date: "2024-03-15",
        time: "09:00",
        venue: "Convention Center, Hall A",
        type: "Conference",
        status: "active",
        maxParticipants: 500,
        registered: 342,
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop",
        schedule: [
            { time: "09:00", title: "Opening Keynote", speaker: "Dr. Sarah Chen" },
            { time: "10:30", title: "AI Workshop", speaker: "Team Alpha" },
            { time: "14:00", title: "Networking Session", speaker: "All Attendees" }
        ]
    },
    {
        id: 2,
        title: "Hackathon: Code for Good",
        description: "48-hour hackathon focused on solving social issues through technology",
        date: "2024-04-01",
        time: "10:00",
        venue: "Innovation Hub",
        type: "Hackathon",
        status: "upcoming",
        maxParticipants: 200,
        registered: 89,
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop",
        schedule: [
            { time: "10:00", title: "Kickoff", speaker: "Organizers" },
            { time: "12:00", title: "Team Formation", speaker: "Participants" },
            { time: "Day 2 10:00", title: "Demo Day", speaker: "Judges" }
        ]
    },
    {
        id: 3,
        title: "Design Sprint Workshop",
        description: "Intensive 3-day design thinking workshop for product teams",
        date: "2024-03-20",
        time: "13:00",
        venue: "Creative Studio, Room 302",
        type: "Workshop",
        status: "active",
        maxParticipants: 30,
        registered: 28,
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop",
        schedule: [
            { time: "13:00", title: "Empathy Mapping", speaker: "Lisa Park" },
            { time: "15:00", title: "Ideation Session", speaker: "All Teams" }
        ]
    }
];

const defaultTeams = [
    {
        id: 1,
        name: "Code Warriors",
        eventId: 2,
        members: [
            { id: 1, name: "Alex Johnson", role: "Team Lead", email: "alex@example.com" },
            { id: 2, name: "Maria Garcia", role: "Developer", email: "maria@example.com" }
        ],
        maxMembers: 4,
        inviteCode: "CW2024"
    },
    {
        id: 2,
        name: "Design Mavericks",
        eventId: 3,
        members: [
            { id: 3, name: "Sam Wilson", role: "Lead Designer", email: "sam@example.com" }
        ],
        maxMembers: 5,
        inviteCode: "DM2024"
    }
];

const defaultRegistrations = [
    { id: 1, eventId: 1, userId: 101, name: "John Doe", email: "john@example.com", status: "confirmed", checkIn: false, registrationDate: "2024-02-15" },
    { id: 2, eventId: 1, userId: 102, name: "Jane Smith", email: "jane@example.com", status: "confirmed", checkIn: true, registrationDate: "2024-02-16" },
    { id: 3, eventId: 2, userId: 101, name: "John Doe", email: "john@example.com", status: "pending", checkIn: false, registrationDate: "2024-02-18" }
];

const defaultNotifications = [
    { id: 1, title: "New Registration", message: "Alex Johnson registered for Tech Summit 2024", time: "5 min ago", read: false, type: "info" },
    { id: 2, title: "Team Invite", message: "You've been invited to join Code Warriors", time: "1 hour ago", read: false, type: "success" },
    { id: 3, title: "Event Reminder", message: "Tech Summit 2024 starts in 24 hours", time: "2 hours ago", read: true, type: "warning" }
];

export const state = new Proxy({
    currentUser: DataStore.loadPersistent('currentUser', null),
    events: DataStore.loadPersistent('events', []),
    registrations: DataStore.loadPersistent('registrations', []),
    teams: DataStore.loadPersistent('teams', []),
    notifications: DataStore.loadPersistent('notifications', []),
    users: DataStore.loadPersistent('users', []),
    currentView: 'dashboard',
    darkMode: DataStore.loadPersistent('darkMode', false),
    sidebarOpen: false,
    isLoading: true
}, {
    set(target, prop, value) {
        target[prop] = value;
        if (['currentUser', 'events', 'registrations', 'teams', 'notifications', 'darkMode', 'users'].includes(prop)) {
            DataStore.savePersistent(prop, value);
        }
        return true;
    }
});

import { state } from './state.js';
import { showToast } from './utils/ui.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
let pollInterval = null;

// Sync Collections from MongoDB via Backend API
export const initSync = (renderApp) => {
    if (pollInterval) return;

    console.log("🍃 MongoDB Sync: Initializing via API Polling...");

    const syncAll = async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            // Fetch Events
            const evRes = await fetch(`${API_URL}/events`, { signal: controller.signal });
            if (evRes.ok) state.events = await evRes.json();

            // Fetch Users
            const userRes = await fetch(`${API_URL}/users`, { signal: controller.signal });
            if (userRes.ok) state.users = await userRes.json();

            // Fetch Registrations
            const regRes = await fetch(`${API_URL}/registrations`, { signal: controller.signal });
            if (regRes.ok) state.registrations = await regRes.json();

            // Fetch Teams
            const teamRes = await fetch(`${API_URL}/teams`, { signal: controller.signal });
            if (teamRes.ok) state.teams = await teamRes.json();

            // Fetch Notifications
            const notifRes = await fetch(`${API_URL}/notifications`, { signal: controller.signal });
            if (notifRes.ok) state.notifications = await notifRes.json();

            clearTimeout(timeoutId);

            state.isLoading = false;
            if (renderApp) renderApp();
        } catch (error) {
            console.error("❌ MongoDB Sync Error:", error);
            state.isLoading = false;

            if (state.currentUser && !state.offlineAlertShown) {
                showToast("Cannot connect to server (backend offline).", "error");
                state.offlineAlertShown = true;
            }
            if (renderApp) renderApp();
        }
    };

    // Initial Fetch
    syncAll();

    // Poll every 5 seconds for all data (simulating real-time)
    pollInterval = setInterval(syncAll, 5000);
};

export const stopSync = () => {
    console.log("🛑 Stopping Sync...");
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = null;
};

// API Operations (Replacing Firestore Direct Access)
export const dbOps = {
    async addEvent(eventData) {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        const data = await response.json();
        return data.id;
    },
    async updateEvent(eventId, eventData) {
        await fetch(`${API_URL}/events/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
    },
    async deleteEvent(eventId) {
        await fetch(`${API_URL}/events/${eventId}`, {
            method: 'DELETE'
        });
    },
    async addRegistration(regData) {
        const response = await fetch(`${API_URL}/registrations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regData)
        });
        const data = await response.json();
        return data.id;
    },
    async updateRegistration(regId, regData) {
        await fetch(`${API_URL}/registrations/${regId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regData)
        });
    },
    async deleteRegistration(regId) {
        await fetch(`${API_URL}/registrations/${regId}`, {
            method: 'DELETE'
        });
    },
    async addTeam(teamData) {
        const response = await fetch(`${API_URL}/teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamData)
        });
        const data = await response.json();
        return data.id;
    },
    async updateTeam(teamId, teamData) {
        await fetch(`${API_URL}/teams/${teamId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamData)
        });
    },
    async addUser(userData) {
        // Map Firebase 'id' to MongoDB 'firebaseId'
        const payload = { ...userData, firebaseId: userData.id };
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await response.json();
    },
    async addNotification(notifData) {
        await fetch(`${API_URL}/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notifData)
        });
    }
};

import { state } from '../state.js';

export function renderParticipantDashboard() {
    const myRegistrations = state.registrations.filter(r => r.userId === state.currentUser?.id);
    const myTeamsCount = state.teams.filter(t => t.members.some(m => m.id === state.currentUser?.id)).length;

    // Get details for registered events
    const registeredEvents = myRegistrations.map(reg => {
        const event = state.events.find(e => e.id === reg.eventId);
        return { ...event, reg };
    });

    return `
        <div class="space-y-8 animate-fade-in">
            <!-- Personalized Welcome -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div class="relative z-10">
                    <h2 class="text-3xl font-black mb-2">Welcome, ${state.currentUser.name}!</h2>
                    <p class="text-blue-100 opacity-80">You have ${myRegistrations.length} active registrations and lead ${myTeamsCount} teams.</p>
                </div>
                <div class="absolute top-[-20px] right-[-20px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <!-- Individual Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                            <i class="fas fa-ticket-alt"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">My Tickets</p>
                            <p class="text-2xl font-bold">${myRegistrations.length}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                            <i class="fas fa-users"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Team Memberships</p>
                            <p class="text-2xl font-bold">${myTeamsCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Announcements -->
            <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div class="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 class="text-xl font-bold text-gray-800 dark:text-white">Recent Announcements</h3>
                </div>
                <div class="p-6 space-y-4">
                    ${state.notifications.length === 0 ? `
                        <p class="text-gray-500 text-center py-4">No announcements yet.</p>
                    ` : state.notifications.slice(0, 3).map(n => `
                        <div class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                            <h4 class="font-bold text-blue-600 dark:text-blue-400 mb-1">${n.title}</h4>
                            <p class="text-gray-600 dark:text-gray-300 text-sm">${n.message}</p>
                            <p class="text-[10px] text-gray-400 mt-2">${n.time}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Personal Schedule / My Events -->
            <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div class="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 class="text-xl font-bold text-gray-800 dark:text-white">My Upcoming Events</h3>
                </div>
                <div class="divide-y divide-gray-100 dark:divide-gray-700">
                    ${registeredEvents.length === 0 ? `
                        <div class="p-12 text-center">
                            <div class="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-calendar-plus text-gray-300 text-2xl"></i>
                            </div>
                            <p class="text-gray-500">You haven't registered for any events yet.</p>
                        </div>
                    ` : registeredEvents.map(event => `
                        <div class="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 card-hover">
                            <div class="flex items-center gap-4">
                                <img src="${event.image}" class="w-16 h-16 rounded-xl object-cover shadow-sm">
                                <div>
                                    <h4 class="font-bold text-gray-800 dark:text-white">${event.title}</h4>
                                    <div class="flex gap-3 mt-1 text-sm text-gray-500">
                                        <span class="flex items-center gap-1"><i class="fas fa-calendar"></i> ${event.date}</span>
                                        <span class="flex items-center gap-1"><i class="fas fa-map-marker-alt"></i> ${event.venue}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="window.downloadTicket(${event.id})" class="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold border border-blue-100 dark:border-blue-900/30">
                                    <i class="fas fa-download mr-1"></i> Ticket
                                </button>
                                <span class="px-4 py-2 bg-green-100/50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-bold border border-green-100 dark:border-green-900/30 flex items-center gap-1">
                                    <i class="fas fa-check-circle"></i> Confirmed
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

window.downloadTicket = (eventId) => {
    const reg = state.registrations.find(r => r.eventId === eventId && r.userId === state.currentUser?.id);
    const event = state.events.find(e => e.id === eventId);
    if (reg && event) {
        import('../utils/pdf.js').then(module => {
            module.generateTicketPDF(reg, event);
        });
    }
};

import { state } from '../state.js';
import { showToast } from '../utils/ui.js';
import { generateTicketPDF } from '../utils/pdf.js';

export function renderBrowseEvents() {
    return `
        <div class="space-y-6 animate-fade-in">
            <!-- Search & Filter -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="flex-1 relative">
                        <i class="fas fa-search absolute left-4 top-3.5 text-gray-400"></i>
                        <input type="text" id="searchEvents" placeholder="Search events..." 
                            class="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                    </div>
                </div>
            </div>
            
            <!-- Events Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="browseEventsGrid">
                ${state.events.map(event => {
        const isRegistered = state.registrations.some(r => r.eventId === event.id && r.userId === state.currentUser?.id);
        const spotsLeft = event.maxParticipants - event.registered;

        return `
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden card-hover flex flex-col">
                            <div class="relative h-48 overflow-hidden">
                                <img src="${event.image}" alt="${event.title}" class="w-full h-full object-cover">
                                <div class="absolute top-4 left-4">
                                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-white shadow-lg">
                                        ${event.type}
                                    </span>
                                </div>
                            </div>
                            <div class="p-6 flex-1 flex flex-col">
                                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">${event.title}</h3>
                                <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">${event.description}</p>
                                
                                <div class="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    <div class="flex items-center gap-2">
                                        <i class="fas fa-calendar-day text-blue-500"></i>
                                        <span>${event.date}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <i class="fas fa-map-marker-alt text-red-500"></i>
                                        <span>${event.venue}</span>
                                    </div>
                                </div>
                                
                                <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div class="flex justify-between items-center mb-3">
                                        <span class="text-sm text-gray-600 dark:text-gray-400">${event.registered} registered</span>
                                        <span class="text-sm font-bold ${spotsLeft < 20 ? 'text-red-600' : 'text-green-600'}">${spotsLeft} spots left</span>
                                    </div>
                                    <button onclick="window.registerForEvent(${event.id})" 
                                        class="w-full py-2 rounded-lg font-medium transition-all ${isRegistered ? 'bg-green-100 text-green-700 cursor-default' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}">
                                        ${isRegistered ? '<i class="fas fa-check mr-2"></i>Registered' : 'Register Now'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

window.registerForEvent = (eventId) => {
    const isRegistered = state.registrations.some(r => r.eventId === eventId && r.userId === state.currentUser?.id);
    if (isRegistered) {
        showToast('Already registered!', 'info');
        return;
    }

    const reg = {
        id: Date.now(),
        eventId: eventId,
        userId: state.currentUser?.id,
        name: state.currentUser?.name,
        email: state.currentUser?.email,
        status: 'confirmed',
        checkIn: false,
        registrationDate: new Date().toISOString().split('T')[0]
    };

    state.registrations = [...state.registrations, reg];

    // Update event registration count
    const events = [...state.events];
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
        events[eventIndex].registered++;
        state.events = events;
    }

    showToast('Successfully registered!', 'success');

    // Automatically generate and download PDF ticket
    const event = state.events.find(e => e.id === eventId);
    if (event) {
        generateTicketPDF(reg, event);
    }

    window.navigate('dashboard');
};

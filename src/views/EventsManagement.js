import { state } from '../state.js';

export function renderEventsManagement() {
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <div class="flex gap-2">
                    <button onclick="window.showCreateEventModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg flex items-center gap-2">
                        <i class="fas fa-plus"></i> Create Event
                    </button>
                </div>
                <div class="flex gap-2">
                    <select id="eventFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500">
                        <option value="all">All Events</option>
                        <option value="active">Active</option>
                        <option value="upcoming">Upcoming</option>
                    </select>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" id="eventsGrid">
                ${state.events.map(event => `
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden card-hover group">
                        <div class="relative h-48 overflow-hidden">
                            <img src="${event.image}" alt="${event.title}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div class="absolute bottom-4 left-4 right-4">
                                <span class="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white border border-white/30">
                                    ${event.type}
                                </span>
                                <span class="ml-2 px-3 py-1 rounded-full text-xs font-bold ${event.status === 'active' ? 'bg-green-500/80' : 'bg-yellow-500/80'} text-white">
                                    ${event.status}
                                </span>
                            </div>
                        </div>
                        <div class="p-6">
                            <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">${event.title}</h3>
                            <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">${event.description}</p>
                            
                            <div class="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                <div class="flex items-center gap-2">
                                    <i class="fas fa-calendar-day w-5 text-blue-500"></i>
                                    <span>${event.date} at ${event.time}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <i class="fas fa-map-marker-alt w-5 text-red-500"></i>
                                    <span>${event.venue}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <i class="fas fa-users w-5 text-green-500"></i>
                                    <span>${event.registered} / ${event.maxParticipants} registered</span>
                                </div>
                            </div>
                            
                            <div class="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <div class="flex-1 mr-4">
                                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500" style="width: ${(event.registered / (event.maxParticipants || 1)) * 100}%"></div>
                                    </div>
                                </div>
                                <div class="flex gap-1">
                                    <button onclick="window.showEditEventModal('${event.id}')" class="text-blue-500 hover:text-blue-700 transition-colors p-2" title="Edit Event">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="window.deleteEvent('${event.id}')" class="text-red-500 hover:text-red-700 transition-colors p-2" title="Delete Event">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}


            </div>
        </div>
    `;
}

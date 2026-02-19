import { state } from '../state.js';

export function renderHeader() {
    if (!state.currentUser) return '';

    return `
        <div class="flex items-center justify-between px-6 py-4">
            <div class="flex items-center gap-4">
                <button class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" onclick="window.toggleSidebar()">
                    <i class="fas fa-bars"></i>
                </button>
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white capitalize">${state.currentView}</h2>
            </div>

            <div class="flex items-center gap-4">
                ${state.currentUser.role === 'admin' ? `
                <div class="relative">
                    <button onclick="window.toggleNotifications()" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative">
                        <i class="fas fa-bell text-gray-600 dark:text-gray-300"></i>
                        ${state.notifications.filter(n => !n.read).length > 0 ? `
                            <span class="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center notification-badge">
                                ${state.notifications.filter(n => !n.read).length}
                            </span>
                        ` : ''}
                    </button>
                </div>
                ` : ''}

                <div class="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                    <div class="text-right hidden sm:block">
                        <p class="text-sm font-semibold text-gray-800 dark:text-white">${state.currentUser.name}</p>
                        <p class="text-xs text-gray-500">${state.currentUser.email}</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">
                        ${state.currentUser.name.charAt(0)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

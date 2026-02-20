import { state } from '../state.js';

const menus = {
    admin: [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
        { id: 'events', label: 'Manage Events', icon: 'fa-calendar-check' },
        { id: 'registrations', label: 'Registrations', icon: 'fa-clipboard-list' },
        { id: 'teams', label: 'Teams Overview', icon: 'fa-users' },
        { id: 'notifications', label: 'Send Notifications', icon: 'fa-bullhorn' },
        { id: 'checkin', label: 'Check-in', icon: 'fa-qrcode' }
    ],
    participant: [
        { id: 'dashboard', label: 'My Events', icon: 'fa-calendar' },
        { id: 'browse', label: 'Browse Events', icon: 'fa-search' },
        { id: 'teams', label: 'My Teams', icon: 'fa-users' },
        { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
        { id: 'qr-scanner', label: 'Check-in Scanner', icon: 'fa-qrcode' }
    ]
};

export function renderSidebar(navigateCallback) {
    if (!state.currentUser) return '';

    const menuItems = menus[state.currentUser.role] || menus.participant;

    return `
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <i class="fas fa-calendar-alt text-white"></i>
                </div>
                <div>
                    <h2 class="font-bold text-lg gradient-text">EventFlow</h2>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${state.currentUser.role === 'admin' ? 'Administrator' : 'Participant'}</p>
                </div>
            </div>
        </div>

        <nav class="flex-1 overflow-y-auto py-4">
            <div class="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Menu</div>
            <ul class="space-y-1">
                ${menuItems.map(item => `
                    <li>
                        <button onclick="window.navigate('${item.id}')" class="sidebar-item w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg ${state.currentView === item.id ? 'active' : 'text-gray-600 dark:text-gray-400'}">
                            <i class="fas ${item.icon} w-5"></i>
                            <span class="font-medium flex-1">${item.label}</span>
                            ${item.id === 'notifications' && state.notifications.filter(n => !n.read).length > 0 ? `
                                <span class="min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">${state.notifications.filter(n => !n.read).length}</span>
                            ` : ''}
                        </button>
                    </li>
                `).join('')}
            </ul>
        </nav>

        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <button onclick="window.toggleDarkMode()" class="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <i class="fas ${state.darkMode ? 'fa-sun text-yellow-400' : 'fa-moon'}"></i>
                <span>${state.darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button onclick="window.logout()" class="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </button>
        </div>
    `;
}

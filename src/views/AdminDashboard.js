import { state } from '../state.js';
import Chart from 'chart.js/auto';

export function renderAdminDashboard() {
    const totalEvents = state.events.length;
    const totalRegistrations = state.registrations.length;
    const totalTeams = state.teams.length;
    const checkedIn = state.registrations.filter(r => r.checkIn).length;

    return `
        <div class="space-y-6 animate-fade-in">
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- ... (existing stats cards) ... -->
                <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 card-hover transition-all">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Events</p>
                            <p class="text-3xl font-bold text-gray-800 dark:text-white mt-1">${totalEvents}</p>
                        </div>
                        <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <i class="fas fa-calendar text-blue-600 dark:text-blue-400 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 card-hover transition-all">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Registrations</p>
                            <p class="text-3xl font-bold text-gray-800 dark:text-white mt-1">${totalRegistrations}</p>
                        </div>
                        <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <i class="fas fa-users text-purple-600 dark:text-purple-400 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 card-hover transition-all">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Active Teams</p>
                            <p class="text-3xl font-bold text-gray-800 dark:text-white mt-1">${totalTeams}</p>
                        </div>
                        <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <i class="fas fa-user-friends text-green-600 dark:text-green-400 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 card-hover transition-all">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Check-in Rate</p>
                            <p class="text-3xl font-bold text-gray-800 dark:text-white mt-1">${Math.round((checkedIn / (totalRegistrations || 1)) * 100)}%</p>
                        </div>
                        <div class="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <i class="fas fa-qrcode text-orange-600 dark:text-orange-400 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Registration Trends</h3>
                    <div class="h-64">
                        <canvas id="regChart"></canvas>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Event Distribution</h3>
                    <div class="h-64 flex justify-center">
                        <canvas id="distChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white">Recent Registrations</h3>
                        <button onclick="window.navigate('registrations')" class="text-blue-600 hover:text-blue-700 text-sm font-bold">View All</button>
                    </div>
                    <div class="p-6">
                        <div class="space-y-4">
                            ${state.registrations.slice(-5).reverse().map(reg => `
                                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                                            ${reg.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p class="font-bold text-gray-800 dark:text-white">${reg.name}</p>
                                            <p class="text-sm text-gray-500">${state.events.find(e => e.id === reg.eventId)?.title || 'Unknown Event'}</p>
                                        </div>
                                    </div>
                                    <span class="px-3 py-1 rounded-full text-xs font-bold ${reg.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                                        ${reg.status.toUpperCase()}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                        <div class="space-y-3">
                            <button onclick="window.navigate('events')" class="w-full flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all font-bold group">
                                <i class="fas fa-plus-circle group-hover:rotate-90 transition-transform"></i>
                                <span>Create New Event</span>
                            </button>
                            <button onclick="window.navigate('notifications')" class="w-full flex items-center gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all font-bold group">
                                <i class="fas fa-bullhorn group-hover:scale-110 transition-transform"></i>
                                <span>Send Announcement</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function initAdminCharts() {
    const regCtx = document.getElementById('regChart');
    const distCtx = document.getElementById('distChart');

    if (regCtx) {
        // Mock data for registration daily trends (last 7 days)
        new Chart(regCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'New Registrations',
                    data: [12, 19, 15, 25, 22, 30, 28],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#2563eb'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false }, ticks: { color: '#94a3b8' } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }

    if (distCtx) {
        const types = [...new Set(state.events.map(e => e.type))];
        const counts = types.map(t => state.events.filter(e => e.type === t).length);

        new Chart(distCtx, {
            type: 'doughnut',
            data: {
                labels: types,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', usePointStyle: true, padding: 20 }
                    }
                },
                cutout: '70%'
            }
        });
    }
}

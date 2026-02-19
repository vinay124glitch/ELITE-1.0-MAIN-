import { state } from '../state.js';
import { showToast } from '../utils/ui.js';

export function renderCheckIn() {
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Manual Entry -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 flex flex-col justify-center">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                            <i class="fas fa-keyboard text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 dark:text-white">Manual Check-in</h3>
                        <p class="text-gray-500 dark:text-gray-400">Enter participant email or registration ID</p>
                    </div>
                    <div class="flex gap-2">
                        <input type="text" id="checkInInput" placeholder="e.g. participant@example.com" 
                            class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                        <button onclick="window.manualCheckIn()" class="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                            Check In
                        </button>
                    </div>
                </div>

                <!-- Simulation Info -->
                <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-8 text-white relative overflow-hidden group">
                    <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
                    <div class="relative z-10">
                        <h3 class="text-2xl font-bold mb-4">QR System Active</h3>
                        <div class="bg-white p-4 rounded-xl w-48 h-48 mx-auto mb-6">
                            <i class="fas fa-qrcode text-black text-[12rem] flex items-center justify-center"></i>
                        </div>
                        <p class="text-center text-gray-400 text-sm">Scan participant QR codes at the entrance to verify registration and mark attendance.</p>
                    </div>
                </div>
            </div>

            <!-- Recent Check-ins -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Live Check-in Feed</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Participant</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            ${state.registrations.filter(r => r.checkIn).slice(-5).reverse().map(reg => {
        const event = state.events.find(e => e.id === reg.eventId);
        return `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <p class="font-medium text-gray-900 dark:text-white">${reg.name}</p>
                                            <p class="text-xs text-gray-500">${reg.email}</p>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">${event?.title || 'Unknown'}</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="flex items-center gap-2 text-green-600 text-sm font-bold">
                                                <i class="fas fa-check-circle"></i> Checked In
                                            </span>
                                        </td>
                                    </tr>
                                `;
    }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

window.manualCheckIn = () => {
    const input = document.getElementById('checkInInput').value.toLowerCase();
    if (!input) return;

    const regIndex = state.registrations.findIndex(r => r.email.toLowerCase() === input || r.id.toString() === input);

    if (regIndex === -1) {
        showToast('Participant not found!', 'error');
        return;
    }

    if (state.registrations[regIndex].checkIn) {
        showToast('Already checked in!', 'info');
        return;
    }

    const updatedRegs = [...state.registrations];
    updatedRegs[regIndex].checkIn = true;
    state.registrations = updatedRegs;

    showToast(`Checked in ${updatedRegs[regIndex].name}!`, 'success');
    document.getElementById('checkInInput').value = '';
    window.navigate('checkin');
};

import { state } from '../state.js';
import { showToast } from '../utils/ui.js';
import { dbOps } from '../db.js';

export function renderCheckIn() {
    return `
        <div class="space-y-6 animate-fade-in">

            <!-- Stats Bar -->
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
                    <p class="text-3xl font-bold text-blue-600">${state.registrations.length}</p>
                    <p class="text-xs text-gray-500 mt-1">Total Registered</p>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
                    <p class="text-3xl font-bold text-green-600">${state.registrations.filter(r => r.checkIn).length}</p>
                    <p class="text-xs text-gray-500 mt-1">Checked In</p>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
                    <p class="text-3xl font-bold text-orange-500">${state.registrations.filter(r => !r.checkIn).length}</p>
                    <p class="text-xs text-gray-500 mt-1">Pending</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <!-- Left: Event QR Codes -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                        <i class="fas fa-qrcode text-blue-500"></i> Event QR Codes
                    </h3>
                    <p class="text-sm text-gray-400 dark:text-gray-500 mb-4">Display these codes at the venue. Participants scan them to auto check-in.</p>

                    <!-- Event selector -->
                    <div class="mb-4">
                        <select id="qrEventSelect" onchange="window.generateAdminQR()" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500">
                            <option value="">-- Select an Event --</option>
                            ${state.events.map(e => `<option value="${e.id || e._id}">${e.title}</option>`).join('')}
                        </select>
                    </div>

                    <!-- QR Display Area -->
                    <div id="adminQrArea" class="flex flex-col items-center justify-center min-h-[260px] bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 p-6">
                        <i class="fas fa-hand-pointer text-4xl text-gray-300 mb-3"></i>
                        <p class="text-sm text-gray-400">Select an event to generate its QR code</p>
                    </div>

                    <button id="downloadQrBtn" onclick="window.downloadEventQR()" class="hidden w-full mt-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        <i class="fas fa-download"></i> Download QR Code
                    </button>
                </div>

                <!-- Right: Manual Entry + Recent Feed -->
                <div class="space-y-4">
                    <!-- Manual Check-in -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <i class="fas fa-keyboard text-purple-500"></i> Manual Check-in
                        </h3>
                        <div class="flex gap-2">
                            <input type="text" id="checkInInput" placeholder="Email or Registration ID"
                                class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm">
                            <button onclick="window.manualCheckIn()" class="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm">
                                Check In
                            </button>
                        </div>
                    </div>

                    <!-- Recent Check-ins Feed -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <i class="fas fa-stream text-green-500"></i> Live Check-in Feed
                        </h3>
                        <div class="space-y-3 max-h-60 overflow-y-auto">
                            ${state.registrations.filter(r => r.checkIn).slice(-5).reverse().map(reg => {
        const event = state.events.find(e => String(e.id) === String(reg.eventId));
        return `
                                <div class="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div class="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                        ${(reg.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-semibold text-gray-800 dark:text-white truncate">${reg.name || 'Anonymous'}</p>
                                        <p class="text-xs text-gray-500 truncate">${event?.title || 'Unknown Event'}</p>
                                    </div>
                                    <span class="text-green-500 text-xs font-bold flex items-center gap-1 flex-shrink-0">
                                        <i class="fas fa-check-circle"></i> In
                                    </span>
                                </div>`;
    }).join('') || `
                                <div class="text-center py-4 text-gray-400">
                                    <i class="fas fa-clock text-2xl mb-2"></i>
                                    <p class="text-sm">No check-ins yet</p>
                                </div>`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ── Generate QR Code for selected event ──
window.generateAdminQR = () => {
    const eventId = document.getElementById('qrEventSelect').value;
    const area = document.getElementById('adminQrArea');
    const dlBtn = document.getElementById('downloadQrBtn');

    if (!eventId) {
        area.innerHTML = `<i class="fas fa-hand-pointer text-4xl text-gray-300 mb-3"></i>
            <p class="text-sm text-gray-400">Select an event to generate its QR code</p>`;
        dlBtn.classList.add('hidden');
        return;
    }

    const event = state.events.find(e => String(e.id || e._id) === String(eventId));
    const payload = JSON.stringify({ type: 'event_checkin', eventId: eventId });

    area.innerHTML = `
        <p class="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">${event?.title || 'Event'}</p>
        <div id="qrCodeCanvas" class="bg-white p-3 rounded-xl shadow-md"></div>
        <p class="text-xs text-gray-400 mt-3">Participants scan this to check in</p>`;

    // Generate QR code using QRCode.js
    setTimeout(() => {
        new QRCode(document.getElementById('qrCodeCanvas'), {
            text: payload,
            width: 200,
            height: 200,
            colorDark: '#1e293b',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        dlBtn.classList.remove('hidden');
        window._currentQrEventId = eventId;
    }, 50);
};

// ── Download QR code as image ──
window.downloadEventQR = () => {
    const canvas = document.querySelector('#qrCodeCanvas canvas') ||
        document.querySelector('#qrCodeCanvas img');
    if (!canvas) return;
    const event = state.events.find(e => String(e.id || e._id) === String(window._currentQrEventId));
    const link = document.createElement('a');
    link.download = `${event?.title?.replace(/\s+/g, '_') || 'event'}_QR.png`;
    if (canvas.tagName === 'CANVAS') {
        link.href = canvas.toDataURL('image/png');
    } else {
        link.href = canvas.src;
    }
    link.click();
};

// ── Manual Check-in ──
window.manualCheckIn = async () => {
    const input = document.getElementById('checkInInput').value.trim().toLowerCase();
    if (!input) return;

    const reg = state.registrations.find(r =>
        (r.email && r.email.toLowerCase() === input) || String(r.id) === input
    );

    if (!reg) { showToast('Participant not found!', 'error'); return; }
    if (reg.checkIn) { showToast('Already checked in!', 'info'); return; }

    try {
        await dbOps.updateRegistration(reg.id, { checkIn: true });
        showToast(`✅ Checked in ${reg.name}!`, 'success');
        document.getElementById('checkInInput').value = '';
    } catch (error) {
        showToast('Failed to check in participant', 'error');
    }
};

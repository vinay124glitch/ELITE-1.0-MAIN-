import { state } from '../state.js';
import { showToast } from '../utils/ui.js';
import { dbOps } from '../db.js';

let html5QrScanner = null;
let scannerActive = false;

export function renderQRScanner() {
    return `
        <div class="space-y-6 animate-fade-in max-w-lg mx-auto">

            <!-- Header Card -->
            <div class="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <i class="fas fa-qrcode text-2xl"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold">QR Check-in Scanner</h2>
                        <p class="text-blue-100 text-sm">Point your camera at the event QR code</p>
                    </div>
                </div>
                <div class="mt-4 bg-white/10 rounded-lg px-4 py-2 flex items-center gap-2">
                    <i class="fas fa-user-check text-sm"></i>
                    <span class="text-sm font-medium">Scanning as: <strong>${state.currentUser?.name || 'You'}</strong></span>
                </div>
            </div>

            <!-- Scanner Box -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Camera Feed</span>
                    <div id="scannerStatusDot" class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-gray-300"></span>
                        <span class="text-xs text-gray-400">Inactive</span>
                    </div>
                </div>

                <!-- Camera viewport -->
                <div class="relative bg-black">
                    <div id="qr-reader" class="w-full"></div>
                    <!-- Scanning overlay frame -->
                    <div id="scanOverlay" class="hidden absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div class="relative w-52 h-52">
                            <div class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                            <div class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                            <div class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                            <div class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                            <div id="scanLine" class="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent top-0 animate-scan-line"></div>
                        </div>
                    </div>
                </div>

                <div class="p-4 flex gap-3">
                    <button id="startScanBtn" onclick="window.startQRScan()" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                        <i class="fas fa-camera"></i> Start Scanner
                    </button>
                    <button id="stopScanBtn" onclick="window.stopQRScan()" class="hidden flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                        <i class="fas fa-stop-circle"></i> Stop
                    </button>
                </div>
            </div>

            <!-- Result Card -->
            <div id="scanResultCard" class="hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div id="scanResultContent"></div>
            </div>

            <!-- My Registrations (quick reference) -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <h4 class="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-ticket-alt text-blue-500"></i> My Event Registrations
                </h4>
                <div class="space-y-2">
                    ${state.registrations.filter(r => String(r.userId) === String(state.currentUser?.id)).map(reg => {
        const ev = state.events.find(e => String(e.id) === String(reg.eventId));
        return `
                        <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40">
                            <div class="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 flex-shrink-0">
                                <i class="fas fa-calendar-check text-sm"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold text-gray-800 dark:text-white truncate">${ev?.title || 'Event'}</p>
                                <p class="text-xs text-gray-400">${ev?.date || ''}</p>
                            </div>
                            <span class="text-xs px-2 py-1 rounded-full font-bold flex-shrink-0 ${reg.checkIn
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}">
                                ${reg.checkIn ? '✅ Checked In' : '⏳ Pending'}
                            </span>
                        </div>`;
    }).join('') || '<p class="text-sm text-gray-400 text-center py-3">No registrations yet.</p>'}
                </div>
            </div>
        </div>
    `;
}

// ── Start Camera Scanner ──
window.startQRScan = async () => {
    if (scannerActive) return;

    const startBtn = document.getElementById('startScanBtn');
    const stopBtn = document.getElementById('stopScanBtn');
    const overlay = document.getElementById('scanOverlay');
    const statusDot = document.getElementById('scannerStatusDot');

    try {
        html5QrScanner = new Html5Qrcode('qr-reader');
        const cameras = await Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {
            showToast('No camera found on this device', 'error');
            return;
        }

        // Prefer the back camera on mobile
        const cameraId = cameras.find(c => /back|rear|environment/i.test(c.label))?.id || cameras[0].id;

        await html5QrScanner.start(
            cameraId,
            { fps: 10, qrbox: { width: 220, height: 220 } },
            window.onQRScanSuccess,
            () => { } // ignore decode errors
        );

        scannerActive = true;
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        overlay.classList.remove('hidden');
        statusDot.innerHTML = `<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span><span class="text-xs text-green-500 font-medium">Live</span>`;
        showToast('Scanner started — point at event QR code', 'info');

    } catch (err) {
        console.error('Scanner error:', err);
        showToast(`Camera error: ${err.message || 'Permission denied'}`, 'error');
    }
};

// ── Stop Scanner ──
window.stopQRScan = async () => {
    if (html5QrScanner && scannerActive) {
        await html5QrScanner.stop();
        html5QrScanner.clear();
        scannerActive = false;
    }

    const startBtn = document.getElementById('startScanBtn');
    const stopBtn = document.getElementById('stopScanBtn');
    const overlay = document.getElementById('scanOverlay');
    const statusDot = document.getElementById('scannerStatusDot');

    if (startBtn) {
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        overlay.classList.add('hidden');
        statusDot.innerHTML = `<span class="w-2 h-2 rounded-full bg-gray-300"></span><span class="text-xs text-gray-400">Inactive</span>`;
    }
};

// ── Handle Successful Scan ──
window.onQRScanSuccess = async (rawValue) => {
    // Stop scanner after successful scan
    await window.stopQRScan();

    let payload;
    try {
        payload = JSON.parse(rawValue);
    } catch {
        showResult('error', 'Invalid QR Code', 'This QR code is not a valid EventFlow check-in code.');
        return;
    }

    if (payload.type !== 'event_checkin' || !payload.eventId) {
        showResult('error', 'Invalid QR Code', 'This QR code does not contain valid event check-in data.');
        return;
    }

    const { eventId } = payload;
    const event = state.events.find(e => String(e.id || e._id) === String(eventId));

    if (!event) {
        showResult('error', 'Event Not Found', 'The scanned QR code refers to an event that no longer exists.');
        return;
    }

    // Find participant's registration for this event
    const reg = state.registrations.find(r =>
        String(r.eventId) === String(eventId) &&
        String(r.userId) === String(state.currentUser?.id)
    );

    if (!reg) {
        showResult('warning', 'Not Registered', `You are not registered for <strong>${event.title}</strong>. Please register first.`);
        return;
    }

    if (reg.checkIn) {
        showResult('info', 'Already Checked In!', `You already checked in to <strong>${event.title}</strong>. Enjoy the event! 🎉`);
        return;
    }

    // Mark attendance
    try {
        await dbOps.updateRegistration(reg.id || reg._id, { checkIn: true });
        showResult('success', 'Attendance Confirmed! ✅', `
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">You've been checked in to:</p>
            <p class="text-lg font-bold text-gray-800 dark:text-white">${event.title}</p>
            <p class="text-sm text-gray-500">${event.date || ''} ${event.time ? '· ' + event.time : ''}</p>
            <p class="text-sm text-gray-500">${event.venue || ''}</p>
        `);
        showToast(`Attendance approved for ${event.title}! ✅`, 'success');
    } catch (err) {
        showResult('error', 'Check-in Failed', 'Could not update attendance. Please try again or contact the organiser.');
    }
};

function showResult(type, title, body) {
    const card = document.getElementById('scanResultCard');
    const content = document.getElementById('scanResultContent');
    if (!card || !content) return;

    const config = {
        success: { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'fa-check-circle', iconColor: 'text-green-500', border: 'border-green-200 dark:border-green-800' },
        error: { bg: 'bg-red-50 dark:bg-red-900/20', icon: 'fa-times-circle', iconColor: 'text-red-500', border: 'border-red-200 dark:border-red-800' },
        warning: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'fa-exclamation-triangle', iconColor: 'text-yellow-500', border: 'border-yellow-200 dark:border-yellow-800' },
        info: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'fa-info-circle', iconColor: 'text-blue-500', border: 'border-blue-200 dark:border-blue-800' }
    }[type];

    content.innerHTML = `
        <div class="p-6 text-center ${config.bg}">
            <i class="fas ${config.icon} text-4xl ${config.iconColor} mb-3"></i>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">${title}</h3>
            <div class="text-gray-600 dark:text-gray-400">${body}</div>
            <button onclick="window.startQRScan()" class="mt-5 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                <i class="fas fa-redo mr-1"></i> Scan Again
            </button>
        </div>`;

    card.classList.remove('hidden');
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Clean up scanner when navigating away
window.addEventListener('hashchange', () => {
    if (scannerActive) window.stopQRScan();
});

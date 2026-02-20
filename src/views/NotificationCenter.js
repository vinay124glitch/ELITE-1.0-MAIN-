import { state } from '../state.js';
import { showToast } from '../utils/ui.js';
import { dbOps } from '../db.js';

function timeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function typeColor(type) {
    return {
        info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
        success: 'bg-green-100 dark:bg-green-900/30 text-green-600',
        warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
        error: 'bg-red-100 dark:bg-red-900/30 text-red-600'
    }[type] || 'bg-blue-100 dark:bg-blue-900/30 text-blue-600';
}

function typeIcon(type) {
    return {
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle'
    }[type] || 'fa-info-circle';
}

export function renderNotificationCenter() {
    // Filter notifications relevant to current user
    const myNotifs = state.notifications.filter(n => {
        if (state.currentUser?.role === 'admin') return true;
        // Participants see 'all' or their specific event notifications
        if (n.recipients === 'all') return true;
        if (n.recipients?.startsWith('event_')) {
            const eventId = n.recipients.replace('event_', '');
            return state.registrations.some(r =>
                String(r.eventId) === String(eventId) &&
                String(r.userId) === String(state.currentUser?.id)
            );
        }
        return false;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const unreadCount = myNotifs.filter(n => !n.read).length;

    return `
        <div class="space-y-6 animate-fade-in">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <!-- Left panel: Send (admin) or Info (participant) -->
                ${state.currentUser?.role === 'admin' ? `
                <div class="lg:col-span-2 space-y-4">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <i class="fas fa-bullhorn text-blue-500"></i> Send Announcement
                        </h3>
                        <form onsubmit="window.handleSendNotification(event)" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipients</label>
                                    <select id="notifRecipients" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                                        <option value="all">🌐 All Participants</option>
                                        ${state.events.map(e => `<option value="event_${e.id}">📅 Event: ${e.title}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                                    <select id="notifType" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                                        <option value="info">ℹ️ Info</option>
                                        <option value="success">✅ Success</option>
                                        <option value="warning">⚠️ Warning</option>
                                        <option value="error">🚨 Alert</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                                <input type="text" id="notifSubject" required class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" placeholder="e.g. Schedule Update">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                                <textarea id="notifMessage" required rows="4" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" placeholder="Type your announcement here..."></textarea>
                            </div>

                            <button type="submit" class="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition-all transform hover:scale-[1.02]">
                                <i class="fas fa-paper-plane mr-2"></i>Send Notification
                            </button>
                        </form>
                    </div>
                </div>
                ` : `
                <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                    <div class="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mb-4">
                        <i class="fas fa-bullhorn text-3xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Announcement Hub</h3>
                    <p class="text-gray-500 dark:text-gray-400">Stay updated with the latest event announcements and schedule changes from organizers.</p>
                    ${unreadCount > 0 ? `
                        <div class="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full font-bold">
                            🔔 You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}
                        </div>
                    ` : `
                        <div class="mt-4 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold">
                            ✅ All caught up!
                        </div>
                    `}
                </div>
                `}

                <!-- Right panel: Notification Feed -->
                <div class="space-y-4">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="font-bold text-gray-800 dark:text-white">
                                Notifications
                                ${unreadCount > 0 ? `<span class="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">${unreadCount}</span>` : ''}
                            </h4>
                            ${unreadCount > 0 ? `
                                <button onclick="window.markAllRead()" class="text-xs text-blue-500 hover:text-blue-700 font-medium">Mark all read</button>
                            ` : ''}
                        </div>
                        <div class="space-y-3 max-h-96 overflow-y-auto">
                            ${myNotifs.length === 0 ? `
                                <div class="text-center py-8">
                                    <i class="fas fa-bell-slash text-3xl text-gray-300 mb-3"></i>
                                    <p class="text-sm text-gray-400 italic">No announcements yet.</p>
                                </div>
                            ` : myNotifs.map(n => `
                                <div class="flex gap-3 p-3 rounded-lg ${n.read ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'} cursor-pointer hover:opacity-80 transition-opacity" onclick="window.markNotifRead('${n.id || n._id}')">
                                    <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${typeColor(n.type)}">
                                        <i class="fas ${typeIcon(n.type)} text-xs"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-start justify-between gap-1">
                                            <p class="text-sm font-bold text-gray-800 dark:text-white truncate">${n.title}</p>
                                            ${!n.read ? '<span class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></span>' : ''}
                                        </div>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">${n.message}</p>
                                        <p class="text-[10px] text-gray-400 mt-1">${timeAgo(n.timestamp)}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;
}

// ── Send Notification ──
window.handleSendNotification = async (event) => {
    event.preventDefault();
    const subject = document.getElementById('notifSubject').value;
    const message = document.getElementById('notifMessage').value;
    const recipients = document.getElementById('notifRecipients').value;
    const type = document.getElementById('notifType')?.value || 'info';

    const newNotif = {
        title: subject,
        message: message,
        recipients: recipients,
        read: false,
        type: type,
        timestamp: new Date().toISOString()
    };

    try {
        await dbOps.addNotification(newNotif);
        showToast('Notification sent successfully!', 'success');
        document.getElementById('notifSubject').value = '';
        document.getElementById('notifMessage').value = '';
    } catch (error) {
        showToast('Failed to send notification', 'error');
    }
};

// ── Mark single notification as read ──
window.markNotifRead = async (notifId) => {
    if (!notifId || notifId === 'undefined') return;
    const notif = state.notifications.find(n => String(n.id || n._id) === String(notifId));
    if (!notif || notif.read) return;

    try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/notifications/${notifId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true })
        });
        // Optimistically update local state
        const updated = state.notifications.map(n =>
            String(n.id || n._id) === String(notifId) ? { ...n, read: true } : n
        );
        state.notifications = updated;
        // Re-render the page to update badge count
        if (window.navigate) window.navigate('notifications');
    } catch (e) {
        // fail silently
    }
};

// ── Mark all notifications as read ──
window.markAllRead = async () => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const unread = state.notifications.filter(n => !n.read);
        await Promise.all(unread.map(n =>
            fetch(`${apiUrl}/notifications/${n.id || n._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read: true })
            })
        ));
        state.notifications = state.notifications.map(n => ({ ...n, read: true }));
        if (window.navigate) window.navigate('notifications');
        showToast('All notifications marked as read', 'success');
    } catch (e) {
        showToast('Failed to mark as read', 'error');
    }
};

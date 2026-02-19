import { state } from '../state.js';
import { showToast } from '../utils/ui.js';

export function renderNotificationCenter() {
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Send Notification -->
                <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-6">Send Announcement</h3>
                    <form onsubmit="window.handleSendNotification(event)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipients</label>
                            <select id="notifRecipients" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                                <option value="all">All Participants</option>
                                ${state.events.map(e => `<option value="event_${e.id}">Event: ${e.title}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Channel</label>
                            <div class="flex gap-4">
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" checked class="rounded text-blue-600">
                                    <span class="text-sm">Platform</span>
                                </label>
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" class="rounded text-blue-600">
                                    <span class="text-sm">Email</span>
                                </label>
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" class="rounded text-blue-600">
                                    <span class="text-sm">WhatsApp</span>
                                </label>
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

                <!-- History -->
                <div class="space-y-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h4 class="font-bold text-gray-800 dark:text-white mb-4">Recent Notifications</h4>
                        <div class="space-y-4">
                            ${state.notifications.slice(0, 5).map(n => `
                                <div class="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                        <i class="fas fa-info-circle text-xs"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-bold text-gray-800 dark:text-white truncate">${n.title}</p>
                                        <p class="text-xs text-gray-500 line-clamp-2">${n.message}</p>
                                        <p class="text-[10px] text-gray-400 mt-1">${n.time}</p>
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

window.handleSendNotification = (event) => {
    event.preventDefault();
    const subject = document.getElementById('notifSubject').value;
    const message = document.getElementById('notifMessage').value;

    const newNotif = {
        id: Date.now(),
        title: subject,
        message: message,
        time: 'Just now',
        read: false,
        type: 'info'
    };

    state.notifications = [newNotif, ...state.notifications];
    showToast('Notification sent successfully!', 'success');

    // Reset form
    document.getElementById('notifSubject').value = '';
    document.getElementById('notifMessage').value = '';
};

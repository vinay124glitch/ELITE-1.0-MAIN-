import './styles/main.css';
import { state } from './state.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderHeader } from './components/Header.js';
import { renderAdminDashboard, initAdminCharts } from './views/AdminDashboard.js';
import { renderParticipantDashboard } from './views/ParticipantDashboard.js';
import { renderEventsManagement } from './views/EventsManagement.js';
import { renderRegistrations } from './views/Registrations.js';
import { renderBrowseEvents } from './views/BrowseEvents.js';
import { renderMyTeams } from './views/MyTeams.js';
import { renderCheckIn } from './views/CheckIn.js';
import { renderNotificationCenter } from './views/NotificationCenter.js';
import { renderQRScanner } from './views/QRScanner.js';
import { showToast } from './utils/ui.js';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './firebase.js';
import { dbOps, initSync, stopSync } from './db.js';

function init() {
    applyDarkMode();
    setupAuthListener();
    setupRouting();
    initSync(renderApp); // Start syncing immediately for manual login support
}

function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // If already logged in via state (manual admin), don't overwrite
            if (!state.currentUser) {
                state.currentUser = {
                    id: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    role: 'participant', // Default for social login
                    photoURL: user.photoURL
                };
            }
            if (window.location.hash === '#login' || !window.location.hash) {
                window.location.hash = '#dashboard';
            }

            // Sync Firebase user to MongoDB safely
            dbOps.addUser(state.currentUser).catch(err => {
                console.error("User profile sync failed:", err);
            });

            // Start syncing data once authenticated (safe if already started)
            initSync(renderApp);
        } else {
            // If No Firebase user, and no manual user, stop loading
            if (!state.currentUser) {
                state.isLoading = false;
            } else if (state.currentUser.role === 'admin') {
                // Manual admin doesn't get Firebase sync but needs to see the app
                state.isLoading = false;
            }
        }
        renderApp();
    });
}

function applyDarkMode() {
    if (state.darkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// --- Global Actions (Attached to window for HTML access) ---

window.navigate = (view) => {
    state.currentView = view;
    renderApp();
};

window.toggleDarkMode = () => {
    state.darkMode = !state.darkMode;
    applyDarkMode();
    renderApp();
};

window.logout = async () => {
    try {
        await signOut(auth);
        stopSync();
        state.currentUser = null;
        window.location.hash = '#login';
        renderApp();
        showToast('Logged out successfully', 'info');
    } catch (error) {
        showToast('Logout failed', 'error');
    }
};

window.login = (role) => {
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;

    if (role === 'admin') {
        if ((email === 'admin123' || email === 'admin@eventflow.com') && (password === 'password' || password === 'admin123')) {
            state.currentUser = {
                role: 'admin',
                email: email,
                name: 'System Admin',
                id: 'admin-001'
            };
            state.currentView = 'dashboard';
            state.isLoading = false;
            window.location.hash = '#dashboard';
            renderApp();
            showToast('Admin logged in successfully!', 'success');
        } else {
            showToast('Invalid admin credentials!', 'error');
        }
    } else {
        // Handle Participant manual login
        const registeredUser = state.users.find(u => u.email === email && u.password === password);

        if (registeredUser) {
            state.currentUser = registeredUser;
            state.currentView = 'dashboard';
            state.isLoading = false;
            window.location.hash = '#dashboard';
            renderApp();
            showToast(`Welcome back, ${state.currentUser.name}!`, 'success');
        } else {
            const msg = state.users.length === 0
                ? 'Syncing users... please wait a moment and try again.'
                : 'Invalid email or password. Please sign up first!';
            showToast(msg, 'error');
        }
    }
};

window.handleSignUp = async (event) => {
    event.preventDefault();
    const name = document.getElementById('signUpName').value;
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;

    if (state.users.some(u => u.email === email)) {
        showToast('Email already registered!', 'error');
        return;
    }

    const newUser = {
        name: name,
        email: email,
        password: password,
        role: 'participant'
    };

    try {
        await dbOps.addUser(newUser);
        showToast('Account created! You can now log in.', 'success');
        window.toggleAuthMode();
    } catch (error) {
        showToast('Failed to create account', 'error');
    }
};


window.toggleAuthMode = () => {
    const loginForm = document.getElementById('loginFormContainer');
    const signUpForm = document.getElementById('signUpFormContainer');
    if (loginForm.classList.contains('hidden')) {
        loginForm.classList.remove('hidden');
        signUpForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        signUpForm.classList.remove('hidden');
    }
};

window.loginWithGoogle = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
        showToast('Signed in with Google!', 'success');
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
            showToast('Google Sign-In failed', 'error');
        }
    }
};

// --- Modals & Complex Actions ---

window.showCreateEventModal = () => {
    const modalRoot = document.getElementById('modal-root');
    const modal = document.createElement('div');
    modal.id = 'modalBackdrop';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">Create New Event</h3>
                <button onclick="window.closeModal()" class="text-gray-500 hover:text-gray-700"><i class="fas fa-times"></i></button>
            </div>
            <form id="createEventForm" onsubmit="window.handleCreateEvent(event)" class="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Event Title</label>
                        <input type="text" id="evTitle" required class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Event Type</label>
                        <select id="evType" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                            <option>Conference</option>
                            <option>Hackathon</option>
                            <option>Workshop</option>
                            <option>Networking</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Description</label>
                    <textarea id="evDesc" rows="3" required class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"></textarea>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Date</label>
                        <input type="date" id="evDate" required class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Time</label>
                        <input type="time" id="evTime" required class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Max Capacity</label>
                        <input type="number" id="evCap" required value="100" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Venue / Online Link</label>
                    <input type="text" id="evVenue" required class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="e.g. Grand Hall or Zoom Link">
                </div>

                <!-- Image Section -->
                <div>
                    <label class="block text-sm font-medium mb-2">Event Image</label>
                    <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
                        <!-- Preview -->
                        <div id="evImagePreviewWrap" class="hidden relative">
                            <img id="evImagePreview" src="" alt="Preview" class="w-full h-48 object-cover">
                            <button type="button" onclick="window.clearEventImage('ev')" class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                                <i class="fas fa-times text-xs"></i>
                            </button>
                        </div>
                        <!-- Upload Area -->
                        <div id="evUploadArea" class="p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" onclick="document.getElementById('evImageFile').click()">
                            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-cloud-upload-alt text-blue-500 text-xl"></i>
                            </div>
                            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload image</p>
                            <p class="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                            <input type="file" id="evImageFile" accept="image/*" class="hidden" onchange="window.previewEventImage('ev', this)">
                        </div>
                    </div>
                    <!-- URL fallback -->
                    <div class="mt-2 flex items-center gap-2">
                        <div class="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                        <span class="text-xs text-gray-400">or paste URL</span>
                        <div class="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                    </div>
                    <input type="url" id="evImageUrl" class="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm" placeholder="https://example.com/image.jpg" oninput="window.previewEventImageFromUrl('ev', this.value)">
                    <input type="hidden" id="evImageData" value="">
                </div>

                <div class="pt-4 flex gap-3">
                    <button type="button" onclick="window.closeModal()" class="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-bold">Cancel</button>
                    <button type="submit" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Publish Event</button>
                </div>
            </form>
        </div>
    `;
    modalRoot.appendChild(modal);
};

window.showEditEventModal = (eventId) => {
    const event = state.events.find(e => String(e.id) === String(eventId));
    if (!event) return;

    const modalRoot = document.getElementById('modal-root');
    const modal = document.createElement('div');
    modal.id = 'modalBackdrop';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">Edit Event: ${event.title}</h3>
                <button onclick="window.closeModal()" class="text-gray-500 hover:text-gray-700"><i class="fas fa-times"></i></button>
            </div>
            <form id="editEventForm" onsubmit="window.handleUpdateEvent(event, '${event.id}')" class="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Event Title</label>
                        <input type="text" id="editEvTitle" required value="${event.title}" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Event Type</label>
                        <select id="editEvType" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                            <option ${event.type === 'Conference' ? 'selected' : ''}>Conference</option>
                            <option ${event.type === 'Hackathon' ? 'selected' : ''}>Hackathon</option>
                            <option ${event.type === 'Workshop' ? 'selected' : ''}>Workshop</option>
                            <option ${event.type === 'Networking' ? 'selected' : ''}>Networking</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Description</label>
                    <textarea id="editEvDesc" rows="3" required class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">${event.description}</textarea>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Date</label>
                        <input type="date" id="editEvDate" required value="${event.date}" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Time</label>
                        <input type="time" id="editEvTime" required value="${event.time}" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Max Capacity</label>
                        <input type="number" id="editEvCap" required value="${event.maxParticipants}" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Venue / Online Link</label>
                    <input type="text" id="editEvVenue" required value="${event.venue}" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                </div>

                <!-- Image Section -->
                <div>
                    <label class="block text-sm font-medium mb-2">Event Image</label>
                    <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
                        <!-- Preview (shown if event has existing image) -->
                        <div id="editEvImagePreviewWrap" class="${event.image ? '' : 'hidden'} relative">
                            <img id="editEvImagePreview" src="${event.image || ''}" alt="Preview" class="w-full h-48 object-cover">
                            <button type="button" onclick="window.clearEventImage('editEv')" class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                                <i class="fas fa-times text-xs"></i>
                            </button>
                        </div>
                        <!-- Upload Area -->
                        <div id="editEvUploadArea" class="${event.image ? 'hidden' : ''} p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" onclick="document.getElementById('editEvImageFile').click()">
                            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-cloud-upload-alt text-blue-500 text-xl"></i>
                            </div>
                            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload image</p>
                            <p class="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                            <input type="file" id="editEvImageFile" accept="image/*" class="hidden" onchange="window.previewEventImage('editEv', this)">
                        </div>
                    </div>
                    <!-- URL fallback -->
                    <div class="mt-2 flex items-center gap-2">
                        <div class="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                        <span class="text-xs text-gray-400">or paste URL</span>
                        <div class="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                    </div>
                    <input type="url" id="editEvImageUrl" class="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 text-sm" placeholder="https://example.com/image.jpg" value="${event.image && event.image.startsWith('http') ? event.image : ''}" oninput="window.previewEventImageFromUrl('editEv', this.value)">
                    <input type="hidden" id="editEvImageData" value="${event.image || ''}">
                </div>

                <div class="pt-4 flex gap-3">
                    <button type="button" onclick="window.closeModal()" class="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-bold">Cancel</button>
                    <button type="submit" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    modalRoot.appendChild(modal);
};

// --- Image Helper Functions ---
window.previewEventImage = (prefix, input) => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image too large! Max size is 5MB.', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const src = e.target.result;
        document.getElementById(`${prefix}ImagePreview`).src = src;
        document.getElementById(`${prefix}ImageData`).value = src;
        document.getElementById(`${prefix}ImagePreviewWrap`).classList.remove('hidden');
        document.getElementById(`${prefix}UploadArea`).classList.add('hidden');
        // Clear URL input
        const urlInput = document.getElementById(`${prefix}ImageUrl`);
        if (urlInput) urlInput.value = '';
    };
    reader.readAsDataURL(file);
};

window.previewEventImageFromUrl = (prefix, url) => {
    if (!url) return;
    document.getElementById(`${prefix}ImagePreview`).src = url;
    document.getElementById(`${prefix}ImageData`).value = url;
    document.getElementById(`${prefix}ImagePreviewWrap`).classList.remove('hidden');
    document.getElementById(`${prefix}UploadArea`).classList.add('hidden');
};

window.clearEventImage = (prefix) => {
    document.getElementById(`${prefix}ImagePreview`).src = '';
    document.getElementById(`${prefix}ImageData`).value = '';
    const urlInput = document.getElementById(`${prefix}ImageUrl`);
    if (urlInput) urlInput.value = '';
    const fileInput = document.getElementById(`${prefix}ImageFile`);
    if (fileInput) fileInput.value = '';
    document.getElementById(`${prefix}ImagePreviewWrap`).classList.add('hidden');
    document.getElementById(`${prefix}UploadArea`).classList.remove('hidden');
};

window.handleUpdateEvent = async (event, eventId) => {
    event.preventDefault();
    const imageData = document.getElementById('editEvImageData')?.value ||
        document.getElementById('editEvImageUrl')?.value || '';
    const updatedEvent = {
        title: document.getElementById('editEvTitle').value,
        description: document.getElementById('editEvDesc').value,
        type: document.getElementById('editEvType').value,
        date: document.getElementById('editEvDate').value,
        time: document.getElementById('editEvTime').value,
        maxParticipants: parseInt(document.getElementById('editEvCap').value),
        venue: document.getElementById('editEvVenue').value,
        image: imageData
    };

    try {
        await dbOps.updateEvent(eventId, updatedEvent);
        window.closeModal();
        showToast('Event updated successfully!', 'success');
    } catch (error) {
        showToast('Failed to update event', 'error');
    }
};

window.handleCreateEvent = async (event) => {
    event.preventDefault();
    const imageData = document.getElementById('evImageData')?.value ||
        document.getElementById('evImageUrl')?.value ||
        'https://images.unsplash.com/photo-1540575861501-7ad05823c951?w=800&auto=format&fit=crop';
    const newEvent = {
        title: document.getElementById('evTitle').value,
        description: document.getElementById('evDesc').value,
        type: document.getElementById('evType').value,
        date: document.getElementById('evDate').value,
        time: document.getElementById('evTime').value,
        maxParticipants: parseInt(document.getElementById('evCap').value),
        venue: document.getElementById('evVenue').value,
        registered: 0,
        status: 'upcoming',
        image: imageData
    };

    try {
        await dbOps.addEvent(newEvent);
        window.closeModal();
        showToast('Event published successfully!', 'success');
        window.navigate('events');
    } catch (error) {
        showToast('Failed to publish event', 'error');
    }
};

window.showCreateTeamModal = () => {
    // Only allow for registered events
    const myEventsIds = state.registrations.filter(r => r.userId === state.currentUser?.id).map(r => r.eventId);
    const availableEvents = state.events.filter(e => myEventsIds.includes(e.id));

    if (availableEvents.length === 0) {
        showToast('Register for an event first to create a team!', 'warning');
        return;
    }

    const modalRoot = document.getElementById('modal-root');
    const modal = document.createElement('div');
    modal.id = 'modalBackdrop';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">Form New Team</h3>
                <button onclick="window.closeModal()" class="text-gray-500 hover:text-gray-700"><i class="fas fa-times"></i></button>
            </div>
            <form id="createTeamForm" onsubmit="window.handleCreateTeam(event)" class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Select Event</label>
                    <select id="teamEventId" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                        ${availableEvents.map(e => `<option value="${e.id}">${e.title}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Team Name</label>
                    <input type="text" id="teamName" required class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="e.g. Digital Nomads">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Invite Code (Optional)</label>
                    <input type="text" id="teamInvite" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="e.g. DREAMTEAM123">
                </div>
                <div class="pt-4 flex gap-3">
                    <button type="button" onclick="window.closeModal()" class="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-bold">Cancel</button>
                    <button type="submit" class="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg">Create Team</button>
                </div>
            </form>
        </div>
    `;
    modalRoot.appendChild(modal);
};

window.handleCreateTeam = async (event) => {
    event.preventDefault();
    const teamName = document.getElementById('teamName').value;
    const eventId = document.getElementById('teamEventId').value;
    const inviteCode = document.getElementById('teamInvite').value.toUpperCase() || Math.random().toString(36).substring(2, 8).toUpperCase();

    const newTeam = {
        name: teamName,
        eventId: eventId,
        members: [{
            id: state.currentUser?.id,
            name: state.currentUser?.name,
            role: 'Team Lead',
            email: state.currentUser?.email
        }],
        maxMembers: 4,
        inviteCode: inviteCode
    };

    try {
        await dbOps.addTeam(newTeam);
        window.closeModal();
        showToast(`Team "${teamName}" created!`, 'success');
        window.navigate('teams');
    } catch (error) {
        showToast('Failed to create team', 'error');
    }
};

window.showAddRegistrationModal = () => {
    const modalRoot = document.getElementById('modal-root');
    const modal = document.createElement('div');
    modal.id = 'modalBackdrop';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">Add Participant Registration</h3>
                <button onclick="window.closeModal()" class="text-gray-500 hover:text-gray-700"><i class="fas fa-times"></i></button>
            </div>
            <form onsubmit="window.handleAddRegistration(event)" class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Select Event</label>
                    <select id="regEventId" required class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                        ${state.events.map(e => `<option value="${e.id}">${e.title}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Participant Name</label>
                    <input type="text" id="regName" required class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="e.g. John Doe">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Participant Email</label>
                    <input type="email" id="regEmail" required class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="e.g. john@example.com">
                </div>
                <div class="pt-4 flex gap-3">
                    <button type="button" onclick="window.closeModal()" class="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-bold">Cancel</button>
                    <button type="submit" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Confirm Registration</button>
                </div>
            </form>
        </div>
    `;
    modalRoot.appendChild(modal);
};

window.handleAddRegistration = async (event) => {
    event.preventDefault();
    const eventId = document.getElementById('regEventId').value;
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;

    const newReg = {
        eventId: eventId,
        userId: 'manual-' + Date.now(),
        name: name,
        email: email,
        status: 'confirmed',
        checkIn: false,
        registrationDate: new Date().toISOString().split('T')[0]
    };

    try {
        await dbOps.addRegistration(newReg);

        // Update event registration count
        const event = state.events.find(e => e.id === eventId);
        if (event) {
            await dbOps.updateEvent(eventId, { registered: (event.registered || 0) + 1 });
        }

        window.closeModal();
        showToast(`Registered ${name} successfully!`, 'success');
        window.navigate('registrations');
    } catch (error) {
        showToast('Failed to add registration', 'error');
    }
};

window.toggleRegistrationStatus = async (regId) => {
    const reg = state.registrations.find(r => r.id === regId);
    if (reg) {
        const newStatus = reg.status === 'confirmed' ? 'pending' : 'confirmed';
        try {
            await dbOps.updateRegistration(regId, { status: newStatus });
            showToast('Registration status updated', 'success');
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    }
};

window.deleteRegistration = async (regId) => {
    if (confirm('Are you sure you want to cancel this registration?')) {
        const reg = state.registrations.find(r => r.id === regId);
        if (reg) {
            try {
                // Update event count back
                const event = state.events.find(e => e.id === reg.eventId);
                if (event) {
                    await dbOps.updateEvent(reg.eventId, { registered: Math.max(0, (event.registered || 0) - 1) });
                }

                await dbOps.deleteRegistration(regId);
                showToast('Registration cancelled', 'info');
            } catch (error) {
                showToast('Failed to cancel registration', 'error');
            }
        }
    }
};

window.deleteEvent = async (eventId) => {
    if (confirm('Are you sure you want to delete this event? This will not delete registrations but the event will no longer be visible.')) {
        try {
            await dbOps.deleteEvent(eventId);
            showToast('Event deleted successfully', 'info');
        } catch (error) {
            showToast('Failed to delete event', 'error');
        }
    }
};

window.closeModal = () => {
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (modalBackdrop) modalBackdrop.remove();
};

window.seedSampleData = async () => {
    if (!confirm('This will seed your database with 3 sample events. Continue?')) return;

    const sampleEvents = [
        {
            title: "Tech Innovation Summit 2024",
            description: "A global gathering of tech leaders and innovators. Explore the future of AI, Quantum Computing, and Sustainability.",
            type: "Conference",
            date: "2024-06-15",
            time: "09:00",
            maxParticipants: 500,
            venue: "Silicon Valley Convention Center",
            registered: 0,
            status: "active",
            image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop"
        },
        {
            title: "Global AI Hackathon",
            description: "48 hours of intense coding, networking, and innovation. Build solutions for real-world problems using cutting-edge AI.",
            type: "Hackathon",
            date: "2024-07-20",
            time: "10:00",
            maxParticipants: 200,
            venue: "Online / Hybrid",
            registered: 0,
            status: "active",
            image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop"
        },
        {
            title: "Design Thinking Workshop",
            description: "Learn the fundamentals of user-centered design and problem-solving through interactive hands-on sessions.",
            type: "Workshop",
            date: "2024-05-12",
            time: "14:00",
            maxParticipants: 50,
            venue: "Creative Arts Hub, Room 101",
            registered: 0,
            status: "active",
            image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop"
        }
    ];

    try {
        for (const event of sampleEvents) {
            await dbOps.addEvent(event);
        }
        showToast('Sample data seeded successfully!', 'success');
    } catch (error) {
        showToast('Failed to seed data', 'error');
    }
};

window.exportRegistrations = () => {
    if (state.registrations.length === 0) {
        showToast('No registrations to export', 'warning');
        return;
    }

    const headers = ['ID', 'Name', 'Email', 'Event', 'Status', 'Registration Date', 'Check-in'];
    const rows = state.registrations.map(reg => {
        const event = state.events.find(e => e.id === reg.eventId);
        return [
            reg.id,
            reg.name,
            reg.email,
            event?.title || 'Unknown',
            reg.status,
            reg.registrationDate,
            reg.checkIn ? 'Yes' : 'No'
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Registrations_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exporting registrations...', 'info');
};

// --- Rendering Engine ---

function renderApp() {
    const app = document.getElementById('app');
    if (!app) return;

    if (!state.currentUser) {
        renderLoginOverlay();
        return;
    }

    if (state.isLoading) {
        app.innerHTML = `
            <div class="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        `;
        return;
    }

    app.innerHTML = `
        <div class="min-h-screen flex flex-col animate-fade-in">
            <div class="flex-1 flex">
                <!-- Sidebar -->
                <aside id="sidebar" class="w-64 bg-white dark:bg-gray-800 shadow-xl z-20 hidden md:flex flex-col">
                    ${renderSidebar()}
                </aside>

                <!-- Main Content -->
                <main class="flex-1 flex flex-col overflow-hidden">
                    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 z-10">
                        ${renderHeader()}
                    </header>
                    <div id="contentArea" class="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
                        ${renderView()}
                    </div>
                </main>
            </div>
            
            <!-- Mobile Overlay elements -->
            <div id="sidebarOverlay" class="fixed inset-0 bg-black bg-opacity-50 z-10 hidden" onclick="window.toggleSidebar()"></div>
            <div id="toastContainer" class="fixed bottom-4 right-4 z-50 flex flex-col gap-2"></div>
        </div>
    `;

    // Initialize charts if on admin dashboard
    if (state.currentUser.role === 'admin' && state.currentView === 'dashboard') {
        setTimeout(initAdminCharts, 0);
    }
}

function renderLoginOverlay() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div id="loginScreen" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 overflow-hidden">
            <!-- Animated Background Shapes -->
            <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s"></div>
            
            <div class="relative w-full max-w-lg mx-4">
                <div class="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-8 md:p-12">
                    <!-- Brand Section -->
                    <div class="text-center mb-10">
                        <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                            <i class="fas fa-calendar-alt text-3xl text-white"></i>
                        </div>
                        <h1 class="text-4xl font-black text-white tracking-tight mb-2">EventFlow</h1>
                        <p class="text-blue-100/60 font-medium">The Ultimate Event Management Core</p>
                    </div>

                    <!-- Sign In Form -->
                    <div id="loginFormContainer" class="space-y-6">
                        <div class="space-y-4">
                            <div class="relative group">
                                <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors"></i>
                                <input type="text" id="loginEmail" value="admin123" 
                                    class="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" 
                                    placeholder="Username or Email">
                            </div>
                            <div class="relative group">
                                <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors"></i>
                                <input type="password" id="loginPassword" value="password" 
                                    class="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all" 
                                    placeholder="••••••••">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <button onclick="window.login('admin')" 
                                class="group relative flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-blue-600/20 hover:border-blue-500/50 transition-all">
                                <i class="fas fa-user-shield text-xl text-blue-400"></i>
                                <span class="text-sm font-bold text-white">Admin Access</span>
                            </button>
                            <button onclick="window.login('participant')" 
                                class="group relative flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-purple-600/20 hover:border-purple-500/50 transition-all">
                                <i class="fas fa-user text-xl text-purple-400"></i>
                                <span class="text-sm font-bold text-white">Participant Login</span>
                            </button>
                        </div>

                        <div class="relative">
                            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-white/10"></div></div>
                            <div class="relative flex justify-center text-xs uppercase"><span class="bg-gray-900 px-2 text-white/30">Or continue with</span></div>
                        </div>

                        <button onclick="window.loginWithGoogle()" 
                            class="w-full flex items-center justify-center gap-3 py-4 bg-white text-gray-900 rounded-2xl font-bold hover:bg-blue-50 transition-all transform hover:scale-[1.02] shadow-xl">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5">
                            Sign in with Google
                        </button>

                        <div class="pt-4 text-center">
                            <p class="text-sm text-white/40">Don't have an account? <a href="javascript:void(0)" onclick="window.toggleAuthMode()" class="text-blue-400 font-bold hover:underline">Create Account</a></p>
                        </div>
                    </div>

                    <!-- Sign Up Form -->
                    <div id="signUpFormContainer" class="space-y-6 hidden">
                        <form onsubmit="window.handleSignUp(event)" class="space-y-4">
                            <div class="relative group">
                                <i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors"></i>
                                <input type="text" id="signUpName" required 
                                    class="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" 
                                    placeholder="Full Name">
                            </div>
                            <div class="relative group">
                                <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors"></i>
                                <input type="email" id="signUpEmail" required 
                                    class="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" 
                                    placeholder="Email Address">
                            </div>
                            <div class="relative group">
                                <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors"></i>
                                <input type="password" id="signUpPassword" required 
                                    class="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all" 
                                    placeholder="Create Password">
                            </div>
                            <button type="submit" 
                                class="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all transform hover:scale-[1.02]">
                                Create Account
                            </button>
                        </form>
                        <div class="pt-4 text-center">
                            <p class="text-sm text-white/40">Already have an account? <a href="javascript:void(0)" onclick="window.toggleAuthMode()" class="text-purple-400 font-bold hover:underline">Log In</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="toastContainer" class="fixed bottom-4 right-4 z-50 flex flex-col gap-2"></div>
    `;
}

function renderView() {
    if (state.currentUser.role === 'admin') {
        switch (state.currentView) {
            case 'dashboard':
                return renderAdminDashboard();
            case 'events':
                return renderEventsManagement();
            case 'registrations':
                return renderRegistrations();
            case 'notifications':
                return renderNotificationCenter();
            case 'checkin':
                return renderCheckIn();
            default:
                return `<div class="p-8 text-center text-gray-500">View "${state.currentView}" is under development for Admin.</div>`;
        }
    } else {
        switch (state.currentView) {
            case 'dashboard':
                return renderParticipantDashboard();
            case 'browse':
                return renderBrowseEvents();
            case 'teams':
                return renderMyTeams();
            case 'notifications':
                return renderNotificationCenter();
            case 'qr-scanner':
                return renderQRScanner();
            default:
                return `<div class="p-8 text-center text-gray-500">View "${state.currentView}" is under development for Participant.</div>`;
        }
    }
}

function setupRouting() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    if (state.currentUser) {
        state.currentView = hash;
    }
}

// Start the app
init();

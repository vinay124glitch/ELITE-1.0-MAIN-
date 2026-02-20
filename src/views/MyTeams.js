import { state } from '../state.js';
import { showToast } from '../utils/ui.js';
import { dbOps } from '../db.js';

export function renderMyTeams() {
    const myTeams = state.teams.filter(t => t.members.some(m => String(m.id) === String(state.currentUser?.id)));

    return `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">My Teams</h3>
                <button onclick="window.showCreateTeamModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg flex items-center gap-2">
                    <i class="fas fa-plus"></i> Create Team
                </button>
            </div>
            
            ${myTeams.length === 0 ? `
                <div class="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                    <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <i class="fas fa-users text-3xl text-gray-400"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">No teams yet</h4>
                    <p class="text-gray-500 dark:text-gray-400 mb-6">Create a team or join one with an invite code</p>
                </div>
            ` : `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${myTeams.map(team => {
        const event = state.events.find(e => String(e.id) === String(team.eventId));
        const isLead = team.members[0] && String(team.members[0].id) === String(state.currentUser?.id);

        return `
                            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 card-hover">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 class="text-xl font-bold text-gray-800 dark:text-white">${team.name}</h4>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">${event ? event.title : 'Unknown Event'}</p>
                                    </div>
                                    <span class="px-3 py-1 rounded-full text-xs font-medium ${isLead ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
                                        ${isLead ? 'Team Lead' : 'Member'}
                                    </span>
                                </div>
                                
                                <div class="mb-4">
                                    <div class="flex justify-between text-sm mb-2">
                                        <span class="text-gray-600 dark:text-gray-400">Team Members</span>
                                        <span class="font-medium text-gray-800 dark:text-white">${team.members.length}/${team.maxMembers}</span>
                                    </div>
                                    <div class="flex -space-x-2 overflow-hidden">
                                        ${team.members.map(m => `
                                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white font-bold text-sm" title="${m.name}">
                                                ${m.name.charAt(0)}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                ${isLead ? `
                                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Invite Code</p>
                                        <div class="flex items-center gap-2">
                                            <code class="flex-1 text-lg font-mono font-bold text-gray-800 dark:text-white bg-white dark:bg-gray-800 px-3 py-1 rounded border border-gray-200 dark:border-gray-600">${team.inviteCode}</code>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `;
    }).join('')}
                </div>
            `}

            <!-- Join Team Section -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
                <div class="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 class="text-2xl font-bold mb-2">Have an invite code?</h4>
                        <p class="text-blue-100">Join an existing team instantly</p>
                    </div>
                    <div class="flex gap-2 w-full md:w-auto">
                        <input type="text" id="joinCodeInput" placeholder="Enter code" class="px-4 py-3 rounded-lg text-gray-800 w-full md:w-64">
                        <button onclick="window.joinTeam()" class="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">Join</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.joinTeam = async () => {
    const code = document.getElementById('joinCodeInput')?.value.toUpperCase();
    if (!code) return;

    const team = state.teams.find(t => t.inviteCode === code);
    if (!team) {
        showToast('Invalid invite code!', 'error');
        return;
    }

    // Check if participant is registered for the team's event
    const isRegistered = state.registrations.some(r => String(r.eventId) === String(team.eventId) && String(r.userId) === String(state.currentUser?.id));
    if (!isRegistered) {
        showToast('You must be registered for this event to join the team!', 'error');
        return;
    }

    if (team.members.some(m => String(m.id) === String(state.currentUser?.id))) {
        showToast('Already in this team!', 'info');
        return;
    }

    if (team.members.length >= team.maxMembers) {
        showToast('Team is full!', 'error');
        return;
    }

    const updatedMembers = [...team.members, {
        id: state.currentUser?.id,
        name: state.currentUser?.name,
        role: 'Member',
        email: state.currentUser?.email
    }];

    try {
        await dbOps.updateTeam(team.id, { members: updatedMembers });
        showToast(`Joined ${team.name}!`, 'success');
        window.navigate('teams');
    } catch (error) {
        showToast('Failed to join team', 'error');
    }
};


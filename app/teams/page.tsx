'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/shared/Header';
import { SHIFTS } from '@/lib/data';

// Role responsibilities data - TO BE DEVELOPED
const ROLE_RESPONSIBILITIES: Record<string, { description: string; duties: string[] }> = {
    medical: { description: '', duties: [] },
    nursing: { description: '', duties: [] },
    optometry: { description: '', duties: [] },
    dentistry: { description: '', duties: [] },
    pharmacy: { description: '', duties: [] },
    registration: { description: '', duties: [] },
    triage: { description: '', duties: [] },
    logistics: { description: '', duties: [] },
};

export default function TeamsPage() {
    const { state } = useApp();
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

    const getParticipantName = (id: string) => {
        return state.participants.find(p => p.id === id)?.name || 'Unknown';
    };

    const getAssignmentsForRole = (roleId: string) => {
        return state.assignments.filter(a => a.roleId === roleId);
    };

    const getClinicDayName = (id: string) => {
        return state.clinicDays.find(d => d.id === id)?.name || '';
    };

    const getShiftName = (id: string) => {
        return SHIFTS.find(s => s.id === id)?.name || '';
    };

    const selectedRole = state.roles.find(r => r.id === selectedRoleId);
    const selectedRoleInfo = selectedRoleId ? ROLE_RESPONSIBILITIES[selectedRoleId] : null;
    const selectedRoleAssignments = selectedRoleId ? getAssignmentsForRole(selectedRoleId) : [];
    const uniqueParticipants = [...new Set(selectedRoleAssignments.map(a => a.participantId))];

    // Sort roles: Clinical first (alphabetically), then Support (alphabetically)
    const sortedRoles = [...state.roles].sort((a, b) => {
        // Clinical roles come first
        if (a.category === 'clinical' && b.category !== 'clinical') return -1;
        if (a.category !== 'clinical' && b.category === 'clinical') return 1;
        // Within same category, sort alphabetically
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-4">
                {/* Teams Sub-header Navigation */}
                <div className="flex flex-wrap items-center justify-center py-3 border-b border-[var(--border-subtle)] mb-6">
                    {sortedRoles.map((role, index) => (
                        <div key={role.id} className="flex items-center">
                            <button
                                onClick={() => setSelectedRoleId(selectedRoleId === role.id ? null : role.id)}
                                className={`
                                    px-3 py-1 text-sm transition-all flex items-center gap-1.5
                                    ${selectedRoleId === role.id
                                        ? 'text-blue-500 font-semibold'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                    }
                                `}
                            >
                                <span>{role.icon}</span>
                                <span>{role.name}</span>
                            </button>
                            {index < sortedRoles.length - 1 && (
                                <span className="text-[var(--border-subtle)] mx-1">|</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Selected Role Content */}
                {selectedRole && selectedRoleInfo ? (
                    <div className="max-w-2xl mx-auto animate-fade-in">
                        {/* Role Header */}
                        <div className="text-center mb-6">
                            <span className="text-4xl">{selectedRole.icon}</span>
                            <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-2">{selectedRole.name}</h2>
                            <p className="text-sm text-[var(--text-muted)] mt-1">{selectedRoleInfo.description}</p>
                        </div>

                        {/* Responsibilities */}
                        <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-6">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-3">
                                Key Responsibilities
                            </h3>
                            <ul className="space-y-2">
                                {selectedRoleInfo.duties.map((duty, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        <span>{duty}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Team Members */}
                        <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-3">
                                Team Members ({uniqueParticipants.length})
                            </h3>
                            {uniqueParticipants.length === 0 ? (
                                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                                    No members assigned to this role yet
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {uniqueParticipants.map(participantId => {
                                        const participantAssignments = selectedRoleAssignments.filter(a => a.participantId === participantId);

                                        return (
                                            <div
                                                key={participantId}
                                                className="p-3 rounded-lg bg-[var(--bg-card)] flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                                                        {getParticipantName(participantId).charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-[var(--text-primary)]">
                                                        {getParticipantName(participantId)}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {participantAssignments.length} shift{participantAssignments.length !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">👆</div>
                        <p className="text-[var(--text-primary)] font-medium">Select a team above</p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">View responsibilities and team members</p>
                    </div>
                )}
            </main>
        </div>
    );
}

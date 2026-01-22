'use client';

import { useApp } from '@/context/AppContext';
import Header from '@/components/shared/Header';
import { SHIFTS } from '@/lib/data';

export default function TeamsPage() {
    const { state } = useApp();

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

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-6">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Teams
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        View all teams and their assigned members
                    </p>
                </div>

                {/* Teams Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {state.roles.map(role => {
                        const assignments = getAssignmentsForRole(role.id);
                        const uniqueParticipants = [...new Set(assignments.map(a => a.participantId))];

                        return (
                            <div
                                key={role.id}
                                className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]"
                            >
                                {/* Role Header */}
                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--border-subtle)]">
                                    <span className="text-2xl">{role.icon}</span>
                                    <div>
                                        <h3 className="font-semibold text-[var(--text-primary)]">{role.name}</h3>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {uniqueParticipants.length} member{uniqueParticipants.length !== 1 ? 's' : ''} assigned
                                        </p>
                                    </div>
                                </div>

                                {/* Team Members */}
                                {uniqueParticipants.length === 0 ? (
                                    <p className="text-sm text-[var(--text-muted)] text-center py-4">
                                        No members assigned yet
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {uniqueParticipants.map(participantId => {
                                            const participantAssignments = assignments.filter(a => a.participantId === participantId);

                                            return (
                                                <div
                                                    key={participantId}
                                                    className="p-3 rounded-lg bg-[var(--bg-card)]"
                                                >
                                                    <div className="font-medium text-sm text-[var(--text-primary)]">
                                                        {getParticipantName(participantId)}
                                                    </div>
                                                    <div className="text-xs text-[var(--text-muted)] mt-1">
                                                        {participantAssignments.map((a, idx) => (
                                                            <span key={a.id}>
                                                                {getClinicDayName(a.clinicDayId)} - {getShiftName(a.shiftId)}
                                                                {idx < participantAssignments.length - 1 ? ', ' : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Summary */}
                <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">👥</span>
                        <div className="text-sm text-[var(--text-secondary)]">
                            <strong className="text-[var(--text-primary)]">{state.participants.length}</strong> total participants across{' '}
                            <strong className="text-[var(--text-primary)]">{state.roles.length}</strong> teams
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

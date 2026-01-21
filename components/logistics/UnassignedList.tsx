'use client';

import { useApp } from '@/context/AppContext';
import { getUnassignedParticipants } from '@/lib/calculations';
import { SHIFTS } from '@/lib/data';

interface UnassignedListProps {
    clinicDayId: string;
}

export default function UnassignedList({ clinicDayId }: UnassignedListProps) {
    const { state } = useApp();

    const unassigned = getUnassignedParticipants(state, clinicDayId);

    // Sort by number of shifts assigned (less = more prominent)
    const sorted = [...unassigned].sort((a, b) => a.shiftsAssigned - b.shiftsAssigned);

    // Group by assignment status
    const noShifts = sorted.filter(p => p.shiftsAssigned === 0);
    const partialShifts = sorted.filter(p => p.shiftsAssigned > 0 && p.shiftsAssigned < SHIFTS.length);

    if (noShifts.length === 0 && partialShifts.length === 0) {
        return (
            <div className="glass-card p-4 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm text-[var(--text-muted)]">
                    Everyone is fully assigned!
                </p>
            </div>
        );
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="glass-card p-4 space-y-4">
            {/* No Shifts Assigned */}
            {noShifts.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-full">No Shifts</span>
                        <span className="text-sm text-[var(--text-muted)]">
                            {noShifts.length} {noShifts.length === 1 ? 'person' : 'people'}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {noShifts.map(({ participant }) => (
                            <div
                                key={participant.id}
                                className="flex items-center gap-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg"
                            >
                                <div className="person-avatar bg-red-500">
                                    {getInitials(participant.name)}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-[var(--text-primary)]">
                                        {participant.name}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)]">
                                        {participant.email}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Partial Shifts */}
            {partialShifts.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-partial">Partial</span>
                        <span className="text-sm text-[var(--text-muted)]">
                            {partialShifts.length} {partialShifts.length === 1 ? 'person' : 'people'}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {partialShifts.map(({ participant, shiftsAssigned }) => (
                            <div
                                key={participant.id}
                                className="flex items-center justify-between p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="person-avatar bg-yellow-500">
                                        {getInitials(participant.name)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-[var(--text-primary)]">
                                            {participant.name}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)]">
                                            {shiftsAssigned}/{SHIFTS.length} shifts
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="pt-3 border-t border-[var(--border-subtle)]">
                <div className="text-xs text-[var(--text-muted)]">
                    💡 Tip: Contact these participants to confirm their availability
                </div>
            </div>
        </div>
    );
}

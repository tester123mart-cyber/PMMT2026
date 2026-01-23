'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/shared/Header';
import { SHIFTS } from '@/lib/data';

export default function DataViewPage() {
    const { state } = useApp();
    const [selectedClinicDayId, setSelectedClinicDayId] = useState<string>(
        state.clinicDays[0]?.id || ''
    );

    const selectedClinicDay = state.clinicDays.find(d => d.id === selectedClinicDayId);

    // Calculate staffing coverage analysis
    const staffingAnalysis = useMemo(() => {
        if (!selectedClinicDay) return null;

        const shiftData = SHIFTS.map(shift => {
            const shiftAssignments = state.assignments.filter(
                a => a.clinicDayId === selectedClinicDayId && a.shiftId === shift.id
            );

            const roleBreakdown = state.roles.map(role => {
                const count = shiftAssignments.filter(a => a.roleId === role.id).length;
                return { role, count };
            }).filter(r => r.count > 0);

            return {
                shift,
                totalStaff: shiftAssignments.length,
                roleBreakdown
            };
        });

        return shiftData;
    }, [selectedClinicDayId, state.assignments, state.roles, selectedClinicDay]);

    // Calculate participation analysis
    const participationAnalysis = useMemo(() => {
        const participantsWithAssignments = new Set(state.assignments.map(a => a.participantId));
        const participantsWithNoShifts = state.participants.filter(
            p => !participantsWithAssignments.has(p.id)
        );

        const assignmentCounts = state.participants.map(p => ({
            participant: p,
            shiftCount: state.assignments.filter(a => a.participantId === p.id).length
        })).sort((a, b) => b.shiftCount - a.shiftCount);

        const topContributors = assignmentCounts.slice(0, 5).filter(c => c.shiftCount > 0);
        const avgShiftsPerPerson = state.participants.length > 0
            ? (state.assignments.length / state.participants.length).toFixed(1)
            : '0';

        return {
            totalParticipants: state.participants.length,
            participantsAssigned: participantsWithAssignments.size,
            participantsUnassigned: participantsWithNoShifts.length,
            topContributors,
            avgShiftsPerPerson,
            unassignedList: participantsWithNoShifts.slice(0, 10)
        };
    }, [state.participants, state.assignments]);

    // Role distribution analysis
    const roleDistribution = useMemo(() => {
        const distribution = state.roles.map(role => {
            const count = state.assignments.filter(a => a.roleId === role.id).length;
            return { role, count };
        }).sort((a, b) => b.count - a.count);

        const totalAssignments = state.assignments.length;

        return distribution.map(d => ({
            ...d,
            percentage: totalAssignments > 0 ? ((d.count / totalAssignments) * 100).toFixed(0) : '0'
        }));
    }, [state.roles, state.assignments]);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-6">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Reporting
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Staffing analysis and participation insights
                    </p>
                </div>

                {/* Quick Stats */}
                <section className="mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                            <div className="text-2xl font-bold text-blue-500">{state.participants.length}</div>
                            <div className="text-xs text-[var(--text-muted)]">Total Participants</div>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                            <div className="text-2xl font-bold text-purple-500">{state.assignments.length}</div>
                            <div className="text-xs text-[var(--text-muted)]">Total Assignments</div>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                            <div className="text-2xl font-bold text-green-500">{state.clinicDays.length}</div>
                            <div className="text-xs text-[var(--text-muted)]">Clinic Days</div>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                            <div className="text-2xl font-bold text-orange-500">{participationAnalysis.avgShiftsPerPerson}</div>
                            <div className="text-xs text-[var(--text-muted)]">Avg Shifts/Person</div>
                        </div>
                    </div>
                </section>

                {/* Day Selector for Staffing Analysis */}
                <div className="mb-6">
                    <label className="text-sm text-[var(--text-muted)] mb-2 block">Select Clinic Day for Staffing Analysis</label>
                    <select
                        value={selectedClinicDayId}
                        onChange={(e) => setSelectedClinicDayId(e.target.value)}
                        className="input-field w-auto"
                    >
                        {state.clinicDays.map(day => (
                            <option key={day.id} value={day.id}>
                                {day.name} - {new Date(day.date).toLocaleDateString('en-AU', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Staffing Coverage */}
                    <section className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                            <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">👥</span>
                            Staffing Coverage - {selectedClinicDay?.name || 'Select Day'}
                        </h2>

                        {staffingAnalysis ? (
                            <div className="space-y-4">
                                {staffingAnalysis.map(({ shift, totalStaff, roleBreakdown }) => (
                                    <div key={shift.id} className="p-4 rounded-xl bg-[var(--bg-card)]">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="font-medium text-[var(--text-primary)]">{shift.name}</div>
                                            <div className="text-lg font-bold text-blue-500">{totalStaff} staff</div>
                                        </div>
                                        {roleBreakdown.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {roleBreakdown.map(({ role, count }) => (
                                                    <div key={role.id} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-secondary)] text-xs">
                                                        <span>{role.icon}</span>
                                                        <span>{role.name}</span>
                                                        <span className="font-bold text-blue-500">×{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-[var(--text-muted)]">No assignments yet</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-[var(--text-muted)]">
                                Select a clinic day to view staffing
                            </div>
                        )}
                    </section>

                    {/* Participation Status */}
                    <section className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                            <span className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">📊</span>
                            Participation Status
                        </h2>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 rounded-lg bg-green-500/10 text-center">
                                <div className="text-xl font-bold text-green-500">{participationAnalysis.participantsAssigned}</div>
                                <div className="text-xs text-[var(--text-muted)]">Assigned</div>
                            </div>
                            <div className="p-3 rounded-lg bg-orange-500/10 text-center">
                                <div className="text-xl font-bold text-orange-500">{participationAnalysis.participantsUnassigned}</div>
                                <div className="text-xs text-[var(--text-muted)]">Unassigned</div>
                            </div>
                        </div>

                        {participationAnalysis.unassignedList.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2">Unassigned Participants</h4>
                                <div className="flex flex-wrap gap-2">
                                    {participationAnalysis.unassignedList.map(p => (
                                        <span key={p.id} className="px-2 py-1 rounded-lg bg-orange-500/10 text-xs text-orange-500">
                                            {p.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {participationAnalysis.topContributors.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2">Top Contributors</h4>
                                <div className="space-y-2">
                                    {participationAnalysis.topContributors.map(({ participant, shiftCount }) => (
                                        <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-card)]">
                                            <span className="text-sm text-[var(--text-primary)]">{participant.name}</span>
                                            <span className="text-sm font-bold text-green-500">{shiftCount} shifts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Role Distribution */}
                    <section className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] lg:col-span-2">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                            <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">🎯</span>
                            Role Distribution (All Days)
                        </h2>

                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                            {roleDistribution.map(({ role, count, percentage }) => (
                                <div key={role.id} className="p-4 rounded-xl bg-[var(--bg-card)]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">{role.icon}</span>
                                        <div>
                                            <div className="font-medium text-[var(--text-primary)]">{role.name}</div>
                                            <div className="text-xs text-[var(--text-muted)]">{role.category}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-purple-500">{count}</span>
                                        <span className="text-xs text-[var(--text-muted)]">{percentage}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] mt-2 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Note about Flow Rate Analysis */}
                <div className="mt-8 p-4 rounded-xl bg-[var(--bg-secondary)] border border-dashed border-[var(--border-subtle)]">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">🚧</span>
                        <div className="text-sm text-[var(--text-muted)]">
                            <strong className="text-[var(--text-secondary)]">Coming Soon:</strong>
                            <span className="ml-1">
                                Flow rate analysis and patient capacity projections will be available in a future update.
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

/* 
=== FLOW RATE ANALYSIS - COMMENTED OUT FOR FUTURE REINSTATEMENT ===

import { calculatePatientCapacity } from '@/lib/calculations';
import { getClinicalRoles } from '@/lib/data';

const clinicalRoles = getClinicalRoles();

// Flow Rate Analysis Section
<section className="animate-fade-in">
    <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">📊</span>
        Flow Rate Analysis
    </h2>

    <div className="grid gap-4 lg:grid-cols-2">
        <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <h3 className="font-medium text-[var(--text-primary)] mb-4">Current Flow Rates by Role</h3>
            <div className="space-y-4">
                {clinicalRoles.map(role => {
                    const flowRate = state.flowRates.find(f => f.roleId === role.id);
                    const progressWidth = flowRate
                        ? Math.min((flowRate.patientsPerHourPerStaff / 10) * 100, 100)
                        : 0;

                    return (
                        <div key={role.id}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{role.icon}</span>
                                    <span className="text-sm font-medium">{role.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-blue-500">
                                        {flowRate?.patientsPerHourPerStaff ?? '-'}
                                    </span>
                                    <span className="text-xs text-[var(--text-muted)]">/hr/staff</span>
                                </div>
                            </div>
                            <div className="h-2 rounded-full bg-[var(--bg-card)] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                    style={{ width: `${progressWidth}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <h3 className="font-medium text-[var(--text-primary)] mb-4">Capacity Projections</h3>
            {selectedClinicDay ? (
                <div className="space-y-4">
                    {SHIFTS.map(shift => {
                        let totalCapacity = 0;
                        const roleCapacities: { role: string; icon: string; capacity: number }[] = [];

                        clinicalRoles.forEach(role => {
                            const capacity = calculatePatientCapacity(state, selectedClinicDayId, shift.id, role.id);
                            totalCapacity += capacity.projectedPatients;
                            roleCapacities.push({
                                role: role.name,
                                icon: role.icon,
                                capacity: capacity.projectedPatients
                            });
                        });

                        return (
                            <div key={shift.id} className="p-4 rounded-xl bg-[var(--bg-card)]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="font-medium">{shift.name}</div>
                                    <div className="text-xl font-bold text-purple-500">{totalCapacity} pts</div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {roleCapacities.map(rc => (
                                        <div key={rc.role} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-secondary)] text-xs">
                                            <span>{rc.icon}</span>
                                            <span>{rc.capacity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                    <div className="text-4xl mb-2">📅</div>
                    <p>Select a clinic day to view projections</p>
                </div>
            )}
        </div>
    </div>
</section>

=== END FLOW RATE ANALYSIS ===
*/

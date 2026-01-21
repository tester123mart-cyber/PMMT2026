'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/shared/Header';
import { ShiftId } from '@/lib/types';
import { calculatePatientCapacity } from '@/lib/calculations';
import { getClinicalRoles, SHIFTS } from '@/lib/data';

export default function DataViewPage() {
    const { state } = useApp();
    const [selectedClinicDayId, setSelectedClinicDayId] = useState<string>(
        state.clinicDays[0]?.id || ''
    );

    const clinicalRoles = getClinicalRoles();
    const selectedClinicDay = state.clinicDays.find(d => d.id === selectedClinicDayId);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-6">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Data View
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Flow rate analysis and capacity projections
                    </p>
                </div>

                {/* Day Selector */}
                <div className="mb-6">
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

                {/* Flow Rate Analysis */}
                <section className="animate-fade-in">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                        <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">📊</span>
                        Flow Rate Analysis
                    </h2>

                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* By Role */}
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
                                            {flowRate?.source === 'actual' && (
                                                <div className="text-xs text-green-600 mt-1">✓ Updated from actual data</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Capacity Projections */}
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

                {/* Summary Stats */}
                <section className="mt-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                        <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">📈</span>
                        Summary Statistics
                    </h2>

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
                            <div className="text-2xl font-bold text-orange-500">{clinicalRoles.length}</div>
                            <div className="text-xs text-[var(--text-muted)]">Clinical Roles</div>
                        </div>
                    </div>
                </section>

                {/* Info Banner */}
                <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">💡</span>
                        <div className="text-sm text-[var(--text-secondary)]">
                            <strong className="text-[var(--text-primary)]">About Flow Rates:</strong>
                            <span className="ml-1">
                                Flow rates represent how many patients each staff member can serve per hour.
                                These baseline rates are used to calculate projected patient capacity for each shift.
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

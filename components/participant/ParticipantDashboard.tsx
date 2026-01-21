'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShiftId } from '@/lib/types';
import { SHIFTS } from '@/lib/data';
import ShiftCard from './ShiftCard';
import RoleSelector from './RoleSelector';
import Header from '../shared/Header';

export default function ParticipantDashboard() {
    const { state, getMyAssignments } = useApp();
    const [selectedShiftId, setSelectedShiftId] = useState<ShiftId | null>(null);

    // Get today and tomorrow's clinic days
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const todayClinicDay = state.clinicDays.find(d => d.date === today);
    const tomorrowClinicDay = state.clinicDays.find(d => d.date === tomorrow);

    // For demo purposes, use first available clinic day if today/tomorrow not found
    const activeClinicDay = todayClinicDay || state.clinicDays[0];
    const nextClinicDay = tomorrowClinicDay || state.clinicDays[1] || state.clinicDays[0];

    const todayAssignments = activeClinicDay ? getMyAssignments(activeClinicDay.id) : [];
    const tomorrowAssignments = nextClinicDay ? getMyAssignments(nextClinicDay.id) : [];

    // Get role details for assignments
    const getRoleDetails = (roleId: string) => state.roles.find(r => r.id === roleId);
    const getShiftDetails = (shiftId: ShiftId) => SHIFTS.find(s => s.id === shiftId);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-6">
                {/* Today's Schedule */}
                <section className="section animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="section-title flex items-center gap-2">
                            <span className="text-2xl">📅</span>
                            Today&apos;s Schedule
                        </h2>
                        {activeClinicDay && (
                            <span className="text-sm text-[var(--text-muted)]">
                                {activeClinicDay.name}
                            </span>
                        )}
                    </div>

                    {todayAssignments.length === 0 ? (
                        <div className="glass-card p-6 text-center">
                            <div className="text-4xl mb-3">😌</div>
                            <p className="text-[var(--text-secondary)]">
                                No shifts assigned for today
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-3">
                            {SHIFTS.map(shift => {
                                const assignment = todayAssignments.find(a => a.shiftId === shift.id);
                                const role = assignment ? getRoleDetails(assignment.roleId) : null;

                                return (
                                    <ShiftCard
                                        key={shift.id}
                                        shift={shift}
                                        role={role}
                                        isAssigned={!!assignment}
                                    />
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Tomorrow's Selection */}
                <section className="section animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="section-title flex items-center gap-2">
                            <span className="text-2xl">✋</span>
                            Choose Tomorrow&apos;s Shifts
                        </h2>
                        {nextClinicDay && (
                            <span className="text-sm text-[var(--text-muted)]">
                                {nextClinicDay.name}
                            </span>
                        )}
                    </div>

                    {/* Shift Selection Tabs */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {SHIFTS.map(shift => {
                            const isSelected = selectedShiftId === shift.id;
                            const hasAssignment = tomorrowAssignments.some(a => a.shiftId === shift.id);

                            return (
                                <button
                                    key={shift.id}
                                    onClick={() => setSelectedShiftId(isSelected ? null : shift.id)}
                                    className={`
                    flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all
                    ${isSelected
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                        }
                    ${hasAssignment ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-[var(--bg-primary)]' : ''}
                  `}
                                >
                                    <div className="text-left">
                                        <div className="text-sm">{shift.name}</div>
                                        <div className="text-xs opacity-75">{shift.startTime} - {shift.endTime}</div>
                                    </div>
                                    {hasAssignment && (
                                        <span className="ml-2 text-green-400">✓</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Role Selector */}
                    {selectedShiftId && nextClinicDay ? (
                        <RoleSelector
                            clinicDayId={nextClinicDay.id}
                            shiftId={selectedShiftId}
                            onClose={() => setSelectedShiftId(null)}
                        />
                    ) : (
                        <div className="glass-card p-6 text-center">
                            <div className="text-4xl mb-3">👆</div>
                            <p className="text-[var(--text-secondary)]">
                                Tap a shift above to select your role
                            </p>
                        </div>
                    )}
                </section>

                {/* My Commitments Summary */}
                {tomorrowAssignments.length > 0 && (
                    <section className="section animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <h2 className="section-title flex items-center gap-2">
                            <span className="text-2xl">✅</span>
                            Your Commitments for Tomorrow
                        </h2>

                        <div className="glass-card p-4">
                            <div className="space-y-3">
                                {tomorrowAssignments.map(assignment => {
                                    const role = getRoleDetails(assignment.roleId);
                                    const shift = getShiftDetails(assignment.shiftId);

                                    return (
                                        <div
                                            key={assignment.id}
                                            className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{role?.icon}</span>
                                                <div>
                                                    <div className="font-medium">{role?.name}</div>
                                                    <div className="text-sm text-[var(--text-muted)]">
                                                        {shift?.name} ({shift?.startTime} - {shift?.endTime})
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="badge badge-available">Confirmed</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

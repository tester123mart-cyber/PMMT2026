'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShiftId } from '@/lib/types';
import { SHIFTS } from '@/lib/data';
import RoleSelector from './RoleSelector';
import Header from '../shared/Header';

export default function ParticipantDashboard() {
    const { state, getMyAssignments, removeAssignment } = useApp();
    const [selectedShiftId, setSelectedShiftId] = useState<ShiftId | null>(null);
    const [selectedClinicDayId, setSelectedClinicDayId] = useState<string>(
        state.clinicDays[0]?.id || ''
    );

    const selectedClinicDay = state.clinicDays.find(d => d.id === selectedClinicDayId);
    const allAssignments = state.assignments.filter(a => a.participantId === state.currentUser?.id);
    const selectedDayAssignments = selectedClinicDay ? getMyAssignments(selectedClinicDay.id) : [];

    const getRoleDetails = (roleId: string) => state.roles.find(r => r.id === roleId);
    const getShiftDetails = (shiftId: ShiftId) => SHIFTS.find(s => s.id === shiftId);
    const getClinicDayDetails = (clinicDayId: string) => state.clinicDays.find(d => d.id === clinicDayId);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-AU', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-6 max-w-2xl">
                {/* Welcome */}
                <div className="mb-8 text-center">
                    <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                        Welcome, {state.currentUser?.name?.split(' ')[0] || 'Participant'}
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] italic mt-1">
                        &quot;Do everything in love.&quot; — 1 Corinthians 16:14
                    </p>
                </div>

                {/* All Assigned Roles */}
                <section className="mb-8">
                    <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
                        All Assigned Roles
                    </h2>

                    {allAssignments.length === 0 ? (
                        <div className="p-8 rounded-xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] text-center border border-[var(--border-subtle)]">
                            <div className="text-4xl mb-3">🎉</div>
                            <p className="text-lg font-medium text-[var(--text-primary)]">You&apos;re free!</p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Select a shift below to sign up for a role.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {allAssignments.map(assignment => {
                                const role = getRoleDetails(assignment.roleId);
                                const shift = getShiftDetails(assignment.shiftId);
                                const clinicDay = getClinicDayDetails(assignment.clinicDayId);

                                return (
                                    <div
                                        key={assignment.id}
                                        className="group p-4 rounded-xl bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-blue-500/30 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                    <span className="text-2xl">{role?.icon}</span>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-[var(--text-primary)] text-lg">{role?.name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-medium">
                                                            {clinicDay?.name}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                                                            {shift?.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeAssignment(assignment.id)}
                                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Choose Shifts */}
                <section>
                    {/* Shift buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        {SHIFTS.map(shift => {
                            const isSelected = selectedShiftId === shift.id;
                            const hasAssignment = selectedDayAssignments.some(a => a.shiftId === shift.id);

                            return (
                                <button
                                    key={shift.id}
                                    onClick={() => setSelectedShiftId(isSelected ? null : shift.id)}
                                    className={`
                                        flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all text-left sm:text-center
                                        ${isSelected
                                            ? 'bg-blue-500 text-white'
                                            : hasAssignment
                                                ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                                        }
                                    `}
                                >
                                    <div className="font-semibold">{shift.name.replace(' Shift', '')}</div>
                                    <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                                        {shift.startTime} - {shift.endTime}
                                    </div>
                                    {hasAssignment && <div className="text-xs mt-1 text-green-600 font-bold">✓ Assigned</div>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Role Selector */}
                    {selectedShiftId && selectedClinicDay ? (
                        <RoleSelector
                            clinicDayId={selectedClinicDay.id}
                            shiftId={selectedShiftId}
                            onClose={() => setSelectedShiftId(null)}
                        />
                    ) : (
                        <div className="p-4 rounded-lg bg-[var(--bg-secondary)] text-center text-sm text-[var(--text-muted)]">
                            Select a shift to choose your role
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

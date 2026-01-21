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
                        <div className="p-6 rounded-xl bg-[var(--bg-secondary)] text-center">
                            <p className="text-[var(--text-primary)]">You&apos;re free!</p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">No roles assigned yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {allAssignments.map(assignment => {
                                const role = getRoleDetails(assignment.roleId);
                                const shift = getShiftDetails(assignment.shiftId);
                                const clinicDay = getClinicDayDetails(assignment.clinicDayId);

                                return (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{role?.icon}</span>
                                            <div>
                                                <div className="font-medium text-[var(--text-primary)]">{role?.name}</div>
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {clinicDay?.name} • {shift?.name}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeAssignment(assignment.id)}
                                            className="text-xs text-[var(--text-muted)] hover:text-red-500"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Choose Shifts */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">
                            Add Role
                        </h2>
                        <select
                            value={selectedClinicDayId}
                            onChange={(e) => {
                                setSelectedClinicDayId(e.target.value);
                                setSelectedShiftId(null);
                            }}
                            className="text-sm py-1 px-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                        >
                            {state.clinicDays.map(day => (
                                <option key={day.id} value={day.id}>
                                    {day.name} ({formatDate(day.date)})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Shift buttons */}
                    <div className="flex gap-2 mb-4">
                        {SHIFTS.map(shift => {
                            const isSelected = selectedShiftId === shift.id;
                            const hasAssignment = selectedDayAssignments.some(a => a.shiftId === shift.id);

                            return (
                                <button
                                    key={shift.id}
                                    onClick={() => setSelectedShiftId(isSelected ? null : shift.id)}
                                    className={`
                                        flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all
                                        ${isSelected
                                            ? 'bg-blue-500 text-white'
                                            : hasAssignment
                                                ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                                        }
                                    `}
                                >
                                    {shift.name.replace(' Shift', '')}
                                    {hasAssignment && ' ✓'}
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

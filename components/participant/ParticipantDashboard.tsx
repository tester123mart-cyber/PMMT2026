'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShiftId } from '@/lib/types';
import { SHIFTS } from '@/lib/data';
import ShiftCard from './ShiftCard';
import RoleSelector from './RoleSelector';
import Header from '../shared/Header';

export default function ParticipantDashboard() {
    const { state, getMyAssignments, removeAssignment } = useApp();
    const [selectedShiftId, setSelectedShiftId] = useState<ShiftId | null>(null);
    const [selectedClinicDayId, setSelectedClinicDayId] = useState<string>(
        state.clinicDays[1]?.id || state.clinicDays[0]?.id || ''
    );
    const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

    // Get today's clinic day
    const today = new Date().toISOString().split('T')[0];
    const todayClinicDay = state.clinicDays.find(d => d.date === today);
    const activeClinicDay = todayClinicDay || state.clinicDays[0];

    // Get selected clinic day for shift selection
    const selectedClinicDay = state.clinicDays.find(d => d.id === selectedClinicDayId);

    const todayAssignments = activeClinicDay ? getMyAssignments(activeClinicDay.id) : [];
    const selectedDayAssignments = selectedClinicDay ? getMyAssignments(selectedClinicDay.id) : [];

    // Get role details for assignments
    const getRoleDetails = (roleId: string) => state.roles.find(r => r.id === roleId);
    const getShiftDetails = (shiftId: ShiftId) => SHIFTS.find(s => s.id === shiftId);

    const handleRemoveAssignment = (assignmentId: string) => {
        removeAssignment(assignmentId);
        setEditingAssignmentId(null);
    };

    const formatClinicDay = (clinicDay: typeof state.clinicDays[0]) => {
        return `${clinicDay.name} - ${new Date(clinicDay.date).toLocaleDateString('en-AU', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        })}`;
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-6">
                {/* Welcome Banner */}
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {state.currentUser?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                                Welcome, {state.currentUser?.name?.split(' ')[0] || 'Participant'}
                            </h1>
                            <p className="text-sm text-[var(--text-muted)] italic">
                                &quot;Do everything in love.&quot; — 1 Corinthians 16:14
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                        <div className="text-2xl font-bold text-blue-500">{todayAssignments.length}</div>
                        <div className="text-xs text-[var(--text-muted)]">Today&apos;s Shifts</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                        <div className="text-2xl font-bold text-purple-500">{selectedDayAssignments.length}</div>
                        <div className="text-xs text-[var(--text-muted)]">Selected Day</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                        <div className="text-2xl font-bold text-green-500">{state.clinicDays.length}</div>
                        <div className="text-xs text-[var(--text-muted)]">Clinic Days</div>
                    </div>
                </div>

                {/* Today's Schedule */}
                <section className="mb-8 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">📅</span>
                            Today&apos;s Schedule
                        </h2>
                        {activeClinicDay && (
                            <span className="text-sm px-3 py-1 rounded-full bg-blue-500/10 text-blue-600">
                                {activeClinicDay.name}
                            </span>
                        )}
                    </div>

                    {todayAssignments.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                            <div className="text-5xl mb-4">🌴</div>
                            <p className="text-[var(--text-primary)] font-medium">No shifts assigned for today</p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Enjoy your rest day!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todayAssignments.map(assignment => {
                                const role = getRoleDetails(assignment.roleId);
                                const shift = getShiftDetails(assignment.shiftId);
                                const isEditing = editingAssignmentId === assignment.id;

                                return (
                                    <div
                                        key={assignment.id}
                                        className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-2xl shadow-md">
                                                    {role?.icon}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-[var(--text-primary)]">{role?.name}</div>
                                                    <div className="text-sm text-[var(--text-muted)]">
                                                        {shift?.name} • {shift?.startTime} - {shift?.endTime}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleRemoveAssignment(assignment.id)}
                                                            className="px-3 py-1 text-sm rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                        >
                                                            Remove
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingAssignmentId(null)}
                                                            className="px-3 py-1 text-sm rounded-lg bg-[var(--bg-card)] text-[var(--text-muted)]"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingAssignmentId(assignment.id)}
                                                        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Choose Shifts Section */}
                <section className="mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">✋</span>
                            Choose Shifts
                        </h2>
                        <select
                            value={selectedClinicDayId}
                            onChange={(e) => {
                                setSelectedClinicDayId(e.target.value);
                                setSelectedShiftId(null);
                            }}
                            className="input-field w-auto text-sm py-2"
                        >
                            {state.clinicDays.map(day => (
                                <option key={day.id} value={day.id}>
                                    {formatClinicDay(day)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Shift Selection Cards */}
                    <div className="grid gap-3 md:grid-cols-3 mb-4">
                        {SHIFTS.map(shift => {
                            const isSelected = selectedShiftId === shift.id;
                            const assignment = selectedDayAssignments.find(a => a.shiftId === shift.id);
                            const hasAssignment = !!assignment;
                            const assignedRole = hasAssignment ? getRoleDetails(assignment.roleId) : null;

                            return (
                                <button
                                    key={shift.id}
                                    onClick={() => setSelectedShiftId(isSelected ? null : shift.id)}
                                    className={`
                                        p-4 rounded-xl text-left transition-all border-2
                                        ${isSelected
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg scale-[1.02]'
                                            : hasAssignment
                                                ? 'bg-green-500/5 border-green-500/30 hover:border-green-500/50'
                                                : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] hover:border-blue-500/30'
                                        }
                                    `}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className={`font-semibold ${isSelected ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                                                {shift.name.replace(' Shift', '')}
                                            </div>
                                            <div className={`text-sm ${isSelected ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                                                {shift.startTime} - {shift.endTime}
                                            </div>
                                        </div>
                                        {hasAssignment && (
                                            <div className="flex items-center gap-1">
                                                <span>{assignedRole?.icon}</span>
                                                <span className={`text-xs ${isSelected ? 'text-white' : 'text-green-600'}`}>✓</span>
                                            </div>
                                        )}
                                    </div>
                                    {hasAssignment && !isSelected && (
                                        <div className="mt-2 text-xs text-green-600 font-medium">
                                            {assignedRole?.name}
                                        </div>
                                    )}
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
                        <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-dashed border-[var(--border-subtle)] text-center">
                            <div className="text-3xl mb-2">☝️</div>
                            <p className="text-[var(--text-secondary)]">
                                Select a shift above to choose your role
                            </p>
                        </div>
                    )}
                </section>

                {/* My Commitments for Selected Day */}
                {selectedDayAssignments.length > 0 && (
                    <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                            <span className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">✅</span>
                            Your Commitments for {selectedClinicDay?.name || 'Selected Day'}
                        </h2>

                        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                            <div className="space-y-3">
                                {selectedDayAssignments.map(assignment => {
                                    const role = getRoleDetails(assignment.roleId);
                                    const shift = getShiftDetails(assignment.shiftId);

                                    return (
                                        <div
                                            key={assignment.id}
                                            className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/20 rounded-xl"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-2xl shadow-md">
                                                    {role?.icon}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-[var(--text-primary)]">{role?.name}</div>
                                                    <div className="text-sm text-[var(--text-muted)]">
                                                        {shift?.name} • {shift?.startTime} - {shift?.endTime}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveAssignment(assignment.id)}
                                                className="text-sm text-[var(--text-muted)] hover:text-red-500 transition-colors"
                                            >
                                                Remove
                                            </button>
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

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
                        <div className="space-y-6">
                            {/* Group assignments by Clinic Day */}
                            {Array.from(new Set(allAssignments.map(a => a.clinicDayId)))
                                .sort()
                                .map(dayId => {
                                    const dayAssignments = allAssignments.filter(a => a.clinicDayId === dayId);
                                    const day = getClinicDayDetails(dayId);

                                    // Dynamic Color Palette for Clinic Days
                                    const getDayColor = (name: string = '') => {
                                        if (name.includes('1')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                                        if (name.includes('2')) return 'bg-violet-50 text-violet-800 border-violet-200';
                                        if (name.includes('3')) return 'bg-cyan-50 text-cyan-800 border-cyan-200';
                                        if (name.includes('4')) return 'bg-amber-50 text-amber-800 border-amber-200';
                                        if (name.includes('5')) return 'bg-rose-50 text-rose-800 border-rose-200';
                                        return 'bg-gray-50 text-gray-800 border-gray-200';
                                    };

                                    const dayTheme = getDayColor(day?.name);

                                    return (
                                        <div key={dayId} className="space-y-3">
                                            {/* Day Header */}
                                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border w-fit ${dayTheme}`}>
                                                <span className="text-xs font-bold uppercase tracking-wider">{day?.name}</span>
                                                <span className="text-xs opacity-70">|</span>
                                                <span className="text-xs font-medium">{day ? formatDate(day.date) : ''}</span>
                                            </div>

                                            {/* Assignments for this Day */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {dayAssignments.map(assignment => {
                                                    const role = getRoleDetails(assignment.roleId);
                                                    const shift = getShiftDetails(assignment.shiftId);

                                                    return (
                                                        <div
                                                            key={assignment.id}
                                                            className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-blue-500/30 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-lg">
                                                                    {role?.icon}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-sm text-[var(--text-primary)]">{role?.name}</div>
                                                                    <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md w-fit mt-0.5 border ${shift?.id === 'morning1'
                                                                        ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                                                        : shift?.id === 'morning2'
                                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                            : shift?.id === 'afternoon'
                                                                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                                                                : 'bg-gray-50 text-gray-700 border-gray-200'
                                                                        }`}>
                                                                        {shift?.name}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeAssignment(assignment.id)}
                                                                className="w-6 h-6 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                                title="Remove Assignment"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </section>

                {/* Choose Shifts */}
                <section className="mt-10">
                    <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide mb-4">
                        Select Clinic Day
                    </h2>

                    {/* Clinic Day Tabs */}
                    <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: `repeat(${Math.min(state.clinicDays.length, 4)}, 1fr)` }}>
                        {state.clinicDays.map(day => (
                            <button
                                key={day.id}
                                onClick={() => {
                                    setSelectedClinicDayId(day.id);
                                    setSelectedShiftId(null);
                                }}
                                className={`
                                    p-4 rounded-xl text-center font-medium transition-all
                                    ${selectedClinicDayId === day.id
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                                    }
                                `}
                            >
                                <div className="text-sm font-semibold">{day.name}</div>
                                <div className={`text-xs mt-1 ${selectedClinicDayId === day.id ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                                    {formatDate(day.date)}
                                </div>
                            </button>
                        ))}
                    </div>

                    <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide mb-4">
                        Select Shift for {selectedClinicDay?.name || 'Selected Day'}
                    </h2>

                    {/* Shift buttons - Mobile optimized */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {SHIFTS.map(shift => {
                            const isSelected = selectedShiftId === shift.id;
                            const hasAssignment = selectedDayAssignments.some(a => a.shiftId === shift.id);

                            return (
                                <button
                                    key={shift.id}
                                    onClick={() => setSelectedShiftId(shift.id)}
                                    className={`
                                        relative py-5 px-3 rounded-2xl text-center font-medium transition-all
                                        min-h-[80px] active:scale-95 touch-manipulation
                                        ${isSelected
                                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/50'
                                            : hasAssignment
                                                ? 'bg-green-50 text-green-700 border-2 border-green-400'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-blue-400 hover:shadow-md'
                                        }
                                    `}
                                >
                                    {/* Emoji Icon */}
                                    <div className="text-2xl mb-1">
                                        {shift.id === 'morning1' ? '🌅' : shift.id === 'morning2' ? '☀️' : '🌇'}
                                    </div>
                                    {/* Session Number */}
                                    <div className="text-lg font-bold">
                                        {shift.id === 'morning1' ? '1st' : shift.id === 'morning2' ? '2nd' : '3rd'}
                                    </div>
                                    {/* Time Label */}
                                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                                        {shift.startTime}
                                    </div>
                                    {/* Assigned Badge */}
                                    {hasAssignment && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shadow">
                                            ✓
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Role Selector - Fixed height container to prevent scroll bounce */}
                    <div id="role-selector-area" className="min-h-[200px]">
                        {selectedShiftId && selectedClinicDay ? (
                            <RoleSelector
                                clinicDayId={selectedClinicDay.id}
                                shiftId={selectedShiftId}
                                onClose={() => setSelectedShiftId(null)}
                            />
                        ) : (
                            <div className="p-6 rounded-xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] text-center border border-dashed border-[var(--border-subtle)]">
                                <div className="text-3xl mb-2">👆</div>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Tap a session above to choose your role
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

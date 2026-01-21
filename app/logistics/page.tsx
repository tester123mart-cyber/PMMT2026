'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/shared/Header';
import StaffingGrid from '@/components/logistics/StaffingGrid';
import CapacityPanel from '@/components/logistics/CapacityPanel';
import UnassignedList from '@/components/logistics/UnassignedList';

export default function LogisticsPage() {
    const { state } = useApp();
    const [selectedClinicDayId, setSelectedClinicDayId] = useState<string>(
        state.clinicDays[0]?.id || ''
    );

    const selectedClinicDay = state.clinicDays.find(d => d.id === selectedClinicDayId);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-6">
                {/* Page Header */}
                <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="page-title">Dashboard</h1>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                            Staffing levels, capacity planning, and coordination
                        </p>
                    </div>

                    {/* Clinic Day Selector */}
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

                {/* Main Grid Layout */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Staffing Grid - Takes 2 columns on large screens */}
                    <div className="lg:col-span-2">
                        <section className="section animate-fade-in">
                            <h2 className="section-title flex items-center gap-2">
                                <span className="text-xl">👥</span>
                                Staffing Overview
                            </h2>
                            {selectedClinicDayId && (
                                <StaffingGrid clinicDayId={selectedClinicDayId} />
                            )}
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">

                        {/* Unassigned Participants */}
                        <section className="section animate-fade-in" style={{ animationDelay: '200ms' }}>
                            <h2 className="section-title flex items-center gap-2">
                                <span className="text-xl">⚠️</span>
                                Needs Assignment
                            </h2>
                            {selectedClinicDayId && (
                                <UnassignedList clinicDayId={selectedClinicDayId} />
                            )}
                        </section>
                    </div>
                </div>

                {/* Quick Stats */}
                {selectedClinicDay && (
                    <section className="section animate-slide-up mt-6" style={{ animationDelay: '300ms' }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                icon="👥"
                                label="Total Participants"
                                value={state.participants.length}
                            />
                            <StatCard
                                icon="✅"
                                label="Assignments Today"
                                value={state.assignments.filter(a => a.clinicDayId === selectedClinicDayId).length}
                            />
                            <StatCard
                                icon="🎫"
                                label="Tickets Issued"
                                value={selectedClinicDay.patientTicketsIssued}
                            />
                            <StatCard
                                icon="🏥"
                                label="Patients Served"
                                value={selectedClinicDay.actualPatientsServed ?? '-'}
                            />
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number | string }) {
    return (
        <div className="glass-card p-4">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
                    <div className="text-xs text-[var(--text-muted)]">{label}</div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/shared/Header';
import ShiftDataEntry from '@/components/operations/ShiftDataEntry';
import DataFeedback from '@/components/operations/DataFeedback';
import { ShiftId } from '@/lib/types';
import { SHIFTS } from '@/lib/data';

export default function OperationsPage() {
    const { state } = useApp();
    const [selectedClinicDayId, setSelectedClinicDayId] = useState<string>(
        state.clinicDays[0]?.id || ''
    );
    const [selectedShiftId, setSelectedShiftId] = useState<ShiftId>('morning1');
    const [showFeedback, setShowFeedback] = useState(false);

    const selectedClinicDay = state.clinicDays.find(d => d.id === selectedClinicDayId);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-6">
                {/* Page Header */}
                <div className="page-header">
                    <h1 className="page-title">Live Operations</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Record actual clinic data to improve future planning
                    </p>
                </div>

                {/* Selectors */}
                <div className="flex flex-wrap gap-4 mb-6">
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

                    <div className="flex gap-2">
                        {SHIFTS.map(shift => (
                            <button
                                key={shift.id}
                                onClick={() => setSelectedShiftId(shift.id)}
                                className={`
                  px-4 py-2 rounded-lg font-medium transition-all
                  ${selectedShiftId === shift.id
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                    }
                `}
                            >
                                {shift.name.replace(' Shift', '')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Data Entry Form */}
                    <section className="animate-fade-in">
                        <h2 className="section-title flex items-center gap-2 mb-4">
                            <span className="text-xl">📝</span>
                            Record Shift Data
                        </h2>
                        {selectedClinicDayId && (
                            <ShiftDataEntry
                                clinicDayId={selectedClinicDayId}
                                shiftId={selectedShiftId}
                                onSave={() => setShowFeedback(true)}
                            />
                        )}
                    </section>

                    {/* Data Feedback / Results */}
                    <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                        <h2 className="section-title flex items-center gap-2 mb-4">
                            <span className="text-xl">📊</span>
                            Flow Rate Analysis
                        </h2>
                        {selectedClinicDayId && (
                            <DataFeedback
                                clinicDayId={selectedClinicDayId}
                                shiftId={selectedShiftId}
                            />
                        )}
                    </section>
                </div>

                {/* Tickets Management */}
                {selectedClinicDay && (
                    <section className="mt-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <h2 className="section-title flex items-center gap-2 mb-4">
                            <span className="text-xl">🎫</span>
                            Ticket Management
                        </h2>
                        <TicketManager clinicDay={selectedClinicDay} />
                    </section>
                )}
            </main>
        </div>
    );
}

function TicketManager({ clinicDay }: { clinicDay: NonNullable<ReturnType<typeof import('@/context/AppContext').useApp>['state']['clinicDays'][0]> }) {
    const { state, dispatch } = useApp();
    const [ticketInput, setTicketInput] = useState(clinicDay.patientTicketsIssued.toString());
    const [actualInput, setActualInput] = useState(clinicDay.actualPatientsServed?.toString() || '');

    const handleUpdateTickets = () => {
        const tickets = parseInt(ticketInput) || 0;
        dispatch({
            type: 'UPDATE_CLINIC_DAY',
            payload: { ...clinicDay, patientTicketsIssued: tickets }
        });
    };

    const handleUpdateActual = () => {
        const actual = parseInt(actualInput) || 0;
        dispatch({
            type: 'UPDATE_CLINIC_DAY',
            payload: { ...clinicDay, actualPatientsServed: actual }
        });
    };

    return (
        <div className="glass-card p-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Tickets Issued */}
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Patient Tickets Issued
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={ticketInput}
                            onChange={(e) => setTicketInput(e.target.value)}
                            min="0"
                            className="input-field flex-1"
                        />
                        <button onClick={handleUpdateTickets} className="btn-primary">
                            Update
                        </button>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                        Total number of patient tickets issued for this clinic day
                    </p>
                </div>

                {/* Actual Patients Served */}
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Actual Patients Served
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={actualInput}
                            onChange={(e) => setActualInput(e.target.value)}
                            min="0"
                            className="input-field flex-1"
                            placeholder="Enter after clinic ends"
                        />
                        <button onClick={handleUpdateActual} className="btn-primary">
                            Update
                        </button>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                        Total patients actually seen (enter after clinic day ends)
                    </p>
                </div>
            </div>

            {/* Comparison */}
            {clinicDay.actualPatientsServed !== undefined && clinicDay.patientTicketsIssued > 0 && (
                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)]">Ticket utilization:</span>
                        <span className="font-bold text-lg">
                            {Math.round((clinicDay.actualPatientsServed / clinicDay.patientTicketsIssued) * 100)}%
                        </span>
                    </div>
                    {clinicDay.actualPatientsServed < clinicDay.patientTicketsIssued && (
                        <p className="text-xs text-yellow-400 mt-2">
                            ⚠️ {clinicDay.patientTicketsIssued - clinicDay.actualPatientsServed} tickets unused (no-shows or early closure)
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

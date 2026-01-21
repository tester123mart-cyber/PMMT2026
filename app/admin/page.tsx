'use client';

import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/shared/Header';
import { exportData, importData, clearAllData } from '@/lib/storage';
import { ClinicDay, Participant } from '@/lib/types';

export default function AdminPage() {
    const { state, dispatch } = useApp();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'clinic-days' | 'participants' | 'flow-rates' | 'data'>('clinic-days');

    const handleExport = () => {
        exportData(state);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await importData(file);
            dispatch({ type: 'IMPORT_STATE', payload: data });
            alert('Data imported successfully!');
        } catch (error) {
            alert('Error importing data. Please check the file format.');
        }
    };

    const handleClearData = () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            clearAllData();
            window.location.reload();
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-6">
                <div className="page-header">
                    <h1 className="page-title">Admin Settings</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Configure clinic days, participants, flow rates, and data management
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { id: 'clinic-days', label: '📅 Clinic Days' },
                        { id: 'participants', label: '👥 Participants' },
                        { id: 'flow-rates', label: '📊 Flow Rates' },
                        { id: 'data', label: '💾 Data' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`
                px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all
                ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                }
              `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="animate-fade-in">
                    {activeTab === 'clinic-days' && <ClinicDaysTab />}
                    {activeTab === 'participants' && <ParticipantsTab />}
                    {activeTab === 'flow-rates' && <FlowRatesTab />}
                    {activeTab === 'data' && (
                        <DataTab
                            onExport={handleExport}
                            onImportClick={() => fileInputRef.current?.click()}
                            onClear={handleClearData}
                        />
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImport}
                    accept=".json"
                    className="hidden"
                />
            </main>
        </div>
    );
}

function ClinicDaysTab() {
    const { state, dispatch } = useApp();
    const [editingDay, setEditingDay] = useState<ClinicDay | null>(null);
    const [newDay, setNewDay] = useState({ name: '', day: '', month: '', year: '' });

    const handleSaveEdit = () => {
        if (!editingDay) return;
        dispatch({ type: 'UPDATE_CLINIC_DAY', payload: editingDay });
        setEditingDay(null);
    };

    const handleEditDateChange = (field: 'day' | 'month' | 'year', value: string) => {
        if (!editingDay) return;
        const [year, month, day] = editingDay.date.split('-');
        let newDate = editingDay.date;

        if (field === 'day') {
            const d = value.padStart(2, '0');
            newDate = `${year}-${month}-${d}`;
        } else if (field === 'month') {
            const m = value.padStart(2, '0');
            newDate = `${year}-${m}-${day}`;
        } else {
            newDate = `${value}-${month}-${day}`;
        }

        setEditingDay({ ...editingDay, date: newDate });
    };

    const getDateParts = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return { day: parseInt(day) || '', month: parseInt(month) || '', year: year || '' };
    };

    const handleAddDay = () => {
        if (!newDay.name || !newDay.day || !newDay.month || !newDay.year) return;

        const date = `${newDay.year}-${newDay.month.padStart(2, '0')}-${newDay.day.padStart(2, '0')}`;

        const newClinicDay: ClinicDay = {
            id: `day-${Date.now()}`,
            name: newDay.name,
            date: date,
            isActive: false,
            patientTicketsIssued: 0,
        };

        dispatch({
            type: 'IMPORT_STATE',
            payload: {
                ...state,
                clinicDays: [...state.clinicDays, newClinicDay],
            },
        });
        setNewDay({ name: '', day: '', month: '', year: '' });
    };

    const handleDeleteDay = (dayId: string) => {
        if (!confirm('Are you sure you want to delete this clinic day?')) return;
        dispatch({
            type: 'IMPORT_STATE',
            payload: {
                ...state,
                clinicDays: state.clinicDays.filter(d => d.id !== dayId),
            },
        });
    };

    return (
        <div className="glass-card p-6 space-y-6">
            <h2 className="text-lg font-semibold">Clinic Days</h2>

            {/* Existing Days */}
            <div className="space-y-3">
                {state.clinicDays.map(day => {
                    const isEditing = editingDay?.id === day.id;
                    const displayDay = isEditing ? editingDay : day;
                    const dateParts = getDateParts(displayDay.date);

                    return (
                        <div key={day.id} className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-[var(--text-muted)] mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={displayDay.name}
                                            onChange={(e) => setEditingDay({ ...displayDay, name: e.target.value })}
                                            className="input-field w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[var(--text-muted)] mb-1">Date</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="number"
                                                value={dateParts.day}
                                                onChange={(e) => handleEditDateChange('day', e.target.value)}
                                                placeholder="DD"
                                                min="1"
                                                max="31"
                                                className="input-field w-16 text-center"
                                            />
                                            <span className="text-[var(--text-muted)]">/</span>
                                            <input
                                                type="number"
                                                value={dateParts.month}
                                                onChange={(e) => handleEditDateChange('month', e.target.value)}
                                                placeholder="MM"
                                                min="1"
                                                max="12"
                                                className="input-field w-16 text-center"
                                            />
                                            <span className="text-[var(--text-muted)]">/</span>
                                            <input
                                                type="number"
                                                value={dateParts.year}
                                                onChange={(e) => handleEditDateChange('year', e.target.value)}
                                                placeholder="YYYY"
                                                min="2024"
                                                max="2030"
                                                className="input-field w-24 text-center"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={handleSaveEdit} className="btn-primary">
                                            Save
                                        </button>
                                        <button onClick={() => setEditingDay(null)} className="btn-secondary">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="font-medium">{day.name}</div>
                                        <div className="text-sm text-[var(--text-muted)]">
                                            {new Date(day.date).toLocaleDateString('en-AU', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </div>
                                    </div>
                                    <button onClick={() => setEditingDay(day)} className="btn-secondary">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDeleteDay(day.id)} className="text-red-400 hover:text-red-300 text-sm">
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add New Day */}
            <div className="pt-4 border-t border-[var(--border-subtle)]">
                <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Add New Clinic Day</h3>
                <div className="space-y-3">
                    <input
                        type="text"
                        value={newDay.name}
                        onChange={(e) => setNewDay({ ...newDay, name: e.target.value })}
                        placeholder="Clinic Day Name (e.g., Clinic Day 1)"
                        className="input-field w-full"
                    />
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            value={newDay.day}
                            onChange={(e) => setNewDay({ ...newDay, day: e.target.value })}
                            placeholder="DD"
                            min="1"
                            max="31"
                            className="input-field w-16 text-center"
                        />
                        <span className="text-[var(--text-muted)]">/</span>
                        <input
                            type="number"
                            value={newDay.month}
                            onChange={(e) => setNewDay({ ...newDay, month: e.target.value })}
                            placeholder="MM"
                            min="1"
                            max="12"
                            className="input-field w-16 text-center"
                        />
                        <span className="text-[var(--text-muted)]">/</span>
                        <input
                            type="number"
                            value={newDay.year}
                            onChange={(e) => setNewDay({ ...newDay, year: e.target.value })}
                            placeholder="YYYY"
                            min="2024"
                            max="2030"
                            className="input-field w-24 text-center"
                        />
                        <button onClick={handleAddDay} className="btn-primary ml-auto">
                            Add Day
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ParticipantsTab() {
    const { state, dispatch } = useApp();
    const [newParticipant, setNewParticipant] = useState({ name: '', email: '' });
    const [search, setSearch] = useState('');

    const filteredParticipants = state.participants.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddParticipant = () => {
        if (!newParticipant.name || !newParticipant.email) return;

        dispatch({
            type: 'ADD_PARTICIPANT',
            payload: {
                name: newParticipant.name,
                email: newParticipant.email.toLowerCase(),
            },
        });
        setNewParticipant({ name: '', email: '' });
    };

    return (
        <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Participants ({state.participants.length})</h2>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="input-field w-48"
                />
            </div>

            {/* Participant List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredParticipants.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                        <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-sm text-[var(--text-muted)]">{p.email}</div>
                        </div>
                        {p.isAdmin && <span className="badge badge-available">Admin</span>}
                    </div>
                ))}
            </div>

            {/* Add Participant */}
            <div className="pt-4 border-t border-[var(--border-subtle)]">
                <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">Add Participant</h3>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newParticipant.name}
                        onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                        placeholder="Full Name"
                        className="input-field flex-1"
                    />
                    <input
                        type="email"
                        value={newParticipant.email}
                        onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                        placeholder="Email"
                        className="input-field flex-1"
                    />
                    <button onClick={handleAddParticipant} className="btn-primary">
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}

function FlowRatesTab() {
    const { state, dispatch } = useApp();

    const handleUpdateRate = (roleId: string, rate: number) => {
        dispatch({
            type: 'UPDATE_FLOW_RATE',
            payload: { roleId, rate },
        });
    };

    return (
        <div className="glass-card p-6 space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Flow Rates</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                    Patients per hour per staff member for clinical roles
                </p>
            </div>

            <div className="space-y-4">
                {state.roles.filter(r => r.category === 'clinical').map(role => {
                    const flowRate = state.flowRates.find(f => f.roleId === role.id);

                    return (
                        <div key={role.id} className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-lg">
                            <span className="text-2xl">{role.icon}</span>
                            <div className="flex-1">
                                <div className="font-medium">{role.name}</div>
                                <div className="text-xs text-[var(--text-muted)]">
                                    Source: {flowRate?.source === 'actual' ? 'Updated from actual data' : 'Historical baseline'}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={flowRate?.patientsPerHourPerStaff ?? ''}
                                    onChange={(e) => handleUpdateRate(role.id, parseFloat(e.target.value) || 0)}
                                    step="0.5"
                                    min="0"
                                    className="input-field w-20 text-center"
                                />
                                <span className="text-sm text-[var(--text-muted)]">/hr/staff</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-[var(--text-secondary)]">
                    💡 Flow rates are automatically updated when you record actual clinic data in the Operations view.
                </p>
            </div>
        </div>
    );
}

function DataTab({
    onExport,
    onImportClick,
    onClear,
}: {
    onExport: () => void;
    onImportClick: () => void;
    onClear: () => void;
}) {
    const { state } = useApp();

    return (
        <div className="space-y-6">
            {/* Statistics */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4">Data Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox label="Participants" value={state.participants.length} />
                    <StatBox label="Clinic Days" value={state.clinicDays.length} />
                    <StatBox label="Assignments" value={state.assignments.length} />
                    <StatBox label="Shift Records" value={state.shiftActuals.length} />
                </div>
            </div>

            {/* Import/Export */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4">Data Management</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <button onClick={onExport} className="btn-secondary flex items-center justify-center gap-2">
                        <span>📤</span> Export Data
                    </button>
                    <button onClick={onImportClick} className="btn-secondary flex items-center justify-center gap-2">
                        <span>📥</span> Import Data
                    </button>
                    <button onClick={onClear} className="btn-danger flex items-center justify-center gap-2">
                        <span>🗑️</span> Clear All Data
                    </button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-4">
                    Export creates a JSON backup file. Import restores from a previously exported file.
                </p>
            </div>
        </div>
    );
}

function StatBox({ label, value }: { label: string; value: number }) {
    return (
        <div className="p-4 bg-[var(--bg-secondary)] rounded-lg text-center">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-[var(--text-muted)]">{label}</div>
        </div>
    );
}

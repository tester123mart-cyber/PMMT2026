'use client';

import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/shared/Header';
import DatePicker from '@/components/shared/DatePicker';
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
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDayName, setNewDayName] = useState('');
    const [newDayDate, setNewDayDate] = useState('');
    const [showNewDatePicker, setShowNewDatePicker] = useState(false);

    const startEditing = (day: ClinicDay) => {
        setEditingId(day.id);
        setTempName(day.name);
    };

    const saveEdit = (day: ClinicDay) => {
        if (tempName.trim()) {
            dispatch({ type: 'UPDATE_CLINIC_DAY', payload: { ...day, name: tempName.trim() } });
        }
        setEditingId(null);
    };

    const updateDate = (day: ClinicDay, newDate: string) => {
        dispatch({ type: 'UPDATE_CLINIC_DAY', payload: { ...day, date: newDate } });
        setShowDatePicker(null);
    };

    const handleAddDay = () => {
        if (!newDayName || !newDayDate) return;

        const newClinicDay: ClinicDay = {
            id: `day-${Date.now()}`,
            name: newDayName,
            date: newDayDate,
            isActive: false,
            patientTicketsIssued: 0,
        };

        dispatch({
            type: 'IMPORT_STATE',
            payload: {
                ...state,
                clinicDays: [...state.clinicDays, newClinicDay].sort((a, b) => a.date.localeCompare(b.date)),
            },
        });
        setNewDayName('');
        setNewDayDate('');
        setShowAddForm(false);
    };

    const handleDeleteDay = (dayId: string) => {
        dispatch({
            type: 'IMPORT_STATE',
            payload: {
                ...state,
                clinicDays: state.clinicDays.filter(d => d.id !== dayId),
            },
        });
        setDeletingId(null);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-AU', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Clinic Days</h2>
                    <p className="text-sm text-[var(--text-muted)]">{state.clinicDays.length} days configured</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn-primary"
                >
                    + Add Day
                </button>
            </div>

            {/* Add New Day Form */}
            {showAddForm && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-4">
                    <h3 className="font-medium text-blue-400">Add New Clinic Day</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-[var(--text-muted)] mb-1">Name</label>
                            <input
                                type="text"
                                value={newDayName}
                                onChange={(e) => setNewDayName(e.target.value)}
                                placeholder="e.g., Clinic Day 1 - Monday"
                                className="input-field w-full"
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm text-[var(--text-muted)] mb-1">Date</label>
                            <button
                                type="button"
                                onClick={() => setShowNewDatePicker(!showNewDatePicker)}
                                className="input-field w-full text-left"
                            >
                                {newDayDate ? formatDate(newDayDate) : 'Click to select date...'}
                            </button>
                            {showNewDatePicker && (
                                <div className="absolute z-50 mt-2">
                                    <DatePicker
                                        value={newDayDate}
                                        onChange={(date) => {
                                            setNewDayDate(date);
                                            setShowNewDatePicker(false);
                                        }}
                                        onClose={() => setShowNewDatePicker(false)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAddDay} className="btn-primary" disabled={!newDayName || !newDayDate}>
                            Add Clinic Day
                        </button>
                        <button onClick={() => setShowAddForm(false)} className="btn-secondary">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Existing Days */}
            <div className="space-y-2">
                {state.clinicDays.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                        <div className="text-4xl mb-2">📅</div>
                        <p>No clinic days configured yet.</p>
                        <p className="text-sm">Click "Add Day" to get started.</p>
                    </div>
                ) : (
                    state.clinicDays.map(day => {
                        const isEditing = editingId === day.id;
                        const isDeleting = deletingId === day.id;
                        const isShowingDatePicker = showDatePicker === day.id;

                        return (
                            <div
                                key={day.id}
                                className={`p-4 bg-[var(--bg-secondary)] rounded-lg transition-all ${isDeleting ? 'opacity-50 scale-98' : ''}`}
                            >
                                {isDeleting ? (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--text-muted)]">Delete &quot;{day.name}&quot;?</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleDeleteDay(day.id)} className="btn-danger text-sm px-3 py-1">
                                                Yes, Delete
                                            </button>
                                            <button onClick={() => setDeletingId(null)} className="btn-secondary text-sm px-3 py-1">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            {/* Name - inline edit */}
                                            {isEditing ? (
                                                <div className="flex items-center gap-2 mb-1">
                                                    <input
                                                        type="text"
                                                        value={tempName}
                                                        onChange={(e) => setTempName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveEdit(day);
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                        className="input-field flex-1 py-1"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => saveEdit(day)} className="text-green-400 hover:text-green-300 px-2">
                                                        ✓
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2">
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => startEditing(day)}
                                                    className="font-medium cursor-pointer hover:text-blue-400 transition-colors group"
                                                >
                                                    {day.name}
                                                    <span className="text-xs text-[var(--text-muted)] ml-2 opacity-0 group-hover:opacity-100">
                                                        ✏️ click to rename
                                                    </span>
                                                </div>
                                            )}

                                            {/* Date with calendar picker */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDatePicker(isShowingDatePicker ? null : day.id)}
                                                    className="text-sm text-[var(--text-muted)] hover:text-blue-400 transition-colors"
                                                >
                                                    📅 {formatDate(day.date)}
                                                </button>
                                                {isShowingDatePicker && (
                                                    <div className="absolute z-50 mt-2 left-0">
                                                        <DatePicker
                                                            value={day.date}
                                                            onChange={(newDate) => updateDate(day, newDate)}
                                                            onClose={() => setShowDatePicker(null)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Delete button */}
                                        <button
                                            onClick={() => setDeletingId(day.id)}
                                            className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                                            title="Delete this clinic day"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
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

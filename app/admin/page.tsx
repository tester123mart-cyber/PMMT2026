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

    const isAdmin = state.currentUser?.email === 'ordersinformation123@gmail.com' || state.currentUser?.isAdmin;

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

    // Non-admin view
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <Header />
                <main className="container py-12">
                    <div className="max-w-md mx-auto text-center">
                        <div className="p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                                <span className="text-4xl">🔒</span>
                            </div>
                            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Admin Access Required</h1>
                            <p className="text-sm text-[var(--text-muted)]">
                                Only administrators can access this page.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-8 max-w-4xl mx-auto">
                {/* Page Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Admin Settings
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] mt-2">
                        Configure clinic days, participants, flow rates, and data
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center gap-4 mb-8">
                    {[
                        { id: 'clinic-days', label: 'Clinic Days', icon: '📅' },
                        { id: 'participants', label: 'Participants', icon: '👥' },
                        { id: 'flow-rates', label: 'Flow Rates', icon: '📊' },
                        { id: 'data', label: 'Data', icon: '💾' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`
                                px-6 py-4 rounded-2xl font-medium transition-all flex flex-col items-center gap-1 min-w-[80px]
                                ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)]'
                                }
                            `}
                        >
                            <span className="text-xl">{tab.icon}</span>
                            <span className="text-xs">{tab.label}</span>
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
        <div className="space-y-6">
            {/* Header Card */}
            <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Clinic Days</h2>
                        <p className="text-sm text-[var(--text-muted)] mt-1">{state.clinicDays.length} days configured</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        + Add Day
                    </button>
                </div>
            </div>

            {/* Add New Day Form */}
            {showAddForm && (
                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                    <h3 className="font-medium text-[var(--text-primary)] text-center mb-4">Add New Clinic Day</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-[var(--text-muted)] mb-2 text-center">Name</label>
                            <input
                                type="text"
                                value={newDayName}
                                onChange={(e) => setNewDayName(e.target.value)}
                                placeholder="e.g., Clinic Day 1"
                                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center"
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm text-[var(--text-muted)] mb-2 text-center">Date</label>
                            <button
                                type="button"
                                onClick={() => setShowNewDatePicker(!showNewDatePicker)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center"
                            >
                                {newDayDate ? formatDate(newDayDate) : 'Select date...'}
                            </button>
                            {showNewDatePicker && (
                                <div className="absolute z-50 mt-2 left-1/2 -translate-x-1/2">
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
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={handleAddDay}
                            disabled={!newDayName || !newDayDate}
                            className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium disabled:opacity-50"
                        >
                            Add Day
                        </button>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-6 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Days List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {state.clinicDays.length === 0 ? (
                    <div className="md:col-span-2 lg:col-span-3 p-12 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                        <div className="text-5xl mb-4">📅</div>
                        <p className="text-[var(--text-primary)] font-medium">No clinic days configured</p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">Click "Add Day" to get started</p>
                    </div>
                ) : (
                    state.clinicDays.map(day => {
                        const isEditing = editingId === day.id;
                        const isDeleting = deletingId === day.id;
                        const isShowingDatePicker = showDatePicker === day.id;

                        return (
                            <div
                                key={day.id}
                                className={`p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] transition-all ${isDeleting ? 'opacity-60' : ''}`}
                            >
                                {isDeleting ? (
                                    <div className="text-center">
                                        <p className="text-sm text-[var(--text-muted)] mb-3">Delete "{day.name}"?</p>
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleDeleteDay(day.id)}
                                                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(null)}
                                                className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] text-[var(--text-muted)] text-xs"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={tempName}
                                                onChange={(e) => setTempName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit(day);
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                                onBlur={() => saveEdit(day)}
                                                className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-blue-500 text-center w-full text-sm"
                                                autoFocus
                                            />
                                        ) : (
                                            <div
                                                onClick={() => startEditing(day)}
                                                className="cursor-pointer hover:text-blue-500 transition-colors mb-3"
                                            >
                                                <div className="font-semibold text-[var(--text-primary)] text-sm">{day.name}</div>
                                                <div className="text-xs text-[var(--text-muted)] mt-1">
                                                    {formatDate(day.date)}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-center gap-2">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowDatePicker(isShowingDatePicker ? null : day.id)}
                                                    className="px-2 py-1 rounded-lg bg-[var(--bg-card)] text-xs hover:bg-[var(--bg-hover)]"
                                                >
                                                    📅
                                                </button>
                                                {isShowingDatePicker && (
                                                    <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2">
                                                        <DatePicker
                                                            value={day.date}
                                                            onChange={(newDate) => updateDate(day, newDate)}
                                                            onClose={() => setShowDatePicker(null)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setDeletingId(day.id)}
                                                className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs hover:bg-red-500/20"
                                            >
                                                🗑️
                                            </button>
                                        </div>
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
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const removeParticipant = (participantId: string) => {
        const updatedParticipants = state.participants.filter(p => p.id !== participantId);
        const updatedAssignments = state.assignments.filter(a => a.participantId !== participantId);
        dispatch({
            type: 'IMPORT_STATE',
            payload: { ...state, participants: updatedParticipants, assignments: updatedAssignments },
        });
        setDeletingId(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <div className="text-center mb-4">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Participants</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">{state.participants.length} registered</p>
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Search participants..."
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center"
                />
            </div>

            {/* Add Participant Form */}
            <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <h3 className="font-medium text-[var(--text-primary)] text-center mb-4">Add Participant</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        value={newParticipant.name}
                        onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                        placeholder="Name"
                        className="px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center"
                    />
                    <input
                        type="email"
                        value={newParticipant.email}
                        onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                        placeholder="Email"
                        className="px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center"
                    />
                    <button
                        onClick={handleAddParticipant}
                        disabled={!newParticipant.name || !newParticipant.email}
                        className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Participant List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredParticipants.length === 0 ? (
                    <div className="p-12 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                        <div className="text-5xl mb-4">👤</div>
                        <p className="text-[var(--text-muted)]">No participants found</p>
                    </div>
                ) : (
                    filteredParticipants.map(p => (
                        <div
                            key={p.id}
                            className={`p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] ${deletingId === p.id ? 'border-red-500' : ''}`}
                        >
                            {deletingId === p.id ? (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--text-muted)]">Remove "{p.name}"?</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => removeParticipant(p.id)}
                                            className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm"
                                        >
                                            Remove
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(null)}
                                            className="px-4 py-2 rounded-xl bg-[var(--bg-card)] text-[var(--text-muted)] text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                            {p.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                                                {p.name}
                                                {p.isAdmin && <span className="text-[10px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded border border-purple-500/20">ADMIN</span>}
                                            </div>
                                            <div className="text-sm text-[var(--text-muted)]">{p.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                const updated = state.participants.map(part =>
                                                    part.id === p.id ? { ...part, isAdmin: !part.isAdmin } : part
                                                );
                                                dispatch({ type: 'IMPORT_STATE', payload: { ...state, participants: updated } });
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${p.isAdmin
                                                ? 'bg-purple-500 text-white border-purple-500 hover:bg-purple-600'
                                                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-purple-500 hover:text-purple-500'
                                                }`}
                                        >
                                            {p.isAdmin ? 'Admin' : 'Make Admin'}
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(p.id)}
                                            className="px-3 py-2 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function FlowRatesTab() {
    const { state, dispatch } = useApp();

    const clinicalRoles = state.roles.filter(r => r.category === 'clinical');

    const handleUpdateRate = (roleId: string, rate: number) => {
        const existingIdx = state.flowRates.findIndex(f => f.roleId === roleId);
        const newFlowRates = [...state.flowRates];

        if (existingIdx >= 0) {
            newFlowRates[existingIdx] = { ...newFlowRates[existingIdx], patientsPerHourPerStaff: rate };
        } else {
            newFlowRates.push({ roleId, patientsPerHourPerStaff: rate, source: 'historical' });
        }

        dispatch({ type: 'IMPORT_STATE', payload: { ...state, flowRates: newFlowRates } });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Flow Rates</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Patients per hour per staff member</p>
            </div>

            {/* Rates List */}
            <div className="space-y-3">
                {clinicalRoles.map(role => {
                    const flowRate = state.flowRates.find(f => f.roleId === role.id);

                    return (
                        <div key={role.id} className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-card)] flex items-center justify-center text-2xl">
                                        {role.icon}
                                    </div>
                                    <div>
                                        <div className="font-medium text-[var(--text-primary)]">{role.name}</div>
                                        <div className="text-xs text-[var(--text-muted)]">
                                            {flowRate?.source === 'actual' ? '✓ Updated from data' : 'Historical baseline'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={flowRate?.patientsPerHourPerStaff ?? ''}
                                        onChange={(e) => handleUpdateRate(role.id, parseFloat(e.target.value) || 0)}
                                        step="0.5"
                                        min="0"
                                        className="w-20 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center font-medium"
                                    />
                                    <span className="text-sm text-[var(--text-muted)]">/hr</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info */}
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                    💡 Flow rates update automatically when you record clinic data
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
            <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] text-center mb-6">Data Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Participants" value={state.participants.length} icon="👥" />
                    <StatCard label="Clinic Days" value={state.clinicDays.length} icon="📅" />
                    <StatCard label="Assignments" value={state.assignments.length} icon="📋" />
                    <StatCard label="Records" value={state.shiftActuals.length} icon="📊" />
                </div>
            </div>

            {/* Actions */}
            <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] text-center mb-6">Data Management</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <button
                        onClick={onExport}
                        className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-blue-500 transition-colors text-center"
                    >
                        <div className="text-2xl mb-2">📤</div>
                        <div className="font-medium text-[var(--text-primary)]">Export</div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">Download backup</div>
                    </button>
                    <button
                        onClick={onImportClick}
                        className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-blue-500 transition-colors text-center"
                    >
                        <div className="text-2xl mb-2">📥</div>
                        <div className="font-medium text-[var(--text-primary)]">Import</div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">Restore from file</div>
                    </button>
                    <button
                        onClick={onClear}
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500 transition-colors text-center"
                    >
                        <div className="text-2xl mb-2">🗑️</div>
                        <div className="font-medium text-red-500">Clear All</div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">Reset everything</div>
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
    return (
        <div className="p-4 rounded-xl bg-[var(--bg-card)] text-center">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
            <div className="text-xs text-[var(--text-muted)]">{label}</div>
        </div>
    );
}

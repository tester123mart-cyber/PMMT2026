'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/shared/Header';
import { PatientRecord, MedicationEntry } from '@/lib/types';
import { addPatientRecord } from '@/lib/firebaseService';
import { generateId } from '@/lib/storage';



export default function TeamsPage() {
    const { state } = useApp();
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

    // Clinical form state
    const [patientName, setPatientName] = useState('');
    const [medications, setMedications] = useState<MedicationEntry[]>([{ name: '', dose: '', frequency: '' }]);
    const [followUps, setFollowUps] = useState('');
    const [comments, setComments] = useState('');

    // Patient records CRM
    // const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]); // Now using global state
    const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

    // Get active clinic day
    const activeClinicDay = state.clinicDays.find(d => d.isActive);

    // Filter records for active clinic day
    const patientRecords = state.patientRecords
        ?.filter(r => r.clinicDayId === activeClinicDay?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

    const getParticipantName = (id: string) => {
        return state.participants.find(p => p.id === id)?.name || 'Unknown';
    };

    const getAssignmentsForRole = (roleId: string) => {
        return state.assignments.filter(a => a.roleId === roleId);
    };

    const selectedRole = state.roles.find(r => r.id === selectedRoleId);
    const selectedRoleAssignments = selectedRoleId ? getAssignmentsForRole(selectedRoleId) : [];
    const uniqueParticipants = [...new Set(selectedRoleAssignments.map(a => a.participantId))];

    // Sort roles: Clinical first (alphabetically), then Support (alphabetically)
    const sortedRoles = [...state.roles].sort((a, b) => {
        if (a.category === 'clinical' && b.category !== 'clinical') return -1;
        if (a.category !== 'clinical' && b.category === 'clinical') return 1;
        return a.name.localeCompare(b.name);
    });

    // Add medication row
    const addMedication = () => {
        setMedications([...medications, { name: '', dose: '', frequency: '' }]);
    };

    // Update medication
    const updateMedication = (index: number, field: keyof MedicationEntry, value: string) => {
        const updated = [...medications];
        updated[index][field] = value;
        setMedications(updated);
    };

    // Remove medication
    const removeMedication = (index: number) => {
        if (medications.length > 1) {
            setMedications(medications.filter((_, i) => i !== index));
        }
    };

    const savePatientRecord = async () => {
        if (!patientName.trim() || !state.currentUser || !activeClinicDay) return;

        const newRecord: PatientRecord = {
            id: generateId(),
            patientName: patientName.trim(),
            medications: medications.filter(m => m.name.trim()),
            followUps,
            comments,
            createdAt: new Date().toISOString(),
            createdBy: {
                name: state.currentUser.name,
                email: state.currentUser.email
            },
            clinicDayId: activeClinicDay.id
        };

        await addPatientRecord(newRecord);

        // Local state update happens via real-time subscription in AppContext


        // Reset form
        setPatientName('');
        setMedications([{ name: '', dose: '', frequency: '' }]);
        setFollowUps('');
        setComments('');
    };

    // Check if this is the Medical team
    const isMedicalTeam = selectedRoleId === 'medical';

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-4">
                {/* Teams Sub-header Navigation */}
                <div className="flex flex-wrap items-center justify-center py-3 border-b border-[var(--border-subtle)] mb-6">
                    {sortedRoles.map((role, index) => (
                        <div key={role.id} className="flex items-center">
                            <button
                                onClick={() => setSelectedRoleId(selectedRoleId === role.id ? null : role.id)}
                                className={`
                                    px-3 py-1 text-sm transition-all flex items-center gap-1.5
                                    ${selectedRoleId === role.id
                                        ? 'text-blue-500 font-semibold'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                    }
                                `}
                            >
                                <span>{role.icon}</span>
                                <span>{role.name}</span>
                            </button>
                            {index < sortedRoles.length - 1 && (
                                <span className="text-[var(--border-subtle)] mx-1">|</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Selected Role Content */}
                {selectedRole ? (
                    <div className="max-w-2xl mx-auto animate-fade-in">
                        {/* Role Header */}
                        <div className="text-center mb-6">
                            <span className="text-4xl">{selectedRole.icon}</span>
                            <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-2">{selectedRole.name}</h2>
                        </div>

                        {/* Clinical Form - Only for Medical Team */}
                        {isMedicalTeam && (
                            <>
                                {/* All-in-One Clinical Form */}
                                <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-6">
                                    <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">
                                        📋 New Patient Record
                                    </h3>

                                    {/* Patient Name */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            Patient Name / ID
                                        </label>
                                        <input
                                            type="text"
                                            value={patientName}
                                            onChange={(e) => setPatientName(e.target.value)}
                                            placeholder="Enter patient name or identifier"
                                            className="w-full p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>

                                    {/* Medication Prescription */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            💊 Medication Prescription
                                        </label>

                                        <div className="space-y-2">
                                            {medications.map((med, index) => (
                                                <div key={index} className="flex gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        value={med.name}
                                                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                                        placeholder="Drug name"
                                                        className="flex-1 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={med.dose}
                                                        onChange={(e) => updateMedication(index, 'dose', e.target.value)}
                                                        placeholder="Dose"
                                                        className="w-24 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={med.frequency}
                                                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                                        placeholder="Frequency"
                                                        className="w-28 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                                                    />
                                                    {medications.length > 1 && (
                                                        <button
                                                            onClick={() => removeMedication(index)}
                                                            className="text-red-500 hover:bg-red-500/10 p-1 rounded"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={addMedication}
                                            className="mt-2 text-sm text-blue-500 hover:underline"
                                        >
                                            + Add Medication
                                        </button>
                                    </div>

                                    {/* Follow-ups */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            📅 Follow-up(s) Required
                                        </label>
                                        <textarea
                                            value={followUps}
                                            onChange={(e) => setFollowUps(e.target.value)}
                                            placeholder="Enter required follow-up actions, referrals, or appointments..."
                                            rows={2}
                                            className="w-full p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none resize-none"
                                        />
                                    </div>

                                    {/* Comments */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            📝 Comments / Notes
                                        </label>
                                        <textarea
                                            value={comments}
                                            onChange={(e) => setComments(e.target.value)}
                                            placeholder="Additional notes, observations, or comments..."
                                            rows={2}
                                            className="w-full p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none resize-none"
                                        />
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        onClick={savePatientRecord}
                                        disabled={!patientName.trim() || !activeClinicDay}
                                        className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Save Patient Record
                                    </button>
                                </div>

                                {/* Patient CRM - Previously Seen Patients */}
                                <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-6">
                                    <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">
                                        👥 Patient Records ({patientRecords.length})
                                    </h3>

                                    {patientRecords.length === 0 ? (
                                        <div className="text-center py-6 text-[var(--text-muted)]">
                                            <div className="text-3xl mb-2">📋</div>
                                            <p className="text-sm">No patient records yet</p>
                                            <p className="text-xs">Save a patient record above to see it here</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {patientRecords.map(record => (
                                                <div
                                                    key={record.id}
                                                    onClick={() => setSelectedPatient(selectedPatient?.id === record.id ? null : record)}
                                                    className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] cursor-pointer hover:border-blue-500/50 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-medium">
                                                                {record.patientName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                                                    {record.patientName}
                                                                </span>
                                                                <p className="text-xs text-[var(--text-muted)]">
                                                                    {new Date(record.createdAt).toLocaleDateString()} • {record.medications.length} medication(s)
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[var(--text-muted)]">
                                                            {selectedPatient?.id === record.id ? '▼' : '▶'}
                                                        </span>
                                                    </div>

                                                    {/* Expanded View */}
                                                    {selectedPatient?.id === record.id && (
                                                        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2 text-sm">
                                                            {record.medications.length > 0 && (
                                                                <div>
                                                                    <span className="font-medium text-[var(--text-secondary)]">💊 Medications:</span>
                                                                    <ul className="ml-4 mt-1 space-y-1">
                                                                        {record.medications.map((med, i) => (
                                                                            <li key={i} className="text-[var(--text-muted)]">
                                                                                {med.name} - {med.dose} ({med.frequency})
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {record.followUps && (
                                                                <div>
                                                                    <span className="font-medium text-[var(--text-secondary)]">📅 Follow-up:</span>
                                                                    <p className="text-[var(--text-muted)] ml-4">{record.followUps}</p>
                                                                </div>
                                                            )}
                                                            {record.comments && (
                                                                <div>
                                                                    <span className="font-medium text-[var(--text-secondary)]">📝 Notes:</span>
                                                                    <p className="text-[var(--text-muted)] ml-4">{record.comments}</p>
                                                                </div>
                                                            )}
                                                            <div className="pt-2 mt-2 border-t border-[var(--border-subtle)]">
                                                                <span className="font-medium text-[var(--text-secondary)]">👤 Recorded by:</span>
                                                                <p className="text-[var(--text-muted)] ml-4">
                                                                    {record.createdBy.name} ({record.createdBy.email})
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">👆</div>
                        <p className="text-[var(--text-primary)] font-medium">Select a team above</p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">View team members and clinical forms</p>
                    </div>
                )}
            </main>
        </div>
    );
}

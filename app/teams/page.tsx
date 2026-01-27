'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/shared/Header';
import { PatientRecord, MedicationEntry } from '@/lib/types';
import { addPatientRecord, updatePharmacyItem } from '@/lib/firebaseService';
import { generateId } from '@/lib/storage';
import PharmacyStocktake from '@/components/teams/PharmacyStocktake';
import MedicationAutocomplete from '@/components/teams/MedicationAutocomplete';



export default function TeamsPage() {
    const { state, dispatch } = useApp();
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
    const today = new Date().toISOString().split('T')[0];
    const activeClinicDay = state.clinicDays.find(d => d.isActive)
        || state.clinicDays.find(d => d.date === today)
        || state.clinicDays[0];

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
    const updateMedication = (index: number, field: keyof MedicationEntry, value: any) => {
        const updated = [...medications];
        // @ts-ignore - dynamic key access
        updated[index][field] = value;

        // If updating name and it matches a pharmacy item, link it
        if (field === 'name') {
            const pharmacyItem = state.pharmacyItems.find(item => item.name === value);
            if (pharmacyItem) {
                updated[index].pharmacyItemId = pharmacyItem.id;
            } else {
                updated[index].pharmacyItemId = undefined;
            }
        }

        setMedications(updated);
    };

    // Remove medication
    const removeMedication = (index: number) => {
        if (medications.length > 1) {
            setMedications(medications.filter((_, i) => i !== index));
        }
    };

    const savePatientRecord = async () => {
        console.log('Attempting to save patient record...');
        if (!patientName.trim()) {
            console.error('Save failed: No patient name');
            return;
        }
        if (!state.currentUser) {
            console.error('Save failed: No current user');
            alert('Please select a user profile/role first.');
            return;
        }
        if (!activeClinicDay) {
            console.error('Save failed: No active clinic day');
            alert('No active clinic day found. Please configure clinic days in Admin.');
            return;
        }

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

        // Update pharmacy stock
        // Update pharmacy stock
        let updatedPharmacyItems = [...state.pharmacyItems];
        let pharmacyUpdatesMade = false;

        for (const med of newRecord.medications) {
            if (med.pharmacyItemId && !med.deducted) {
                const itemIndex = updatedPharmacyItems.findIndex(i => i.id === med.pharmacyItemId);
                if (itemIndex >= 0) {
                    const item = updatedPharmacyItems[itemIndex];
                    if (item.stockCount > 0) {
                        const updatedItem = {
                            ...item,
                            stockCount: item.stockCount - 1,
                            updatedAt: new Date().toISOString()
                        };

                        // Update local array for optimistic dispatch
                        updatedPharmacyItems[itemIndex] = updatedItem;
                        pharmacyUpdatesMade = true;

                        // Background update to Firebase
                        updatePharmacyItem(updatedItem).catch(err =>
                            console.error('Error updating pharmacy item:', err)
                        );
                    }
                }
            }
        }

        // Optimistic update for UI responsiveness
        const updatedRecords = [newRecord, ...(state.patientRecords || [])];
        dispatch({
            type: 'UPDATE_PATIENT_RECORDS',
            payload: updatedRecords
        });

        if (pharmacyUpdatesMade) {
            dispatch({
                type: 'UPDATE_PHARMACY_ITEMS',
                payload: updatedPharmacyItems
            });
        }

        // Reset form
        setPatientName('');
        setMedications([{ name: '', dose: '', frequency: '' }]);
        setFollowUps('');
        setComments('');
    };

    // Check team roles
    const isMedicalTeam = selectedRoleId === 'medical';
    const isPharmacyTeam = selectedRoleId === 'pharmacy';

    // Patient Summary Modal Logic
    const [isEditing, setIsEditing] = useState(false);
    const [tempRecord, setTempRecord] = useState<PatientRecord | null>(null);

    const handleEditClick = () => {
        if (selectedPatient) {
            setTempRecord({ ...selectedPatient });
            setIsEditing(true);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setTempRecord(null);
    };

    const handleDeleteRecord = () => {
        if (!selectedPatient) return;

        if (confirm('Are you sure you want to delete this patient record? This cannot be undone.')) {
            const updatedRecords = (state.patientRecords || []).filter(r => r.id !== selectedPatient.id);
            dispatch({
                type: 'UPDATE_PATIENT_RECORDS',
                payload: updatedRecords
            });
            setSelectedPatient(null);
            setIsEditing(false);
        }
    };

    const handleSaveEdit = () => {
        if (!tempRecord) return;

        // Update in global state
        const updatedRecords = (state.patientRecords || []).map(r =>
            r.id === tempRecord.id ? tempRecord : r
        );

        dispatch({
            type: 'UPDATE_PATIENT_RECORDS',
            payload: updatedRecords
        });

        // Also update the local selected patient so the modal reflects changes immediately
        setSelectedPatient(tempRecord);
        setIsEditing(false);
        setTempRecord(null);
    };

    // Update temp record field
    const updateTempRecord = (field: keyof PatientRecord, value: any) => {
        if (tempRecord) {
            setTempRecord({ ...tempRecord, [field]: value });
        }
    };

    // Update temp medication
    const updateTempMedication = (index: number, field: keyof MedicationEntry, value: string) => {
        if (tempRecord) {
            const updatedMeds = [...tempRecord.medications];
            updatedMeds[index] = { ...updatedMeds[index], [field]: value };
            setTempRecord({ ...tempRecord, medications: updatedMeds });
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-4 relative">
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
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
                                {/* Left Column: New Patient Record Form */}
                                <div>
                                    <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-6 sticky top-4">
                                        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">
                                            📋 New Patient Record
                                        </h3>

                                        {/* New Patient Record Form */}
                                        <div className="flex flex-col gap-4 mb-4">
                                            {/* Row 1: Name & Meds */}
                                            <div className="flex flex-col lg:flex-row gap-4">
                                                {/* Patient Name - More compact */}
                                                <div className="lg:w-1/3">
                                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                                        Patient Name / ID
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={patientName}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            // Auto-capitalize first letter of words
                                                            const capitalized = val.replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
                                                            setPatientName(capitalized);
                                                        }}
                                                        placeholder="Name..."
                                                        className="w-full p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                                                    />
                                                </div>

                                                {/* Medications - Inline */}
                                                <div className="lg:w-2/3">
                                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                                        💊 Medication Prescription
                                                    </label>

                                                    <div className="space-y-2">
                                                        {medications.map((med, index) => (
                                                            <div key={index} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center">
                                                                <MedicationAutocomplete
                                                                    value={med.name}
                                                                    onChange={(val) => {
                                                                        // Standardizing on Title Case if user types manually
                                                                        // The autocomplete onSelect will handle the precise linking
                                                                        updateMedication(index, 'name', val);
                                                                    }}
                                                                    onSelect={(item) => {
                                                                        // Precise linking when selecting from dropdown
                                                                        const updated = [...medications];
                                                                        updated[index].name = item.name;
                                                                        updated[index].pharmacyItemId = item.id;
                                                                        if (item.dosage) updated[index].dose = item.dosage;
                                                                        setMedications(updated);
                                                                    }}
                                                                    placeholder="Drug"
                                                                    pharmacyItems={state.pharmacyItems}
                                                                    className="w-full p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={med.dose}
                                                                    onChange={(e) => updateMedication(index, 'dose', e.target.value)}
                                                                    placeholder="Dose"
                                                                    className="w-full p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={med.frequency}
                                                                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                                                    placeholder="Freq"
                                                                    className="w-full p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:border-blue-500 focus:outline-none"
                                                                />
                                                                {medications.length > 1 && (
                                                                    <button
                                                                        onClick={() => removeMedication(index)}
                                                                        className="text-red-500 hover:bg-red-500/10 p-1 rounded w-8 h-8 flex items-center justify-center"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <button
                                                        onClick={addMedication}
                                                        className="mt-1 text-xs text-blue-500 hover:underline"
                                                    >
                                                        + Add Med
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Row 2: Follow-ups & Comments */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {/* Follow-ups */}
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                                        📅 Follow-up(s)
                                                    </label>
                                                    <textarea
                                                        value={followUps}
                                                        onChange={(e) => setFollowUps(e.target.value)}
                                                        placeholder="Required actions..."
                                                        rows={2}
                                                        className="w-full p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none resize-none text-sm"
                                                    />
                                                </div>

                                                {/* Comments */}
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                                        📝 Notes
                                                    </label>
                                                    <textarea
                                                        value={comments}
                                                        onChange={(e) => setComments(e.target.value)}
                                                        placeholder="Observations..."
                                                        rows={2}
                                                        className="w-full p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:outline-none resize-none text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Save Button */}
                                        <button
                                            onClick={savePatientRecord}
                                            disabled={!patientName.trim() || !activeClinicDay || !state.currentUser}
                                            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {!state.currentUser
                                                ? '⚠️ Log in to Save'
                                                : !activeClinicDay
                                                    ? '⚠️ No Active Clinic Day'
                                                    : 'Save Patient Record'
                                            }
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column: Patient CRM - Previously Seen Patients */}
                                <div>
                                    <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-6 h-[60vh] lg:h-[80vh] flex flex-col overflow-hidden">
                                        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">
                                            👥 Patient Records ({patientRecords.length})
                                        </h3>

                                        {patientRecords.length === 0 ? (
                                            <div className="text-center py-6 text-[var(--text-muted)]">
                                                <div className="text-3xl mb-2">📋</div>
                                                <p className="text-sm">No patient records yet</p>
                                                <p className="text-xs">Save a patient record to see it here</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                                                {patientRecords.map(record => (
                                                    <div
                                                        key={record.id}
                                                        onClick={() => setSelectedPatient(record)}
                                                        className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] cursor-pointer hover:border-blue-500/50 hover:bg-[var(--bg-hover)] transition-all"
                                                    >
                                                        {/* Simplified View - Name, Date, Recorder */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-medium shadow-sm text-sm">
                                                                    {record.patientName.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <span className="text-sm font-semibold text-[var(--text-primary)] block">
                                                                        {record.patientName}
                                                                    </span>
                                                                    <p className="text-[10px] text-[var(--text-muted)]">
                                                                        {new Date(record.createdAt).toLocaleDateString()} {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] text-[var(--text-muted)] italic">
                                                                {record.createdBy.name.split(' ')[0]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {isPharmacyTeam && (
                            <PharmacyStocktake />
                        )}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">👆</div>
                        <p className="text-[var(--text-primary)] font-medium">Select a team above</p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">View team members and clinical forms</p>
                    </div>
                )
                }

                {/* Patient Summary Modal */}
                {
                    selectedPatient && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
                            onClick={() => {
                                if (!isEditing) setSelectedPatient(null);
                            }}
                        >
                            <div
                                className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[var(--border-subtle)] flex flex-col max-h-[90vh]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="p-4 sm:p-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-card)] shrink-0">
                                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-sm shrink-0">
                                            {selectedPatient.patientName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] truncate">
                                                {selectedPatient.patientName}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                                                {new Date(selectedPatient.createdAt).toLocaleDateString()} at {new Date(selectedPatient.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isEditing && (
                                            <button
                                                onClick={handleEditClick}
                                                className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg text-sm font-medium mr-1"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSelectedPatient(null)}
                                            className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
                                    {!isEditing ? (
                                        <>
                                            {/* View Mode */}
                                            {/* Medications */}
                                            <div>
                                                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                                                    💊 Medications
                                                </h4>
                                                {selectedPatient.medications.length > 0 ? (
                                                    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Drug</th>
                                                                    <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Dose</th>
                                                                    <th className="px-4 py-2 text-left font-medium text-[var(--text-muted)]">Freq</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-[var(--border-subtle)]">
                                                                {selectedPatient.medications.map((med, i) => (
                                                                    <tr key={i}>
                                                                        <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{med.name}</td>
                                                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{med.dose}</td>
                                                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{med.frequency}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-[var(--text-muted)] italic">No medications recorded.</p>
                                                )}
                                            </div>

                                            {/* Follow Ups */}
                                            {selectedPatient.followUps && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                                        📅 Follow-up Required
                                                    </h4>
                                                    <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                                                        {selectedPatient.followUps}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {selectedPatient.comments && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                                        📝 Notes & Observations
                                                    </h4>
                                                    <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                                                        {selectedPatient.comments}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {/* Edit Mode */}
                                            <div>
                                                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                                                    💊 Medications (Edit)
                                                </h4>
                                                <div className="space-y-3">
                                                    {tempRecord?.medications.map((med, i) => (
                                                        <div key={i} className="grid grid-cols-[2fr_1fr_1fr] gap-2">
                                                            <input
                                                                value={med.name}
                                                                onChange={(e) => updateTempMedication(i, 'name', e.target.value)}
                                                                className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm"
                                                                placeholder="Name"
                                                            />
                                                            <input
                                                                value={med.dose}
                                                                onChange={(e) => updateTempMedication(i, 'dose', e.target.value)}
                                                                className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm"
                                                                placeholder="Dose"
                                                            />
                                                            <input
                                                                value={med.frequency}
                                                                onChange={(e) => updateTempMedication(i, 'frequency', e.target.value)}
                                                                className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm"
                                                                placeholder="Freq"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                                    📅 Follow-up (Edit)
                                                </h4>
                                                <textarea
                                                    value={tempRecord?.followUps || ''}
                                                    onChange={(e) => updateTempRecord('followUps', e.target.value)}
                                                    className="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                                                    rows={3}
                                                />
                                            </div>

                                            <div>
                                                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                                    📝 Notes (Edit)
                                                </h4>
                                                <textarea
                                                    value={tempRecord?.comments || ''}
                                                    onChange={(e) => updateTempRecord('comments', e.target.value)}
                                                    className="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                                                    rows={3}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Footer Metadata & Actions */}
                                    {!isEditing && (
                                        <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                                            <div className="flex flex-col">
                                                <span>Recorded by <span className="font-medium text-[var(--text-primary)]">{selectedPatient.createdBy.name}</span></span>
                                                <span>ID: {selectedPatient.id.slice(0, 8)}...</span>
                                            </div>
                                            <button
                                                onClick={handleDeleteRecord}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                                            >
                                                Delete Record
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Edit Mode Actions */}
                                {isEditing && (
                                    <div className="p-4 sm:p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex justify-end gap-3 shrink-0">
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-4 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 shadow-md"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }
            </main>
        </div>
    );
}

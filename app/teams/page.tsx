'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/shared/Header';
import { SHIFTS } from '@/lib/data';

// Role responsibilities data
const ROLE_RESPONSIBILITIES: Record<string, { description: string; duties: string[] }> = {
    medical: {
        description: 'Provide medical consultations and treatment to patients.',
        duties: [
            'Conduct patient assessments and examinations',
            'Diagnose and treat common medical conditions',
            'Prescribe medications as appropriate',
            'Refer complex cases to appropriate specialists',
            'Document patient encounters accurately',
        ],
    },
    nursing: {
        description: 'Support medical team with patient care and vital monitoring.',
        duties: [
            'Take and record patient vital signs',
            'Assist doctors during consultations',
            'Administer medications and vaccinations',
            'Provide wound care and dressing changes',
            'Educate patients on medication usage',
        ],
    },
    optometry: {
        description: 'Provide eye examinations and vision correction services.',
        duties: [
            'Conduct comprehensive eye examinations',
            'Measure visual acuity and prescribe corrective lenses',
            'Screen for common eye conditions',
            'Fit and dispense eyeglasses',
            'Provide eye health education',
        ],
    },
    dentistry: {
        description: 'Provide dental care including extractions and basic treatments.',
        duties: [
            'Perform dental examinations and assessments',
            'Conduct tooth extractions when necessary',
            'Provide basic restorative treatments',
            'Offer oral hygiene education',
            'Manage dental emergencies',
        ],
    },
    pharmacy: {
        description: 'Manage medication dispensing and patient counseling.',
        duties: [
            'Dispense prescribed medications accurately',
            'Counsel patients on proper medication use',
            'Manage medication inventory',
            'Check for drug interactions',
            'Maintain dispensing records',
        ],
    },
    registration: {
        description: 'Handle patient registration and flow management.',
        duties: [
            'Register incoming patients',
            'Collect and record patient demographics',
            'Issue patient tickets and numbers',
            'Direct patients to appropriate stations',
            'Manage patient queue flow',
        ],
    },
    triage: {
        description: 'Assess patient urgency and prioritize care.',
        duties: [
            'Conduct initial patient assessments',
            'Prioritize patients based on urgency',
            'Take and record vital signs',
            'Direct patients to appropriate services',
            'Identify emergency cases for immediate care',
        ],
    },
    logistics: {
        description: 'Coordinate supplies, equipment, and clinic operations.',
        duties: [
            'Manage medical supplies and inventory',
            'Coordinate equipment setup and breakdown',
            'Ensure stations are properly stocked',
            'Handle equipment issues and repairs',
            'Support general clinic operations',
        ],
    },
};

export default function TeamsPage() {
    const { state } = useApp();
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

    const getParticipantName = (id: string) => {
        return state.participants.find(p => p.id === id)?.name || 'Unknown';
    };

    const getAssignmentsForRole = (roleId: string) => {
        return state.assignments.filter(a => a.roleId === roleId);
    };

    const getClinicDayName = (id: string) => {
        return state.clinicDays.find(d => d.id === id)?.name || '';
    };

    const getShiftName = (id: string) => {
        return SHIFTS.find(s => s.id === id)?.name || '';
    };

    const selectedRole = state.roles.find(r => r.id === selectedRoleId);
    const selectedRoleInfo = selectedRoleId ? ROLE_RESPONSIBILITIES[selectedRoleId] : null;
    const selectedRoleAssignments = selectedRoleId ? getAssignmentsForRole(selectedRoleId) : [];
    const uniqueParticipants = [...new Set(selectedRoleAssignments.map(a => a.participantId))];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Header />

            <main className="container py-4">
                {/* Teams Sub-header Navigation */}
                <div className="flex flex-wrap gap-4 justify-center py-3 border-b border-[var(--border-subtle)] mb-6">
                    {state.roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRoleId(selectedRoleId === role.id ? null : role.id)}
                            className={`
                                text-sm transition-all flex items-center gap-1.5
                                ${selectedRoleId === role.id
                                    ? 'text-blue-500 font-semibold'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }
                            `}
                        >
                            <span>{role.icon}</span>
                            <span>{role.name}</span>
                        </button>
                    ))}
                </div>

                {/* Selected Role Content */}
                {selectedRole && selectedRoleInfo ? (
                    <div className="max-w-2xl mx-auto animate-fade-in">
                        {/* Role Header */}
                        <div className="text-center mb-6">
                            <span className="text-4xl">{selectedRole.icon}</span>
                            <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-2">{selectedRole.name}</h2>
                            <p className="text-sm text-[var(--text-muted)] mt-1">{selectedRoleInfo.description}</p>
                        </div>

                        {/* Responsibilities */}
                        <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] mb-6">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-3">
                                Key Responsibilities
                            </h3>
                            <ul className="space-y-2">
                                {selectedRoleInfo.duties.map((duty, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        <span>{duty}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Team Members */}
                        <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-3">
                                Team Members ({uniqueParticipants.length})
                            </h3>
                            {uniqueParticipants.length === 0 ? (
                                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                                    No members assigned to this role yet
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {uniqueParticipants.map(participantId => {
                                        const participantAssignments = selectedRoleAssignments.filter(a => a.participantId === participantId);

                                        return (
                                            <div
                                                key={participantId}
                                                className="p-3 rounded-lg bg-[var(--bg-card)] flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                                                        {getParticipantName(participantId).charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-[var(--text-primary)]">
                                                        {getParticipantName(participantId)}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {participantAssignments.length} shift{participantAssignments.length !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">👆</div>
                        <p className="text-[var(--text-primary)] font-medium">Select a team above</p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">View responsibilities and team members</p>
                    </div>
                )}
            </main>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShiftId } from '@/lib/types';
import { getRoleShiftStatus, calculateActualFlowRate, blendFlowRates } from '@/lib/calculations';
import { getClinicalRoles, SHIFTS } from '@/lib/data';

interface ShiftDataEntryProps {
    clinicDayId: string;
    shiftId: ShiftId;
    onSave: () => void;
}

interface RoleData {
    roleId: string;
    patientsServed: number;
    staffCount: number;
    notes: string;
}

export default function ShiftDataEntry({ clinicDayId, shiftId, onSave }: ShiftDataEntryProps) {
    const { state, dispatch } = useApp();
    const clinicalRoles = getClinicalRoles();
    const shift = SHIFTS.find(s => s.id === shiftId);

    // Initialize form with current data
    const [roleData, setRoleData] = useState<Record<string, RoleData>>(() => {
        const data: Record<string, RoleData> = {};
        clinicalRoles.forEach(role => {
            const status = getRoleShiftStatus(state, clinicDayId, shiftId, role.id);
            const existing = state.shiftActuals.find(
                a => a.clinicDayId === clinicDayId && a.shiftId === shiftId && a.roleId === role.id
            );
            data[role.id] = {
                roleId: role.id,
                patientsServed: existing?.patientsServed ?? 0,
                staffCount: existing?.staffCount ?? status.currentCount,
                notes: existing?.notes ?? '',
            };
        });
        return data;
    });

    const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>(() => {
        const data: Record<string, boolean> = {};
        state.assignments
            .filter(a => a.clinicDayId === clinicDayId && a.shiftId === shiftId)
            .forEach(a => {
                data[a.id] = a.attended ?? true;
            });
        return data;
    });

    const [saved, setSaved] = useState(false);

    const handleRoleDataChange = (roleId: string, field: keyof RoleData, value: string | number) => {
        setRoleData(prev => ({
            ...prev,
            [roleId]: {
                ...prev[roleId],
                [field]: value,
            },
        }));
        setSaved(false);
    };

    const handleAttendanceChange = (assignmentId: string, attended: boolean) => {
        setAttendanceData(prev => ({
            ...prev,
            [assignmentId]: attended,
        }));
        setSaved(false);
    };

    const handleSave = () => {
        // Save attendance data
        Object.entries(attendanceData).forEach(([assignmentId, attended]) => {
            dispatch({
                type: 'UPDATE_ASSIGNMENT_ATTENDANCE',
                payload: { id: assignmentId, attended },
            });
        });

        // Update flow rates based on actual data
        Object.values(roleData).forEach(data => {
            if (data.patientsServed > 0 && data.staffCount > 0 && shift) {
                const actualRate = calculateActualFlowRate(
                    data.patientsServed,
                    data.staffCount,
                    shift.durationHours
                );
                const currentRate = state.flowRates.find(f => f.roleId === data.roleId)?.patientsPerHourPerStaff ?? actualRate;
                const blendedRate = blendFlowRates(currentRate, actualRate, 0.3);

                dispatch({
                    type: 'UPDATE_FLOW_RATE',
                    payload: { roleId: data.roleId, rate: Math.round(blendedRate * 10) / 10 },
                });
            }
        });

        setSaved(true);
        onSave();
    };

    // Get assignments for this shift
    const shiftAssignments = state.assignments.filter(
        a => a.clinicDayId === clinicDayId && a.shiftId === shiftId
    );

    return (
        <div className="glass-card p-6 space-y-6">
            {/* Patient Counts by Clinical Role */}
            <div>
                <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
                    Patients Served by Service
                </h3>
                <div className="space-y-4">
                    {clinicalRoles.map(role => (
                        <div key={role.id} className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">{role.icon}</span>
                                <span className="font-medium">{role.name}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[var(--text-muted)] mb-1">
                                        Patients Served
                                    </label>
                                    <input
                                        type="number"
                                        value={roleData[role.id]?.patientsServed || ''}
                                        onChange={(e) => handleRoleDataChange(role.id, 'patientsServed', parseInt(e.target.value) || 0)}
                                        min="0"
                                        className="input-field"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[var(--text-muted)] mb-1">
                                        Staff Count
                                    </label>
                                    <input
                                        type="number"
                                        value={roleData[role.id]?.staffCount || ''}
                                        onChange={(e) => handleRoleDataChange(role.id, 'staffCount', parseInt(e.target.value) || 0)}
                                        min="0"
                                        className="input-field"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Attendance Tracking */}
            <div>
                <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
                    Attendance ({shiftAssignments.length} assigned)
                </h3>
                {shiftAssignments.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)] p-4 bg-[var(--bg-secondary)] rounded-lg">
                        No one assigned to this shift yet
                    </p>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {shiftAssignments.map(assignment => {
                            const participant = state.participants.find(p => p.id === assignment.participantId);
                            const role = state.roles.find(r => r.id === assignment.roleId);
                            const attended = attendanceData[assignment.id] ?? true;

                            return (
                                <div
                                    key={assignment.id}
                                    className={`
                    flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                    ${attended
                                            ? 'bg-green-500/10 border border-green-500/30'
                                            : 'bg-red-500/10 border border-red-500/30'
                                        }
                  `}
                                    onClick={() => handleAttendanceChange(assignment.id, !attended)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{role?.icon}</span>
                                        <div>
                                            <div className="text-sm font-medium">{participant?.name}</div>
                                            <div className="text-xs text-[var(--text-muted)]">{role?.name}</div>
                                        </div>
                                    </div>
                                    <div className={`text-sm font-medium ${attended ? 'text-green-400' : 'text-red-400'}`}>
                                        {attended ? '✓ Present' : '✗ Absent'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                    Shift Notes
                </label>
                <textarea
                    className="input-field min-h-[80px]"
                    placeholder="Any observations about patient flow, delays, issues..."
                />
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                {saved && (
                    <span className="text-sm text-green-400">✓ Data saved successfully</span>
                )}
                <button onClick={handleSave} className="btn-primary ml-auto">
                    Save Shift Data
                </button>
            </div>
        </div>
    );
}

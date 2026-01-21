'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShiftId } from '@/lib/types';
import { getAllRoleShiftStatuses, getStaffingColor } from '@/lib/calculations';
import { SHIFTS } from '@/lib/data';

interface StaffingGridProps {
    clinicDayId: string;
}

export default function StaffingGrid({ clinicDayId }: StaffingGridProps) {
    const { state } = useApp();
    const [expandedCell, setExpandedCell] = useState<string | null>(null);

    const statuses = getAllRoleShiftStatuses(state, clinicDayId);

    const getStatusForCell = (roleId: string, shiftId: ShiftId) => {
        return statuses.find(s => s.roleId === roleId && s.shiftId === shiftId);
    };

    const getCellColor = (roleId: string, shiftId: ShiftId) => {
        const status = getStatusForCell(roleId, shiftId);
        if (!status) return '';
        return `cell-${getStaffingColor(status.currentCount, status.capacity)}`;
    };

    const toggleExpand = (cellKey: string) => {
        setExpandedCell(expandedCell === cellKey ? null : cellKey);
    };

    return (
        <div className="glass-card overflow-hidden">
            {/* Desktop Grid View */}
            <div className="hidden md:block overflow-x-auto">
                <div className="grid-staffing">
                    {/* Header Row */}
                    <div className="grid-staffing-cell grid-staffing-header">Role</div>
                    {SHIFTS.map(shift => (
                        <div key={shift.id} className="grid-staffing-cell grid-staffing-header">
                            <div className="text-center">
                                <div>{shift.name.replace(' Shift', '')}</div>
                                <div className="text-xs opacity-75">{shift.startTime}-{shift.endTime}</div>
                            </div>
                        </div>
                    ))}

                    {/* Role Rows */}
                    {state.roles.map(role => (
                        <>
                            <div key={`${role.id}-label`} className="grid-staffing-cell grid-staffing-role">
                                <span className="text-xl">{role.icon}</span>
                                <span>{role.name}</span>
                            </div>
                            {SHIFTS.map(shift => {
                                const status = getStatusForCell(role.id, shift.id);
                                const cellKey = `${role.id}-${shift.id}`;
                                const isExpanded = expandedCell === cellKey;

                                return (
                                    <div
                                        key={cellKey}
                                        className={`grid-staffing-cell ${getCellColor(role.id, shift.id)} cursor-pointer hover:opacity-80 transition-opacity relative`}
                                        onClick={() => toggleExpand(cellKey)}
                                    >
                                        <div className="text-center">
                                            <div className="font-bold text-lg">
                                                {status?.currentCount ?? 0}
                                                <span className="text-sm text-[var(--text-muted)] font-normal">
                                                    /{status?.capacity ?? 0}
                                                </span>
                                            </div>
                                            {status?.isFull && (
                                                <span className="text-xs text-green-400">Full</span>
                                            )}
                                        </div>

                                        {/* Expanded View (people list) */}
                                        {isExpanded && status && status.participants.length > 0 && (
                                            <div
                                                className="absolute top-full left-0 right-0 z-10 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-b-lg p-2 shadow-lg"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="text-xs text-[var(--text-muted)] mb-1">Assigned:</div>
                                                <div className="space-y-1">
                                                    {status.participants.map(p => (
                                                        <div key={p.id} className="text-sm text-[var(--text-secondary)]">
                                                            {p.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    ))}
                </div>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden">
                {state.roles.map(role => (
                    <div key={role.id} className="border-b border-[var(--border-subtle)] last:border-0">
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">{role.icon}</span>
                                <span className="font-medium">{role.name}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {SHIFTS.map(shift => {
                                    const status = getStatusForCell(role.id, shift.id);
                                    return (
                                        <div
                                            key={shift.id}
                                            className={`p-2 rounded-lg text-center ${getCellColor(role.id, shift.id)}`}
                                        >
                                            <div className="text-xs text-[var(--text-muted)] mb-1">
                                                {shift.name.split(' ')[0]}
                                            </div>
                                            <div className="font-bold">
                                                {status?.currentCount ?? 0}/{status?.capacity ?? 0}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

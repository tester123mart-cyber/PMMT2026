import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShiftId } from '@/lib/types';
import { getAllRoleShiftStatuses, getStaffingColor } from '@/lib/calculations';
import { SHIFTS } from '@/lib/data';
import { generateId } from '@/lib/storage';

interface StaffingGridProps {
    clinicDayId: string;
}

export default function StaffingGrid({ clinicDayId }: StaffingGridProps) {
    const { state, updateRoleCapacity } = useApp();
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

    // Helper to update capacity
    const handleUpdateCapacity = async (roleId: string, shiftId: ShiftId, newCapacity: number) => {
        const existingCapacity = state.roleCapacities.find(
            rc => rc.clinicDayId === clinicDayId && rc.shiftId === shiftId && rc.roleId === roleId
        );

        await updateRoleCapacity({
            id: existingCapacity?.id || generateId(),
            clinicDayId,
            shiftId,
            roleId,
            capacity: newCapacity,
            updatedAt: new Date().toISOString()
        });
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
                                <div>
                                    <div className="leading-tight">{role.name}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] font-normal">
                                        Def: {role.capacityPerShift}
                                    </div>
                                </div>
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
                                                <span className="text-sm font-normal opacity-70">/{status?.capacity}</span>
                                            </div>
                                            {status?.isFull && (
                                                <span className="text-xs text-green-400">Full</span>
                                            )}
                                        </div>

                                        {/* Expanded View (People + Capacity Edit) */}
                                        {isExpanded && status && (
                                            <div
                                                className="absolute top-full left-0 right-0 z-20 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-b-lg p-3 shadow-xl min-w-[200px]"
                                                onClick={e => e.stopPropagation()}
                                                style={{ left: '50%', transform: 'translateX(-50%)' }}
                                            >
                                                {/* Capacity Editor */}
                                                <div className="mb-3 pb-2 border-b border-[var(--border-subtle)]">
                                                    <label className="text-xs text-[var(--text-muted)] block mb-1">
                                                        Capacity Limit
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="input-field py-1 px-2 text-sm w-16 text-center"
                                                            defaultValue={status.capacity}
                                                            onBlur={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (!isNaN(val) && val >= 0) {
                                                                    handleUpdateCapacity(role.id, shift.id, val);
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    const val = parseInt(e.currentTarget.value);
                                                                    if (!isNaN(val) && val >= 0) {
                                                                        handleUpdateCapacity(role.id, shift.id, val);
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-[10px] text-[var(--text-muted)]">
                                                            (Default: {role.capacityPerShift})
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-[var(--text-muted)] mb-1">
                                                    Assigned ({status.participants.length}):
                                                </div>
                                                {status.participants.length > 0 ? (
                                                    <div className="space-y-1 max-h-[150px] overflow-y-auto">
                                                        {status.participants.map(p => (
                                                            <div key={p.id} className="text-sm text-[var(--text-secondary)] truncate">
                                                                {p.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-[var(--text-muted)] italic">
                                                        No assignments yet
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    ))}
                </div>
            </div>

            {/* Mobile List View - Update to show capacity */}
            <div className="md:hidden">
                {state.roles.map(role => (
                    <div key={role.id} className="border-b border-[var(--border-subtle)] last:border-0">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{role.icon}</span>
                                    <span className="font-medium">{role.name}</span>
                                </div>
                                <span className="text-xs text-[var(--text-muted)]">Default: {role.capacityPerShift}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {SHIFTS.map(shift => {
                                    const status = getStatusForCell(role.id, shift.id);
                                    return (
                                        <div
                                            key={shift.id}
                                            className={`p-2 rounded-lg text-center ${getCellColor(role.id, shift.id)}`}
                                            onClick={() => {
                                                // Simple prompt for mobile for now, or just toggle expandable
                                                // Implementing prompt for simplicity in this iteration
                                                const newCap = prompt(`Set capacity for ${role.name} - ${shift.name}`, status?.capacity.toString());
                                                if (newCap !== null) {
                                                    const val = parseInt(newCap);
                                                    if (!isNaN(val) && val >= 0) {
                                                        handleUpdateCapacity(role.id, shift.id, val);
                                                    }
                                                }
                                            }}
                                        >
                                            <div className="text-xs text-[var(--text-muted)] mb-1">
                                                {shift.name.split(' ')[0]}
                                            </div>
                                            <div className="font-bold">
                                                {status?.currentCount ?? 0}
                                                <span className="opacity-70 text-xs">/{status?.capacity}</span>
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

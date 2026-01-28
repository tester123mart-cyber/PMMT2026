import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShiftId } from '@/lib/types';
import { getAllRoleShiftStatuses, getStaffingColor } from '@/lib/calculations';
import { SHIFTS } from '@/lib/data';
import { generateId } from '@/lib/storage';

interface StaffingGridProps {
    clinicDayId: string;
}

interface SelectedCell {
    roleId: string;
    shiftId: ShiftId;
    roleName: string;
    roleIcon: string;
    shiftName: string;
}

export default function StaffingGrid({ clinicDayId }: StaffingGridProps) {
    const { state, updateRoleCapacity } = useApp();
    const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
    const [tempCapacity, setTempCapacity] = useState<string>('');

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

    const openModal = (role: { id: string; name: string; icon: string }, shift: { id: ShiftId; name: string }) => {
        const status = getStatusForCell(role.id, shift.id);
        setSelectedCell({
            roleId: role.id,
            shiftId: shift.id,
            roleName: role.name,
            roleIcon: role.icon,
            shiftName: shift.name,
        });
        setTempCapacity(status?.capacity.toString() || '2');
    };

    const closeModal = () => {
        setSelectedCell(null);
        setTempCapacity('');
    };

    const saveCapacity = () => {
        if (selectedCell && tempCapacity) {
            const val = parseInt(tempCapacity);
            if (!isNaN(val) && val >= 0) {
                handleUpdateCapacity(selectedCell.roleId, selectedCell.shiftId, val);
            }
        }
        closeModal();
    };

    const selectedStatus = selectedCell ? getStatusForCell(selectedCell.roleId, selectedCell.shiftId) : null;

    return (
        <>
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
                                    </div>
                                </div>
                                {SHIFTS.map(shift => {
                                    const status = getStatusForCell(role.id, shift.id);

                                    return (
                                        <div
                                            key={`${role.id}-${shift.id}`}
                                            className={`grid-staffing-cell ${getCellColor(role.id, shift.id)} cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200 active:scale-95`}
                                            onClick={() => openModal(role, shift)}
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
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{role.icon}</span>
                                        <span className="font-medium">{role.name}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {SHIFTS.map(shift => {
                                        const status = getStatusForCell(role.id, shift.id);
                                        return (
                                            <button
                                                key={shift.id}
                                                className={`p-3 rounded-xl text-center ${getCellColor(role.id, shift.id)} active:scale-95 transition-transform touch-manipulation`}
                                                onClick={() => openModal(role, shift)}
                                            >
                                                <div className="text-xs text-[var(--text-muted)] mb-1">
                                                    {shift.id === 'morning1' ? '1st' : shift.id === 'morning2' ? '2nd' : '3rd'}
                                                </div>
                                                <div className="font-bold text-lg">
                                                    {status?.currentCount ?? 0}
                                                    <span className="opacity-70 text-xs">/{status?.capacity}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Beautiful Modal */}
            {selectedCell && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={closeModal}
                >
                    <div
                        className="w-full max-w-sm bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-[var(--border-subtle)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{selectedCell.roleIcon}</span>
                                    <div>
                                        <div className="font-semibold text-[var(--text-primary)]">{selectedCell.roleName}</div>
                                        <div className="text-sm text-[var(--text-muted)]">{selectedCell.shiftName}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {/* Capacity Editor */}
                            <div className="mb-5">
                                <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                                    📊 Capacity Limit
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setTempCapacity(Math.max(0, parseInt(tempCapacity) - 1).toString())}
                                        className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] text-xl font-bold hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min="0"
                                        className="flex-1 h-12 text-center text-2xl font-bold bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={tempCapacity}
                                        onChange={(e) => setTempCapacity(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setTempCapacity((parseInt(tempCapacity) + 1).toString())}
                                        className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] text-xl font-bold hover:bg-green-500/20 hover:text-green-400 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="text-xs text-[var(--text-muted)] mt-2 text-center">
                                    Currently: {selectedStatus?.currentCount ?? 0} assigned
                                </div>
                            </div>

                            {/* Assigned Participants */}
                            <div>
                                <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                                    👥 Assigned Participants ({selectedStatus?.participants.length ?? 0})
                                </label>
                                {selectedStatus && selectedStatus.participants.length > 0 ? (
                                    <div className="bg-[var(--bg-secondary)] rounded-xl p-3 max-h-[180px] overflow-y-auto">
                                        <div className="space-y-2">
                                            {selectedStatus.participants.map(p => (
                                                <div
                                                    key={p.id}
                                                    className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                                        {p.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm text-[var(--text-primary)]">{p.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-[var(--bg-secondary)] rounded-xl p-6 text-center">
                                        <div className="text-3xl mb-2">🙋</div>
                                        <p className="text-sm text-[var(--text-muted)]">No one assigned yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[var(--border-subtle)] flex gap-3">
                            <button
                                onClick={closeModal}
                                className="flex-1 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hover)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveCapacity}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

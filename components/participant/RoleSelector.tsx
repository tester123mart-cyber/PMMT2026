'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShiftId } from '@/lib/types';
import { getUnderstaffedRoles, getRoleShiftStatus } from '@/lib/calculations';
import PeoplePreview from './PeoplePreview';

interface RoleSelectorProps {
    clinicDayId: string;
    shiftId: ShiftId;
    onClose: () => void;
}

export default function RoleSelector({ clinicDayId, shiftId, onClose }: RoleSelectorProps) {
    const { state, addAssignment, removeAssignment, getMyAssignments, isRoleFull } = useApp();
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [showPeoplePreview, setShowPeoplePreview] = useState(false);

    // Get current user's assignment for this shift
    const myAssignments = getMyAssignments(clinicDayId);
    const myShiftAssignment = myAssignments.find(a => a.shiftId === shiftId);

    // Get understaffed roles for this shift
    const understaffedRoles = getUnderstaffedRoles(state, clinicDayId, shiftId);
    const understaffedRoleIds = new Set(understaffedRoles.map(r => r.roleId));

    // Group roles by category and sort alphabetically
    const clinicalRoles = state.roles
        .filter(r => r.category === 'clinical')
        .sort((a, b) => a.name.localeCompare(b.name));
    const supportRoles = state.roles
        .filter(r => r.category === 'support')
        .sort((a, b) => a.name.localeCompare(b.name));

    const handleRoleSelect = (roleId: string) => {
        if (isRoleFull(clinicDayId, shiftId, roleId) && myShiftAssignment?.roleId !== roleId) {
            return; // Can't select a full role (unless already assigned)
        }
        setSelectedRoleId(roleId);
        setShowPeoplePreview(true);
    };

    const handleConfirm = async () => {
        if (!selectedRoleId) return;

        // Remove existing assignment for this shift if any
        if (myShiftAssignment) {
            await removeAssignment(myShiftAssignment.id);
        }

        // Add new assignment
        await addAssignment(clinicDayId, shiftId, selectedRoleId);
        setShowPeoplePreview(false);
        setSelectedRoleId(null);
        onClose();
    };

    const handleRemoveAssignment = async () => {
        if (myShiftAssignment) {
            await removeAssignment(myShiftAssignment.id);
        }
        onClose();
    };

    const getRoleStatus = (roleId: string) => {
        return getRoleShiftStatus(state, clinicDayId, shiftId, roleId);
    };

    const renderRoleCard = (roleId: string) => {
        const role = state.roles.find(r => r.id === roleId);
        if (!role) return null;

        const isMyRole = myShiftAssignment?.roleId === roleId;

        return (
            <button
                key={roleId}
                onClick={() => handleRoleSelect(roleId)}
                className={`
                    p-4 rounded-xl text-left w-full transition-all border
                    ${selectedRoleId === roleId
                        ? 'bg-blue-500/10 border-blue-500'
                        : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] hover:border-blue-500/50'
                    }
                    ${isMyRole ? 'ring-2 ring-green-500' : ''}
                `}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{role.icon}</span>
                        <span className="font-medium text-[var(--text-primary)]">{role.name}</span>
                    </div>
                    {isMyRole && <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 font-medium">Your Role</span>}
                </div>
            </button>
        );
    };

    // People preview modal
    if (showPeoplePreview && selectedRoleId) {
        return (
            <PeoplePreview
                clinicDayId={clinicDayId}
                shiftId={shiftId}
                roleId={selectedRoleId}
                onConfirm={handleConfirm}
                onCancel={() => {
                    setShowPeoplePreview(false);
                    setSelectedRoleId(null);
                }}
            />
        );
    }

    return (
        <div className="glass-card p-4 scroll-stable min-h-[300px]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--text-primary)]">
                    Select Your Role
                </h3>
                <button
                    onClick={onClose}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Current Assignment */}
            {myShiftAssignment && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span className="text-sm text-green-300">
                                Currently assigned: {state.roles.find(r => r.id === myShiftAssignment.roleId)?.name}
                            </span>
                        </div>
                        <button
                            onClick={handleRemoveAssignment}
                            className="text-xs text-red-400 hover:text-red-300"
                        >
                            Unselect
                        </button>
                    </div>
                </div>
            )}

            {/* Clinical Roles */}
            <div className="mb-4">
                <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2">Clinical Roles</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                    {clinicalRoles.map(role => renderRoleCard(role.id))}
                </div>
            </div>

            {/* Support Roles */}
            <div>
                <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2">Support Roles</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                    {supportRoles.map(role => renderRoleCard(role.id))}
                </div>
            </div>
        </div>
    );
}

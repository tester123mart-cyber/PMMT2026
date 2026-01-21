'use client';

import { useApp } from '@/context/AppContext';
import { ShiftId } from '@/lib/types';
import { getRoleShiftStatus } from '@/lib/calculations';
import { SHIFTS } from '@/lib/data';

interface PeoplePreviewProps {
    clinicDayId: string;
    shiftId: ShiftId;
    roleId: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function PeoplePreview({
    clinicDayId,
    shiftId,
    roleId,
    onConfirm,
    onCancel,
}: PeoplePreviewProps) {
    const { state } = useApp();

    const role = state.roles.find(r => r.id === roleId);
    const shift = SHIFTS.find(s => s.id === shiftId);
    const status = getRoleShiftStatus(state, clinicDayId, shiftId, roleId);

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-4xl">{role?.icon}</span>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">{role?.name}</h2>
                        <p className="text-sm text-[var(--text-muted)]">
                            {shift?.name} • {shift?.startTime} - {shift?.endTime}
                        </p>
                    </div>
                </div>

                {/* Capacity Info */}
                <div className="mb-6 p-4 bg-[var(--bg-card)] rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-[var(--text-muted)]">Capacity</span>
                        <span className="font-semibold">
                            {status.currentCount} / {status.capacity}
                        </span>
                    </div>
                    <div className="capacity-bar">
                        <div
                            className={`capacity-bar-fill ${status.isFull ? 'green' : status.currentCount > 0 ? 'yellow' : 'red'
                                }`}
                            style={{ width: `${Math.min((status.currentCount / status.capacity) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* People Signed Up */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
                        People signed up for this shift
                    </h3>

                    {status.participants.length === 0 ? (
                        <div className="text-center py-6 text-[var(--text-muted)]">
                            <div className="text-3xl mb-2">👋</div>
                            <p>Be the first to sign up!</p>
                        </div>
                    ) : (
                        <div className="people-list">
                            {status.participants.map(participant => (
                                <div key={participant.id} className="person-chip">
                                    <div className="person-avatar">
                                        {getInitials(participant.name)}
                                    </div>
                                    <span>{participant.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
                    <button onClick={onCancel} className="btn-secondary flex-1">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn-primary flex-1"
                        disabled={status.isFull}
                    >
                        {status.isFull ? 'Full' : 'Confirm Selection'}
                    </button>
                </div>
            </div>
        </div>
    );
}

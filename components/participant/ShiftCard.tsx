'use client';

import { Shift, Role } from '@/lib/types';

interface ShiftCardProps {
    shift: Shift;
    role: Role | null | undefined;
    isAssigned: boolean;
}

export default function ShiftCard({ shift, role, isAssigned }: ShiftCardProps) {
    return (
        <div
            className={`
        shift-card
        ${isAssigned ? 'shift-card-active' : 'opacity-50'}
      `}
        >
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                        {shift.name}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                        {shift.startTime} - {shift.endTime}
                    </p>
                </div>
                {isAssigned && role && (
                    <span className="text-3xl">{role.icon}</span>
                )}
            </div>

            {isAssigned && role ? (
                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                        <span className="badge badge-available">Assigned</span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                            {role.name}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                    <span className="text-sm text-[var(--text-muted)]">
                        No assignment
                    </span>
                </div>
            )}
        </div>
    );
}

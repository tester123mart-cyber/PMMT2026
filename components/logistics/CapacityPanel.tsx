'use client';

import { useApp } from '@/context/AppContext';
import { calculateDayCapacity, getRecommendedTickets } from '@/lib/calculations';
import { getClinicalRoles } from '@/lib/data';

interface CapacityPanelProps {
    clinicDayId: string;
}

export default function CapacityPanel({ clinicDayId }: CapacityPanelProps) {
    const { state } = useApp();

    const capacity = calculateDayCapacity(state, clinicDayId);
    const recommendedTickets = getRecommendedTickets(state, clinicDayId);
    const clinicalRoles = getClinicalRoles();

    const clinicDay = state.clinicDays.find(d => d.id === clinicDayId);

    return (
        <div className="glass-card p-4 space-y-4">
            {/* Total Capacity */}
            <div className="text-center p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                <div className="text-3xl font-bold text-[var(--text-primary)]">
                    {capacity.total}
                </div>
                <div className="text-sm text-[var(--text-muted)]">
                    Projected Patients
                </div>
            </div>

            {/* Recommended Tickets */}
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Tickets to Issue</span>
                    <span className="text-xl font-bold text-green-400">{recommendedTickets}</span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1">
                    Includes 5% buffer for no-shows
                </div>
            </div>

            {/* Tickets Issued */}
            {clinicDay && (
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-secondary)]">Tickets Issued</span>
                        <span className="text-xl font-bold">{clinicDay.patientTicketsIssued}</span>
                    </div>
                </div>
            )}

            {/* Breakdown by Role */}
            <div>
                <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2">
                    Capacity by Service
                </h4>
                <div className="space-y-2">
                    {clinicalRoles.map(role => {
                        const roleCapacity = capacity.byRole[role.id] || 0;
                        const percentage = capacity.total > 0
                            ? Math.round((roleCapacity / capacity.total) * 100)
                            : 0;

                        return (
                            <div key={role.id} className="flex items-center gap-3">
                                <span className="text-xl">{role.icon}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-secondary)]">{role.name}</span>
                                        <span className="font-medium">{roleCapacity}</span>
                                    </div>
                                    <div className="capacity-bar mt-1">
                                        <div
                                            className="capacity-bar-fill green"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Flow Rate Info */}
            <div className="pt-3 border-t border-[var(--border-subtle)]">
                <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2">
                    Flow Rates (patients/hour/staff)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {clinicalRoles.map(role => {
                        const flowRate = state.flowRates.find(f => f.roleId === role.id);
                        return (
                            <div key={role.id} className="flex items-center gap-1 text-[var(--text-secondary)]">
                                <span>{role.icon}</span>
                                <span>{flowRate?.patientsPerHourPerStaff ?? '-'}/hr</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useApp } from '@/context/AppContext';
import { ShiftId } from '@/lib/types';
import { calculatePatientCapacity } from '@/lib/calculations';
import { getClinicalRoles, SHIFTS } from '@/lib/data';

interface DataFeedbackProps {
    clinicDayId: string;
    shiftId: ShiftId;
}

export default function DataFeedback({ clinicDayId, shiftId }: DataFeedbackProps) {
    const { state } = useApp();
    const clinicalRoles = getClinicalRoles();
    const shift = SHIFTS.find(s => s.id === shiftId);

    // Get actuals for this shift
    const shiftActuals = state.shiftActuals.filter(
        a => a.clinicDayId === clinicDayId && a.shiftId === shiftId
    );

    return (
        <div className="glass-card p-6 space-y-6">
            {/* Flow Rate Comparison */}
            <div>
                <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
                    Flow Rate Analysis
                </h3>
                <div className="space-y-4">
                    {clinicalRoles.map(role => {
                        const projected = calculatePatientCapacity(state, clinicDayId, shiftId, role.id);
                        const actual = shiftActuals.find(a => a.roleId === role.id);
                        const currentFlowRate = state.flowRates.find(f => f.roleId === role.id);

                        // Calculate actual flow rate if we have data
                        let actualFlowRate: number | null = null;
                        if (actual && actual.staffCount > 0 && shift) {
                            actualFlowRate = actual.patientsServed / (actual.staffCount * shift.durationHours);
                        }

                        const variance = actual
                            ? ((actual.patientsServed - projected.projectedPatients) / Math.max(projected.projectedPatients, 1)) * 100
                            : null;

                        return (
                            <div key={role.id} className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{role.icon}</span>
                                        <span className="font-medium">{role.name}</span>
                                    </div>
                                    {currentFlowRate && (
                                        <span className="text-xs text-[var(--text-muted)]">
                                            {currentFlowRate.patientsPerHourPerStaff}/hr baseline
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-center">
                                    {/* Projected */}
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <div className="text-xs text-[var(--text-muted)] mb-1">Projected</div>
                                        <div className="text-lg font-bold text-blue-400">
                                            {projected.projectedPatients}
                                        </div>
                                    </div>

                                    {/* Actual */}
                                    <div className={`p-2 rounded-lg ${actual ? 'bg-green-500/10' : 'bg-[var(--bg-card)]'}`}>
                                        <div className="text-xs text-[var(--text-muted)] mb-1">Actual</div>
                                        <div className={`text-lg font-bold ${actual ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>
                                            {actual?.patientsServed ?? '-'}
                                        </div>
                                    </div>

                                    {/* Variance */}
                                    <div className={`p-2 rounded-lg ${variance === null ? 'bg-[var(--bg-card)]' :
                                            variance >= 0 ? 'bg-green-500/10' : 'bg-yellow-500/10'
                                        }`}>
                                        <div className="text-xs text-[var(--text-muted)] mb-1">Variance</div>
                                        <div className={`text-lg font-bold ${variance === null ? 'text-[var(--text-muted)]' :
                                                variance >= 0 ? 'text-green-400' : 'text-yellow-400'
                                            }`}>
                                            {variance !== null ? `${variance >= 0 ? '+' : ''}${Math.round(variance)}%` : '-'}
                                        </div>
                                    </div>
                                </div>

                                {/* Actual Flow Rate */}
                                {actualFlowRate !== null && (
                                    <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex justify-between items-center text-sm">
                                        <span className="text-[var(--text-muted)]">Actual flow rate:</span>
                                        <span className="font-medium">
                                            {actualFlowRate.toFixed(1)} patients/hr/staff
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Learning Summary */}
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg">
                <h4 className="font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <span>🧠</span>
                    Data Feedback Loop
                </h4>
                <p className="text-sm text-[var(--text-secondary)]">
                    When you save shift data, flow rates are automatically updated using a weighted average
                    (70% historical, 30% new data). This improves accuracy for future patient capacity projections.
                </p>
            </div>

            {/* Historical Comparison */}
            <div>
                <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">
                    Current Flow Rates
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {clinicalRoles.map(role => {
                        const flowRate = state.flowRates.find(f => f.roleId === role.id);
                        return (
                            <div key={role.id} className="flex items-center gap-2 p-3 bg-[var(--bg-secondary)] rounded-lg">
                                <span>{role.icon}</span>
                                <div className="flex-1">
                                    <div className="text-sm">{role.name}</div>
                                    <div className="text-xs text-[var(--text-muted)]">
                                        {flowRate?.patientsPerHourPerStaff ?? '-'}/hr/staff
                                    </div>
                                </div>
                                {flowRate?.source === 'actual' && (
                                    <span className="badge badge-available text-xs">Updated</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

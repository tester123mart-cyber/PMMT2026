// PMMT Logistics App - Capacity Calculations

import { AppState, ShiftId, PatientCapacity, RoleShiftStatus } from './types';
import { SHIFTS, getClinicalRoles } from './data';

// Calculate patient capacity for a specific role/shift combination
export const calculatePatientCapacity = (
    state: AppState,
    clinicDayId: string,
    shiftId: ShiftId,
    roleId: string
): PatientCapacity => {
    const shift = SHIFTS.find(s => s.id === shiftId);
    const role = state.roles.find(r => r.id === roleId);
    const flowRate = state.flowRates.find(f => f.roleId === roleId);

    // Count staff assigned to this role/shift
    const staffCount = state.assignments.filter(
        a => a.clinicDayId === clinicDayId && a.shiftId === shiftId && a.roleId === roleId
    ).length;

    const rate = flowRate?.patientsPerHourPerStaff ?? role?.patientsPerHourPerStaff ?? 0;
    const hours = shift?.durationHours ?? 0;

    return {
        clinicDayId,
        shiftId,
        roleId,
        staffCount,
        flowRate: rate,
        projectedPatients: Math.floor(staffCount * rate * hours),
    };
};

// Calculate total patient capacity for a clinic day
export const calculateDayCapacity = (
    state: AppState,
    clinicDayId: string
): { byRole: Record<string, number>; byShift: Record<ShiftId, number>; total: number } => {
    const clinicalRoles = getClinicalRoles();
    const byRole: Record<string, number> = {};
    const byShift: Record<ShiftId, number> = {
        morning1: 0,
        morning2: 0,
        afternoon: 0,
    };
    let total = 0;

    for (const role of clinicalRoles) {
        byRole[role.id] = 0;

        for (const shift of SHIFTS) {
            const capacity = calculatePatientCapacity(state, clinicDayId, shift.id, role.id);
            byRole[role.id] += capacity.projectedPatients;
            byShift[shift.id] += capacity.projectedPatients;
            total += capacity.projectedPatients;
        }
    }

    return { byRole, byShift, total };
};

// Get recommended ticket count for a clinic day
export const getRecommendedTickets = (state: AppState, clinicDayId: string): number => {
    const { total } = calculateDayCapacity(state, clinicDayId);
    // Add a small buffer (5%) for no-shows
    return Math.floor(total * 1.05);
};

// Get role/shift status for staffing grid
export const getRoleShiftStatus = (
    state: AppState,
    clinicDayId: string,
    shiftId: ShiftId,
    roleId: string
): RoleShiftStatus => {
    const role = state.roles.find(r => r.id === roleId);
    const assignments = state.assignments.filter(
        a => a.clinicDayId === clinicDayId && a.shiftId === shiftId && a.roleId === roleId
    );

    const participants = assignments
        .map(a => state.participants.find(p => p.id === a.participantId))
        .filter((p): p is NonNullable<typeof p> => p !== undefined);

    const capacity = role?.capacityPerShift ?? 0;
    const currentCount = assignments.length;

    return {
        roleId,
        shiftId,
        clinicDayId,
        currentCount,
        capacity,
        isFull: currentCount >= capacity,
        participants,
    };
};

// Get all role/shift statuses for a clinic day (for staffing grid)
export const getAllRoleShiftStatuses = (
    state: AppState,
    clinicDayId: string
): RoleShiftStatus[] => {
    const statuses: RoleShiftStatus[] = [];

    for (const role of state.roles) {
        for (const shift of SHIFTS) {
            statuses.push(getRoleShiftStatus(state, clinicDayId, shift.id, role.id));
        }
    }

    return statuses;
};

// Get understaffed roles for a shift (helps needed indicator)
export const getUnderstaffedRoles = (
    state: AppState,
    clinicDayId: string,
    shiftId: ShiftId
): RoleShiftStatus[] => {
    return state.roles
        .map(role => getRoleShiftStatus(state, clinicDayId, shiftId, role.id))
        .filter(status => {
            // Consider understaffed if less than 50% filled
            const fillRatio = status.capacity > 0 ? status.currentCount / status.capacity : 1;
            return fillRatio < 0.5;
        });
};

// Get participants without assignments for a clinic day
export const getUnassignedParticipants = (
    state: AppState,
    clinicDayId: string
): { participant: typeof state.participants[0]; shiftsAssigned: number }[] => {
    return state.participants.map(participant => {
        const assignments = state.assignments.filter(
            a => a.clinicDayId === clinicDayId && a.participantId === participant.id
        );
        return {
            participant,
            shiftsAssigned: assignments.length,
        };
    }).filter(p => p.shiftsAssigned < SHIFTS.length); // Not assigned to all shifts
};

// Update flow rates based on actual data (feedback loop)
export const calculateActualFlowRate = (
    patientsServed: number,
    staffCount: number,
    shiftHours: number
): number => {
    if (staffCount === 0 || shiftHours === 0) return 0;
    return patientsServed / (staffCount * shiftHours);
};

// Blend historical and actual flow rates
export const blendFlowRates = (
    historical: number,
    actual: number,
    weight: number = 0.3 // 30% weight to new data
): number => {
    return historical * (1 - weight) + actual * weight;
};

// Get status color for staffing (for UI)
export const getStaffingColor = (currentCount: number, capacity: number): 'green' | 'yellow' | 'red' => {
    if (capacity === 0) return 'green';
    const ratio = currentCount / capacity;
    if (ratio >= 0.75) return 'green';
    if (ratio >= 0.25) return 'yellow';
    return 'red';
};

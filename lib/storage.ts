// PMMT Logistics App - Storage Layer

import { AppState, Participant, Assignment, ClinicDay, FlowRate, ShiftActuals } from './types';
import { ROLES, SHIFTS, DEFAULT_CLINIC_DAYS, DEFAULT_FLOW_RATES, SAMPLE_PARTICIPANTS } from './data';

const STORAGE_KEY = 'pmmt-logistics-app';

// Get initial state
export const getInitialState = (): AppState => ({
    currentUser: null,
    participants: SAMPLE_PARTICIPANTS,
    clinicDays: DEFAULT_CLINIC_DAYS,
    assignments: [],
    roles: ROLES,
    shifts: SHIFTS,
    flowRates: DEFAULT_FLOW_RATES,
    shiftActuals: [],
    patientRecords: [],
    pharmacyItems: [],
});

// Load state from localStorage
export const loadState = (): AppState => {
    if (typeof window === 'undefined') {
        return getInitialState();
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with defaults to ensure new fields are present
            return {
                ...getInitialState(),
                ...parsed,
                roles: ROLES, // Always use latest roles
                shifts: SHIFTS, // Always use latest shifts
            };
        }
    } catch (error) {
        console.error('Error loading state:', error);
    }

    return getInitialState();
};

// Save state to localStorage
export const saveState = (state: AppState): void => {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Error saving state:', error);
    }
};

// Export state as JSON file
export const exportData = (state: AppState): void => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pmmt-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// Import state from JSON file
export const importData = (file: File): Promise<AppState> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                resolve(data);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};

// Generate unique ID
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Participant helpers
export const addParticipant = (state: AppState, participant: Omit<Participant, 'id'>): AppState => {
    const newParticipant: Participant = {
        ...participant,
        id: generateId(),
    };
    return {
        ...state,
        participants: [...state.participants, newParticipant],
    };
};

export const findParticipantByEmail = (state: AppState, email: string): Participant | undefined => {
    return state.participants.find(p => p.email.toLowerCase() === email.toLowerCase());
};

// Assignment helpers
export const addAssignment = (state: AppState, assignment: Omit<Assignment, 'id' | 'createdAt'>): AppState => {
    const newAssignment: Assignment = {
        ...assignment,
        id: generateId(),
        createdAt: new Date().toISOString(),
    };
    return {
        ...state,
        assignments: [...state.assignments, newAssignment],
    };
};

export const removeAssignment = (state: AppState, assignmentId: string): AppState => {
    return {
        ...state,
        assignments: state.assignments.filter(a => a.id !== assignmentId),
    };
};

export const getAssignmentsForDay = (state: AppState, clinicDayId: string): Assignment[] => {
    return state.assignments.filter(a => a.clinicDayId === clinicDayId);
};

export const getAssignmentsForParticipant = (state: AppState, participantId: string): Assignment[] => {
    return state.assignments.filter(a => a.participantId === participantId);
};

export const getAssignmentCount = (
    state: AppState,
    clinicDayId: string,
    shiftId: string,
    roleId: string
): number => {
    return state.assignments.filter(
        a => a.clinicDayId === clinicDayId && a.shiftId === shiftId && a.roleId === roleId
    ).length;
};

// Check if a role/shift is full
export const isRoleShiftFull = (
    state: AppState,
    clinicDayId: string,
    shiftId: string,
    roleId: string
): boolean => {
    const role = state.roles.find(r => r.id === roleId);
    if (!role) return true;

    const count = getAssignmentCount(state, clinicDayId, shiftId, roleId);
    return count >= role.capacityPerShift;
};

// Clinic day helpers
export const getTodayClinicDay = (state: AppState): ClinicDay | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return state.clinicDays.find(d => d.date === today);
};

export const getTomorrowClinicDay = (state: AppState): ClinicDay | undefined => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    return state.clinicDays.find(d => d.date === tomorrowStr);
};

export const getNextClinicDay = (state: AppState): ClinicDay | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return state.clinicDays
        .filter(d => d.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))[0];
};

// Flow rate helpers
export const getFlowRate = (state: AppState, roleId: string): number => {
    const rate = state.flowRates.find(f => f.roleId === roleId);
    return rate?.patientsPerHourPerStaff ?? 0;
};

export const updateFlowRate = (
    state: AppState,
    roleId: string,
    newRate: number,
    clinicDayId?: string
): AppState => {
    const existingIndex = state.flowRates.findIndex(f => f.roleId === roleId);
    const newFlowRate: FlowRate = {
        roleId,
        patientsPerHourPerStaff: newRate,
        source: clinicDayId ? 'actual' : 'historical',
        clinicDayId,
        updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
        const newFlowRates = [...state.flowRates];
        newFlowRates[existingIndex] = newFlowRate;
        return { ...state, flowRates: newFlowRates };
    }

    return { ...state, flowRates: [...state.flowRates, newFlowRate] };
};

// Actuals helpers
export const addShiftActuals = (
    state: AppState,
    actuals: Omit<ShiftActuals, 'id' | 'recordedAt'>
): AppState => {
    const newActuals: ShiftActuals = {
        ...actuals,
        id: generateId(),
        recordedAt: new Date().toISOString(),
    };
    return {
        ...state,
        shiftActuals: [...state.shiftActuals, newActuals],
    };
};

// Clear all data (for testing)
export const clearAllData = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
    }
};

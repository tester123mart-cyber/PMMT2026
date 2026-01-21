'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, Participant, Assignment, ClinicDay, ShiftId } from '@/lib/types';
import { loadState, saveState, generateId, findParticipantByEmail } from '@/lib/storage';
import { ROLES, SHIFTS } from '@/lib/data';

// Action types
type Action =
    | { type: 'LOAD_STATE'; payload: AppState }
    | { type: 'LOGIN'; payload: Participant }
    | { type: 'LOGOUT' }
    | { type: 'ADD_PARTICIPANT'; payload: Omit<Participant, 'id'> }
    | { type: 'ADD_ASSIGNMENT'; payload: Omit<Assignment, 'id' | 'createdAt'> }
    | { type: 'REMOVE_ASSIGNMENT'; payload: string }
    | { type: 'UPDATE_ASSIGNMENT_ATTENDANCE'; payload: { id: string; attended: boolean } }
    | { type: 'UPDATE_CLINIC_DAY'; payload: ClinicDay }
    | { type: 'UPDATE_FLOW_RATE'; payload: { roleId: string; rate: number } }
    | { type: 'IMPORT_STATE'; payload: AppState };

// Reducer
function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'LOAD_STATE':
            return action.payload;

        case 'LOGIN':
            return { ...state, currentUser: action.payload };

        case 'LOGOUT':
            return { ...state, currentUser: null };

        case 'ADD_PARTICIPANT': {
            const newParticipant: Participant = {
                ...action.payload,
                id: generateId(),
            };
            return {
                ...state,
                participants: [...state.participants, newParticipant],
            };
        }

        case 'ADD_ASSIGNMENT': {
            const newAssignment: Assignment = {
                ...action.payload,
                id: generateId(),
                createdAt: new Date().toISOString(),
            };
            return {
                ...state,
                assignments: [...state.assignments, newAssignment],
            };
        }

        case 'REMOVE_ASSIGNMENT':
            return {
                ...state,
                assignments: state.assignments.filter(a => a.id !== action.payload),
            };

        case 'UPDATE_ASSIGNMENT_ATTENDANCE':
            return {
                ...state,
                assignments: state.assignments.map(a =>
                    a.id === action.payload.id ? { ...a, attended: action.payload.attended } : a
                ),
            };

        case 'UPDATE_CLINIC_DAY':
            return {
                ...state,
                clinicDays: state.clinicDays.map(d =>
                    d.id === action.payload.id ? action.payload : d
                ),
            };

        case 'UPDATE_FLOW_RATE':
            return {
                ...state,
                flowRates: state.flowRates.map(f =>
                    f.roleId === action.payload.roleId
                        ? { ...f, patientsPerHourPerStaff: action.payload.rate, updatedAt: new Date().toISOString() }
                        : f
                ),
            };

        case 'IMPORT_STATE':
            return {
                ...action.payload,
                roles: ROLES,
                shifts: SHIFTS,
            };

        default:
            return state;
    }
}

// Context
interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    // Convenience methods
    login: (email: string, name: string) => Participant | null;
    logout: () => void;
    addAssignment: (clinicDayId: string, shiftId: ShiftId, roleId: string) => boolean;
    removeAssignment: (assignmentId: string) => void;
    isRoleFull: (clinicDayId: string, shiftId: ShiftId, roleId: string) => boolean;
    getMyAssignments: (clinicDayId: string) => Assignment[];
    getParticipantsForShift: (clinicDayId: string, shiftId: ShiftId, roleId: string) => Participant[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, {
        currentUser: null,
        participants: [],
        clinicDays: [],
        assignments: [],
        roles: ROLES,
        shifts: SHIFTS,
        flowRates: [],
        shiftActuals: [],
    });

    // Load state on mount
    useEffect(() => {
        const loaded = loadState();
        dispatch({ type: 'LOAD_STATE', payload: loaded });
    }, []);

    // Save state on change (but not on initial load)
    useEffect(() => {
        if (state.participants.length > 0 || state.assignments.length > 0) {
            saveState(state);
        }
    }, [state]);

    // Login helper
    const login = (email: string, name: string): Participant | null => {
        let participant = findParticipantByEmail(state, email);

        if (!participant) {
            // Create new participant
            participant = {
                id: generateId(),
                email: email.toLowerCase(),
                name,
            };
            dispatch({ type: 'ADD_PARTICIPANT', payload: { email: email.toLowerCase(), name } });
            // Re-find to get the one with ID
            const newState = { ...state, participants: [...state.participants, participant] };
            participant = findParticipantByEmail(newState, email) || participant;
        }

        dispatch({ type: 'LOGIN', payload: participant });
        return participant;
    };

    // Logout helper
    const logout = () => {
        dispatch({ type: 'LOGOUT' });
    };

    // Check if role is full
    const isRoleFull = (clinicDayId: string, shiftId: ShiftId, roleId: string): boolean => {
        const role = state.roles.find(r => r.id === roleId);
        if (!role) return true;

        const count = state.assignments.filter(
            a => a.clinicDayId === clinicDayId && a.shiftId === shiftId && a.roleId === roleId
        ).length;

        return count >= role.capacityPerShift;
    };

    // Add assignment helper
    const addAssignment = (clinicDayId: string, shiftId: ShiftId, roleId: string): boolean => {
        if (!state.currentUser) return false;
        if (isRoleFull(clinicDayId, shiftId, roleId)) return false;

        // Check if already assigned to this shift
        const existing = state.assignments.find(
            a => a.clinicDayId === clinicDayId &&
                a.shiftId === shiftId &&
                a.participantId === state.currentUser?.id
        );
        if (existing) return false;

        dispatch({
            type: 'ADD_ASSIGNMENT',
            payload: {
                participantId: state.currentUser.id,
                clinicDayId,
                shiftId,
                roleId,
            },
        });
        return true;
    };

    // Remove assignment helper
    const removeAssignment = (assignmentId: string) => {
        dispatch({ type: 'REMOVE_ASSIGNMENT', payload: assignmentId });
    };

    // Get current user's assignments for a day
    const getMyAssignments = (clinicDayId: string): Assignment[] => {
        if (!state.currentUser) return [];
        return state.assignments.filter(
            a => a.clinicDayId === clinicDayId && a.participantId === state.currentUser?.id
        );
    };

    // Get participants for a specific shift/role
    const getParticipantsForShift = (clinicDayId: string, shiftId: ShiftId, roleId: string): Participant[] => {
        const assignments = state.assignments.filter(
            a => a.clinicDayId === clinicDayId && a.shiftId === shiftId && a.roleId === roleId
        );
        return assignments
            .map(a => state.participants.find(p => p.id === a.participantId))
            .filter((p): p is Participant => p !== undefined);
    };

    const value: AppContextType = {
        state,
        dispatch,
        login,
        logout,
        addAssignment,
        removeAssignment,
        isRoleFull,
        getMyAssignments,
        getParticipantsForShift,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook
export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

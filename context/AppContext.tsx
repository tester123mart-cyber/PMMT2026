'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import { AppState, Participant, Assignment, ClinicDay, ShiftId, PatientRecord, PharmacyItem, RoleCapacity } from '@/lib/types';
import { loadState, saveState, generateId, findParticipantByEmail } from '@/lib/storage';
import { ROLES, SHIFTS } from '@/lib/data';
import * as firebaseService from '@/lib/firebaseService';

// Action types
type Action =
    | { type: 'LOAD_STATE'; payload: AppState }
    | { type: 'LOGIN'; payload: Participant }
    | { type: 'LOGOUT' }
    | { type: 'ADD_PARTICIPANT'; payload: Participant }
    | { type: 'ADD_ASSIGNMENT'; payload: Assignment }
    | { type: 'REMOVE_ASSIGNMENT'; payload: string }
    | { type: 'UPDATE_ASSIGNMENTS'; payload: Assignment[] }
    | { type: 'UPDATE_PARTICIPANTS'; payload: Participant[] }
    | { type: 'UPDATE_CLINIC_DAYS'; payload: ClinicDay[] }
    | { type: 'UPDATE_ASSIGNMENT_ATTENDANCE'; payload: { id: string; attended: boolean } }
    | { type: 'UPDATE_CLINIC_DAY'; payload: ClinicDay }
    | { type: 'UPDATE_FLOW_RATE'; payload: { roleId: string; rate: number } }
    | { type: 'UPDATE_PATIENT_RECORDS'; payload: PatientRecord[] }
    | { type: 'UPDATE_PATIENT_RECORDS'; payload: PatientRecord[] }
    | { type: 'IMPORT_STATE'; payload: AppState }
    | { type: 'ADD_CLINIC_DAY'; payload: ClinicDay }
    | { type: 'REMOVE_CLINIC_DAY'; payload: string }
    | { type: 'REMOVE_CLINIC_DAY'; payload: string }
    | { type: 'UPDATE_PHARMACY_ITEMS'; payload: PharmacyItem[] }
    | { type: 'UPDATE_ROLE_CAPACITIES'; payload: RoleCapacity[] }
    | { type: 'UPDATE_ROLE_CAPACITY_ITEM'; payload: RoleCapacity };

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
            // Check if participant already exists
            const exists = state.participants.some(p => p.id === action.payload.id);
            if (exists) return state;
            return {
                ...state,
                participants: [...state.participants, action.payload],
            };
        }

        case 'ADD_ASSIGNMENT': {
            // Check if assignment already exists
            const exists = state.assignments.some(a => a.id === action.payload.id);
            if (exists) return state;
            return {
                ...state,
                assignments: [...state.assignments, action.payload],
            };
        }

        case 'REMOVE_ASSIGNMENT':
            return {
                ...state,
                assignments: state.assignments.filter(a => a.id !== action.payload),
            };

        case 'UPDATE_ASSIGNMENTS':
            return {
                ...state,
                assignments: action.payload,
            };

        case 'UPDATE_PARTICIPANTS':
            return {
                ...state,
                participants: action.payload,
            };

        case 'UPDATE_CLINIC_DAYS':
            return {
                ...state,
                clinicDays: action.payload,
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

        case 'UPDATE_PATIENT_RECORDS':
            return {
                ...state,
                patientRecords: action.payload,
            };

        case 'UPDATE_PHARMACY_ITEMS':
            return {
                ...state,
                pharmacyItems: action.payload,
            };

        case 'IMPORT_STATE':
            return {
                ...action.payload,
                roles: ROLES,
                shifts: SHIFTS,
            };

        case 'ADD_CLINIC_DAY':
            return {
                ...state,
                clinicDays: [...state.clinicDays, action.payload].sort((a, b) => a.date.localeCompare(b.date)),
            };

        case 'REMOVE_CLINIC_DAY':
            return {
                ...state,
                clinicDays: state.clinicDays.filter(d => d.id !== action.payload),
            };

        case 'UPDATE_ROLE_CAPACITIES':
            return {
                ...state,
                roleCapacities: action.payload,
            };

        case 'UPDATE_ROLE_CAPACITY_ITEM': {
            const existingIndex = state.roleCapacities.findIndex(rc => rc.id === action.payload.id);
            if (existingIndex >= 0) {
                const newCapacities = [...state.roleCapacities];
                newCapacities[existingIndex] = action.payload;
                return { ...state, roleCapacities: newCapacities };
            }
            return { ...state, roleCapacities: [...state.roleCapacities, action.payload] };
        }

        default:
            return state;
    }
}

// Context
interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    // Convenience methods
    login: (email: string, name: string) => Promise<Participant | null>;
    logout: () => void;
    addAssignment: (clinicDayId: string, shiftId: ShiftId, roleId: string) => Promise<boolean>;
    removeAssignment: (assignmentId: string) => Promise<void>;
    isRoleFull: (clinicDayId: string, shiftId: ShiftId, roleId: string) => boolean;
    getMyAssignments: (clinicDayId: string) => Assignment[];

    getParticipantsForShift: (clinicDayId: string, shiftId: ShiftId, roleId: string) => Participant[];
    addClinicDay: (day: ClinicDay) => Promise<void>;
    updateClinicDay: (day: ClinicDay) => Promise<void>;
    removeClinicDay: (id: string) => Promise<void>;
    addParticipant: (participant: Participant) => Promise<void>;
    updateParticipant: (participant: Participant) => Promise<void>;
    updateRoleCapacity: (capacity: RoleCapacity) => Promise<void>;
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
        patientRecords: [],
        pharmacyItems: [],
        roleCapacities: [],
    });

    const isFirebaseEnabled = firebaseService.isFirebaseConfigured();
    const unsubscribeRefs = useRef<(() => void)[]>([]);

    // Load state on mount
    useEffect(() => {
        const initializeData = async () => {
            if (isFirebaseEnabled) {
                // Initialize default data in Firebase if needed
                await firebaseService.initializeDefaultData();

                // Load from Firebase
                const firebaseState = await firebaseService.loadStateFromFirebase();
                const localState = loadState();

                dispatch({
                    type: 'LOAD_STATE',
                    payload: {
                        ...localState,
                        ...firebaseState,
                        // currentUser: null, // REMOVED: Allow persistent login
                        roles: ROLES,
                        shifts: SHIFTS,
                    } as AppState,
                });

                // Set up real-time listeners
                const unsubAssignments = firebaseService.subscribeToAssignments((assignments) => {
                    dispatch({ type: 'UPDATE_ASSIGNMENTS', payload: assignments });
                });
                const unsubParticipants = firebaseService.subscribeToParticipants((participants) => {
                    dispatch({ type: 'UPDATE_PARTICIPANTS', payload: participants });
                });
                const unsubClinicDays = firebaseService.subscribeToClinicDays((clinicDays) => {
                    dispatch({ type: 'UPDATE_CLINIC_DAYS', payload: clinicDays });
                });
                const unsubPatientRecords = firebaseService.subscribeToPatientRecords((records) => {
                    dispatch({ type: 'UPDATE_PATIENT_RECORDS', payload: records });
                });
                const unsubPharmacyItems = firebaseService.subscribeToPharmacyItems((items) => {
                    dispatch({ type: 'UPDATE_PHARMACY_ITEMS', payload: items });
                });
                const unsubRoleCapacities = firebaseService.subscribeToRoleCapacities((capacities) => {
                    dispatch({ type: 'UPDATE_ROLE_CAPACITIES', payload: capacities });
                });

                if (unsubAssignments) unsubscribeRefs.current.push(unsubAssignments);
                if (unsubParticipants) unsubscribeRefs.current.push(unsubParticipants);
                if (unsubClinicDays) unsubscribeRefs.current.push(unsubClinicDays);
                if (unsubPatientRecords) unsubscribeRefs.current.push(unsubPatientRecords);
                if (unsubPharmacyItems) unsubscribeRefs.current.push(unsubPharmacyItems);
                if (unsubRoleCapacities) unsubscribeRefs.current.push(unsubRoleCapacities);
            } else {
                // Fall back to localStorage
                const loaded = loadState();
                dispatch({
                    type: 'LOAD_STATE',
                    payload: {
                        ...loaded,
                        // currentUser: null // REMOVED: Allow persistent login
                    }
                });
            }
        };

        initializeData();

        // Cleanup subscriptions on unmount
        return () => {
            unsubscribeRefs.current.forEach(unsub => unsub());
        };
    }, [isFirebaseEnabled]);

    // Save state to localStorage (as backup, even with Firebase)
    useEffect(() => {
        if (state.participants.length > 0 || state.assignments.length > 0) {
            saveState(state);
        }
    }, [state]);

    // Login helper
    const login = async (email: string, name: string): Promise<Participant | null> => {
        let participant: Participant | null = null;

        if (isFirebaseEnabled) {
            // Check Firebase for existing participant
            participant = await firebaseService.getParticipantByEmail(email);
        }

        if (!participant) {
            // Check local state
            participant = findParticipantByEmail(state, email) || null;
        }

        if (!participant) {
            // Create new participant
            participant = {
                id: generateId(),
                email: email.toLowerCase(),
                name,
            };

            if (isFirebaseEnabled) {
                await firebaseService.addParticipant(participant);
            }
            dispatch({ type: 'ADD_PARTICIPANT', payload: participant });
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

        const customCapacity = state.roleCapacities.find(
            rc => rc.clinicDayId === clinicDayId && rc.shiftId === shiftId && rc.roleId === roleId
        );

        const capacity = customCapacity ? customCapacity.capacity : role.capacityPerShift;

        return count >= capacity;
    };

    // Add assignment helper
    const addAssignment = async (clinicDayId: string, shiftId: ShiftId, roleId: string): Promise<boolean> => {
        if (!state.currentUser) return false;
        if (isRoleFull(clinicDayId, shiftId, roleId)) return false;

        // Check if already assigned to this shift
        const existing = state.assignments.find(
            a => a.clinicDayId === clinicDayId &&
                a.shiftId === shiftId &&
                a.participantId === state.currentUser?.id
        );
        if (existing) return false;

        const newAssignment: Assignment = {
            id: generateId(),
            participantId: state.currentUser.id,
            clinicDayId,
            shiftId,
            roleId,
            createdAt: new Date().toISOString(),
        };

        if (isFirebaseEnabled) {
            await firebaseService.addAssignment(newAssignment);
        }
        dispatch({ type: 'ADD_ASSIGNMENT', payload: newAssignment });
        return true;
    };

    // Remove assignment helper
    const removeAssignment = async (assignmentId: string): Promise<void> => {
        if (isFirebaseEnabled) {
            await firebaseService.removeAssignment(assignmentId);
        }
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

    const addClinicDay = async (day: ClinicDay): Promise<void> => {
        if (isFirebaseEnabled) {
            await firebaseService.addClinicDay(day);
        }
        dispatch({ type: 'ADD_CLINIC_DAY', payload: day });
    };

    const updateClinicDay = async (day: ClinicDay): Promise<void> => {
        if (isFirebaseEnabled) {
            await firebaseService.updateClinicDay(day);
        }
        dispatch({ type: 'UPDATE_CLINIC_DAY', payload: day });
    };

    const removeClinicDay = async (id: string): Promise<void> => {
        if (isFirebaseEnabled) {
            await firebaseService.removeClinicDay(id);
        }
        dispatch({ type: 'REMOVE_CLINIC_DAY', payload: id });
    };

    const addParticipant = async (participant: Participant): Promise<void> => {
        if (isFirebaseEnabled) {
            await firebaseService.addParticipant(participant);
        }
        dispatch({ type: 'ADD_PARTICIPANT', payload: participant });
    };

    const updateRoleCapacity = async (capacity: RoleCapacity): Promise<void> => {
        if (isFirebaseEnabled) {
            await firebaseService.updateRoleCapacity(capacity);
        }
        dispatch({ type: 'UPDATE_ROLE_CAPACITY_ITEM', payload: capacity });
    };

    const updateParticipant = async (participant: Participant): Promise<void> => {
        if (isFirebaseEnabled) {
            await firebaseService.updateParticipant(participant);
        }
        // Helper to update specific participant in the array
        const updatedParticipants = state.participants.map(p =>
            p.id === participant.id ? participant : p
        );
        dispatch({ type: 'UPDATE_PARTICIPANTS', payload: updatedParticipants });
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
        addClinicDay,
        updateClinicDay,
        removeClinicDay,
        addParticipant,
        updateParticipant,
        updateRoleCapacity,
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

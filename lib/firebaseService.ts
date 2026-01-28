// Firebase Firestore service layer for PMMT app

import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    onSnapshot,
    query,
    where,
    writeBatch,
    Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { AppState, Participant, Assignment, ClinicDay, FlowRate, ShiftActuals, PatientRecord, PharmacyItem, RoleCapacity } from './types';
import { ROLES, SHIFTS, DEFAULT_CLINIC_DAYS, DEFAULT_FLOW_RATES, SAMPLE_PARTICIPANTS, SAMPLE_PHARMACY_ITEMS, SAMPLE_PATIENT_RECORDS } from './data';
import { generateId } from './storage';

// Collection names
const COLLECTIONS = {
    PARTICIPANTS: 'participants',
    ASSIGNMENTS: 'assignments',
    CLINIC_DAYS: 'clinicDays',
    FLOW_RATES: 'flowRates',
    SHIFT_ACTUALS: 'shiftActuals',
    PATIENT_RECORDS: 'patientRecords',
    PHARMACY_ITEMS: 'pharmacyItems',
    ROLE_CAPACITIES: 'roleCapacities',
    APP_CONFIG: 'appConfig',
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
    // Debug logging
    if (typeof window !== 'undefined' && !(window as any)._firebaseLogged) {
        console.log('Checking Firebase Config:', {
            hasKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            hasProject: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            keyValid: process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your-api-key-here'
        });
        (window as any)._firebaseLogged = true;
    }

    return !!(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your-api-key-here'
    );
};

// Initialize default data if collections are empty
export const initializeDefaultData = async (): Promise<void> => {
    if (!isFirebaseConfigured()) return;

    try {
        // Check if we already have data
        const participantsSnap = await getDocs(collection(db, COLLECTIONS.PARTICIPANTS));
        if (participantsSnap.empty) {
            // Add sample participants
            for (const participant of SAMPLE_PARTICIPANTS) {
                await setDoc(doc(db, COLLECTIONS.PARTICIPANTS, participant.id), participant);
            }
        }

        const clinicDaysSnap = await getDocs(collection(db, COLLECTIONS.CLINIC_DAYS));
        if (clinicDaysSnap.empty) {
            // Add default clinic days
            for (const day of DEFAULT_CLINIC_DAYS) {
                await setDoc(doc(db, COLLECTIONS.CLINIC_DAYS, day.id), day);
            }
        }

        const flowRatesSnap = await getDocs(collection(db, COLLECTIONS.FLOW_RATES));
        if (flowRatesSnap.empty) {
            // Add default flow rates
            for (const rate of DEFAULT_FLOW_RATES) {
                await setDoc(doc(db, COLLECTIONS.FLOW_RATES, rate.roleId), rate);
            }
        }

        // Add sample pharmacy items
        const pharmacySnap = await getDocs(collection(db, COLLECTIONS.PHARMACY_ITEMS));
        // Force seed if empty OR if we want to guarantee sample data presence (e.g. for testing)
        // Using upsert approach to ensure sample data exists
        if (pharmacySnap.empty || true) { // Force check/add
            console.log("Seeding Pharmacy Items...");
            const pharmacyBatch = writeBatch(db);
            // We'll read current items to avoid overwriting if possible, but user asked for "rerun".
            // Let's just write them.
            for (const item of SAMPLE_PHARMACY_ITEMS) {
                const itemRef = doc(db, COLLECTIONS.PHARMACY_ITEMS, item.id);
                pharmacyBatch.set(itemRef, item);
            }
            await pharmacyBatch.commit();
        }

        // Add sample patient records
        const recordsSnap = await getDocs(collection(db, COLLECTIONS.PATIENT_RECORDS));
        if (recordsSnap.empty || true) { // Force check/add
            console.log("Seeding Patient Records...");
            const recordsBatch = writeBatch(db);
            for (const record of SAMPLE_PATIENT_RECORDS) {
                const recordRef = doc(db, COLLECTIONS.PATIENT_RECORDS, record.id);
                recordsBatch.set(recordRef, record);
            }
            await recordsBatch.commit();
        }
    } catch (error) {
        console.error('Error initializing default data:', error);
    }
};

// Participant operations
export const addParticipant = async (participant: Participant): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    await setDoc(doc(db, COLLECTIONS.PARTICIPANTS, participant.id), participant);
};

export const updateParticipant = async (participant: Participant): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    await setDoc(doc(db, COLLECTIONS.PARTICIPANTS, participant.id), participant);
};

export const getParticipantByEmail = async (email: string): Promise<Participant | null> => {
    if (!isFirebaseConfigured()) return null;

    const q = query(
        collection(db, COLLECTIONS.PARTICIPANTS),
        where('email', '==', email.toLowerCase())
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as Participant;
};

export const getAllParticipants = async (): Promise<Participant[]> => {
    if (!isFirebaseConfigured()) return SAMPLE_PARTICIPANTS;

    const snapshot = await getDocs(collection(db, COLLECTIONS.PARTICIPANTS));
    return snapshot.docs.map(doc => doc.data() as Participant);
};

// Assignment operations
export const addAssignment = async (assignment: Assignment): Promise<void> => {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured, cannot add assignment:', assignment.id);
        return;
    }

    try {
        console.log('Adding assignment to Firebase:', assignment.id);
        await setDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignment.id), assignment);
        console.log('Successfully added assignment');
    } catch (error) {
        console.error('Error adding assignment:', error);
        throw error;
    }
};

export const removeAssignment = async (assignmentId: string): Promise<void> => {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured, cannot remove assignment:', assignmentId);
        return;
    }

    try {
        console.log('Removing assignment from Firebase:', assignmentId);
        await deleteDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId));
        console.log('Successfully removed assignment');
    } catch (error) {
        console.error('Error removing assignment:', error);
        throw error;
    }
};

export const getAllAssignments = async (): Promise<Assignment[]> => {
    if (!isFirebaseConfigured()) return [];

    const snapshot = await getDocs(collection(db, COLLECTIONS.ASSIGNMENTS));
    return snapshot.docs.map(doc => doc.data() as Assignment);
};

export const getAssignmentsByParticipant = async (participantId: string): Promise<Assignment[]> => {
    if (!isFirebaseConfigured()) return [];

    const q = query(
        collection(db, COLLECTIONS.ASSIGNMENTS),
        where('participantId', '==', participantId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Assignment);
};

// Clinic day operations
export const getAllClinicDays = async (): Promise<ClinicDay[]> => {
    if (!isFirebaseConfigured()) return DEFAULT_CLINIC_DAYS;

    const snapshot = await getDocs(collection(db, COLLECTIONS.CLINIC_DAYS));
    if (snapshot.empty) return DEFAULT_CLINIC_DAYS;
    return snapshot.docs.map(doc => doc.data() as ClinicDay);
};

export const addClinicDay = async (clinicDay: ClinicDay): Promise<void> => {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured, cannot add clinic day:', clinicDay.name);
        return;
    }

    try {
        console.log('Adding clinic day to Firebase:', clinicDay.id);
        await setDoc(doc(db, COLLECTIONS.CLINIC_DAYS, clinicDay.id), clinicDay);
        console.log('Successfully added clinic day');
    } catch (error) {
        console.error('Error adding clinic day:', error);
        throw error; // Re-throw so UI can handle it
    }
};

export const updateClinicDay = async (clinicDay: ClinicDay): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    try {
        await setDoc(doc(db, COLLECTIONS.CLINIC_DAYS, clinicDay.id), clinicDay);
    } catch (error) {
        console.error('Error updating clinic day:', error);
        throw error;
    }
};

export const removeClinicDay = async (clinicDayId: string): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    await deleteDoc(doc(db, COLLECTIONS.CLINIC_DAYS, clinicDayId));
};

// Flow rate operations
export const getAllFlowRates = async (): Promise<FlowRate[]> => {
    if (!isFirebaseConfigured()) return DEFAULT_FLOW_RATES;

    const snapshot = await getDocs(collection(db, COLLECTIONS.FLOW_RATES));
    if (snapshot.empty) return DEFAULT_FLOW_RATES;
    return snapshot.docs.map(doc => doc.data() as FlowRate);
};

export const updateFlowRate = async (flowRate: FlowRate): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    await setDoc(doc(db, COLLECTIONS.FLOW_RATES, flowRate.roleId), flowRate);
};

// Shift actuals operations
export const addShiftActuals = async (actuals: ShiftActuals): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    await setDoc(doc(db, COLLECTIONS.SHIFT_ACTUALS, actuals.id), actuals);
};

export const getAllShiftActuals = async (): Promise<ShiftActuals[]> => {
    if (!isFirebaseConfigured()) return [];

    const snapshot = await getDocs(collection(db, COLLECTIONS.SHIFT_ACTUALS));
    return snapshot.docs.map(doc => doc.data() as ShiftActuals);
};

// Patient record operations
export const addPatientRecord = async (record: PatientRecord): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    await setDoc(doc(db, COLLECTIONS.PATIENT_RECORDS, record.id), record);
};

export const getAllPatientRecords = async (): Promise<PatientRecord[]> => {
    if (!isFirebaseConfigured()) return SAMPLE_PATIENT_RECORDS;

    const snapshot = await getDocs(collection(db, COLLECTIONS.PATIENT_RECORDS));
    if (snapshot.empty) return SAMPLE_PATIENT_RECORDS;
    return snapshot.docs.map(doc => doc.data() as PatientRecord);
};

export const getPatientRecordsByClinicDay = async (clinicDayId: string): Promise<PatientRecord[]> => {
    if (!isFirebaseConfigured()) {
        return SAMPLE_PATIENT_RECORDS.filter(r => r.clinicDayId === clinicDayId);
    }

    const q = query(
        collection(db, COLLECTIONS.PATIENT_RECORDS),
        where('clinicDayId', '==', clinicDayId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return SAMPLE_PATIENT_RECORDS.filter(r => r.clinicDayId === clinicDayId);
    }
    return snapshot.docs.map(doc => doc.data() as PatientRecord);
};

// Real-time listeners
export const subscribeToAssignments = (
    callback: (assignments: Assignment[]) => void
): Unsubscribe | null => {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured, real-time assignments sync disabled');
        return null;
    }

    console.log('Setting up real-time assignments listener...');
    return onSnapshot(collection(db, COLLECTIONS.ASSIGNMENTS), (snapshot) => {
        const assignments = snapshot.docs.map(doc => doc.data() as Assignment);
        console.log(`Real-time update: ${assignments.length} assignments`);
        callback(assignments);
    }, (error) => {
        console.error('Assignments listener error:', error);
    });
};

export const subscribeToParticipants = (
    callback: (participants: Participant[]) => void
): Unsubscribe | null => {
    if (!isFirebaseConfigured()) return null;

    return onSnapshot(collection(db, COLLECTIONS.PARTICIPANTS), (snapshot) => {
        const participants = snapshot.docs.map(doc => doc.data() as Participant);
        callback(participants);
    });
};

export const subscribeToClinicDays = (
    callback: (clinicDays: ClinicDay[]) => void
): Unsubscribe | null => {
    if (!isFirebaseConfigured()) return null;

    return onSnapshot(collection(db, COLLECTIONS.CLINIC_DAYS), (snapshot) => {
        const clinicDays = snapshot.docs.map(doc => doc.data() as ClinicDay);
        if (clinicDays.length === 0) {
            console.warn('Clinic days empty from Firebase, using defaults');
            callback(DEFAULT_CLINIC_DAYS);
        } else {
            callback(clinicDays);
        }
    });
};

export const subscribeToPatientRecords = (
    callback: (records: PatientRecord[]) => void
): Unsubscribe | null => {
    if (!isFirebaseConfigured()) return null;

    return onSnapshot(collection(db, COLLECTIONS.PATIENT_RECORDS), (snapshot) => {
        const records = snapshot.docs.map(doc => doc.data() as PatientRecord);
        if (records.length === 0) {
            callback(SAMPLE_PATIENT_RECORDS);
        } else {
            callback(records);
        }
    });
};

export const subscribeToPharmacyItems = (
    callback: (items: PharmacyItem[]) => void
): Unsubscribe | null => {
    if (!isFirebaseConfigured()) return null;

    return onSnapshot(collection(db, COLLECTIONS.PHARMACY_ITEMS), (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data() as PharmacyItem);
        if (items.length === 0) {
            callback(SAMPLE_PHARMACY_ITEMS);
        } else {
            callback(items);
        }
    });
};

// Pharmacy Item operations
export const addPharmacyItem = async (item: PharmacyItem): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    await setDoc(doc(db, COLLECTIONS.PHARMACY_ITEMS, item.id), item);
};

export const updatePharmacyItem = async (item: PharmacyItem): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    await setDoc(doc(db, COLLECTIONS.PHARMACY_ITEMS, item.id), item);
};

export const removePharmacyItem = async (itemId: string): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    await deleteDoc(doc(db, COLLECTIONS.PHARMACY_ITEMS, itemId));
};

export const getAllPharmacyItems = async (): Promise<PharmacyItem[]> => {
    if (!isFirebaseConfigured()) return SAMPLE_PHARMACY_ITEMS;

    const snapshot = await getDocs(collection(db, COLLECTIONS.PHARMACY_ITEMS));
    if (snapshot.empty) return SAMPLE_PHARMACY_ITEMS;
    return snapshot.docs.map(doc => doc.data() as PharmacyItem);
};

// Role Capacity operations
export const updateRoleCapacity = async (capacity: RoleCapacity): Promise<void> => {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured, cannot update role capacity:', capacity.roleId);
        return;
    }

    try {
        console.log('Writing role capacity to Firebase:', capacity.id);
        await setDoc(doc(db, COLLECTIONS.ROLE_CAPACITIES, capacity.id), capacity);
        console.log('Role capacity written successfully');
    } catch (error) {
        console.error('Error writing role capacity:', error);
        throw error;
    }
};

export const getAllRoleCapacities = async (): Promise<RoleCapacity[]> => {
    if (!isFirebaseConfigured()) return [];

    const snapshot = await getDocs(collection(db, COLLECTIONS.ROLE_CAPACITIES));
    return snapshot.docs.map(doc => doc.data() as RoleCapacity);
};

export const subscribeToRoleCapacities = (
    callback: (capacities: RoleCapacity[]) => void
): Unsubscribe | null => {
    if (!isFirebaseConfigured()) return null;

    return onSnapshot(collection(db, COLLECTIONS.ROLE_CAPACITIES), (snapshot) => {
        const capacities = snapshot.docs.map(doc => doc.data() as RoleCapacity);
        callback(capacities);
    });
};

// Load full state from Firebase
export const loadStateFromFirebase = async (): Promise<Partial<AppState>> => {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured, loading sample data');
        return {
            participants: SAMPLE_PARTICIPANTS,
            assignments: [],
            clinicDays: DEFAULT_CLINIC_DAYS,
            flowRates: DEFAULT_FLOW_RATES,
            shiftActuals: [],
            patientRecords: SAMPLE_PATIENT_RECORDS,
            pharmacyItems: SAMPLE_PHARMACY_ITEMS,
            roleCapacities: [],
            roles: ROLES,
            shifts: SHIFTS,
        };
    }

    try {
        const [participants, assignments, clinicDays, flowRates, shiftActuals, patientRecords, pharmacyItems, roleCapacities] = await Promise.all([
            getAllParticipants(),
            getAllAssignments(),
            getAllClinicDays(),
            getAllFlowRates(),
            getAllShiftActuals(),
            getAllPatientRecords(),
            getAllPharmacyItems(),
            getAllRoleCapacities(),
        ]);

        return {
            participants,
            assignments,
            clinicDays,
            flowRates,
            shiftActuals,
            patientRecords,
            pharmacyItems,
            roleCapacities,
            roles: ROLES,
            shifts: SHIFTS,
        };
    } catch (error) {
        console.error('Error loading state from Firebase:', error);
        // Fallback to sample data on error (e.g. invalid keys, network issue)
        console.warn('Falling back to sample data due to load error');
        return {
            participants: SAMPLE_PARTICIPANTS,
            assignments: [],
            clinicDays: DEFAULT_CLINIC_DAYS,
            flowRates: DEFAULT_FLOW_RATES,
            shiftActuals: [],
            patientRecords: SAMPLE_PATIENT_RECORDS,
            pharmacyItems: SAMPLE_PHARMACY_ITEMS,
            roleCapacities: [],
            roles: ROLES,
            shifts: SHIFTS,
        };
    }
};

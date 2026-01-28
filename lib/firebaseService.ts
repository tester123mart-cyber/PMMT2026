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
    Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { AppState, Participant, Assignment, ClinicDay, FlowRate, ShiftActuals, PatientRecord, PharmacyItem, RoleCapacity } from './types';
import { ROLES, SHIFTS, DEFAULT_CLINIC_DAYS, DEFAULT_FLOW_RATES, SAMPLE_PARTICIPANTS } from './data';
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
    if (!isFirebaseConfigured()) return;
    await setDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignment.id), assignment);
};

export const removeAssignment = async (assignmentId: string): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    await deleteDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId));
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
    if (!isFirebaseConfigured()) return;
    await setDoc(doc(db, COLLECTIONS.CLINIC_DAYS, clinicDay.id), clinicDay);
};

export const updateClinicDay = async (clinicDay: ClinicDay): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    await setDoc(doc(db, COLLECTIONS.CLINIC_DAYS, clinicDay.id), clinicDay);
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
    if (!isFirebaseConfigured()) return [];

    const snapshot = await getDocs(collection(db, COLLECTIONS.PATIENT_RECORDS));
    return snapshot.docs.map(doc => doc.data() as PatientRecord);
};

export const getPatientRecordsByClinicDay = async (clinicDayId: string): Promise<PatientRecord[]> => {
    if (!isFirebaseConfigured()) return [];

    const q = query(
        collection(db, COLLECTIONS.PATIENT_RECORDS),
        where('clinicDayId', '==', clinicDayId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as PatientRecord);
};

// Real-time listeners
export const subscribeToAssignments = (
    callback: (assignments: Assignment[]) => void
): Unsubscribe | null => {
    if (!isFirebaseConfigured()) return null;

    return onSnapshot(collection(db, COLLECTIONS.ASSIGNMENTS), (snapshot) => {
        const assignments = snapshot.docs.map(doc => doc.data() as Assignment);
        callback(assignments);
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
        callback(clinicDays);
    });
};

export const subscribeToPatientRecords = (
    callback: (records: PatientRecord[]) => void
): Unsubscribe | null => {
    if (!isFirebaseConfigured()) return null;

    return onSnapshot(collection(db, COLLECTIONS.PATIENT_RECORDS), (snapshot) => {
        const records = snapshot.docs.map(doc => doc.data() as PatientRecord);
        callback(records);
    });
};

export const subscribeToPharmacyItems = (
    callback: (items: PharmacyItem[]) => void
): Unsubscribe | null => {
    if (!isFirebaseConfigured()) return null;

    return onSnapshot(collection(db, COLLECTIONS.PHARMACY_ITEMS), (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data() as PharmacyItem);
        callback(items);
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
    if (!isFirebaseConfigured()) return [];

    const snapshot = await getDocs(collection(db, COLLECTIONS.PHARMACY_ITEMS));
    return snapshot.docs.map(doc => doc.data() as PharmacyItem);
};

// Role Capacity operations
export const updateRoleCapacity = async (capacity: RoleCapacity): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    await setDoc(doc(db, COLLECTIONS.ROLE_CAPACITIES, capacity.id), capacity);
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
        return {};
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
        return {};
    }
};

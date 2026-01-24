// PMMT Logistics App - Type Definitions

export type ShiftId = 'morning1' | 'morning2' | 'afternoon';

export interface Shift {
  id: ShiftId;
  name: string;
  startTime: string;
  endTime: string;
  durationHours: number;
}

export interface Role {
  id: string;
  name: string;
  category: 'clinical' | 'support';
  capacityPerShift: number;
  patientsPerHourPerStaff?: number; // Only for clinical roles that see patients
  icon: string; // Emoji for visual identification
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  primaryRole?: string;
  isAdmin?: boolean;
}

export interface ClinicDay {
  id: string;
  date: string; // ISO date string
  name: string;
  isActive: boolean; // Is this the current clinic day?
  patientTicketsIssued: number;
  actualPatientsServed?: number;
}

export interface Assignment {
  id: string;
  participantId: string;
  clinicDayId: string;
  shiftId: ShiftId;
  roleId: string;
  createdAt: string;
  attended?: boolean; // For live tracking
}

export interface FlowRate {
  roleId: string;
  patientsPerHourPerStaff: number;
  source: 'historical' | 'actual';
  clinicDayId?: string;
  updatedAt: string;
}

export interface ShiftActuals {
  id: string;
  clinicDayId: string;
  shiftId: ShiftId;
  roleId: string;
  patientsServed: number;
  staffCount: number;
  notes?: string;
  recordedAt: string;
}

export interface MedicationEntry {
  name: string;
  dose: string;
  frequency: string;
}

export interface PatientRecord {
  id: string;
  patientName: string;
  medications: MedicationEntry[];
  followUps: string;
  comments: string;
  createdAt: string; // ISO string for Firebase
  createdBy: {
    name: string;
    email: string;
  };
  clinicDayId: string; // Links record to a clinic day
}

export interface AppState {
  currentUser: Participant | null;
  participants: Participant[];
  clinicDays: ClinicDay[];
  assignments: Assignment[];
  roles: Role[];
  shifts: Shift[];
  flowRates: FlowRate[];
  shiftActuals: ShiftActuals[];
  patientRecords: PatientRecord[];
}

// Computed types
export interface RoleShiftStatus {
  roleId: string;
  shiftId: ShiftId;
  clinicDayId: string;
  currentCount: number;
  capacity: number;
  isFull: boolean;
  participants: Participant[];
}

export interface PatientCapacity {
  clinicDayId: string;
  shiftId: ShiftId;
  roleId: string;
  staffCount: number;
  flowRate: number;
  projectedPatients: number;
}

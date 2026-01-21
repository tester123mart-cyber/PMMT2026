// PMMT Logistics App - Seed Data

import { Role, Shift, ClinicDay, FlowRate, Participant } from './types';

export const SHIFTS: Shift[] = [
    {
        id: 'morning1',
        name: 'Morning Shift 1',
        startTime: '08:00',
        endTime: '10:30',
        durationHours: 2.5,
    },
    {
        id: 'morning2',
        name: 'Morning Shift 2',
        startTime: '11:00',
        endTime: '12:30',
        durationHours: 1.5,
    },
    {
        id: 'afternoon',
        name: 'Afternoon Shift',
        startTime: '14:00',
        endTime: '17:00',
        durationHours: 3,
    },
];

export const ROLES: Role[] = [
    // Clinical roles (patient-facing)
    {
        id: 'medical',
        name: 'Medical',
        category: 'clinical',
        capacityPerShift: 8,
        patientsPerHourPerStaff: 4,
        icon: '🩺',
    },
    {
        id: 'nursing',
        name: 'Nursing',
        category: 'clinical',
        capacityPerShift: 10,
        patientsPerHourPerStaff: 6,
        icon: '💉',
    },
    {
        id: 'optometry',
        name: 'Optometry',
        category: 'clinical',
        capacityPerShift: 4,
        patientsPerHourPerStaff: 3,
        icon: '👁️',
    },
    {
        id: 'dentistry',
        name: 'Dentistry',
        category: 'clinical',
        capacityPerShift: 4,
        patientsPerHourPerStaff: 2,
        icon: '🦷',
    },
    // Support roles
    {
        id: 'prayer',
        name: 'Prayer',
        category: 'support',
        capacityPerShift: 6,
        icon: '🙏',
    },
    {
        id: 'kids',
        name: 'Kids Ministry',
        category: 'support',
        capacityPerShift: 8,
        icon: '👶',
    },
    {
        id: 'sterilisation',
        name: 'Sterilisation',
        category: 'support',
        capacityPerShift: 4,
        icon: '🧼',
    },
    {
        id: 'logistics',
        name: 'Logistics',
        category: 'support',
        capacityPerShift: 6,
        icon: '📦',
    },
    {
        id: 'social-media',
        name: 'Social Media',
        category: 'support',
        capacityPerShift: 3,
        icon: '📱',
    },
    {
        id: 'finance',
        name: 'Finance',
        category: 'support',
        capacityPerShift: 2,
        icon: '💰',
    },
    {
        id: 'registration',
        name: 'Registration',
        category: 'support',
        capacityPerShift: 4,
        icon: '📋',
    },
    {
        id: 'pharmacy',
        name: 'Pharmacy',
        category: 'support',
        capacityPerShift: 4,
        icon: '💊',
    },
];

// Default clinic days (can be configured in admin)
export const DEFAULT_CLINIC_DAYS: ClinicDay[] = [
    {
        id: 'day-1',
        date: '2026-03-15',
        name: 'Clinic Day 1',
        isActive: false,
        patientTicketsIssued: 0,
    },
    {
        id: 'day-2',
        date: '2026-03-16',
        name: 'Clinic Day 2',
        isActive: false,
        patientTicketsIssued: 0,
    },
    {
        id: 'day-3',
        date: '2026-03-17',
        name: 'Clinic Day 3',
        isActive: false,
        patientTicketsIssued: 0,
    },
    {
        id: 'day-4',
        date: '2026-03-18',
        name: 'Clinic Day 4',
        isActive: false,
        patientTicketsIssued: 0,
    },
    {
        id: 'day-5',
        date: '2026-03-19',
        name: 'Clinic Day 5',
        isActive: false,
        patientTicketsIssued: 0,
    },
];

// Historical flow rates from previous missions
export const DEFAULT_FLOW_RATES: FlowRate[] = [
    {
        roleId: 'medical',
        patientsPerHourPerStaff: 4,
        source: 'historical',
        updatedAt: new Date().toISOString(),
    },
    {
        roleId: 'optometry',
        patientsPerHourPerStaff: 3,
        source: 'historical',
        updatedAt: new Date().toISOString(),
    },
    {
        roleId: 'dentistry',
        patientsPerHourPerStaff: 2,
        source: 'historical',
        updatedAt: new Date().toISOString(),
    },
    {
        roleId: 'nursing',
        patientsPerHourPerStaff: 6,
        source: 'historical',
        updatedAt: new Date().toISOString(),
    },
];

// Sample participants for testing
export const SAMPLE_PARTICIPANTS: Participant[] = [
    {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@pmmt.org',
        primaryRole: 'logistics',
        isAdmin: true,
    },
];

// Helper to get clinical roles (for capacity calculations)
export const getClinicalRoles = () => ROLES.filter(r => r.category === 'clinical');

// Helper to get role by ID
export const getRoleById = (roleId: string) => ROLES.find(r => r.id === roleId);

// Helper to get shift by ID
export const getShiftById = (shiftId: string) => SHIFTS.find(s => s.id === shiftId);

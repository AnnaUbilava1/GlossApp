// Car Types - Hardcoded as per specs
export const CAR_TYPES = [
  'Sedan',
  'Jeep',
  'Big Jeep',
  'Premium',
  'Hatchback',
  'Minivan',
  'Truck',
] as const;

// Service Types - Hardcoded as per specs
export const SERVICE_TYPES = [
  'Complete Wash',
  'Outer Wash',
  'Interior Wash',
  'Engine Wash',
  'Chemical Wash',
] as const;

// Status Colors for records
export const STATUS_COLORS = {
  UNFINISHED_UNPAID: '#FFCDD2', // Red
  FINISHED_UNPAID: '#FFE0B2',   // Orange
  FINISHED_PAID: '#C8E6C9',     // Green
} as const;

// Helper function to get status color
export function getStatusColor(isFinished: boolean, isPaid: boolean): string {
  if (!isFinished && !isPaid) {
    return STATUS_COLORS.UNFINISHED_UNPAID;
  } else if (isFinished && !isPaid) {
    return STATUS_COLORS.FINISHED_UNPAID;
  } else if (isFinished && isPaid) {
    return STATUS_COLORS.FINISHED_PAID;
  }
  return STATUS_COLORS.UNFINISHED_UNPAID;
}

// Helper function to get status label
export function getStatusLabel(isFinished: boolean, isPaid: boolean): string {
  if (!isFinished && !isPaid) {
    return 'In Progress';
  } else if (isFinished && !isPaid) {
    return 'Ready for Payment';
  } else if (isFinished && isPaid) {
    return 'Completed';
  }
  return 'In Progress';
}

// Master PIN for admin edit/delete operations
export const MASTER_PIN = '1234';

// Physical Person category (hardcoded)
export const PHYSICAL_PERSON_CATEGORY = 'Physical Person';


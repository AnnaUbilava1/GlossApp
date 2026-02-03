import type { Locale } from "../i18n/translations";

// Car Types - Hardcoded as per specs (values must remain stable for backend mappings)
export const CAR_TYPES = [
  "Sedan",
  "Jeep",
  "Big Jeep",
  "Premium",
  "Hatchback",
  "Minivan",
  "Truck",
] as const;

// Service Types - Hardcoded as per specs (values must remain stable for backend mappings)
export const SERVICE_TYPES = [
  "Complete Wash",
  "Outer Wash",
  "Interior Wash",
  "Engine Wash",
  "Chemical Wash",
] as const;

export type CarTypeValue = (typeof CAR_TYPES)[number];
export type ServiceTypeValue = (typeof SERVICE_TYPES)[number];

// Localized labels for car types and wash types (frontend only)
const CAR_TYPE_LABELS: Record<Locale, Record<string, string>> = {
  ka: {
    Sedan: "სედანი",
    Jeep: "ჯიპი",
    "Big Jeep": "დიდი ჯიპი",
    Premium: "პრემიუმ კლასი",
    Hatchback: "ჰეჩბეკი",
    Minivan: "მინივენი",
    Truck: "სატვირთო",
  },
  en: {
    Sedan: "Sedan",
    Jeep: "Jeep",
    "Big Jeep": "Big Jeep",
    Premium: "Premium",
    Hatchback: "Hatchback",
    Minivan: "Minivan",
    Truck: "Truck",
  },
};

const SERVICE_TYPE_LABELS: Record<Locale, Record<string, string>> = {
  ka: {
    "Complete Wash": "სრული რეცხვა",
    "Outer Wash": "გარე რეცხვა",
    "Interior Wash": "სალონის რეცხვა",
    "Engine Wash": "ძრავის რეცხვა",
    "Chemical Wash": "ქიმიური რეცხვა",
  },
  en: {
    "Complete Wash": "Complete Wash",
    "Outer Wash": "Outer Wash",
    "Interior Wash": "Interior Wash",
    "Engine Wash": "Engine Wash",
    "Chemical Wash": "Chemical Wash",
  },
};

export function getCarTypeLabel(value: string, locale: Locale): string {
  const lang = locale === "en" ? "en" : "ka";
  return CAR_TYPE_LABELS[lang][value] ?? value;
}

export function getServiceTypeLabel(value: string, locale: Locale): string {
  const lang = locale === "en" ? "en" : "ka";
  return SERVICE_TYPE_LABELS[lang][value] ?? value;
}

// Status Colors for records
export const STATUS_COLORS = {
  UNFINISHED_UNPAID: "#FFCDD2", // Red
  FINISHED_UNPAID: "#FFE0B2", // Orange
  FINISHED_PAID: "#C8E6C9", // Green
} as const;

// Helper function to get status color
export function getStatusColor(isFinished: boolean, isPaid: boolean): string {
  // Red: neither paid nor finished
  if (!isFinished && !isPaid) {
    return STATUS_COLORS.UNFINISHED_UNPAID;
  }
  // Orange: either paid OR finished (but not both)
  if ((isFinished && !isPaid) || (!isFinished && isPaid)) {
    return STATUS_COLORS.FINISHED_UNPAID;
  }
  // Green: both paid AND finished
  if (isFinished && isPaid) {
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

// Currency: Georgian Lari
export const CURRENCY_SYMBOL = '₾';

/** Format a number as money with Georgian Lari symbol */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${CURRENCY_SYMBOL}${value.toFixed(2)}`;
}


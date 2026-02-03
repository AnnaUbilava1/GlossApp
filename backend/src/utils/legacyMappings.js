export const LEGACY_CAR_TYPE_TO_SCHEMA = {
  Sedan: 'SEDAN',
  Hatchback: 'SEDAN',
  Premium: 'PREMIUM_CLASS',
  Jeep: 'SMALL_JEEP',
  'Big Jeep': 'BIG_JEEP',
  Minivan: 'MICROBUS',
  Truck: 'BIG_JEEP',
};

export const LEGACY_SERVICE_TYPE_TO_SCHEMA = {
  'Complete Wash': 'COMPLETE',
  'Outer Wash': 'OUTER',
  'Interior Wash': 'INNER',
  'Interior Cleaning': 'INNER', // Keep for backward compatibility
  'Engine Wash': 'ENGINE',
  'Chemical Wash': 'CHEMICAL',
};

export const SCHEMA_CAR_TYPE_TO_LEGACY = {
  SEDAN: 'Sedan',
  PREMIUM_CLASS: 'Premium',
  SMALL_JEEP: 'Jeep',
  BIG_JEEP: 'Big Jeep',
  MICROBUS: 'Minivan',
};

export const SCHEMA_WASH_TYPE_TO_LEGACY = {
  COMPLETE: 'Complete Wash',
  OUTER: 'Outer Wash',
  INNER: 'Interior Wash',
  ENGINE: 'Engine Wash',
  CHEMICAL: 'Chemical Wash',
  CUSTOM: 'Custom Service', 
};

// ---------------------------------------------------------------------------
// Localized labels for car types and wash types
// These are used when returning data to the frontend so that enum codes
// from the database can be shown in the requested language.
// ---------------------------------------------------------------------------

export const CAR_TYPE_LABELS = {
  ka: {
    SEDAN: 'სედანი',
    PREMIUM_CLASS: 'პრემიუმ კლასი',
    SMALL_JEEP: 'ჯიპი',
    BIG_JEEP: 'დიდი ჯიპი',
    MICROBUS: 'მინივენი',
  },
  en: {
    SEDAN: 'Sedan',
    PREMIUM_CLASS: 'Premium',
    SMALL_JEEP: 'Jeep',
    BIG_JEEP: 'Big Jeep',
    MICROBUS: 'Minivan',
  },
};

export const WASH_TYPE_LABELS = {
  ka: {
    COMPLETE: 'სრული რეცხვა',
    OUTER: 'გარე რეცხვა',
    INNER: 'სალონის რეცხვა',
    ENGINE: 'ძრავის რეცხვა',
    CHEMICAL: 'ქიმიური რეცხვა',
    CUSTOM: 'სხვა სერვისი',
  },
  en: {
    COMPLETE: 'Complete Wash',
    OUTER: 'Outer Wash',
    INNER: 'Interior Wash',
    ENGINE: 'Engine Wash',
    CHEMICAL: 'Chemical Wash',
    CUSTOM: 'Custom Service',
  },
};

export function getCarTypeLabel(carCategory, lang = 'ka') {
  const safeLang = lang === 'en' ? 'en' : 'ka';
  return (
    CAR_TYPE_LABELS[safeLang]?.[carCategory] ||
    CAR_TYPE_LABELS.ka[carCategory] ||
    carCategory
  );
}

export function getWashTypeLabel(washType, lang = 'ka') {
  const safeLang = lang === 'en' ? 'en' : 'ka';
  return (
    WASH_TYPE_LABELS[safeLang]?.[washType] ||
    WASH_TYPE_LABELS.ka[washType] ||
    washType
  );
}





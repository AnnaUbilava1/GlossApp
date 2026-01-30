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
};



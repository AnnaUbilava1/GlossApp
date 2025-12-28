export type UserRole = 'admin' | 'staff';

export type CarType = typeof import('./constants').CAR_TYPES[number];
export type ServiceType = typeof import('./constants').SERVICE_TYPES[number];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface Vehicle {
  id?: string;
  licenseNumber: string;
  carType: CarType;
  companyId?: string;
  color?: string;
  owner?: string;
}

export interface Company {
  id?: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  defaultDiscount: number;
  allowedDiscounts: number[];
}

export interface WashRecord {
  id?: string;
  licenseNumber: string;
  carType: CarType;
  serviceType: ServiceType;
  companyDiscount?: string; // e.g., "company1 30%" or "physical person 30%"
  discountPercent: number;
  price: number;
  boxNumber: number;
  washerName: string;
  startTime: Date | string;
  endTime?: Date | string | null;
  isFinished: boolean;
  isPaid: boolean;
  paymentMethod?: 'cash' | 'card';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface PricingMatrix {
  [carType: string]: {
    [serviceType: string]: number;
  };
}

export interface Washer {
  id?: string;
  name: string;
}


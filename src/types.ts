export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';
export type VehicleType = 'Heavy Truck' | 'Light Van' | 'Bus' | 'Cargo Car';

export interface Vehicle {
  id: string;
  registrationNumber: string; // Must be unique
  name: string;
  type: VehicleType;
  maxLoadCapacity: number; // in kg
  odometer: number; // in km
  acquisitionCost: number; // in USD
  status: VehicleStatus;
  region: string;
  createdAt: string;
}

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
export type LicenseCategory = 'Class A CDL' | 'Class B CDL' | 'Class C' | 'Motorcycle';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string; // Must be unique
  licenseCategory: LicenseCategory;
  licenseExpiryDate: string; // YYYY-MM-DD
  contactNumber: string;
  safetyScore: number; // 0-100
  status: DriverStatus;
  createdAt: string;
}

export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number; // kg, must be <= vehicle's maxLoadCapacity
  plannedDistance: number; // km
  actualDistance?: number; // km (entered on completion)
  fuelConsumed?: number; // liters (entered on completion)
  revenue: number; // USD
  status: TripStatus;
  createdAt: string;
  dispatchedAt?: string;
  completedAt?: string;
}

export type MaintenanceType = 'Oil Change' | 'Tire Replacement' | 'Brake Service' | 'Engine Repair' | 'Routine Inspection';
export type MaintenanceStatus = 'Open' | 'Closed';

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  cost: number; // USD
  status: MaintenanceStatus;
  createdAt: string;
  closedAt?: string;
  previousVehicleStatus?: VehicleStatus;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number; // USD
  odometer: number; // km
  date: string; // YYYY-MM-DD
}

export type ExpenseCategory = 'Tolls' | 'Maintenance' | 'Fuel' | 'Insurance' | 'Parking' | 'Other';

export interface Expense {
  id: string;
  vehicleId: string;
  category: ExpenseCategory;
  amount: number; // USD
  description: string;
  date: string; // YYYY-MM-DD
}

export type UserRole = 'Fleet Manager' | 'Driver' | 'Safety Officer' | 'Financial Analyst';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  pinRequiredForActions?: boolean;
}

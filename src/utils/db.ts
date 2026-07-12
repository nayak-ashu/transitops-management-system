import { 
  Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, User, UserRole,
  VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus, VehicleType, LicenseCategory, ExpenseCategory, MaintenanceType
} from '../types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Default Seed Data
const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    registrationNumber: 'VAN-05',
    name: 'Ford Transit Cargo Van',
    type: 'Light Van',
    maxLoadCapacity: 500, // 500 kg
    odometer: 12450,
    acquisitionCost: 35000,
    status: 'Available',
    region: 'North Northwest',
    createdAt: '2025-10-01T08:00:00Z',
  },
  {
    id: 'v2',
    registrationNumber: 'TRK-101',
    name: 'Volvo VNL 860 Semi',
    type: 'Heavy Truck',
    maxLoadCapacity: 18000,
    odometer: 245300,
    acquisitionCost: 145000,
    status: 'Available',
    region: 'Midwest Corridor',
    createdAt: '2024-03-15T09:00:00Z',
  },
  {
    id: 'v3',
    registrationNumber: 'BOX-22',
    name: 'Isuzu NPR Box Truck',
    type: 'Cargo Car',
    maxLoadCapacity: 3500,
    odometer: 64120,
    acquisitionCost: 55000,
    status: 'On Trip',
    region: 'South Region',
    createdAt: '2025-01-10T10:30:00Z',
  },
  {
    id: 'v4',
    registrationNumber: 'BUS-07',
    name: 'Chevrolet Express Shuttler',
    type: 'Bus',
    maxLoadCapacity: 1200,
    odometer: 48900,
    acquisitionCost: 45000,
    status: 'In Shop',
    region: 'East Coast',
    createdAt: '2025-05-20T14:15:00Z',
  }
];

const DEFAULT_DRIVERS: Driver[] = [
  {
    id: 'd1',
    name: 'Alex Mercer',
    licenseNumber: 'DL-99420-A',
    licenseCategory: 'Class B CDL',
    licenseExpiryDate: '2028-11-15',
    contactNumber: '+1 (555) 321-4567',
    safetyScore: 95,
    status: 'Available',
    createdAt: '2025-10-01T08:30:00Z',
  },
  {
    id: 'd2',
    name: 'Sarah Jenkins',
    licenseNumber: 'DL-11029-Y',
    licenseCategory: 'Class A CDL',
    licenseExpiryDate: '2029-04-10',
    contactNumber: '+1 (555) 789-1021',
    safetyScore: 98,
    status: 'Available',
    createdAt: '2024-04-01T08:00:00Z',
  },
  {
    id: 'd3',
    name: 'Marcus Vance',
    licenseNumber: 'DL-55281-B',
    licenseCategory: 'Class A CDL',
    licenseExpiryDate: '2027-02-28',
    contactNumber: '+1 (555) 456-7890',
    safetyScore: 88,
    status: 'On Trip',
    createdAt: '2025-01-12T09:15:00Z',
  },
  {
    id: 'd4',
    name: 'David Miller (Expired)',
    licenseNumber: 'DL-77312-C',
    licenseCategory: 'Class C',
    licenseExpiryDate: '2024-05-12', // Expired Driving License
    contactNumber: '+1 (555) 654-3210',
    safetyScore: 72,
    status: 'Off Duty',
    createdAt: '2023-08-15T11:00:00Z',
  },
  {
    id: 'd5',
    name: 'Elena Rostova (Suspended)',
    licenseNumber: 'DL-30219-X',
    licenseCategory: 'Class B CDL',
    licenseExpiryDate: '2028-09-01',
    contactNumber: '+1 (555) 987-6543',
    safetyScore: 45, // Bad safety score
    status: 'Suspended',
    createdAt: '2025-03-22T13:40:00Z',
  }
];

const DEFAULT_TRIPS: Trip[] = [
  {
    id: 't1',
    source: 'Seattle Hub',
    destination: 'Portland Warehouse',
    vehicleId: 'v1', // VAN-05
    driverId: 'd1', // Alex
    cargoWeight: 450, // fits in Van-05 (max 500kg)
    plannedDistance: 280,
    actualDistance: 280,
    fuelConsumed: 28, // 10L / 100km
    revenue: 950,
    status: 'Completed',
    createdAt: '2026-07-01T08:00:00Z',
    dispatchedAt: '2026-07-01T09:00:00Z',
    completedAt: '2026-07-01T14:30:00Z',
  },
  {
    id: 't2',
    source: 'Chicago Rail Yard',
    destination: 'St. Louis Depot',
    vehicleId: 'v3', // BOX-22
    driverId: 'd3', // Marcus
    cargoWeight: 3100, // fits in BOX-22 (max 3500kg)
    plannedDistance: 480,
    revenue: 2400,
    status: 'Dispatched',
    createdAt: '2026-07-10T10:00:00Z',
    dispatchedAt: '2026-07-11T06:00:00Z',
  },
  {
    id: 't3',
    source: 'Detroit Assembly Plant',
    destination: 'Cleveland Hub',
    vehicleId: 'v2', // TRK-101
    driverId: 'd2', // Sarah
    cargoWeight: 12000,
    plannedDistance: 270,
    revenue: 1800,
    status: 'Draft',
    createdAt: '2026-07-11T12:00:00Z',
  }
];

const DEFAULT_MAINTENANCE_LOGS: MaintenanceLog[] = [
  {
    id: 'm1',
    vehicleId: 'v4', // BUS-07 (status In Shop)
    type: 'Brake Service',
    description: 'Replace front and rear pads, turn rotors.',
    cost: 750,
    status: 'Open',
    createdAt: '2026-07-09T08:30:00Z',
  },
  {
    id: 'm2',
    vehicleId: 'v1', // VAN-05
    type: 'Oil Change',
    description: 'Full synthetic oil change and filter replacement.',
    cost: 120,
    status: 'Closed',
    createdAt: '2026-06-15T09:00:00Z',
    closedAt: '2026-06-15T11:30:00Z',
  }
];

const DEFAULT_FUEL_LOGS: FuelLog[] = [
  {
    id: 'f1',
    vehicleId: 'v1',
    liters: 28,
    cost: 45.50,
    odometer: 12180,
    date: '2026-07-01',
  },
  {
    id: 'f2',
    vehicleId: 'v2',
    liters: 320,
    cost: 512.00,
    odometer: 245050,
    date: '2026-07-05',
  }
];

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'e1',
    vehicleId: 'v1',
    category: 'Tolls',
    amount: 32.40,
    description: 'I-5 South express tollways',
    date: '2026-07-01',
  },
  {
    id: 'e2',
    vehicleId: 'v2',
    category: 'Insurance',
    amount: 1200.00,
    description: 'Monthly commercial fleet premium share',
    date: '2026-07-01',
  }
];

// Seed Users
const DEFAULT_USERS: User[] = [
  { id: 'u1', email: 'manager@transitops.com', name: 'John Fleetwood', role: 'Fleet Manager', password: 'password123' },
  { id: 'u2', email: 'driver@transitops.com', name: 'Alex Mercer', role: 'Driver', password: 'password123' },
  { id: 'u3', email: 'safety@transitops.com', name: 'Officer Safety', role: 'Safety Officer', password: 'password123' },
  { id: 'u4', email: 'analyst@transitops.com', name: 'Penny Ledger', role: 'Financial Analyst', password: 'password123' }
];

// LocalStorage Keys
const KEYS = {
  VEHICLES: 'transitops_vehicles',
  DRIVERS: 'transitops_drivers',
  TRIPS: 'transitops_trips',
  MAINTENANCE: 'transitops_maintenance',
  FUEL_LOGS: 'transitops_fuel_logs',
  EXPENSES: 'transitops_expenses',
  USERS: 'transitops_users',
  CURRENT_USER: 'transitops_current_user',
};

// Initialize Database Function
export const initDb = () => {
  if (!localStorage.getItem(KEYS.VEHICLES)) {
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(DEFAULT_VEHICLES));
  }
  if (!localStorage.getItem(KEYS.DRIVERS)) {
    localStorage.setItem(KEYS.DRIVERS, JSON.stringify(DEFAULT_DRIVERS));
  }
  if (!localStorage.getItem(KEYS.TRIPS)) {
    localStorage.setItem(KEYS.TRIPS, JSON.stringify(DEFAULT_TRIPS));
  }
  if (!localStorage.getItem(KEYS.MAINTENANCE)) {
    localStorage.setItem(KEYS.MAINTENANCE, JSON.stringify(DEFAULT_MAINTENANCE_LOGS));
  }
  if (!localStorage.getItem(KEYS.FUEL_LOGS)) {
    localStorage.setItem(KEYS.FUEL_LOGS, JSON.stringify(DEFAULT_FUEL_LOGS));
  }
  if (!localStorage.getItem(KEYS.EXPENSES)) {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(DEFAULT_EXPENSES));
  }
  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
};

// Generic storage accessors
const getItems = <T>(key: string): T[] => {
  initDb();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
};

const setItems = <T>(key: string, items: T[]) => {
  localStorage.setItem(key, JSON.stringify(items));
};

// --- AUTHENTICATION APIS ---
export const getActiveUser = (): User | null => {
  const raw = localStorage.getItem(KEYS.CURRENT_USER);
  return raw ? JSON.parse(raw) : null;
};

export const setActiveUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
};

export const login = (email: string, passwordInput: string): User | null => {
  const users = getItems<User>(KEYS.USERS);
  const normalizedEmail = email.trim().toLowerCase();
  
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    throw new Error('No account found with this email.');
  }

  const correctPassword = user.password || 'password123';
  if (passwordInput !== correctPassword) {
    throw new Error('Incorrect password.');
  }

  setActiveUser(user);
  return user;
};

export const registerUser = (name: string, email: string, passwordInput: string, role: UserRole): User => {
  const users = getItems<User>(KEYS.USERS);
  const normalizedEmail = email.trim().toLowerCase();
  const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error('Account already exists with this email');
  }
  const newUser: User = { 
    id: generateId(), 
    name, 
    email: email.trim(), 
    role, 
    password: passwordInput,
    pinRequiredForActions: false
  };
  users.push(newUser);
  setItems(KEYS.USERS, users);
  setActiveUser(newUser);
  return newUser;
};

export const updateUserSecurity = (userId: string, updates: { password?: string; pinRequiredForActions?: boolean }): User => {
  const users = getItems<User>(KEYS.USERS);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) {
    throw new Error('User session not found.');
  }
  const updatedUser = {
    ...users[idx],
    ...updates
  };
  users[idx] = updatedUser;
  setItems(KEYS.USERS, users);
  
  // also update active current user
  const active = getActiveUser();
  if (active && active.id === userId) {
    setActiveUser(updatedUser);
  }
  return updatedUser;
};

// --- VEHICLE APIS ---
export const getVehicles = (): Vehicle[] => getItems<Vehicle>(KEYS.VEHICLES);

export const saveVehicle = (vehicle: Omit<Vehicle, 'id' | 'createdAt'> & { id?: string }): Vehicle => {
  const vehicles = getVehicles();
  const plate = vehicle.registrationNumber.toUpperCase().trim();

  // Validate plate uniqueness
  const duplicate = vehicles.find(v => v.registrationNumber.toUpperCase() === plate && v.id !== vehicle.id);
  if (duplicate) {
    throw new Error(`Vehicle registration number '${plate}' already exists. Must be unique.`);
  }

  if (vehicle.id) {
    // Edit existing
    const idx = vehicles.findIndex(v => v.id === vehicle.id);
    if (idx === -1) throw new Error('Vehicle not found.');
    const updated: Vehicle = {
      ...vehicles[idx],
      ...vehicle,
      registrationNumber: plate,
    };
    vehicles[idx] = updated;
    setItems(KEYS.VEHICLES, vehicles);
    return updated;
  } else {
    // Create new
    const created: Vehicle = {
      id: generateId(),
      ...vehicle,
      registrationNumber: plate,
      createdAt: new Date().toISOString()
    };
    vehicles.push(created);
    setItems(KEYS.VEHICLES, vehicles);
    return created;
  }
};

export const deleteVehicle = (id: string) => {
  const vehicles = getVehicles();
  // Check if assigned to any dispatched/draft trips
  const trips = getTrips();
  const activeTrip = trips.find(t => t.vehicleId === id && (t.status === 'Dispatched' || t.status === 'Draft'));
  if (activeTrip) {
    throw new Error('Cannot delete this vehicle. It is currently assigned to an active or pending trip.');
  }
  const filtered = vehicles.filter(v => v.id !== id);
  setItems(KEYS.VEHICLES, filtered);
};

// --- DRIVER APIS ---
export const getDrivers = (): Driver[] => getItems<Driver>(KEYS.DRIVERS);

export const saveDriver = (driver: Omit<Driver, 'id' | 'createdAt'> & { id?: string }): Driver => {
  const drivers = getDrivers();
  const dLic = driver.licenseNumber.toUpperCase().trim();

  // Validate license uniqueness
  const duplicate = drivers.find(d => d.licenseNumber.toUpperCase() === dLic && d.id !== driver.id);
  if (duplicate) {
    throw new Error(`Driver license number '${dLic}' is already registered. Must be unique.`);
  }

  if (driver.id) {
    // Edit existing
    const idx = drivers.findIndex(d => d.id === driver.id);
    if (idx === -1) throw new Error('Driver not found.');
    const updated: Driver = {
      ...drivers[idx],
      ...driver,
      licenseNumber: dLic,
    };
    drivers[idx] = updated;
    setItems(KEYS.DRIVERS, drivers);
    return updated;
  } else {
    // Create new
    const created: Driver = {
      id: generateId(),
      ...driver,
      licenseNumber: dLic,
      createdAt: new Date().toISOString()
    };
    drivers.push(created);
    setItems(KEYS.DRIVERS, drivers);
    return created;
  }
};

export const deleteDriver = (id: string) => {
  const drivers = getDrivers();
  const trips = getTrips();
  const activeTrip = trips.find(t => t.driverId === id && (t.status === 'Dispatched' || t.status === 'Draft'));
  if (activeTrip) {
    throw new Error('Cannot delete this driver. They are currently assigned to an active or pending trip.');
  }
  const filtered = drivers.filter(d => d.id !== id);
  setItems(KEYS.DRIVERS, filtered);
};

// --- TRIP APIS ---
export const getTrips = (): Trip[] => getItems<Trip>(KEYS.TRIPS);

export const createTrip = (trip: Omit<Trip, 'id' | 'status' | 'createdAt'>): Trip => {
  // Validate business rules
  const vehicle = getVehicles().find(v => v.id === trip.vehicleId);
  const driver = getDrivers().find(d => d.id === trip.driverId);

  if (!vehicle) throw new Error('Selected vehicle not found.');
  if (!driver) throw new Error('Selected driver not found.');

  // Validate 1: Retired or In Shop vehicle
  if (vehicle.status === 'Retired') throw new Error('This vehicle has been retired and cannot be dispatched.');
  if (vehicle.status === 'In Shop') throw new Error('This vehicle is currently undergoing maintenance in shop and cannot be dispatched.');

  // Validate 2: Driver license expired or suspended
  const isLicenseExpired = new Date(driver.licenseExpiryDate) < new Date();
  if (isLicenseExpired) throw new Error(`Driver '${driver.name}' has an expired license (Expiry: ${driver.licenseExpiryDate}) and cannot be assigned to trips.`);
  if (driver.status === 'Suspended') throw new Error(`Driver '${driver.name}' is currently suspended and cannot be assigned to trips.`);

  // Validate 3: Cargo weight exceeds capacity
  if (trip.cargoWeight > vehicle.maxLoadCapacity) {
    throw new Error(`Cargo Weight (${trip.cargoWeight} kg) exceeds Vehicle's Maximum Load Capacity (${vehicle.maxLoadCapacity} kg).`);
  }

  // Validate 4: Driver or vehicle already on trip
  if (vehicle.status === 'On Trip') throw new Error(`Vehicle '${vehicle.registrationNumber}' is currently On Trip.`);
  if (driver.status === 'On Trip') throw new Error(`Driver '${driver.name}' is currently On Trip.`);

  const trips = getTrips();
  const created: Trip = {
    id: generateId(),
    ...trip,
    status: 'Draft',
    createdAt: new Date().toISOString()
  };
  trips.push(created);
  setItems(KEYS.TRIPS, trips);
  return created;
};

export const dispatchTrip = (tripId: string) => {
  const trips = getTrips();
  const tripIdx = trips.findIndex(t => t.id === tripId);
  if (tripIdx === -1) throw new Error('Trip not found.');
  const trip = trips[tripIdx];

  if (trip.status !== 'Draft') throw new Error('Only draft trips can be dispatched.');

  const vehicles = getVehicles();
  const drivers = getDrivers();
  const vehicleIdx = vehicles.findIndex(v => v.id === trip.vehicleId);
  const driverIdx = drivers.findIndex(d => d.id === trip.driverId);

  if (vehicleIdx === -1) throw new Error('Assigned vehicle not found.');
  if (driverIdx === -1) throw new Error('Assigned driver not found.');

  const vehicle = vehicles[vehicleIdx];
  const driver = drivers[driverIdx];

  // Re-verify availability
  if (vehicle.status !== 'Available') throw new Error(`Vehicle '${vehicle.registrationNumber}' is not Available (${vehicle.status}).`);
  if (driver.status !== 'Available') throw new Error(`Driver '${driver.name}' is not Available (${driver.status}).`);

  // Expired license check
  if (new Date(driver.licenseExpiryDate) < new Date()) throw new Error('Driver driving license is expired.');

  // Update statuses
  vehicles[vehicleIdx].status = 'On Trip';
  drivers[driverIdx].status = 'On Trip';

  trip.status = 'Dispatched';
  trip.dispatchedAt = new Date().toISOString();

  setItems(KEYS.VEHICLES, vehicles);
  setItems(KEYS.DRIVERS, drivers);
  setItems(KEYS.TRIPS, trips);
};

export const completeTrip = (tripId: string, actualDistance: number, fuelConsumed: number) => {
  const trips = getTrips();
  const tripIdx = trips.findIndex(t => t.id === tripId);
  if (tripIdx === -1) throw new Error('Trip not found.');
  const trip = trips[tripIdx];

  if (trip.status !== 'Dispatched') throw new Error('Only dispatched trips can be completed.');

  const vehicles = getVehicles();
  const drivers = getDrivers();
  const vehicleIdx = vehicles.findIndex(v => v.id === trip.vehicleId);
  const driverIdx = drivers.findIndex(d => d.id === trip.driverId);

  if (vehicleIdx === -1) throw new Error('Assigned vehicle not found.');
  if (driverIdx === -1) throw new Error('Assigned driver not found.');

  // Auto transition back to Available
  vehicles[vehicleIdx].status = 'Available';
  drivers[driverIdx].status = 'Available';

  // Update Odometer
  const oldOdo = vehicles[vehicleIdx].odometer;
  vehicles[vehicleIdx].odometer += actualDistance;

  // Update Trip
  trip.status = 'Completed';
  trip.actualDistance = actualDistance;
  trip.fuelConsumed = fuelConsumed;
  trip.completedAt = new Date().toISOString();

  // Automatically record a Fuel Log
  const fuelCost = fuelConsumed * 1.65; // Simulated cost per liter
  const fuelLogs = getItems<FuelLog>(KEYS.FUEL_LOGS);
  fuelLogs.push({
    id: generateId(),
    vehicleId: trip.vehicleId,
    liters: fuelConsumed,
    cost: Number(fuelCost.toFixed(2)),
    odometer: vehicles[vehicleIdx].odometer,
    date: new Date().toISOString().split('T')[0]
  });

  // Automatically record a corresponding Fuel Expense
  const expenses = getItems<Expense>(KEYS.EXPENSES);
  expenses.push({
    id: generateId(),
    vehicleId: trip.vehicleId,
    category: 'Fuel',
    amount: Number(fuelCost.toFixed(2)),
    description: `Trip completion fuel record. Odometer: ${oldOdo} -> ${vehicles[vehicleIdx].odometer} km.`,
    date: new Date().toISOString().split('T')[0]
  });

  setItems(KEYS.VEHICLES, vehicles);
  setItems(KEYS.DRIVERS, drivers);
  setItems(KEYS.TRIPS, trips);
  setItems(KEYS.FUEL_LOGS, fuelLogs);
  setItems(KEYS.EXPENSES, expenses);
};

export const cancelTrip = (tripId: string) => {
  const trips = getTrips();
  const tripIdx = trips.findIndex(t => t.id === tripId);
  if (tripIdx === -1) throw new Error('Trip not found.');
  const trip = trips[tripIdx];

  if (trip.status === 'Completed') throw new Error('Completed trips cannot be cancelled.');

  const vehicles = getVehicles();
  const drivers = getDrivers();
  const vehicleIdx = vehicles.findIndex(v => v.id === trip.vehicleId);
  const driverIdx = drivers.findIndex(d => d.id === trip.driverId);

  // If already Dispatched, restore vehicle and driver to Available
  if (trip.status === 'Dispatched') {
    if (vehicleIdx !== -1 && vehicles[vehicleIdx].status === 'On Trip') {
      vehicles[vehicleIdx].status = 'Available';
    }
    if (driverIdx !== -1 && drivers[driverIdx].status === 'On Trip') {
      drivers[driverIdx].status = 'Available';
    }
  }

  trip.status = 'Cancelled';

  setItems(KEYS.VEHICLES, vehicles);
  setItems(KEYS.DRIVERS, drivers);
  setItems(KEYS.TRIPS, trips);
};

// --- MAINTENANCE APIS ---
export const getMaintenanceLogs = (): MaintenanceLog[] => getItems<MaintenanceLog>(KEYS.MAINTENANCE);

export const createMaintenanceLog = (log: Omit<MaintenanceLog, 'id' | 'status' | 'createdAt' | 'previousVehicleStatus'>): MaintenanceLog => {
  const vehicles = getVehicles();
  const vehicleIdx = vehicles.findIndex(v => v.id === log.vehicleId);
  if (vehicleIdx === -1) throw new Error('Vehicle not found.');

  const vehicle = vehicles[vehicleIdx];
  if (vehicle.status === 'On Trip') {
    throw new Error('Vehicle is currently active on trip and cannot enter maintenance yet.');
  }

  // Preserve previous status
  const prevStatus = vehicle.status;

  // Auto set status to In Shop
  vehicles[vehicleIdx].status = 'In Shop';

  const logs = getMaintenanceLogs();
  const created: MaintenanceLog = {
    id: generateId(),
    ...log,
    status: 'Open',
    previousVehicleStatus: prevStatus,
    createdAt: new Date().toISOString()
  };
  logs.push(created);

  setItems(KEYS.VEHICLES, vehicles);
  setItems(KEYS.MAINTENANCE, logs);
  return created;
};

export const closeMaintenanceLog = (logId: string) => {
  const logs = getMaintenanceLogs();
  const idx = logs.findIndex(l => l.id === logId);
  if (idx === -1) throw new Error('Maintenance record not found.');
  const log = logs[idx];

  if (log.status === 'Closed') throw new Error('Maintenance log is already closed.');

  const vehicles = getVehicles();
  const vehicleIdx = vehicles.findIndex(v => v.id === log.vehicleId);

  // Close log
  log.status = 'Closed';
  log.closedAt = new Date().toISOString();

  // Restore vehicle to Available (unless retired)
  if (vehicleIdx !== -1) {
    const v = vehicles[vehicleIdx];
    if (v.status === 'In Shop') {
      if (log.previousVehicleStatus === 'Retired') {
        v.status = 'Retired';
      } else {
        v.status = 'Available';
      }
    }
  }

  // Register this maintenance cost as an Expense
  const expenses = getItems<Expense>(KEYS.EXPENSES);
  expenses.push({
    id: generateId(),
    vehicleId: log.vehicleId,
    category: 'Maintenance',
    amount: log.cost,
    description: `Maintenance Closed: ${log.type} - ${log.description}`,
    date: new Date().toISOString().split('T')[0]
  });

  setItems(KEYS.VEHICLES, vehicles);
  setItems(KEYS.MAINTENANCE, logs);
  setItems(KEYS.EXPENSES, expenses);
};

// --- FUEL LOG APIS ---
export const getFuelLogs = (): FuelLog[] => getItems<FuelLog>(KEYS.FUEL_LOGS);

export const addFuelLog = (log: Omit<FuelLog, 'id'>): FuelLog => {
  const logs = getFuelLogs();
  const created: FuelLog = {
    id: generateId(),
    ...log
  };
  logs.push(created);
  setItems(KEYS.FUEL_LOGS, logs);

  // Automatically sync this as an Expense
  const expenses = getItems<Expense>(KEYS.EXPENSES);
  expenses.push({
    id: generateId(),
    vehicleId: log.vehicleId,
    category: 'Fuel',
    amount: log.cost,
    description: `Manual Fuel Logging (${log.liters}L at ${log.odometer} km odometer).`,
    date: log.date
  });
  setItems(KEYS.EXPENSES, expenses);

  return created;
};

// --- EXPENSE APIS ---
export const getExpenses = (): Expense[] => getItems<Expense>(KEYS.EXPENSES);

export const addExpense = (expense: Omit<Expense, 'id'>): Expense => {
  const expenses = getExpenses();
  const created: Expense = {
    id: generateId(),
    ...expense
  };
  expenses.push(created);
  setItems(KEYS.EXPENSES, expenses);
  return created;
};

export const deleteExpense = (id: string) => {
  const expenses = getExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  setItems(KEYS.EXPENSES, filtered);
};

export const deleteFuelLog = (id: string) => {
  const logs = getFuelLogs();
  const filtered = logs.filter(f => f.id !== id);
  setItems(KEYS.FUEL_LOGS, filtered);
};

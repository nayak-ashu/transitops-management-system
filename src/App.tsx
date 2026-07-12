import React, { useState, useEffect } from 'react';
import { 
  Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, User, UserRole 
} from './types';
import { 
  initDb, getActiveUser, setActiveUser, login, registerUser, updateUserSecurity,
  getVehicles, saveVehicle, deleteVehicle,
  getDrivers, saveDriver, deleteDriver,
  getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip,
  getMaintenanceLogs, createMaintenanceLog, closeMaintenanceLog,
  getFuelLogs, addFuelLog, deleteFuelLog,
  getExpenses, addExpense, deleteExpense 
} from './utils/db';

// Sub Components
import Dashboard from './components/Dashboard';
import LiveTracking from './components/LiveTracking';
import Vehicles from './components/Vehicles';
import Drivers from './components/Drivers';
import Trips from './components/Trips';
import Maintenance from './components/Maintenance';
import FuelExpenses from './components/FuelExpenses';
import Reports from './components/Reports';
import LandingPage from './components/LandingPage';

// Icons
import { 
  Truck, Users, Wrench, Navigation, Fuel, BarChart3, 
  LogOut, User as UserIcon, Lock, Shield, Moon, Sun, 
  Activity, Menu, X, ChevronRight, AlertCircle, Info, Sparkles, MapPin
} from 'lucide-react';

export default function App() {
  // DB States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('password123');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState<UserRole>('Fleet Manager');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrors, setAuthErrors] = useState<{name?: string; email?: string; password?: string; confirmPassword?: string}>({});

  // Active Security & PIN Option States
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [pinChallenge, setPinChallenge] = useState<{ actionName: string; callback: () => void } | null>(null);
  const [challengePinInput, setChallengePinInput] = useState('');
  const [challengeError, setChallengeError] = useState<string | null>(null);

  // Layout States
  const [nonAuthPage, setNonAuthPage] = useState<'landing' | 'login'>('landing');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('transitops-theme') === 'dark';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dark Mode side effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('transitops-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('transitops-theme', 'light');
    }
  }, [isDarkMode]);

  // Initialize DB and load states
  useEffect(() => {
    initDb();
    refreshData();
    const active = getActiveUser();
    if (active) {
      setCurrentUser(active);
    }
  }, []);

  // Quick helper to fetch latest states from LocalStorage DB
  const refreshData = () => {
    setVehicles(getVehicles());
    setDrivers(getDrivers());
    setTrips(getTrips());
    setMaintenance(getMaintenanceLogs());
    setFuelLogs(getFuelLogs());
    setExpenses(getExpenses());
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Auth Submit Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthErrors({});

    const errors: { email?: string; password?: string } = {};
    if (!emailInput.trim()) {
      errors.email = 'Email address is required.';
    }
    if (!passwordInput) {
      errors.password = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
      setAuthErrors(errors);
      return;
    }

    try {
      const logged = login(emailInput.trim(), passwordInput);
      if (logged) {
        setCurrentUser(logged);
        showToast(`Welcome back, ${logged.name}! Role: ${logged.role}`);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthErrors({});

    const errors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
    if (!nameInput.trim()) {
      errors.name = 'Full Name is required.';
    }
    
    const emailStr = emailInput.trim();
    if (!emailStr) {
      errors.email = 'Email is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailStr)) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    if (!passwordInput) {
      errors.password = 'Password is required.';
    } else if (passwordInput.length < 8) {
      errors.password = 'Password must meet minimum strength (at least 8 characters).';
    }

    if (!confirmPasswordInput) {
      errors.confirmPassword = 'Confirm Password is required.';
    } else if (passwordInput !== confirmPasswordInput) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setAuthErrors(errors);
      return;
    }

    try {
      const registered = registerUser(nameInput.trim(), emailInput.trim(), passwordInput, roleInput);
      setCurrentUser(registered);
      showToast(`Welcome to TransitOps, ${registered.name}! Registered as ${registered.role}`);
    } catch (err: any) {
      if (err.message && err.message.includes('Account already exists with this email')) {
        setAuthErrors({ email: 'Account already exists with this email' });
      }
      setAuthError(err.message || 'Registration failed.');
    }
  };

  const handleLogout = () => {
    setActiveUser(null);
    setCurrentUser(null);
    setEmailInput('');
    setNameInput('');
    setPasswordInput('');
    setConfirmPasswordInput('');
    setAuthErrors({});
    setIsRegisterMode(false);
    setNonAuthPage('login');
    showToast('Logged out of session.');
  };

  // Helper to enforce security verification for critical actions
  const triggerCriticalAction = (actionName: string, callback: () => void) => {
    if (currentUser && currentUser.pinRequiredForActions) {
      setPinChallenge({ actionName, callback });
      setChallengePinInput('');
      setChallengeError(null);
    } else {
      callback();
    }
  };

  // Quick testing role switcher helper
  const handleRoleSwap = (newRole: UserRole) => {
    if (currentUser) {
      const updated = { ...currentUser, role: newRole };
      setCurrentUser(updated);
      setActiveUser(updated);
      showToast(`Swapped user perspective to: ${newRole}`);
      
      // Auto adjust tab if not permitted on active tab
      const allowed = getPermittedTabs(newRole);
      if (!allowed.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  };

  // Core Data Actions
  const handleSaveVehicle = (vehicleData: Omit<Vehicle, 'id' | 'createdAt'> & { id?: string }) => {
    saveVehicle(vehicleData);
    refreshData();
    showToast(`Vehicle '${vehicleData.registrationNumber}' saved successfully.`);
  };

  const handleDeleteVehicle = (id: string) => {
    deleteVehicle(id);
    refreshData();
    showToast('Vehicle deleted from registry.');
  };

  const handleSaveDriver = (driverData: Omit<Driver, 'id' | 'createdAt'> & { id?: string }) => {
    saveDriver(driverData);
    refreshData();
    showToast(`Driver profile '${driverData.name}' saved successfully.`);
  };

  const handleDeleteDriver = (id: string) => {
    deleteDriver(id);
    refreshData();
    showToast('Driver profile removed.');
  };

  const handleCreateTrip = (tripData: Omit<Trip, 'id' | 'status' | 'createdAt'>) => {
    createTrip(tripData);
    refreshData();
    showToast('New trip planned in Draft status.');
  };

  const handleDispatchTrip = (tripId: string) => {
    triggerCriticalAction('Dispatch Trip', () => {
      dispatchTrip(tripId);
      refreshData();
      showToast('Trip dispatched! Vehicle and driver set to On Trip.');
    });
  };

  const handleCompleteTrip = (tripId: string, distance: number, liters: number) => {
    triggerCriticalAction('Complete Trip', () => {
      completeTrip(tripId, distance, liters);
      refreshData();
      showToast(`Trip marked Completed! Driven ${distance}km, fuel logs updated.`);
    });
  };

  const handleCancelTrip = (tripId: string) => {
    triggerCriticalAction('Cancel Trip', () => {
      cancelTrip(tripId);
      refreshData();
      showToast('Trip cancelled. Vehicle and driver status restored.');
    });
  };

  const handleCreateMaintenance = (logData: Omit<MaintenanceLog, 'id' | 'status' | 'createdAt'>) => {
    triggerCriticalAction('Place Vehicle in Shop', () => {
      createMaintenanceLog(logData);
      refreshData();
      showToast('Vehicle placed in shop. Status set to In Shop.');
    });
  };

  const handleCloseMaintenance = (logId: string) => {
    triggerCriticalAction('Close Service Order', () => {
      closeMaintenanceLog(logId);
      refreshData();
      showToast('Maintenance closed. Vehicle released and operational expense logged.');
    });
  };

  const handleAddFuelLog = (logData: Omit<FuelLog, 'id'>) => {
    addFuelLog(logData);
    refreshData();
    showToast('Fuel stop logged and synchronized into expenses.');
  };

  const handleAddExpense = (expData: Omit<Expense, 'id'>) => {
    addExpense(expData);
    refreshData();
    showToast('Operational expense recorded.');
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
    refreshData();
    showToast('Expense record deleted.');
  };

  const handleDeleteFuelLog = (id: string) => {
    deleteFuelLog(id);
    refreshData();
    showToast('Fuel stop log deleted.');
  };

  // Role Permissions filter helpers
  // Fleet Manager: all tabs
  // Driver: dashboard, vehicles, drivers, trips, fuel logs
  // Safety Officer: dashboard, drivers, trips, maintenance, reports (auditing)
  // Financial Analyst: dashboard, fuel/expenses, reports
  const getPermittedTabs = (role: UserRole): string[] => {
    switch (role) {
      case 'Fleet Manager':
        return ['dashboard', 'live-tracking', 'vehicles', 'drivers', 'trips', 'maintenance', 'expenses', 'reports'];
      case 'Driver':
        return ['dashboard', 'live-tracking', 'vehicles', 'drivers', 'trips', 'expenses'];
      case 'Safety Officer':
        return ['dashboard', 'live-tracking', 'drivers', 'trips', 'maintenance', 'reports'];
      case 'Financial Analyst':
        return ['dashboard', 'live-tracking', 'expenses', 'reports'];
      default:
        return ['dashboard', 'live-tracking'];
    }
  };

  const tabsConfig = [
    { id: 'dashboard', name: 'Dashboard', icon: Activity },
    { id: 'live-tracking', name: 'Live Tracking', icon: MapPin },
    { id: 'vehicles', name: 'Vehicles', icon: Truck },
    { id: 'drivers', name: 'Drivers', icon: Users },
    { id: 'trips', name: 'Trip Planner', icon: Navigation },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench },
    { id: 'expenses', name: 'Expenses', icon: Fuel },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
  ];

  // Allowed tabs for current user
  const visibleTabs = currentUser ? tabsConfig.filter(t => getPermittedTabs(currentUser.role).includes(t.id)) : [];

  // Toggle Dark Mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // AUTH VIEW (If no session active)
  if (!currentUser) {
    if (nonAuthPage === 'landing') {
      return (
        <LandingPage 
          onNavigateToLogin={() => setNonAuthPage('login')}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
      );
    }

    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-300 relative ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100/50'}`}>
        
        {/* Back to Home Button */}
        <button 
          onClick={() => setNonAuthPage('landing')}
          className="absolute top-6 left-6 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer bg-white/80 dark:bg-slate-900/80 backdrop-blur px-3.5 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/40 shadow-xs"
        >
          &larr; Back to Home
        </button>
        
        {/* Visual background ambient blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl"></div>

        {/* Authentication Box */}
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
          
          {/* Header Graphic */}
          <div className="bg-slate-900 text-white p-6 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full translate-x-4 -translate-y-4"></div>
            <div className="bg-blue-600 p-3 rounded-2xl shadow-md flex items-center justify-center">
              <Truck size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black font-display tracking-tight mt-3">TransitOps</h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1">Smart Transport Platform</p>
          </div>

          {/* Form wrapper */}
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Greeting */}
            <div className="text-center">
              <h2 className="text-base font-bold text-slate-800">
                {isRegisterMode ? 'Onboard your Transit Agency' : 'Secure Operator Terminal Access'}
              </h2>
              <p className="text-slate-500 text-xs mt-1">Enter your credentials to manage active logistics payloads.</p>
            </div>

            {authError && (
              <div id="auth-error-banner" className="flex gap-2 bg-rose-50 text-rose-700 text-xs p-3.5 rounded-xl border border-rose-100">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <p>{authError}</p>
              </div>
            )}

            {/* Simulated Auth Login Forms */}
            <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
              
              {isRegisterMode && (
                <div>
                  <label htmlFor="auth-name" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Your Full Name *</label>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    placeholder="e.g. Alex Mercer"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      if (authErrors.name) setAuthErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2 text-xs rounded-lg"
                  />
                  {authErrors.name && (
                    <p className="text-rose-600 text-[10px] font-semibold mt-1">{authErrors.name}</p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Operator Email Address *</label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="e.g. manager@transitops.com"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (authErrors.email) setAuthErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2 text-xs rounded-lg"
                />
                {authErrors.email && (
                  <p className="text-rose-600 text-[10px] font-semibold mt-1">{authErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">
                  {isRegisterMode ? 'Choose Password (min 8 characters) *' : 'Security PIN / Password *'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={12} />
                  </span>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (authErrors.password) setAuthErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    placeholder={isRegisterMode ? "Choose a secure password" : "Enter security password or PIN"}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden pl-8 pr-3 py-2 text-xs rounded-lg text-slate-800 font-mono"
                  />
                </div>
                {authErrors.password && (
                  <p className="text-rose-600 text-[10px] font-semibold mt-1">{authErrors.password}</p>
                )}
                {!isRegisterMode && (
                  <p className="text-[9px] text-slate-400 mt-1 italic">Note: Enter account PIN or password. Default presets use 'password123'.</p>
                )}
              </div>

              {isRegisterMode && (
                <div>
                  <label htmlFor="auth-confirm-password" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Confirm Password *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={12} />
                    </span>
                    <input
                      id="auth-confirm-password"
                      type="password"
                      required
                      value={confirmPasswordInput}
                      onChange={(e) => {
                        setConfirmPasswordInput(e.target.value);
                        if (authErrors.confirmPassword) setAuthErrors(prev => ({ ...prev, confirmPassword: undefined }));
                      }}
                      placeholder="Confirm your secure password"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden pl-8 pr-3 py-2 text-xs rounded-lg text-slate-800 font-mono"
                    />
                  </div>
                  {authErrors.confirmPassword && (
                    <p className="text-rose-600 text-[10px] font-semibold mt-1">{authErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* User Role Selection - Essential for demonstrating RBAC! Only visible in Register Mode */}
              {isRegisterMode && (
                <div>
                  <label htmlFor="auth-role" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Select Access Role (RBAC) *</label>
                  <select
                    id="auth-role"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2.5 text-xs rounded-lg font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="Fleet Manager">Fleet Manager (Full Asset & Shop Access)</option>
                    <option value="Driver">Driver (Trips & Manifest Operations)</option>
                    <option value="Safety Officer">Safety Officer (Compliance & Driver Audits)</option>
                    <option value="Financial Analyst">Financial Analyst (Analytics & Ledgers)</option>
                  </select>
                  <p className="text-[9px] text-slate-400 mt-1.5 leading-normal flex items-start gap-1">
                    <Shield size={10} className="text-blue-500 shrink-0 mt-0.5" />
                    Different roles automatically render customized navigation tabs and action locks.
                  </p>
                </div>
              )}

              <button
                id="btn-auth-submit"
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer mt-2"
              >
                {isRegisterMode ? 'Complete Onboarding' : 'Access Operator Console'}
              </button>

            </form>

            {/* Quick Credentials Seeding Helpers */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles size={11} className="text-blue-500" /> Fast Login Presets
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput('manager@transitops.com');
                    setPasswordInput('password123');
                    setRoleInput('Fleet Manager');
                    setAuthError(null);
                    setAuthErrors({});
                  }}
                  className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 text-slate-700 p-1.5 rounded-lg text-left truncate cursor-pointer transition-colors"
                >
                  Fleet Manager Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput('driver@transitops.com');
                    setPasswordInput('password123');
                    setRoleInput('Driver');
                    setAuthError(null);
                    setAuthErrors({});
                  }}
                  className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 text-slate-700 p-1.5 rounded-lg text-left truncate cursor-pointer transition-colors"
                >
                  Driver Mercer Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput('safety@transitops.com');
                    setPasswordInput('password123');
                    setRoleInput('Safety Officer');
                    setAuthError(null);
                    setAuthErrors({});
                  }}
                  className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 text-slate-700 p-1.5 rounded-lg text-left truncate cursor-pointer transition-colors"
                >
                  Safety Officer Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput('analyst@transitops.com');
                    setPasswordInput('password123');
                    setRoleInput('Financial Analyst');
                    setAuthError(null);
                    setAuthErrors({});
                  }}
                  className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 text-slate-700 p-1.5 rounded-lg text-left truncate cursor-pointer transition-colors"
                >
                  Financial Analyst
                </button>
              </div>
            </div>

            {/* Toggle Sign Up / Log In */}
            <div className="text-center pt-2">
              <button
                id="btn-toggle-auth-mode"
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setAuthErrors({});
                  setIsRegisterMode(!isRegisterMode);
                  setNameInput('');
                  setEmailInput('');
                  setPasswordInput('password123');
                  setConfirmPasswordInput('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer"
              >
                {isRegisterMode ? 'Already have an account? Log In' : 'New operator agency? Register fleet'}
              </button>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // ALLOWED MODIFICATION CHECKS
  // Fleet Manager and Drivers have permissions to create/dispatch/complete manifests
  const userHasModifyPermission = currentUser.role === 'Fleet Manager' || currentUser.role === 'Driver';
  const fleetManagerOrSafetyOfficer = currentUser.role === 'Fleet Manager' || currentUser.role === 'Safety Officer';

  // MAIN WORKSPACE INTERFACE
  return (
    <div className={`min-h-screen flex text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50'}`}>
      
      {/* Toast Notice */}
      {toastMessage && (
        <div id="toast-banner" className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white border border-slate-800 rounded-2xl px-5 py-3.5 shadow-xl animate-slide-up flex items-center gap-2 max-w-sm">
          <Shield size={16} className="text-blue-500 shrink-0" />
          <span className="text-xs font-semibold leading-relaxed">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar mobile overlay */}
      {isSidebarOpen && (
        <div 
          id="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-900 text-slate-800 dark:text-slate-200 flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex shrink-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          
          {/* Brand header */}
          <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-900">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-xs">
                <Truck size={18} />
              </div>
              <div>
                <h1 className="font-extrabold font-display text-sm tracking-tight text-slate-800 dark:text-slate-100">TransitOps</h1>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Agency Console</span>
              </div>
            </div>

            <button 
              id="sidebar-close-btn"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* User profile */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900 space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-black text-xs uppercase">
                {currentUser.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
              </div>
            </div>
            
            {/* Role highlight badge & switcher & security */}
            <div className="pt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  <Shield size={10} /> {currentUser.role}
                </span>
                
                {/* Active PIN indicator */}
                <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${
                  currentUser.pinRequiredForActions 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' 
                    : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
                }`}>
                  PIN: {currentUser.pinRequiredForActions ? 'ON' : 'OFF'}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px]">
                <select
                  id="sidebar-role-switcher"
                  value={currentUser.role}
                  onChange={(e) => handleRoleSwap(e.target.value as UserRole)}
                  className="bg-transparent border-0 font-bold text-blue-600 dark:text-blue-400 text-[10px] focus:ring-0 outline-hidden cursor-pointer w-full p-0"
                >
                  <option value="Fleet Manager">Manager Perspective</option>
                  <option value="Driver">Driver Perspective</option>
                  <option value="Safety Officer">Safety Perspective</option>
                  <option value="Financial Analyst">Financial Perspective</option>
                </select>
              </div>

              {/* Security PIN Config Button */}
              <button
                id="sidebar-security-btn"
                onClick={() => {
                  setIsSecurityModalOpen(true);
                  setNewPassword('');
                  setConfirmPassword('');
                  setSecurityError(null);
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Lock size={11} className="text-blue-500 shrink-0" />
                <span>Security & PIN Config</span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`nav-link-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-2xs dark:shadow-none border border-blue-100/30 dark:border-blue-900/30' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                    <span>{tab.name}</span>
                  </div>
                  <ChevronRight size={12} className={activeTab === tab.id ? 'text-blue-500 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'} />
                </button>
              );
            })}
          </nav>

        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-950/20">
          <button
            id="btn-logout"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-800 hover:border-rose-100 dark:hover:border-rose-900/40 shadow-2xs dark:shadow-none"
          >
            <LogOut size={14} />
            Logout Session
          </button>
        </div>

      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        
        {/* Top Header Controls bar */}
        <header className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shrink-0 shadow-2xs dark:shadow-none">
          
          <div className="flex items-center gap-3">
            <button
              id="sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-800 dark:text-slate-300 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <Menu size={16} />
            </button>

            {/* Quick Active status indicator */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Activity size={14} className="text-emerald-500 animate-pulse-soft" />
              <span className="hidden sm:inline">Telemetry Feed:</span>
              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-md font-extrabold text-[10px]">
                LIVE CONNECTION
              </span>
            </div>
          </div>

          {/* Interactive Actions block */}
          <div className="flex items-center gap-4">
            
            {/* Theme Toggle */}
            <button
              id="btn-toggle-theme"
              onClick={toggleTheme}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              {isDarkMode ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} />}
            </button>
          </div>

        </header>

        {/* Subtab Content Area */}
        <div className="p-6 md:p-8 flex-1">
          {activeTab === 'dashboard' && (
            <Dashboard 
              vehicles={vehicles}
              drivers={drivers}
              trips={trips}
              maintenance={maintenance}
              fuelLogs={fuelLogs}
              expenses={expenses}
              userRole={currentUser.role}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'live-tracking' && (
            <LiveTracking 
              vehicles={vehicles}
              drivers={drivers}
              trips={trips}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'vehicles' && (
            <Vehicles 
              vehicles={vehicles}
              onSave={handleSaveVehicle}
              onDelete={handleDeleteVehicle}
              canModify={currentUser.role === 'Fleet Manager'} // Only Manager can add/edit vehicles
            />
          )}

          {activeTab === 'drivers' && (
            <Drivers 
              drivers={drivers}
              onSave={handleSaveDriver}
              onDelete={handleDeleteDriver}
              canModify={fleetManagerOrSafetyOfficer} // Fleet Manager & Safety Officer can manage drivers
            />
          )}

          {activeTab === 'trips' && (
            <Trips 
              trips={trips}
              vehicles={vehicles}
              drivers={drivers}
              onCreateTrip={handleCreateTrip}
              onDispatchTrip={handleDispatchTrip}
              onCompleteTrip={handleCompleteTrip}
              onCancelTrip={handleCancelTrip}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'maintenance' && (
            <Maintenance 
              maintenance={maintenance}
              vehicles={vehicles}
              onCreateMaintenance={handleCreateMaintenance}
              onCloseMaintenance={handleCloseMaintenance}
              canModify={fleetManagerOrSafetyOfficer} // Fleet Manager & Safety Officer can enter maintenance logs
            />
          )}

          {activeTab === 'expenses' && (
            <FuelExpenses 
              fuelLogs={fuelLogs}
              expenses={expenses}
              vehicles={vehicles}
              onAddFuelLog={handleAddFuelLog}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onDeleteFuelLog={handleDeleteFuelLog}
              canModify={currentUser.role === 'Fleet Manager' || currentUser.role === 'Driver'} // Analysts can't log costs, only view
            />
          )}

          {activeTab === 'reports' && (
            <Reports 
              vehicles={vehicles}
              drivers={drivers}
              trips={trips}
              maintenance={maintenance}
              fuelLogs={fuelLogs}
              expenses={expenses}
            />
          )}
        </div>

      </main>

      {/* 1. Security & PIN Configuration Modal */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="bg-slate-900 dark:bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-blue-500" />
                <h3 className="font-bold text-sm">Security & Operator Lock Config</h3>
              </div>
              <button 
                onClick={() => setIsSecurityModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Option 1: Action Protection Toggle */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Require PIN for Manifest Actions</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      Force authentication challenges for critical operations like dispatching, completing, or canceling logistics trip manifests.
                    </p>
                  </div>
                  <button
                    id="security-toggle-pin-req"
                    type="button"
                    onClick={() => {
                      const nextVal = !currentUser.pinRequiredForActions;
                      const updated = updateUserSecurity(currentUser.id, { pinRequiredForActions: nextVal });
                      setCurrentUser(updated);
                      showToast(`Security PIN requirement: ${nextVal ? 'ACTIVATED' : 'DEACTIVATED'}`);
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-hidden ${
                      currentUser.pinRequiredForActions ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        currentUser.pinRequiredForActions ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Option 2: Change Password/PIN */}
              <form onSubmit={(e) => {
                e.preventDefault();
                setSecurityError(null);
                if (!newPassword.trim()) {
                  setSecurityError('PIN/Password cannot be blank.');
                  return;
                }
                if (newPassword !== confirmPassword) {
                  setSecurityError('Passwords do not match. Please verify.');
                  return;
                }
                try {
                  const updated = updateUserSecurity(currentUser.id, { password: newPassword.trim() });
                  setCurrentUser(updated);
                  showToast('Security PIN / Password changed successfully.');
                  setIsSecurityModalOpen(false);
                } catch (err: any) {
                  setSecurityError(err.message || 'Failed to update password.');
                }
              }} className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                  <Shield size={12} className="text-blue-500" />
                  Update Security Credentials
                </h4>

                {securityError && (
                  <div className="flex gap-2 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-[10px] p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <p className="font-semibold">{securityError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">New PIN / Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new secure password or numeric PIN"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2 text-xs rounded-lg font-mono text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">Confirm New PIN / Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Verify secure password or PIN"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2 text-xs rounded-lg font-mono text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSecurityModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Close Dialog
                  </button>
                  <button
                    id="security-save-credentials-btn"
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors shadow-xs"
                  >
                    Save Credentials
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. Security PIN/Password Challenge Dialog */}
      {pinChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-rose-500 animate-pulse" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">Authorize Action Required</h3>
              </div>
              <button 
                onClick={() => setPinChallenge(null)}
                className="text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={(e) => {
              e.preventDefault();
              setChallengeError(null);
              const correct = currentUser?.password || 'password123';
              if (challengePinInput === correct) {
                // Success!
                pinChallenge.callback();
                setPinChallenge(null);
                showToast(`Action authorized: ${pinChallenge.actionName}`);
              } else {
                setChallengeError('Incorrect PIN or Password. Please try again.');
              }
            }} className="p-6 space-y-4">
              <div className="text-center space-y-1">
                <div className="mx-auto w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-2 animate-bounce-soft">
                  <Shield size={18} />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Security PIN Authorization</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                  You are attempting to perform: <strong className="text-slate-700 dark:text-slate-300 font-bold">{pinChallenge.actionName}</strong>. Please enter your security PIN/password to sign off on this log.
                </p>
              </div>

              {challengeError && (
                <div className="flex gap-2 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-[10px] p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 animate-shake">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p className="font-semibold">{challengeError}</p>
                </div>
              )}

              <div>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter security PIN / password"
                  value={challengePinInput}
                  onChange={(e) => setChallengePinInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2.5 text-center text-sm font-semibold tracking-widest font-mono rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPinChallenge(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-xs font-semibold cursor-pointer text-slate-600 dark:text-slate-400 transition-colors"
                >
                  Decline
                </button>
                <button
                  id="btn-confirm-pin-challenge"
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer transition-colors shadow-xs"
                >
                  Verify & Sign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

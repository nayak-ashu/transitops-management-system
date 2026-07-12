import React, { useState, useMemo } from 'react';
import { 
  Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, UserRole 
} from '../types';
import { formatCurrency, formatNumber } from '../utils/format';
import { Truck, Users, Wrench, ShieldAlert, Navigation, FileText, CheckCircle2, TrendingUp, Filter, AlertTriangle } from 'lucide-react';

// Define the core mission responsibilities per role
const roleTasks: Record<UserRole, { id: string; label: string; description: string; targetTab: string; actionLabel: string }[]> = {
  'Fleet Manager': [
    {
      id: 'fleet-register-vehicle',
      label: 'Register a new vehicle',
      description: 'Onboard operational assets into the fleet registry.',
      targetTab: 'vehicles',
      actionLabel: 'Register Asset'
    },
    {
      id: 'fleet-edit-vehicle',
      label: 'Edit vehicle details',
      description: 'Modify registration plates, model, and payload limits.',
      targetTab: 'vehicles',
      actionLabel: 'Edit Asset'
    },
    {
      id: 'fleet-update-status',
      label: 'Update vehicle status',
      description: 'Toggle operational states (Available, In Shop, Retired).',
      targetTab: 'vehicles',
      actionLabel: 'Update Status'
    },
    {
      id: 'fleet-retire-vehicle',
      label: 'Retire a vehicle',
      description: 'Permanently phase out decommissioned assets.',
      targetTab: 'vehicles',
      actionLabel: 'Retire Asset'
    }
  ],
  'Driver': [
    {
      id: 'driver-check-vehicle',
      label: 'Inspect Assigned Vehicle',
      description: 'Verify current odometer reading and class specifications.',
      targetTab: 'vehicles',
      actionLabel: 'View Vehicles'
    },
    {
      id: 'driver-view-schedule',
      label: 'Monitor Dispatch Schedule',
      description: 'Check active and pending cargo trips in the pipelines.',
      targetTab: 'trips',
      actionLabel: 'View Trips'
    },
    {
      id: 'driver-log-expense',
      label: 'Log Fuel Expense',
      description: 'Report fuel consumption stopovers and costs.',
      targetTab: 'expenses',
      actionLabel: 'Log Fuel'
    }
  ],
  'Safety Officer': [
    {
      id: 'safety-monitor-scores',
      label: 'Monitor Driver Safety Scores',
      description: 'Analyze safety index telemetry and check license status.',
      targetTab: 'drivers',
      actionLabel: 'Inspect Drivers'
    },
    {
      id: 'safety-supervise-shop',
      label: 'Supervise Shop Maintenance',
      description: 'Verify safety compliance of vehicles currently in shop.',
      targetTab: 'maintenance',
      actionLabel: 'View Shop'
    },
    {
      id: 'safety-generate-reports',
      label: 'Generate Safety Reports',
      description: 'Analyze driver compliance and accident prevention metrics.',
      targetTab: 'reports',
      actionLabel: 'View Reports'
    }
  ],
  'Financial Analyst': [
    {
      id: 'finance-audit-expenses',
      label: 'Audit Fleet Expenses',
      description: 'Track fuel, maintenance, and auxiliary charge entries.',
      targetTab: 'expenses',
      actionLabel: 'Audit Expenses'
    },
    {
      id: 'finance-analyze-revenue',
      label: 'Analyze Cargo Revenue',
      description: 'Assess total profit margins and operational cashflows.',
      targetTab: 'reports',
      actionLabel: 'Review Reports'
    }
  ]
};

interface DashboardProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  userRole: UserRole;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({
  vehicles,
  drivers,
  trips,
  maintenance,
  fuelLogs,
  expenses,
  userRole,
  setActiveTab
}: DashboardProps) {
  // Filter States
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  // Checklist state with localStorage persistence
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('transitops-completed-tasks');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const toggleTask = (taskId: string) => {
    const updated = { ...completedTasks, [taskId]: !completedTasks[taskId] };
    setCompletedTasks(updated);
    localStorage.setItem('transitops-completed-tasks', JSON.stringify(updated));
  };

  const currentTasks = useMemo(() => {
    return roleTasks[userRole] || [];
  }, [userRole]);

  const completedCount = useMemo(() => {
    return currentTasks.filter(t => !!completedTasks[t.id]).length;
  }, [currentTasks, completedTasks]);

  // Unique list of regions
  const regions = useMemo(() => {
    const list = new Set(vehicles.map(v => v.region).filter(Boolean));
    return Array.from(list);
  }, [vehicles]);

  // Filtered dataset
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const typeMatch = selectedType === 'all' || v.type === selectedType;
      const regionMatch = selectedRegion === 'all' || v.region === selectedRegion;
      return typeMatch && regionMatch;
    });
  }, [vehicles, selectedType, selectedRegion]);

  const filteredVehiclesIds = useMemo(() => {
    return new Set(filteredVehicles.map(v => v.id));
  }, [filteredVehicles]);

  // Filtered metrics
  const stats = useMemo(() => {
    const total = filteredVehicles.length;
    const available = filteredVehicles.filter(v => v.status === 'Available').length;
    const onTrip = filteredVehicles.filter(v => v.status === 'On Trip').length;
    const inShop = filteredVehicles.filter(v => v.status === 'In Shop').length;
    const retired = filteredVehicles.filter(v => v.status === 'Retired').length;
    
    // Active vehicles (not retired)
    const activeVehiclesCount = total - retired;
    const utilization = activeVehiclesCount > 0 ? Math.round((onTrip / activeVehiclesCount) * 100) : 0;

    // Drivers on duty (filtered by vehicle constraints if matching)
    // For simplicity, drivers assigned to filtered vehicles
    const driversOnTrip = drivers.filter(d => {
      if (d.status !== 'On Trip') return false;
      const driverTrip = trips.find(t => t.driverId === d.id && t.status === 'Dispatched');
      return driverTrip ? filteredVehiclesIds.has(driverTrip.vehicleId) : true;
    }).length;

    const availableDrivers = drivers.filter(d => d.status === 'Available').length;

    // Trips filtered by vehicle filter
    const filteredTrips = trips.filter(t => filteredVehiclesIds.has(t.vehicleId));
    const activeTrips = filteredTrips.filter(t => t.status === 'Dispatched').length;
    const pendingTrips = filteredTrips.filter(t => t.status === 'Draft').length;

    return {
      total,
      available,
      onTrip,
      inShop,
      retired,
      utilization,
      driversOnTrip,
      availableDrivers,
      activeTrips,
      pendingTrips
    };
  }, [filteredVehicles, drivers, trips, filteredVehiclesIds]);

  // Warnings / Compliance Alerts (Bonus: Safety Officer & License check)
  const complianceAlerts = useMemo(() => {
    const alerts: { id: string; type: 'error' | 'warning'; msg: string; details: string; tab: string }[] = [];
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    drivers.forEach(d => {
      const expiry = new Date(d.licenseExpiryDate);
      if (expiry < today) {
        alerts.push({
          id: `expired-${d.id}`,
          type: 'error',
          msg: `Driver License Expired: ${d.name}`,
          details: `Expired on ${d.licenseExpiryDate}. Must be suspended immediately.`,
          tab: 'drivers'
        });
      } else if (expiry <= thirtyDaysFromNow) {
        alerts.push({
          id: `expiring-${d.id}`,
          type: 'warning',
          msg: `License Expiring Soon: ${d.name}`,
          details: `Expires in less than 30 days (${d.licenseExpiryDate}).`,
          tab: 'drivers'
        });
      }

      if (d.safetyScore < 60 && d.status !== 'Suspended') {
        alerts.push({
          id: `score-${d.id}`,
          type: 'warning',
          msg: `Low Safety Score Alert: ${d.name}`,
          details: `Score is currently ${d.safetyScore}/100. Retraining recommended.`,
          tab: 'drivers'
        });
      }
    });

    // In shop vehicles warnings
    const openLogs = maintenance.filter(m => m.status === 'Open');
    openLogs.forEach(m => {
      const vehicle = vehicles.find(v => v.id === m.vehicleId);
      if (vehicle) {
        alerts.push({
          id: `maint-${m.id}`,
          type: 'warning',
          msg: `Vehicle Undergoing Maintenance: ${vehicle.registrationNumber}`,
          details: `${m.type}: ${m.description}`,
          tab: 'maintenance'
        });
      }
    });

    return alerts;
  }, [drivers, maintenance, vehicles]);

  // Financial aggregates for Quick Overview
  const financials = useMemo(() => {
    const totalRev = trips
      .filter(t => t.status === 'Completed' && filteredVehiclesIds.has(t.vehicleId))
      .reduce((sum, t) => sum + Number(t.revenue || 0), 0);

    const totalMaint = maintenance
      .filter(m => filteredVehiclesIds.has(m.vehicleId))
      .reduce((sum, m) => sum + Number(m.cost || 0), 0);

    const totalFuel = fuelLogs
      .filter(f => filteredVehiclesIds.has(f.vehicleId))
      .reduce((sum, f) => sum + Number(f.cost || 0), 0);

    const totalOther = expenses
      .filter(e => e.category !== 'Fuel' && e.category !== 'Maintenance' && filteredVehiclesIds.has(e.vehicleId))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const profit = totalRev - (totalMaint + totalFuel + totalOther);

    return { totalRev, totalMaint, totalFuel, totalOther, profit };
  }, [trips, maintenance, fuelLogs, expenses, filteredVehiclesIds]);

  // Find drivers with expired licenses or expiring in 30 days
  const criticalDrivers = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return drivers.filter(d => {
      const expiry = new Date(d.licenseExpiryDate);
      return expiry <= thirtyDaysFromNow;
    });
  }, [drivers]);

  return (
    <div id="dashboard-tab-content" className="space-y-6">

      {criticalDrivers.length > 0 && (
        <div id="dashboard-license-warning" className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl shadow-2xs flex items-start gap-3">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-amber-900">Driver License Expiration Warning</h4>
            <p className="text-xs text-amber-700 mt-1">
              The following drivers have expired licenses or licenses expiring within the next 30 days. Please take immediate administrative action:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {criticalDrivers.map(d => {
                const isExpired = new Date(d.licenseExpiryDate) < new Date();
                return (
                  <span 
                    key={d.id} 
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
                      isExpired 
                        ? 'bg-rose-100 text-rose-800 border-rose-200' 
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'}`} />
                    {d.name} (Expires: {d.licenseExpiryDate})
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Top Header Controls with Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-800">Operational Command</h2>
          <p className="text-slate-500 text-sm mt-0.5">Real-time telemetry and management controls as a <span className="font-semibold text-blue-600 underline">{userRole}</span>.</p>
        </div>

        {/* Global Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600">
            <Filter size={14} className="text-slate-400" />
            <span className="font-medium">Filter Fleet:</span>
          </div>

          <select
            id="filter-vehicle-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 outline-hidden cursor-pointer"
          >
            <option value="all">All Vehicle Types</option>
            <option value="Heavy Truck">Heavy Truck</option>
            <option value="Light Van">Light Van</option>
            <option value="Bus">Bus</option>
            <option value="Cargo Car">Cargo Car</option>
          </select>

          <select
            id="filter-vehicle-region"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 outline-hidden cursor-pointer"
          >
            <option value="all">All Regions</option>
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI: Fleet Utilization */}
        <div id="kpi-utilization" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Fleet Utilization</p>
              <p className="text-3xl font-extrabold font-display text-slate-800 mt-2">{stats.utilization}%</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.utilization}%` }}
            />
          </div>
        </div>

        {/* KPI: Active Vehicles Status */}
        <div id="kpi-vehicles" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Vehicle Registry</p>
              <p className="text-3xl font-extrabold font-display text-slate-800 mt-2">
                {stats.onTrip}<span className="text-slate-400 text-base font-normal"> / {stats.total - stats.retired} Active</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Truck size={20} />
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-medium text-slate-500 border-t border-slate-50 pt-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>{stats.available} Available</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>{stats.inShop} In Shop</span>
          </div>
        </div>

        {/* KPI: Drivers Status */}
        <div id="kpi-drivers" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Drivers On Duty</p>
              <p className="text-3xl font-extrabold font-display text-slate-800 mt-2">
                {stats.driversOnTrip}<span className="text-slate-400 text-base font-normal"> / {drivers.length} Total</span>
              </p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users size={20} />
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-medium text-slate-500 border-t border-slate-50 pt-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>{stats.availableDrivers} Off-trip</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>{drivers.filter(d => d.status === 'Suspended').length} Suspended</span>
          </div>
        </div>

        {/* KPI: Trip Pipelines */}
        <div id="kpi-trips" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Trip Pipelines</p>
              <p className="text-3xl font-extrabold font-display text-slate-800 mt-2">
                {stats.activeTrips}<span className="text-slate-400 text-base font-normal"> Active</span>
              </p>
            </div>
            <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
              <Navigation size={20} />
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-medium text-slate-500 border-t border-slate-50 pt-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>{stats.pendingTrips} Drafts</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>{trips.filter(t => t.status === 'Completed' && filteredVehiclesIds.has(t.vehicleId)).length} Completed</span>
          </div>
        </div>

      </div>

      {/* Dynamic Compliance Alerts & Operator Playbook Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Compliance warnings / Safety Audit - Left Column */}
        <div id="compliance-alerts-box" className="lg:col-span-2 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/20 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-amber-200/40 dark:border-amber-900/20">
              <ShieldAlert className="text-amber-600 dark:text-amber-500 animate-pulse-soft" size={18} />
              <h3 className="font-bold font-display text-amber-900 dark:text-amber-400 text-xs uppercase tracking-wider">Fleet Warnings & Safety Audit</h3>
              <span className="ml-auto bg-amber-200/60 dark:bg-amber-900/30 text-amber-900 dark:text-amber-400 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {complianceAlerts.length} Active Alerts
              </span>
            </div>
            
            {complianceAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <CheckCircle2 size={36} className="text-emerald-500 mb-2" />
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">System Compliant</h4>
                <p className="text-slate-400 text-[11px] mt-1">All registered drivers hold active licenses and safety parameters are normal.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[14rem] overflow-y-auto pr-1">
                {complianceAlerts.map(alert => (
                  <div 
                    key={alert.id}
                    onClick={() => setActiveTab(alert.tab)}
                    className="bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-amber-100/60 dark:border-amber-900/20 hover:border-amber-300 dark:hover:border-amber-700 shadow-3xs hover:shadow-2xs transition-all cursor-pointer flex gap-3 items-start"
                  >
                    <div className={`p-1.5 rounded-lg mt-0.5 ${alert.type === 'error' ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'}`}>
                      <AlertTriangle size={14} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{alert.msg}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{alert.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Playbook Checklist panel - Right Column */}
        <div id="playbook-checklist" className="lg:col-span-1 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-200/40 dark:border-blue-900/20 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-blue-200/40 dark:border-blue-900/20">
              <CheckCircle2 className="text-blue-600 dark:text-blue-400" size={18} />
              <h3 className="font-bold font-display text-blue-900 dark:text-blue-400 text-xs uppercase tracking-wider">{userRole} Playbook</h3>
              <span className="ml-auto bg-blue-200/60 dark:bg-blue-900/30 text-blue-900 dark:text-blue-400 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {completedCount}/{currentTasks.length} Done
              </span>
            </div>

            <div className="space-y-3 max-h-[14rem] overflow-y-auto pr-1">
              {currentTasks.map(task => {
                const isDone = !!completedTasks[task.id];
                return (
                  <div key={task.id} className="flex gap-3 items-start bg-white dark:bg-slate-900/50 p-2.5 rounded-xl border border-blue-100/40 dark:border-blue-900/10 hover:border-blue-200/70 transition-all">
                    <input 
                      type="checkbox"
                      id={`chk-${task.id}`}
                      checked={isDone}
                      onChange={() => toggleTask(task.id)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-slate-50 dark:bg-slate-900 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <label 
                        htmlFor={`chk-${task.id}`} 
                        className={`block text-xs font-bold cursor-pointer ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}
                      >
                        {task.label}
                      </label>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">{task.description}</p>
                      
                      <button
                        onClick={() => setActiveTab(task.targetTab)}
                        className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:underline mt-1.5 flex items-center gap-0.5"
                      >
                        {task.actionLabel} &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Visual Analytics Block & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Analytics Column 1: Fleet Status (SVG Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold font-display text-slate-800 text-sm uppercase tracking-wider">Fleet Composition status</h3>
            <p className="text-xs text-slate-400 mt-1">Status representation of filtered active vehicles.</p>
          </div>
          
          <div className="flex justify-center items-center my-6 relative">
            {/* Visual Ring Chart */}
            <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
              <circle cx="80" cy="80" r="65" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
              {/* Dynamic SVG arcs based on counts */}
              {(() => {
                const total = stats.available + stats.onTrip + stats.inShop + stats.retired;
                if (total === 0) return null;
                const r = 65;
                const c = 2 * Math.PI * r; // ~408.4
                
                const avPercent = stats.available / total;
                const otPercent = stats.onTrip / total;
                const isPercent = stats.inShop / total;
                const rtPercent = stats.retired / total;

                const avStroke = avPercent * c;
                const otStroke = otPercent * c;
                const isStroke = isPercent * c;
                const rtStroke = rtPercent * c;

                return (
                  <>
                    {/* Available (Emerald) */}
                    <circle 
                      cx="80" cy="80" r={r} 
                      stroke="#10b981" strokeWidth="12" fill="transparent" 
                      strokeDasharray={`${avStroke} ${c}`}
                      strokeDashoffset={0}
                      className="transition-all duration-700"
                    />
                    {/* On Trip (Blue) */}
                    <circle 
                      cx="80" cy="80" r={r} 
                      stroke="#3b82f6" strokeWidth="12" fill="transparent" 
                      strokeDasharray={`${otStroke} ${c}`}
                      strokeDashoffset={-avStroke}
                      className="transition-all duration-700"
                    />
                    {/* In Shop (Amber) */}
                    <circle 
                      cx="80" cy="80" r={r} 
                      stroke="#f59e0b" strokeWidth="12" fill="transparent" 
                      strokeDasharray={`${isStroke} ${c}`}
                      strokeDashoffset={-(avStroke + otStroke)}
                      className="transition-all duration-700"
                    />
                    {/* Retired (Slate) */}
                    <circle 
                      cx="80" cy="80" r={r} 
                      stroke="#64748b" strokeWidth="12" fill="transparent" 
                      strokeDasharray={`${rtStroke} ${c}`}
                      strokeDashoffset={-(avStroke + otStroke + isStroke)}
                      className="transition-all duration-700"
                    />
                  </>
                );
              })()}
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-black font-display text-slate-800">{stats.total}</span>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fleet Size</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Available ({stats.available})</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span>On Trip ({stats.onTrip})</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>In Shop ({stats.inShop})</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span>
              <span>Retired ({stats.retired})</span>
            </div>
          </div>
        </div>

        {/* Visual Analytics Column 2: Financial Balance (Bar chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold font-display text-slate-800 text-sm uppercase tracking-wider">Financial telemetry</h3>
            <p className="text-xs text-slate-400 mt-1">Aggregated budget, revenue, and core expenses.</p>
          </div>

          <div className="space-y-4 my-5">
            {/* Revenue */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Completed Cargo Revenue</span>
                <span className="font-bold text-emerald-600">{formatCurrency(financials.totalRev)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Maintenance Cost */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Total Maintenance Expense</span>
                <span className="font-bold text-amber-600">{formatCurrency(financials.totalMaint)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full">
                <div 
                  className="bg-amber-500 h-full rounded-full" 
                  style={{ width: financials.totalRev > 0 ? `${Math.min((financials.totalMaint / financials.totalRev) * 100, 100)}%` : '0%' }}
                ></div>
              </div>
            </div>

            {/* Fuel Cost */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Total Fuel Consumed Cost</span>
                <span className="font-bold text-blue-600">{formatCurrency(financials.totalFuel)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full">
                <div 
                  className="bg-blue-500 h-full rounded-full" 
                  style={{ width: financials.totalRev > 0 ? `${Math.min((financials.totalFuel / financials.totalRev) * 100, 100)}%` : '0%' }}
                ></div>
              </div>
            </div>

            {/* Other Cost */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Other Operating Charges</span>
                <span className="font-bold text-slate-600">{formatCurrency(financials.totalOther)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full">
                <div 
                  className="bg-slate-500 h-full rounded-full" 
                  style={{ width: financials.totalRev > 0 ? `${Math.min((financials.totalOther / financials.totalRev) * 100, 100)}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500">Net Operator Profit:</span>
            <span className={`text-lg font-black font-display ${financials.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(financials.profit)}
            </span>
          </div>
        </div>

        {/* Visual Analytics Column 3: Recent Activity Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold font-display text-slate-800 text-sm uppercase tracking-wider">Active Operations Logs</h3>
            <p className="text-xs text-slate-400 mt-1">Real-time dispatcher logs and trip events.</p>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-72 my-4 pr-1">
            {trips.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No operational logs recorded yet.</p>
            ) : (
              trips.slice().reverse().map(trip => {
                const v = vehicles.find(veh => veh.id === trip.vehicleId);
                const d = drivers.find(drv => drv.id === trip.driverId);

                return (
                  <div key={trip.id} className="border-l-2 border-slate-200 pl-3.5 py-1 space-y-1 hover:border-blue-500 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800 text-xs">{trip.source} → {trip.destination}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        trip.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        trip.status === 'Dispatched' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        trip.status === 'Cancelled' ? 'bg-slate-100 text-slate-500' :
                        'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>{trip.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Vehicle: <span className="text-slate-700">{v?.registrationNumber || 'N/A'}</span> • Driver: <span className="text-slate-700">{d?.name || 'N/A'}</span>
                    </p>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Cargo: {trip.cargoWeight} kg</span>
                      <span>Rev: {formatCurrency(trip.revenue)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button 
            id="btn-goto-trips"
            onClick={() => setActiveTab('trips')}
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-all"
          >
            Manage Trip Planners
          </button>
        </div>

      </div>

    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Trip, Vehicle, Driver, TripStatus } from '../types';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../utils/format';
import { Plus, Search, Navigation, Send, CheckCircle2, XCircle, AlertTriangle, Eye, ArrowRight, Clipboard, EyeOff, Fuel, Gauge, DollarSign, Download, X } from 'lucide-react';

interface TripsProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onCreateTrip: (trip: Omit<Trip, 'id' | 'status' | 'createdAt'>) => void;
  onDispatchTrip: (tripId: string) => void;
  onCompleteTrip: (tripId: string, actualDistance: number, fuelConsumed: number) => void;
  onCancelTrip: (tripId: string) => void;
  userRole: string;
}

export default function Trips({
  trips,
  vehicles,
  drivers,
  onCreateTrip,
  onDispatchTrip,
  onCompleteTrip,
  onCancelTrip,
  userRole
}: TripsProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States - Create Trip
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState<number>(0);
  const [plannedDist, setPlannedDist] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal States - Complete Trip
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [completingTripId, setCompletingTripId] = useState<string | null>(null);
  const [actualDist, setActualDist] = useState<number>(0);
  const [fuelConsumed, setFuelConsumed] = useState<number>(0);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [completeErrors, setCompleteErrors] = useState<Record<string, string>>({});

  // Real-time validation for creating trips
  const validateCreateField = (field: string, val: any, currentVehicle?: Vehicle) => {
    const updated = { ...createErrors };
    const activeVehicle = currentVehicle || vehicles.find(v => v.id === selectedVehicleId);

    if (field === 'source') {
      if (!String(val).trim()) updated.source = 'Source location is required.';
      else delete updated.source;
    }
    if (field === 'dest') {
      if (!String(val).trim()) updated.dest = 'Destination location is required.';
      else delete updated.dest;
    }
    if (field === 'vehicleId') {
      if (!val) updated.vehicleId = 'Please select a vehicle.';
      else delete updated.vehicleId;
    }
    if (field === 'driverId') {
      if (!val) updated.driverId = 'Please select a driver.';
      else delete updated.driverId;
    }
    if (field === 'cargoWeight') {
      const w = Number(val);
      if (isNaN(w) || w <= 0) {
        updated.cargoWeight = 'Cargo weight must be greater than 0 kg.';
      } else if (activeVehicle && w > activeVehicle.maxLoadCapacity) {
        updated.cargoWeight = `Cargo weight exceeds vehicle max payload capacity (${activeVehicle.maxLoadCapacity} kg).`;
      } else {
        delete updated.cargoWeight;
      }
    }
    if (field === 'plannedDist') {
      const d = Number(val);
      if (isNaN(d) || d <= 0) updated.plannedDist = 'Planned distance must be greater than 0 km.';
      else delete updated.plannedDist;
    }
    if (field === 'revenue') {
      const r = Number(val);
      if (isNaN(r) || r <= 0) updated.revenue = 'Expected revenue must be greater than ₹0.';
      else delete updated.revenue;
    }

    setCreateErrors(updated);
    return Object.keys(updated).length === 0;
  };

  const validateCreateAll = () => {
    const errs: Record<string, string> = {};
    if (!source.trim()) errs.source = 'Source location is required.';
    if (!dest.trim()) errs.dest = 'Destination location is required.';
    if (!selectedVehicleId) errs.vehicleId = 'Please select a vehicle.';
    if (!selectedDriverId) errs.driverId = 'Please select a driver.';
    
    const w = Number(cargoWeight);
    if (isNaN(w) || w <= 0) {
      errs.cargoWeight = 'Cargo weight must be greater than 0 kg.';
    } else if (activeSelectedVehicle && w > activeSelectedVehicle.maxLoadCapacity) {
      errs.cargoWeight = `Cargo weight exceeds vehicle max payload capacity (${activeSelectedVehicle.maxLoadCapacity} kg).`;
    }

    const d = Number(plannedDist);
    if (isNaN(d) || d <= 0) {
      errs.plannedDist = 'Planned distance must be greater than 0 km.';
    }

    const r = Number(revenue);
    if (isNaN(r) || r <= 0) {
      errs.revenue = 'Expected revenue must be greater than ₹0.';
    }

    setCreateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Real-time validation for completing trips
  const validateCompleteField = (field: string, val: any) => {
    const updated = { ...completeErrors };
    if (field === 'actualDist') {
      const d = Number(val);
      if (isNaN(d) || d <= 0) updated.actualDist = 'Actual distance must be greater than 0 km.';
      else delete updated.actualDist;
    }
    if (field === 'fuelConsumed') {
      const f = Number(val);
      if (isNaN(f) || f <= 0) updated.fuelConsumed = 'Fuel consumed must be greater than 0 L.';
      else delete updated.fuelConsumed;
    }
    setCompleteErrors(updated);
    return Object.keys(updated).length === 0;
  };

  const validateCompleteAll = () => {
    const errs: Record<string, string> = {};
    if (isNaN(actualDist) || actualDist <= 0) {
      errs.actualDist = 'Actual distance must be greater than 0 km.';
    }
    if (isNaN(fuelConsumed) || fuelConsumed <= 0) {
      errs.fuelConsumed = 'Fuel consumed must be greater than 0 L.';
    }
    setCompleteErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Filter & Search
  const filteredTrips = useMemo(() => {
    return trips
      .filter(t => {
        const v = vehicles.find(veh => veh.id === t.vehicleId);
        const d = drivers.find(drv => drv.id === t.driverId);
        
        const term = search.toLowerCase();
        const matchesSearch = t.source.toLowerCase().includes(term) ||
          t.destination.toLowerCase().includes(term) ||
          (v && v.registrationNumber.toLowerCase().includes(term)) ||
          (v && v.name.toLowerCase().includes(term)) ||
          (d && d.name.toLowerCase().includes(term));

        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [trips, vehicles, drivers, search, statusFilter]);

  // Mandatory Business Rules Dropdown Filtering:
  // - Retired or In Shop vehicles must never appear in dispatch selection dropdowns
  // - A vehicle already marked "On Trip" cannot be assigned to another trip
  const dispatchableVehicles = useMemo(() => {
    return vehicles.filter(v => v.status === 'Available');
  }, [vehicles]);

  // - Drivers with expired licenses or Suspended status cannot be assigned to trips
  // - A driver already marked "On Trip" cannot be assigned to another trip
  const dispatchableDrivers = useMemo(() => {
    return drivers.filter(d => {
      const isAvailable = d.status === 'Available';
      const isNotExpired = new Date(d.licenseExpiryDate) >= new Date();
      return isAvailable && isNotExpired && d.status !== 'Suspended';
    });
  }, [drivers]);

  // Selected Vehicle Info for live feedback
  const activeSelectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  // Selected Driver Info for live feedback
  const activeSelectedDriver = useMemo(() => {
    return drivers.find(d => d.id === selectedDriverId);
  }, [drivers, selectedDriverId]);

  const openCreateTripModal = () => {
    setCreateError(null);
    setCreateErrors({});
    setSource('');
    setDest('');
    setSelectedVehicleId('');
    setSelectedDriverId('');
    setCargoWeight(0);
    setPlannedDist(0);
    setRevenue(0);
    setIsCreateOpen(true);
  };

  // Create Trip Handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!validateCreateAll()) {
      setCreateError('Please correct the validation errors below.');
      return;
    }

    // Double check weight vs vehicle cap
    if (activeSelectedVehicle) {
      if (cargoWeight > activeSelectedVehicle.maxLoadCapacity) {
        setCreateError(`Cargo Weight (${cargoWeight} kg) exceeds selected Vehicle's Max Load Limit (${activeSelectedVehicle.maxLoadCapacity} kg).`);
        return;
      }
      if (activeSelectedVehicle.status === 'In Shop') {
        setCreateError(`Selected vehicle is currently In Shop and cannot be dispatched.`);
        return;
      }
      if (activeSelectedVehicle.status === 'Retired') {
        setCreateError(`Selected vehicle has been Retired and cannot be dispatched.`);
        return;
      }
      if (activeSelectedVehicle.status === 'On Trip') {
        setCreateError(`Selected vehicle is already On Trip on another active assignment.`);
        return;
      }
    }

    if (activeSelectedDriver) {
      const isLicenseExpired = new Date(activeSelectedDriver.licenseExpiryDate) < new Date();
      if (isLicenseExpired) {
        setCreateError(`Selected driver's license is expired (Expiry: ${activeSelectedDriver.licenseExpiryDate}).`);
        return;
      }
      if (activeSelectedDriver.status === 'Suspended') {
        setCreateError(`Selected driver is currently Suspended and cannot be assigned.`);
        return;
      }
      if (activeSelectedDriver.status === 'On Trip') {
        setCreateError(`Selected driver is already On Trip on another active assignment.`);
        return;
      }
    }

    try {
      onCreateTrip({
        source: source.trim(),
        destination: dest.trim(),
        vehicleId: selectedVehicleId,
        driverId: selectedDriverId,
        cargoWeight: Number(cargoWeight),
        plannedDistance: Number(plannedDist),
        revenue: Number(revenue)
      });
      setIsCreateOpen(false);
      
      // Clear forms
      setSource('');
      setDest('');
      setSelectedVehicleId('');
      setSelectedDriverId('');
      setCargoWeight(0);
      setPlannedDist(0);
      setRevenue(0);
    } catch (err: any) {
      setCreateError(err.message || 'Error creating trip planner.');
    }
  };

  // Open Completion Modal
  const openCompleteModal = (trip: Trip) => {
    setCompletingTripId(trip.id);
    setActualDist(trip.plannedDistance); // Seed actual distance with planned distance as default
    setFuelConsumed(Math.round(trip.plannedDistance * 0.15)); // Seed average 15L/100km fuel estimation
    setCompleteError(null);
    setCompleteErrors({});
    setIsCompleteOpen(true);
  };

  // Complete Trip Submit Handler
  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompleteError(null);

    if (!validateCompleteAll()) {
      setCompleteError('Please correct the validation errors below.');
      return;
    }

    if (completingTripId) {
      try {
        onCompleteTrip(completingTripId, Number(actualDist), Number(fuelConsumed));
        setIsCompleteOpen(false);
        setCompletingTripId(null);
      } catch (err: any) {
        setCompleteError(err.message || 'Error completing trip.');
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Trip ID', 'Source', 'Destination', 'Vehicle', 'Driver', 'Cargo Weight (kg)', 'Planned Distance (km)', 'Actual Distance (km)', 'Fuel Consumed (L)', 'Revenue (₹)', 'Status', 'Date Created'];
    const rows = filteredTrips.map(t => {
      const v = vehicles.find(veh => veh.id === t.vehicleId);
      const d = drivers.find(drv => drv.id === t.driverId);
      return [
        t.id,
        t.source,
        t.destination,
        v ? v.registrationNumber : 'N/A',
        d ? d.name : 'N/A',
        t.cargoWeight,
        t.plannedDistance,
        t.actualDistance || 'N/A',
        t.fuelConsumed || 'N/A',
        t.revenue,
        t.status,
        t.createdAt
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transitops_trips_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="trips-tab-content" className="space-y-6">
      
      {/* Title Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800">Trip Planner & Dispatch</h2>
          <p className="text-slate-500 text-xs mt-0.5">Control active cargo trips, dispatch available drivers/vehicles, and complete manifests with odometer tracking.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-export-trips"
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl px-4 py-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Download size={14} />
            Export CSV
          </button>

          {/* Create Trip Trigger, typical Driver/Fleet-Manager access */}
          {(userRole === 'Fleet Manager' || userRole === 'Driver') && (
            <button
              id="btn-create-trip"
              onClick={openCreateTripModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus size={14} />
              Plan Cargo Trip
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            id="search-trips"
            type="text"
            placeholder="Search city, vehicle plate, driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            id="filter-trip-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 outline-hidden cursor-pointer"
          >
            <option value="all">All Trip Statuses</option>
            <option value="Draft">Draft (Pending Dispatch)</option>
            <option value="Dispatched">Dispatched (Active)</option>
            <option value="Completed">Completed (Archived)</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Master Trips List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTrips.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 font-medium border border-slate-100 rounded-2xl">
            No trip records found matching current query parameters.
          </div>
        ) : (
          filteredTrips.map(trip => {
            const vehicle = vehicles.find(v => v.id === trip.vehicleId);
            const driver = drivers.find(d => d.id === trip.driverId);

            return (
              <div 
                key={trip.id} 
                id={`trip-card-${trip.id}`}
                className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-xs transition-all relative flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  trip.status === 'Completed' ? 'border-emerald-100 hover:border-emerald-200' :
                  trip.status === 'Dispatched' ? 'border-blue-100 hover:border-blue-200 bg-blue-50/5' :
                  trip.status === 'Cancelled' ? 'border-slate-100 bg-slate-50/20 opacity-75' :
                  'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Main Information Group */}
                <div className="space-y-3 lg:max-w-2xl">
                  {/* Row 1: Source to Destination Route display */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-slate-800 font-display flex items-center gap-1.5">
                      <Clipboard size={14} className="text-slate-400 shrink-0" />
                      {trip.source}
                    </span>
                    <ArrowRight size={14} className="text-slate-400 mx-1" />
                    <span className="text-sm font-black text-slate-800 font-display">
                      {trip.destination}
                    </span>

                    {/* Status Badge */}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ml-2 ${
                      trip.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      trip.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse-soft' :
                      trip.status === 'Cancelled' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {trip.status}
                    </span>
                  </div>

                  {/* Row 2: Assigned Vehicle + Operator Driver Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Plate:</span>
                      <span className="font-bold text-slate-700 font-mono">{vehicle?.registrationNumber || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400">({vehicle?.name || 'Unknown'})</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Driver:</span>
                      <span className="font-bold text-slate-700">{driver?.name || 'N/A'}</span>
                      {driver && (
                        <span className="text-[10px] font-bold text-emerald-600">({driver.safetyScore}/100)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Cargo Payload:</span>
                      <span className="font-bold text-slate-700">{formatNumber(trip.cargoWeight)} kg</span>
                      {vehicle && (
                        <span className="text-[10px] text-slate-400">/ {vehicle.maxLoadCapacity} max</span>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Metrics details (Planned, Actual, Fuel, revenue) */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-slate-400 text-xs">
                    <span>Planned Dist: <strong className="text-slate-600">{formatNumber(trip.plannedDistance)} km</strong></span>
                    {trip.actualDistance !== undefined && (
                      <span>Actual Dist: <strong className="text-slate-700 font-mono">{formatNumber(trip.actualDistance)} km</strong></span>
                    )}
                    {trip.fuelConsumed !== undefined && (
                      <span>Fuel Log: <strong className="text-slate-700 font-mono">{trip.fuelConsumed} L</strong></span>
                    )}
                    <span>Revenue Expected: <strong className="text-emerald-600 font-semibold">{formatCurrency(trip.revenue)}</strong></span>
                    <span>Created: <span className="text-slate-500 font-semibold">{formatDate(trip.createdAt)}</span></span>
                    {trip.dispatchedAt && (
                      <span>Dispatched: <span className="text-slate-500 font-semibold">{formatDateTime(trip.dispatchedAt)}</span></span>
                    )}
                    {trip.completedAt && (
                      <span>Completed: <span className="text-slate-500 font-semibold">{formatDateTime(trip.completedAt)}</span></span>
                    )}
                  </div>
                </div>

                {/* Dispatch & Operations Status Actions Column */}
                <div className="flex items-center gap-2 md:justify-end shrink-0 self-end lg:self-center">
                  
                  {/* Action 1: DISPATCH (Only available for Fleet Managers, for Draft Status) */}
                  {trip.status === 'Draft' && (userRole === 'Fleet Manager' || userRole === 'Driver') && (
                    <button
                      id={`btn-dispatch-trip-${trip.id}`}
                      onClick={() => {
                        if (window.confirm(`Confirm dispatch? This automatically sets both vehicle and driver status to 'On Trip'.`)) {
                          try {
                            onDispatchTrip(trip.id);
                          } catch (err: any) {
                            alert(err.message || 'Dispatch failed.');
                          }
                        }
                      }}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Send size={13} />
                      Dispatch
                    </button>
                  )}

                  {/* Action 2: COMPLETE (Requires actual mileage and fuel input, for Dispatched Status) */}
                  {trip.status === 'Dispatched' && (userRole === 'Fleet Manager' || userRole === 'Driver') && (
                    <button
                      id={`btn-complete-trip-${trip.id}`}
                      onClick={() => openCompleteModal(trip)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={13} />
                      Complete Trip
                    </button>
                  )}

                  {/* Action 3: CANCEL (For Draft and Dispatched Statuses) */}
                  {(trip.status === 'Draft' || trip.status === 'Dispatched') && (userRole === 'Fleet Manager') && (
                    <button
                      id={`btn-cancel-trip-${trip.id}`}
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to cancel this trip? Dispatched assets will be set back to 'Available'.`)) {
                          try {
                            onCancelTrip(trip.id);
                          } catch (err: any) {
                            alert(err.message || 'Cancellation failed.');
                          }
                        }
                      }}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg px-3 py-2 text-xs font-bold border border-slate-200 hover:border-rose-100 transition-all cursor-pointer"
                    >
                      <XCircle size={13} />
                      Cancel
                    </button>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PLAN CARGO TRIP MODAL */}
      {isCreateOpen && (
        <div id="create-trip-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl border border-slate-100 animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold font-display text-slate-800 text-sm uppercase tracking-wider">Plan Delivery Cargo Trip</h3>
              <button 
                id="btn-close-create-trip-modal"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="overflow-y-auto p-5 space-y-4">
              
              {createError && (
                <div id="trip-create-error" className="flex gap-2 bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-100 items-start">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <p>{createError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-trip-source" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Source / Pickup Hub *</label>
                  <input
                    id="modal-trip-source"
                    type="text"
                    required
                    placeholder="e.g. Seattle Northwest Depot"
                    value={source}
                    onChange={(e) => {
                      setSource(e.target.value);
                      validateCreateField('source', e.target.value);
                    }}
                    onBlur={(e) => validateCreateField('source', e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg ${
                      createErrors.source 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                    }`}
                  />
                  {createErrors.source && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{createErrors.source}</span>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-trip-dest" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Destination Warehouse *</label>
                  <input
                    id="modal-trip-dest"
                    type="text"
                    required
                    placeholder="e.g. Portland Hub Box-4"
                    value={dest}
                    onChange={(e) => {
                      setDest(e.target.value);
                      validateCreateField('dest', e.target.value);
                    }}
                    onBlur={(e) => validateCreateField('dest', e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg ${
                      createErrors.dest 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                    }`}
                  />
                  {createErrors.dest && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{createErrors.dest}</span>
                  )}
                </div>
              </div>

              {/* Dynamic Selectors showing available assets ONLY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="modal-trip-vehicle" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">Select Vehicle *</label>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                      {dispatchableVehicles.length} Available
                    </span>
                  </div>
                  <select
                    id="modal-trip-vehicle"
                    required
                    value={selectedVehicleId}
                    onChange={(e) => {
                      setSelectedVehicleId(e.target.value);
                      const selectedVeh = vehicles.find(v => v.id === e.target.value);
                      validateCreateField('vehicleId', e.target.value);
                      if (cargoWeight > 0) {
                        validateCreateField('cargoWeight', cargoWeight, selectedVeh);
                      }
                    }}
                    onBlur={(e) => validateCreateField('vehicleId', e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg cursor-pointer ${
                      createErrors.vehicleId 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                    }`}
                  >
                    <option value="">-- Choose available vehicle --</option>
                    {dispatchableVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} - {v.name} ({v.type}, Max Payload: {v.maxLoadCapacity}kg)
                      </option>
                    ))}
                  </select>
                  {createErrors.vehicleId && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{createErrors.vehicleId}</span>
                  )}
                  {activeSelectedVehicle && !createErrors.vehicleId && (
                    <div className="text-[10px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Max Payload capacity: {activeSelectedVehicle.maxLoadCapacity} kg. Current odometer: {formatNumber(activeSelectedVehicle.odometer)} km
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="modal-trip-driver" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">Assign Driver *</label>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                      {dispatchableDrivers.length} Compliant
                    </span>
                  </div>
                  <select
                    id="modal-trip-driver"
                    required
                    value={selectedDriverId}
                    onChange={(e) => {
                      setSelectedDriverId(e.target.value);
                      validateCreateField('driverId', e.target.value);
                    }}
                    onBlur={(e) => validateCreateField('driverId', e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg cursor-pointer ${
                      createErrors.driverId 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                    }`}
                  >
                    <option value="">-- Choose certified driver --</option>
                    {dispatchableDrivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} (Safety Score: {d.safetyScore}/100, Exp: {d.licenseExpiryDate})
                      </option>
                    ))}
                  </select>
                  {createErrors.driverId && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{createErrors.driverId}</span>
                  )}
                  {activeSelectedDriver && !createErrors.driverId && (
                    <div className="text-[10px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      License Class: {activeSelectedDriver.licenseCategory}. Safety Score: {activeSelectedDriver.safetyScore}/100.
                    </div>
                  )}
                </div>

              </div>

              {/* Cargo validation */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="modal-trip-cargo" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Cargo Weight (kg) *</label>
                  <input
                    id="modal-trip-cargo"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 450"
                    value={cargoWeight || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setCargoWeight(v);
                      validateCreateField('cargoWeight', v);
                    }}
                    onBlur={(e) => validateCreateField('cargoWeight', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg focus:outline-hidden ${
                      createErrors.cargoWeight
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500'
                        : 'bg-slate-50 border border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {createErrors.cargoWeight && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{createErrors.cargoWeight}</span>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-trip-dist" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Planned Distance (km) *</label>
                  <input
                    id="modal-trip-dist"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 280"
                    value={plannedDist || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setPlannedDist(v);
                      validateCreateField('plannedDist', v);
                    }}
                    onBlur={(e) => validateCreateField('plannedDist', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg focus:outline-hidden ${
                      createErrors.plannedDist
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500'
                        : 'bg-slate-50 border border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {createErrors.plannedDist && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{createErrors.plannedDist}</span>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-trip-revenue" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Expected Revenue (₹) *</label>
                  <input
                    id="modal-trip-revenue"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 950"
                    value={revenue || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setRevenue(v);
                      validateCreateField('revenue', v);
                    }}
                    onBlur={(e) => validateCreateField('revenue', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg focus:outline-hidden font-bold ${
                      createErrors.revenue
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500'
                        : 'bg-slate-50 border border-slate-200 focus:border-blue-500 text-emerald-600'
                    }`}
                  />
                  {createErrors.revenue && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{createErrors.revenue}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  id="btn-cancel-create-trip-form"
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-create-trip-form"
                  type="submit"
                  disabled={Object.keys(createErrors).length > 0 || (activeSelectedVehicle && cargoWeight > activeSelectedVehicle.maxLoadCapacity)}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer ${
                    Object.keys(createErrors).length > 0 || (activeSelectedVehicle && cargoWeight > activeSelectedVehicle.maxLoadCapacity)
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Plan Manifest Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE TRIP DIALOG (Odometer entry and fuel logging) */}
      {isCompleteOpen && (
        <div id="complete-trip-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-slate-100 animate-slide-up">
            
            <div className="flex justify-between items-center bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold font-display text-slate-800 text-sm uppercase tracking-wider">Close Manifest & Complete Trip</h3>
              <button 
                id="btn-close-complete-trip-modal"
                onClick={() => setIsCompleteOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-5 space-y-4">
              
              {completeError && (
                <div id="trip-complete-error" className="flex gap-2 bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-100 items-start">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <p>{completeError}</p>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Clipboard size={12} /> Route telemetry
                </div>
                {(() => {
                  const t = trips.find(trip => trip.id === completingTripId);
                  const v = vehicles.find(veh => veh.id === t?.vehicleId);
                  return t ? (
                    <div>
                      <p className="font-bold text-slate-800">{t.source} → {t.destination}</p>
                      <p className="mt-1">Planned distance: <strong className="text-slate-700">{t.plannedDistance} km</strong></p>
                      <p>Active vehicle: <strong className="text-slate-700">{v?.registrationNumber} (Odometer: {formatNumber(v?.odometer || 0)} km)</strong></p>
                    </div>
                  ) : null;
                })()}
              </div>

              <div>
                <label htmlFor="modal-actual-dist" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Gauge size={12} className="text-slate-400" /> Actual Driven Distance (km) *
                </label>
                <input
                  id="modal-actual-dist"
                  type="number"
                  min="1"
                  required
                  value={actualDist || ''}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setActualDist(v);
                    validateCompleteField('actualDist', v);
                  }}
                  onBlur={(e) => validateCompleteField('actualDist', Number(e.target.value))}
                  className={`w-full px-3 py-2 text-xs rounded-lg font-mono focus:outline-hidden ${
                    completeErrors.actualDist
                      ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500'
                      : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500'
                  }`}
                />
                {completeErrors.actualDist && (
                  <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{completeErrors.actualDist}</span>
                )}
                <p className="text-[10px] text-slate-400 mt-1 italic">This will automatically increment the vehicle's odometer.</p>
              </div>

              <div>
                <label htmlFor="modal-fuel-consumed" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Fuel size={12} className="text-slate-400" /> Fuel Consumed (Liters) *
                </label>
                <input
                  id="modal-fuel-consumed"
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={fuelConsumed || ''}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setFuelConsumed(v);
                    validateCompleteField('fuelConsumed', v);
                  }}
                  onBlur={(e) => validateCompleteField('fuelConsumed', Number(e.target.value))}
                  className={`w-full px-3 py-2 text-xs rounded-lg font-mono focus:outline-hidden ${
                    completeErrors.fuelConsumed
                      ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500'
                      : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500'
                  }`}
                />
                {completeErrors.fuelConsumed && (
                  <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{completeErrors.fuelConsumed}</span>
                )}
                <p className="text-[10px] text-slate-400 mt-1 italic">This will automatically generate a corresponding Fuel Log and Financial Fuel Expense record.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  id="btn-cancel-complete-trip-form"
                  type="button"
                  onClick={() => setIsCompleteOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-complete-trip-form"
                  type="submit"
                  disabled={Object.keys(completeErrors).length > 0}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer ${
                    Object.keys(completeErrors).length > 0 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  Archive & Restore Assets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

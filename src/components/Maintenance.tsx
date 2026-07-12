import React, { useState, useMemo } from 'react';
import { MaintenanceLog, Vehicle, MaintenanceType, MaintenanceStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { Plus, Search, Wrench, CheckCircle, AlertCircle, X, Loader, ShieldAlert, ArrowRight, DollarSign, Calendar } from 'lucide-react';

interface MaintenanceProps {
  maintenance: MaintenanceLog[];
  vehicles: Vehicle[];
  onCreateMaintenance: (log: Omit<MaintenanceLog, 'id' | 'status' | 'createdAt'>) => void;
  onCloseMaintenance: (logId: string) => void;
  canModify: boolean;
}

export default function Maintenance({
  maintenance,
  vehicles,
  onCreateMaintenance,
  onCloseMaintenance,
  canModify
}: MaintenanceProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [type, setType] = useState<MaintenanceType>('Routine Inspection');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, val: any) => {
    const updated = { ...errors };
    if (field === 'vehicleId') {
      if (!val) updated.vehicleId = 'Please select a vehicle.';
      else delete updated.vehicleId;
    }
    if (field === 'description') {
      if (!String(val).trim()) updated.description = 'Please describe the maintenance service.';
      else delete updated.description;
    }
    if (field === 'cost') {
      const c = Number(val);
      if (isNaN(c) || c < 0) updated.cost = 'Cost must be a positive number (or 0).';
      else delete updated.cost;
    }
    setErrors(updated);
    return Object.keys(updated).length === 0;
  };

  const validateAll = () => {
    const errs: Record<string, string> = {};
    if (!selectedVehicleId) errs.vehicleId = 'Please select a vehicle.';
    if (!description.trim()) errs.description = 'Please describe the maintenance service.';
    if (isNaN(cost) || cost < 0) errs.cost = 'Cost must be a positive number (or 0).';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openModal = () => {
    setErrorMsg(null);
    setErrors({});
    setSelectedVehicleId('');
    setType('Routine Inspection');
    setDescription('');
    setCost(0);
    setIsOpen(true);
  };

  // Filter & Search
  const filteredLogs = useMemo(() => {
    return maintenance
      .filter(m => {
        const v = vehicles.find(veh => veh.id === m.vehicleId);
        const term = search.toLowerCase();
        const matchesSearch = m.description.toLowerCase().includes(term) ||
          m.type.toLowerCase().includes(term) ||
          (v && v.registrationNumber.toLowerCase().includes(term)) ||
          (v && v.name.toLowerCase().includes(term));

        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [maintenance, vehicles, search, statusFilter]);

  // List of vehicles eligible for maintenance (NOT already on trip, and not retired)
  const maintenanceEligibleVehicles = useMemo(() => {
    return vehicles.filter(v => v.status === 'Available' || v.status === 'In Shop');
  }, [vehicles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateAll()) {
      setErrorMsg('Please correct the validation errors below.');
      return;
    }

    try {
      onCreateMaintenance({
        vehicleId: selectedVehicleId,
        type,
        description: description.trim(),
        cost: Number(cost)
      });
      setIsOpen(false);
      
      // Clear forms
      setSelectedVehicleId('');
      setType('Routine Inspection');
      setDescription('');
      setCost(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error opening maintenance log.');
    }
  };

  return (
    <div id="maintenance-tab-content" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800">Maintenance Shop Logs</h2>
          <p className="text-slate-500 text-xs mt-0.5">Control vehicle service orders, check current repair logs, and log mechanical costs as expenses.</p>
        </div>

        {canModify && (
          <button
            id="btn-open-maint"
            onClick={openModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus size={14} />
            Open Repair Order
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            id="search-maintenance"
            type="text"
            placeholder="Search mechanics, plate, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-700"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            id="filter-maint-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 outline-hidden cursor-pointer"
          >
            <option value="all">All Service Records</option>
            <option value="Open">Open Shop Tickets</option>
            <option value="Closed">Closed Shop Tickets</option>
          </select>
        </div>
      </div>

      {/* Maintenance Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredLogs.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 font-medium border border-slate-100 rounded-2xl md:col-span-2">
            No active or archived maintenance records found.
          </div>
        ) : (
          filteredLogs.map(log => {
            const vehicle = vehicles.find(v => v.id === log.vehicleId);
            return (
              <div 
                key={log.id} 
                id={`maint-card-${log.id}`}
                className={`bg-white p-5 rounded-2xl border shadow-2xs flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                  log.status === 'Open' 
                    ? 'border-amber-100 hover:border-amber-200 bg-amber-50/5' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Visual glow indicator for active open tickets */}
                {log.status === 'Open' && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full translate-x-12 -translate-y-12"></div>
                )}

                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${log.status === 'Open' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Wrench size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm font-display">{log.type}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Ticket ID: #{log.id}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                      log.status === 'Open' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse-soft' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {log.status}
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs font-medium leading-relaxed">
                    {log.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-50 pt-3">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Assigned Asset:</span>
                      <strong className="text-slate-700 font-mono text-xs">{vehicle?.registrationNumber || 'N/A'}</strong>
                      <span className="block text-[10px] text-slate-500">{vehicle?.name || 'Unknown model'}</span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col justify-between">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Est. Cost:</span>
                        <strong className="text-slate-700 font-semibold text-xs">{formatCurrency(log.cost)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 pt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> Checked in: {formatDate(log.createdAt)}
                    </span>
                    {log.closedAt && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle size={12} /> Released: {formatDate(log.closedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Close maintenance action triggers */}
                {log.status === 'Open' && canModify && (
                  <div className="border-t border-slate-100 pt-3 flex justify-end">
                    <button
                      id={`btn-close-maint-${log.id}`}
                      onClick={() => {
                        if (window.confirm(`Confirm closure of maintenance for ${vehicle?.registrationNumber}? This registers the $${log.cost} cost as an operating expense.`)) {
                          try {
                            onCloseMaintenance(log.id);
                          } catch (err: any) {
                            alert(err.message || 'Error closing log.');
                          }
                        }
                      }}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-2xs cursor-pointer"
                    >
                      <CheckCircle size={13} />
                      Complete Service & Release
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE MAINTENANCE LOG MODAL */}
      {isOpen && (
        <div id="maint-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-100 animate-slide-up flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold font-display text-slate-800 text-sm uppercase tracking-wider">Open Shop Repair Ticket</h3>
              <button 
                id="btn-close-maint-modal"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
              
              {errorMsg && (
                <div id="maint-form-error" className="flex gap-2 bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-100 items-start">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Vehicle selector */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="modal-maint-vehicle" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">Choose Fleet Vehicle *</label>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                    {maintenanceEligibleVehicles.length} Eligible
                  </span>
                </div>
                <select
                  id="modal-maint-vehicle"
                  required
                  value={selectedVehicleId}
                  onChange={(e) => {
                    setSelectedVehicleId(e.target.value);
                    validateField('vehicleId', e.target.value);
                  }}
                  onBlur={(e) => validateField('vehicleId', e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg cursor-pointer ${
                    errors.vehicleId 
                      ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                      : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                  }`}
                >
                  <option value="">-- Choose vehicle --</option>
                  {maintenanceEligibleVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} - {v.name} ({v.type}, Status: {v.status})
                    </option>
                  ))}
                </select>
                {errors.vehicleId && (
                  <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{errors.vehicleId}</span>
                )}
                <p className="text-[9px] text-slate-400 mt-1 italic">Note: Dispatching a vehicle into maintenance locks its status to "In Shop", which hides it from the trip dispatcher dropdown pool.</p>
              </div>

              {/* Maintenance Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-maint-type" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Service category</label>
                  <select
                    id="modal-maint-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as MaintenanceType)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2 text-xs rounded-lg cursor-pointer"
                  >
                    <option value="Routine Inspection">Routine Inspection</option>
                    <option value="Oil Change">Oil Change</option>
                    <option value="Tire Replacement">Tire Replacement</option>
                    <option value="Brake Service">Brake Service</option>
                    <option value="Engine Repair">Engine Repair</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-maint-cost" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Estimated Cost (₹) *</label>
                  <input
                    id="modal-maint-cost"
                    type="number"
                    min="0"
                    required
                    value={cost === 0 ? '0' : cost || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setCost(v);
                      validateField('cost', v);
                    }}
                    onBlur={(e) => validateField('cost', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg font-bold focus:outline-hidden ${
                      errors.cost 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500' 
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                    }`}
                  />
                  {errors.cost && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{errors.cost}</span>
                  )}
                </div>
              </div>

              {/* Service description */}
              <div>
                <label htmlFor="modal-maint-desc" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Work Order Description *</label>
                <textarea
                  id="modal-maint-desc"
                  required
                  rows={3}
                  placeholder="Detail the issues, diagnostic findings, or parts being replaced..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    validateField('description', e.target.value);
                  }}
                  onBlur={(e) => validateField('description', e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg leading-relaxed focus:outline-hidden ${
                    errors.description 
                      ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500' 
                      : 'bg-slate-50 border border-slate-200 text-slate-700'
                  }`}
                />
                {errors.description && (
                  <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{errors.description}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  id="btn-cancel-maint-form"
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-maint-form"
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer ${
                    Object.keys(errors).length > 0 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Open Service Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

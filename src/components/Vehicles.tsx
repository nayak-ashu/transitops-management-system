import React, { useState, useMemo } from 'react';
import { Vehicle, VehicleType, VehicleStatus } from '../types';
import { formatCurrency, formatNumber } from '../utils/format';
import { Plus, Search, Edit2, Trash2, Download, AlertCircle, X, Check, Filter } from 'lucide-react';

interface VehiclesProps {
  vehicles: Vehicle[];
  onSave: (vehicle: Omit<Vehicle, 'id' | 'createdAt'> & { id?: string }) => void;
  onDelete: (id: string) => void;
  canModify: boolean;
}

export default function Vehicles({ vehicles, onSave, onDelete, canModify }: VehiclesProps) {
  // Master states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<keyof Vehicle>('registrationNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [regNum, setRegNum] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<VehicleType>('Light Van');
  const [maxLoad, setMaxLoad] = useState<number>(1000);
  const [odo, setOdo] = useState<number>(0);
  const [acqCost, setAcqCost] = useState<number>(25000);
  const [status, setStatus] = useState<VehicleStatus>('Available');
  const [region, setRegion] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time Field Validation
  const validateField = (field: string, val: any) => {
    const updatedErrors = { ...errors };

    if (field === 'regNum') {
      const v = String(val).toUpperCase().trim();
      if (!v) {
        updatedErrors.regNum = 'Registration plate is required.';
      } else if (!/^[A-Z0-9-\s]{3,15}$/i.test(v)) {
        updatedErrors.regNum = 'Must be 3-15 alphanumeric characters (spaces/hyphens allowed).';
      } else if (vehicles.some(item => item.registrationNumber.toUpperCase() === v && item.id !== editingId)) {
        updatedErrors.regNum = 'Registration plate already exists.';
      } else {
        delete updatedErrors.regNum;
      }
    }

    if (field === 'name') {
      const v = String(val).trim();
      if (!v) {
        updatedErrors.name = 'Vehicle model/name is required.';
      } else if (v.length < 3) {
        updatedErrors.name = 'Model name must be at least 3 characters.';
      } else {
        delete updatedErrors.name;
      }
    }

    if (field === 'maxLoad') {
      const v = Number(val);
      if (isNaN(v) || v <= 0) {
        updatedErrors.maxLoad = 'Payload capacity must be greater than 0 kg.';
      } else {
        delete updatedErrors.maxLoad;
      }
    }

    if (field === 'odo') {
      const v = Number(val);
      if (isNaN(v) || v < 0) {
        updatedErrors.odo = 'Odometer reading cannot be negative.';
      } else {
        delete updatedErrors.odo;
      }
    }

    if (field === 'acqCost') {
      const v = Number(val);
      if (isNaN(v) || v < 0) {
        updatedErrors.acqCost = 'Acquisition cost cannot be negative.';
      } else {
        delete updatedErrors.acqCost;
      }
    }

    setErrors(updatedErrors);
    return Object.keys(updatedErrors).length === 0;
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};

    const cleanReg = regNum.toUpperCase().trim();
    if (!cleanReg) {
      newErrors.regNum = 'Registration plate is required.';
    } else if (!/^[A-Z0-9-\s]{3,15}$/i.test(cleanReg)) {
      newErrors.regNum = 'Must be 3-15 alphanumeric characters (spaces/hyphens allowed).';
    } else if (vehicles.some(item => item.registrationNumber.toUpperCase() === cleanReg && item.id !== editingId)) {
      newErrors.regNum = 'Registration plate already exists.';
    }

    const cleanName = name.trim();
    if (!cleanName) {
      newErrors.name = 'Vehicle model/name is required.';
    } else if (cleanName.length < 3) {
      newErrors.name = 'Model name must be at least 3 characters.';
    }

    if (isNaN(maxLoad) || maxLoad <= 0) {
      newErrors.maxLoad = 'Payload capacity must be greater than 0 kg.';
    }

    if (isNaN(odo) || odo < 0) {
      newErrors.odo = 'Odometer reading cannot be negative.';
    }

    if (isNaN(acqCost) || acqCost < 0) {
      newErrors.acqCost = 'Acquisition cost cannot be negative.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sorting helper
  const toggleSort = (col: keyof Vehicle) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Sorting & Filtering
  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter(v => {
        const matchesSearch = v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
          v.name.toLowerCase().includes(search.toLowerCase()) ||
          (v.region && v.region.toLowerCase().includes(search.toLowerCase()));
        
        const matchesType = typeFilter === 'all' || v.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' 
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        return 0;
      });
  }, [vehicles, search, typeFilter, statusFilter, sortColumn, sortDirection]);

  // Open Modal Helper
  const openModal = (vehicle?: Vehicle) => {
    setErrorMsg(null);
    setErrors({});
    if (vehicle) {
      setEditingId(vehicle.id);
      setRegNum(vehicle.registrationNumber);
      setName(vehicle.name);
      setType(vehicle.type);
      setMaxLoad(vehicle.maxLoadCapacity);
      setOdo(vehicle.odometer);
      setAcqCost(vehicle.acquisitionCost);
      setStatus(vehicle.status);
      setRegion(vehicle.region || '');
    } else {
      setEditingId(undefined);
      setRegNum('');
      setName('');
      setType('Light Van');
      setMaxLoad(1000);
      setOdo(0);
      setAcqCost(30000);
      setStatus('Available');
      setRegion('Seattle Hub');
    }
    setIsOpen(true);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateAll()) {
      setErrorMsg('Please correct the validation errors below.');
      return;
    }

    try {
      onSave({
        id: editingId,
        registrationNumber: regNum.toUpperCase().trim(),
        name: name.trim(),
        type,
        maxLoadCapacity: Number(maxLoad),
        odometer: Number(odo),
        acquisitionCost: Number(acqCost),
        status,
        region: region.trim()
      });
      setIsOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving vehicle.');
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = ['Registration Number', 'Name/Model', 'Type', 'Max Load Capacity (kg)', 'Odometer (km)', 'Acquisition Cost (₹)', 'Status', 'Region', 'Created At'];
    const rows = filteredVehicles.map(v => [
      v.registrationNumber,
      v.name,
      v.type,
      v.maxLoadCapacity,
      v.odometer,
      v.acquisitionCost,
      v.status,
      v.region || 'N/A',
      v.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transitops_vehicles_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="vehicles-tab-content" className="space-y-6">
      
      {/* Title & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800">Vehicle Registry</h2>
          <p className="text-slate-500 text-xs mt-0.5">Master directory of operational logistics assets, fleet state tracking, and cargo capabilities.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-export-vehicles"
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl px-4 py-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Download size={14} />
            Export CSV
          </button>

          {canModify && (
            <button
              id="btn-add-vehicle"
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus size={14} />
              Add Vehicle
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
            id="search-vehicles"
            type="text"
            placeholder="Search registration, model, region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            id="sort-vehicles"
            value={
              sortColumn === 'registrationNumber' && sortDirection === 'asc' ? 'reg' :
              sortColumn === 'maxLoadCapacity' && sortDirection === 'desc' ? 'load-desc' :
              sortColumn === 'odometer' && sortDirection === 'desc' ? 'odo-desc' :
              sortColumn === 'acquisitionCost' && sortDirection === 'desc' ? 'cost-desc' :
              'custom'
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'reg') {
                setSortColumn('registrationNumber');
                setSortDirection('asc');
              } else if (val === 'load-desc') {
                setSortColumn('maxLoadCapacity');
                setSortDirection('desc');
              } else if (val === 'odo-desc') {
                setSortColumn('odometer');
                setSortDirection('desc');
              } else if (val === 'cost-desc') {
                setSortColumn('acquisitionCost');
                setSortDirection('desc');
              }
            }}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 outline-hidden cursor-pointer"
          >
            <option value="reg">Sort: Plate Number (Asc)</option>
            <option value="load-desc">Sort: Max Cargo Capacity (Desc)</option>
            <option value="odo-desc">Sort: Highest Mileage</option>
            <option value="cost-desc">Sort: Highest Value</option>
            {sortColumn !== 'registrationNumber' && sortColumn !== 'maxLoadCapacity' && sortColumn !== 'odometer' && sortColumn !== 'acquisitionCost' && (
              <option value="custom">Sort: Clicked Column</option>
            )}
          </select>

          <select
            id="filter-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 outline-hidden cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="Heavy Truck">Heavy Trucks</option>
            <option value="Light Van">Light Vans</option>
            <option value="Bus">Buses</option>
            <option value="Cargo Car">Cargo Cars</option>
          </select>

          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 outline-hidden cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Grid of Vehicles or Master Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="vehicles-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider select-none">
                <th className="py-3 px-5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('registrationNumber')}>
                  Plate / Registry ID {sortColumn === 'registrationNumber' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('name')}>
                  Name / Make {sortColumn === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('type')}>
                  Class Type {sortColumn === 'type' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('maxLoadCapacity')}>
                  Max Payload {sortColumn === 'maxLoadCapacity' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('odometer')}>
                  Odometer {sortColumn === 'odometer' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('region')}>
                  Region Hub {sortColumn === 'region' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('acquisitionCost')}>
                  Value / Cost {sortColumn === 'acquisitionCost' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('status')}>
                  Status {sortColumn === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                {canModify && <th className="py-3 px-5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No vehicles found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-700">
                      {v.registrationNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {v.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {v.type}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {formatNumber(v.maxLoadCapacity)} kg
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {formatNumber(v.odometer)} km
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {v.region || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">
                      {formatCurrency(v.acquisitionCost)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        v.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        v.status === 'On Trip' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        v.status === 'In Shop' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse-soft' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    {canModify && (
                      <td className="py-3.5 px-5 text-right space-x-1 whitespace-nowrap">
                        <button
                          id={`btn-edit-vehicle-${v.id}`}
                          onClick={() => openModal(v)}
                          disabled={v.status === 'On Trip'}
                          title={v.status === 'On Trip' ? "Cannot edit while on a trip" : "Edit vehicle details"}
                          className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors inline-block cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          id={`btn-delete-vehicle-${v.id}`}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete vehicle ${v.registrationNumber}?`)) {
                              try {
                                onDelete(v.id);
                              } catch (err: any) {
                                alert(err.message || 'Failed to delete vehicle.');
                              }
                            }
                          }}
                          disabled={v.status === 'On Trip' || v.status === 'In Shop'}
                          title={v.status === 'On Trip' || v.status === 'In Shop' ? "Cannot delete while busy" : "Delete vehicle"}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors inline-block cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Add/Edit Modal */}
      {isOpen && (
        <div id="vehicle-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-100 animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold font-display text-slate-800 text-sm uppercase tracking-wider">
                {editingId ? 'Edit Fleet Asset' : 'Register New Asset'}
              </h3>
              <button 
                id="btn-close-vehicle-modal"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Scrollable Wrapper */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
              
              {errorMsg && (
                <div id="vehicle-form-error" className="flex gap-2 bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-100 items-start">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-vehicle-reg" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Registration Plate *</label>
                  <input
                    id="modal-vehicle-reg"
                    type="text"
                    required
                    placeholder="e.g. VAN-05"
                    value={regNum}
                    onChange={(e) => {
                      setRegNum(e.target.value);
                      validateField('regNum', e.target.value);
                    }}
                    onBlur={(e) => validateField('regNum', e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg uppercase ${
                      errors.regNum 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                    }`}
                  />
                  {errors.regNum && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{errors.regNum}</span>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-vehicle-type" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Class Type</label>
                  <select
                    id="modal-vehicle-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as VehicleType)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2 text-xs rounded-lg cursor-pointer"
                  >
                    <option value="Light Van">Light Van</option>
                    <option value="Heavy Truck">Heavy Truck</option>
                    <option value="Bus">Bus</option>
                    <option value="Cargo Car">Cargo Car</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="modal-vehicle-name" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Model Name *</label>
                <input
                  id="modal-vehicle-name"
                  type="text"
                  required
                  placeholder="e.g. Ford Transit Commercial Van"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    validateField('name', e.target.value);
                  }}
                  onBlur={(e) => validateField('name', e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg ${
                    errors.name 
                      ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                      : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                  }`}
                />
                {errors.name && (
                  <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{errors.name}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-vehicle-load" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Max Payload Capacity (kg) *</label>
                  <input
                    id="modal-vehicle-load"
                    type="number"
                    min="1"
                    required
                    value={maxLoad || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setMaxLoad(v);
                      validateField('maxLoad', v);
                    }}
                    onBlur={(e) => validateField('maxLoad', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg ${
                      errors.maxLoad 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                    }`}
                  />
                  {errors.maxLoad && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{errors.maxLoad}</span>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-vehicle-odo" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Current Odometer (km) *</label>
                  <input
                    id="modal-vehicle-odo"
                    type="number"
                    min="0"
                    required
                    value={odo === 0 ? '0' : odo || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setOdo(v);
                      validateField('odo', v);
                    }}
                    onBlur={(e) => validateField('odo', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg ${
                      errors.odo 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                    }`}
                  />
                  {errors.odo && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{errors.odo}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-vehicle-cost" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Acquisition Cost (₹) *</label>
                  <input
                    id="modal-vehicle-cost"
                    type="number"
                    min="0"
                    required
                    value={acqCost === 0 ? '0' : acqCost || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setAcqCost(v);
                      validateField('acqCost', v);
                    }}
                    onBlur={(e) => validateField('acqCost', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg ${
                      errors.acqCost 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                    }`}
                  />
                  {errors.acqCost && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{errors.acqCost}</span>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-vehicle-region" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Assigned Region</label>
                  <input
                    id="modal-vehicle-region"
                    type="text"
                    placeholder="e.g. Seattle West Hub"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2 text-xs rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-vehicle-status" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Asset Status</label>
                <select
                  id="modal-vehicle-status"
                  value={status}
                  disabled={status === 'On Trip'} // Business Rule safety locks
                  onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2 text-xs rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip" disabled>On Trip (Automatic)</option>
                  <option value="In Shop">In Shop</option>
                  <option value="Retired">Retired</option>
                </select>
                {status === 'On Trip' && (
                  <p className="text-[10px] text-slate-400 mt-1 italic">Note: Status locked while currently dispatched on an active delivery.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  id="btn-cancel-vehicle-form"
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-vehicle-form"
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer ${
                    Object.keys(errors).length > 0 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {editingId ? 'Save Changes' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

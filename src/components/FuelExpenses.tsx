import React, { useState, useMemo } from 'react';
import { FuelLog, Expense, Vehicle, ExpenseCategory } from '../types';
import { formatCurrency, formatDate, formatNumber } from '../utils/format';
import { Plus, Search, Trash2, Fuel, Receipt, DollarSign, Calendar, Info, AlertCircle, X, Filter } from 'lucide-react';

interface FuelExpensesProps {
  fuelLogs: FuelLog[];
  expenses: Expense[];
  vehicles: Vehicle[];
  onAddFuelLog: (log: Omit<FuelLog, 'id'>) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteFuelLog: (id: string) => void;
  canModify: boolean;
}

export default function FuelExpenses({
  fuelLogs,
  expenses,
  vehicles,
  onAddFuelLog,
  onAddExpense,
  onDeleteExpense,
  onDeleteFuelLog,
  canModify
}: FuelExpensesProps) {
  // Tabs: 'fuel' or 'expenses'
  const [activeSubTab, setActiveSubTab] = useState<'fuel' | 'expenses'>('fuel');
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');

  // Modal State - Fuel Log
  const [isFuelOpen, setIsFuelOpen] = useState(false);
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [liters, setLiters] = useState<number>(0);
  const [fuelCost, setFuelCost] = useState<number>(0);
  const [fuelOdo, setFuelOdo] = useState<number>(0);
  const [fuelDate, setFuelDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fuelError, setFuelError] = useState<string | null>(null);

  // Modal State - Expense
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Tolls');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDesc, setExpDesc] = useState('');
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expError, setExpError] = useState<string | null>(null);

  const [fuelErrors, setFuelErrors] = useState<Record<string, string>>({});
  const [expErrors, setExpErrors] = useState<Record<string, string>>({});

  const validateFuelField = (field: string, val: any, currentVehicleId?: string) => {
    const updated = { ...fuelErrors };
    const targetVehId = currentVehicleId !== undefined ? currentVehicleId : fuelVehicleId;

    if (field === 'vehicleId') {
      if (!val) updated.vehicleId = 'Please select a vehicle.';
      else delete updated.vehicleId;
    }
    if (field === 'liters') {
      const l = Number(val);
      if (isNaN(l) || l <= 0) updated.liters = 'Fuel volume must be greater than 0 L.';
      else delete updated.liters;
    }
    if (field === 'cost') {
      const c = Number(val);
      if (isNaN(c) || c <= 0) updated.cost = 'Fuel cost must be greater than ₹0.';
      else delete updated.cost;
    }
    if (field === 'odometer') {
      const o = Number(val);
      if (isNaN(o) || o < 0) {
        updated.odometer = 'Odometer reading cannot be negative.';
      } else {
        const veh = vehicles.find(v => v.id === targetVehId);
        if (veh && o < veh.odometer) {
          updated.odometer = `Odometer is less than vehicle's current odometer (${veh.odometer} km).`;
        } else {
          delete updated.odometer;
        }
      }
    }
    setFuelErrors(updated);
    return Object.keys(updated).length === 0;
  };

  const validateFuelAll = () => {
    const errs: Record<string, string> = {};
    if (!fuelVehicleId) errs.vehicleId = 'Please select a vehicle.';
    
    const l = Number(liters);
    if (isNaN(l) || l <= 0) errs.liters = 'Fuel volume must be greater than 0 L.';

    const c = Number(fuelCost);
    if (isNaN(c) || c <= 0) errs.cost = 'Fuel cost must be greater than ₹0.';

    const o = Number(fuelOdo);
    if (isNaN(o) || o < 0) {
      errs.odometer = 'Odometer reading cannot be negative.';
    } else {
      const veh = vehicles.find(v => v.id === fuelVehicleId);
      if (veh && o < veh.odometer) {
        errs.odometer = `Odometer is less than vehicle's current odometer (${veh.odometer} km).`;
      }
    }

    setFuelErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateExpField = (field: string, val: any) => {
    const updated = { ...expErrors };
    if (field === 'vehicleId') {
      if (!val) updated.vehicleId = 'Please select a vehicle.';
      else delete updated.vehicleId;
    }
    if (field === 'amount') {
      const a = Number(val);
      if (isNaN(a) || a <= 0) updated.amount = 'Amount must be greater than ₹0.';
      else delete updated.amount;
    }
    if (field === 'description') {
      if (!String(val).trim()) updated.description = 'Please provide a description.';
      else delete updated.description;
    }
    setExpErrors(updated);
    return Object.keys(updated).length === 0;
  };

  const validateExpAll = () => {
    const errs: Record<string, string> = {};
    if (!expVehicleId) errs.vehicleId = 'Please select a vehicle.';
    
    const a = Number(expAmount);
    if (isNaN(a) || a <= 0) errs.amount = 'Amount must be greater than ₹0.';

    if (!expDesc.trim()) errs.description = 'Please provide a description.';

    setExpErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openFuelModal = () => {
    setFuelError(null);
    setFuelErrors({});
    setFuelVehicleId('');
    setLiters(0);
    setFuelCost(0);
    setFuelOdo(0);
    setFuelDate(new Date().toISOString().split('T')[0]);
    setIsFuelOpen(true);
  };

  const openExpenseModal = () => {
    setExpError(null);
    setExpErrors({});
    setExpVehicleId('');
    setExpCategory('Tolls');
    setExpAmount(0);
    setExpDesc('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setIsExpenseOpen(true);
  };

  // Filtered Fuel Logs
  const filteredFuelLogs = useMemo(() => {
    return fuelLogs
      .filter(f => {
        const v = vehicles.find(veh => veh.id === f.vehicleId);
        const matchesSearch = v ? v.registrationNumber.toLowerCase().includes(search.toLowerCase()) : false;
        const matchesVehicle = vehicleFilter === 'all' || f.vehicleId === vehicleFilter;
        return matchesSearch && matchesVehicle;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [fuelLogs, vehicles, search, vehicleFilter]);

  // Filtered General Expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => {
        const v = vehicles.find(veh => veh.id === e.vehicleId);
        const matchesSearch = (v ? v.registrationNumber.toLowerCase().includes(search.toLowerCase()) : false) ||
          e.description.toLowerCase().includes(search.toLowerCase()) ||
          e.category.toLowerCase().includes(search.toLowerCase());
        const matchesVehicle = vehicleFilter === 'all' || e.vehicleId === vehicleFilter;
        return matchesSearch && matchesVehicle;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, vehicles, search, vehicleFilter]);

  // Calculate total operational cost per selected vehicle
  const totalOperatingCostsByVehicle = useMemo(() => {
    const summary: Record<string, { reg: string; model: string; fuel: number; maint: number; other: number; total: number }> = {};
    
    vehicles.forEach(v => {
      summary[v.id] = {
        reg: v.registrationNumber,
        model: v.name,
        fuel: 0,
        maint: 0,
        other: 0,
        total: 0
      };
    });

    expenses.forEach(e => {
      if (summary[e.vehicleId]) {
        if (e.category === 'Fuel') {
          summary[e.vehicleId].fuel += e.amount;
        } else if (e.category === 'Maintenance') {
          summary[e.vehicleId].maint += e.amount;
        } else {
          summary[e.vehicleId].other += e.amount;
        }
        summary[e.vehicleId].total += e.amount;
      }
    });

    return Object.values(summary).filter(item => item.total > 0);
  }, [vehicles, expenses]);

  // Handle Fuel Submit
  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFuelError(null);

    if (!validateFuelAll()) {
      setFuelError('Please correct the validation errors below.');
      return;
    }

    try {
      onAddFuelLog({
        vehicleId: fuelVehicleId,
        liters: Number(liters),
        cost: Number(fuelCost),
        odometer: Number(fuelOdo),
        date: fuelDate
      });
      setIsFuelOpen(false);

      // Reset
      setFuelVehicleId('');
      setLiters(0);
      setFuelCost(0);
      setFuelOdo(0);
    } catch (err: any) {
      setFuelError(err.message || 'Error logging fuel.');
    }
  };

  // Handle Expense Submit
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setExpError(null);

    if (!validateExpAll()) {
      setExpError('Please correct the validation errors below.');
      return;
    }

    try {
      onAddExpense({
        vehicleId: expVehicleId,
        category: expCategory,
        amount: Number(expAmount),
        description: expDesc.trim(),
        date: expDate
      });
      setIsExpenseOpen(false);

      // Reset
      setExpVehicleId('');
      setExpAmount(0);
      setExpDesc('');
    } catch (err: any) {
      setExpError(err.message || 'Error logging expense.');
    }
  };

  return (
    <div id="fuel-expenses-tab" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800">Operational Expenses</h2>
          <p className="text-slate-500 text-xs mt-0.5">Record fuel stops, toll costs, and other compliance charges. Financial records update operational cost and vehicle ROI metrics instantly.</p>
        </div>

        {canModify && (
          <div className="flex items-center gap-3">
            <button
              id="btn-add-fuel"
              onClick={openFuelModal}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              <Fuel size={13} />
              Log Fuel
            </button>
            <button
              id="btn-add-expense"
              onClick={openExpenseModal}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              <Receipt size={13} />
              Add Expense
            </button>
          </div>
        )}
      </div>

      {/* Grid of total costs per vehicle summary */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 shadow-2xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Info size={14} /> Total Operational Cost per Vehicle (Fuel + Maintenance + Other)
        </h3>
        
        {totalOperatingCostsByVehicle.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No operating costs have been recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-h-40 overflow-y-auto pr-1">
            {totalOperatingCostsByVehicle.map(item => (
              <div key={item.reg} className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <strong className="text-slate-800 font-bold block">{item.reg}</strong>
                  <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[120px]">{item.model}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-800 font-extrabold font-mono block">{formatCurrency(item.total)}</span>
                  <span className="text-[9px] text-slate-400 block font-medium">F: {formatCurrency(item.fuel)} | M: {formatCurrency(item.maint)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex border-b border-slate-100 items-center justify-between gap-4">
        <div className="flex gap-4">
          <button
            id="subtab-fuel"
            onClick={() => {
              setSearch('');
              setActiveSubTab('fuel');
            }}
            className={`pb-3 font-semibold font-display text-sm relative transition-all cursor-pointer ${
              activeSubTab === 'fuel' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Fuel Logs
            {activeSubTab === 'fuel' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-fade-in" />
            )}
          </button>
          
          <button
            id="subtab-expenses"
            onClick={() => {
              setSearch('');
              setActiveSubTab('expenses');
            }}
            className={`pb-3 font-semibold font-display text-sm relative transition-all cursor-pointer ${
              activeSubTab === 'expenses' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            General Expenses
            {activeSubTab === 'expenses' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-fade-in" />
            )}
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-3 pb-2.5">
          <div className="relative w-48 md:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
              <Search size={12} />
            </span>
            <input
              id="subtab-search"
              type="text"
              placeholder={activeSubTab === 'fuel' ? "Search plates..." : "Search plates, description..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-700"
            />
          </div>

          <select
            id="subtab-filter-vehicle"
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-600 cursor-pointer outline-hidden"
          >
            <option value="all">All Vehicles</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.registrationNumber}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Lists Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        
        {/* SUBTAB: FUEL LOGS */}
        {activeSubTab === 'fuel' && (
          <div className="overflow-x-auto">
            <table id="fuel-logs-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-5">Odometer at Fill</th>
                  <th className="py-3 px-4">Vehicle Plate</th>
                  <th className="py-3 px-4 text-center">Volume Liters</th>
                  <th className="py-3 px-4 text-center">Total Cost</th>
                  <th className="py-3 px-4 text-center">Unit Price / L</th>
                  <th className="py-3 px-4">Log Date</th>
                  {canModify && <th className="py-3 px-5 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredFuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No fuel log records found.
                    </td>
                  </tr>
                ) : (
                  filteredFuelLogs.map((log) => {
                    const vehicle = vehicles.find(v => v.id === log.vehicleId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-slate-600 font-bold">
                          {formatNumber(log.odometer)} km
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {vehicle?.registrationNumber || 'N/A'} <span className="text-[10px] text-slate-400 font-medium">({vehicle?.name})</span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-600 font-mono">
                          {log.liters.toFixed(1)} L
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-800 font-extrabold font-mono">
                          {formatCurrency(log.cost)}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500 font-mono">
                          {formatCurrency(log.cost / log.liters)} / L
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {formatDate(log.date)}
                        </td>
                        {canModify && (
                          <td className="py-3.5 px-5 text-right">
                            <button
                              id={`btn-delete-fuel-${log.id}`}
                              onClick={() => {
                                if (window.confirm('Delete this fuel log? This will not retroactively delete the associated synced general expense.')) {
                                  onDeleteFuelLog(log.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors inline-block cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB: GENERAL EXPENSES */}
        {activeSubTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table id="expenses-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-5">Expense Date</th>
                  <th className="py-3 px-4">Vehicle Plate</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Amount</th>
                  {canModify && <th className="py-3 px-5 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const vehicle = vehicles.find(v => v.id === exp.vehicleId);
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-5 text-slate-500 font-medium">
                          {formatDate(exp.date)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {vehicle?.registrationNumber || 'N/A'} <span className="text-[10px] text-slate-400 font-medium">({vehicle?.name})</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[9px] border uppercase ${
                            exp.category === 'Fuel' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            exp.category === 'Maintenance' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            exp.category === 'Tolls' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            exp.category === 'Insurance' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 leading-normal max-w-sm truncate" title={exp.description}>
                          {exp.description}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-800 font-extrabold font-mono">
                          {formatCurrency(exp.amount)}
                        </td>
                        {canModify && (
                          <td className="py-3.5 px-5 text-right">
                            <button
                              id={`btn-delete-expense-${exp.id}`}
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this expense record?')) {
                                  onDeleteExpense(exp.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors inline-block cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* FUEL LOG MODAL */}
      {isFuelOpen && (
        <div id="fuel-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-100 animate-slide-up flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold font-display text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Fuel size={16} /> Log Fuel Dispatch Record
              </h3>
              <button 
                id="btn-close-fuel-modal"
                onClick={() => setIsFuelOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFuelSubmit} className="overflow-y-auto p-5 space-y-4">
              
              {fuelError && (
                <div id="fuel-form-error" className="flex gap-2 bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-100 items-start">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>{fuelError}</p>
                </div>
              )}

              <div>
                <label htmlFor="modal-fuel-veh" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Select Vehicle Plate *</label>
                <select
                  id="modal-fuel-veh"
                  required
                  value={fuelVehicleId}
                  onChange={(e) => {
                    setFuelVehicleId(e.target.value);
                    validateFuelField('vehicleId', e.target.value, e.target.value);
                  }}
                  onBlur={(e) => validateFuelField('vehicleId', e.target.value, e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg cursor-pointer focus:outline-hidden ${
                    fuelErrors.vehicleId 
                      ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500' 
                      : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500'
                  }`}
                >
                  <option value="">-- Choose vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} - {v.name} (Odo: {v.odometer} km)</option>
                  ))}
                </select>
                {fuelErrors.vehicleId && (
                  <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{fuelErrors.vehicleId}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-fuel-liters" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Fuel Volume (Liters) *</label>
                  <input
                    id="modal-fuel-liters"
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={liters || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setLiters(v);
                      validateFuelField('liters', v);
                    }}
                    onBlur={(e) => validateFuelField('liters', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg font-mono focus:outline-hidden ${
                      fuelErrors.liters 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500'
                    }`}
                  />
                  {fuelErrors.liters && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{fuelErrors.liters}</span>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-fuel-cost" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Total Fuel Cost (₹) *</label>
                  <input
                    id="modal-fuel-cost"
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={fuelCost || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setFuelCost(v);
                      validateFuelField('cost', v);
                    }}
                    onBlur={(e) => validateFuelField('cost', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg font-mono focus:outline-hidden ${
                      fuelErrors.cost 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500'
                    }`}
                  />
                  {fuelErrors.cost && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{fuelErrors.cost}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-fuel-odo" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Odometer reading (km) *</label>
                  <input
                    id="modal-fuel-odo"
                    type="number"
                    min="0"
                    required
                    value={fuelOdo || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setFuelOdo(v);
                      validateFuelField('odometer', v);
                    }}
                    onBlur={(e) => validateFuelField('odometer', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg font-mono focus:outline-hidden ${
                      fuelErrors.odometer 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500'
                    }`}
                  />
                  {fuelErrors.odometer && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{fuelErrors.odometer}</span>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-fuel-date" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Purchase Date *</label>
                  <input
                    id="modal-fuel-date"
                    type="date"
                    required
                    value={fuelDate}
                    onChange={(e) => setFuelDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2 text-xs rounded-lg"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  id="btn-cancel-fuel-form"
                  type="button"
                  onClick={() => setIsFuelOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-fuel-form"
                  type="submit"
                  disabled={Object.keys(fuelErrors).length > 0}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer ${
                    Object.keys(fuelErrors).length > 0 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Log Fuel Stop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERAL EXPENSE MODAL */}
      {isExpenseOpen && (
        <div id="expense-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-100 animate-slide-up flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold font-display text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Receipt size={16} /> Log General Operational Expense
              </h3>
              <button 
                id="btn-close-expense-modal"
                onClick={() => setIsExpenseOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="overflow-y-auto p-5 space-y-4">
              
              {expError && (
                <div id="expense-form-error" className="flex gap-2 bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-100 items-start">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>{expError}</p>
                </div>
              )}

              <div>
                <label htmlFor="modal-exp-veh" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Select Vehicle Plate *</label>
                <select
                  id="modal-exp-veh"
                  required
                  value={expVehicleId}
                  onChange={(e) => {
                    setExpVehicleId(e.target.value);
                    validateExpField('vehicleId', e.target.value);
                  }}
                  onBlur={(e) => validateExpField('vehicleId', e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg cursor-pointer focus:outline-hidden ${
                    expErrors.vehicleId 
                      ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500' 
                      : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500'
                  }`}
                >
                  <option value="">-- Choose vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} - {v.name}</option>
                  ))}
                </select>
                {expErrors.vehicleId && (
                  <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{expErrors.vehicleId}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-exp-cat" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Expense Category</label>
                  <select
                    id="modal-exp-cat"
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2 text-xs rounded-lg cursor-pointer"
                  >
                    <option value="Tolls">Tolls</option>
                    <option value="Parking">Parking</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Maintenance">Maintenance / Shop Cost</option>
                    <option value="Other">Other Operational Charge</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-exp-amount" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Cost Amount (₹) *</label>
                  <input
                    id="modal-exp-amount"
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={expAmount || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setExpAmount(v);
                      validateExpField('amount', v);
                    }}
                    onBlur={(e) => validateExpField('amount', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg font-mono focus:outline-hidden ${
                      expErrors.amount 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500' 
                        : 'bg-slate-50 border border-slate-200 text-slate-850 font-bold'
                    }`}
                  />
                  {expErrors.amount && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{expErrors.amount}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-exp-date" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Expense Date *</label>
                  <input
                    id="modal-exp-date"
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2 text-xs rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-exp-desc" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Description / Notes *</label>
                <input
                  id="modal-exp-desc"
                  type="text"
                  required
                  placeholder="e.g. Toll road charges on I-90 East"
                  value={expDesc}
                  onChange={(e) => {
                    setExpDesc(e.target.value);
                    validateExpField('description', e.target.value);
                  }}
                  onBlur={(e) => validateExpField('description', e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg focus:outline-hidden ${
                    expErrors.description 
                      ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500' 
                      : 'bg-slate-50 border border-slate-200 text-slate-700'
                  }`}
                />
                {expErrors.description && (
                  <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{expErrors.description}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  id="btn-cancel-expense-form"
                  type="button"
                  onClick={() => setIsExpenseOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-expense-form"
                  type="submit"
                  disabled={Object.keys(expErrors).length > 0}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer ${
                    Object.keys(expErrors).length > 0 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

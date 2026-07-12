import React, { useState, useMemo } from 'react';
import { Driver, LicenseCategory, DriverStatus } from '../types';
import { Plus, Search, Edit2, Trash2, Download, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { formatDate } from '../utils/format';

interface DriversProps {
  drivers: Driver[];
  onSave: (driver: Omit<Driver, 'id' | 'createdAt'> & { id?: string }) => void;
  onDelete: (id: string) => void;
  canModify: boolean;
}

export default function Drivers({ drivers, onSave, onDelete, canModify }: DriversProps) {
  // Master states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<keyof Driver>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState<LicenseCategory>('Class B CDL');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [safetyScore, setSafetyScore] = useState<number>(100);
  const [status, setStatus] = useState<DriverStatus>('Available');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time Field Validation for Driver
  const validateField = (field: string, val: any) => {
    const updatedErrors = { ...errors };

    if (field === 'name') {
      const v = String(val).trim();
      if (!v) {
        updatedErrors.name = 'Driver Name is required.';
      } else if (v.length < 3) {
        updatedErrors.name = 'Driver Name must be at least 3 characters.';
      } else {
        delete updatedErrors.name;
      }
    }

    if (field === 'licenseNumber') {
      const v = String(val).toUpperCase().trim();
      if (!v) {
        updatedErrors.licenseNumber = 'License Number is required.';
      } else if (!/^[A-Z0-9-\s]{5,20}$/i.test(v)) {
        updatedErrors.licenseNumber = 'Must be 5-20 alphanumeric characters (spaces/hyphens allowed).';
      } else if (drivers.some(d => d.licenseNumber.toUpperCase() === v && d.id !== editingId)) {
        updatedErrors.licenseNumber = 'This license number is already registered.';
      } else {
        delete updatedErrors.licenseNumber;
      }
    }

    if (field === 'licenseExpiryDate') {
      if (!val) {
        updatedErrors.licenseExpiryDate = 'License Expiry Date is required.';
      } else {
        const isPast = new Date(val) < new Date(new Date().setHours(0,0,0,0));
        if (isPast && status === 'Available') {
          updatedErrors.licenseExpiryDate = 'Available drivers cannot have an expired license.';
        } else {
          delete updatedErrors.licenseExpiryDate;
        }
      }
    }

    if (field === 'contactNumber') {
      const v = String(val).trim();
      if (!v) {
        updatedErrors.contactNumber = 'Contact Phone Number is required.';
      } else if (!/^[0-9+-\s()]{10,20}$/.test(v)) {
        updatedErrors.contactNumber = 'Must be a valid contact phone number (at least 10 digits).';
      } else {
        delete updatedErrors.contactNumber;
      }
    }

    if (field === 'safetyScore') {
      const v = Number(val);
      if (isNaN(v) || v < 0 || v > 100) {
        updatedErrors.safetyScore = 'Safety Score must be a percentage between 0 and 100.';
      } else {
        delete updatedErrors.safetyScore;
      }
    }

    setErrors(updatedErrors);
    return Object.keys(updatedErrors).length === 0;
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};

    const cleanName = name.trim();
    if (!cleanName) {
      newErrors.name = 'Driver Name is required.';
    } else if (cleanName.length < 3) {
      newErrors.name = 'Driver Name must be at least 3 characters.';
    }

    const cleanLicense = licenseNumber.toUpperCase().trim();
    if (!cleanLicense) {
      newErrors.licenseNumber = 'License Number is required.';
    } else if (!/^[A-Z0-9-\s]{5,20}$/i.test(cleanLicense)) {
      newErrors.licenseNumber = 'Must be 5-20 alphanumeric characters (spaces/hyphens allowed).';
    } else if (drivers.some(d => d.licenseNumber.toUpperCase() === cleanLicense && d.id !== editingId)) {
      newErrors.licenseNumber = 'This license number is already registered.';
    }

    if (!licenseExpiryDate) {
      newErrors.licenseExpiryDate = 'License Expiry Date is required.';
    } else {
      const isPast = new Date(licenseExpiryDate) < new Date(new Date().setHours(0,0,0,0));
      if (isPast && status === 'Available') {
        newErrors.licenseExpiryDate = 'Available drivers cannot have an expired license.';
      }
    }

    const cleanContact = contactNumber.trim();
    if (!cleanContact) {
      newErrors.contactNumber = 'Contact Phone Number is required.';
    } else if (!/^[0-9+-\s()]{10,20}$/.test(cleanContact)) {
      newErrors.contactNumber = 'Must be a valid contact phone number (at least 10 digits).';
    }

    if (isNaN(safetyScore) || safetyScore < 0 || safetyScore > 100) {
      newErrors.safetyScore = 'Safety Score must be a percentage between 0 and 100.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper check for license expiration
  const checkExpired = (expiryStr: string) => {
    return new Date(expiryStr) < new Date();
  };

  // Sorting helper
  const toggleSort = (col: keyof Driver) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Filter & Sort
  const filteredDrivers = useMemo(() => {
    return drivers
      .filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
          d.contactNumber.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || d.licenseCategory === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
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
  }, [drivers, search, statusFilter, categoryFilter, sortColumn, sortDirection]);

  // Open modal
  const openModal = (driver?: Driver) => {
    setErrorMsg(null);
    setErrors({});
    if (driver) {
      setEditingId(driver.id);
      setName(driver.name);
      setLicenseNumber(driver.licenseNumber);
      setLicenseCategory(driver.licenseCategory);
      setLicenseExpiryDate(driver.licenseExpiryDate);
      setContactNumber(driver.contactNumber);
      setSafetyScore(driver.safetyScore);
      setStatus(driver.status);
    } else {
      setEditingId(undefined);
      setName('');
      setLicenseNumber('');
      setLicenseCategory('Class B CDL');
      setLicenseExpiryDate(new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split('T')[0]); // default 3 years out
      setContactNumber('');
      setSafetyScore(100);
      setStatus('Available');
    }
    setIsOpen(true);
  };

  // Handle Form Submit
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
        name: name.trim(),
        licenseNumber: licenseNumber.toUpperCase().trim(),
        licenseCategory,
        licenseExpiryDate,
        contactNumber: contactNumber.trim(),
        safetyScore: Number(safetyScore),
        status
      });
      setIsOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving driver profile.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Driver Name', 'License Number', 'Category', 'License Expiry Date', 'Contact Number', 'Safety Score (0-100)', 'Status', 'Created At'];
    const rows = filteredDrivers.map(d => [
      d.name,
      d.licenseNumber,
      d.licenseCategory,
      d.licenseExpiryDate,
      d.contactNumber,
      d.safetyScore,
      d.status,
      d.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transitops_drivers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="drivers-tab-content" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800">Driver Management</h2>
          <p className="text-slate-500 text-xs mt-0.5">Manage operator credentials, safety score logs, license validity, and duty schedules.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-export-drivers"
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl px-4 py-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Download size={14} />
            Export CSV
          </button>

          {canModify && (
            <button
              id="btn-add-driver"
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus size={14} />
              Add Driver
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            id="search-drivers"
            type="text"
            placeholder="Search driver name, license, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            id="sort-drivers"
            value={
              sortColumn === 'name' && sortDirection === 'asc' ? 'name' :
              sortColumn === 'safetyScore' && sortDirection === 'desc' ? 'score-desc' :
              sortColumn === 'licenseExpiryDate' && sortDirection === 'asc' ? 'expiry-asc' :
              'custom'
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'name') {
                setSortColumn('name');
                setSortDirection('asc');
              } else if (val === 'score-desc') {
                setSortColumn('safetyScore');
                setSortDirection('desc');
              } else if (val === 'expiry-asc') {
                setSortColumn('licenseExpiryDate');
                setSortDirection('asc');
              }
            }}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 outline-hidden cursor-pointer"
          >
            <option value="name">Sort: Name (A-Z)</option>
            <option value="score-desc">Sort: Highest Safety Score</option>
            <option value="expiry-asc">Sort: Nearest License Expiry</option>
            {sortColumn !== 'name' && sortColumn !== 'safetyScore' && sortColumn !== 'licenseExpiryDate' && (
              <option value="custom">Sort: Clicked Column</option>
            )}
          </select>

          <select
            id="filter-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 outline-hidden cursor-pointer"
          >
            <option value="all">All License Classes</option>
            <option value="Class A CDL">Class A CDL</option>
            <option value="Class B CDL">Class B CDL</option>
            <option value="Class C">Class C</option>
            <option value="Motorcycle">Motorcycle</option>
          </select>

          <select
            id="filter-driver-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 outline-hidden cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="Off Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Drivers List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="drivers-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider select-none">
                <th className="py-3 px-5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('name')}>
                  Driver Name {sortColumn === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('licenseNumber')}>
                  License Number {sortColumn === 'licenseNumber' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('licenseCategory')}>
                  License Category {sortColumn === 'licenseCategory' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('safetyScore')}>
                  Safety Score {sortColumn === 'safetyScore' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('contactNumber')}>
                  Contact Phone {sortColumn === 'contactNumber' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('licenseExpiryDate')}>
                  License Expiration {sortColumn === 'licenseExpiryDate' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('status')}>
                  Status {sortColumn === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </th>
                {canModify && <th className="py-3 px-5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No drivers found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((d) => {
                  const isExpired = checkExpired(d.licenseExpiryDate);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        {d.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                        {d.licenseNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {d.licenseCategory}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${
                          d.safetyScore >= 90 ? 'bg-emerald-50 text-emerald-700' :
                          d.safetyScore >= 75 ? 'bg-amber-50 text-amber-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {d.safetyScore} / 100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium font-mono">
                        {d.contactNumber || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className={isExpired ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            {formatDate(d.licenseExpiryDate)}
                          </span>
                          {isExpired && (
                            <span className="flex items-center gap-0.5 bg-rose-50 border border-rose-200 text-rose-600 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase animate-pulse-soft">
                              <ShieldAlert size={10} /> Expired
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          d.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          d.status === 'On Trip' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          d.status === 'Suspended' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      {canModify && (
                        <td className="py-3.5 px-5 text-right space-x-1 whitespace-nowrap">
                          <button
                            id={`btn-edit-driver-${d.id}`}
                            onClick={() => openModal(d)}
                            disabled={d.status === 'On Trip'}
                            title={d.status === 'On Trip' ? "Cannot edit while on a trip" : "Edit driver profile"}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors inline-block cursor-pointer"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            id={`btn-delete-driver-${d.id}`}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete driver ${d.name}?`)) {
                                try {
                                  onDelete(d.id);
                                } catch (err: any) {
                                  alert(err.message || 'Failed to delete driver.');
                                }
                              }
                            }}
                            disabled={d.status === 'On Trip'}
                            title={d.status === 'On Trip' ? "Cannot delete while on an active trip" : "Delete driver record"}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors inline-block cursor-pointer"
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
      </div>

      {/* Create / Edit Form Modal */}
      {isOpen && (
        <div id="driver-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-100 animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold font-display text-slate-800 text-sm uppercase tracking-wider">
                {editingId ? 'Edit Driver Profile' : 'Onboard New Driver'}
              </h3>
              <button 
                id="btn-close-driver-modal"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
              
              {errorMsg && (
                <div id="driver-form-error" className="flex gap-2 bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-100 items-start">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <div>
                <label htmlFor="modal-driver-name" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  id="modal-driver-name"
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
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
                  <label htmlFor="modal-driver-license" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">License number *</label>
                  <input
                    id="modal-driver-license"
                    type="text"
                    required
                    placeholder="e.g. DL-11029-Y"
                    value={licenseNumber}
                    onChange={(e) => {
                      setLicenseNumber(e.target.value);
                      validateField('licenseNumber', e.target.value);
                    }}
                    onBlur={(e) => validateField('licenseNumber', e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg uppercase ${
                      errors.licenseNumber 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                    }`}
                  />
                  {errors.licenseNumber && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{errors.licenseNumber}</span>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-driver-category" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">License Category</label>
                  <select
                    id="modal-driver-category"
                    value={licenseCategory}
                    onChange={(e) => setLicenseCategory(e.target.value as LicenseCategory)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2 text-xs rounded-lg cursor-pointer"
                  >
                    <option value="Class A CDL">Class A CDL (Commercial)</option>
                    <option value="Class B CDL">Class B CDL (Commercial)</option>
                    <option value="Class C">Class C (Passenger)</option>
                    <option value="Motorcycle">Motorcycle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-driver-expiry" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">License Expiry Date *</label>
                  <input
                    id="modal-driver-expiry"
                    type="date"
                    required
                    value={licenseExpiryDate}
                    onChange={(e) => {
                      setLicenseExpiryDate(e.target.value);
                      validateField('licenseExpiryDate', e.target.value);
                    }}
                    onBlur={(e) => validateField('licenseExpiryDate', e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg ${
                      errors.licenseExpiryDate 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                    }`}
                  />
                  {errors.licenseExpiryDate && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{errors.licenseExpiryDate}</span>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-driver-phone" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Contact Phone *</label>
                  <input
                    id="modal-driver-phone"
                    type="tel"
                    required
                    placeholder="e.g. (555) 321-4567"
                    value={contactNumber}
                    onChange={(e) => {
                      setContactNumber(e.target.value);
                      validateField('contactNumber', e.target.value);
                    }}
                    onBlur={(e) => validateField('contactNumber', e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg ${
                      errors.contactNumber 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                    }`}
                  />
                  {errors.contactNumber && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{errors.contactNumber}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-driver-score" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Safety Audit Score (0-100) *</label>
                  <input
                    id="modal-driver-score"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={safetyScore === 0 ? '0' : safetyScore || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setSafetyScore(v);
                      validateField('safetyScore', v);
                    }}
                    onBlur={(e) => validateField('safetyScore', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg ${
                      errors.safetyScore 
                        ? 'bg-rose-50/50 border border-rose-300 text-rose-800 focus:border-rose-500 focus:outline-hidden' 
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden'
                    }`}
                  />
                  {errors.safetyScore && (
                    <span className="text-rose-600 text-[10px] font-semibold mt-1 block">{errors.safetyScore}</span>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-driver-status" className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Duty Status</label>
                  <select
                    id="modal-driver-status"
                    value={status}
                    disabled={status === 'On Trip'} // Locked while active on delivery
                    onChange={(e) => setStatus(e.target.value as DriverStatus)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden px-3 py-2 text-xs rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip" disabled>On Trip (Automatic)</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  id="btn-cancel-driver-form"
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-driver-form"
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer ${
                    Object.keys(errors).length > 0 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {editingId ? 'Save Changes' : 'Onboard Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

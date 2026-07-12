import React, { useMemo } from 'react';
import { Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense } from '../types';
import { formatCurrency, formatDate, formatNumber } from '../utils/format';
import { Download, TrendingUp, IndianRupee, Fuel, Award, ShieldAlert, BarChart3, PieChart, Activity } from 'lucide-react';

interface ReportsProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
}

export default function Reports({
  vehicles,
  drivers,
  trips,
  maintenance,
  fuelLogs,
  expenses
}: ReportsProps) {
  // Aggregate Metrics per vehicle:
  // - Odometer traveled
  // - Total Revenue from completed trips
  // - Total Fuel consumed and fuel cost
  // - Total Maintenance cost
  // - Total other expenses
  // - Operational Cost = Fuel + Maintenance
  // - ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
  // - Fuel Efficiency = (Completed Trip Distance / Completed Trip Fuel)
  const vehicleMetrics = useMemo(() => {
    return vehicles.map(v => {
      // Completed trips for this vehicle
      const compTrips = trips.filter(t => t.vehicleId === v.id && t.status === 'Completed');
      const totalRevenue = compTrips.reduce((sum, t) => sum + Number(t.revenue || 0), 0);
      const totalDistance = compTrips.reduce((sum, t) => sum + Number(t.actualDistance || t.plannedDistance || 0), 0);
      const totalFuelConsumed = compTrips.reduce((sum, t) => sum + Number(t.fuelConsumed || 0), 0);

      // Maintenance logs
      const totalMaint = maintenance
        .filter(m => m.vehicleId === v.id)
        .reduce((sum, m) => sum + Number(m.cost || 0), 0);

      // Fuel log costs
      const totalFuelCost = fuelLogs
        .filter(f => f.vehicleId === v.id)
        .reduce((sum, f) => sum + Number(f.cost || 0), 0);

      // Other expenses (excluding synced Fuel & Maintenance to avoid double-counting)
      const otherExpensesCost = expenses
        .filter(e => e.vehicleId === v.id && e.category !== 'Fuel' && e.category !== 'Maintenance')
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // Operational Cost (defined in criteria as Fuel + Maintenance)
      const operationalCost = totalFuelCost + totalMaint;

      // Net profit
      const netProfit = totalRevenue - operationalCost;

      // ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
      const roi = v.acquisitionCost > 0 ? (netProfit / v.acquisitionCost) * 100 : 0;

      // Fuel Efficiency (Distance / Fuel) in km/L
      const fuelEfficiency = totalFuelConsumed > 0 ? totalDistance / totalFuelConsumed : 0;

      return {
        ...v,
        totalRevenue,
        totalDistance,
        totalFuelConsumed,
        totalMaint,
        totalFuelCost,
        otherExpensesCost,
        operationalCost,
        netProfit,
        roi,
        fuelEfficiency
      };
    });
  }, [vehicles, trips, maintenance, fuelLogs, expenses]);

  // Overall fleet operational KPIs
  const fleetTotals = useMemo(() => {
    const totalRevenue = vehicleMetrics.reduce((sum, v) => sum + Number(v.totalRevenue || 0), 0);
    const totalOdoTraveled = trips.filter(t => t.status === 'Completed').reduce((sum, t) => sum + Number(t.actualDistance || 0), 0);
    const totalFuelCost = fuelLogs.reduce((sum, f) => sum + Number(f.cost || 0), 0);
    const totalMaintCost = maintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0);
    const otherCost = expenses.filter(e => e.category !== 'Fuel' && e.category !== 'Maintenance').reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalOpsCost = totalFuelCost + totalMaintCost + otherCost;
    
    const activeVehicles = vehicles.filter(v => v.status !== 'Retired');
    const onTripCount = vehicles.filter(v => v.status === 'On Trip').length;
    const fleetUtilization = activeVehicles.length > 0 ? (onTripCount / activeVehicles.length) * 100 : 0;

    const avgROI = vehicleMetrics.length > 0 
      ? vehicleMetrics.reduce((sum, v) => sum + v.roi, 0) / vehicleMetrics.length 
      : 0;

    return {
      totalRevenue,
      totalOdoTraveled,
      totalOpsCost,
      fleetUtilization,
      avgROI
    };
  }, [vehicleMetrics, trips, fuelLogs, maintenance, expenses, vehicles]);

  // Export Full Analytics CSV
  const handleExportCSV = () => {
    const headers = [
      'Registration Number', 'Name/Model', 'Class Type', 'Odometer (km)', 'Acquisition Cost (₹)', 
      'Status', 'Cargo Revenue (₹)', 'Fuel Cost (₹)', 'Maintenance Cost (₹)', 
      'Other Expenses (₹)', 'Total Operational Cost (₹)', 'Net Profit (₹)', 'ROI (%)', 'Fuel Efficiency (km/L)'
    ];

    const rows = vehicleMetrics.map(v => [
      v.registrationNumber,
      v.name,
      v.type,
      v.odometer,
      v.acquisitionCost,
      v.status,
      v.totalRevenue,
      v.totalFuelCost,
      v.totalMaint,
      v.otherExpensesCost,
      v.operationalCost,
      v.netProfit,
      v.roi.toFixed(2),
      v.fuelEfficiency > 0 ? v.fuelEfficiency.toFixed(2) : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transitops_fleet_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="reports-tab-content" className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800">Financial Reports & Fleet Analytics</h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Detailed auditing metrics regarding vehicle return-on-investment, operational fuel consumption, and asset utilization averages.</p>
        </div>

        <button
          id="btn-export-full-report"
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-xs font-semibold shadow-xs transition-all cursor-pointer self-start md:self-auto"
        >
          <Download size={14} />
          Export Audit Report (CSV)
        </button>
      </div>

      {/* Row of KPI Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI: Total Operating Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl">
            <IndianRupee size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Operational Fleet Costs</p>
            <p className="text-xl font-extrabold font-display text-slate-800 mt-1">{formatCurrency(fleetTotals.totalOpsCost)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Fuel + Maintenance + General Tolls</p>
          </div>
        </div>

        {/* KPI: Cargo Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Revenue Earned</p>
            <p className="text-xl font-extrabold font-display text-slate-800 mt-1">{formatCurrency(fleetTotals.totalRevenue)}</p>
            <p className={`text-[10px] mt-0.5 font-semibold ${(fleetTotals.totalRevenue - fleetTotals.totalOpsCost) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              Net Profit: {formatCurrency(fleetTotals.totalRevenue - fleetTotals.totalOpsCost)}
            </p>
          </div>
        </div>

        {/* KPI: Distance Traveled */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Active Driven Distance</p>
            <p className="text-xl font-extrabold font-display text-slate-800 mt-1">{formatNumber(fleetTotals.totalOdoTraveled)} km</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Calculated from closed manifests</p>
          </div>
        </div>

        {/* KPI: Average ROI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <Award size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Fleet Return on Investment</p>
            <p className="text-xl font-extrabold font-display text-slate-800 mt-1">{fleetTotals.avgROI.toFixed(1)}%</p>
            <p className="text-[10px] text-slate-450 mt-0.5 font-semibold text-slate-500">Average ROI across assets</p>
          </div>
        </div>

      </div>

      {/* Visual Analytics Graphs using high-fidelity inline SVGs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: Fuel Efficiency comparison bar chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold font-display text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Fuel size={16} className="text-slate-500" /> Fuel Efficiency Comparison (km / Liter)
            </h3>
            <p className="text-xs text-slate-400 mt-1">Efficiency averages calculated from completed driven legs. Higher values are better.</p>
          </div>

          <div className="h-64 flex flex-col justify-end space-y-4 pt-4">
            {vehicleMetrics.map(v => {
              const maxVal = Math.max(...vehicleMetrics.map(item => item.fuelEfficiency), 12);
              const heightPercent = v.fuelEfficiency > 0 ? (v.fuelEfficiency / maxVal) * 100 : 3;

              return (
                <div key={v.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>{v.registrationNumber} ({v.name})</span>
                    <span className="font-mono text-slate-800">{v.fuelEfficiency > 0 ? `${v.fuelEfficiency.toFixed(2)} km/L` : '0.0 km/L (No completed legs)'}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-4 rounded-lg overflow-hidden">
                    <div 
                      className={`h-full rounded-lg transition-all duration-700 ${
                        v.fuelEfficiency >= 8 ? 'bg-emerald-500' :
                        v.fuelEfficiency >= 4 ? 'bg-blue-500' :
                        v.fuelEfficiency > 0 ? 'bg-amber-500' :
                        'bg-slate-200'
                      }`}
                      style={{ width: `${heightPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: Vehicle Return on Investment Ranking */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold font-display text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={16} className="text-slate-500" /> Vehicle ROI Performance Ratio (%)
            </h3>
            <p className="text-xs text-slate-400 mt-1">ROI = (Cargo Revenue - (Maintenance + Fuel Stop Cost)) / Acquisition Cost.</p>
          </div>

          <div className="h-64 flex flex-col justify-end space-y-4 pt-4">
            {vehicleMetrics.map(v => {
              // Find the absolute highest/lowest to render nicely
              const maxVal = Math.max(...vehicleMetrics.map(item => Math.abs(item.roi)), 5);
              const isPositive = v.roi >= 0;
              const barWidth = maxVal > 0 ? (Math.abs(v.roi) / maxVal) * 100 : 0;

              return (
                <div key={v.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>{v.registrationNumber} ({v.name})</span>
                    <span className={`font-mono font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {v.roi.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-4 rounded-lg overflow-hidden flex">
                    <div 
                      className={`h-full rounded-lg transition-all duration-700 ${
                        isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Audit Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50">
          <h3 className="font-bold font-display text-slate-800 text-sm uppercase tracking-wider">Fleet Financial Ledger & Efficiency</h3>
        </div>
        <div className="overflow-x-auto">
          <table id="reports-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                <th className="py-3 px-5">Plate Number</th>
                <th className="py-3 px-4 text-right">Acquisition</th>
                <th className="py-3 px-4 text-right">Cargo Revenue</th>
                <th className="py-3 px-4 text-right">Fuel Stop Cost</th>
                <th className="py-3 px-4 text-right">Maint Cost</th>
                <th className="py-3 px-4 text-right">Other Expense</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
                <th className="py-3 px-4 text-right">ROI (%)</th>
                <th className="py-3 px-5 text-center">Avg Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {vehicleMetrics.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-700">
                    {v.registrationNumber}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                    {formatCurrency(v.acquisitionCost)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-600 font-semibold font-mono">
                    {formatCurrency(v.totalRevenue)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                    {formatCurrency(v.totalFuelCost)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                    {formatCurrency(v.totalMaint)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                    {formatCurrency(v.otherExpensesCost)}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-bold font-mono ${v.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(v.netProfit)}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-black font-mono ${v.roi >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {v.roi.toFixed(2)}%
                  </td>
                  <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-700">
                    {v.fuelEfficiency > 0 ? `${v.fuelEfficiency.toFixed(1)} km/L` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

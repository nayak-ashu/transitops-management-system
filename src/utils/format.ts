// Currency Format (INR)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Date format (e.g. Jul 12, 2026)
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

// Compact Date Time format (e.g. Jul 12, 14:30)
export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return dateString;
  }
};

// Number formatter
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Fuel efficiency helper (L/100km or km/L) - let's do standard MPG or km/L or L/100km.
// The objective requested: "reports update operational cost and fuel efficiency based on latest trip and fuel log"
// "Fuel Efficiency (Distance/Fuel)" -> km/L! Let's display both km/L and L/100km to look extremely professional!
export const formatFuelEfficiency = (distance: number, liters: number): string => {
  if (!distance || !liters) return 'N/A';
  const efficiencyKmL = distance / liters;
  const efficiencyL100 = (liters / distance) * 100;
  return `${efficiencyKmL.toFixed(1)} km/L (${efficiencyL100.toFixed(1)} L/100km)`;
};

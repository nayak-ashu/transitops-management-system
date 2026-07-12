import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Vehicle, Driver, Trip, VehicleStatus, VehicleType, TripStatus } from '../types';
import { 
  MapPin, Truck, Sun, Moon, Wrench, Fuel, Activity, Search, Filter, 
  CheckCircle2, AlertTriangle, Compass, ZoomIn, ZoomOut, RotateCcw, 
  Clock, Gauge, User, Copy, ExternalLink, SlidersHorizontal, Eye, Navigation, Plus, Play, Square
} from 'lucide-react';

interface LiveTrackingProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  setActiveTab: (tab: string) => void;
}

// Coordinate Bounds for Midwest-Northeast Shipping Corridor
const MAP_BOUNDS = {
  minLat: 38.5,
  maxLat: 43.8,
  minLng: -88.5,
  maxLng: -70.5
};

// Major Shipping City Nodes with GPS Coords
interface CityNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'hub' | 'depot' | 'terminal';
}

const CITY_NODES: CityNode[] = [
  { id: 'CHI', name: 'Chicago Hub', lat: 41.8781, lng: -87.6298, type: 'hub' },
  { id: 'DET', name: 'Detroit Depot', lat: 42.3314, lng: -83.0458, type: 'depot' },
  { id: 'IND', name: 'Indianapolis Hub', lat: 39.7684, lng: -86.1581, type: 'hub' },
  { id: 'COL', name: 'Columbus Terminal', lat: 39.9612, lng: -82.9988, type: 'terminal' },
  { id: 'CLE', name: 'Cleveland Depot', lat: 41.4993, lng: -81.6944, type: 'depot' },
  { id: 'PIT', name: 'Pittsburgh Hub', lat: 40.4406, lng: -79.9959, type: 'hub' },
  { id: 'BUF', name: 'Buffalo Terminal', lat: 42.8864, lng: -78.8784, type: 'terminal' },
  { id: 'NYC', name: 'New York Terminal', lat: 40.7128, lng: -74.0060, type: 'terminal' },
  { id: 'PHI', name: 'Philadelphia Depot', lat: 39.9526, lng: -75.1652, type: 'depot' },
  { id: 'BOS', name: 'Boston Hub', lat: 42.3601, lng: -71.0589, type: 'hub' }
];

// Helper to project Lat/Lng coordinates into percentage space of our SVG map
const projectCoords = (lat: number, lng: number) => {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
  // Invert Y because SVG Y goes downward while latitude increases upward
  const y = (1 - (lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
  return { x, y };
};

// Standard predefined routes between hubs
const ROUTES: Record<string, { lat: number; lng: number }[]> = {
  'Chicago Hub-Detroit Depot': [
    { lat: 41.8781, lng: -87.6298 },
    { lat: 41.6840, lng: -86.2500 }, // South Bend
    { lat: 42.2808, lng: -83.7430 }, // Ann Arbor
    { lat: 42.3314, lng: -83.0458 }
  ],
  'Detroit Depot-New York Terminal': [
    { lat: 42.3314, lng: -83.0458 },
    { lat: 41.4993, lng: -81.6944 }, // Cleveland
    { lat: 42.1292, lng: -80.0851 }, // Erie
    { lat: 42.8864, lng: -78.8784 }, // Buffalo
    { lat: 43.0481, lng: -76.1474 }, // Syracuse
    { lat: 42.6526, lng: -73.7562 }, // Albany
    { lat: 40.7128, lng: -74.0060 }
  ],
  'Indianapolis Hub-Columbus Terminal': [
    { lat: 39.7684, lng: -86.1581 },
    { lat: 39.7762, lng: -84.1916 }, // Dayton
    { lat: 39.9612, lng: -82.9988 }
  ],
  'Columbus Terminal-New York Terminal': [
    { lat: 39.9612, lng: -82.9988 },
    { lat: 40.4406, lng: -79.9959 }, // Pittsburgh
    { lat: 40.6084, lng: -75.4901 }, // Allentown
    { lat: 40.7128, lng: -74.0060 }
  ],
  'New York Terminal-Boston Hub': [
    { lat: 40.7128, lng: -74.0060 },
    { lat: 41.3083, lng: -72.9279 }, // New Haven
    { lat: 41.8240, lng: -71.4128 }, // Providence
    { lat: 42.3601, lng: -71.0589 }
  ],
  'Chicago Hub-New York Terminal': [
    { lat: 41.8781, lng: -87.6298 },
    { lat: 41.4993, lng: -81.6944 }, // Cleveland
    { lat: 40.4406, lng: -79.9959 }, // Pittsburgh
    { lat: 40.0379, lng: -76.3055 }, // Lancaster
    { lat: 40.7128, lng: -74.0060 }
  ],
  'Chicago Hub-Indianapolis Hub': [
    { lat: 41.8781, lng: -87.6298 },
    { lat: 40.4167, lng: -86.8753 }, // Lafayette
    { lat: 39.7684, lng: -86.1581 }
  ],
  'Cleveland Depot-Philadelphia Depot': [
    { lat: 41.4993, lng: -81.6944 },
    { lat: 40.4406, lng: -79.9959 }, // Pittsburgh
    { lat: 40.2732, lng: -76.8867 }, // Harrisburg
    { lat: 39.9526, lng: -75.1652 }
  ],
  'Philadelphia Depot-New York Terminal': [
    { lat: 39.9526, lng: -75.1652 },
    { lat: 40.2179, lng: -74.7429 }, // Trenton
    { lat: 40.7128, lng: -74.0060 }
  ]
};

// Interface for simulated vehicle coordinates
interface SimulatedState {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  progress: number;
  fuelLevel: number;
  odometer: number;
  eta: string;
  distanceRemaining: number;
  alerts: string[];
  routePoints: { lat: number; lng: number }[];
  routeSegment?: string;
}

// Generate coordinate interpolation
const interpolateRoute = (points: { lat: number; lng: number }[], progress: number) => {
  if (points.length === 0) return { lat: 41.8781, lng: -87.6298 };
  if (points.length === 1) return points[0];
  if (progress <= 0) return points[0];
  if (progress >= 100) return points[points.length - 1];

  const totalSegments = points.length - 1;
  const segmentProgress = progress / (100 / totalSegments);
  const segmentIndex = Math.floor(segmentProgress);
  const remainder = segmentProgress - segmentIndex;

  const start = points[segmentIndex];
  const end = points[Math.min(segmentIndex + 1, points.length - 1)];

  return {
    lat: start.lat + (end.lat - start.lat) * remainder,
    lng: start.lng + (end.lng - start.lng) * remainder
  };
};

export default function LiveTracking({ vehicles, drivers, trips, setActiveTab }: LiveTrackingProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterTripStatus, setFilterTripStatus] = useState<string>('all');

  // Interactive Map Pan & Zoom states
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Map theme toggle (GIS Vector Theme: blueprint vs dark radar vs standard light)
  const [mapTheme, setMapTheme] = useState<'blueprint' | 'dark-radar' | 'standard'>('blueprint');

  // Selected Vehicle for details panel and quick center
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  
  // Collapsible vehicle sidebar list
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Simulation store for stateful telemetry
  const [simulations, setSimulations] = useState<Record<string, SimulatedState>>({});

  // Trigger telemetry updates
  const [simTick, setSimTick] = useState(0);

  // Active Map Ref
  const mapRef = useRef<HTMLDivElement>(null);

  // List of active alerts logged dynamically
  const [liveAlerts, setLiveAlerts] = useState<{ id: string; vehicleId: string; reg: string; type: string; msg: string; time: string; severity: 'high' | 'medium' }[]>([]);

  // Find Driver details helper
  const getDriverForVehicle = (vehicleId: string) => {
    // Find active trip
    const activeTrip = trips.find(t => t.vehicleId === vehicleId && t.status === 'Dispatched');
    if (activeTrip) {
      return drivers.find(d => d.id === activeTrip.driverId);
    }
    // Check general driver registry (any driver whose id correlates or mock name)
    const index = vehicles.findIndex(v => v.id === vehicleId);
    if (index !== -1 && drivers.length > 0) {
      return drivers[index % drivers.length];
    }
    return null;
  };

  // Find Active trip helper
  const getActiveTripForVehicle = (vehicleId: string) => {
    return trips.find(t => t.vehicleId === vehicleId && t.status === 'Dispatched');
  };

  // Initialize simulation states for ALL vehicles
  useEffect(() => {
    const initialSims: Record<string, SimulatedState> = {};
    const newAlerts: typeof liveAlerts = [];

    vehicles.forEach((vehicle, idx) => {
      const activeTrip = getActiveTripForVehicle(vehicle.id);
      
      let lat = 41.8781;
      let lng = -87.6298;
      let speed = 0;
      let heading = idx * 45;
      let progress = 0;
      let fuelLevel = 85 - (idx * 6) % 40;
      let odometer = vehicle.odometer;
      let distanceRemaining = 0;
      let eta = '--';
      let alerts: string[] = [];
      let routePoints: { lat: number; lng: number }[] = [];
      let routeSegment = '';

      if (vehicle.status === 'On Trip' && activeTrip) {
        // Find best match in pre-defined ROUTES
        const sourceName = activeTrip.source;
        const destName = activeTrip.destination;
        routeSegment = `${sourceName}-${destName}`;
        
        // Find exact route or default to Chicago-New York
        const foundRoute = ROUTES[routeSegment] || ROUTES[`${activeTrip.source} Hub-${activeTrip.destination} Terminal`] || ROUTES['Chicago Hub-New York Terminal'];
        routePoints = foundRoute;

        // Custom starting progress
        progress = (idx * 17 + 23) % 90;
        const pos = interpolateRoute(routePoints, progress);
        lat = pos.lat;
        lng = pos.lng;
        speed = 82 + (idx * 7) % 30; // 80 - 110 km/h
        fuelLevel = Math.max(15, 95 - progress * 0.7);
        distanceRemaining = Math.max(10, activeTrip.plannedDistance * (1 - progress / 100));
        
        // Calculate ETA
        const hoursLeft = distanceRemaining / speed;
        const minLeft = Math.round((hoursLeft % 1) * 60);
        eta = `${Math.floor(hoursLeft)}h ${minLeft}m`;

        // Check if speeding alert
        if (speed > 105) {
          alerts.push('Speed Limit Exceeded');
          newAlerts.push({
            id: `alert-speed-${vehicle.id}-${idx}`,
            vehicleId: vehicle.id,
            reg: vehicle.registrationNumber,
            type: 'speed',
            msg: `Speeding limit breached: ${Math.round(speed)} km/h in 90 zone.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            severity: 'medium'
          });
        }

        // Random simulated deviation alert
        if (idx % 5 === 0) {
          alerts.push('Route Deviation');
          newAlerts.push({
            id: `alert-dev-${vehicle.id}-${idx}`,
            vehicleId: vehicle.id,
            reg: vehicle.registrationNumber,
            type: 'deviation',
            msg: `Route Deviation detected: 1.8km off corridor.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            severity: 'high'
          });
        }
      } else if (vehicle.status === 'In Shop') {
        // Parked in a maintenance city node (eg. Cleveland or Pittsburgh depot)
        const cityNode = CITY_NODES[idx % CITY_NODES.length];
        lat = cityNode.lat + 0.005;
        lng = cityNode.lng - 0.004;
        speed = 0;
        fuelLevel = 45;
        eta = 'NA (Shop)';
        alerts.push('Maintenance in Progress');
      } else if (vehicle.status === 'Retired') {
        // Parked in terminal corner (eg. New York)
        lat = 40.7128 - idx * 0.02;
        lng = -74.0060 + idx * 0.02;
        speed = 0;
        fuelLevel = 0;
        eta = 'NA (Decommissioned)';
      } else {
        // Available (idle in home depot)
        const cityNode = CITY_NODES[idx % CITY_NODES.length];
        lat = cityNode.lat;
        lng = cityNode.lng;
        speed = 0;
        fuelLevel = 88;
        eta = 'Ready';
        
        // Low fuel alerts
        if (idx % 6 === 0) {
          alerts.push('Scheduled Service Due');
          newAlerts.push({
            id: `alert-service-${vehicle.id}-${idx}`,
            vehicleId: vehicle.id,
            reg: vehicle.registrationNumber,
            type: 'service',
            msg: `Routine preventative maintenance scheduled due within 48h.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            severity: 'medium'
          });
        }
      }

      initialSims[vehicle.id] = {
        lat,
        lng,
        speed,
        heading,
        progress,
        fuelLevel,
        odometer,
        distanceRemaining,
        eta,
        alerts,
        routePoints,
        routeSegment
      };
    });

    setSimulations(initialSims);
    setLiveAlerts(newAlerts);
  }, [vehicles, trips]);

  // Periodic Simulation loop (updates positions for moving vehicles every 3 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setSimTick(prev => prev + 1);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSimulations(prev => {
      const updated = { ...prev };
      let alertsChanged = false;
      const newAlerts = [...liveAlerts];

      Object.keys(updated).forEach(vId => {
        const sim = updated[vId];
        const vehicle = vehicles.find(v => v.id === vId);

        if (vehicle && vehicle.status === 'On Trip' && sim.routePoints.length > 0) {
          // Increment progress slightly
          let newProgress = sim.progress + 0.4 + Math.random() * 0.6;
          if (newProgress >= 100) {
            newProgress = 0; // Loop simulation
          }

          const pos = interpolateRoute(sim.routePoints, newProgress);
          const currentSpeed = 75 + Math.floor(Math.random() * 32); // fluctuating speed
          const updatedFuel = Math.max(5, sim.fuelLevel - 0.2 - Math.random() * 0.1);
          const odoIncrement = (currentSpeed * 3) / 3600; // actual km in 3s
          const updatedOdometer = sim.odometer + odoIncrement;
          const currentDistRemaining = Math.max(5, sim.distanceRemaining - odoIncrement);

          const hoursLeft = currentDistRemaining / currentSpeed;
          const minLeft = Math.round((hoursLeft % 1) * 60);
          const currentEta = `${Math.floor(hoursLeft)}h ${minLeft}m`;

          // Handle dynamic violations
          const currentAlerts = [...sim.alerts];
          
          if (currentSpeed > 102 && !currentAlerts.includes('Speed Limit Exceeded')) {
            currentAlerts.push('Speed Limit Exceeded');
            newAlerts.unshift({
              id: `alert-speed-${vId}-${Date.now()}`,
              vehicleId: vId,
              reg: vehicle.registrationNumber,
              type: 'speed',
              msg: `Speed limit exceeded! TRK ${vehicle.registrationNumber} flagged at ${Math.round(currentSpeed)} km/h.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              severity: 'medium'
            });
            alertsChanged = true;
          } else if (currentSpeed <= 102 && currentAlerts.includes('Speed Limit Exceeded') && Math.random() > 0.6) {
            // resolve alert randomly
            const i = currentAlerts.indexOf('Speed Limit Exceeded');
            if (i !== -1) currentAlerts.splice(i, 1);
          }

          // Random Stopped Too Long alerts
          if (Math.random() > 0.98 && !currentAlerts.includes('Unscheduled Stop')) {
            currentAlerts.push('Unscheduled Stop');
            newAlerts.unshift({
              id: `alert-stop-${vId}-${Date.now()}`,
              vehicleId: vId,
              reg: vehicle.registrationNumber,
              type: 'stop',
              msg: `Alert: ${vehicle.registrationNumber} is stationary in non-designated zone for >15 mins.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              severity: 'high'
            });
            alertsChanged = true;
          }

          updated[vId] = {
            ...sim,
            lat: pos.lat,
            lng: pos.lng,
            progress: newProgress,
            speed: currentSpeed,
            fuelLevel: updatedFuel,
            odometer: updatedOdometer,
            distanceRemaining: currentDistRemaining,
            eta: currentEta,
            alerts: currentAlerts
          };
        }
      });

      if (alertsChanged) {
        setLiveAlerts(newAlerts.slice(0, 30)); // Keep top 30
      }

      return updated;
    });
  }, [simTick, vehicles]);

  // Handle map container mouse/touch dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPanX(e.clientX - dragStart.current.x);
    setPanY(e.clientY - dragStart.current.y);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Quick Zoom and Center helpers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.3, 4));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.3, 0.7));
  const handleResetMap = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
    setSelectedVehicleId(null);
  };

  // Center Map directly onto a specific coordinate (such as active vehicle)
  const locateVehicleOnMap = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const sim = simulations[vehicleId];
    if (sim) {
      const projected = projectCoords(sim.lat, sim.lng);
      
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Convert percentage coordinate of SVG to actual local pixels in container
        const mapX = (projected.x / 100) * rect.width;
        const mapY = (projected.y / 100) * rect.height;

        // Set zoom and offset so this pixel coordinates aligns exactly in the center of the frame
        setZoomLevel(2.2);
        setPanX(centerX - mapX * 2.2);
        setPanY(centerY - mapY * 2.2);
      }
    }
  };

  // Active status color map
  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case 'Available': return { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', bgFade: 'bg-emerald-500/10' };
      case 'On Trip': return { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', bgFade: 'bg-blue-500/10' };
      case 'In Shop': return { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500', bgFade: 'bg-amber-500/10' };
      case 'Retired': return { bg: 'bg-slate-400', text: 'text-slate-400', border: 'border-slate-400', bgFade: 'bg-slate-400/10' };
      default: return { bg: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-500', bgFade: 'bg-slate-500/10' };
    }
  };

  // Filter and Search Logic
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const sim = simulations[vehicle.id];
      const driver = getDriverForVehicle(vehicle.id);
      const activeTrip = getActiveTripForVehicle(vehicle.id);

      // Search matching registration, name, type, region, driver name, or cities
      const matchesSearch = 
        vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vehicle.region && vehicle.region.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (driver && driver.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (activeTrip && (activeTrip.source.toLowerCase().includes(searchTerm.toLowerCase()) || activeTrip.destination.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchesType = filterType === 'all' || vehicle.type === filterType;
      const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
      const matchesRegion = filterRegion === 'all' || vehicle.region === filterRegion;
      
      let matchesTripStatus = true;
      if (filterTripStatus !== 'all') {
        if (filterTripStatus === 'dispatched') {
          matchesTripStatus = vehicle.status === 'On Trip';
        } else if (filterTripStatus === 'idle') {
          matchesTripStatus = vehicle.status === 'Available';
        }
      }

      return matchesSearch && matchesType && matchesStatus && matchesRegion && matchesTripStatus;
    });
  }, [vehicles, searchTerm, filterType, filterStatus, filterRegion, filterTripStatus, simulations]);

  // Core Statistics metrics
  const stats = useMemo(() => {
    const total = vehicles.length;
    const onTrip = vehicles.filter(v => v.status === 'On Trip').length;
    const available = vehicles.filter(v => v.status === 'Available').length;
    const inShop = vehicles.filter(v => v.status === 'In Shop').length;
    const retired = vehicles.filter(v => v.status === 'Retired').length;

    // Calculate moving average speed
    const movingSims = (Object.values(simulations) as SimulatedState[]).filter(s => s.speed > 0);
    const avgSpeed = movingSims.length > 0 
      ? movingSims.reduce((sum, s) => sum + s.speed, 0) / movingSims.length
      : 0;

    return { total, onTrip, available, inShop, retired, avgSpeed };
  }, [vehicles, simulations]);

  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    return vehicles.find(v => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  const selectedSim = useMemo(() => {
    if (!selectedVehicleId) return null;
    return simulations[selectedVehicleId] || null;
  }, [simulations, selectedVehicleId]);

  // Copy GPS coords mock helper
  const copyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    alert(`Copied Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Compass className="animate-spin-slow" size={20} />
            </span>
            <div>
              <h1 className="font-extrabold font-display text-lg tracking-tight text-slate-800 dark:text-slate-100">Live Fleet Tracking System</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time GPS telemetry, scheduled cargo route maps, and driver compliance monitoring.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end md:self-center">
          {/* GIS Map Theme Select Controls */}
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">Map Interface:</span>
          <div className="bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl flex gap-1 border border-slate-200/40 dark:border-slate-800">
            <button
              onClick={() => setMapTheme('blueprint')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                mapTheme === 'blueprint' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
              }`}
            >
              Blueprint
            </button>
            <button
              onClick={() => setMapTheme('dark-radar')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                mapTheme === 'dark-radar' 
                  ? 'bg-slate-950 text-emerald-400 border border-emerald-500/20 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
              }`}
            >
              Dark Radar
            </button>
            <button
              onClick={() => setMapTheme('standard')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                mapTheme === 'standard' 
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
              }`}
            >
              Terrain Light
            </button>
          </div>
        </div>
      </div>

      {/* Fleet Live KPI Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Total Active */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-900 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tracked Fleet</span>
            <span className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Truck size={14} />
            </span>
          </div>
          <p className="text-2xl font-black font-display text-slate-800 dark:text-slate-100">{stats.total}</p>
          <span className="text-[9px] font-extrabold uppercase text-emerald-500 flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping-slow"></span>
            100% Connected
          </span>
        </div>

        {/* On Trip */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-900 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">In Transit</span>
            <span className="p-1.5 bg-blue-50/50 dark:bg-blue-950/20 text-blue-500 rounded-lg">
              <Navigation size={14} />
            </span>
          </div>
          <p className="text-2xl font-black font-display text-slate-800 dark:text-slate-100">{stats.onTrip}</p>
          <span className="text-[9px] font-extrabold uppercase text-blue-500 flex items-center gap-1 mt-1">
            {stats.total > 0 ? Math.round((stats.onTrip / stats.total) * 100) : 0}% Active Load
          </span>
        </div>

        {/* Available */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-900 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Ready Depot</span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-lg">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <p className="text-2xl font-black font-display text-slate-800 dark:text-slate-100">{stats.available}</p>
          <span className="text-[9px] font-extrabold uppercase text-emerald-500 flex items-center gap-1 mt-1">
            Standby Assets
          </span>
        </div>

        {/* Maintenance */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-900 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">In Maintenance</span>
            <span className="p-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-lg">
              <Wrench size={14} />
            </span>
          </div>
          <p className="text-2xl font-black font-display text-slate-800 dark:text-slate-100">{stats.inShop}</p>
          <span className="text-[9px] font-extrabold uppercase text-amber-500 flex items-center gap-1 mt-1">
            Shop Operations
          </span>
        </div>

        {/* Avg speed */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-900 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Fleet Avg Speed</span>
            <span className="p-1.5 bg-purple-50 dark:bg-purple-950/30 text-purple-500 rounded-lg">
              <Gauge size={14} />
            </span>
          </div>
          <p className="text-2xl font-black font-display text-slate-800 dark:text-slate-100">{stats.avgSpeed.toFixed(1)} <span className="text-xs">km/h</span></p>
          <span className="text-[9px] font-extrabold uppercase text-purple-500 flex items-center gap-1 mt-1">
            Speed Telemetry
          </span>
        </div>

        {/* Offline / Retired */}
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-900 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Decommissioned</span>
            <span className="p-1.5 bg-slate-50 dark:bg-slate-900 text-slate-500 rounded-lg">
              <AlertTriangle size={14} />
            </span>
          </div>
          <p className="text-2xl font-black font-display text-slate-800 dark:text-slate-100">{stats.retired}</p>
          <span className="text-[9px] font-extrabold uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
            Retired Assets
          </span>
        </div>

      </div>

      {/* Main Interactive Map & Side Vehicle List Frame */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Left Side: Dynamic Collapsible Vehicle List & Filters Panel */}
        <div className={`xl:col-span-1 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-2xs flex flex-col overflow-hidden transition-all duration-300 ${
          isSidebarOpen ? 'h-[36rem]' : 'h-14'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-slate-500" />
              <span className="font-extrabold font-display text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">Fleet Operations list</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
            >
              {isSidebarOpen ? 'Hide' : 'Show List'}
            </button>
          </div>

          {isSidebarOpen && (
            <>
              {/* Search & Filters */}
              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search reg, driver, node..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-white dark:bg-slate-950 text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 focus:outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="Heavy Truck">Heavy Truck</option>
                    <option value="Light Van">Light Van</option>
                    <option value="Bus">Bus</option>
                    <option value="Cargo Car">Cargo Car</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-white dark:bg-slate-950 text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>

              {/* Scrolling List Content */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900">
                {filteredVehicles.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No matching vehicles found.
                  </div>
                ) : (
                  filteredVehicles.map(vehicle => {
                    const sim = simulations[vehicle.id];
                    const activeTrip = getActiveTripForVehicle(vehicle.id);
                    const driver = getDriverForVehicle(vehicle.id);
                    const colors = getStatusColor(vehicle.status);
                    const isSelected = selectedVehicleId === vehicle.id;

                    return (
                      <div
                        key={vehicle.id}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all cursor-pointer ${
                          isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => locateVehicleOnMap(vehicle.id)}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <div className="min-w-0">
                            <span className="font-black text-xs text-slate-800 dark:text-slate-100 block truncate">
                              {vehicle.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              {vehicle.registrationNumber} • {vehicle.type}
                            </span>
                          </div>
                          
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${colors.bgFade} ${colors.text} border ${colors.border}/20`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.bg}`}></span>
                            {vehicle.status}
                          </span>
                        </div>

                        {/* Driver info */}
                        {driver && (
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                            <User size={11} className="text-slate-400" />
                            <span className="font-medium truncate">Driver: {driver.name}</span>
                          </div>
                        )}

                        {/* Trip Progress Bar if applicable */}
                        {vehicle.status === 'On Trip' && sim && activeTrip && (
                          <div className="mt-2.5 space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                              <span className="truncate max-w-[50%]">{activeTrip.source}</span>
                              <span>&rarr;</span>
                              <span className="truncate max-w-[50%]">{activeTrip.destination}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${sim.progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500 font-black">
                              <span>Progress: {Math.round(sim.progress)}%</span>
                              <span>{Math.round(sim.speed)} km/h</span>
                            </div>
                          </div>
                        )}

                        {/* Static metrics for Available / Maintenance */}
                        {vehicle.status !== 'On Trip' && (
                          <div className="mt-2 text-[9px] font-black uppercase text-slate-400 flex items-center gap-3">
                            <span>Region: {vehicle.region || 'Unassigned'}</span>
                            <span>Odo: {Math.round(vehicle.odometer).toLocaleString()} km</span>
                          </div>
                        )}

                        {/* Warnings indicators */}
                        {sim && sim.alerts.length > 0 && (
                          <div className="mt-2 flex gap-1.5 flex-wrap">
                            {sim.alerts.map((al, ai) => (
                              <span key={ai} className="inline-flex items-center gap-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                                <AlertTriangle size={8} />
                                {al}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              locateVehicleOnMap(vehicle.id);
                            }}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"
                          >
                            <Compass size={11} className="text-blue-500 animate-pulse-soft" />
                            Track Asset
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Side Map Canvas & GPS Info HUD Overlay */}
        <div className="xl:col-span-3 flex flex-col gap-6">

          {/* Map Section */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-2xs relative flex flex-col overflow-hidden">
            
            {/* Top map controls status header */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-100 dark:border-slate-900 shadow-xs flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                Telemetry Corridor Feed
              </span>
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 rounded font-bold">
                LAT 38.5°N - 43.8°N
              </span>
            </div>

            {/* Float-Right Controls (Zoom, Reset, Pan) */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs cursor-pointer"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs cursor-pointer"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={handleResetMap}
                title="Reset View"
                className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs cursor-pointer"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* THE INTERACTIVE VECTOR GIS MAP CANVAS */}
            <div
              id="telemetry-gis-canvas"
              ref={mapRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`h-[30rem] w-full relative overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors duration-300 ${
                mapTheme === 'blueprint' 
                  ? 'bg-slate-950 border border-slate-900' 
                  : mapTheme === 'dark-radar' 
                    ? 'bg-black' 
                    : 'bg-slate-50'
              }`}
            >
              {/* Dynamic Coordinate Grid Lines background */}
              <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
                <svg className="w-full h-full">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke={mapTheme === 'blueprint' ? '#38bdf8' : mapTheme === 'dark-radar' ? '#10b981' : '#cbd5e1'} strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Central Map Canvas Element */}
              <div
                className="absolute w-full h-full transform origin-top-left transition-transform duration-300"
                style={{
                  transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`
                }}
              >
                {/* SVG Route lines, Highways, Rivers and Cities */}
                <svg className="w-full h-full absolute inset-0 pointer-events-none">
                  {/* Decorative Highway Routes */}
                  <g className="opacity-40">
                    {Object.keys(ROUTES).map((routeId) => {
                      const points = ROUTES[routeId];
                      const pathString = points.map((p, idx) => {
                        const proj = projectCoords(p.lat, p.lng);
                        return `${idx === 0 ? 'M' : 'L'} ${proj.x}% ${proj.y}%`;
                      }).join(' ');

                      return (
                        <g key={routeId}>
                          {/* Inner Highway back line */}
                          <path
                            d={pathString}
                            fill="none"
                            stroke={mapTheme === 'blueprint' ? '#1e293b' : mapTheme === 'dark-radar' ? '#064e3b' : '#e2e8f0'}
                            strokeWidth="3"
                          />
                          {/* Pulsing overlay line */}
                          <path
                            d={pathString}
                            fill="none"
                            stroke={mapTheme === 'blueprint' ? '#0284c7' : mapTheme === 'dark-radar' ? '#059669' : '#94a3b8'}
                            strokeWidth="1.5"
                            strokeDasharray="6 4"
                            className="animate-dash"
                          />
                        </g>
                      );
                    })}
                  </g>

                  {/* ACTIVE DISPATCHED TRIP ROUTE LINE VISUALIZATION (glowing overlay for selected vehicle) */}
                  {selectedVehicle && selectedSim && selectedSim.routePoints.length > 0 && (
                    <g className="z-10">
                      {/* Glow Backing */}
                      <path
                        d={selectedSim.routePoints.map((p, idx) => {
                          const proj = projectCoords(p.lat, p.lng);
                          return `${idx === 0 ? 'M' : 'L'} ${proj.x}% ${proj.y}%`;
                        }).join(' ')}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-25"
                      />
                      {/* Core Path */}
                      <path
                        d={selectedSim.routePoints.map((p, idx) => {
                          const proj = projectCoords(p.lat, p.lng);
                          return `${idx === 0 ? 'M' : 'L'} ${proj.x}% ${proj.y}%`;
                        }).join(' ')}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="8 6"
                        className="animate-dash"
                      />
                    </g>
                  )}

                  {/* Major City Node Pins on Map */}
                  <g>
                    {CITY_NODES.map((city) => {
                      const proj = projectCoords(city.lat, city.lng);
                      const isHub = city.type === 'hub';
                      return (
                        <g key={city.id} className="cursor-pointer pointer-events-auto">
                          {/* Pulse Glow for major Hubs */}
                          {isHub && (
                            <circle
                              cx={`${proj.x}%`}
                              cy={`${proj.y}%`}
                              r="15"
                              fill={mapTheme === 'blueprint' ? 'rgba(56, 189, 248, 0.12)' : mapTheme === 'dark-radar' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.08)'}
                              className="animate-ping-slow"
                            />
                          )}
                          
                          {/* Anchor Circle */}
                          <circle
                            cx={`${proj.x}%`}
                            cy={`${proj.y}%`}
                            r={isHub ? '6' : '4.5'}
                            fill={
                              mapTheme === 'blueprint' 
                                ? '#38bdf8' 
                                : mapTheme === 'dark-radar' 
                                  ? '#10b981' 
                                  : '#3b82f6'
                            }
                            stroke={mapTheme === 'blueprint' ? '#0f172a' : mapTheme === 'dark-radar' ? '#000000' : '#ffffff'}
                            strokeWidth="2"
                          />
                          
                          {/* City Name Text labels */}
                          <text
                            x={`${proj.x}%`}
                            y={`${proj.y - 1.8}%`}
                            textAnchor="middle"
                            className={`font-display text-[9px] font-black tracking-wide pointer-events-none select-none ${
                              mapTheme === 'blueprint' 
                                ? 'fill-sky-200/90 [text-shadow:1px_1px_0px_rgba(15,23,42,1)]' 
                                : mapTheme === 'dark-radar' 
                                  ? 'fill-emerald-300/95 [text-shadow:1px_1px_0px_rgba(0,0,0,1)]' 
                                  : 'fill-slate-700 [text-shadow:1px_1px_0px_rgba(255,255,255,0.8)]'
                            }`}
                          >
                            {city.name}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* REAL-TIME VEHICLE MARKERS LAYER */}
                {Object.keys(simulations).map(vId => {
                  const sim = simulations[vId];
                  const vehicle = vehicles.find(v => v.id === vId);
                  if (!vehicle || !sim) return null;

                  const proj = projectCoords(sim.lat, sim.lng);
                  const colors = getStatusColor(vehicle.status);
                  const isSelected = selectedVehicleId === vId;

                  return (
                    <div
                      key={vId}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 z-20 cursor-pointer"
                      style={{
                        left: `${proj.x}%`,
                        top: `${proj.y}%`
                      }}
                      onClick={() => locateVehicleOnMap(vId)}
                    >
                      {/* Pulse sonar echo for selected vehicle */}
                      {isSelected && (
                        <span className="absolute -inset-4 flex items-center justify-center pointer-events-none">
                          <span className={`animate-ping absolute inline-flex h-8 w-8 rounded-full ${colors.bg} opacity-25`}></span>
                          <span className={`inline-flex rounded-full h-2 w-2 ${colors.bg}`}></span>
                        </span>
                      )}

                      {/* Marker Element */}
                      <div className={`p-2 rounded-xl shadow-md border-2 transition-all flex items-center justify-center ${
                        isSelected 
                          ? 'scale-125 border-blue-600 bg-white dark:bg-slate-900 ring-2 ring-blue-600/30' 
                          : `${colors.border} bg-white dark:bg-slate-950`
                      }`}>
                        <Truck size={14} className={isSelected ? 'text-blue-600 dark:text-blue-400' : colors.text} />
                        
                        {/* Compact HUD label */}
                        {zoomLevel >= 1.5 && (
                          <span className="ml-1 text-[8px] font-black uppercase font-mono tracking-tight text-slate-700 dark:text-slate-300">
                            {vehicle.registrationNumber}
                          </span>
                        )}
                      </div>

                      {/* Speed bubble */}
                      {vehicle.status === 'On Trip' && sim.speed > 0 && zoomLevel >= 2 && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white font-mono font-black text-[7px] px-1 py-0.5 rounded shadow-xs whitespace-nowrap">
                          {Math.round(sim.speed)} km/h
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>

              {/* Bottom Telemetry Legend */}
              <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-100 dark:border-slate-900 shadow-xs flex flex-wrap gap-4 items-center">
                <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Legend:</span>
                
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Available</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">On Trip</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">In Shop</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-slate-400 rounded-full"></span>
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Retired</span>
                </div>
              </div>

            </div>

          </div>

          {/* Collapsible expanded details for clicked vehicle */}
          {selectedVehicle && selectedSim && (
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-2xs p-5 animate-fade-in space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-900 gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Truck size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold font-display text-base text-slate-800 dark:text-slate-100">{selectedVehicle.name}</h2>
                      <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-md font-bold uppercase">{selectedVehicle.registrationNumber}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Model specifications: {selectedVehicle.type} • Capacity: {selectedVehicle.maxLoadCapacity.toLocaleString()} kg</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase rounded-full ${getStatusColor(selectedVehicle.status).bgFade} ${getStatusColor(selectedVehicle.status).text} border ${getStatusColor(selectedVehicle.status).border}/20`}>
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedVehicle.status).bg}`}></span>
                    {selectedVehicle.status}
                  </span>
                  
                  <button
                    onClick={() => {
                      setSelectedVehicleId(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                  >
                    Close Details
                  </button>
                </div>
              </div>

              {/* Details Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Lat Lng coordinates */}
                <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100/60 dark:border-slate-900 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider mb-1">GPS Coordinates</span>
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200 block font-bold">
                      {selectedSim.lat.toFixed(5)}, {selectedSim.lng.toFixed(5)}
                    </span>
                  </div>
                  <button
                    onClick={() => copyCoords(selectedSim.lat, selectedSim.lng)}
                    title="Copy Coordinates"
                    className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-500 hover:text-blue-500 rounded-lg shadow-3xs cursor-pointer"
                  >
                    <Copy size={12} />
                  </button>
                </div>

                {/* Speedometer */}
                <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100/60 dark:border-slate-900">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider mb-1">Telemetry Speed</span>
                  <span className="font-mono text-xs text-slate-800 dark:text-slate-200 block font-black">
                    {Math.round(selectedSim.speed)} km/h
                  </span>
                </div>

                {/* Fuel gauge */}
                <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100/60 dark:border-slate-900">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider mb-1">Fuel Reserve</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Fuel size={12} className={selectedSim.fuelLevel < 25 ? 'text-rose-500 animate-pulse' : 'text-blue-500'} />
                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          selectedSim.fuelLevel < 25 ? 'bg-rose-500' : selectedSim.fuelLevel < 50 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${selectedSim.fuelLevel}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200 font-bold">{Math.round(selectedSim.fuelLevel)}%</span>
                  </div>
                </div>

                {/* Odometer */}
                <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100/60 dark:border-slate-900">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider mb-1">Fleet Odometer</span>
                  <span className="font-mono text-xs text-slate-800 dark:text-slate-200 block font-bold">
                    {Math.round(selectedSim.odometer).toLocaleString()} km
                  </span>
                </div>

              </div>

              {/* Driver & Trip Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Active driver profile summary */}
                <div className="p-4 bg-slate-50/30 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-900 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider border-b border-slate-100 dark:border-slate-900 pb-1.5">Assigned Operator</span>
                  {getDriverForVehicle(selectedVehicle.id) ? (
                    (() => {
                      const drv = getDriverForVehicle(selectedVehicle.id)!;
                      return (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-extrabold text-sm uppercase">
                            {drv.name[0]}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{drv.name}</h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{drv.licenseCategory} • Lic: {drv.licenseNumber}</p>
                            
                            {/* Safety Score meter */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[9px] uppercase font-bold text-slate-400">Safety Score:</span>
                              <span className={`text-[10px] font-black ${
                                drv.safetyScore >= 90 ? 'text-emerald-500' : drv.safetyScore >= 75 ? 'text-blue-500' : 'text-rose-500'
                              }`}>{drv.safetyScore}/100</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-xs text-slate-400 py-3 text-center">
                      No operator currently assigned to asset.
                    </div>
                  )}
                </div>

                {/* Current Active Trip Schedule details */}
                <div className="p-4 bg-slate-50/30 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-900 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block tracking-wider border-b border-slate-100 dark:border-slate-900 pb-1.5">Route Dispatch Schedule</span>
                  {selectedVehicle.status === 'On Trip' && getActiveTripForVehicle(selectedVehicle.id) ? (
                    (() => {
                      const trip = getActiveTripForVehicle(selectedVehicle.id)!;
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Dispatch Origin</span>
                              <span className="font-black text-slate-800 dark:text-slate-200">{trip.source}</span>
                            </div>
                            <span className="text-slate-400">&rarr;</span>
                            <div className="text-right">
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Arrival Terminal</span>
                              <span className="font-black text-slate-800 dark:text-slate-200">{trip.destination}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100/60 dark:border-slate-900 pt-2">
                            <div>
                              <span className="text-slate-400 block">Remaining:</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                                {Math.round(selectedSim.distanceRemaining)} km / {trip.plannedDistance} km
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Estimated ETA:</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                                {selectedSim.eta}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-xs text-slate-400 py-3 text-center">
                      Asset is currently stationary at terminal. No active manifests.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* Operational GPS Alerts Board & Logs - Interactive Terminal */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-rose-500 animate-pulse-soft" size={16} />
                  <span className="font-extrabold font-display text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">Live Dispatch Alerts Log</span>
                </div>
                <button
                  onClick={() => setLiveAlerts([])}
                  className="text-[9px] font-extrabold uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  Clear Terminal Logs
                </button>
              </div>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {liveAlerts.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    All fleet modules are operating within scheduled corridors. No violations.
                  </div>
                ) : (
                  liveAlerts.map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => locateVehicleOnMap(alert.vehicleId)}
                      className={`p-2.5 rounded-xl border flex gap-3 items-start cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${
                        alert.severity === 'high' 
                          ? 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30' 
                          : 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-100/60 dark:border-amber-900/20'
                      }`}
                    >
                      <span className={`p-1 rounded-md mt-0.5 ${
                        alert.severity === 'high' 
                          ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' 
                          : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      }`}>
                        <AlertTriangle size={12} />
                      </span>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            TRK {alert.reg} • Violation Block
                          </h4>
                          <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {alert.time}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                          {alert.msg}
                        </p>
                      </div>

                      <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 self-center uppercase hover:underline">
                        Locate &rarr;
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

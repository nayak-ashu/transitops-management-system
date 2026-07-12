import React from 'react';
import { 
  Truck, Users, Wrench, Navigation, Fuel, BarChart3, 
  ChevronRight, ArrowRight, Shield, Play, CheckCircle2, 
  MapPin, Clock, Moon, Sun, Check, ExternalLink, Sparkles
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export default function LandingPage({ onNavigateToLogin, isDarkMode, onToggleTheme }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* 1. NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-xs">
              <Truck size={20} />
            </div>
            <span className="font-extrabold font-display text-lg tracking-tight text-slate-900 dark:text-white">
              TransitOps
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#platform" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Platform
            </a>
            <a href="#solutions" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Solutions
            </a>
            <a href="#pricing" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Pricing
            </a>
            <a href="#resources" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Resources
            </a>
          </nav>

          {/* Action Buttons & Theme Toggle */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl bg-slate-100 dark:bg-slate-900 transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button 
              onClick={onNavigateToLogin}
              className="hidden sm:inline-flex text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 transition-colors cursor-pointer"
            >
              Log In
            </button>
            
            <button 
              onClick={onNavigateToLogin}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-slate-50 dark:bg-[#0b0f19] transition-colors">
        {/* Glow ambient backing effects */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Micro badge */}
              <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                <Sparkles size={12} className="animate-pulse" />
                Next-Gen Fleet Orchestration
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Fleet Operations, <br />
                <span className="text-blue-600 dark:text-blue-400">Finally Under Control</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                TransitOps replaces spreadsheets and logbooks with one platform to manage vehicles, drivers, dispatch, maintenance, and expenses — with the business rules built in so nothing slips through.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={onNavigateToLogin}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm px-8 py-4 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-center cursor-pointer flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight size={16} />
                </button>
                
                <a
                  href="#how-it-works"
                  className="bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-sm px-6 py-4 rounded-2xl transition-all text-center flex items-center justify-center gap-2"
                >
                  <Play size={14} className="fill-current text-blue-600" />
                  Watch 2-Min Demo
                </a>
              </div>

              {/* Micro-trust indicators */}
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                No credit card required <span className="mx-1.5 text-slate-300 dark:text-slate-700">·</span> Setup in under 10 minutes
              </p>

            </div>

            {/* Right Abstract Visual Preview Column */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none bg-slate-900/5 dark:bg-slate-900/20 p-4 rounded-3xl border border-slate-200/40 dark:border-slate-800/30">
                
                {/* Floating telemetry widget */}
                <div className="absolute -top-4 -left-4 z-10 bg-white dark:bg-[#121826] p-3 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 animate-bounce-slow">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping-slow"></span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Live GPS Corridor</span>
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">TRK-409 ACTIVE</p>
                </div>

                {/* Abstract Dashboard preview container */}
                <div className="bg-[#121826] text-[#cbd5e1] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono">
                  
                  {/* Top Bar */}
                  <div className="bg-[#0b0f19] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">TransitOps Console</span>
                    <span className="text-[9px] text-blue-500 font-bold">100% SECURE</span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-4 text-left">
                    {/* Visual Stats Bar graph */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#161d30] p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Fleet Ready</span>
                        <span className="text-xs font-black text-emerald-400">98.4%</span>
                      </div>
                      <div className="bg-[#161d30] p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">In Transit</span>
                        <span className="text-xs font-black text-blue-400">14 Active</span>
                      </div>
                      <div className="bg-[#161d30] p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Avg Cost</span>
                        <span className="text-xs font-black text-amber-400">-12.5%</span>
                      </div>
                    </div>

                    {/* Vector map simulation */}
                    <div className="bg-[#0b0f19] h-32 rounded-xl relative border border-slate-800 overflow-hidden p-2 flex flex-col justify-between">
                      {/* Grid */}
                      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
                      
                      {/* Active line */}
                      <svg className="absolute inset-0 w-full h-full opacity-60">
                        <path d="M 20 100 L 120 40 L 260 80" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 3" />
                        <circle cx="120" cy="40" r="4" fill="#10b981" />
                        <circle cx="260" cy="80" r="4" fill="#3b82f6" />
                      </svg>

                      <div className="flex justify-between items-start z-10">
                        <span className="text-[8px] uppercase tracking-wider text-slate-500 bg-[#121826] px-1 rounded border border-slate-800">CORRIDOR MAP (CHICAGO &rarr; NYC)</span>
                        <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded">GPS SYNCED</span>
                      </div>

                      <div className="z-10 flex items-center justify-between text-[8px] text-slate-400">
                        <span>Odometer Stream: LIVE</span>
                        <span>Divergence: 0%</span>
                      </div>
                    </div>

                    {/* List item mock */}
                    <div className="bg-[#161d30] p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <div>
                          <p className="text-[10px] font-black text-slate-200">TRK-102 (Freightliner)</p>
                          <p className="text-[8px] text-slate-500">Driver: Alex Mercer</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">ETA 2h 45m</span>
                    </div>

                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. STATS STRIP */}
      <section className="bg-slate-900 text-white py-10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            
            <div className="space-y-1.5">
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-400 font-display">40%</p>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">average reduction in vehicle downtime</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-400 font-display">12,000+</p>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">trips dispatched through the platform</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-400 font-display">99.9%</p>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">uptime for live fleet tracking</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-400 font-display">500+</p>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">fleet assets managed daily</p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="platform" className="py-20 md:py-28 bg-white dark:bg-[#0b0f19] border-t border-b border-slate-100 dark:border-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Headers */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              Everything Your Fleet Team Needs — In One Place
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300">
              Purpose-built for logistics teams tired of chasing updates across spreadsheets, WhatsApp, and paper logs.
            </p>
          </div>

          {/* 6 Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card 1: Vehicle Registry */}
            <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:-translate-y-1 transition-all group">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform">
                <Truck size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">Vehicle Registry</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Track every vehicle's status, capacity, odometer, and lifecycle from a single source of truth.
              </p>
            </div>

            {/* Card 2: Driver Management */}
            <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:-translate-y-1 transition-all group">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">Driver Management</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Monitor license validity, safety scores, and duty status automatically.
              </p>
            </div>

            {/* Card 3: Smart Dispatch */}
            <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:-translate-y-1 transition-all group">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform">
                <Navigation size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">Smart Dispatch</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Assign trips only to available, compliant vehicles and drivers with cargo limits enforced automatically.
              </p>
            </div>

            {/* Card 4: Maintenance Workflows */}
            <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:-translate-y-1 transition-all group">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform">
                <Wrench size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">Maintenance Workflows</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Vehicles under service are instantly pulled from the dispatch pool.
              </p>
            </div>

            {/* Card 5: Fuel & Expense Tracking */}
            <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:-translate-y-1 transition-all group">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform">
                <Fuel size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">Fuel & Expense Tracking</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Log fuel, tolls, and repairs with operational costs calculated automatically.
              </p>
            </div>

            {/* Card 6: Live Analytics & Reports */}
            <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:-translate-y-1 transition-all group">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform">
                <BarChart3 size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">Live Analytics & Reports</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Fleet utilization, fuel efficiency, and ROI at a glance, exportable anytime.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 md:py-28 bg-slate-50 dark:bg-[#0b0f19] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Headers */}
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              Up and Running in Four Steps
            </h2>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              No complex consultants. Simple operational cloud onboarding.
            </p>
          </div>

          {/* Steps Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            
            {/* Step 1 */}
            <div className="relative space-y-4 text-left">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                  1
                </span>
                <div className="h-0.5 bg-slate-200 dark:bg-slate-800 flex-1 hidden lg:block"></div>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base pt-1">Register Your Fleet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Add vehicles and drivers with key operational details.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative space-y-4 text-left">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                  2
                </span>
                <div className="h-0.5 bg-slate-200 dark:bg-slate-800 flex-1 hidden lg:block"></div>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base pt-1">Plan & Dispatch Trips</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Assign trips with automatic validation.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative space-y-4 text-left">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                  3
                </span>
                <div className="h-0.5 bg-slate-200 dark:bg-slate-800 flex-1 hidden lg:block"></div>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base pt-1">Track in Real Time</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Status updates automatically as trips and maintenance progress.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative space-y-4 text-left">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                  4
                </span>
                <div className="w-0 flex-1"></div>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base pt-1">Review & Optimize</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Use built-in reports to cut costs and improve fleet ROI.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. SECONDARY CTA BANNER */}
      <section id="solutions" className="py-16 md:py-24 bg-blue-600 text-white relative overflow-hidden">
        {/* Abstract shapes inside banner */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-20 -translate-y-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/20 rounded-full -translate-x-20 translate-y-20"></div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-tight">
            Stop Managing Your Fleet on Spreadsheets
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto font-medium">
            Join logistics teams who switched to a system that enforces the rules for them.
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigateToLogin}
              className="bg-white hover:bg-slate-50 text-blue-600 font-extrabold text-sm px-8 py-4 rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer id="resources" className="bg-[#0b0f19] text-slate-400 pt-16 pb-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Footer Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-12 border-b border-slate-900">
            
            {/* Branding Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-xs">
                  <Truck size={16} />
                </div>
                <span className="font-extrabold font-display text-sm tracking-tight text-white">
                  TransitOps
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Smart transport operations, without the chaos.
              </p>
              <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500">
                <Shield size={12} className="text-blue-500" />
                <span>Enterprise SLA ISO/27001 Certified</span>
              </div>
            </div>

            {/* Column 1: Product */}
            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Product</h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#platform" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#solutions" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#changelog" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            {/* Column 2: Company */}
            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Company</h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#careers" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Column 3: Resources & Legal */}
            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Resources</h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#api" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright & Legal Strip */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              © 2026 TransitOps. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/escaner', label: 'Escáner', icon: '📸', short: 'Escáner' },
  { to: '/parqueadero', label: 'En Parqueadero', icon: '🅿️', short: 'Parqueo' },
  { to: '/', label: 'Panel Control', icon: '📊', short: 'Panel' },
  { to: '/motos', label: 'Motos Registradas', icon: '🏍️', short: 'Motos' },
  { to: '/abonos', label: 'Pagos y Abonos', icon: '💳', short: 'Pagos' },
  { to: '/historial', label: 'Historial', icon: '📋', short: 'Historial' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      {/* Top Header */}
      <header className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800/80 sticky top-0 z-50 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Brand / Logo */}
            <Link to="/escaner" className="flex items-center gap-3 group shrink-0">
              <div className="relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-white dark:bg-slate-800/80 p-1.5 shadow-xs border border-slate-200/80 dark:border-slate-700/80 group-hover:border-emerald-500/50 transition-colors">
                <img
                  src="/logo.png"
                  alt="Logo Funda Amiga"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <span className="hidden text-xl">🤝</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-base sm:text-lg">
                    FUNDA<span className="text-emerald-600 dark:text-emerald-400">AMIGA</span>
                  </span>
                  <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded-md tracking-wider uppercase border border-emerald-200 dark:border-emerald-500/30">
                    MOTOS
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                  Control & Parqueadero Inteligente
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-950/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/60">
              {navItems.map((item) => {
                const isActive = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions: Theme Toggle & Cloud Status */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle Button (Light/Dark) */}
              <button
                onClick={toggleTheme}
                className="h-10 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              >
                <span>{isDark ? '☀️' : '🌙'}</span>
                <span className="hidden sm:inline">{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
              </button>

              {/* Live Cloud Status */}
              <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 px-3 py-2 rounded-2xl text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-600 dark:text-slate-300 text-[11px] font-bold hidden sm:inline">Supabase</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Floating Bottom Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-white/95 dark:bg-slate-950/90 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="grid grid-cols-6 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 scale-105 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="text-lg leading-none mb-1">{item.icon}</span>
                <span className="text-[9px] font-bold tracking-tight truncate max-w-full">
                  {item.short}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
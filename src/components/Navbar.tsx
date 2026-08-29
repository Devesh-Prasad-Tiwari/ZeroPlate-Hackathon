import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UtensilsCrossed, Sun, Moon, Sparkles } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  activeView: string;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, activeView, onNavigateHome }) => {
  const { user, role, subscriptionPlan } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDonor = role === 'donor';

  return (
    <header
      className="bg-white dark:bg-[#1E293B] border-b border-gray-100 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-200"
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between gap-3">
        {/* Brand + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-100 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            <span className="sr-only">Toggle Sidebar</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Clickable ZeroPlate Logo -> Opens Dashboard */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none transition-transform active:scale-95"
            title="Go to Dashboard"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-400 text-white rounded-xl shadow-md flex items-center justify-center group-hover:shadow-orange-500/30 group-hover:scale-105 transition-all">
              <UtensilsCrossed className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-gray-900 dark:text-white leading-none group-hover:text-orange-500 transition-colors">
                ZeroPlate
              </span>
              <span className="text-[10px] text-orange-500 font-semibold leading-none hidden sm:block">
                Share Food, Share Hope
              </span>
            </div>
          </button>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2">
          {/* Portal badge */}
          <span
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${
              isDonor
                ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
            }`}
          >
            {isDonor ? '🍽️ Food Donor Portal' : '❤️ NGO Manager Portal'}
          </span>

          {/* Premium plan badge */}
          {subscriptionPlan === 'premium' ? (
            <span className="hidden lg:flex items-center gap-1 text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full shadow-md">
              <Sparkles className="w-3 h-3 fill-white" />
              Priority Plan
            </span>
          ) : (
            <span className="hidden lg:flex items-center text-[11px] font-semibold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 px-2.5 py-1.5 rounded-full">
              Standard
            </span>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:border-orange-300 hover:text-orange-500 transition-all text-xs font-bold cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* User pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-100 dark:border-slate-700">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-extrabold text-gray-900 dark:text-slate-100 leading-none truncate max-w-[120px]">
                {user?.name}
              </p>
              <p className="text-[10px] font-semibold text-orange-500 dark:text-orange-400 uppercase leading-none mt-0.5">
                {isDonor ? 'Food Donor' : 'NGO Manager'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

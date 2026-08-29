import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  ListFilter,
  Inbox,
  CalendarDays,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Settings,
  LogOut,
  Building2,
  MapPin,
  UtensilsCrossed,
  User,
} from 'lucide-react';

interface SubNavItem {
  id: string;
  labelKey: string;
  icon: any;
}

interface NavItem {
  id: string;
  labelKey: string;
  icon: any;
  badge?: number;
  subLinks?: SubNavItem[];
}

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string, extraData?: any) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  pendingRequestsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
  pendingRequestsCount = 0,
}) => {
  const { role, logout, user } = useAuth();
  const { t } = useLanguage();
  const isDonor = role === 'donor';

  const donorLinks: NavItem[] = [
    { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    {
      id: 'donations',
      labelKey: 'foodDonations',
      icon: UtensilsCrossed,
      subLinks: [
        { id: 'add-food', labelKey: 'addFood', icon: PlusCircle },
        { id: 'donations-available', labelKey: 'available', icon: ListFilter },
        { id: 'donations-reserved', labelKey: 'reservedPending', icon: ListFilter },
        { id: 'donations-completed', labelKey: 'completed', icon: ListFilter },
      ],
    },
    {
      id: 'requests',
      labelKey: 'ngoRequests',
      icon: Inbox,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    { id: 'bookings', labelKey: 'bookings', icon: CalendarDays },
    { id: 'impact', labelKey: 'impactDashboard', icon: TrendingUp },
    { id: 'messages', labelKey: 'messages', icon: MessageSquare },
  ];

  const ngoLinks: NavItem[] = [
    { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    {
      id: 'find-food',
      labelKey: 'findFood',
      icon: Search,
      subLinks: [
        { id: 'find-food-map', labelKey: 'mapView', icon: MapPin },
        { id: 'find-food-list', labelKey: 'listView', icon: ListFilter },
      ],
    },
    { id: 'my-requests', labelKey: 'myRequests', icon: Inbox },
    { id: 'bookings', labelKey: 'bookings', icon: CalendarDays },
    { id: 'messages', labelKey: 'messages', icon: MessageSquare },
    { id: 'impact', labelKey: 'impactDashboard', icon: TrendingUp },
  ];

  const mainLinks = isDonor ? donorLinks : ngoLinks;

  const secondaryLinks = [
    ...(!isDonor ? [{ id: 'subscription', labelKey: 'subscription', icon: Sparkles }] : []),
    { id: 'profile', labelKey: 'profile', icon: User },
    { id: 'settings', labelKey: 'settings', icon: Settings },
  ];

  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-[#1E293B] border-r border-orange-100 dark:border-slate-800/80 flex flex-col justify-between transition-all duration-300 transform ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Portal Identifier Badge */}
          <div className="px-3.5 py-2.5 bg-orange-50 dark:bg-orange-950/40 rounded-2xl border border-orange-200/60 dark:border-orange-800/60 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-orange" />
              <span className="text-xs font-black text-brand-deep dark:text-orange-400 uppercase tracking-wider">
                {isDonor ? t('donorPortal') : t('ngoPortal')}
              </span>
            </div>
          </div>

          {/* Main Role-Specific Navigation Tree */}
          <nav className="space-y-1">
            {mainLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.subLinks && item.subLinks.some((sub) => activeTab === sub.id));

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      onSelectTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-orange text-white shadow-warm-sm'
                        : 'text-gray-500 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-brand-orange dark:hover:text-orange-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                      <span>{t(item.labelKey)}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-white text-brand-deep shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Sub-links if active */}
                  {item.subLinks && isActive && (
                    <div className="pl-6 space-y-1 pt-1 border-l-2 border-orange-200 dark:border-orange-900 ml-4">
                      {item.subLinks.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeTab === sub.id;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              onSelectTab(sub.id);
                              if (onCloseMobile) onCloseMobile();
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSubActive
                                ? 'text-brand-orange dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 font-black'
                                : 'text-brand-muted dark:text-slate-400 hover:text-brand-text dark:hover:text-slate-200'
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5" />
                            <span>{t(sub.labelKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <hr className="border-gray-100 dark:border-slate-800" />

          {/* Secondary Links */}
          <nav className="space-y-1">
            {secondaryLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-orange text-white shadow-warm-sm'
                      : 'text-gray-500 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-brand-orange dark:hover:text-orange-400'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                  <span>{t(item.labelKey)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile & Signout */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-light dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900 text-brand-orange flex items-center justify-center font-black text-sm shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-brand-text dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-brand-muted dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('signOut')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

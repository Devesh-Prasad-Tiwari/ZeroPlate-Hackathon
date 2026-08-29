import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Toast, ToastMessage } from './components/Toast';

// Auth & Onboarding Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Onboarding } from './pages/Onboarding';

// Donor Pages
import { DonorDashboard } from './pages/DonorDashboard';
import { AddFood } from './pages/AddFood';
import { MyListings } from './pages/MyListings';
import { DonorRequests } from './pages/DonorRequests';
import { DeliveryPersonsPage } from './pages/DeliveryPersonsPage';
import { DeliveriesPage } from './pages/DeliveriesPage';

// NGO Pages
import { NGODashboard } from './pages/NGODashboard';
import { FindFood } from './pages/FindFood';
import { MyRequests } from './pages/MyRequests';
import { HireDeliveryPartnerPage } from './pages/HireDeliveryPartnerPage';

// Shared Pages
import { BookingsPage } from './pages/BookingsPage';
import { MessagesPage } from './pages/MessagesPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { ImpactDashboard } from './pages/ImpactDashboard';
import { SettingsPage } from './pages/SettingsPage';

const MainLayout: React.FC = () => {
  const { user, role } = useAuth();
  const { t } = useLanguage();

  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [pendingCount, setPendingCount] = useState(0);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({
      id: String(Date.now()),
      type,
      message,
    });
  };

  // Keep pending requests count fresh for donors
  useEffect(() => {
    if (user && role === 'donor') {
      fetch(`/api/requests?donorId=${user.id}&status=PENDING`)
        .then((res) => res.json())
        .then((data) => setPendingCount(data.length || 0))
        .catch(() => {});
    }
  }, [user, role, activeTab]);

  // Auth pages if user is not logged in
  if (!user) {
    if (authView === 'signup') {
      return <Signup onNavigateLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot') {
      return <ForgotPassword onNavigateLogin={() => setAuthView('login')} />;
    }
    return (
      <Login
        onNavigateSignup={() => setAuthView('signup')}
        onNavigateForgot={() => setAuthView('forgot')}
      />
    );
  }

  // Onboarding gate: if user is not yet onboarded, show role-specific setup
  if (user.onboarded === false) {
    return (
      <div className="min-h-screen bg-brand-bg dark:bg-[#0B1120] text-brand-text dark:text-slate-100 font-sans transition-colors duration-200">
        <Onboarding
          onComplete={() => setActiveTab('dashboard')}
          onShowToast={showToast}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  const handleNavigate = (tab: string, extraData?: any) => {
    setActiveTab(tab);
  };

  // Render role-protected views
  const renderView = () => {
    const isDonor = role === 'donor';

    switch (activeTab) {
      case 'dashboard':
        return isDonor ? (
          <DonorDashboard onNavigate={handleNavigate} />
        ) : (
          <NGODashboard
            onNavigate={handleNavigate}
            onRequestDonation={(donation) => {
              handleNavigate('find-food', { selectedDonation: donation });
            }}
          />
        );

      // Donor Specific Views
      case 'add-food':
        if (!isDonor) {
          return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-3xl border border-red-200 dark:border-red-800">
              Access Restricted: Only Food Donors may publish food donations.
            </div>
          );
        }
        return (
          <AddFood
            onSuccessPublished={() => setActiveTab('donations')}
            onShowToast={showToast}
          />
        );

      case 'donations':
      case 'donations-available':
      case 'donations-reserved':
      case 'donations-completed':
        if (!isDonor) {
          return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-3xl border border-red-200 dark:border-red-800">
              Access Restricted: Food Donations listings are available only for Food Donors.
            </div>
          );
        }
        return (
          <MyListings
            initialTab={activeTab}
            onNavigateAddFood={() => setActiveTab('add-food')}
            onNavigateRequests={() => setActiveTab('requests')}
          />
        );

      case 'requests':
        if (!isDonor) {
          return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-3xl border border-red-200 dark:border-red-800">
              Access Restricted: NGO Requests inbox is only accessible to Food Donors.
            </div>
          );
        }
        return (
          <DonorRequests
            onNavigateBookings={() => setActiveTab('deliveries')}
            onShowToast={showToast}
          />
        );

      case 'delivery-persons':
        if (!isDonor) {
          return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-3xl border border-red-200 dark:border-red-800">
              Access Restricted: Delivery fleet management is available to Food Donors.
            </div>
          );
        }
        return <DeliveryPersonsPage onShowToast={showToast} />;

      // NGO Specific Views
      case 'find-food':
      case 'find-food-map':
      case 'find-food-list':
      case 'nearby-donors':
        if (isDonor) {
          return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-3xl border border-red-200 dark:border-red-800">
              Access Restricted: Find Food discovery is exclusively for NGO Managers.
            </div>
          );
        }
        return (
          <FindFood
            initialViewMode={activeTab === 'find-food-map' ? 'map' : 'list'}
            onNavigateRequests={() => setActiveTab('my-requests')}
            onShowToast={showToast}
          />
        );

      case 'my-requests':
        if (isDonor) {
          return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-3xl border border-red-200 dark:border-red-800">
              Access Restricted: My Requests is exclusively for NGO Managers.
            </div>
          );
        }
        return (
          <MyRequests
            onNavigateFindFood={() => setActiveTab('find-food')}
            onNavigateBookings={() => setActiveTab('active-deliveries')}
            onShowToast={showToast}
          />
        );

      case 'hire-delivery':
        if (isDonor) {
          return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-3xl border border-red-200 dark:border-red-800">
              Access Restricted: Hire Delivery Partner is exclusively for NGO Managers.
            </div>
          );
        }
        return (
          <HireDeliveryPartnerPage
            onNavigateDeliveries={() => setActiveTab('active-deliveries')}
            onShowToast={showToast}
          />
        );

      // Shared Deliveries & Bookings
      case 'deliveries':
      case 'active-deliveries':
      case 'delivery-history':
        return <DeliveriesPage onShowToast={showToast} />;

      case 'bookings':
        return <BookingsPage onShowToast={showToast} />;

      case 'messages':
        return <MessagesPage />;

      case 'subscription':
        return (
          <SubscriptionPage
            onUpgradeSuccess={(msg) => {
              showToast('success', msg);
            }}
          />
        );

      case 'impact':
        return <ImpactDashboard />;

      case 'profile':
        return (
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-8 border border-amber-900/5 dark:border-slate-800 shadow-warm-sm space-y-4 max-w-xl transition-colors">
            <h2 className="text-xl font-black text-brand-text dark:text-slate-100">{t('orgProfile', 'Organization Profile')}</h2>
            <div className="space-y-2 text-xs text-brand-muted dark:text-slate-400">
              <p>
                {t('orgName', 'Organization Name')}: <strong className="text-brand-text dark:text-slate-200 font-bold">{user.name}</strong>
              </p>
              <p>
                {t('registeredEmail', 'Registered Email')}: <strong className="text-brand-text dark:text-slate-200 font-bold">{user.email}</strong>
              </p>
              <p>
                {t('assignedRole', 'Portal Role')}: <strong className="uppercase text-brand-orange dark:text-orange-400 font-extrabold">{role === 'donor' ? 'Food Donor / Volunteer' : 'NGO Manager'}</strong>
              </p>
              <p>
                {t('locationLabel', 'Location')}: <strong className="text-brand-text dark:text-slate-200 font-bold">{user.location || 'Mumbai, Maharashtra'}</strong>
              </p>
              <p>
                {t('statusLabel', 'Account Status')}:{' '}
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  {t('verifiedActive', 'Verified Active')}
                </span>
              </p>
            </div>
          </div>
        );

      case 'settings':
        return <SettingsPage onShowToast={showToast} />;

      default:
        return <div className="p-8 text-brand-muted dark:text-slate-400">Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF7] dark:bg-[#0B1120] text-[#1F2937] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        activeView={activeTab}
        onNavigateHome={() => setActiveTab('dashboard')}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          pendingRequestsCount={pendingCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {renderView()}
        </main>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

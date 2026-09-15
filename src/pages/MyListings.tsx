import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FoodDonation } from '../types';
import { FoodCard } from '../components/FoodCard';
import { LoadingState } from '../components/LoadingState';
import { Utensils, PlusCircle, Info } from 'lucide-react';

interface MyListingsProps {
  initialTab?: string;
  onNavigateAddFood: () => void;
  onNavigateRequests: (donation?: FoodDonation) => void;
}

export const MyListings: React.FC<MyListingsProps> = ({
  initialTab = 'all',
  onNavigateAddFood,
  onNavigateRequests,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [filterTab, setFilterTab] = useState<'all' | 'available' | 'reserved' | 'completed'>(
    initialTab === 'donations-available'
      ? 'available'
      : initialTab === 'donations-reserved'
      ? 'reserved'
      : initialTab === 'donations-completed'
      ? 'completed'
      : 'all'
  );

  const [donations, setDonations] = useState<FoodDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    fetchDonations();
  }, [user?.id]);

  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      const donorId = user?.id || 'donor_spicevilla';
      const res = await fetch(`/api/donations?donorId=${donorId}`);
      if (res.ok) {
        const data = await res.json();
        setDonations(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Fetch donations error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const availableDonations = donations.filter((d) => d.status === 'AVAILABLE');
  const reservedPendingDonations = donations.filter(
    (d) => d.status === 'PENDING_REQUEST' || d.status === 'RESERVED' || d.status === 'CONFIRMED'
  );
  const completedDonations = donations.filter((d) => d.status === 'COMPLETED');

  const filtered =
    filterTab === 'available'
      ? availableDonations
      : filterTab === 'reserved'
      ? reservedPendingDonations
      : filterTab === 'completed'
      ? completedDonations
      : donations;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {t('myFoodListings')}
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Track published surplus food listings, manage incoming requests, and monitor pickup statuses.
          </p>
        </div>
        <button
          onClick={onNavigateAddFood}
          className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 active:scale-95 shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('addFoodDonation')}</span>
        </button>
      </div>

      {/* Dynamic Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `${t('viewAll')} (${donations.length})` },
          { id: 'available', label: `${t('available')} (${availableDonations.length})` },
          { id: 'reserved', label: `${t('reservedPending')} (${reservedPendingDonations.length})` },
          { id: 'completed', label: `${t('completed')} (${completedDonations.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
              filterTab === tab.id
                ? 'bg-brand-orange text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState message="Loading food donation listings..." />
      ) : filtered.length === 0 ? (
        <div className="p-8 sm:p-12 bg-white dark:bg-slate-800/80 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-brand-orange flex items-center justify-center mx-auto border border-orange-100 dark:border-orange-900/50">
            <Utensils className="w-6 h-6" />
          </div>

          {filterTab === 'all' && (
            <>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">No food listings yet.</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                Share your surplus food with nearby NGOs and help turn excess into impact.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onNavigateAddFood}
                  className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> + Add Food Donation
                </button>
                <button
                  onClick={() => setShowHowItWorks(!showHowItWorks)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Info className="w-4 h-4 text-slate-500" /> Learn How It Works
                </button>
              </div>
              {showHowItWorks && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-left text-xs text-slate-600 dark:text-slate-300 space-y-2 border border-slate-200 dark:border-slate-700 max-w-md mx-auto">
                  <p className="font-extrabold text-slate-900 dark:text-slate-100">How Food Rescue Works:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Publish your surplus food details and pickup deadline.</li>
                    <li>Verified local NGOs submit requests for your donation.</li>
                    <li>Review and accept an NGO request to lock pickup confirmation.</li>
                    <li>NGO collects food and marks the drive completed!</li>
                  </ol>
                </div>
              )}
            </>
          )}

          {filterTab === 'available' && (
            <>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">No available food listings.</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                Active donations available for NGO pickup will appear here.
              </p>
              <button
                onClick={onNavigateAddFood}
                className="mt-2 px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> + Add Food Donation
              </button>
            </>
          )}

          {filterTab === 'reserved' && (
            <>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">No reserved or pending listings.</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                Donations with active NGO requests or confirmed reservations will appear here.
              </p>
            </>
          )}

          {filterTab === 'completed' && (
            <>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">No completed food rescues yet.</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                Completed donations will appear here after a successful pickup.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <FoodCard
              key={item.id}
              donation={item}
              role="donor"
              onViewRequests={() => onNavigateRequests(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

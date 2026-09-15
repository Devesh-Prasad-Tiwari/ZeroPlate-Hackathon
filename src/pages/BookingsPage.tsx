import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Booking } from '../types';
import { LoadingState } from '../components/LoadingState';
import {
  MapPin,
  Building,
  CheckCircle2,
  Clock,
  Check,
  XCircle,
  PlusCircle,
  UtensilsCrossed,
  Sparkles,
  Eye,
  X,
  AlertCircle,
  Calendar,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingsPageProps {
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
  onNavigate?: (tab: string, extraData?: any) => void;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({ onShowToast, onNavigate }) => {
  const { user, role } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [user?.id, role]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const donorId = user?.id || 'donor_spicevilla';
      const res = await fetch(`/api/bookings?userId=${donorId}&role=${role}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Fetch bookings error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setActionId(requestId);
    try {
      const res = await fetch(`/api/requests/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorId: user?.id || 'donor_spicevilla' }),
      });
      if (res.ok) {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, colors: ['#F97316', '#16A34A', '#10B981'] });
        if (onShowToast) onShowToast('success', 'Food request accepted! Booking confirmed.');
        fetchBookings();
      } else {
        const err = await res.json();
        if (onShowToast) onShowToast('error', err.error || 'Failed to accept request.');
      }
    } catch (e) {
      console.error('Accept request error', e);
    } finally {
      setActionId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionId(requestId);
    try {
      const res = await fetch(`/api/requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorId: user?.id || 'donor_spicevilla' }),
      });
      if (res.ok) {
        if (onShowToast) onShowToast('info', 'Request rejected.');
        fetchBookings();
      } else {
        const err = await res.json();
        if (onShowToast) onShowToast('error', err.error || 'Failed to reject request.');
      }
    } catch (e) {
      console.error('Reject request error', e);
    } finally {
      setActionId(null);
    }
  };

  const handleCompletePickup = async (bookingId: string) => {
    setActionId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || 'donor_spicevilla' }),
      });
      if (res.ok) {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 }, colors: ['#F97316', '#16A34A', '#10B981'] });
        if (onShowToast) onShowToast('success', 'Pickup confirmed as COMPLETED! Impact metrics updated.');
        fetchBookings();
      } else {
        const err = await res.json();
        if (onShowToast) onShowToast('error', err.error || 'Failed to complete pickup.');
      }
    } catch (e) {
      console.error('Complete pickup error', e);
    } finally {
      setActionId(null);
    }
  };

  const activeStatuses = ['REQUESTED', 'PENDING', 'RESERVED', 'CONFIRMED', 'DELIVERY_ASSIGNED', 'PICKUP_IN_PROGRESS', 'FOOD_PICKED_UP', 'OUT_FOR_DELIVERY', 'NEAR_DESTINATION'];
  const completedStatuses = ['COMPLETED', 'DELIVERED', 'PICKUP_COMPLETED'];
  const cancelledStatuses = ['CANCELLED', 'EXPIRED', 'REJECTED'];

  const activeBookings = bookings.filter((b) => activeStatuses.includes(b.status));
  const completedBookings = bookings.filter((b) => completedStatuses.includes(b.status));
  const cancelledBookings = bookings.filter((b) => cancelledStatuses.includes(b.status));

  const currentList = activeTab === 'active' ? activeBookings : activeTab === 'completed' ? completedBookings : cancelledBookings;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Food Bookings & Pickups
        </h1>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          Manage locked food arrangements, coordinate collection timing, and confirm completed pickups.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {[
          { id: 'active', label: `Active Bookings (${activeBookings.length})` },
          { id: 'completed', label: `Completed Rescues (${completedBookings.length})` },
          { id: 'cancelled', label: `Cancelled / Expired (${cancelledBookings.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-brand-orange text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState message="Loading bookings..." />
      ) : currentList.length === 0 ? (
        <div className="p-8 sm:p-12 bg-white dark:bg-slate-800/80 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-brand-orange flex items-center justify-center mx-auto border border-orange-100 dark:border-orange-900/50">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          {activeTab === 'active' && (
            <>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">No active bookings yet.</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                Once an NGO requests your surplus food, your active bookings will appear here.
              </p>
              {onNavigate && (
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => onNavigate('add-food')}
                    className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Food Donation</span>
                  </button>
                  <button
                    onClick={() => onNavigate('donations')}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    View My Listings
                  </button>
                </div>
              )}
            </>
          )}
          {activeTab === 'completed' && (
            <>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">No completed rescue drives yet.</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                Your successfully completed food donations will appear here.
              </p>
            </>
          )}
          {activeTab === 'cancelled' && (
            <>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">No cancelled bookings.</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                Cancelled or expired bookings will appear here.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((item) => {
            const isRequested = item.status === 'REQUESTED' || item.status === 'PENDING';
            const isReserved = item.status === 'RESERVED';
            const isConfirmed = item.status === 'CONFIRMED' || item.status === 'DELIVERY_ASSIGNED' || item.status === 'PICKUP_IN_PROGRESS';
            const isCompleted = item.status === 'COMPLETED' || item.status === 'DELIVERED' || item.status === 'PICKUP_COMPLETED';
            const isCancelled = item.status === 'CANCELLED' || item.status === 'EXPIRED' || item.status === 'REJECTED';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">{item.foodName}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 dark:bg-orange-950/40 text-brand-orange border border-orange-200/60 dark:border-orange-800/50">
                      {item.mealCount} Meals
                    </span>
                    {isRequested && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> 🟡 REQUESTED
                      </span>
                    )}
                    {isReserved && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-300 border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> 🟠 RESERVED
                      </span>
                    )}
                    {isConfirmed && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> 🔵 CONFIRMED FOR PICKUP
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 RESCUE DRIVE COMPLETED
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> 🔴 {item.status}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>NGO Partner: <strong className="text-slate-900 dark:text-slate-200">{item.ngoName}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-orange shrink-0" />
                      <span>Pickup: <strong className="text-slate-900 dark:text-slate-200">{item.pickupLocation || item.pickupAddress}</strong></span>
                    </div>
                    {item.matchScore && (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Match Score: <strong className="text-slate-900 dark:text-slate-200">{item.matchScore}% Best Match</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex flex-wrap items-center gap-2.5">
                  {isRequested && (
                    <>
                      <button
                        onClick={() => handleAcceptRequest(item.requestId || item.id)}
                        disabled={actionId === item.id}
                        className="px-4 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4 stroke-[3]" /> Accept Request
                      </button>
                      <button
                        onClick={() => handleRejectRequest(item.requestId || item.id)}
                        disabled={actionId === item.id}
                        className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-red-50 hover:text-red-600 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {isConfirmed && (
                    <button
                      onClick={() => handleCompletePickup(item.id)}
                      disabled={actionId === item.id}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Check className="w-4 h-4 stroke-[3]" /> Confirm Pickup Completed
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-slate-500" /> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-orange" />
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Booking Details</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{selectedItem.foodName}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-orange text-white">{selectedItem.mealCount} Meals</span>
                </div>
                {selectedItem.foodType && <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Type: {selectedItem.foodType}</p>}
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {selectedItem.ngoName && (
                  <div className="flex items-start gap-2.5">
                    <Building className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div><span className="text-[11px] font-bold text-slate-400 block uppercase">NGO Partner</span><strong className="text-slate-900 dark:text-slate-100">{selectedItem.ngoName}</strong></div>
                  </div>
                )}
                {(selectedItem.pickupLocation || selectedItem.pickupAddress) && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                    <div><span className="text-[11px] font-bold text-slate-400 block uppercase">Pickup Address</span><strong className="text-slate-900 dark:text-slate-100">{selectedItem.pickupAddress || selectedItem.pickupLocation}</strong></div>
                  </div>
                )}
                {selectedItem.matchScore && (
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div><span className="text-[11px] font-bold text-slate-400 block uppercase">Match Score</span><strong className="text-slate-900 dark:text-slate-100">{selectedItem.matchScore}% Best Match</strong></div>
                  </div>
                )}
                {selectedItem.status && (
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div><span className="text-[11px] font-bold text-slate-400 block uppercase">Current Status</span><strong className="text-slate-900 dark:text-slate-100 uppercase">{selectedItem.status}</strong></div>
                  </div>
                )}
                {selectedItem.createdAt && (
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div><span className="text-[11px] font-bold text-slate-400 block uppercase">Created At</span><strong className="text-slate-900 dark:text-slate-100">{new Date(selectedItem.createdAt).toLocaleString()}</strong></div>
                  </div>
                )}
                {selectedItem.notes && (
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div><span className="text-[11px] font-bold text-slate-400 block uppercase">Notes</span><strong className="text-slate-900 dark:text-slate-100">{selectedItem.notes}</strong></div>
                  </div>
                )}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button onClick={() => setSelectedItem(null)} className="px-5 py-2.5 bg-slate-900 text-white font-extrabold text-xs rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

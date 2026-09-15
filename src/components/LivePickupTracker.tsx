import React, { useState, useEffect } from 'react';
import { Booking, UserRole } from '../types';
import { calculateHaversineDistance } from '../services/matching/matchingEngine';
import {
  MapPin,
  Navigation,
  Clock,
  CheckCircle2,
  Building,
  ShieldCheck,
  Truck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LivePickupTrackerProps {
  booking: Booking;
  currentRole: UserRole;
  currentUserId: string;
  onStatusChanged?: () => void;
  onShowToast?: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const LivePickupTracker: React.FC<LivePickupTrackerProps> = ({
  booking,
  currentRole,
  currentUserId,
  onStatusChanged,
  onShowToast,
}) => {
  const [donorLat, setDonorLat] = useState(booking.donorLatitude || 19.076);
  const [donorLng, setDonorLng] = useState(booking.donorLongitude || 72.8777);
  const [ngoLat, setNgoLat] = useState(booking.ngoLatitude || 19.062);
  const [ngoLng, setNgoLng] = useState(booking.ngoLongitude || 72.854);
  const [isUpdating, setIsUpdating] = useState(false);

  const distanceKm = calculateHaversineDistance(donorLat, donorLng, ngoLat, ngoLng);
  // Average urban vehicle speed 15 km/h -> ~4 min per km
  const etaMinutes = Math.max(5, Math.round(distanceKm * 4));

  const steps: { key: string; label: string }[] = [
    { key: 'REQUESTED', label: 'Requested' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PICKUP_IN_PROGRESS', label: 'Pickup In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'REQUESTED':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'CONFIRMED':
        return 2;
      case 'PICKUP_IN_PROGRESS':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 2;
    }
  };

  const currentStepIdx = getStepIndex(booking.status);

  const handleStartPickup = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, status: 'PICKUP_IN_PROGRESS' }),
      });
      if (res.ok) {
        if (onShowToast) onShowToast('info', 'Pickup vehicle is en route! Status updated to PICKUP IN PROGRESS.');
        if (onStatusChanged) onStatusChanged();
      }
    } catch (e) {
      console.warn('Start pickup error', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompletePickup = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });
      if (res.ok) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#F97316', '#16A34A', '#10B981'],
        });
        if (onShowToast) onShowToast('success', 'Food rescue completed! Impact metrics updated.');
        if (onStatusChanged) onStatusChanged();
      }
    } catch (e) {
      console.warn('Complete pickup error', e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-orange-200/80 p-6 shadow-warm-md space-y-6 animate-status-pop">
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">
              Live Pickup Coordination
            </span>
            <span className="text-[10px] bg-brand-light text-brand-deep px-2 py-0.5 rounded-full font-bold border border-orange-200">
              🔒 Scoped to Matched Counterparties Only
            </span>
          </div>
          <h3 className="text-lg font-black text-brand-text mt-1">
            {booking.foodName} ({booking.mealCount} Meals)
          </h3>
        </div>

        {/* Live Distance & ETA Banner */}
        <div className="flex items-center gap-3 bg-brand-cream px-4 py-2 rounded-2xl border border-orange-200">
          <Truck className="w-5 h-5 text-brand-orange animate-bounce" />
          <div className="text-xs">
            <span className="text-brand-muted block font-medium">Distance & ETA</span>
            <strong className="text-brand-text font-black">
              {distanceKm} km away • Est. Arrival: ~{etaMinutes} mins
            </strong>
          </div>
        </div>
      </div>

      {/* Progress Stepper (§6) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-brand-orange -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step, idx) => {
            const isPassed = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isPassed
                      ? 'bg-brand-orange text-white shadow-sm ring-4 ring-orange-100'
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[10px] font-bold mt-1.5 whitespace-nowrap ${
                    isCurrent ? 'text-brand-orange font-black' : isPassed ? 'text-brand-text' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Map Representation */}
      <div className="relative w-full h-44 bg-gradient-to-br from-slate-900 via-stone-900 to-amber-950 rounded-2xl overflow-hidden shadow-inner p-4 flex items-center justify-around border border-amber-950/30">
        {/* Radar grid backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(#F97316_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

        {/* Donor Pin (🍽️) */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <span className="absolute -inset-2 rounded-full bg-orange-500/30 animate-ping" />
            <div className="w-10 h-10 rounded-2xl bg-brand-orange text-white flex items-center justify-center shadow-lg border-2 border-white text-lg">
              🍽️
            </div>
          </div>
          <span className="mt-1 px-2.5 py-0.5 bg-black/80 backdrop-blur-md rounded-full text-white font-extrabold text-[10px] border border-white/20">
            {booking.donorName}
          </span>
        </div>

        {/* Connection Pulse Line */}
        <div className="flex-1 max-w-[140px] flex items-center justify-center relative">
          <div className="w-full h-0.5 border-t-2 border-dashed border-orange-400/80 animate-pulse" />
          <span className="absolute px-2 py-0.5 bg-black/80 text-orange-300 font-mono text-[9px] rounded-full border border-orange-400/40">
            {distanceKm} km
          </span>
        </div>

        {/* NGO Pin (❤️) */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <span className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-ping" />
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white text-lg">
              ❤️
            </div>
          </div>
          <span className="mt-1 px-2.5 py-0.5 bg-black/80 backdrop-blur-md rounded-full text-emerald-300 font-extrabold text-[10px] border border-emerald-400/30">
            {booking.ngoName}
          </span>
        </div>
      </div>

      {/* Confirmed Pickup Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-brand-cream/80 p-4 rounded-2xl border border-orange-100">
        <div>
          <span className="text-brand-muted block">Confirmed Pickup Address:</span>
          <strong className="text-brand-text font-bold flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0" />
            <span>{booking.pickupAddress || booking.pickupLocation}</span>
          </strong>
        </div>
        <div>
          <span className="text-brand-muted block">Pickup Deadline / Target:</span>
          <strong className="text-red-600 font-bold flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>{new Date(booking.pickupTime || booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </strong>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {booking.status === 'CONFIRMED' && (
          <button
            onClick={handleStartPickup}
            disabled={isUpdating}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-warm-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Truck className="w-4 h-4" />
            <span>Start Pickup Vehicle (In Progress)</span>
          </button>
        )}

        {(booking.status === 'CONFIRMED' || booking.status === 'PICKUP_IN_PROGRESS') && (
          <button
            onClick={handleCompletePickup}
            disabled={isUpdating}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-warm-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Confirm Pickup Completed</span>
          </button>
        )}

        {booking.status === 'COMPLETED' && (
          <div className="px-4 py-2 bg-emerald-100 text-emerald-900 font-black text-xs rounded-xl border border-emerald-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>Rescue Run Completed Successfully</span>
          </div>
        )}
      </div>
    </div>
  );
};

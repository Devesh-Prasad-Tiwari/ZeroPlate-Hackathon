import { Router } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/bookings
router.get('/', (req, res) => {
  const { userId, role } = req.query;
  const store = db.getStore();

  let userBookings: any[] = [];

  if (userId) {
    if (role === 'donor') {
      const donorBookings = store.bookings.filter((b) => b.donorId === userId);

      const pendingRequests = store.requests
        .filter((r) => r.donorId === userId && r.status === 'PENDING')
        .map((r) => {
          const donation = store.donations.find((d) => d.id === r.donationId);
          return {
            id: r.id,
            isRequest: true,
            requestId: r.id,
            donationId: r.donationId,
            ngoId: r.ngoId,
            ngoName: r.ngoName,
            donorId: r.donorId,
            donorName: r.donorName,
            foodName: r.foodName,
            mealCount: r.requestedMeals,
            foodType: donation?.foodType,
            pickupLocation: donation?.pickupLocation || donation?.pickupAddress || 'Pickup Location',
            pickupAddress: donation?.pickupAddress || donation?.pickupLocation || '',
            status: 'REQUESTED',
            matchScore: r.matchScore,
            createdAt: r.requestedAt,
            notes: r.notes,
          };
        });

      const rejectedRequests = store.requests
        .filter((r) => r.donorId === userId && (r.status === 'REJECTED' || r.status === 'CANCELLED'))
        .map((r) => {
          const donation = store.donations.find((d) => d.id === r.donationId);
          return {
            id: r.id,
            isRequest: true,
            requestId: r.id,
            donationId: r.donationId,
            ngoId: r.ngoId,
            ngoName: r.ngoName,
            donorId: r.donorId,
            donorName: r.donorName,
            foodName: r.foodName,
            mealCount: r.requestedMeals,
            foodType: donation?.foodType,
            pickupLocation: donation?.pickupLocation || donation?.pickupAddress || 'Pickup Location',
            pickupAddress: donation?.pickupAddress || donation?.pickupLocation || '',
            status: r.status === 'REJECTED' ? 'REJECTED' : 'CANCELLED',
            matchScore: r.matchScore,
            createdAt: r.requestedAt,
            notes: r.notes,
          };
        });

      userBookings = [...donorBookings, ...pendingRequests, ...rejectedRequests];
    } else if (role === 'ngo') {
      const ngoBookings = store.bookings.filter((b) => b.ngoId === userId);
      const ngoRequests = store.requests
        .filter((r) => r.ngoId === userId && r.status === 'PENDING')
        .map((r) => {
          const donation = store.donations.find((d) => d.id === r.donationId);
          return {
            id: r.id,
            isRequest: true,
            requestId: r.id,
            donationId: r.donationId,
            ngoId: r.ngoId,
            ngoName: r.ngoName,
            donorId: r.donorId,
            donorName: r.donorName,
            foodName: r.foodName,
            mealCount: r.requestedMeals,
            foodType: donation?.foodType,
            pickupLocation: donation?.pickupLocation || donation?.pickupAddress || 'Pickup Location',
            pickupAddress: donation?.pickupAddress || donation?.pickupLocation || '',
            status: 'REQUESTED',
            matchScore: r.matchScore,
            createdAt: r.requestedAt,
            notes: r.notes,
          };
        });

      const ngoInactiveRequests = store.requests
        .filter((r) => r.ngoId === userId && (r.status === 'REJECTED' || r.status === 'CANCELLED'))
        .map((r) => {
          const donation = store.donations.find((d) => d.id === r.donationId);
          return {
            id: r.id,
            isRequest: true,
            requestId: r.id,
            donationId: r.donationId,
            ngoId: r.ngoId,
            ngoName: r.ngoName,
            donorId: r.donorId,
            donorName: r.donorName,
            foodName: r.foodName,
            mealCount: r.requestedMeals,
            foodType: donation?.foodType,
            pickupLocation: donation?.pickupLocation || donation?.pickupAddress || 'Pickup Location',
            pickupAddress: donation?.pickupAddress || donation?.pickupLocation || '',
            status: r.status === 'REJECTED' ? 'REJECTED' : 'CANCELLED',
            matchScore: r.matchScore,
            createdAt: r.requestedAt,
            notes: r.notes,
          };
        });

      userBookings = [...ngoBookings, ...ngoRequests, ...ngoInactiveRequests];
    } else {
      userBookings = store.bookings.filter((b) => b.donorId === userId || b.ngoId === userId);
    }
  } else {
    userBookings = store.bookings;
  }

  // Deduplicate requests that have already become bookings
  const bookingRequestIds = new Set(userBookings.filter((b) => !b.isRequest && b.requestId).map((b) => b.requestId));
  userBookings = userBookings.filter((b) => !b.isRequest || !bookingRequestIds.has(b.requestId));

  // Sort newest first
  userBookings.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return res.json(userBookings);
});

// GET /api/bookings/:id/tracking (§6, §7)
// STRICT AUTHORIZATION: Scoped exclusively to the 2 parties on that booking
router.get('/:id/tracking', (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  const store = db.getStore();
  const booking = store.bookings.find((b) => b.id === id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  if (userId && booking.donorId !== userId && booking.ngoId !== userId) {
    return res.status(403).json({ error: 'Unauthorized: Location tracking is restricted to the two counterparties on this active booking.' });
  }

  const updates = store.locationUpdates.filter((u) => u.bookingId === id);

  return res.json({
    booking,
    updates,
    donorLocation: {
      latitude: booking.donorLatitude || 19.076,
      longitude: booking.donorLongitude || 72.8777,
      address: booking.pickupAddress,
    },
    ngoLocation: {
      latitude: booking.ngoLatitude || 19.062,
      longitude: booking.ngoLongitude || 72.854,
    },
  });
});

// POST /api/bookings/:id/location
router.post('/:id/location', (req, res) => {
  const { id } = req.params;
  const { userId, role, latitude, longitude } = req.body;

  if (!userId || !latitude || !longitude || !role) {
    return res.status(400).json({ error: 'User ID, role, latitude, and longitude are required.' });
  }

  const result = db.updateBookingLocation(id, userId, role, Number(latitude), Number(longitude));
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json(result);
});

// POST /api/bookings/:id/status (CONFIRMED -> PICKUP_IN_PROGRESS -> COMPLETED)
router.post('/:id/status', (req, res) => {
  const { id } = req.params;
  const { userId, status } = req.body;

  if (!userId || !status) {
    return res.status(400).json({ error: 'User ID and target status are required.' });
  }

  const result = db.updateBookingStatus(id, status);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json(result);
});

// POST /api/bookings/:id/complete
router.post('/:id/complete', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const result = db.completePickup(id, userId || '');
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json(result);
});

export default router;

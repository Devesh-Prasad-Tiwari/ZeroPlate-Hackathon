import fs from 'fs';
import path from 'path';
import {
  User,
  FoodDonation,
  NGOEntity,
  DonorEntity,
  NGOFoodRequirement,
  FoodRequest,
  Booking,
  DeliveryPerson,
  DeliveryLocationUpdate,
  Message,
  Subscription,
  NotificationItem,
  BookingStatus,
} from '../src/types';
import { computeFullMatch } from '../src/services/matching/matchingEngine';

const DB_FILE = path.resolve(process.cwd(), 'zeroplate_db.json');

interface DBData {
  users: User[];
  ngos: NGOEntity[];
  donors: DonorEntity[];
  requirements: NGOFoodRequirement[];
  donations: FoodDonation[];
  requests: FoodRequest[];
  bookings: Booking[];
  deliveryPersons: DeliveryPerson[];
  locationUpdates: DeliveryLocationUpdate[];
  messages: Message[];
  subscriptions: Subscription[];
  notifications: NotificationItem[];
}

const initialSeedData: DBData = {
  users: [
    {
      id: 'donor_spicevilla',
      name: 'SpiceVilla Restaurant',
      email: 'donor@spicevilla.com',
      role: 'donor',
      phone: '+91 98200 12345',
      donorType: 'Restaurant',
      subscriptionPlan: 'free',
      location: 'Shop 4, Hill Road, Bandra West, Mumbai',
      latitude: 19.076,
      longitude: 72.8777,
      emailVerified: true,
      onboarded: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'donor_greenleaf',
      name: 'Green Leaf Cafe',
      email: 'donor@greenleaf.com',
      role: 'donor',
      phone: '+91 98201 67890',
      donorType: 'Caterer',
      subscriptionPlan: 'premium',
      location: '12 Juhu Tara Road, Juhu, Mumbai',
      latitude: 19.088,
      longitude: 72.826,
      emailVerified: true,
      onboarded: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ngo_hope',
      name: 'Hope Foundation',
      email: 'ngo@hope.org',
      role: 'ngo',
      phone: '+91 98111 88888',
      organizationType: 'NGO',
      subscriptionPlan: 'premium',
      location: 'Bandra East Community Center, Mumbai',
      latitude: 19.062,
      longitude: 72.854,
      emailVerified: true,
      onboarded: true,
      createdAt: new Date().toISOString(),
    },
  ],
  ngos: [
    {
      id: 'ngo_entity_hope',
      userId: 'ngo_hope',
      organizationName: 'Hope Foundation',
      organizationType: 'NGO',
      contactPerson: 'Anjali Sharma',
      phone: '+91 98111 88888',
      email: 'ngo@hope.org',
      address: 'Bandra East Community Center, Mumbai',
      latitude: 19.062,
      longitude: 72.854,
      locationSharingEnabled: true,
      capacity: 120,
      createdAt: new Date().toISOString(),
    },
  ],
  donors: [
    {
      id: 'donor_entity_spicevilla',
      userId: 'donor_spicevilla',
      donorType: 'Restaurant',
      organizationName: 'SpiceVilla Restaurant',
      contactPerson: 'Chef Vikram Malhotra',
      phone: '+91 98200 12345',
      email: 'donor@spicevilla.com',
      address: 'Shop 4, Hill Road, Bandra West, Mumbai 400050',
      latitude: 19.076,
      longitude: 72.8777,
      isHousehold: false,
      createdAt: new Date().toISOString(),
    },
  ],
  requirements: [
    {
      id: 'req_hope_default',
      ngoId: 'ngo_hope',
      requiredMeals: 80,
      foodSpecifications: ['Rice', 'Dal', 'Rice + Dal', 'Biryani'],
      foodType: 'veg',
      urgency: 'high',
      requiredBy: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      maximumRadius: 5,
      specificRequirement: 'Nutritious lunch meal for 80 children at Bandra East shelter',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  ],
  donations: [],
  requests: [],
  bookings: [],
  deliveryPersons: [
    {
      id: 'del_rahul',
      donorId: 'donor_spicevilla',
      name: 'Rahul Sharma',
      phone: '+91 98765 43210',
      role: 'Volunteer',
      vehicleType: 'Bike',
      vehicleNumber: 'MH-02-BQ-4512',
      availability: 'Available',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'del_amit',
      donorId: 'donor_spicevilla',
      name: 'Amit Verma',
      phone: '+91 98765 11223',
      role: 'Driver',
      vehicleType: 'Van',
      vehicleNumber: 'MH-02-CV-8890',
      availability: 'Available',
      createdAt: new Date().toISOString(),
    },
  ],
  locationUpdates: [],
  messages: [],
  subscriptions: [],
  notifications: [],
};

class Database {
  private data: DBData;

  constructor() {
    this.data = this.load();
  }

  private getDbPath(): string {
    const tmpFile = path.join('/tmp', 'zeroplate_db.json');
    if (fs.existsSync(tmpFile)) {
      return tmpFile;
    }
    return DB_FILE;
  }

  private load(): DBData {
    try {
      const dbPath = this.getDbPath();
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.donors) parsed.donors = initialSeedData.donors || [];
        if (!parsed.ngos) parsed.ngos = initialSeedData.ngos || [];
        if (!parsed.users) parsed.users = initialSeedData.users || [];
        if (!parsed.donations) parsed.donations = [];
        if (!parsed.deliveryPersons) parsed.deliveryPersons = initialSeedData.deliveryPersons || [];
        if (!parsed.requests) parsed.requests = [];
        if (!parsed.bookings) parsed.bookings = [];
        if (!parsed.messages) parsed.messages = [];
        if (!parsed.subscriptions) parsed.subscriptions = [];
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.requirements) parsed.requirements = [];
        if (!parsed.locationUpdates) parsed.locationUpdates = [];
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to read DB file, resetting to initial seed.');
    }
    this.save(initialSeedData);
    return initialSeedData;
  }

  private save(data: DBData) {
    this.data = data;
    const tmpFile = path.join('/tmp', 'zeroplate_db.json');
    try {
      if (process.env.VERCEL) {
        fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
        return;
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      try {
        fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      } catch (err) {
        console.warn('Could not save DB to disk in serverless container:', err);
      }
    }
  }


  public getStore(): DBData {
    return this.data;
  }

  public getDeliveryPersons(donorId?: string): DeliveryPerson[] {
    if (donorId) {
      return this.data.deliveryPersons.filter((d) => d.donorId === donorId || d.donorId === 'donor_spicevilla');
    }
    return this.data.deliveryPersons;
  }

  public addDeliveryPerson(
    personData: Omit<DeliveryPerson, 'id' | 'createdAt'>
  ): DeliveryPerson {
    const newPerson: DeliveryPerson = {
      ...personData,
      id: `del_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      availability: personData.availability || 'Available',
      createdAt: new Date().toISOString(),
    };
    this.data.deliveryPersons.unshift(newPerson);
    this.save(this.data);
    return newPerson;
  }

  public assignDeliveryPerson(
    bookingId: string,
    deliveryPersonId: string
  ): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.data.bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const person = this.data.deliveryPersons.find((p) => p.id === deliveryPersonId);
    if (!person) return { success: false, error: 'Delivery person not found.' };

    booking.deliveryPersonId = person.id;
    booking.deliveryPersonName = person.name;
    booking.deliveryPersonPhone = person.phone;
    booking.deliveryVehicleType = person.vehicleType;
    booking.deliveryVehicleNumber = person.vehicleNumber;
    booking.status = 'DELIVERY_ASSIGNED';

    person.activeBookingId = booking.id;
    person.availability = 'Unavailable';

    this.save(this.data);
    return { success: true, booking };
  }

  public setNGORequirement(
    ngoId: string,
    reqData: Omit<NGOFoodRequirement, 'id' | 'ngoId' | 'createdAt'>
  ): NGOFoodRequirement {
    let req = this.data.requirements.find((r) => r.ngoId === ngoId && r.status === 'ACTIVE');
    const now = new Date().toISOString();

    if (req) {
      req.requiredMeals = reqData.requiredMeals;
      req.foodSpecifications = reqData.foodSpecifications || [];
      req.foodType = reqData.foodType;
      req.urgency = reqData.urgency;
      req.requiredBy = reqData.requiredBy;
      req.maximumRadius = reqData.maximumRadius;
      req.specificRequirement = reqData.specificRequirement;
    } else {
      req = {
        id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        ngoId,
        requiredMeals: reqData.requiredMeals,
        foodSpecifications: reqData.foodSpecifications || [],
        foodType: reqData.foodType,
        urgency: reqData.urgency,
        requiredBy: reqData.requiredBy,
        maximumRadius: reqData.maximumRadius,
        specificRequirement: reqData.specificRequirement,
        status: 'ACTIVE',
        createdAt: now,
      };
      this.data.requirements.unshift(req);
    }
    this.save(this.data);
    return req;
  }

  public getNGORequirement(ngoId: string): NGOFoodRequirement | undefined {
    return this.data.requirements.find((r) => r.ngoId === ngoId && r.status === 'ACTIVE');
  }

  public createFoodRequest(
    donationId: string,
    ngoId: string,
    ngoName: string,
    requestedMeals?: number,
    notes?: string
  ): { success: boolean; request?: FoodRequest; error?: string } {
    const donation = this.data.donations.find((d) => d.id === donationId);
    if (!donation) {
      return { success: false, error: 'Food donation not found.' };
    }

    if (donation.status === 'CONFIRMED' || donation.status === 'RESERVED' || donation.status === 'COMPLETED') {
      return { success: false, error: 'This food donation is already reserved.' };
    }

    const existing = this.data.requests.find(
      (r) => r.donationId === donationId && r.ngoId === ngoId && r.status === 'PENDING'
    );
    if (existing) {
      return { success: false, error: 'Your organization already has a pending request for this donation.' };
    }

    const ngoUser = this.data.users.find((u) => u.id === ngoId);
    const ngoEntity = this.data.ngos.find((n) => n.userId === ngoId || n.id === ngoId);
    const ngoReq = this.getNGORequirement(ngoId);

    const ngoLat = ngoEntity?.latitude || ngoUser?.latitude || 19.062;
    const ngoLng = ngoEntity?.longitude || ngoUser?.longitude || 72.854;
    const isPremium = ngoUser?.subscriptionPlan === 'premium';

    const match = computeFullMatch(
      { lat: donation.latitude, lng: donation.longitude },
      { lat: ngoLat, lng: ngoLng },
      donation.mealCount,
      ngoReq?.requiredMeals || ngoEntity?.capacity || 80,
      donation.pickupDeadline,
      isPremium,
      ngoName
    );

    const newRequest: FoodRequest = {
      id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      donationId,
      ngoId,
      ngoName,
      donorId: donation.donorId,
      donorName: donation.donorName,
      foodName: donation.foodName,
      requestedMeals: requestedMeals || donation.mealCount,
      matchScore: match.matchScore,
      distanceScore: match.distanceScore,
      mealQuantityScore: match.mealQuantityScore,
      mealScore: match.mealQuantityScore,
      foodSpecScore: match.foodSpecScore,
      urgencyScore: match.urgencyScore,
      distanceKm: match.distanceKm,
      explanation: match.explanation,
      status: 'PENDING',
      notes,
      requestedAt: new Date().toISOString(),
    };

    this.data.requests.unshift(newRequest);
    donation.status = 'PENDING_REQUEST';
    donation.pendingRequestsCount = (donation.pendingRequestsCount || 0) + 1;

    this.save(this.data);
    return { success: true, request: newRequest };
  }

  public acceptFoodRequest(
    requestId: string,
    donorId: string
  ): { success: boolean; request?: FoodRequest; booking?: Booking; error?: string } {
    const request = this.data.requests.find((r) => r.id === requestId);
    if (!request) return { success: false, error: 'Request not found.' };

    if (request.donorId !== donorId && donorId !== 'donor_spicevilla') {
      return { success: false, error: 'Unauthorized.' };
    }

    if (request.status !== 'PENDING') {
      return { success: false, error: `This request is already ${request.status.toLowerCase()}.` };
    }

    const donation = this.data.donations.find((d) => d.id === request.donationId);
    if (!donation) return { success: false, error: 'Associated donation not found.' };

    const ngoUser = this.data.users.find((u) => u.id === request.ngoId);
    const ngoEntity = this.data.ngos.find((n) => n.userId === request.ngoId);
    const now = new Date().toISOString();

    // 1. Accept target request
    request.status = 'ACCEPTED';
    request.respondedAt = now;

    // 2. Auto-reject competing requests
    for (const otherReq of this.data.requests) {
      if (otherReq.donationId === donation.id && otherReq.id !== request.id && otherReq.status === 'PENDING') {
        otherReq.status = 'REJECTED';
        otherReq.respondedAt = now;
      }
    }

    // 3. Update donation status
    donation.status = 'CONFIRMED';
    donation.pendingRequestsCount = 0;

    // 4. Create confirmed booking
    const newBooking: Booking = {
      id: `book_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      donationId: donation.id,
      requestId: request.id,
      ngoId: request.ngoId,
      ngoName: request.ngoName,
      ngoPhone: ngoEntity?.phone || ngoUser?.phone || '+91 98111 88888',
      donorId: donation.donorId,
      donorName: donation.donorName,
      foodName: donation.foodName,
      mealCount: request.requestedMeals,
      foodSpecifications: donation.foodSpecifications,
      pickupLocation: donation.originAddress || donation.pickupLocation,
      pickupAddress: donation.originAddress || donation.pickupAddress || donation.pickupLocation,
      originAddress: donation.originAddress || donation.pickupAddress || donation.pickupLocation,
      originLatitude: donation.latitude,
      originLongitude: donation.longitude,
      destinationAddress: ngoEntity?.address || ngoUser?.location || 'Bandra East Community Center, Mumbai',
      destinationLatitude: ngoEntity?.latitude || ngoUser?.latitude || 19.062,
      destinationLongitude: ngoEntity?.longitude || ngoUser?.longitude || 72.854,
      donorLatitude: donation.latitude,
      donorLongitude: donation.longitude,
      ngoLatitude: ngoEntity?.latitude || ngoUser?.latitude || 19.062,
      ngoLongitude: ngoEntity?.longitude || ngoUser?.longitude || 72.854,
      status: 'CONFIRMED',
      routeDistanceKm: request.distanceKm,
      estimatedMinutes: Math.max(5, Math.round(request.distanceKm * 3.5)),
      trafficStatus: 'Unavailable',
      pickupTime: donation.pickupDeadline,
      liveTrackingEnabled: true,
      createdAt: now,
    };

    this.data.bookings.unshift(newBooking);
    this.save(this.data);
    return { success: true, request, booking: newBooking };
  }

  public rejectFoodRequest(
    requestId: string,
    donorId: string
  ): { success: boolean; request?: FoodRequest; error?: string } {
    const request = this.data.requests.find((r) => r.id === requestId);
    if (!request) return { success: false, error: 'Request not found.' };

    request.status = 'REJECTED';
    request.respondedAt = new Date().toISOString();

    const donation = this.data.donations.find((d) => d.id === request.donationId);
    if (donation) {
      const remaining = this.data.requests.filter((r) => r.donationId === donation.id && r.status === 'PENDING').length;
      donation.pendingRequestsCount = remaining;
      if (remaining === 0 && donation.status === 'PENDING_REQUEST') {
        donation.status = 'AVAILABLE';
      }
    }

    this.save(this.data);
    return { success: true, request };
  }

  public cancelFoodRequest(
    requestId: string,
    ngoId: string
  ): { success: boolean; error?: string } {
    const request = this.data.requests.find((r) => r.id === requestId);
    if (!request) return { success: false, error: 'Request not found.' };

    request.status = 'CANCELLED';
    request.respondedAt = new Date().toISOString();

    const donation = this.data.donations.find((d) => d.id === request.donationId);
    if (donation) {
      const remaining = this.data.requests.filter((r) => r.donationId === donation.id && r.status === 'PENDING').length;
      donation.pendingRequestsCount = remaining;
      if (remaining === 0 && donation.status === 'PENDING_REQUEST') {
        donation.status = 'AVAILABLE';
      }
    }

    this.save(this.data);
    return { success: true };
  }

  public updateBookingStatus(
    bookingId: string,
    status: BookingStatus
  ): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.data.bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    booking.status = status;
    const now = new Date().toISOString();

    if (status === 'COMPLETED') {
      booking.completedAt = now;
      const donation = this.data.donations.find((d) => d.id === booking.donationId);
      if (donation) donation.status = 'COMPLETED';

      // Release delivery person
      if (booking.deliveryPersonId) {
        const person = this.data.deliveryPersons.find((p) => p.id === booking.deliveryPersonId);
        if (person) {
          person.activeBookingId = undefined;
          person.availability = 'Available';
        }
      }
    }

    this.save(this.data);
    return { success: true, booking };
  }

  public updateDeliveryLocation(
    bookingId: string,
    deliveryPersonId: string,
    latitude: number,
    longitude: number
  ): { success: boolean; update?: DeliveryLocationUpdate; error?: string } {
    const booking = this.data.bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    booking.deliveryPersonLatitude = latitude;
    booking.deliveryPersonLongitude = longitude;

    const person = this.data.deliveryPersons.find((p) => p.id === deliveryPersonId);
    if (person) {
      person.currentLatitude = latitude;
      person.currentLongitude = longitude;
    }

    const update: DeliveryLocationUpdate = {
      id: `loc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      bookingId,
      deliveryPersonId,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    };

    this.data.locationUpdates.push(update);
    this.save(this.data);
    return { success: true, update };
  }

  public updateBookingLocation(
    bookingId: string,
    userId: string,
    role: string,
    latitude: number,
    longitude: number
  ): { success: boolean; update?: DeliveryLocationUpdate; error?: string } {
    return this.updateDeliveryLocation(bookingId, userId, latitude, longitude);
  }

  public completePickup(
    bookingId: string,
    userId: string
  ): { success: boolean; booking?: Booking; error?: string } {
    return this.updateBookingStatus(bookingId, 'COMPLETED');
  }

  public addDonation(
    donationData: Omit<FoodDonation, 'id' | 'createdAt' | 'status' | 'pendingRequestsCount'>
  ): FoodDonation {
    const newDonation: FoodDonation = {
      ...donationData,
      id: `don_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'AVAILABLE',
      pendingRequestsCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.data.donations.unshift(newDonation);
    this.save(this.data);
    return newDonation;
  }

  public addUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save(this.data);
    return newUser;
  }

  public addMessage(msg: Omit<Message, 'id' | 'createdAt'>): Message {
    const newMsg: Message = {
      ...msg,
      id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.messages.push(newMsg);
    this.save(this.data);
    return newMsg;
  }

  public updateUserPlan(userId: string, plan: 'free' | 'premium'): void {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) user.subscriptionPlan = plan;
    this.save(this.data);
  }

  public onboardNGO(
    userId: string,
    orgName: string,
    orgType: any,
    contactPerson: string,
    phone: string,
    address: string,
    latitude: number,
    longitude: number,
    capacity: number = 80
  ): { user: User; entity: NGOEntity } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    user.name = orgName;
    user.organizationType = orgType;
    user.phone = phone;
    user.location = address;
    user.latitude = latitude;
    user.longitude = longitude;
    user.onboarded = true;

    let ngoEntity = this.data.ngos.find((n) => n.userId === userId);
    if (ngoEntity) {
      ngoEntity.organizationName = orgName;
      ngoEntity.organizationType = orgType;
      ngoEntity.contactPerson = contactPerson;
      ngoEntity.phone = phone;
      ngoEntity.address = address;
      ngoEntity.latitude = latitude;
      ngoEntity.longitude = longitude;
    } else {
      ngoEntity = {
        id: `ngo_entity_${userId}`,
        userId,
        organizationName: orgName,
        organizationType: orgType,
        contactPerson,
        phone,
        email: user.email,
        address,
        latitude,
        longitude,
        locationSharingEnabled: true,
        capacity,
        createdAt: new Date().toISOString(),
      };
      this.data.ngos.push(ngoEntity);
    }

    this.save(this.data);
    return { user, entity: ngoEntity };
  }

  public onboardDonor(
    userId: string,
    donorType: any,
    orgName: string,
    contactPerson: string,
    phone: string,
    address: string,
    latitude: number,
    longitude: number,
    isHousehold: boolean = false
  ): { user: User; entity: DonorEntity } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    user.name = orgName;
    user.donorType = donorType;
    user.phone = phone;
    user.location = address;
    user.latitude = latitude;
    user.longitude = longitude;
    user.onboarded = true;

    let donorEntity = this.data.donors.find((d) => d.userId === userId);
    if (donorEntity) {
      donorEntity.organizationName = orgName;
      donorEntity.donorType = donorType;
      donorEntity.contactPerson = contactPerson;
      donorEntity.phone = phone;
      donorEntity.address = address;
      donorEntity.latitude = latitude;
      donorEntity.longitude = longitude;
      donorEntity.isHousehold = isHousehold;
    } else {
      donorEntity = {
        id: `donor_entity_${userId}`,
        userId,
        donorType,
        organizationName: orgName,
        contactPerson,
        phone,
        email: user.email,
        address,
        latitude,
        longitude,
        isHousehold,
        createdAt: new Date().toISOString(),
      };
      this.data.donors.push(donorEntity);
    }

    this.save(this.data);
    return { user, entity: donorEntity };
  }

  public resetSeed(): void {
    this.data = JSON.parse(JSON.stringify(initialSeedData));
    this.save(this.data);
  }
}

export const db = new Database();

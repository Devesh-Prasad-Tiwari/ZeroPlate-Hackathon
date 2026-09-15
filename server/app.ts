import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import donationRoutes from './routes/donations';
import requestRoutes from './routes/requests';
import ngoRoutes from './routes/ngos';
import bookingRoutes from './routes/bookings';
import deliveryRoutes from './routes/delivery';
import messageRoutes from './routes/messages';
import subscriptionRoutes from './routes/subscriptions';
import impactRoutes from './routes/impact';

const app = express();

app.use(cors());
app.use(express.json());

// API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/impact', impactRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default app;

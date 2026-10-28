import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import leaveRoutes from './routes/leaves.js';
import attendanceRoutes from './routes/attendance.js';
import timesheetRoutes from './routes/timesheets.js';
import announcementRoutes from './routes/announcements.js';
import trainingRoutes from './routes/training.js';
import dashboardRoutes from './routes/dashboard.js';
import { notFound, errorHandler } from './middleware/error.js';

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error('Missing JWT_SECRET or MONGO_URI. Copy server/.env.example to server/.env and fill it in.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
await mongoose.connect(process.env.MONGO_URI);
console.log('MongoDB connected');
app.listen(port, () => console.log(`StaffSync API running on http://localhost:${port}`));

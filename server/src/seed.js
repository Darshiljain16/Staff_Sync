import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Leave from './models/Leave.js';
import Attendance from './models/Attendance.js';
import Announcement from './models/Announcement.js';
import Training from './models/Training.js';
import { localDate } from './utils/helpers.js';

const PASSWORD = 'Password@123';
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const daysFromNow = (n) => daysAgo(-n);

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User, Leave, Attendance, Announcement, Training].map((m) => m.deleteMany({})));

const hr = await User.create({
  name: 'Neha Sharma', email: 'hr@staffsync.com', password: PASSWORD, role: 'hr',
  department: 'Human Resources', designation: 'HR Manager', phone: '9800000001',
});
const manager = await User.create({
  name: 'Priya Mehta', email: 'manager@staffsync.com', password: PASSWORD, role: 'manager',
  department: 'Engineering', designation: 'Engineering Manager', phone: '9800000002',
});
const [rahul, anita, vikram] = await User.create(
  [
    { name: 'Rahul Verma', email: 'rahul@staffsync.com', designation: 'Frontend Developer', phone: '9800000003' },
    { name: 'Anita Desai', email: 'anita@staffsync.com', designation: 'Backend Developer', phone: '9800000004' },
    { name: 'Vikram Singh', email: 'vikram@staffsync.com', designation: 'QA Engineer', phone: '9800000005' },
  ].map((u) => ({ ...u, password: PASSWORD, role: 'employee', department: 'Engineering', manager: manager._id }))
);

await Leave.create([
  { employee: rahul._id, type: 'casual', startDate: daysFromNow(3), endDate: daysFromNow(4), reason: 'Family function' },
  { employee: anita._id, type: 'sick', startDate: daysAgo(6), endDate: daysAgo(5), reason: 'Fever', status: 'approved', reviewedBy: manager._id },
  { employee: vikram._id, type: 'annual', startDate: daysFromNow(10), endDate: daysFromNow(14), reason: 'Vacation' },
  { employee: manager._id, type: 'annual', startDate: daysFromNow(20), endDate: daysFromNow(22), reason: 'Personal trip' },
]);

const at = (d, h, m) => {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
};
const attendance = [];
for (const user of [rahul, anita, vikram]) {
  for (let i = 1; i <= 4; i++) {
    const d = daysAgo(i);
    if ([0, 6].includes(d.getDay())) continue;
    const late = (i + String(user._id).length) % 3 === 0;
    const checkIn = at(d, 9, late ? 45 : 5);
    const checkOut = at(d, 18, 10);
    attendance.push({
      employee: user._id, date: localDate(d), checkIn, checkOut,
      hours: Math.round(((checkOut - checkIn) / 36e5) * 100) / 100,
      status: late ? 'late' : 'present',
    });
  }
}
await Attendance.create(attendance);

await Announcement.create([
  { title: 'Welcome to StaffSync', body: 'Apply for leave, mark attendance and join trainings all from one place.', author: hr._id },
  { title: 'Annual day planning', body: 'Annual day is next month. Departments should share their participation by Friday.', author: hr._id },
]);

await Training.create([
  {
    title: 'React Advanced Patterns', description: 'Hooks, performance and component design.', trainer: 'Priya Mehta',
    startDate: daysFromNow(2), endDate: daysFromNow(9), createdBy: manager._id,
    participants: [{ user: rahul._id, status: 'in-progress' }, { user: anita._id }],
  },
  {
    title: 'Workplace Safety Basics', description: 'Mandatory safety induction for all staff.', trainer: 'Neha Sharma',
    startDate: daysAgo(10), endDate: daysAgo(8), createdBy: hr._id,
    participants: [{ user: vikram._id, status: 'completed', completedAt: daysAgo(8) }],
  },
]);

console.log(`Seeded. Login with any of these (password ${PASSWORD}):`);
console.log('  hr@staffsync.com | manager@staffsync.com | rahul@staffsync.com | anita@staffsync.com | vikram@staffsync.com');
await mongoose.disconnect();

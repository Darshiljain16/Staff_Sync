import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Leave from './models/Leave.js';
import Attendance from './models/Attendance.js';
import Announcement from './models/Announcement.js';
import Training from './models/Training.js';
import Timesheet from './models/Timesheet.js';
import { addDays, localDate, mondayOf } from './utils/helpers.js';

const PASSWORD = 'Password@123';
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const daysFromNow = (n) => daysAgo(-n);

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User, Leave, Attendance, Announcement, Training, Timesheet].map((m) => m.deleteMany({})));

// Org chart: admin (no manager) | CEO (no manager) -> HR, managers -> employees
const admin = await User.create({
  name: 'Aarav Admin', email: 'admin@staffsync.com', password: PASSWORD, role: 'admin',
  department: 'IT', designation: 'System Administrator', phone: '9800000000',
});
const ceo = await User.create({
  name: 'Arjun Kapoor', email: 'ceo@staffsync.com', password: PASSWORD, role: 'ceo',
  department: 'Management', designation: 'Chief Executive Officer', phone: '9800000001',
});
const hr = await User.create({
  name: 'Neha Sharma', email: 'hr@staffsync.com', password: PASSWORD, role: 'hr', manager: ceo._id,
  department: 'Human Resources', designation: 'HR Manager', phone: '9800000002',
});
const [priya, sanjay] = await User.create([
  { name: 'Priya Mehta', email: 'manager@staffsync.com', department: 'Engineering', designation: 'Engineering Manager', phone: '9800000003' },
  { name: 'Sanjay Rao', email: 'sanjay@staffsync.com', department: 'Sales', designation: 'Sales Manager', phone: '9800000004' },
].map((u) => ({ ...u, password: PASSWORD, role: 'manager', manager: ceo._id })));
const [rahul, anita, vikram, meera] = await User.create([
  { name: 'Rahul Verma', email: 'rahul@staffsync.com', department: 'Engineering', designation: 'Frontend Developer', manager: priya._id },
  { name: 'Anita Desai', email: 'anita@staffsync.com', department: 'Engineering', designation: 'Backend Developer', manager: priya._id },
  { name: 'Vikram Singh', email: 'vikram@staffsync.com', department: 'Engineering', designation: 'QA Engineer', manager: priya._id },
  { name: 'Meera Nair', email: 'meera@staffsync.com', department: 'Sales', designation: 'Sales Executive', manager: sanjay._id },
].map((u) => ({ ...u, password: PASSWORD, role: 'employee' })));

await Leave.create([
  { employee: rahul._id, type: 'casual', startDate: daysFromNow(3), endDate: daysFromNow(4), reason: 'Family function' },
  { employee: anita._id, type: 'sick', startDate: daysAgo(6), endDate: daysAgo(5), reason: 'Fever', status: 'approved', reviewedBy: priya._id },
  { employee: vikram._id, type: 'annual', startDate: daysFromNow(10), endDate: daysFromNow(14), reason: 'Vacation' },
  { employee: meera._id, type: 'casual', startDate: daysFromNow(6), endDate: daysFromNow(6), reason: 'Bank work' },
  { employee: priya._id, type: 'annual', startDate: daysFromNow(20), endDate: daysFromNow(22), reason: 'Personal trip' },
  { employee: hr._id, type: 'casual', startDate: daysFromNow(8), endDate: daysFromNow(8), reason: 'Personal work' },
]);

const at = (d, h, m) => {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
};
const attendance = [];
[rahul, anita, vikram, meera, priya, sanjay, hr].forEach((user, u) => {
  for (let i = 1; i <= 5; i++) {
    const d = daysAgo(i);
    if ([0, 6].includes(d.getDay())) continue;
    const late = (i + u) % 4 === 0;
    const checkIn = at(d, 9, late ? 45 : 5);
    const checkOut = at(d, 18, 10);
    attendance.push({
      employee: user._id, date: localDate(d), checkIn, checkOut,
      hours: Math.round(((checkOut - checkIn) / 36e5) * 100) / 100,
      status: late ? 'late' : 'present',
    });
  }
});
await Attendance.create(attendance);

// Last week's timesheets: Rahul approved, Anita and Vikram waiting for Priya
const lastWeek = mondayOf(localDate(daysAgo(7)));
const week = (project) =>
  [0, 1, 2, 3, 4].map((i) => ({ date: addDays(lastWeek, i), project, description: 'Development and reviews', hours: 8 }));
await Timesheet.create([
  { employee: rahul._id, weekStart: lastWeek, entries: week('StaffSync Portal'), status: 'approved', submittedAt: daysAgo(3), reviewedBy: priya._id },
  { employee: anita._id, weekStart: lastWeek, entries: week('StaffSync API'), status: 'submitted', submittedAt: daysAgo(2) },
  { employee: vikram._id, weekStart: lastWeek, entries: week('QA Automation'), status: 'submitted', submittedAt: daysAgo(2) },
]);

await Announcement.create([
  { title: 'Welcome to StaffSync', body: 'Apply for leave, mark attendance, fill timesheets and join trainings from one place.', author: hr._id },
  { title: 'Annual day planning', body: 'Annual day is next month. Departments should share their participation by Friday.', author: ceo._id },
]);

await Training.create([
  {
    title: 'React Advanced Patterns', description: 'Hooks, performance and component design.', trainer: 'Priya Mehta',
    startDate: daysFromNow(2), endDate: daysFromNow(9), createdBy: priya._id,
    participants: [{ user: rahul._id, status: 'in-progress' }, { user: anita._id }],
  },
  {
    title: 'Workplace Safety Basics', description: 'Mandatory safety induction for all staff.', trainer: 'Neha Sharma',
    startDate: daysAgo(10), endDate: daysAgo(8), createdBy: hr._id,
    participants: [{ user: vikram._id, status: 'completed', completedAt: daysAgo(8) }],
  },
]);

console.log(`Seeded. Password for every account: ${PASSWORD}`);
console.log('  admin@ | ceo@ | hr@ | manager@ (Priya) | sanjay@ | rahul@ | anita@ | vikram@ | meera@  (all @staffsync.com)');
await mongoose.disconnect();

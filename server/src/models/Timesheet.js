import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD, must fall inside the week
    project: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    hours: { type: Number, required: true, min: 0.25, max: 24 },
  },
  { _id: false }
);

// One timesheet per employee per week (weekStart is the Monday)
const timesheetSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: String, required: true },
    entries: [entrySchema],
    totalHours: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' },
    submittedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

timesheetSchema.index({ employee: 1, weekStart: 1 }, { unique: true });

timesheetSchema.pre('validate', function () {
  this.totalHours = this.entries.reduce((sum, e) => sum + e.hours, 0);
});

export default mongoose.model('Timesheet', timesheetSchema);

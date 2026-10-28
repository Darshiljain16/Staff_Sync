import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['enrolled', 'in-progress', 'completed'], default: 'enrolled' },
    completedAt: Date,
  },
  { _id: false }
);

const trainingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    trainer: { type: String, trim: true },
    startDate: Date,
    endDate: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [participantSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Training', trainingSchema);

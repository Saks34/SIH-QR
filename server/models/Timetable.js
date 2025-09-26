const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Time must be in HH:MM-HH:MM format']
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  room: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: String,
    default: 'TBA'
  },
  type: {
    type: String,
    enum: ['lecture', 'lab', 'tutorial', 'seminar'],
    default: 'lecture'
  }
});

const timetableSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    ref: 'Student'
  },
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  slots: [slotSchema],
  semester: {
    type: String,
    default: 'Current'
  },
  academicYear: {
    type: String,
    default: '2023-24'
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
timetableSchema.index({ studentId: 1, day: 1 });
timetableSchema.index({ studentId: 1, semester: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);

const mongoose = require('mongoose');

const qrTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: String,
    default: null,
    ref: 'Student'
  },
  usedAt: {
    type: Date,
    default: null
  },
  sessionInfo: {
    subject: String,
    room: String,
    instructor: String
  }
}, {
  timestamps: true
});

// Indexes
qrTokenSchema.index({ token: 1 }, { unique: true });
qrTokenSchema.index({ expiresAt: 1 });
qrTokenSchema.index({ isUsed: 1 });

module.exports = mongoose.model('QRToken', qrTokenSchema);

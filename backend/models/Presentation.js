const mongoose = require('mongoose');

const PresentationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    default: ''
  },
  style: {
    type: String,
    default: 'Professional'
  },
  audience: {
    type: String,
    default: 'General'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING_PAYMENT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
    default: 'PENDING_PAYMENT'
  },
  paymentReceipt: {
    type: String,
    default: null
  },
  theme: {
    name: { type: String, default: 'default' },
    bg: { type: String, default: 'FFFFFF' },
    text: { type: String, default: '333333' },
    accent: { type: String, default: '0066CC' },
    fontTitle: { type: String, default: 'Arial' },
    fontBody: { type: String, default: 'Arial' }
  },
  slideCount: {
    type: Number,
    default: 5
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Presentation', PresentationSchema);

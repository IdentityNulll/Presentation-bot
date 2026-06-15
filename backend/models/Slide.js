const mongoose = require('mongoose');

const SlideSchema = new mongoose.Schema({
  presentationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Presentation',
    required: true,
    index: true
  },
  order: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: [
      'Cover',
      'TwoColumn',
      'ImageLeft',
      'ImageRight',
      'FullImage',
      'Quote',
      'Statistics',
      'Timeline',
      'Comparison',
      'Team',
      'Conclusion'
    ],
    default: 'Cover'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  content: {
    type: String, // Bullet points separated by \n
    default: ''
  },
  speakerNotes: {
    type: String,
    default: ''
  },
  imagePrompt: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: null
  },
  suggestedVisuals: {
    type: String,
    default: ''
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

module.exports = mongoose.model('Slide', SlideSchema);

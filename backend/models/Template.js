const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  style: {
    type: String,
    enum: ['Modern', 'Professional', 'Academic', 'Startup Pitch', 'Minimalist', 'Dark Theme', 'Creative', 'Corporate'],
    required: true
  },
  theme: {
    bg: { type: String, required: true },
    text: { type: String, required: true },
    accent: { type: String, required: true },
    fontTitle: { type: String, required: true },
    fontBody: { type: String, required: true }
  },
  previewUrl: {
    type: String,
    default: null
  },
  isPreset: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Template', TemplateSchema);

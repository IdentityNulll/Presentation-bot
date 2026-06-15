const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Import models
const User = require('../models/User');
const Presentation = require('../models/Presentation');
const Slide = require('../models/Slide');
const Template = require('../models/Template');
const Export = require('../models/Export');
const Analytics = require('../models/Analytics');
const Setting = require('../models/Setting');

// Initialize connection
const connectDB = async () => {
  const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/presentation-bot';
  try {
    await mongoose.connect(dbUrl);
    logger.info('MongoDB connected successfully via Mongoose!');
  } catch (error) {
    logger.error('Failed to connect to MongoDB: %O', error);
    process.exit(1);
  }
};

// System logging helper using Analytics model
async function logSystemEvent(type, details = {}, userId = null) {
  try {
    await Analytics.create({
      type,
      userId,
      details: typeof details === 'string' ? { message: details } : details,
      createdAt: new Date()
    });
  } catch (error) {
    logger.error('Failed to log system event to Analytics collection: %O', error);
  }
}

module.exports = {
  connectDB,
  mongoose,
  User,
  Presentation,
  Slide,
  Template,
  Export,
  Analytics,
  Setting,
  logSystemEvent
};

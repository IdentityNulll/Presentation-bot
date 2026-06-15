const { User, Presentation, Export, Analytics, Setting, logSystemEvent } = require('../services/dbService');
const logger = require('../utils/logger');

/**
 * Get overall dashboard overview statistics
 */
async function getStats(req, res, next) {
  try {
    const totalUsers = await User.countDocuments();
    const totalPresentations = await Presentation.countDocuments();
    const totalExports = await Export.countDocuments();

    // Active users in the last 30 days (made a presentation or export)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activePresUsers = await Presentation.distinct('userId', { createdAt: { $gte: thirtyDaysAgo } });
    const activeExportUsers = await Export.distinct('userId', { createdAt: { $gte: thirtyDaysAgo } });
    const allActiveUserIds = new Set([
      ...activePresUsers.map(id => id.toString()),
      ...activeExportUsers.map(id => id.toString())
    ]);
    const activeUsersCount = allActiveUserIds.size;

    // AI Provider usage statistics from Analytics
    const successCount = await Analytics.countDocuments({ 
      type: 'ai_generation', 
      createdAt: { $gte: thirtyDaysAgo },
      'details.message': { $not: /local/i }
    });
    
    const localCount = await Analytics.countDocuments({ 
      type: 'ai_generation', 
      createdAt: { $gte: thirtyDaysAgo },
      'details.message': /local/i
    });

    const failureCount = await Analytics.countDocuments({ 
      type: 'error', 
      createdAt: { $gte: thirtyDaysAgo }
    });

    const aiStats = {
      local: localCount,
      success: successCount,
      failure: failureCount
    };

    // Exports count by format
    const pptxCount = await Export.countDocuments({ format: 'PPTX' });
    const pdfCount = await Export.countDocuments({ format: 'PDF' });

    const exportStats = {
      pptx: pptxCount,
      pdf: pdfCount,
      markdown: 0 // Markdown was removed or combined, but we return 0 for compatibility
    };

    // Revenue statistics based on subscription tiers
    const premiumUsers = await User.countDocuments({ subscription: 'PREMIUM' });
    const simulatedRevenue = premiumUsers * 9.99;

    return res.json({
      totalUsers,
      activeUsers: activeUsersCount,
      totalPresentations,
      totalExports,
      revenue: parseFloat(simulatedRevenue.toFixed(2)),
      aiUsage: aiStats,
      exportsByFormat: exportStats
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get system settings
 */
async function getSettings(req, res, next) {
  try {
    const settings = await Setting.find();
    const settingsObj = {};
    settings.forEach(s => {
      // Don't leak full API keys to the frontend dashboard, mask them
      if (s.key.endsWith('_KEY') && s.value) {
        settingsObj[s.key] = s.value.length > 8 
          ? s.value.substring(0, 4) + '...' + s.value.substring(s.value.length - 4) 
          : '••••••••';
      } else {
        settingsObj[s.key] = s.value;
      }
    });
    return res.json(settingsObj);
  } catch (error) {
    next(error);
  }
}

/**
 * Update system settings
 */
async function updateSettings(req, res, next) {
  const updates = req.body; // Key-value object of updates

  try {
    for (const key in updates) {
      let val = updates[key];
      
      // If key is masked and did not change, skip updating it
      if (key.endsWith('_KEY') && val.includes('...')) {
        continue;
      }

      await Setting.findOneAndUpdate(
        { key },
        { value: String(val) },
        { upsert: true, new: true }
      );
    }

    logger.info('System settings updated by admin.');
    return res.json({ message: 'Settings updated successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve system logs from DB
 */
async function getLogs(req, res, next) {
  const limit = parseInt(req.query.limit, 10) || 50;
  try {
    const logs = await Analytics.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'username telegramId');

    const formattedLogs = logs.map(l => ({
      id: l._id,
      action: l.type.toUpperCase(),
      details: l.details ? JSON.stringify(l.details) : '',
      createdAt: l.createdAt,
      userId: l.userId ? l.userId._id : null,
      user: l.userId ? {
        id: l.userId._id,
        username: l.userId.username,
        telegramId: l.userId.telegramId
      } : null
    }));

    return res.json(formattedLogs);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStats,
  getSettings,
  updateSettings,
  getLogs
};

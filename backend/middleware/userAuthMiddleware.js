const { User } = require('../services/dbService');
const logger = require('../utils/logger');

async function userAuthMiddleware(req, res, next) {
  const telegramId = req.headers['x-telegram-id'];
  if (!telegramId) {
    return res.status(401).json({ error: 'Access denied. No Telegram ID provided.' });
  }

  try {
    let user = await User.findOne({ telegramId: String(telegramId) });
    if (!user) {
      // Auto-register user if they open the Mini App (e.g. from direct URL or sharing)
      user = await User.create({
        telegramId: String(telegramId),
        subscription: 'FREE'
      });
      logger.info(`Auto-registered user ${telegramId} from Mini App`);
    }

    if (user.isBanned) {
      return res.status(403).json({ error: '⚠️ You have been banned by the administrator.' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Error in user auth middleware: %O', error);
    return res.status(500).json({ error: 'Internal server authentication error.' });
  }
}

module.exports = userAuthMiddleware;

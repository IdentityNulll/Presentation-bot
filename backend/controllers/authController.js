const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../services/dbService');
const logger = require('../utils/logger');

async function login(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    // Look up administrative user in Users collection
    const admin = await User.findOne({ username, role: 'ADMIN' });

    if (!admin) {
      logger.warn(`Auth failed: Admin user '${username}' not found.`);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      logger.warn(`Auth failed: Incorrect password for admin '${username}'.`);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const secret = process.env.JWT_SECRET || 'slidepaw-secret-jwt-key';
    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      secret,
      { expiresIn: '24h' }
    );

    logger.info(`Admin logged in successfully: ${username}`);
    return res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login
};

const { User, Presentation, Export } = require('../services/dbService');
const logger = require('../utils/logger');

/**
 * Get paginated list of users with search and filter support.
 */
async function getUsers(req, res, next) {
  const search = req.query.search || '';
  const filter = req.query.filter || 'all'; // 'all', 'banned', 'premium'
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { telegramId: { $regex: search, $options: 'i' } }
      ];
    }

    if (filter === 'banned') {
      query.isBanned = true;
    } else if (filter === 'premium') {
      query.subscription = { $in: ['PREMIUM', 'LIFETIME'] };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const usersWithCounts = await Promise.all(users.map(async (u) => {
      const presentationsCount = await Presentation.countDocuments({ userId: u._id });
      const exportsCount = await Export.countDocuments({ userId: u._id });
      return {
        ...u,
        id: u._id,
        _count: {
          presentations: presentationsCount,
          exports: exportsCount
        }
      };
    }));

    return res.json({
      users: usersWithCounts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Ban or unban a user.
 */
async function banUser(req, res, next) {
  const { id } = req.params;
  const { ban } = req.body; // boolean

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { isBanned: !!ban },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    logger.info(`User ${user.telegramId} ban status updated to: ${!!ban}`);
    return res.json({ message: `User ban status updated to ${!!ban}`, user });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a user and cascade all their presentations, exports, and slides.
 */
async function deleteUser(req, res, next) {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Cascade delete presentations and exports
    const presentations = await Presentation.find({ userId: id });
    const presentationIds = presentations.map(p => p._id);
    
    // Delete slides for all of this user's presentations
    const { Slide } = require('../services/dbService');
    await Slide.deleteMany({ presentationId: { $in: presentationIds } });
    await Presentation.deleteMany({ userId: id });
    await Export.deleteMany({ userId: id });

    logger.info(`User ${user.telegramId} deleted from database.`);
    return res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get activity history (presentations and exports) for a specific user.
 */
async function getUserActivity(req, res, next) {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const presentations = await Presentation.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(5);

    const exports = await Export.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('presentationId', 'title');

    const formattedExports = exports.map(e => ({
      id: e._id,
      format: e.format,
      createdAt: e.createdAt,
      presentation: e.presentationId ? { title: e.presentationId.title } : { title: 'Deleted Presentation' }
    }));

    return res.json({
      presentations,
      exports: formattedExports
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
  banUser,
  deleteUser,
  getUserActivity
};

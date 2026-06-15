const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', userController.getUsers);
router.post('/:id/ban', userController.banUser);
router.delete('/:id', userController.deleteUser);
router.get('/:id/activity', userController.getUserActivity);

module.exports = router;

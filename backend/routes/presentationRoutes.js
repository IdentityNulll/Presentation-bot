const express = require('express');
const router = express.Router();
const presentationController = require('../controllers/presentationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', presentationController.getPresentations);
router.get('/:id', presentationController.getPresentationDetails);
router.delete('/:id', presentationController.deletePresentation);

module.exports = router;

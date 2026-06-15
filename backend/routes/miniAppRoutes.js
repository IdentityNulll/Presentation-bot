const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const miniAppController = require('../controllers/miniAppController');
const userAuthMiddleware = require('../middleware/userAuthMiddleware');

// Mount authentication middleware for all Mini App routes
router.use(userAuthMiddleware);

// Core endpoints
router.get('/templates', miniAppController.getTemplates);
router.post('/presentations/generate', miniAppController.generatePresentation);
router.get('/presentations', miniAppController.getPresentations);
router.get('/presentations/:id', miniAppController.getPresentationDetails);
router.put('/presentations/:id', miniAppController.updatePresentation);

// Slide management endpoints
router.post('/presentations/:id/slides', miniAppController.addSlide);
router.put('/presentations/:id/slides/:slideId', miniAppController.updateSlide);
router.delete('/presentations/:id/slides/:slideId', miniAppController.deleteSlide);
router.post('/presentations/:id/slides/:slideId/duplicate', miniAppController.duplicateSlide);
router.post('/presentations/:id/slides/reorder', miniAppController.reorderSlides);
router.post('/presentations/:id/slides/:slideId/regenerate', miniAppController.regenerateSlide);

// Visual assets endpoints
router.get('/images/suggest', miniAppController.suggestImages);
router.post('/presentations/:id/upload', upload.single('image'), miniAppController.uploadImage);

// Export download endpoints
router.get('/presentations/:id/export/:format', miniAppController.exportPresentation);

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/search', verifyToken, userController.searchUsers);
router.get('/profile/:id', verifyToken, userController.getUserProfile);
router.put('/edit', verifyToken, userController.editProfile);

module.exports = router;

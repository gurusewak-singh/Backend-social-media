const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/friend-request/:id', verifyToken, friendController.sendFriendRequest)

router.post('/friend-request/:id/accept', verifyToken, friendController.acceptFriendRequest)

router.post('/friend-request/:id/reject', verifyToken, friendController.rejectFriendRequest)

router.get('/friend-requests', verifyToken, friendController.getFriendRequests)

router.get('/friends', verifyToken, friendController.getFriendList)

module.exports = router;
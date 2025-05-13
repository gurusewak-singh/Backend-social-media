const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  type: { type: String, enum: ['like', 'comment', 'friend_request'], required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  message: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);

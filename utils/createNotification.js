// utils/createNotification.js
const Notification = require('../models/notification');
const User = require('../models/user'); // To fetch sender's username

const createNotification = async ({ recipient, sender, type, post, message: customMessage }) => {
  if (recipient.toString() === sender.toString()) return; // Don't notify self

  let message = customMessage;
  if (!message) {
    const senderUser = await User.findById(sender).select('username');
    const senderName = senderUser ? senderUser.username : 'Someone';
    switch (type) {
      case 'like':
        message = `${senderName} liked your post.`;
        break;
      case 'comment':
        message = `${senderName} commented on your post.`;
        break;
      case 'friend_request':
        message = `${senderName} sent you a friend request.`;
        break;
      default:
        message = 'You have a new notification.';
    }
  }

  const newNotification = new Notification({
    recipient,
    sender,
    type,
    post, // Will be undefined for friend_request, which is fine
    message,
  });

  await newNotification.save();
  // TODO: Emit a socket event to the recipient for real-time notification update
  // This part is tricky as createNotification doesn't have access to 'io' or 'getSocketId' easily
  // One solution is to have the controllers emit the generic 'new-notification' event
  // after calling createNotification.
};

module.exports = createNotification;
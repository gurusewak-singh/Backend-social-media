// C:\Users\LOQ\OneDrive\Desktop\DEV\Social Media\backend\controllers\friendController.js

const User = require('../models/user'); // Adjust path if necessary
const { getSocketId } = require('../socketManager'); // Adjust path if necessary

exports.sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.id;
    const io = req.app.get('socketio');

    if (senderId === receiverId) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself" });
    }
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }
    if (sender.friends.some(friendId => friendId.toString() === receiverId)) {
      return res.status(400).json({ message: "You are already friends." });
    }
    if (receiver.friendRequests.some(reqId => reqId.toString() === senderId)) {
      return res.status(400).json({ message: "Friend request already sent." });
    }
    if (sender.friendRequests.some(reqId => reqId.toString() === receiverId)) {
        return res.status(400).json({ message: "This user has already sent you a friend request. Please check your requests." });
    }
    receiver.friendRequests.push(senderId);
    await receiver.save();
    res.status(200).json({ message: "Friend request sent successfully" });
    const receiverSocket = getSocketId(receiverId);
    if (receiverSocket && io) {
      io.to(receiverSocket).emit("friend-request-received", {
        from: { _id: sender._id, username: sender.username },
        message: `${sender.username} sent you a friend request.`
      });
    }
  } catch (err) {
    console.error("Error in sendFriendRequest:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const receiverId = req.user.id;
    const senderId = req.params.id;
    const io = req.app.get('socketio');
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);
    if (!sender) {
        return res.status(404).json({ message: "Sender not found." });
    }
    if (!receiver.friendRequests.some(id => id.toString() === senderId)) {
      return res.status(400).json({ message: "No friend request from this user" });
    }
    receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== senderId);
    receiver.friends.push(senderId);
    sender.friends.push(receiverId);
    await receiver.save();
    await sender.save();
    res.status(200).json({ message: "Friend request accepted successfully" });
    const senderSocket = getSocketId(senderId);
    if (senderSocket && io) {
        io.to(senderSocket).emit("friend-request-accepted", {
            by: { _id: receiver._id, username: receiver.username },
            message: `${receiver.username} accepted your friend request.`
        });
    }
  } catch (err) {
    console.error("Error in acceptFriendRequest:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.rejectFriendRequest = async (req, res) => {
  try {
    const receiverId = req.user.id;
    const senderId = req.params.id;
    const receiver = await User.findById(receiverId);
    if (!receiver.friendRequests.some(id => id.toString() === senderId)) {
      return res.status(400).json({ message: "No friend request from this user" });
    }
    receiver.friendRequests = receiver.friendRequests.filter(idObj => idObj.toString() !== senderId);
    await receiver.save();
    res.status(200).json({ message: "Friend request rejected successfully" });
  } catch (err) {
    console.error("Error in rejectFriendRequest:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const userWithRequests = await User.findById(userId)
                                     .populate('friendRequests', 'username email profilePic');
    if (!userWithRequests) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(userWithRequests.friendRequests);
  } catch (err) {
    console.error("Error in getFriendRequests:", err);
    res.status(500).json({ message: "Failed to retrieve friend requests: " + err.message });
  }
};

exports.getFriendList = async (req, res) => {
  try {
    const userId = req.user.id;
    const userWithFriends = await User.findById(userId)
                                    .populate('friends', 'username email profilePic');
    if (!userWithFriends) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(userWithFriends.friends);
  } catch (err) {
    console.error("Error in getFriendList:", err);
    res.status(500).json({ message: "Failed to retrieve friend list: " + err.message });
  }
};
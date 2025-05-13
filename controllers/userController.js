const User = require('../models/user');

// Search users by username or email
exports.searchUsers = async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    }).select("username email");

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a specific user's public profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// backend/controllers/userController.js
exports.editProfile = async (req, res) => {
  try {
    const { username, email, bio, profilePic } = req.body;
    const updateFields = {};

    // Only add fields to updateFields if they are provided in the request
    if (username !== undefined) updateFields.username = username;
    if (email !== undefined) updateFields.email = email;
    if (bio !== undefined) updateFields.bio = bio; // Allows setting bio to "" (empty string)
    if (profilePic !== undefined) updateFields.profilePic = profilePic; // Allows setting profilePic to ""

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ message: "No fields to update provided." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true } // runValidators is good for schema validation
    ).select("-password");

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found during update." });
    }

    // IMPORTANT: If you store the user object in the JWT token or localStorage on the frontend,
    // that stored object is now stale. The frontend will need to update its stored user.
    // The response here sends the updatedUser, which the frontend should use.

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Error in editProfile:", err);
    // Handle specific validation errors if needed
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to update profile: " + err.message });
  }
};
// C:\Users\LOQ\OneDrive\Desktop\DEV\Social Media\backend\controllers\postController.js

const Post = require('../models/post'); // Adjust path as necessary
const User = require('../models/user'); // Adjust path as necessary, needed for populating and socket logic
const createNotification = require('../utils/createNotification'); // Adjust path as necessary
const { getSocketId } = require('../socketManager'); // Adjust path as necessary


exports.createPost = async (req, res) => {
  try {
    const { textContent, image } = req.body;
    if (!textContent && !image) {
        return res.status(400).json({ message: "Post must have either text content or an image." });
    }
    const newPost = new Post({
      userId: req.user.id,
      textContent,
      image,
    });
    await newPost.save();
    const populatedPost = await Post.findById(newPost._id).populate('userId', 'username profilePic');
    res.status(201).json({ message: "Post created successfully", post: populatedPost });
  } catch (err) {
    console.error("Error in createPost:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
                          .populate('userId', 'username profilePic')
                          .populate('comments.userId', 'username profilePic')
                          .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    console.error("Error in getAllPosts:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid post ID format" });
        }
        const post = await Post.findById(id)
                               .populate("userId", "username profilePic")
                               .populate("comments.userId", "username profilePic");
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json(post);
    } catch (err) {
        console.error("Error in getPostById:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.getPostsByUserId = async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId })
                          .populate('userId', 'username profilePic')
                          .populate('comments.userId', 'username profilePic')
                          .sort({ createdAt: -1 });
    if (!posts) {
      return res.status(404).json({ message: "No posts found for this user or user does not exist." });
    }
    res.status(200).json(posts);
  } catch (err) {
    console.error("Error in getPostsByUserId:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    if (!postId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid post ID format" });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error in deletePost:", err);
    res.status(500).json({ message: "Failed to delete post: " + err.message });
  }
};

exports.toggleLikePost = async (req, res) => {
  const io = req.app.get('socketio');
  try {
    let postToUpdate = await Post.findById(req.params.id); // Changed 'post' to 'postToUpdate' for clarity

    if (!postToUpdate) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userIdString = req.user.id.toString();
    const postOwnerIdString = postToUpdate.userId.toString(); // postToUpdate.userId is an ObjectId here

    const likeIndex = postToUpdate.likes.findIndex(id => id.toString() === userIdString);
    let responseMessage = "";

    if (likeIndex > -1) {
      postToUpdate.likes.splice(likeIndex, 1);
      responseMessage = "Post unliked";
    } else {
      postToUpdate.likes.push(req.user.id); // Push the ObjectId
      responseMessage = "Post liked";

      // Notification logic only when liking
      if (userIdString !== postOwnerIdString) {
        await createNotification({
          recipient: postToUpdate.userId, // This should be the ObjectId
          sender: req.user.id,    // This is an ObjectId from the token
          type: 'like',
          post: postToUpdate._id,
        });
        const postOwnerSocket = getSocketId(postOwnerIdString); // Use the string ID
        if (postOwnerSocket && io) {
          const senderUser = await User.findById(req.user.id).select('username');
          io.to(postOwnerSocket).emit("post-notification", {
            type: 'like',
            from: senderUser ? senderUser.username : 'Someone',
            postId: postToUpdate._id,
            message: `${senderUser ? senderUser.username : 'Someone'} liked your post.`
          });
        }
      }
    }

    await postToUpdate.save();

    // *** IMPORTANT: Re-populate the post before sending it back ***
    const populatedPost = await Post.findById(postToUpdate._id)
                                    .populate('userId', 'username profilePic')
                                    .populate('comments.userId', 'username profilePic');

    return res.status(200).json({ message: responseMessage, post: populatedPost });

  } catch (err) {
    console.error("Error in toggleLikePost:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  const io = req.app.get('socketio');
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const newComment = {
      userId: req.user.id,
      text: req.body.text,
    };
    post.comments.push(newComment);
    await post.save();
    const populatedPost = await Post.findById(post._id)
                                   .populate('userId', 'username profilePic')
                                   .populate('comments.userId', 'username profilePic');
    if (req.user.id.toString() !== post.userId.toString()) {
      await createNotification({
        recipient: post.userId,
        sender: req.user.id,
        type: 'comment',
        post: post._id,
      });
      const postOwnerSocket = getSocketId(post.userId.toString());
      if (postOwnerSocket && io) {
        const commenter = await User.findById(req.user.id).select('username');
        io.to(postOwnerSocket).emit("post-notification", {
            type: 'comment',
            from: commenter ? commenter.username : 'Someone',
            postId: post._id,
            commentText: req.body.text,
            message: `${commenter ? commenter.username : 'Someone'} commented on your post.`
        });
      }
    }
    res.status(200).json({ message: "Comment added", post: populatedPost });
  } catch (err) {
    console.error("Error in addComment:", err);
    res.status(500).json({ message: err.message });
  }
};
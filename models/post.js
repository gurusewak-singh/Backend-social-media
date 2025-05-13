// models/post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // <--- CHANGE HERE
    required: true
  },
  textContent: {
    type: String,
    maxlength: 1000,
  },
  image: {
    type: String,
    default: "",
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user' // <--- CHANGE HERE
  }],
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }, // <--- CHANGE HERE
      text: { type: String, required: true, maxlength: 500 },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

// Validator...
postSchema.pre('validate', function(next) {
  if (!this.textContent && !this.image) {
    next(new Error('Post must have either text content or an image.'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Post', postSchema);
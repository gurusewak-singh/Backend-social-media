const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username:{
    type: String,
    required: true,
    unique: true,
    maxlength:15,
    minlength: 5
  },
  email:{
    type: String,
    required: true,
    unique: true
  },
  password:{
    type: String,
    required: true,
    minlength: 8
  },
  profilePic:{
    type: String,
    default: ""
  },
  bio:{
    type: String,
    default: "",
    maxlength: 100
  },
  friends: [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}],
  friendRequests: [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}],
},
{timestamps: true})

module.exports = mongoose.model('user', userSchema);
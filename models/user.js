const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  subscription: {
    type: String,
    enum: ['starter', 'pro', 'business'],
    default: 'starter',
  },
  avatarURL: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    required: false,
  },
});

userSchema.pre('save', function (next) {
  if (!this.avatarURL) {
    this.avatarURL = gravatar.url(this.email, { s: '250', d: 'retro' }, true);
  }
  if (this.isNew) {
    this.verificationToken = crypto.randomBytes(20).toString('hex');
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../../models/user');
const authenticate = require('../../middleware/authenticate');
const gravatar = require('gravatar');
const multer = require('multer');
const jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');
const { sendVerificationEmail } = require('../../helpers/emailHelper');

const router = express.Router();

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  subscription: Joi.string().valid('starter', 'pro', 'business').default('starter'),
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './tmp');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post('/signup', async (req, res) => {
  const { email, password, subscription } = await userSchema.validateAsync(req.body);
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: "Email in use" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email, { s: '250', d: 'retro' }, true);
  const verificationToken = nanoid();
  const newUser = new User({
    email,
    password: hashedPassword,
    subscription,
    avatarURL,
    verificationToken
  });
  await newUser.save();
  sendVerificationEmail(newUser.email, verificationToken);
  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
      avatarURL: newUser.avatarURL
    }
  });
});

router.get('/verify/:verificationToken', async (req, res) => {
  const user = await User.findOne({ verificationToken: req.params.verificationToken });
  if (!user) {
    return res.status(404).json({ message: "Verification token is invalid or has already been used" });
  }
  user.verified = true;
  user.verificationToken = undefined;
  await user.save();
  res.status(200).json({ message: "Email successfully verified" });
});

router.post('/verify', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "missing required field email" });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.verified) {
    return res.status(400).json({ message: "Verification has already been passed" });
  }
  sendVerificationEmail(user.email, user.verificationToken);
  res.status(200).json({ message: "Verification email sent" });
});

module.exports = router;

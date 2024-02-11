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
  try {
    const { email, password, subscription } = await userSchema.validateAsync(req.body);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email in use" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email, { s: '250', d: 'retro' }, true);
    const newUser = new User({
      email,
      password: hashedPassword,
      subscription,
      avatarURL
    });
    await newUser.save();
    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL
      }
    });
  } catch (err) {
    if (err.isJoi) return res.status(400).json({ message: err.details[0].message });
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = await userSchema.validateAsync(req.body, {
      allowUnknown: true,
      abortEarly: false
    });
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    user.token = token;
    await user.save();
    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL
      }
    });
  } catch (err) {
    if (err.isJoi) return res.status(400).json({ message: err.details[0].message });
    res.status(500).json({ message: err.message });
  }
});

router.patch('/avatars', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const image = await jimp.read(req.file.path);
    await image.cover(250, 250).quality(90).writeAsync(req.file.path);
    const fileName = `${req.user._id}${path.extname(req.file.originalname)}`;
    const avatarURL = `/avatars/${fileName}`;
    fs.renameSync(req.file.path, `./public/avatars/${fileName}`);
    req.user.avatarURL = avatarURL;
    await req.user.save();
    res.status(200).json({ avatarURL });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/logout', authenticate, async (req, res) => {
  try {
    req.user.token = null;
    await req.user.save();
    res.status(204).send();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
});

router.get('/current', authenticate, async (req, res) => {
  res.status(200).json({
    email: req.user.email,
    subscription: req.user.subscription,
    avatarURL: req.user.avatarURL
  });
});

module.exports = router;

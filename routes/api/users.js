const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../../models/user');
const authenticate = require('../../middleware/authenticate');

const router = express.Router();

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  subscription: Joi.string().valid('starter', 'pro', 'business').default('starter'),
});

router.post('/signup', async (req, res) => {
  try {
    const { email, password, subscription } = await userSchema.validateAsync(req.body);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email in use" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      subscription
    });
    await newUser.save();
    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription
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
        subscription: user.subscription
      }
    });
  } catch (err) {
    if (err.isJoi) return res.status(400).json({ message: err.details[0].message });
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
    subscription: req.user.subscription
  });
});

module.exports = router;

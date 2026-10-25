const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validateBody = require('../middleware/validateBody');
const { registerSchema, loginSchema } = require('../validation/authSchema');

const router = express.Router();

// Makes a login token that says "this is user <id>" and expires in 7 days.
function createToken(userId) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
}

// The response both register and login send back.
function authResponse(user) {
  return { token: createToken(user._id), user: { id: String(user._id), email: user.email } };
}

// Register a new account. 409 if the email is already taken.
router.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });

    res.status(201).json(authResponse(user));
  } catch (err) {
    // 11000 = duplicate key: two sign-ups with the same email at the same moment.
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Log in. Wrong email and wrong password get the same message, so nobody
// can use this route to find out which emails have accounts.
router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!passwordOk) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.status(200).json(authResponse(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

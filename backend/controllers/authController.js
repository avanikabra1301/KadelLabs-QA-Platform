const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'testsecretforlocaldev', {
    expiresIn: '30d',
  });
};

const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role });
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const candidateLogin = async (req, res) => {
  const { name, degree, college } = req.body;
  if (!name || !degree || !college) return res.status(400).json({ message: 'Name, degree, and college are required' });

  try {
    // Check if candidate exists by name (this is naive, but fits the requirement)
    // If they already exist, we could just log them in, or verify degree/college. 
    // We'll just update it or find it.
    let user = await User.findOne({ name, role: 'candidate' });
    
    if (!user) {
      // Create a new candidate profile without email/password
      user = await User.create({ 
        name, 
        role: 'candidate',
        degree,
        college,
        email: `${name.toLowerCase().replace(/\s+/g, '')}_${Date.now()}@candidate.temp`, // Dummy email to satisfy schema if needed
        password: Math.random().toString(36).slice(-8) // Random password they don't need to know
      });
    } else {
      // Update existing user with latest degree/college
      user.degree = degree;
      user.college = college;
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      role: user.role,
      degree: user.degree,
      college: user.college,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && user.role === 'admin' && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid Admin credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, authUser, candidateLogin };

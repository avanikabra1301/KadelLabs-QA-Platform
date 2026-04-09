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
  const { name, email, degree, college, course, domain } = req.body;
  if (!name || !email || !degree || !college || !course || !domain) {
    return res.status(400).json({ message: 'Name, email, degree, college, course, and domain are required' });
  }

  // Name validation: alphabets and spaces only
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!nameRegex.test(name) || !nameRegex.test(degree) || !nameRegex.test(college)) {
    return res.status(400).json({ message: 'Name, Degree, and College must contain only alphabets and spaces' });
  }

  try {
    // Check if candidate exists by actual email
    let user = await User.findOne({ email, role: 'candidate' });
    
    // Check if another candidate has this email (maybe an admin error, etc.), mostly unique constraint will handle it.
    if (!user) {
      // Create a new candidate profile
      user = await User.create({ 
        name, 
        role: 'candidate',
        email,
        degree,
        college,
        course,
        domain,
        password: Math.random().toString(36).slice(-8) // Random password they don't need to know
      });
    } else {
      // Update existing user with latest info
      user.name = name;
      user.degree = degree;
      user.college = college;
      user.course = course;
      user.domain = domain;
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      degree: user.degree,
      college: user.college,
      course: user.course,
      domain: user.domain,
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

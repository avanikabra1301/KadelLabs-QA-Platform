const express = require('express');
const { registerUser, authUser, candidateLogin } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/candidate-login', candidateLogin);

module.exports = router;

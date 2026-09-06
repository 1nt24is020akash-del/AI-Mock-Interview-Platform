const express = require('express');
const { register, login, getMe } = require('../controllers/authcontroller.js');
const { protect } = require('../middleware/auth.js');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
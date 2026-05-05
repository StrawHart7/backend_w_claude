const express = require('express');
const router = express.Router();
const { subscribe } = require('../controllers/pushController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/subscribe', authMiddleware, subscribe);

module.exports = router;
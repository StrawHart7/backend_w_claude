const express = require('express');
const router = express.Router();
const { subscribe } = require('../controllers/pushController');
const authMiddleware = require('../middlewares/authMiddleware');
const { subscribe, testPush } = require('../controllers/pushController');

router.post('/subscribe', authMiddleware, subscribe);
router.get('/test', authMiddleware, testPush);

module.exports = router;
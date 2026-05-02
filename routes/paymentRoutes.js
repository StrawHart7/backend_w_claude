const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const paymentController = require('../controllers/paymentController')

router.post('/initiate', authMiddleware, paymentController.initiatePayment)
router.post('/verify', authMiddleware, paymentController.verifyPayment)

module.exports = router
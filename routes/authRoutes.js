const express = require('express')
const router = express.Router()
const { register, login, getMe } = require('../controllers/authController')

router.post('/register', register)
router.post('/login', login)
router.post('/me', verifyToken, getMe)

module.exports = router
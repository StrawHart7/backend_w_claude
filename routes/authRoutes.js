const express = require('express')
const router = express.Router()
const { register, login, refresh, logout, updateEmail, updatePassword, getMe } = require('../controllers/authController')
const verifyToken = require('../middlewares/authMiddleware')

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.put('/update-email', verifyToken, updateEmail)
router.put('/update-password', verifyToken, updatePassword)
router.get('/me', verifyToken, getMe)

module.exports = router
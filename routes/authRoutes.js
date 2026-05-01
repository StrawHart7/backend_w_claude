const express = require('express')
const router = express.Router()
const { register, login, refresh, logout, updateEmail, updatePassword } = require('../controllers/authController')
const { verify } = require('jsonwebtoken')
const verifyToken = require('../middlewares/authMiddleware')

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.put('/update-email', verifyToken, updateEmail)
router.put('/update-password', verifyToken, updatePassword)

module.exports = router
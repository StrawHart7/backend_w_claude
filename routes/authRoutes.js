const express = require('express')
const router = express.Router()
const { register, login, deleteAccount } = require('../controllers/authController')
const { verify } = require('jsonwebtoken')

router.post('/register', register)
router.post('/login', login)
router.delete('/delete-account', verifyToken, deleteAccount)

module.exports = router
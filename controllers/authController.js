const pool = require('../db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_secret,
    { expiresIn: '15m' }
  )
}

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.REFRESH_SECRET,
    { expiresIn: '30d' }
  )
}

const register = async (req, res) => {
  try {
    const { email, password } = req.body
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' })
    }
    const user = result.rows[0]
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' })
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
      [user.id, refreshToken]
    )

    res.json({ accessToken, refreshToken, email: user.email })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token manquant' })

    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1',
      [refreshToken]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Refresh token invalide' })
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET)
    const newAccessToken = generateAccessToken({ id: decoded.id, email: decoded.email })
    res.json({ accessToken: newAccessToken })
  } catch (error) {
    res.status(401).json({ message: 'Refresh token expiré' })
  }
}

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken])
    res.json({ message: 'Déconnecté' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body
    const userId = req.user.id

    const emailExists = await pool.query('SELECT * FROM users WHERE email = $1', [newEmail])
    if (emailExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' })
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
    const user = result.rows[0]
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).json({ message: 'Mot de passe incorrect' })
    }

    await pool.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, userId])

    const newAccessToken = generateAccessToken({ id: user.id, email: newEmail })
    res.json({ message: 'Email mis à jour', accessToken: newAccessToken, email: newEmail })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.id

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
    const user = result.rows[0]
    const validPassword = await bcrypt.compare(currentPassword, user.password)
    if (!validPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId])

    res.json({ message: 'Mot de passe mis à jour' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, photo, is_premium FROM users WHERE id = $1',
      [req.user.id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { register, login, refresh, logout, updateEmail, updatePassword, getMe }
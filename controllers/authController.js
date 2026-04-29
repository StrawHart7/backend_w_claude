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

    // Vérifier que le token existe en BDD
    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1',
      [refreshToken]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Refresh token invalide' })
    }

    // Vérifier la signature
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

module.exports = { register, login, refresh, logout }
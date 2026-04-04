const pool = require('../db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const register = async (req, res) => {
    try {
        const {email, password} = req.body

        // Verifie si l'emai est deja utilise
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email])
        if (userExists.rows.length > 0) {
            return res.status(400).json({message: 'email deja utilise'})
        }

        // Hashe le password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Sauvegarder l'utilisateur
        const result = await pool.query('INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email', [email, hashedPassword])
        res.status(201).json(result.rows[0])
    } catch(error) {
        res.status(500).json({ message: error.message})
    }
}


const login = async (req, res) => {
    try {
        const { email, password } = req.body

        // Verifie si l'utilisateur existe
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' })
        }

        const user = result.rows[0]

        // Compare le Passsword
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' })
        }

        // Generer le token
        const token = jwt.sign(
            { id: user.id, email: user.email},
            process.env.JWT_secret,
            { expiresIn: '1h'}
        )

        res.json({token})
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = { register, login }
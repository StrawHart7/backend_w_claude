const express = require('express')
const router = express.Router()
const upload = require('../middlewares/uploadMiddleware')
const verifyToken = require('../middlewares/authMiddleware')
const pool = require('../db')

router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier uploadé' })
        }

        const path = `uploads/${req.file.filename}`

        // Stock le chemin dans la BDD
        await pool.query(
            'UPDATE users SET photo = $1 WHERE id = $2', [path, req.user.id]
        )

        res.json({
            message: 'Fichier uploadé aec succès',
            filename: req.file.filename,
            path
        })
    } catch (error) {
        console.log('erreur', error)
        res.status(500).json({ message: error.message })
    }
})

module.exports = router
const jwt = require('jsonwebtoken')

const  verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization']

    if(!authHeader) {
        return res.status(401).json({message: 'Token manquant'})
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_secret)
        req.user = decoded // On lie l'utilisateur à la requete
        next() // On passe au controller 
    } catch (error) {
        res.status(401).json({message: 'Token invalide ou expiré'})
    }
}

module.exports = verifyToken
const Joi = require('joi')

const todoSchema = Joi.object({
    tache: Joi.string().min(1).max(255).required().messages({
        'string.base': 'La tache doit contenir du texte',
        'string.empty': 'La tache est vide'
    })
})

module.exports = todoSchema
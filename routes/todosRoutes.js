const express = require('express')
const router = express.Router()
const {getTodos, createTodo, deleteTodo} = require('../controllers/todosController')
const verifyToken = require('../middlewares/authMiddleware')


router.get('/', verifyToken, getTodos)
router.post('/', verifyToken, createTodo)
router.delete('/:id', verifyToken, deleteTodo)

module.exports = router
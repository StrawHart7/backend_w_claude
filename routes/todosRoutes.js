const express = require('express')
const router = express.Router()
const {getTodos, createTodo, updateTodo, deleteTodo} = require('../controllers/todosController')
const verifyToken = require('../middlewares/authMiddleware')


router.get('/', verifyToken, getTodos)
router.post('/', verifyToken, createTodo)
roter.put('/:id', verifyToken, updateTodo)
router.delete('/:id', verifyToken, deleteTodo)

module.exports = router
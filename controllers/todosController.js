const pool = require('../db')
const todoSchema = require('../validators/todosValidator')

const getTodos = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM todos WHERE user_id = $1 ORDER BY deadline ASC NULLS LAST, id ASC',
      [req.user.id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const createTodo = async (req, res) => {
  try {
    const { error } = todoSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const { tache, deadline } = req.body
    const result = await pool.query(
      'INSERT INTO todos (tache, user_id, deadline) VALUES ($1, $2, $3) RETURNING *',
      [tache, req.user.id, deadline || null]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateTodo = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { tache, completed, deadline } = req.body
    const result = await pool.query(
      'UPDATE todos SET tache = COALESCE($1, tache), completed = COALESCE($2, completed), deadline = COALESCE($3, deadline) WHERE id = $4 AND user_id = $5 RETURNING *',
      [tache, completed, deadline, id, req.user.id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteTodo = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    await pool.query(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    )
    res.json({ message: 'Tâche supprimée' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getTodos, createTodo, updateTodo, deleteTodo }
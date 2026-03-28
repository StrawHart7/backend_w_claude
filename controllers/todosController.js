const pool = require("../db");
const todoSchema = require("../validator/todosValidator");

// La liste de toutes les taches
const getTodos = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM todos");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ajouter une tache
const createTodo = async (req, res) => {
  try {
    const { error } = todoSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { tache } = req.body;
    const result = await pool.query(
      "INSERT INTO todos (tache) VALUES ($1) RETURNING *",
      [tache],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une tache
const deleteTodo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query("DELETE FROM todos WHERE id = $1", [id]);
    res.json({ message: "Tache supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTodos, createTodo, deleteTodo };

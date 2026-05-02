require('dotenv').config()
const express = require('express')
const cors = require('cors')
const todosRoutes = require('./routes/todosRoutes')
const authRoutes = require('./routes/authRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const app = express()

app.use(cors())
app.use(express.json())
app.use('/todos', todosRoutes)
app.use('/auth', authRoutes)
app.use('/payment', paymentRoutes)

//Route de confirmation
app.get('/health', (req, res) => {
    res.status(200).json({statut: 'Ok', message: "Backend is running"})
})

app.get('/ping', (req, res) => {
  res.json({ status: 'ok' })
})

// Cast the backend on PORT 3000
app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`)
})
const axios = require('axios')
const pool = require('../db')

const initiatePayment = async (req, res) => {
  console.log('Public key starts with:', process.env.NOTCHPAY_PUBLIC_KEY?.substring(0, 10))
  try {
    const user = req.user

    const response = await axios.post(
      'https://api.notchpay.co/payments',
      {
        email: user.email,
        amount: 10,
        currency: 'USD',
        reference: `premium_${user.id}_${Date.now()}`,
        callback: process.env.NOTCHPAY_CALLBACK_URL
      },
      {
        headers: {
          Authorization: process.env.NOTCHPAY_PUBLIC_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    const { authorization_url, reference } = response.data.data

    res.json({ authorization_url, reference })
  } catch (err) {
    console.error('Notchpay initiate error:', err.response?.data || err.message)
    res.status(500).json({ message: 'Erreur initialisation paiement' })
  }
}

const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.body
    const userId = req.user.id

    const response = await axios.get(
      `https://api.notchpay.co/payments/${reference}`,
      {
        headers: {
          Authorization: process.env.NOTCHPAY_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('Verify response:', JSON.stringify(response.data, null, 2))

    const transaction = response.data.data

    if (transaction.status === 'complete') {
      await pool.query(
        'UPDATE users SET is_premium = TRUE WHERE id = $1',
        [userId]
      )
      res.json({ success: true })
    } else {
      res.status(400).json({ message: 'Paiement non complété' })
    }
  } catch (err) {
    console.error('Notchpay verify error:', err.response?.data || err.message)
    res.status(500).json({ message: 'Erreur vérification paiement' })
  }
}

module.exports = { initiatePayment, verifyPayment }
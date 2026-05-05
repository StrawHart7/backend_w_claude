const db = require('../db');
const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Sauvegarder la subscription
const subscribe = async (req, res) => {
  const userId = req.user.id;
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Subscription invalide' });
  }

  try {
    // Eviter les doublons
    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [userId, endpoint, keys.p256dh, keys.auth]
    );

    res.json({ message: 'Subscription enregistrée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Job : envoyer les notifs pour deadlines proches
const sendDeadlineReminders = async () => {
  try {
    // Récupère les todos avec deadline dans les prochaines 24h, non complétés
    const { rows: todos } = await db.query(`
      SELECT t.id, t.tache, t.deadline, t.user_id
      FROM todos t
      WHERE t.completed = FALSE
        AND t.deadline IS NOT NULL
        AND t.deadline = CURRENT_DATE + INTERVAL '1 day'
    `);

    for (const todo of todos) {
      const { rows: subs } = await db.query(
        'SELECT * FROM push_subscriptions WHERE user_id = $1',
        [todo.user_id]
      );

      for (const sub of subs) {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        };

        const payload = JSON.stringify({
          title: '⏰ Deadline demain !',
          body: todo.tache,
          url: '/todos'
        });

        try {
          await webpush.sendNotification(pushSub, payload);
        } catch (err) {
          // Subscription expirée → on la supprime
          if (err.statusCode === 410) {
            await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
          }
        }
      }
    }
  } catch (err) {
    console.error('Erreur sendDeadlineReminders:', err);
  }
};

module.exports = { subscribe, sendDeadlineReminders };
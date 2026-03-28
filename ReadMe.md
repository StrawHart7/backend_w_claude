# 📚 Fiche Récapitulative — Backend Node.js + Express + PostgreSQL

---

## 🗂️ Structure du projet

```
mon-backend/
├── controllers/
│   ├── authController.js
│   └── todosController.js
├── middlewares/
│   ├── authMiddleware.js
│   └── uploadMiddleware.js
├── routes/
│   ├── authRoutes.js
│   ├── todosRoutes.js
│   └── uploadRoutes.js
├── validators/
│   └── todosValidator.js
├── uploads/
├── db.js
├── index.js
├── .env
└── .gitignore
```

---

## 📦 Packages installés

| Package | Rôle |
|---|---|
| `express` | Framework HTTP |
| `pg` | Client PostgreSQL pour Node.js |
| `dotenv` | Charger les variables d'environnement |
| `bcrypt` | Hasher les mots de passe |
| `jsonwebtoken` | Générer et vérifier les tokens JWT |
| `joi` | Valider les données entrantes |
| `multer` | Gérer l'upload de fichiers |
| `cors` | Autoriser les requêtes cross-origin |

---

## 🔌 index.js — Point d'entrée

```javascript
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())
app.use('/auth', authRoutes)
app.use('/todos', todosRoutes)
app.use('/upload', uploadRoutes)

app.listen(process.env.PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${process.env.PORT}`)
})
```

---

## 🗄️ db.js — Connexion PostgreSQL

```javascript
require('dotenv').config()
const { Pool } = require('pg')

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    })

module.exports = pool
```

- `Pool` → gestionnaire de connexions, plus performant qu'une connexion unique
- `DATABASE_URL` → utilisé en production (Render), les variables séparées en local

---

## 🔐 Authentification JWT

### Flow complet
```
REGISTER : POST /auth/register → hash password → sauvegarde en BDD
LOGIN    : POST /auth/login    → vérifie password → génère token JWT
REQUÊTE  : GET /todos + Header Authorization: Bearer <token>
```

### Générer un token
```javascript
const token = jwt.sign(
  { id: user.id, email: user.email }, // payload
  process.env.JWT_secret,              // clé secrète
  { expiresIn: '1h' }                  // expiration
)
```

### Vérifier un token (middleware)
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET)
req.user = decoded
next()
```

### Points importants
- Le payload JWT est encodé en **base64**, pas chiffré → ne jamais mettre le mot de passe dedans
- Le mot de passe est hashé avec **bcrypt** → irréversible
- Le token expire → si volé, il ne peut pas être utilisé indéfiniment

---

## 🛣️ Routes et méthodes HTTP

| Méthode | Usage |
|---|---|
| `GET` | Lire des données |
| `POST` | Créer des données |
| `PUT` | Modifier des données |
| `DELETE` | Supprimer des données |

### Exemple de route protégée
```javascript
router.get('/', verifyToken, getTodos)
//           ↑ middleware  ↑ controller
```

---

## 🧱 Controllers

Contiennent la logique métier. Toujours avec `try/catch` :

```javascript
const getTodos = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
```

---

## ✅ Validation avec Joi

```javascript
const todoSchema = Joi.object({
  tache: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'La tâche ne peut pas être vide',
    'any.required': 'La tâche est obligatoire'
  })
})

// Dans le controller
const { error } = todoSchema.validate(req.body)
if (error) return res.status(400).json({ message: error.details[0].message })
```

- Les **clés** (`string.empty`, `any.required`) sont imposées par Joi
- Les **messages** sont 100% personnalisables

---

## 📁 Upload de fichiers avec Multer

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const name = path.basename(file.originalname, path.extname(file.originalname))
    cb(null, `${name}_${Date.now()}${path.extname(file.originalname)}`)
  }
})
```

- Le fichier est stocké physiquement dans `uploads/`
- Le **chemin** est sauvegardé en BDD (jamais le fichier lui-même)
- `fileFilter` → accepte uniquement certains types de fichiers
- `limits` → taille maximale du fichier

---

## 🌍 CORS

```javascript
app.use(cors()) // autorise toutes les origines
```

Sans CORS → le navigateur bloque les requêtes venant d'une origine différente du serveur.

---

## 🔢 Codes HTTP importants

| Code | Signification |
|---|---|
| `200` | OK |
| `201` | Créé avec succès |
| `400` | Mauvaise requête (erreur client) |
| `401` | Non autorisé (token manquant/invalide) |
| `404` | Ressource non trouvée |
| `500` | Erreur serveur |

---

## 🗃️ PostgreSQL — Commandes utiles

```sql
-- Créer une base de données
CREATE DATABASE todo_db;

-- Se connecter
\c todo_db

-- Lister les tables
\dt

-- Créer une table
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  tache VARCHAR(255) NOT NULL
);

-- Ajouter une colonne
ALTER TABLE users ADD COLUMN photo VARCHAR(255);

-- Lire les données
SELECT * FROM todos;
```

- `SERIAL` → auto-incrément, PostgreSQL gère les ids tout seul
- `PRIMARY KEY` → identifiant unique
- `UNIQUE` → deux lignes ne peuvent pas avoir la même valeur
- `NOT NULL` → champ obligatoire
- Les ids ne se réutilisent jamais après suppression → comportement voulu

---

## 🚀 Déploiement sur Render

1. Pousser le code sur GitHub
2. Créer un **Web Service** sur Render connecté au repo
3. Créer une **PostgreSQL** sur Render
4. Ajouter `DATABASE_URL` dans les variables d'environnement
5. Créer les tables via `psql <External Database URL>`

### Variables d'environnement à configurer
```
PORT=3000
DB_USER=...
DB_HOST=...
DB_NAME=...
DB_PASSWORD=...
DB_PORT=5432
JWT_secret=...
DATABASE_URL=...
```

---

## ⚠️ Erreurs fréquentes

| Erreur | Cause | Solution |
|---|---|---|
| `401 Token manquant` | Header Authorization absent | Ajouter `Bearer <token>` dans les headers |
| `401 Token invalide` | Token expiré ou mauvaise clé secrète | Se reconnecter pour avoir un nouveau token |
| `400 Bad Request` | Validation échouée ou fichier absent | Vérifier le body de la requête |
| `500 relation does not exist` | Table non créée en BDD | Exécuter les `CREATE TABLE` |
| Erreur CORS | Requête bloquée par le navigateur | Ajouter `app.use(cors())` |

---

*Backend développé avec Node.js, Express, PostgreSQL — Déployé sur Render*
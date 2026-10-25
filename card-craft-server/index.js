require('dotenv').config();

// Tokens can't be signed or checked without a secret, so don't start at all.
if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Add it to your .env file (see .env.example) and restart.');
  process.exit(1);
}

const mongoose = require('mongoose');
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth');
const cardRoutes = require('./routes/cards');
const { authLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandlers');
const app = express()
const PORT = process.env.PORT || 3000

// Hosts like Render put one proxy in front of the app. This tells Express
// to read the visitor's real IP from that proxy, so rate limits count per
// visitor instead of treating everyone as the proxy's single IP.
app.set('trust proxy', 1)

// Only the frontend's origin may call this API from a browser.
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('MongoDB connection failed:', err.message));

// Health check: a quick way to confirm the server is up.
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Register and log in: POST /api/auth/register and POST /api/auth/login.
// Rate-limited to slow down password guessing.
app.use('/api/auth', authLimiter, authRoutes);

// Card routes, all behind login: see routes/cards.js.
app.use('/api/cards', cardRoutes);

// These two must stay last: unknown routes get a JSON 404, and any error
// (including malformed JSON bodies) gets a JSON reply instead of an HTML page.
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

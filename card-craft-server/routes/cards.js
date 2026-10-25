const express = require('express');
const Card = require('../models/Card');
const requireAuth = require('../middleware/requireAuth');
const validateBody = require('../middleware/validateBody');
const { createCardSchema, updateCardSchema } = require('../validation/cardSchema');
const { toCardLast4, detectNetwork } = require('../utils/cardNumber');
const { reviewCardDesign, ReviewUnavailableError } = require('../services/designReview');
const { reviewLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// Every card route needs a logged-in user. After this line, req.userId is
// always set, and every query below filters by it. Another user's card is
// treated exactly like a missing one (404), so ids of other people's cards
// can't be discovered.
router.use(requireAuth);

// The error replies shared by the card routes. Never sends raw library
// error messages to the client.
function sendCardError(err, res) {
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid card id' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Invalid card data' });
  }
  console.error(err);
  res.status(500).json({ error: 'Server error' });
}

// List the logged-in user's cards, newest first.
router.get('/', async (req, res) => {
  try {
    const cards = await Card.find({ owner: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(cards);
  } catch (err) {
    sendCardError(err, res);
  }
});

// Get one of the logged-in user's cards by its id.
router.get('/:id', async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, owner: req.userId });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.status(200).json(card);
  } catch (err) {
    sendCardError(err, res);
  }
});

// Create a card. The network is worked out from the full number, then only
// the last 4 digits are saved. The owner always comes from the token,
// never from the request body.
router.post('/', validateBody(createCardSchema), async (req, res) => {
  try {
    const { name, cardNumber, namePos, status, coBrand } = req.body;

    const card = await Card.create({
      owner: req.userId,
      name,
      network: detectNetwork(cardNumber),
      cardLast4: toCardLast4(cardNumber),
      namePos,
      status,
      coBrand,
    });

    res.status(201).json(card);
  } catch (err) {
    sendCardError(err, res);
  }
});

// Update one of the logged-in user's cards. Builds the update from allowed
// fields only. If no new card number is sent, last 4 and network stay as they are.
router.put('/:id', validateBody(updateCardSchema), async (req, res) => {
  try {
    const { name, cardNumber, namePos, status, coBrand } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (namePos !== undefined) update.namePos = namePos;
    if (status !== undefined) update.status = status;
    if (coBrand !== undefined) update.coBrand = coBrand;
    if (cardNumber !== undefined) {
      update.network = detectNetwork(cardNumber);
      update.cardLast4 = toCardLast4(cardNumber);
    }

    const card = await Card.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      update,
      { returnDocument: 'after', runValidators: true }
    );

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.status(200).json(card);
  } catch (err) {
    sendCardError(err, res);
  }
});

// Delete one of the logged-in user's cards. 204 = done, nothing to send back.
router.delete('/:id', async (req, res) => {
  try {
    const card = await Card.findOneAndDelete({ _id: req.params.id, owner: req.userId });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.status(204).end();
  } catch (err) {
    sendCardError(err, res);
  }
});

// Ask the AI for a design review of one of the logged-in user's cards.
// Returns { score, tips }, or 503 if the review service is unavailable.
router.post('/:id/review', reviewLimiter, async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, owner: req.userId });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const review = await reviewCardDesign(card);
    res.status(200).json(review);
  } catch (err) {
    if (err instanceof ReviewUnavailableError) {
      return res.status(503).json({ error: err.message });
    }
    sendCardError(err, res);
  }
});

module.exports = router;

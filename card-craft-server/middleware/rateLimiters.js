const { rateLimit } = require('express-rate-limit');

// Limits how often one IP address can hit a route in a time window.
// Over the limit, the client gets 429 with our usual { error } shape.
function createLimiter({ windowMinutes, limit, message }) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: message },
  });
}

// Register and login: slows down password guessing and mass sign-ups.
const authLimiter = createLimiter({
  windowMinutes: 15,
  limit: 20,
  message: 'Too many login or sign-up attempts. Please wait a few minutes and try again.',
});

// AI review: each call costs money, so keep it tight.
const reviewLimiter = createLimiter({
  windowMinutes: 15,
  limit: 10,
  message: 'Too many design reviews. Please wait a few minutes and try again.',
});

module.exports = { authLimiter, reviewLimiter };

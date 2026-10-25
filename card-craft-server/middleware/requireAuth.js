const jwt = require('jsonwebtoken');

// Protects a route: the request must carry "Authorization: Bearer <token>"
// with a token we signed. On success, req.userId holds the logged-in
// user's id, so routes know whose cards to work with.
function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    req.userId = payload.sub;
    next();
  } catch (err) {
    // Expired, tampered with, or signed with a different secret.
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;

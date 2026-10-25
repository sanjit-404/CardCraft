// Runs when no route matched the request. Must be added after all routes,
// because Express checks them in order.
function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

// Express calls this (it has 4 arguments) whenever something throws or
// passes an error on. It must be added last. Clients only ever get our
// own short messages, never the library's raw error text.
// `next` is unused, but Express needs all 4 arguments to treat this as an
// error handler.
function errorHandler(err, req, res, next) {
  // The JSON body couldn't be read, e.g. a missing quote or comma.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON in request body' });
  }
  // The body is bigger than express.json() allows (100 KB by default).
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }

  console.error(err);
  res.status(500).json({ error: 'Server error' });
}

module.exports = { notFound, errorHandler };

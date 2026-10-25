// Checks req.body against a Zod schema before the route runs.
// Bad input gets a 400 with one entry per problem field; good input replaces
// req.body with the cleaned version (trimmed, spaces removed, extra fields dropped).
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      return res.status(400).json({ error: 'Invalid request body', details });
    }

    req.body = result.data;
    next();
  };
}

module.exports = validateBody;

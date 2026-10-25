const { z } = require('zod');

// Email is trimmed and lowercased first, so "Ada@Mail.com " and
// "ada@mail.com" count as the same account.
const emailField = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Enter a valid email address' }));

// Register: password needs at least 8 characters. bcrypt only reads the
// first 72 bytes of a password, so longer ones are rejected instead of
// being silently cut short.
const registerSchema = z.object({
  email: emailField,
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (password) => Buffer.byteLength(password, 'utf8') <= 72,
      'Password is too long (max 72 characters)'
    ),
});

// Login: only checks that both fields are present. Whether the password
// is right is decided by comparing it with the stored hash.
const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };

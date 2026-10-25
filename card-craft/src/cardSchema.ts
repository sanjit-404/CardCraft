import { z } from 'zod'
import { detectNetwork, expectedLength, isValidLuhn, NETWORK_NAMES } from './cardNumber'

// The cardholder name: 1 to 26 characters after trimming spaces at the ends.
export const nameSchema = z
  .string()
  .trim() // so "   " counts as empty
  .min(1, 'Name is required')
  .max(26, 'Name must be 26 characters or fewer')

// The card number. The input shows spaces like "4111 1111 1111 1111", so we
// remove them first. The result of a successful parse is the digits only.
export const cardNumberSchema = z
  .string()
  .transform((value) => value.replace(/\s/g, ''))
  .superRefine((digits, ctx) => {
    // Checks run in order and we stop at the first problem,
    // so the user sees one clear message at a time.
    if (digits === '') {
      ctx.addIssue({ code: 'custom', message: 'Card number is required' })
      return
    }
    if (!/^\d+$/.test(digits)) {
      ctx.addIssue({ code: 'custom', message: 'Card number can only contain digits' })
      return
    }
    const network = detectNetwork(digits)
    const length = expectedLength(network)
    if (digits.length !== length) {
      const label = network === 'amex' ? 'Amex card numbers' : 'Card numbers'
      ctx.addIssue({ code: 'custom', message: `${label} must be exactly ${length} digits` })
      return
    }
    if (!isValidLuhn(digits)) {
      const label = network === 'unknown' ? 'card' : NETWORK_NAMES[network]
      ctx.addIssue({ code: 'custom', message: `This is not a valid ${label} number (failed Luhn check)` })
    }
  })

// Login only needs both fields filled in; the server checks the password.
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

// Registering has the same rules as the backend: a real email, password 8+.
export const registerSchema = z.object({
  email: z.string().trim().pipe(z.email('Enter a valid email address')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

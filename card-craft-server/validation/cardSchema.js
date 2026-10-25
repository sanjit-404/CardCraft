const { z } = require('zod');
const { detectNetwork, expectedLength, passesLuhn } = require('../utils/cardNumber');
const { STATUSES, LOGO_IDS, LAYOUTS, CANVAS } = require('../config/cardOptions');

// Card number as typed by the user: spaces are removed first. Then it must
// be digits only, have the right length for its network (Amex 15, others
// 16), and pass the Luhn check. Each check stops at the first problem, so
// the user sees one clear message.
const cardNumberField = z
  .string({ error: 'Card number is required' })
  .transform((value) => value.replace(/ /g, ''))
  .pipe(
    z
      .string()
      .regex(/^\d+$/, { error: 'Card number must contain only digits', abort: true })
      .superRefine((digits, ctx) => {
        const network = detectNetwork(digits);
        const length = expectedLength(network);

        if (digits.length !== length) {
          const label = network === 'amex' ? 'Amex card numbers' : 'Card number';
          ctx.addIssue({ code: 'custom', message: `${label} must be exactly ${length} digits` });
          return;
        }
        if (!passesLuhn(digits)) {
          ctx.addIssue({ code: 'custom', message: 'Card number is not valid (failed Luhn check)' });
        }
      })
  );

// Where the name sits on the card, kept inside the 400 x 252 canvas.
const namePosField = z.object({
  x: z
    .number({ error: 'namePos.x must be a number' })
    .min(0, 'namePos.x must be 0 or more')
    .max(CANVAS.width, `namePos.x must be ${CANVAS.width} or less`),
  y: z
    .number({ error: 'namePos.y must be a number' })
    .min(0, 'namePos.y must be 0 or more')
    .max(CANVAS.height, `namePos.y must be ${CANVAS.height} or less`),
});

// A logo is either one of the preset IDs or null (no logo).
const logoField = z
  .enum(LOGO_IDS, { error: `Logo must be null or one of: ${LOGO_IDS.join(', ')}` })
  .nullable();

// Co-branding is sent as a whole object: both logo slots and the layout.
const coBrandField = z.object({
  primaryLogo: logoField,
  secondaryLogo: logoField,
  layout: z.enum(LAYOUTS, { error: `Layout must be one of: ${LAYOUTS.join(', ')}` }),
});

// Every field a client may send. Anything else (network, owner, cardLast4,
// ...) is not listed here, so Zod drops it.
const cardFields = {
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(26, 'Name must be 26 characters or fewer'),
  cardNumber: cardNumberField,
  namePos: namePosField,
  status: z.enum(STATUSES, { error: `Status must be one of: ${STATUSES.join(', ')}` }),
  coBrand: coBrandField,
};

// Creating a card (POST): name and card number are required, the rest is optional.
const createCardSchema = z.object({
  name: cardFields.name,
  cardNumber: cardFields.cardNumber,
  namePos: cardFields.namePos.optional(),
  status: cardFields.status.optional(),
  coBrand: cardFields.coBrand.optional(),
});

// Updating a card (PUT): every field is optional, but at least one must be
// sent, otherwise there is nothing to update.
const updateCardSchema = z
  .object(cardFields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'Send at least one field to update: name, cardNumber, namePos, status or coBrand',
  });

module.exports = { createCardSchema, updateCardSchema };

// Turns a full card number into just its last 4 digits.
// We never store full card numbers, so this is the only place that
// decides what part of the number the server keeps.
function toCardLast4(cardNumber) {
  const digits = String(cardNumber).replace(/\D/g, '');
  return digits.slice(-4);
}

// Works out the card network from the first digits of the full number.
// Must run BEFORE the number is cut down to its last 4 digits.
// These are simplified prefix rules, good enough for a design mockup:
//   Amex: 34, 37 | Visa: 4 | Mastercard: 51-55, 2221-2720
//   RuPay: 60, 65, 81, 82, 508
function detectNetwork(cardNumber) {
  const digits = String(cardNumber).replace(/\D/g, '');
  const firstTwo = Number(digits.slice(0, 2));
  const firstFour = Number(digits.slice(0, 4));

  if (firstTwo === 34 || firstTwo === 37) return 'amex';
  if (digits.startsWith('4')) return 'visa';
  if ((firstTwo >= 51 && firstTwo <= 55) || (firstFour >= 2221 && firstFour <= 2720)) {
    return 'mastercard';
  }
  if ([60, 65, 81, 82].includes(firstTwo) || digits.startsWith('508')) return 'rupay';
  return 'unknown';
}

// How many digits a number should have for its network: Amex 15, others 16.
function expectedLength(network) {
  return network === 'amex' ? 15 : 16;
}

// Luhn checksum: the standard check digit used by real card numbers.
// It catches most typos (one wrong digit, two swapped digits).
function passesLuhn(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

module.exports = { toCardLast4, detectNetwork, expectedLength, passesLuhn };

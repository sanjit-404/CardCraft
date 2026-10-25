import type { Network } from './types'

// Plain-text names for showing a network to the user.
export const NETWORK_NAMES: Record<Network, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  rupay: 'RuPay',
  unknown: 'Unknown',
}

// Keep only the digits 0-9, so "4111 1111" becomes "41111111".
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

// Work out the network from the first digits. These rules match the backend
// exactly, so the live preview shows the same network the server will save.
export function detectNetwork(digits: string): Network {
  const first2 = Number(digits.slice(0, 2))
  const first3 = Number(digits.slice(0, 3))
  const first4 = Number(digits.slice(0, 4))

  if (digits.startsWith('4')) return 'visa'
  if (digits.length >= 2 && first2 >= 51 && first2 <= 55) return 'mastercard'
  if (digits.length >= 4 && first4 >= 2221 && first4 <= 2720) return 'mastercard'
  if (digits.startsWith('34') || digits.startsWith('37')) return 'amex'
  if (digits.length >= 2 && [60, 65, 81, 82].includes(first2)) return 'rupay'
  if (digits.length >= 3 && first3 === 508) return 'rupay'
  return 'unknown'
}

// Amex numbers have 15 digits, every other network has 16.
export function expectedLength(network: Network): number {
  return network === 'amex' ? 15 : 16
}

// Add spaces as the user types: Amex is 4-6-5 ("3782 822463 10005"),
// everything else is 4-4-4-4. Extra digits beyond the allowed length are dropped.
export function formatCardNumber(value: string): string {
  const network = detectNetwork(onlyDigits(value))
  const digits = onlyDigits(value).slice(0, expectedLength(network))
  const groupSizes = network === 'amex' ? [4, 6, 5] : [4, 4, 4, 4]

  const groups: string[] = []
  let start = 0
  for (const size of groupSizes) {
    const group = digits.slice(start, start + size)
    if (group === '') break
    groups.push(group)
    start += size
  }
  return groups.join(' ')
}

// The server only keeps the last 4 digits, so an opened design shows dots
// for the rest, using the same grouping as the full number would.
export function maskCardNumber(last4: string, network: Network): string {
  return network === 'amex' ? `•••• •••••• •${last4}` : `•••• •••• •••• ${last4}`
}

// The Luhn checksum: a simple maths check every real card number passes.
// It catches most typos, such as a single wrong digit.
export function isValidLuhn(cardNum: string): boolean {
  const digits = onlyDigits(cardNum)
  if (digits.length === 0) return false
  let sum = 0
  let shouldDouble = false
  // Walk from the last digit to the first, doubling every second digit
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (shouldDouble) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

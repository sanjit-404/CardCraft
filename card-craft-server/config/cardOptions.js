// The fixed lists of allowed values for a card, kept in one place so the
// database model and the request validation always agree.

const NETWORKS = ['visa', 'mastercard', 'amex', 'rupay', 'unknown'];

const STATUSES = ['draft', 'final'];

// Preset generic logos the user can pick for co-branding.
const LOGO_IDS = ['orbit', 'wave', 'shield', 'leaf', 'bolt', 'star'];

const LAYOUTS = ['side-by-side', 'stacked'];

// The card canvas in the frontend is 400 x 252, so the name must sit inside it.
const CANVAS = { width: 400, height: 252 };

module.exports = { NETWORKS, STATUSES, LOGO_IDS, LAYOUTS, CANVAS };

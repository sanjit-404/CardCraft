const mongoose = require('mongoose');
const { NETWORKS, STATUSES, LOGO_IDS, LAYOUTS, CANVAS } = require('../config/cardOptions');

const cardSchema = new mongoose.Schema(
  {
    // Which user this card belongs to. Indexed because every card query
    // filters by owner.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 26 },
    cardLast4: { type: String, required: true, match: /^\d{4}$/ },
    // Worked out by the server from the full number before it is thrown away.
    network: { type: String, enum: NETWORKS, required: true },
    namePos: {
      x: { type: Number, min: 0, max: CANVAS.width, default: 24 },
      y: { type: Number, min: 0, max: CANVAS.height, default: 220 },
    },
    status: { type: String, enum: STATUSES, default: 'draft' },
    // Logos are optional (null), but if set they must be one of the presets.
    coBrand: {
      primaryLogo: { type: String, enum: LOGO_IDS, default: null },
      secondaryLogo: { type: String, enum: LOGO_IDS, default: null },
      layout: { type: String, enum: LAYOUTS, default: 'side-by-side' },
    },
  },
  {
    timestamps: true,
    // Shape of a card when sent as JSON: drop the internal owner and
    // version fields, which the API contract doesn't include.
    toJSON: {
      versionKey: false,
      transform: (doc, ret) => {
        delete ret.owner;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Card', cardSchema);

const mongoose = require('mongoose');

// A registered user. We store a bcrypt hash of the password, never the
// password itself. `select: false` keeps the hash out of query results
// unless a route asks for it on purpose (only login does).
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

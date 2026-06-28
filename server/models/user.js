import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  cfHandle: {
    type: String,
    trim: true,
    default: null,
    // sparse so multiple users with no handle set don't collide on the
    // unique index - only non-null/non-empty handles must be unique.
    // default is null (not '') so the index treats "unset" consistently.
    unique: true,
    sparse: true,
  },
  lcHandle: {
    type: String,
    trim: true,
    default: null,
    unique: true,
    sparse: true,
  },
  friends: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  },
  emailReminders: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);
export default User;

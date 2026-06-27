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
    default: '',
  },
  lcHandle: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);
export default User;

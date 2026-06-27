import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGO_URI or MONGODB_URI is not defined in environment');
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;

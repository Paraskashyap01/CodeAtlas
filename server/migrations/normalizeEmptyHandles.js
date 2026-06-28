// One-time migration: run this BEFORE starting the server for the first
// time after pulling the handle-locking update.
//
// Why this is needed: cfHandle/lcHandle used to default to '' (empty
// string). The new schema makes them unique+sparse and defaults to null.
// A sparse unique index only ignores fields that are completely absent or
// null - multiple documents with cfHandle: '' would still collide on that
// empty string and crash the index build. This script clears any existing
// empty-string handles to null first so the index builds cleanly.
//
// Usage:
//   cd server
//   node migrations/normalizeEmptyHandles.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.js';

dotenv.config();

const run = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGO_URI or MONGODB_URI is not defined in environment');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected. Normalizing empty-string handles to null...');

  const cfResult = await User.updateMany({ cfHandle: '' }, { $set: { cfHandle: null } });
  const lcResult = await User.updateMany({ lcHandle: '' }, { $set: { lcHandle: null } });

  console.log(`cfHandle: ${cfResult.modifiedCount} document(s) updated`);
  console.log(`lcHandle: ${lcResult.modifiedCount} document(s) updated`);

  // Surface any pre-existing duplicate handles across accounts so they can
  // be resolved by hand before the unique index is built - this script
  // does not silently fix those, since picking a "winner" automatically
  // could lock someone out of a handle that is rightfully theirs.
  const cfDupes = await User.aggregate([
    { $match: { cfHandle: { $ne: null } } },
    { $group: { _id: '$cfHandle', count: { $sum: 1 }, emails: { $push: '$email' } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  const lcDupes = await User.aggregate([
    { $match: { lcHandle: { $ne: null } } },
    { $group: { _id: '$lcHandle', count: { $sum: 1 }, emails: { $push: '$email' } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (cfDupes.length || lcDupes.length) {
    console.warn('\n⚠️  Found existing duplicate handles. Resolve these manually before starting the server:');
    cfDupes.forEach((d) => console.warn(`  cfHandle "${d._id}" used by: ${d.emails.join(', ')}`));
    lcDupes.forEach((d) => console.warn(`  lcHandle "${d._id}" used by: ${d.emails.join(', ')}`));
  } else {
    console.log('No duplicate handles found. Safe to start the server.');
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

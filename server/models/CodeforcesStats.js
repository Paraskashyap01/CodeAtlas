import mongoose from "mongoose";

const cfSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  handle: String,

  userInfo: {
    type: Object,
    default: null,
  },

  ratingHistory: {
    type: Array,
    default: [],
  },

  currentRating: {
    type: Number,
    default: null,
  },

  solvedCount: {
    type: Number,
    default: 0,
  },

  difficultyDistribution: {
    type: Object,
    default: {},
  },

  topicStats: {
    type: Object,
    default: {},
  },

  weakTopics: {
    type: Array,
    default: [],
  },

  acceptedProblemsByTopic: {
    type: Object,
    default: {},
  },

  calendar: {
    type: Array,
    default: [],
  },

  recentSubmissions: {
    type: Array,
    default: [],
  },

  acceptedByWeek: {
    type: Object,
    default: {},
  },

  fetchedAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'cachedcfdatas' });

const CodeforcesStats = mongoose.model('CodeforcesStats', cfSchema);

export default CodeforcesStats;

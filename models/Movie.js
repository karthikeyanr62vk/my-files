const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    genre: {
      type: String,
      default: '',
      trim: true,
    },
    poster: {
      type: String,
      default: '',
      trim: true,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    trailerLink: {
      type: String,
      default: '',
      trim: true,
    },
    cast: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Movie', movieSchema);



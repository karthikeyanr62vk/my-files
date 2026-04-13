const mongoose = require('mongoose');

const { Schema } = mongoose;

const seatSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const showtimeSchema = new Schema(
  {
    movie: {
      type: Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },
    seatsAvailable: {
      type: Number,
      required: true,
      min: 0,
    },
    seats: {
      type: [seatSchema],
      default: [],
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    auditorium: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

showtimeSchema.index({ movie: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Showtime', showtimeSchema);



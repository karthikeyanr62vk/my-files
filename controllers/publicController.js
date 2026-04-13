const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const generateBookingCode = require('../utils/generateBookingCode');

const getMovies = async (req, res) => {
  const includeShowtimes = req.query.includeShowtimes === 'true';
  try {
    const movies = await Movie.find({ isActive: true }).sort({ createdAt: -1 }).lean();

    if (!includeShowtimes) {
      return res.json({ movies });
    }

    const movieIds = movies.map((movie) => movie._id);
    const showtimes = await Showtime.find({
      movie: { $in: movieIds },
      startTime: { $gte: new Date() },
    })
      .sort({ startTime: 1 })
      .lean();

    const showtimesByMovie = showtimes.reduce((acc, showtime) => {
      const key = showtime.movie.toString();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        _id: showtime._id,
        startTime: showtime.startTime,
        seatsAvailable: showtime.seatsAvailable,
        price: showtime.price,
        auditorium: showtime.auditorium,
      });
      return acc;
    }, {});

    const moviesWithShowtimes = movies.map((movie) => ({
      ...movie,
      showtimes: showtimesByMovie[movie._id.toString()] || [],
    }));

    return res.json({ movies: moviesWithShowtimes });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch movies', details: error.message });
  }
};

const getMovieDetails = async (req, res) => {
  const { movieId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(movieId)) {
    return res.status(400).json({ message: 'Invalid movie id' });
  }

  try {
    const movie = await Movie.findById(movieId).lean();
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const showtimes = await Showtime.find({
      movie: movieId,
      startTime: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // include recent showtimes
    })
      .sort({ startTime: 1 })
      .lean();

    return res.json({ movie, showtimes });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch movie details', details: error.message });
  }
};

const getShowtimeDetails = async (req, res) => {
  const { showtimeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
    return res.status(400).json({ message: 'Invalid showtime id' });
  }

  try {
    const showtime = await Showtime.findById(showtimeId).populate('movie').lean();
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    return res.json({ showtime });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch showtime information', details: error.message });
  }
};

const createBooking = async (req, res) => {
  const { movieId, showtimeId, seats, userName, userEmail } = req.body;

  if (!movieId || !showtimeId || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ message: 'Missing booking details' });
  }

  if (!userName || !userEmail) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  if (
    !mongoose.Types.ObjectId.isValid(movieId) ||
    !mongoose.Types.ObjectId.isValid(showtimeId)
  ) {
    return res.status(400).json({ message: 'Invalid identifiers provided' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const showtime = await Showtime.findById(showtimeId).session(session);
    if (!showtime) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Showtime not found' });
    }

    if (showtime.movie.toString() !== movieId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Showtime does not belong to the selected movie' });
    }

    const movie = await Movie.findById(movieId).session(session);
    if (!movie) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Movie not found' });
    }

    const unavailableSeats = [];
    const seatSet = new Set(seats);

    showtime.seats.forEach((seat) => {
      if (seatSet.has(seat.label) && !seat.isAvailable) {
        unavailableSeats.push(seat.label);
      }
    });

    if (unavailableSeats.length > 0) {
      await session.abortTransaction();
      return res
        .status(409)
        .json({ message: 'Some seats are no longer available', seats: unavailableSeats });
    }

    const updatedSeats = showtime.seats.map((seat) => {
      if (seatSet.has(seat.label)) {
        return { ...seat.toObject(), isAvailable: false };
      }
      return seat;
    });

    showtime.seats = updatedSeats;
    showtime.seatsAvailable = Math.max(showtime.seatsAvailable - seats.length, 0);

    const totalPrice = (showtime.price || 0) * seats.length;
    const bookingCode = generateBookingCode();

    const booking = new Booking({
      bookingCode,
      userName,
      userEmail,
      movie: movieId,
      showtime: showtimeId,
      seats,
      totalPrice,
    });

    await booking.save({ session });
    await showtime.save({ session });

    await session.commitTransaction();
    await booking.populate(['movie', 'showtime']);

    return res.status(201).json({ booking });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: 'Failed to create booking', details: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = {
  getMovies,
  getMovieDetails,
  getShowtimeDetails,
  createBooking,
};



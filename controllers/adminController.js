const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const { createSeatLayout, DEFAULT_ROW_LABELS, DEFAULT_SEATS_PER_ROW } = require('../utils/seatUtils');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.JWT_SECRET;

  if (!adminEmail || !passwordHash || !secret) {
    return res.status(500).json({
      message: 'Server misconfiguration: admin credentials not set. Contact the administrator.',
    });
  }

  if (email !== adminEmail) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ sub: adminEmail, role: 'admin' }, secret, { expiresIn: '12h' });
  return res.json({ token });
};

const getMovies = async (_req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 }).lean();
    return res.json({ movies });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch movies', details: error.message });
  }
};

const createMovie = async (req, res) => {
  try {
    const movie = await Movie.create(req.body);
    return res.status(201).json({ movie });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create movie', details: error.message });
  }
};

const updateMovie = async (req, res) => {
  const { movieId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(movieId)) {
    return res.status(400).json({ message: 'Invalid movie id' });
  }

  try {
    const movie = await Movie.findByIdAndUpdate(movieId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    return res.json({ movie });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update movie', details: error.message });
  }
};

const deleteMovie = async (req, res) => {
  const { movieId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(movieId)) {
    return res.status(400).json({ message: 'Invalid movie id' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const movie = await Movie.findById(movieId).session(session);
    if (!movie) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Movie not found' });
    }

    await Showtime.deleteMany({ movie: movieId }).session(session);
    await movie.deleteOne({ session });

    await session.commitTransaction();
    return res.json({ message: 'Movie and related showtimes deleted' });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: 'Failed to delete movie', details: error.message });
  } finally {
    session.endSession();
  }
};

const getShowtimes = async (_req, res) => {
  try {
    const showtimes = await Showtime.find()
      .populate('movie')
      .sort({ startTime: 1, createdAt: -1 })
      .lean();
    return res.json({ showtimes });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch showtimes', details: error.message });
  }
};

const createShowtime = async (req, res) => {
  const { movieId, startTime, price, rowLabels, seatsPerRow, auditorium } = req.body;

  if (!mongoose.Types.ObjectId.isValid(movieId)) {
    return res.status(400).json({ message: 'Invalid movie id' });
  }

  if (!startTime) {
    return res.status(400).json({ message: 'Start time is required' });
  }

  const parsedStart = new Date(startTime);
  if (Number.isNaN(parsedStart.getTime())) {
    return res.status(400).json({ message: 'Invalid start time value' });
  }

  try {
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const labels =
      Array.isArray(rowLabels) && rowLabels.length > 0 ? rowLabels : DEFAULT_ROW_LABELS;
    const seatsCount =
      Number.isInteger(seatsPerRow) && seatsPerRow > 0 ? seatsPerRow : DEFAULT_SEATS_PER_ROW;
    const numericPrice =
      typeof price === 'number'
        ? price
        : Number.isFinite(Number(price))
        ? Number(price)
        : 0;
    const seats = createSeatLayout(labels, seatsCount);

    const showtime = await Showtime.create({
      movie: movieId,
      startTime: parsedStart,
      price: numericPrice,
      seats,
      totalSeats: seats.length,
      seatsAvailable: seats.length,
      auditorium: auditorium || '',
    });

    return res.status(201).json({ showtime });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create showtime', details: error.message });
  }
};

const updateShowtime = async (req, res) => {
  const { showtimeId } = req.params;
  const { startTime, price, rowLabels, seatsPerRow, resetSeats, auditorium } = req.body;

  if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
    return res.status(400).json({ message: 'Invalid showtime id' });
  }

  try {
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    if (startTime) {
      const parsedStart = new Date(startTime);
      if (Number.isNaN(parsedStart.getTime())) {
        return res.status(400).json({ message: 'Invalid start time value' });
      }
      showtime.startTime = parsedStart;
    }
    if (typeof price !== 'undefined') {
      const numericPrice =
        typeof price === 'number'
          ? price
          : Number.isFinite(Number(price))
          ? Number(price)
          : showtime.price;
      showtime.price = numericPrice;
    }
    if (typeof auditorium === 'string') {
      showtime.auditorium = auditorium;
    }

    if (resetSeats) {
      const labels =
        Array.isArray(rowLabels) && rowLabels.length > 0 ? rowLabels : DEFAULT_ROW_LABELS;
      const seatsCount =
        Number.isInteger(seatsPerRow) && seatsPerRow > 0 ? seatsPerRow : DEFAULT_SEATS_PER_ROW;

      const seats = createSeatLayout(labels, seatsCount);
      showtime.seats = seats;
      showtime.totalSeats = seats.length;
      showtime.seatsAvailable = seats.length;
    }

    await showtime.save();
    return res.json({ showtime });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update showtime', details: error.message });
  }
};

const deleteShowtime = async (req, res) => {
  const { showtimeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
    return res.status(400).json({ message: 'Invalid showtime id' });
  }

  try {
    const showtime = await Showtime.findByIdAndDelete(showtimeId);
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    return res.json({ message: 'Showtime deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete showtime', details: error.message });
  }
};

const getBookings = async (_req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('movie')
      .populate('showtime')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ bookings });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch bookings', details: error.message });
  }
};

module.exports = {
  login,
  getMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  getShowtimes,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getBookings,
};


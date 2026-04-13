const express = require('express');
const {
  getMovies,
  getMovieDetails,
  getShowtimeDetails,
  createBooking,
} = require('../controllers/publicController');

const router = express.Router();

router.get('/movies', getMovies);
router.get('/movies/:movieId', getMovieDetails);
router.get('/showtimes/:showtimeId', getShowtimeDetails);
router.post('/bookings', createBooking);

module.exports = router;



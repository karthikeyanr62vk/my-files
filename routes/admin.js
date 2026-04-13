const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const {
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
} = require('../controllers/adminController');

const router = express.Router();

router.post('/login', login);

router.use(adminAuth);

router.get('/movies', getMovies);
router.post('/movies', createMovie);
router.put('/movies/:movieId', updateMovie);
router.delete('/movies/:movieId', deleteMovie);

router.get('/showtimes', getShowtimes);
router.post('/showtimes', createShowtime);
router.put('/showtimes/:showtimeId', updateShowtime);
router.delete('/showtimes/:showtimeId', deleteShowtime);

router.get('/bookings', getBookings);

module.exports = router;



import { fetchMovies, fetchShowtimeDetails, createBooking } from './api.js';
import {
  clearAlert,
  createElement,
  formatCurrency,
  formatDateTime,
  getQueryParam,
  setFooterYear,
  showAlert,
} from './utils.js';

const movieSelect = document.querySelector('#movie-select');
const showtimeSelect = document.querySelector('#showtime-select');
const seatGrid = document.querySelector('#seat-grid');
const showtimeMeta = document.querySelector('#showtime-meta');
const bookingForm = document.querySelector('#booking-form');
const bookingAlert = document.querySelector('#booking-alert');

const MOVIE_STORAGE_KEY = 'cinewave.movies';
const BOOKING_STORAGE_KEY = 'cinewave.booking';

const state = {
  movies: [],
  showtimesByMovie: new Map(),
  selectedMovieId: null,
  selectedShowtimeId: null,
  selectedSeats: new Set(),
  showtimeDetails: null,
};

const persistMovies = (movies) => {
  try {
    sessionStorage.setItem(MOVIE_STORAGE_KEY, JSON.stringify(movies));
  } catch (error) {
    // ignore persistence issues
  }
};

const loadPersistedMovies = () => {
  try {
    const data = sessionStorage.getItem(MOVIE_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
};

const renderShowtimeMeta = (showtime) => {
  if (!showtimeMeta) return;
  if (!showtime) {
    showtimeMeta.classList.add('hidden');
    showtimeMeta.innerHTML = '';
    return;
  }

  const price = showtime.price ? formatCurrency(showtime.price) : 'Standard pricing';
  showtimeMeta.classList.remove('hidden');
  showtimeMeta.innerHTML = `
    <div class="detail-card">
      <strong>${formatDateTime(showtime.startTime)}</strong>
      <p class="muted">
        ${showtime.auditorium || 'Auditorium TBD'} • ${price} • ${
    showtime.seatsAvailable
  } seats available
      </p>
    </div>
  `;
};

const renderSeatGrid = (showtime) => {
  seatGrid.innerHTML = '';
  state.selectedSeats.clear();

  if (!showtime || !Array.isArray(showtime.seats) || showtime.seats.length === 0) {
    seatGrid.innerHTML = '<p class="muted">Seat layout unavailable for this showtime.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  showtime.seats.forEach((seat) => {
    const button = createElement('button', 'seat', seat.label);
    button.type = 'button';
    button.dataset.seat = seat.label;

    if (!seat.isAvailable) {
      button.classList.add('unavailable');
      button.disabled = true;
    }

    button.addEventListener('click', () => {
      if (button.classList.contains('unavailable')) return;

      if (state.selectedSeats.has(seat.label)) {
        state.selectedSeats.delete(seat.label);
        button.classList.remove('selected');
      } else {
        state.selectedSeats.add(seat.label);
        button.classList.add('selected');
      }
    });

    fragment.appendChild(button);
  });

  seatGrid.appendChild(fragment);
};

const populateShowtimes = (movieId) => {
  const showtimes = state.showtimesByMovie.get(movieId) || [];
  showtimeSelect.innerHTML = '';

  if (showtimes.length === 0) {
    showtimeSelect.disabled = true;
    showtimeSelect.innerHTML = '<option value="">No upcoming showtimes</option>';
    renderSeatGrid(null);
    renderShowtimeMeta(null);
    return;
  }

  showtimeSelect.disabled = false;
  showtimeSelect.innerHTML = showtimes
    .map(
      (show) =>
        `<option value="${show._id}">
          ${formatDateTime(show.startTime)} • ${show.seatsAvailable} seats left
        </option>`
    )
    .join('');
};

const handleMovieChange = () => {
  const movieId = movieSelect.value;
  state.selectedMovieId = movieId;
  state.selectedShowtimeId = null;
  state.showtimeDetails = null;

  populateShowtimes(movieId);

  const defaultShowtime = showtimeSelect.value;
  if (defaultShowtime) {
    showtimeSelect.dispatchEvent(new Event('change'));
  } else {
    renderSeatGrid(null);
    renderShowtimeMeta(null);
  }
};

const handleShowtimeChange = async () => {
  const showtimeId = showtimeSelect.value;
  state.selectedShowtimeId = showtimeId || null;

  if (!showtimeId) {
    renderSeatGrid(null);
    renderShowtimeMeta(null);
    return;
  }

  seatGrid.innerHTML = '<p class="badge">Loading seats...</p>';

  try {
    const { showtime } = await fetchShowtimeDetails(showtimeId);
    state.showtimeDetails = showtime;
    renderShowtimeMeta(showtime);
    renderSeatGrid(showtime);
  } catch (error) {
    renderSeatGrid(null);
    renderShowtimeMeta(null);
    showAlert(
      bookingAlert,
      error.message || 'Could not load seat availability for this showtime.',
      'error'
    );
  }
};

const preloadSelections = () => {
  const presetMovie = getQueryParam('movieId');
  const presetShowtime = getQueryParam('showtimeId');

  if (presetMovie && state.showtimesByMovie.has(presetMovie)) {
    movieSelect.value = presetMovie;
    movieSelect.dispatchEvent(new Event('change'));

    if (presetShowtime) {
      showtimeSelect.value = presetShowtime;
      showtimeSelect.dispatchEvent(new Event('change'));
    }
  }
};

const initDropdowns = async () => {
  let moviesData = loadPersistedMovies();

  if (!moviesData) {
    const response = await fetchMovies(true);
    moviesData = response.movies;
    persistMovies(moviesData);
  }

  state.movies = moviesData;
  state.showtimesByMovie.clear();

  movieSelect.innerHTML = moviesData
    .map((movie) => `<option value="${movie._id}">${movie.title}</option>`)
    .join('');

  moviesData.forEach((movie) => {
    state.showtimesByMovie.set(movie._id, movie.showtimes || []);
  });

  handleMovieChange();
  preloadSelections();
};

const handleBookingSubmit = async (event) => {
  event.preventDefault();
  clearAlert(bookingAlert);

  if (!state.selectedMovieId || !state.selectedShowtimeId) {
    showAlert(bookingAlert, 'Please choose a movie and showtime.', 'error');
    return;
  }

  if (state.selectedSeats.size === 0) {
    showAlert(bookingAlert, 'Select at least one seat to proceed.', 'error');
    return;
  }

  const formData = new FormData(bookingForm);
  const payload = {
    movieId: state.selectedMovieId,
    showtimeId: state.selectedShowtimeId,
    seats: Array.from(state.selectedSeats),
    userName: formData.get('userName'),
    userEmail: formData.get('userEmail'),
  };

  if (!payload.userName || !payload.userEmail) {
    showAlert(bookingAlert, 'Name and email are required.', 'error');
    return;
  }

  try {
    const { booking } = await createBooking(payload);
    sessionStorage.setItem(
      BOOKING_STORAGE_KEY,
      JSON.stringify({
        bookingCode: booking.bookingCode,
        seats: booking.seats,
        movie: booking.movie?.title || '',
        movieId: booking.movie?._id || payload.movieId,
        showtimeId: booking.showtime?._id || payload.showtimeId,
        showtime: booking.showtime?.startTime || state.showtimeDetails?.startTime,
        auditorium: booking.showtime?.auditorium || state.showtimeDetails?.auditorium,
        totalPrice: booking.totalPrice,
        userName: booking.userName,
        userEmail: booking.userEmail,
      })
    );

    window.location.href = 'confirm.html';
  } catch (error) {
    showAlert(bookingAlert, error.message || 'Booking failed. Please try again.', 'error');
  }
};

const init = async () => {
  setFooterYear();

  if (!movieSelect || !showtimeSelect || !seatGrid) return;

  movieSelect.addEventListener('change', handleMovieChange);
  showtimeSelect.addEventListener('change', handleShowtimeChange);
  bookingForm.addEventListener('submit', handleBookingSubmit);

  try {
    await initDropdowns();
  } catch (error) {
    showAlert(
      bookingAlert,
      error.message || 'Unable to load movies at the moment. Please retry shortly.',
      'error'
    );
    movieSelect.disabled = true;
    showtimeSelect.disabled = true;
  }
};

init();



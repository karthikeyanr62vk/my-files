import {
  adminLogin,
  adminFetchMovies,
  adminCreateMovie,
  adminUpdateMovie,
  adminDeleteMovie,
  adminFetchShowtimes,
  adminCreateShowtime,
  adminUpdateShowtime,
  adminDeleteShowtime,
  adminFetchBookings,
} from './api.js';
import {
  clearAlert,
  formatCurrency,
  formatDateTime,
  serializeForm,
  setFooterYear,
  showAlert,
} from './utils.js';

const TOKEN_STORAGE_KEY = 'cinewave.adminToken';

const loginCard = document.querySelector('#login-card');
const loginForm = document.querySelector('#login-form');
const loginAlert = document.querySelector('#login-alert');

const dashboard = document.querySelector('#dashboard');
const movieForm = document.querySelector('#movie-form');
const movieResetButton = document.querySelector('#movie-reset');
const movieAlert = document.querySelector('#movie-alert');
const movieTableBody = document.querySelector('#movie-table tbody');

const showtimeForm = document.querySelector('#showtime-form');
const showtimeResetButton = document.querySelector('#showtime-reset');
const showtimeAlert = document.querySelector('#showtime-alert');
const showtimeTableBody = document.querySelector('#showtime-table tbody');

const bookingTableBody = document.querySelector('#booking-table tbody');

const showtimeMovieSelect = document.querySelector('#showtime-movie');

const state = {
  token: null,
  movies: [],
  showtimes: [],
  bookings: [],
  editingMovieId: null,
  editingShowtimeId: null,
};

const loadStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

const storeToken = (token) => {
  state.token = token;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

const ensureToken = () => {
  if (!state.token) {
    throw new Error('Missing admin token');
  }
  return state.token;
};

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const parseCast = (value) =>
  value
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

const refreshMoviesSelect = () => {
  showtimeMovieSelect.innerHTML = state.movies
    .map((movie) => `<option value="${movie._id}">${movie.title}</option>`)
    .join('');
};

const renderMovies = () => {
  refreshMoviesSelect();

  if (state.movies.length === 0) {
    movieTableBody.innerHTML = `
      <tr><td colspan="5">No movies available yet.</td></tr>
    `;
    return;
  }

  movieTableBody.innerHTML = state.movies
    .map(
      (movie) => `
      <tr>
        <td>${movie.title}</td>
        <td>${movie.genre || '—'}</td>
        <td>${movie.duration ? `${movie.duration} min` : '—'}</td>
        <td>${movie.isActive ? '<span class="tag">Active</span>' : '<span class="tag">Hidden</span>'}</td>
        <td class="table-actions">
          <button class="btn btn-outline" data-action="edit-movie" data-id="${movie._id}">Edit</button>
          <button class="btn btn-primary" data-action="delete-movie" data-id="${movie._id}">Delete</button>
        </td>
      </tr>
    `
    )
    .join('');
};

const renderShowtimes = () => {
  if (state.showtimes.length === 0) {
    showtimeTableBody.innerHTML = `
      <tr><td colspan="5">No showtimes scheduled.</td></tr>
    `;
    return;
  }

  showtimeTableBody.innerHTML = state.showtimes
    .map(
      (show) => `
      <tr>
        <td>${show.movie?.title || '—'}</td>
        <td>${formatDateTime(show.startTime)}</td>
        <td>${show.seatsAvailable}/${show.totalSeats}</td>
        <td>${formatCurrency(show.price || 0)}</td>
        <td class="table-actions">
          <button class="btn btn-outline" data-action="edit-showtime" data-id="${show._id}">Edit</button>
          <button class="btn btn-primary" data-action="delete-showtime" data-id="${show._id}">Delete</button>
        </td>
      </tr>
    `
    )
    .join('');
};

const renderBookings = () => {
  if (state.bookings.length === 0) {
    bookingTableBody.innerHTML = `
      <tr><td colspan="6">No bookings yet.</td></tr>
    `;
    return;
  }

  bookingTableBody.innerHTML = state.bookings
    .map(
      (booking) => `
      <tr>
        <td>${booking.bookingCode}</td>
        <td>${booking.userName}<br/><small>${booking.userEmail}</small></td>
        <td>${booking.movie?.title || '—'}</td>
        <td>${formatDateTime(booking.showtime?.startTime)}</td>
        <td>${(booking.seats || []).join(', ')}</td>
        <td>${formatCurrency(booking.totalPrice || 0)}</td>
      </tr>
    `
    )
    .join('');
};

const fetchDashboardData = async () => {
  const token = ensureToken();
  const [moviesRes, showtimesRes, bookingsRes] = await Promise.all([
    adminFetchMovies(token),
    adminFetchShowtimes(token),
    adminFetchBookings(token),
  ]);

  state.movies = moviesRes.movies || [];
  state.showtimes = showtimesRes.showtimes || [];
  state.bookings = bookingsRes.bookings || [];

  renderMovies();
  renderShowtimes();
  renderBookings();
};

const toggleDashboard = (visible) => {
  if (visible) {
    loginCard.classList.add('hidden');
    dashboard.classList.remove('hidden');
  } else {
    loginCard.classList.remove('hidden');
    dashboard.classList.add('hidden');
  }
};

const handleLoginSubmit = async (event) => {
  event.preventDefault();
  clearAlert(loginAlert);

  const { email, password } = serializeForm(loginForm);
  if (!email || !password) {
    showAlert(loginAlert, 'Email and password are required.', 'error');
    return;
  }

  try {
    const { token } = await adminLogin({ email, password });
    storeToken(token);
    toggleDashboard(true);
    await fetchDashboardData();
    showAlert(movieAlert, 'Logged in successfully.', 'success');
  } catch (error) {
    showAlert(loginAlert, error.message || 'Login failed.', 'error');
  }
};

const resetMovieForm = () => {
  state.editingMovieId = null;
  movieForm.reset();
  movieForm.querySelector('#movie-id').value = '';
  movieResetButton.textContent = 'Clear';
};

const handleMovieSubmit = async (event) => {
  event.preventDefault();
  clearAlert(movieAlert);

  const token = ensureToken();
  const formData = serializeForm(movieForm);
  const movieData = {
    title: formData['movie-title'],
    genre: formData['movie-genre'],
    duration: formData['movie-duration'] ? Number(formData['movie-duration']) : undefined,
    poster: formData['movie-poster'],
    trailerLink: formData['movie-trailer'],
    cast: formData['movie-cast'] ? parseCast(formData['movie-cast']) : [],
    description: formData['movie-description'],
    rating: formData['movie-rating'] ? Number(formData['movie-rating']) : undefined,
  };

  try {
    if (state.editingMovieId) {
      await adminUpdateMovie(state.editingMovieId, movieData, token);
      showAlert(movieAlert, 'Movie updated successfully.', 'success');
    } else {
      await adminCreateMovie(movieData, token);
      showAlert(movieAlert, 'Movie created successfully.', 'success');
    }

    resetMovieForm();
    await fetchDashboardData();
  } catch (error) {
    showAlert(movieAlert, error.message || 'Failed to save movie.', 'error');
  }
};

const handleMovieAction = async (event) => {
  const action = event.target.dataset.action;
  const movieId = event.target.dataset.id;
  if (!action || !movieId) return;

  if (action === 'edit-movie') {
    const movie = state.movies.find((item) => item._id === movieId);
    if (!movie) return;
    state.editingMovieId = movieId;
    movieForm.querySelector('#movie-title').value = movie.title || '';
    movieForm.querySelector('#movie-genre').value = movie.genre || '';
    movieForm.querySelector('#movie-duration').value = movie.duration || '';
    movieForm.querySelector('#movie-poster').value = movie.poster || '';
    movieForm.querySelector('#movie-trailer').value = movie.trailerLink || '';
    movieForm.querySelector('#movie-cast').value = (movie.cast || []).join(', ');
    movieForm.querySelector('#movie-description').value = movie.description || '';
    movieForm.querySelector('#movie-rating').value = movie.rating ?? '';
    movieResetButton.textContent = 'Cancel edit';
    return;
  }

  if (action === 'delete-movie') {
    const confirmed = window.confirm('Delete this movie and its showtimes?');
    if (!confirmed) return;

    try {
      await adminDeleteMovie(movieId, ensureToken());
      showAlert(movieAlert, 'Movie deleted.', 'success');
      await fetchDashboardData();
    } catch (error) {
      showAlert(movieAlert, error.message || 'Failed to delete movie.', 'error');
    }
  }
};

const resetShowtimeForm = () => {
  state.editingShowtimeId = null;
  showtimeForm.reset();
  showtimeResetButton.textContent = 'Clear';
};

const handleShowtimeSubmit = async (event) => {
  event.preventDefault();
  clearAlert(showtimeAlert);

  const token = ensureToken();
  const formData = serializeForm(showtimeForm);
  const payload = {
    movieId: formData['showtime-movie'],
    startTime: formData['showtime-start'],
    price: formData['showtime-price'] ? Number(formData['showtime-price']) : undefined,
    auditorium: formData['showtime-auditorium'],
  };

  if (formData['showtime-reset-seats']) {
    payload.resetSeats = true;
    payload.rowLabels = formData['showtime-rows']
      ? formData['showtime-rows'].split(',').map((row) => row.trim()).filter(Boolean)
      : undefined;
    payload.seatsPerRow = formData['showtime-seats-per-row']
      ? Number(formData['showtime-seats-per-row'])
      : undefined;
  }

  try {
    if (state.editingShowtimeId) {
      await adminUpdateShowtime(state.editingShowtimeId, payload, token);
      showAlert(showtimeAlert, 'Showtime updated.', 'success');
    } else {
      await adminCreateShowtime(payload, token);
      showAlert(showtimeAlert, 'Showtime created.', 'success');
    }

    resetShowtimeForm();
    await fetchDashboardData();
  } catch (error) {
    showAlert(showtimeAlert, error.message || 'Failed to save showtime.', 'error');
  }
};

const handleShowtimeAction = async (event) => {
  const action = event.target.dataset.action;
  const showtimeId = event.target.dataset.id;
  if (!action || !showtimeId) return;

  if (action === 'edit-showtime') {
    const showtime = state.showtimes.find((item) => item._id === showtimeId);
    if (!showtime) return;
    state.editingShowtimeId = showtimeId;

    showtimeMovieSelect.value = showtime.movie?._id || showtime.movie;
    showtimeForm.querySelector('#showtime-start').value = toDateTimeLocal(showtime.startTime);
    showtimeForm.querySelector('#showtime-price').value = showtime.price ?? '';
    showtimeForm.querySelector('#showtime-auditorium').value = showtime.auditorium || '';
    showtimeForm.querySelector('#showtime-reset-seats').checked = false;
    showtimeForm.querySelector('#showtime-rows').value = '';
    showtimeForm.querySelector('#showtime-seats-per-row').value = '';
    showtimeResetButton.textContent = 'Cancel edit';
    return;
  }

  if (action === 'delete-showtime') {
    const confirmed = window.confirm('Delete this showtime? This cannot be undone.');
    if (!confirmed) return;

    try {
      await adminDeleteShowtime(showtimeId, ensureToken());
      showAlert(showtimeAlert, 'Showtime deleted.', 'success');
      await fetchDashboardData();
    } catch (error) {
      showAlert(showtimeAlert, error.message || 'Failed to delete showtime.', 'error');
    }
  }
};

const attachEventListeners = () => {
  loginForm.addEventListener('submit', handleLoginSubmit);
  movieForm.addEventListener('submit', handleMovieSubmit);
  movieTableBody.addEventListener('click', handleMovieAction);
  movieResetButton.addEventListener('click', (event) => {
    event.preventDefault();
    resetMovieForm();
  });

  showtimeForm.addEventListener('submit', handleShowtimeSubmit);
  showtimeTableBody.addEventListener('click', handleShowtimeAction);
  showtimeResetButton.addEventListener('click', (event) => {
    event.preventDefault();
    resetShowtimeForm();
  });
};

const bootstrap = async () => {
  setFooterYear();
  attachEventListeners();

  const storedToken = loadStoredToken();
  if (!storedToken) {
    toggleDashboard(false);
    return;
  }

  storeToken(storedToken);
  try {
    await fetchDashboardData();
    toggleDashboard(true);
  } catch (error) {
    storeToken(null);
    toggleDashboard(false);
  }
};

bootstrap();



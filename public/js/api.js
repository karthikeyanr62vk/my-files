const API_BASE = '/api';

const isJson = (value) => value && typeof value === 'object' && !(value instanceof FormData);

export const request = async (path, options = {}) => {
  const { token, ...rest } = options;

  const config = {
    headers: {
      Accept: 'application/json',
    },
    ...rest,
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (isJson(config.body)) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${path}`, config);
  let payload;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || 'Unexpected server error';
    const details = payload?.details;
    const error = new Error(message);
    error.status = response.status;
    error.details = details;
    throw error;
  }

  return payload;
};

export const fetchMovies = (includeShowtimes = true) =>
  request(`/movies?includeShowtimes=${includeShowtimes}`);

export const fetchMovieDetails = (movieId) => request(`/movies/${movieId}`);

export const fetchShowtimeDetails = (showtimeId) => request(`/showtimes/${showtimeId}`);

export const createBooking = (payload) =>
  request('/bookings', { method: 'POST', body: payload });

// Admin endpoints
export const adminLogin = (credentials) =>
  request('/admin/login', { method: 'POST', body: credentials });

export const adminFetchMovies = (token) => request('/admin/movies', { token });

export const adminCreateMovie = (data, token) =>
  request('/admin/movies', { method: 'POST', body: data, token });

export const adminUpdateMovie = (movieId, data, token) =>
  request(`/admin/movies/${movieId}`, { method: 'PUT', body: data, token });

export const adminDeleteMovie = (movieId, token) =>
  request(`/admin/movies/${movieId}`, { method: 'DELETE', token });

export const adminFetchShowtimes = (token) => request('/admin/showtimes', { token });

export const adminCreateShowtime = (data, token) =>
  request('/admin/showtimes', { method: 'POST', body: data, token });

export const adminUpdateShowtime = (showtimeId, data, token) =>
  request(`/admin/showtimes/${showtimeId}`, { method: 'PUT', body: data, token });

export const adminDeleteShowtime = (showtimeId, token) =>
  request(`/admin/showtimes/${showtimeId}`, { method: 'DELETE', token });

export const adminFetchBookings = (token) => request('/admin/bookings', { token });



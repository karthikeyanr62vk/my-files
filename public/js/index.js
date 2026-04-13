import { fetchMovies } from './api.js';
import { formatDateTime, setFooterYear, createElement } from './utils.js';

const moviesGrid = document.querySelector('#movies-grid');

const renderEmptyState = (message) => {
  moviesGrid.innerHTML = `
    <div class="info-section">
      <h3>${message}</h3>
      <p>Please check back later or explore other pages.</p>
    </div>
  `;
};

const renderMovieCard = (movie) => {
  const card = createElement('article', 'card');

  const poster = movie.poster
    ? `<img src="${movie.poster}" alt="${movie.title} poster" loading="lazy" />`
    : '<div class="badge">Poster coming soon</div>';

  const showtimesMarkup =
    movie.showtimes && movie.showtimes.length > 0
      ? movie.showtimes
          .slice(0, 4)
          .map(
            (show) => `
          <span class="showtime-item">
            ${formatDateTime(show.startTime, { hour: 'numeric', minute: '2-digit' })}
          </span>
        `
          )
          .join('')
      : '<span class="muted">No upcoming showtimes</span>';

  const ratingText =
    typeof movie.rating === 'number'
      ? movie.rating.toFixed(1)
      : movie.rating
      ? movie.rating
      : null;

  const description = movie.description
    ? movie.description.slice(0, 120).concat(movie.description.length > 120 ? '…' : '')
    : 'Synopsis coming soon.';

  card.innerHTML = `
    ${poster}
    <div class="card-content">
      <h3 class="card-title">${movie.title}</h3>
      <div class="detail-meta">
        ${movie.genre ? `<span>${movie.genre}</span>` : ''}
        ${movie.duration ? `<span>${movie.duration} min</span>` : ''}
        ${ratingText ? `<span>Rated ${ratingText}/10</span>` : ''}
      </div>
      <p>${description}</p>
      <div class="showtimes-list">${showtimesMarkup}</div>
      <div class="card-actions">
        <a class="btn btn-primary" href="booking.html?movieId=${movie._id}">Book Now</a>
        <a class="btn btn-outline" href="movie.html?movieId=${movie._id}">View Details</a>
      </div>
    </div>
  `;

  return card;
};

const init = async () => {
  setFooterYear();

  if (!moviesGrid) return;

  moviesGrid.innerHTML = '<p class="badge">Loading movies...</p>';

  try {
    const { movies } = await fetchMovies(true);
    if (!movies || movies.length === 0) {
      renderEmptyState('No movies are currently scheduled.');
      return;
    }

    const fragment = document.createDocumentFragment();
    movies.forEach((movie) => fragment.appendChild(renderMovieCard(movie)));
    moviesGrid.innerHTML = '';
    moviesGrid.appendChild(fragment);
  } catch (error) {
    renderEmptyState(error.message || 'Failed to load movies.');
  }
};

init();


import { fetchMovieDetails } from './api.js';
import { createElement, formatCurrency, formatDateTime, getQueryParam, setFooterYear } from './utils.js';

const container = document.querySelector('#movie-details');

const renderError = (message) => {
  container.innerHTML = `
    <div class="detail-card">
      <h2>Movie unavailable</h2>
      <p>${message}</p>
      <a class="btn btn-primary mt-3" href="index.html#movies">Back to movies</a>
    </div>
  `;
};

const renderMovie = ({ movie, showtimes }) => {
  const fragment = document.createDocumentFragment();

  const posterCard = createElement('article', 'detail-card');
  posterCard.innerHTML = movie.poster
    ? `<img src="${movie.poster}" alt="${movie.title} poster" />`
    : '<div class="badge">Poster coming soon</div>';
  fragment.appendChild(posterCard);

  const infoCard = createElement('article', 'detail-card');
  infoCard.innerHTML = `
    <h2>${movie.title}</h2>
    <div class="detail-meta">
      ${movie.genre ? `<span>${movie.genre}</span>` : ''}
      ${movie.duration ? `<span>${movie.duration} min</span>` : ''}
      ${
        typeof movie.rating === 'number'
          ? `<span>${movie.rating.toFixed(1)}/10 rating</span>`
          : movie.rating
          ? `<span>${movie.rating}</span>`
          : ''
      }
    </div>
    <p>${movie.description || 'Synopsis coming soon.'}</p>
    ${
      movie.cast && movie.cast.length
        ? `<div>
            <h3>Cast</h3>
            <ul class="cast-list">
              ${movie.cast.map((actor) => `<li>${actor}</li>`).join('')}
            </ul>
          </div>`
        : ''
    }
    ${
      movie.trailerLink
        ? `<p><a class="trailer-link" href="${movie.trailerLink}" target="_blank" rel="noopener">Watch trailer</a></p>`
        : ''
    }
  `;

  if (showtimes && showtimes.length > 0) {
    const showtimeGrid = createElement('div', 'showtime-grid mt-3');
    showtimeGrid.innerHTML = showtimes
      .map(
        (show) => `
        <div class="showtime-card">
          <div class="showtime-info">
            <span>${formatDateTime(show.startTime)}</span>
            <small>${show.auditorium || 'Auditorium TBD'}</small>
            <small>${show.seatsAvailable} seats left</small>
          </div>
          <div class="card-actions">
            ${
              show.price
                ? `<span class="tag">${formatCurrency(show.price)}</span>`
                : '<span class="tag">Standard pricing</span>'
            }
            <a class="btn btn-primary" href="booking.html?movieId=${movie._id}&showtimeId=${show._id}">
              Book
            </a>
          </div>
        </div>
      `
      )
      .join('');
    infoCard.append(showtimeGrid);
  } else {
    infoCard.append(
      createElement(
        'p',
        'muted',
        'No upcoming showtimes at the moment. Check back again soon or contact the cinema.'
      )
    );
  }

  fragment.appendChild(infoCard);
  container.innerHTML = '';
  container.appendChild(fragment);
};

const init = async () => {
  setFooterYear();

  if (!container) return;

  const movieId = getQueryParam('movieId');
  if (!movieId) {
    renderError('Movie identifier missing. Please revisit the movies page and select a title.');
    return;
  }

  container.innerHTML = '<div class="detail-card"><p class="badge">Fetching movie...</p></div>';

  try {
    const data = await fetchMovieDetails(movieId);
    renderMovie(data);
  } catch (error) {
    renderError(error.message || 'Unable to load this movie right now.');
  }
};

init();


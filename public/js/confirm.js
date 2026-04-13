import { formatCurrency, formatDateTime, setFooterYear } from './utils.js';

const BOOKING_STORAGE_KEY = 'cinewave.booking';

const confirmationCard = document.querySelector('#confirmation-card');
const confirmationList = document.querySelector('#confirmation-list');
const emptyState = document.querySelector('#empty-state');

const loadBooking = () => {
  try {
    const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const renderConfirmation = (booking) => {
  if (!booking) {
    confirmationCard.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  confirmationCard.classList.remove('hidden');
  emptyState.classList.add('hidden');

  const items = [
    { label: 'Booking ID', value: booking.bookingCode },
    { label: 'Movie', value: booking.movie },
    { label: 'Showtime', value: formatDateTime(booking.showtime) },
    { label: 'Auditorium', value: booking.auditorium || 'TBD' },
    { label: 'Seats', value: (booking.seats || []).join(', ') },
    { label: 'Booked For', value: booking.userName },
    { label: 'Email', value: booking.userEmail },
    { label: 'Total', value: formatCurrency(booking.totalPrice || 0) },
  ];

  confirmationList.innerHTML = items
    .filter((item) => item.value)
    .map(
      (item) => `
      <li>
        <span>${item.label}</span>
        <span>${item.value}</span>
      </li>
    `
    )
    .join('');
};

const init = () => {
  setFooterYear();
  const booking = loadBooking();
  renderConfirmation(booking);
  sessionStorage.removeItem(BOOKING_STORAGE_KEY);
};

init();



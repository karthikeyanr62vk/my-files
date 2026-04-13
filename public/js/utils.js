export const formatDateTime = (value, options = {}) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
};

export const formatDate = (value, options = {}) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...options,
  });
};

export const formatTime = (value, options = {}) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', ...options });
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(Number.isFinite(Number(amount)) ? Number(amount) : 0);

export const getQueryParam = (param) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
};

export const setFooterYear = () => {
  const year = new Date().getFullYear();
  document.querySelectorAll('#footer-year').forEach((node) => {
    // eslint-disable-next-line no-param-reassign
    node.textContent = year;
  });
};

export const showAlert = (element, message, variant = 'success') => {
  if (!element) return;
  element.classList.remove('alert-success', 'alert-error');
  element.classList.add('alert', `alert-${variant}`, 'show');
  element.textContent = message;
};

export const clearAlert = (element) => {
  if (!element) return;
  element.classList.remove('show', 'alert-success', 'alert-error');
  element.textContent = '';
};

export const createElement = (tag, className, content) => {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (content) {
    el.innerHTML = content;
  }
  return el;
};

export const groupSeatsByRow = (seats = []) => {
  const grouped = seats.reduce((acc, seat) => {
    const row = seat.label.charAt(0);
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  return Object.entries(grouped).map(([row, seatList]) => ({
    row,
    seats: seatList.sort((a, b) => {
      const numA = Number(a.label.slice(1));
      const numB = Number(b.label.slice(1));
      return numA - numB;
    }),
  }));
};

export const serializeForm = (form) => {
  const formData = new FormData(form);
  return Array.from(formData.entries()).reduce((acc, [key, value]) => {
    // eslint-disable-next-line no-param-reassign
    acc[key] = value;
    return acc;
  }, {});
};



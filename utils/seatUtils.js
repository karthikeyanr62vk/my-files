const DEFAULT_ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const DEFAULT_SEATS_PER_ROW = 8;

const createSeatLayout = (rowLabels = DEFAULT_ROW_LABELS, seatsPerRow = DEFAULT_SEATS_PER_ROW) => {
  const seats = [];
  rowLabels.forEach((row) => {
    for (let i = 1; i <= seatsPerRow; i += 1) {
      seats.push({
        label: `${row}${i}`,
        isAvailable: true,
      });
    }
  });

  return seats;
};

module.exports = {
  createSeatLayout,
  DEFAULT_ROW_LABELS,
  DEFAULT_SEATS_PER_ROW,
};



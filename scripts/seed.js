/* eslint-disable no-console */
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');
const { createSeatLayout } = require('../utils/seatUtils');

const sampleMovies = [
  {
    title: 'The Galactic Odyssey',
    description:
      'A group of explorers venture into deep space to uncover the mysteries of a distant galaxy.',
    genre: 'Sci-Fi',
    poster:
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80',
    duration: 138,
    trailerLink: 'https://www.youtube.com/watch?v=example1',
    cast: ['Elena Rodriguez', 'Kai Nakamura', 'Sasha Patel'],
    rating: 8.5,
  },
  {
    title: 'City Lights Again',
    description:
      'A heartfelt story about rediscovering love and ambition in a bustling metropolis.',
    genre: 'Romance/Drama',
    poster:
      'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=600&q=80',
    duration: 112,
    trailerLink: 'https://www.youtube.com/watch?v=example2',
    cast: ['Miles Carter', 'Priya Desai', 'Lucas Shaw'],
    rating: 7.9,
  },
  {
    title: 'Legends of the Valley',
    description: 'An animated adventure where mythical creatures band together to save their realm.',
    genre: 'Animation/Fantasy',
    poster:
      'https://images.unsplash.com/photo-1485841890310-6a055c88698a?auto=format&fit=crop&w=600&q=80',
    duration: 101,
    trailerLink: 'https://www.youtube.com/watch?v=example3',
    cast: ['Ava Kim', 'Noah Bennett', 'Zuri Johnson'],
    rating: 8.2,
  },
];

const sampleShowtimes = [
  {
    movieTitle: 'The Galactic Odyssey',
    startTimes: [
      { dateOffset: 0, hour: 14, minute: 0 },
      { dateOffset: 0, hour: 19, minute: 30 },
      { dateOffset: 1, hour: 16, minute: 15 },
    ],
    price: 14.5,
  },
  {
    movieTitle: 'City Lights Again',
    startTimes: [
      { dateOffset: 0, hour: 18, minute: 0 },
      { dateOffset: 1, hour: 20, minute: 30 },
      { dateOffset: 2, hour: 17, minute: 0 },
    ],
    price: 12,
  },
  {
    movieTitle: 'Legends of the Valley',
    startTimes: [
      { dateOffset: 0, hour: 11, minute: 30 },
      { dateOffset: 1, hour: 13, minute: 45 },
      { dateOffset: 2, hour: 15, minute: 15 },
    ],
    price: 10.5,
  },
];

const run = async () => {
  try {
    await connectDB(process.env.MONGODB_URI);

    await Showtime.deleteMany({});
    await Movie.deleteMany({});

    const createdMovies = await Movie.insertMany(sampleMovies);
    const seats = createSeatLayout();
    const totalSeats = seats.length;

    const showtimeDocs = sampleShowtimes.flatMap((entry) => {
      const movie = createdMovies.find((m) => m.title === entry.movieTitle);
      if (!movie) {
        return [];
      }

      return entry.startTimes.map(({ dateOffset, hour, minute }) => {
        const startTime = new Date();
        startTime.setDate(startTime.getDate() + dateOffset);
        startTime.setHours(hour, minute, 0, 0);

        return {
          movie: movie._id,
          startTime,
          totalSeats,
          seatsAvailable: totalSeats,
          seats: seats.map((seat) => ({ ...seat })),
          price: entry.price,
          auditorium: `Screen ${Math.ceil(Math.random() * 5)}`,
        };
      });
    });

    await Showtime.insertMany(showtimeDocs);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();


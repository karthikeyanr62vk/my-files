const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const app = require('../server');
const connectDB = require('../config/db');
const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const { createSeatLayout } = require('../utils/seatUtils');

let mongoServer;

const seedDatabase = async () => {
  const movie = await Movie.create({
    title: 'Test Movie',
    description: 'A thrilling test adventure.',
    genre: 'Action',
    duration: 120,
    poster: 'https://example.com/poster.jpg',
    rating: 8.2,
  });

  const seats = createSeatLayout();
  const showtime = await Showtime.create({
    movie: movie._id,
    startTime: new Date(Date.now() + 60 * 60 * 1000),
    price: 15,
    seats,
    totalSeats: seats.length,
    seatsAvailable: seats.length,
    auditorium: 'Screen 1',
  });

  return { movie, showtime };
};

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({
    replSet: { storageEngine: 'wiredTiger' },
  });
  const uri = mongoServer.getUri();
  await connectDB(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Promise.all([Booking.deleteMany({}), Showtime.deleteMany({}), Movie.deleteMany({})]);
});

describe('Public API', () => {
  test('GET /api/health responds with ok status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('GET /api/movies lists available movies with showtimes', async () => {
    const { movie } = await seedDatabase();
    const response = await request(app).get('/api/movies?includeShowtimes=true');
    expect(response.status).toBe(200);
    expect(response.body.movies).toHaveLength(1);
    expect(response.body.movies[0]._id).toBe(movie.id);
    expect(response.body.movies[0].showtimes.length).toBeGreaterThan(0);
  });

  test('POST /api/bookings creates a booking and updates availability', async () => {
    const { movie, showtime } = await seedDatabase();

    const bookingPayload = {
      movieId: movie.id,
      showtimeId: showtime.id,
      seats: ['A1', 'A2'],
      userName: 'Jane Doe',
      userEmail: 'jane@example.com',
    };

    const bookingResponse = await request(app).post('/api/bookings').send(bookingPayload);
    expect(bookingResponse.status).toBe(201);
    expect(bookingResponse.body.booking.bookingCode).toBeDefined();
    expect(bookingResponse.body.booking.seats).toEqual(bookingPayload.seats);

    const updatedShowtime = await Showtime.findById(showtime.id);
    expect(updatedShowtime.seatsAvailable).toBe(showtime.totalSeats - bookingPayload.seats.length);
    const unavailableSeats = updatedShowtime.seats
      .filter((seat) => bookingPayload.seats.includes(seat.label))
      .every((seat) => seat.isAvailable === false);
    expect(unavailableSeats).toBe(true);
  });
});

describe('Admin API', () => {
  const login = async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send({ email: process.env.ADMIN_EMAIL, password: 'password123' });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    return response.body.token;
  };

  test('POST /api/admin/login authenticates admin user', async () => {
    await login();
  });

  test('GET /api/admin/movies returns movies for authenticated admin', async () => {
    await seedDatabase();
    const token = await login();
    const response = await request(app)
      .get('/api/admin/movies')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.movies.length).toBeGreaterThan(0);
  });
});


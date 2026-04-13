# MongoDB Setup Guide

## Quick Setup Options

### Option 1: MongoDB Atlas (Recommended - 2 minutes)
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Create a free cluster (M0 - Free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/movieapp?retryWrites=true&w=majority
   ```

### Option 2: Local MongoDB Installation
1. Download: https://www.mongodb.com/try/download/community
2. Install MongoDB Community Edition
3. MongoDB service should start automatically
4. Default connection (already in .env): `mongodb://localhost:27017/movieapp`

## After MongoDB is Running

1. Seed the database:
   ```bash
   npm run seed
   ```

2. Start the server:
   ```bash
   npm run dev
   ```

3. Open browser: http://localhost:3000



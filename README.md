# Sports Live Backend

Backend API for Sports Live application with real-time match updates, Firebase Cloud Messaging notifications, and Socket.IO support.

## Features

- 🔐 JWT Authentication
- ⚽ Real-time match updates via Socket.IO
- 📱 Firebase Cloud Messaging (FCM) push notifications
- 🏆 Competitions, Teams, and Players management
- 📰 News publishing system
- 🛒 E-commerce store with orders
- 📊 Match statistics and events
- 👥 User roles: Admin, Operator, Publisher, User

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO
- **Notifications**: Firebase Admin SDK (FCM API V1)
- **Authentication**: JWT with bcrypt

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/sports_live"
JWT_SECRET="your-secret-key"
PORT=3000

# Firebase Configuration
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"
```

## Installation

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed

# Build
npm run build

# Start server
npm start
```

## Deployment on Railway

1. Create a new project on [Railway](https://railway.app)
2. Add PostgreSQL database
3. Connect your GitHub repository
4. Add environment variables
5. Deploy!

Railway will automatically:
- Install dependencies
- Run Prisma migrations
- Build TypeScript
- Start the server

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Matches
- `GET /api/matches` - Get all matches
- `GET /api/matches/:id` - Get match details
- `GET /api/matches/featured` - Get featured match
- `GET /api/matches/live` - Get live matches

### Teams & Players
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team details
- `GET /api/players` - Get all players

### Notifications
- `POST /api/users/push-token` - Register FCM token
- `GET /api/notifications` - Get user notifications

### Operator (Match Management)
- `POST /api/events` - Add match event (goal, card, etc.)
- `GET /api/operator/matches` - Get operator matches

### Admin
- `POST /api/admin/matches` - Create match
- `PUT /api/admin/matches/:id` - Update match
- `DELETE /api/admin/matches/:id` - Delete match

## Socket.IO Events

### Client → Server
- `join:live-feed` - Join live updates feed
- `join:match` - Join specific match room

### Server → Client
- `match:event` - New match event (goal, card, etc.)
- `match:update` - Match data updated

## License

MIT

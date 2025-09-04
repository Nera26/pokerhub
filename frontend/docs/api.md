# API Documentation

## Endpoints

### Users

- `POST /api/users` – register a new user
- `GET /api/users/:id` – retrieve a user profile

### Games

- `GET /api/games` – list all games
- `POST /api/games` – create a new game
- `GET /api/games/:id` – fetch details for a specific game

## Data Models

### User

| Field     | Type     | Notes           |
| --------- | -------- | --------------- |
| id        | Int      | Primary key     |
| email     | String   | Unique          |
| username  | String   | Unique          |
| createdAt | DateTime | Defaults to now |

### Game

| Field     | Type     | Notes           |
| --------- | -------- | --------------- |
| id        | Int      | Primary key     |
| createdAt | DateTime | Defaults to now |
| updatedAt | DateTime | Auto-updated    |

### Player

| Field    | Type     | Notes               |
| -------- | -------- | ------------------- |
| id       | Int      | Primary key         |
| userId   | Int      | Foreign key to User |
| gameId   | Int      | Foreign key to Game |
| stack    | Int      | Player's chips      |
| joinedAt | DateTime | Defaults to now     |

Schema and migration instructions are maintained in the backend service's documentation.

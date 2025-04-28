# Contest Participation System

A robust contest participation system built with Express.js, Node.js, and TypeScript. The system allows users to participate in contests, answer questions, and compete for prizes based on their performance.

## Features

- User role-based access control (Admin, VIP, Normal, Guest)
- Different contest types (VIP and Normal)
- Multiple question types (Single-select, Multi-select, True/False)
- Real-time leaderboard
- Contest history and prize tracking
- Rate limiting and security features

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/chinmay9389/contest-system.git
cd contest-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables (Refer .env.example):
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/contest-system
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

4. Build the project:
```bash
npm run build
```

5. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## API Documentation

### Authentication

#### Register User
- **POST** `/api/auth/register`
- Body:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }
  ```

#### Login
- **POST** `/api/auth/login`
- Body:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Contests

#### Create Contest (Admin only)
- **POST** `/api/contests`
- Body:
  ```json
  {
    "name": "Math Contest",
    "description": "Test your math skills",
    "startTime": "2024-03-01T10:00:00Z",
    "endTime": "2024-03-01T12:00:00Z",
    "accessLevel": "normal",
    "questions": [
      {
        "type": "single_select",
        "text": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"],
        "correctAnswers": ["4"],
        "points": 10
      }
    ],
    "prize": {
      "description": "First Place Trophy",
      "value": 100
    }
  }
  ```

#### Get All Contests
- **GET** `/api/contests`

#### Get Contest by ID
- **GET** `/api/contests/:id`

#### Submit Contest Answers
- **POST** `/api/contests/:id/submit`
- Body:
  ```json
  {
    "answers": [
      {
        "questionId": "question_id",
        "selectedAnswers": ["4"]
      }
    ]
  }
  ```

### Leaderboard

#### Get Global Leaderboard
- **GET** `/api/leaderboard/global`

#### Get Contest Leaderboard
- **GET** `/api/leaderboard/contest/:contestId`

### User Management

#### Get User Profile
- **GET** `/api/users/profile`

#### Update User Profile
- **PATCH** `/api/users/profile`
- Body:
  ```json
  {
    "name": "New Name",
    "email": "newemail@example.com"
  }
  ```

#### Get User's Contest History
- **GET** `/api/users/contests`

#### Get User's In-Progress Contests
- **GET** `/api/users/contests/in-progress`

#### Get User's Won Prizes
- **GET** `/api/users/prizes`

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Role-based access control
- Input validation
- CORS and Helmet for security headers

## Error Handling

The API uses standard HTTP status codes and returns error messages in the following format:
```json
{
  "message": "Error message description"
}
```


## License

This project is licensed under the MIT License - see the LICENSE file for details. 
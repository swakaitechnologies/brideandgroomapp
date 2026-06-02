# Backend API

This is the backend for the Matrimony application, built with Node.js, Express, and Sequelize (MySQL).

## Project Structure

- `src/config`: Database configuration and connection logic.
- `src/controllers`: Request handlers for API routes.
- `src/models`: Sequelize models (Database schema).
- `src/routes`: API route definitions.
- `src/middleware`: Custom middleware (auth, error handling, etc.).
- `src/utils`: Utility functions.
- `src/app.js`: Express app setup and middleware configuration.
- `src/server.js`: Application entry point.

## Setup

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in the root directory (already created) and update your database credentials:

    ```env
    PORT=5000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_password
    DB_NAME=matrimony_db
    JWT_SECRET=your_jwt_secret
    ```

3.  **Run Development Server:**

    ```bash
    npm run dev
    ```

4.  **Run Production Server:**
    ```bash
    npm start
    ```

## Database

This project uses Sequelize ORM. Ensure your MySQL server is running and the database specified in `.env` exists (or let Sequelize create it if configured).

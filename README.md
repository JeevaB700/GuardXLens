# GuardXLens - Exam Platform

A comprehensive exam platform with a React frontend and Node.js/Express backend.

## Prerequisites

Before you begin, ensure you have the following installed on your laptop:

-   **Node.js** (v18 or higher recommended)
-   **npm** (comes with Node.js)
-   **Git**

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Clone the Repository

Open your terminal or command prompt and run:

```bash
git clone https://github.com/JeevaB700/GuardXLens.git
cd GuardXLens
```

### 2. Set Up the Server

The server handles logic and database interactions.

```bash
cd server
npm install
```

#### Environment Variables
Create a `.env` file in the `server` directory and add the necessary configuration (e.g., MongoDB URI, API keys, JWT secret). You'll need to ask the project owner for these values.

#### Run the Server
```bash
# Using nodemon (development mode)
npm run dev
# OR start normally
node index.js
```

### 3. Set Up the Client

The client is a React application built with Vite.

```bash
# Go back to the project root and then into client
cd ../client
npm install
```

#### Run the Client
```bash
npm run dev
```

The application should now be running. Open the URL provided in the terminal (usually `http://localhost:5173`).

---

## Project Structure

-   `/client`: React (Vite) frontend application.
-   `/server`: Node.js (Express) backend application.

## Key Dependencies

### Client
-   React, Vite, Bootstrap
-   TensorFlow.js (for AI/Object detection)
-   Face-api.js (for facial recognition)
-   Lucide React (icons)
-   Framer Motion (animations)

### Server
-   Express, Mongoose (MongoDB)
-   JWT & Bcrypt (Authentication)
-   Google Generative AI (integration)
-   Multer (file uploads)
-   Nodemailer (email services)

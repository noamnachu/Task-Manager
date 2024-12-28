# Task Manager Application

A collaborative task management system built with React and Node.js. Users can create, manage, and share tasks with other users.

## Features

- User authentication with unique user codes
- Create and manage tasks with priorities and due dates
- Collaborative task sharing with other users
- Real-time status updates
- Responsive design for desktop and mobile

## Design Pattern Implementation

### Bridge Pattern
The application implements the Bridge design pattern to handle task management and participant interactions. This pattern separates the task's core functionality (abstraction) from its participant-specific operations (implementation). The Bridge pattern enables a many-to-many relationship where each task can have multiple participants, and each user can participate in multiple tasks. Task owners have full editing rights, while participants can only toggle task status between "In Progress" and "Completed".

Key components:
- Task abstraction: Handles basic task properties and operations
- Participant implementation: Manages how different users (owner vs participants) interact with tasks
- Benefits:
  - Separates task management from user permissions
  - Allows participants to view and update tasks without modifying core task structure
  - Enables different levels of access (owner can edit everything, participants can only change status)

## Prerequisites

### System Requirements
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Backend Dependencies
- Express (Web framework)
- CORS (Cross-Origin Resource Sharing)
- fs/promises (File system operations)

### Frontend Dependencies
- React (v18 or higher)
- React Router DOM (v6 or higher)
- Axios (HTTP client)

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd task-manager
```

2. Install dependencies for both frontend and backend:
```bash
cd backend
npm install
cd ../frontend
npm install
```

## Running the Application

1. Start the backend server:
```bash
cd backend
node server.js
```
The server will run on http://localhost:5000

2. In a new terminal, start the frontend application:
```bash
cd frontend
npm start
```
The application will open in your browser at http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Enter a user code and your full name to sign in
3. Create new tasks using the "Add Task" button
4. Share tasks with other users by adding them as participants
5. Track and update task status as needed

## Tech Stack

- Frontend: React, React Router, Axios
- Backend: Node.js, Express
- Data Storage: Local JSON file
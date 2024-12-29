# Task Manager Application

A collaborative task management system built with React and Node.js. Users can create, manage, and share tasks with other users.

## How to use

Upon your first login, you need to provide a unique user code and your full name. On subsequent logins, you must enter the same user code and full name. If the full name does not match the one stored in our system, you will receive a message prompting you to update it. You can delete your account and all associated tasks, making your user code available for use with a different full name.

Each user can create tasks with different statuses and priorities. You can also assign participants to your tasks. The task owner can edit the task details, while participants can only change the status from "In Progress" to "Completed". To add a participant, provide their user code. You cannot add yourself or a non-registered code.

Tasks are updated in real-time across all users' task lists. If an owner is deleted, their tasks are also deleted. If a participant is deleted, they are removed from the task's participant list.

## Design Pattern Implementation

The application includes a TaskAssignment class to manage the relationships between User and Task. This design respects the basic implementation of Task and User while remaining open to future adjustments, such as supporting new roles for users in a task. Additionally, it facilitates a many-to-many relationship, allowing each task to have multiple participants and each user to participate in multiple tasks


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
cd Task-Manager
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

## Tech Stack

- Frontend: React, React Router, Axios
- Backend: Node.js, Express
- Data Storage: Local JSON file

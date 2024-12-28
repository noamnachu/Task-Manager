/**
 * Task Manager Application
 * ======================
 * Main application component handling routing, authentication,
 * and global state management for the task management system.
 */

// ===== Imports =====
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Component Imports
import Login from './pages/Login';
import TaskList from './pages/TaskList';
import AddTask from './pages/AddTask';
import Toolbar from './components/Toolbar';

// ===== Constants =====
const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  // ===== State Management =====
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===== Authentication Effects =====
  useEffect(() => {
    // Check for stored user data on component mount
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ===== Authentication Handlers =====
  const handleLoginSuccess = (user) => {
    // Ensure we store the user with consistent ID field
    const userWithId = {
      ...user,
      _id: user.id || user._id  // Handle both formats
    };
    localStorage.setItem('currentUser', JSON.stringify(userWithId));
    setCurrentUser(userWithId);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This will delete all your tasks and cannot be undone.'
    );

    if (confirmed) {
      try {
        const userId = currentUser._id;
        const response = await axios.delete(`${API_BASE_URL}/users/${userId}`);
        handleLogout();
      } catch (error) {
        alert(`Failed to delete account: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // ===== Loading State =====
  if (loading) {
    return <div>Loading...</div>;
  }

  // ===== Unauthenticated State =====
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // ===== Main Render =====
  return (
    <Router>
      <div className="app">
        {/* Navigation Bar */}
        <Toolbar onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />
        
        {/* Main Content */}
        <div className="main-content">
          <Routes>
            <Route
              path="/"
              element={<TaskList userId={currentUser._id} />} 
            />
            <Route
              path="/add"
              element={<AddTask userId={currentUser._id} />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

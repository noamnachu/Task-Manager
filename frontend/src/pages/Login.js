/**
 * Login Component
 * ==============
 * Handles user authentication and account creation.
 * Users can sign in with an existing account or create a new one automatically.
 */

// ===== Imports =====
import React, { useState } from 'react';
import axios from 'axios';

// ===== Constants =====
const API_BASE_URL = 'http://localhost:5000/api';

function Login({ onLoginSuccess }) {
  // ===== State Management =====
  const [id, setId] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ===== Form Submission Handler =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');

      // Attempt authentication/registration
      const response = await axios.post(`${API_BASE_URL}/users/auth`, {
        id: id.trim(),
        fullName: fullName.trim()
      });

      onLoginSuccess(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to authenticate';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ===== Component Render =====
  return (
    <div className="login-container">
      <div className="login-box">
        {/* Header Section */}
        <h1>Task Manager</h1>
        <h2>Welcome! Sign in or create an account</h2>
        
        {/* Error Message Display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* User Code Input */}
          <div className="form-group">
            <label htmlFor="id">User Code</label>
            <input
              type="text"
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Enter your unique user code"
              required
              disabled={loading}
            />
          </div>

          {/* Full Name Input */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="login-button"
            disabled={loading || !id.trim() || !fullName.trim()}
          >
            {loading ? 'Please wait...' : 'Continue →'}
          </button>
        </form>

        {/* Information Text */}
        <p className="login-info">
          Enter your code and name to sign in.
          {'\n'}
          If you're new, we'll create an account for you automatically.
        </p>
      </div>
    </div>
  );
}

export default Login; 
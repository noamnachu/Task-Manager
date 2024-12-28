import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Toolbar({ onLogout, onDeleteAccount }) {
  const location = useLocation();
  
  return (
    <div className="toolbar">
      <div className="toolbar-nav">
        <Link 
          to="/" 
          className={`button ${location.pathname === '/' ? 'primary-button' : 'secondary-button'}`}
        >
          My Tasks
        </Link>
        <Link 
          to="/add" 
          className={`button ${location.pathname === '/add' ? 'primary-button' : 'secondary-button'}`}
        >
          Add Task
        </Link>
      </div>
      
      <div className="toolbar-actions">
        <button 
          onClick={onLogout}
          className="button secondary-button"
        >
          Sign Out
        </button>
        <button 
          onClick={onDeleteAccount}
          className="button danger-button"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}

export default Toolbar; 
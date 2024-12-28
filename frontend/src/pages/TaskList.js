/**
 * TaskList Component
 * =================
 * Main component for displaying and managing tasks.
 * Handles task filtering, sorting, editing, and status management.
 * Also manages participant functionality for collaborative tasks.
 */

// ===== Imports =====
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ===== Constants =====
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Label Mappings
 * -------------
 * Define display labels for priority levels and status types
 */
const PRIORITY_LABELS = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent'
};

const STATUS_LABELS = {
  1: 'Draft',
  2: 'In Progress',
  3: 'On Hold',
  4: 'Completed',
  5: 'Deleted'
};

/**
 * Dropdown Options
 * --------------
 * Options for status, priority, and sorting selections
 */
const STATUS_OPTIONS = [
  { id: 1, label: 'Draft' },
  { id: 2, label: 'In Progress' },
  { id: 3, label: 'On Hold' },
  { id: 4, label: 'Completed' },
  { id: 5, label: 'Deleted' }
];

const PRIORITY_OPTIONS = [
  { id: 1, label: 'Low' },
  { id: 2, label: 'Medium' },
  { id: 3, label: 'High' },
  { id: 4, label: 'Urgent' }
];

const SORT_OPTIONS = [
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'date', label: 'Due Date' },
  { id: 'title', label: 'Title (A-Z)' }
];

/**
 * Color Schemes
 * ------------
 * Define colors for priority levels and status types
 */
const PRIORITY_COLORS = {
  1: '#4caf50',  // Low - Green
  2: '#2196f3',  // Medium - Blue
  3: '#ff9800',  // High - Orange
  4: '#f44336'   // Urgent - Red
};

const STATUS_COLORS = {
  1: '#ffffff',  // Draft - White
  2: '#e3f2fd',  // In Progress - Light Blue
  3: '#fff3e0',  // On Hold - Light Orange
  4: '#e8f5e9',  // Completed - Light Green
  5: '#ffebee'   // Deleted - Light Red
};

const EDITABLE_STATUS_OPTIONS = [
  { id: 1, label: 'Draft' },
  { id: 2, label: 'In Progress' },
  { id: 3, label: 'On Hold' }
];

function TaskList({ userId }) {
  // ===== State Management =====
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(['all']);
  const [sortBy, setSortBy] = useState('priority');
  const [editingTask, setEditingTask] = useState(null);
  const [userData, setUserData] = useState(null);
  const [addingParticipant, setAddingParticipant] = useState(null);
  const [participantId, setParticipantId] = useState('');
  const [participantError, setParticipantError] = useState('');

  // ===== Effects =====
  useEffect(() => {
    if (userId) {
      fetchTasks();
      // Get user data from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (currentUser) {
        setUserData(currentUser);
      }
    }
  }, [userId]);

  // ===== Data Fetching =====
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/tasks?userId=${userId}`);
      const sortedTasks = sortTasks(response.data, sortBy);
      setTasks(sortedTasks);
      setError('');
    } catch (error) {
      setError('Failed to fetch tasks. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // ===== Task Sorting Logic =====
  const sortTasks = (tasksToSort, sortType) => {
    return [...tasksToSort].sort((a, b) => {
      switch (sortType) {
        case 'priority':
          if (b.priority_id !== a.priority_id) {
            return b.priority_id - a.priority_id;
          }
          return a.status_id - b.status_id;
        
        case 'date':
          const dateComparison = new Date(a.due_date) - new Date(b.due_date);
          if (dateComparison !== 0) {
            return dateComparison;
          }
          return a.status_id - b.status_id;
        
        case 'title':
          return a.title.localeCompare(b.title);
        
        case 'status':
        default:
          return a.status_id - b.status_id;
      }
    });
  };

  // ===== Task Management Functions =====
  const deleteTask = async (id, currentStatus) => {
    try {
      setLoading(true);
      if (currentStatus === 5) {
        if (window.confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
          await axios.delete(`${API_BASE_URL}/tasks/${id}?userId=${userId}`);
        }
      } else {
        await handleStatusChange(id, 5); // Move to Deleted status
      }
      await fetchTasks();
      setError('');
    } catch (error) {
      setError('Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId, updatedData) => {
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/tasks/${taskId}`, updatedData);
      await fetchTasks();
      setError('');
      setEditingTask(null);
    } catch (error) {
      setError('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  // ===== UI Helper Functions =====
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    const sortedTasks = sortTasks(tasks, newSortBy);
    setTasks(sortedTasks);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // ===== Status Management =====
  const handleStatusToggle = (statusId, event) => {
    if (event) {
      event.stopPropagation();
    }
  
    setSelectedStatuses(prev => {
      if (prev.includes(statusId)) {
        return prev.filter(s => s !== statusId);
      } else {
        return [...prev, statusId];
      }
    });
  };

  const getSelectedStatusesLabel = () => {
    if (selectedStatuses.length === 0) return 'Select Status';
    if (selectedStatuses.length === STATUS_OPTIONS.length) return 'All Statuses';
    return `${selectedStatuses.length} selected`;
  };

  // ===== Task Filtering =====
  const filteredTasks = selectedStatuses[0] === 'all' || !selectedStatuses[0]
    ? tasks
    : tasks.filter(task => task.status_id.toString() === selectedStatuses[0]);

  // ===== Status Change Handlers =====
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setLoading(true);
      await axios.patch(`${API_BASE_URL}/tasks/${taskId}`, {
        status_id: newStatus,
        user_id: userId
      });
      await fetchTasks();
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId, currentStatus) => {
    // Allow toggling between In Progress and Completed
    if (currentStatus === 2) {
      // If task is In Progress, mark it as Completed
      await handleStatusChange(taskId, 4);
    } else if (currentStatus === 4) {
      // If task is Completed, mark it as In Progress
      await handleStatusChange(taskId, 2);
    }
  };

  const handleRestoreFromDeleted = async (taskId) => {
    await handleStatusChange(taskId, 1); // Restore to Draft status
  };

  // ===== Task Editing =====
  const startEditing = (task) => {
    setEditingTask(task);
  };

  const cancelEditing = () => {
    setEditingTask(null);
  };

  // ===== Participant Management =====
  const addParticipant = async (taskId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/tasks/${taskId}/participants`, {
        participantId: participantId.trim()
      });
      
      // Update the task in the local state with the updated task data
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? response.data.task : task
        )
      );
      
      setParticipantId('');
      setAddingParticipant(null);
      setParticipantError('');
    } catch (error) {
      setParticipantError(error.response?.data?.message || 'Failed to add participant');
    } finally {
      setLoading(false);
    }
  };

  const removeParticipant = async (taskId, participantToRemove) => {
    try {
      setLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/tasks/${taskId}/participants/${participantToRemove}`);
      
      // Update the task in the local state with the updated task data
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? response.data.task : task
        )
      );
    } catch (error) {
      setError('Failed to remove participant');
    } finally {
      setLoading(false);
    }
  };

  const renderParticipantsList = (task) => {
    if (!task.participants?.length) {
      return <p>No participants</p>;
    }

    return (
      <ul className="participants-list">
        {task.participants.map(participantId => (
          <li key={participantId} className="participant-item">
            {task.participantNames?.[participantId] || participantId}
            <button
              className="remove-participant-button"
              onClick={() => removeParticipant(task._id, participantId)}
              disabled={loading}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    );
  };

  const renderTaskContent = (task) => {
    const isOwner = task.owner_id === userId;
    const isParticipant = !isOwner && task.participants?.includes(userId);

    if (editingTask?._id === task._id) {
      return (
        <div className="task-edit-form">
          <div className="input-group">
            <label className="input-label">
              Title *
              <input
                type="text"
                className="task-input"
                value={editingTask.title}
                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                required
              />
            </label>
          </div>

          <div className="input-group">
            <label className="input-label">
              Description
              <textarea
                className="task-input description"
                value={editingTask.description}
                onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
              />
            </label>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label className="input-label">
                Due Date *
                <input
                  type="date"
                  className="task-input"
                  value={editingTask.due_date}
                  onChange={(e) => setEditingTask({...editingTask, due_date: e.target.value})}
                  required
                />
              </label>
            </div>

            <div className="input-group">
              <label className="input-label">
                Priority *
                <select
                  className="task-input"
                  value={editingTask.priority_id}
                  onChange={(e) => setEditingTask({...editingTask, priority_id: Number(e.target.value)})}
                >
                  {PRIORITY_OPTIONS.map(priority => (
                    <option key={priority.id} value={priority.id}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="input-group">
              <label className="input-label">
                Status *
                <select
                  className="task-input"
                  value={editingTask.status_id}
                  onChange={(e) => setEditingTask({...editingTask, status_id: Number(e.target.value)})}
                >
                  {EDITABLE_STATUS_OPTIONS.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button
              className="save-button"
              onClick={() => updateTask(editingTask._id, editingTask)}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              className="cancel-button"
              onClick={cancelEditing}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className={`task-header ${isParticipant ? 'participant-task' : ''}`}>
          <h3 className={`task-title ${task.status_id === 4 ? 'completed' : ''}`}>
            {task.title}
          </h3>
          <div className="task-badges">
            <span 
              className="priority-badge"
              style={{ backgroundColor: PRIORITY_COLORS[task.priority_id] }}
            >
              {PRIORITY_LABELS[task.priority_id]}
            </span>
            <span 
              className="status-badge"
              style={{ backgroundColor: STATUS_COLORS[task.status_id] }}
            >
              {STATUS_LABELS[task.status_id]}
            </span>
          </div>
        </div>
        {task.description && (
          <p className={`task-description ${task.status_id === 4 ? 'completed' : ''}`}>
            {task.description}
          </p>
        )}
        <div className="task-meta">
          <span className="due-date">
            Due: {formatDate(task.due_date)}
          </span>
          {isParticipant && task.ownerName && (
            <span className="owner-info">
              Task's Owner: {task.ownerName}
            </span>
          )}
        </div>
        {isOwner && (
          <div className="participants-section">
            <h4>Participants:</h4>
            {renderParticipantsList(task)}
            {addingParticipant === task._id ? (
              <div className="add-participant-form">
                <input
                  type="text"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  placeholder="Enter participant user code"
                  className="participant-input"
                />
                {participantError && (
                  <div className="participant-error">{participantError}</div>
                )}
                <div className="participant-actions">
                  <button
                    className="add-button"
                    onClick={() => addParticipant(task._id)}
                    disabled={loading || !participantId.trim()}
                  >
                    Add
                  </button>
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setAddingParticipant(null);
                      setParticipantId('');
                      setParticipantError('');
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="add-participant-button"
                onClick={() => setAddingParticipant(task._id)}
                disabled={loading}
              >
                Add Participant
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  const renderTaskActions = (task) => {
    const isOwner = task.owner_id === userId;
    const isParticipant = !isOwner && task.participants?.includes(userId);

    if (task.status_id === 5) {
      return isOwner ? (
        <div className="task-actions">
          <button
            className="restore-button"
            onClick={() => handleRestoreFromDeleted(task._id)}
            disabled={loading}
          >
            Restore as Draft
          </button>
          <button
            className="delete-button permanent"
            onClick={() => deleteTask(task._id, task.status_id)}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Delete Permanently'}
          </button>
        </div>
      ) : null;
    }

    if (editingTask?._id === task._id) {
      return null; // No buttons shown during editing
    }

    return (
      <div className="task-actions">
        {isOwner && task.status_id !== 4 && task.status_id !== 5 && (
          <button
            className="edit-button"
            onClick={() => startEditing(task)}
            disabled={loading}
          >
            Edit
          </button>
        )}
        {isOwner && (
          <button
            className="delete-button"
            onClick={() => deleteTask(task._id, task.status_id)}
            disabled={loading}
          >
            {loading ? 'Processing...' : task.status_id === 4 ? 'Remove' : 'Move to Deleted'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      {userData && (
        <div className="welcome-message">
          <h2>Welcome, {userData.fullName}! 👋</h2>
        </div>
      )}
      <h1 className="title">Task List</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="filters-container">
        <label className="filter-label">
          Filter by Status:
          <select
            className="sort-filter"
            value={selectedStatuses[0] || 'all'}
            onChange={(e) => setSelectedStatuses([e.target.value])}
            disabled={loading}
          >
            <option value="all">All Tasks</option>
            {STATUS_OPTIONS.map(option => (
              <option key={option.id} value={option.id.toString()}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-label">
          Sort by:
          <select
            className="sort-filter"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            disabled={loading}
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="task-list">
        {filteredTasks.map((task) => {
          const isOwner = task.owner_id === userId;
          const isParticipant = !isOwner && task.participants?.includes(userId);
          
          return (
            <li 
              key={task._id} 
              className={`task-item ${editingTask?._id === task._id ? 'editing' : ''} ${isParticipant ? 'participant-task' : ''}`}
              data-status={task.status_id}
              style={{ backgroundColor: STATUS_COLORS[task.status_id] }}
            >
              <div className="task-checkbox">
                {((isOwner || (isParticipant && (task.status_id === 2 || task.status_id === 4))) && (task.status_id === 2 || task.status_id === 4)) && (
                  <input
                    type="checkbox"
                    checked={task.status_id === 4}
                    onChange={() => handleCompleteTask(task._id, task.status_id)}
                    disabled={loading}
                    className="complete-checkbox"
                  />
                )}
              </div>
              <div className="task-content">
                {renderTaskContent(task)}
              </div>
              {renderTaskActions(task)}
            </li>
          );
        })}
      </ul>
      
      {filteredTasks.length === 0 && !loading && (
        <p className="empty-message">
        {selectedStatuses.length === 0 
        ? 'No status selected. Please select at least one status to view tasks.'
        : 'No tasks found with the selected status(es).'
        }
        </p>
      )}
    </div>
  );
}

export default TaskList; 
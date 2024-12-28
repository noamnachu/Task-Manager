/**
 * AddTask Component
 * ================
 * A form component that allows users to create new tasks with various properties
 * and add participants for collaboration.
 */

// ===== Imports =====
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ===== Constants =====
const API_BASE_URL = 'http://localhost:5000/api';

const PRIORITY_OPTIONS = [
  { id: 1, label: 'Low' },
  { id: 2, label: 'Medium' },
  { id: 3, label: 'High' },
  { id: 4, label: 'Urgent' }
];

function AddTask({ userId }) {
  // ===== State Management =====
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priorityId, setPriorityId] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [participantError, setParticipantError] = useState('');
  const navigate = useNavigate();

  // ===== Form Submission Handler =====
  const handleSubmit = async (e, asDraft = false) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate,
        priority_id: Number(priorityId),
        status_id: asDraft ? 1 : 2, // 1 for Draft, 2 for In Progress
        owner_id: userId,
        participants: participants
      };

      const response = await axios.post(`${API_BASE_URL}/tasks`, taskData);
      navigate('/tasks');
    } catch (error) {
      setError('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ===== Participant Management =====
  const addParticipant = async () => {
    const participantId = newParticipant.trim();
    
    // Validation checks
    if (!participantId) {
      setParticipantError('Participant user code is required');
      return;
    }

    if (participantId === userId) {
      setParticipantError('Cannot add yourself as a participant');
      return;
    }

    if (participants.includes(participantId)) {
      setParticipantError('This participant is already added');
      return;
    }

    try {
      setLoading(true);
      setParticipantError('');
      
      // Verify if user exists in the database
      const verifyResponse = await axios.get(`${API_BASE_URL}/users/verify/${participantId}`);
      
      // If user exists, add them to the participants list
      setParticipants([...participants, participantId]);
      setNewParticipant('');
    } catch (error) {
      setParticipantError(error.response?.status === 404 
        ? 'User code not found. Please enter a valid user code.'
        : 'Failed to add participant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeParticipant = (participantId) => {
    setParticipants(participants.filter(p => p !== participantId));
  };

  // ===== Component Render =====
  return (
    <div className="page">
      <h1 className="title">Add New Task</h1>
      
      {/* Error Message Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form className="task-form" onSubmit={handleSubmit}>
        {/* Title Input */}
        <div className="input-group">
          <label className="input-label">
            Title *
            <input
              type="text"
              className="task-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
        </div>

        {/* Description Input */}
        <div className="input-group">
          <label className="input-label">
            Description
            <textarea
              className="task-input description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>

        {/* Due Date and Priority Selection */}
        <div className="form-row">
          <div className="input-group">
            <label className="input-label">
              Due Date *
              <input
                type="date"
                className="task-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="input-group">
            <label className="input-label">
              Priority *
              <select
                className="task-input"
                value={priorityId}
                onChange={(e) => setPriorityId(e.target.value)}
              >
                {PRIORITY_OPTIONS.map(priority => (
                  <option key={priority.id} value={priority.id}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Participants Section */}
        <div className="participants-section">
          <h4>Add Participants</h4>
          {participants.length > 0 && (
            <ul className="participants-list">
              {participants.map(participantId => (
                <li key={participantId} className="participant-item">
                  {participantId}
                  <button
                    type="button"
                    className="remove-participant-button"
                    onClick={() => removeParticipant(participantId)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          <div className="add-participant-form">
            <input
              type="text"
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
              placeholder="Enter participant user code"
              className="participant-input"
            />
            {participantError && (
              <div className="participant-error">{participantError}</div>
            )}
            <button
              type="button"
              className="add-participant-button"
              onClick={addParticipant}
              disabled={!newParticipant.trim()}
            >
              Add Participant
            </button>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            className="save-button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Save'}
          </button>
          <button
            type="button"
            className="draft-button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
          >
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddTask; 
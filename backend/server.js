/**
 * Task Manager Server
 * Express server handling user authentication, task management, and data persistence.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const Task = require('./Task');
const User = require('./User');
const TaskAssignment = require('./TaskAssignment');

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Data Management Functions
 * Handle reading from and writing to the JSON data file
 */

// Read data from file
async function readData() {
  try {
    // Ensure the file exists with initial structure
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify({
        users: [],
        tasks: [],
        taskAssignments: []
      }, null, 2));
    }

    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsedData = JSON.parse(data);
    return {
      users: (parsedData.users || []).map(userData => new User({ 
        id: userData.id || userData._id,  // Handle both formats
        fullName: userData.fullName,
        lastLogin: userData.lastLogin
      })),
      tasks: (parsedData.tasks || []).map(taskData => new Task(taskData)),
      taskAssignments: (parsedData.taskAssignments || []).map(assignmentData => new TaskAssignment(assignmentData))
    };
  } catch (error) {
    // If there's an error, ensure we have a clean slate
    const initialData = { users: [], tasks: [], taskAssignments: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

// Write data to file with verification
async function writeData(data) {
  try {
    const jsonData = JSON.stringify({
      users: data.users.map(user => user.toJSON()),
      tasks: data.tasks.map(task => task.toJSON()),
      taskAssignments: data.taskAssignments.map(assignment => assignment.toJSON())
    }, null, 2);
    
    // Write to a temporary file first
    const tempFile = `${DATA_FILE}.tmp`;
    await fs.writeFile(tempFile, jsonData, { encoding: 'utf8' });
    
    // Verify the temporary file
    const written = await fs.readFile(tempFile, 'utf8');
    const parsed = JSON.parse(written);
    
    if (parsed.users.length !== data.users.length) {
      throw new Error('Data verification failed - users length mismatch');
    }
    
    // If verification passes, rename temp file to actual file
    await fs.rename(tempFile, DATA_FILE);
    
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Helper Functions
 */

// Add user information to task
const addUserInfoToTask = (task, data) => {
  const taskData = task.toJSON();
  
  // Add owner name
  const owner = data.users.find(u => u._id === task.owner_id);
  taskData.ownerName = owner ? owner.fullName : 'Unknown';
  
  // Add participant names
  if (task.participants?.length > 0) {
    taskData.participantNames = {};
    task.participants.forEach(participantId => {
      const participant = data.users.find(u => u._id === participantId);
      taskData.participantNames[participantId] = participant ? participant.fullName : participantId;
    });
  }
  
  return taskData;
};

/**
 * User Management Routes
 */

// User Authentication - Login/Signup
app.post('/api/users/auth', async (req, res) => {
  try {
    const id = req.body.id ? req.body.id.trim() : '';
    const fullName = req.body.fullName ? req.body.fullName.trim() : '';

    // Check if fullName is empty
    if (!fullName) {
      return res.status(400).json({ 
        message: 'Full name is required',
        code: 'EMPTY_NAME'
      });
    }

    const data = await readData();
    let user = data.users.find(u => u._id === id);
    
    if (user) {
      // Existing user - check name match
      if (user.fullName.toLowerCase() !== fullName.toLowerCase()) {
        return res.status(400).json({ 
          message: 'The name does not match the code in our records. Please enter the correct name.',
          code: 'NAME_MISMATCH'
        });
      }
      
      // Name matches, proceed with login
      user.updateLastLogin();
      await writeData(data);
      res.json(user.toJSON());
    } else {
      // New user - signup
      user = new User({ id, fullName });
      data.users.push(user);
      await writeData(data);
      res.status(201).json(user.toJSON());
    }
  } catch (error) {
    res.status(500).json({ message: 'Error processing user authentication: ' + error.message });
  }
});

// Delete user account and associated data
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const data = await readData();
    
    // Check for user with _id
    const userIndex = data.users.findIndex(u => u._id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove user's owned tasks and assignments
    const userToDelete = data.users[userIndex];
    
    // Remove user's owned tasks
    data.tasks = data.tasks.filter(task => task.owner_id !== userId);
    
    // Remove user from participants lists in all tasks
    data.tasks = data.tasks.map(task => {
      if (task.participants && task.participants.includes(userId)) {
        task.participants = task.participants.filter(p => p !== userId);
      }
      return task;
    });
    
    // Remove all task assignments for the user
    data.taskAssignments = data.taskAssignments.filter(assignment => assignment.user_id !== userId);
    
    // Remove the user
    data.users.splice(userIndex, 1);
    
    await writeData(data);
    
    res.json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: `Error deleting user: ${error.message}` });
  }
});

// Verify if user exists
app.get('/api/users/verify/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await readData();
    const user = data.users.find(u => u._id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User exists', user: { _id: user._id, fullName: user.fullName } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

/**
 * Task Management Routes
 */

// Get tasks for user (including participated tasks)
app.get('/api/tasks', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const data = await readData();
    
    // Get tasks where user is owner or participant
    const userTasks = data.tasks.filter(task => 
      task.owner_id === userId || (task.participants && task.participants.includes(userId))
    );
    
    // Add owner and participant information for tasks
    const tasksWithInfo = userTasks.map(task => {
      const taskData = task.toJSON();
      
      // Add owner name for participant tasks
      if (task.owner_id !== userId) {
        const owner = data.users.find(u => u._id === task.owner_id);
        taskData.ownerName = owner ? owner.fullName : 'Unknown';
      }
      
      // Add participant names
      if (task.participants?.length > 0) {
        taskData.participantNames = {};
        task.participants.forEach(participantId => {
          const participant = data.users.find(u => u._id === participantId);
          if (participant) {
            taskData.participantNames[participantId] = participant.fullName;
          }
        });
      }
      
      return taskData;
    });
    
    res.json(tasksWithInfo);
  } catch (error) {
    res.status(500).json({ message: 'Error reading tasks' });
  }
});

// Create new task
app.post('/api/tasks', async (req, res) => {
  try {
    const taskData = { 
      ...req.body,
      title: req.body.title ? req.body.title.trim() : '',
      description: req.body.description ? req.body.description.trim() : ''
    };
    
    const data = await readData();

    // Verify all participants exist
    if (taskData.participants && taskData.participants.length > 0) {
      const invalidParticipants = taskData.participants.filter(
        participantId => !data.users.some(u => u._id === participantId.trim())
      );

      if (invalidParticipants.length > 0) {
        return res.status(400).json({ 
          error: 'Invalid participants', 
          invalidParticipants 
        });
      }
    }
    
    const validationErrors = Task.validate(taskData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    const newTask = new Task(taskData);
    
    data.tasks.push(newTask);
    
    // Create task assignments for owner and participants
    const assignments = [
      // Owner assignment
      new TaskAssignment({
        user_id: taskData.owner_id,
        task_id: newTask._id,
        role: 'owner'
      }),
      // Participant assignments
      ...(taskData.participants || []).map(participantId => 
        new TaskAssignment({
          user_id: participantId.trim(),
          task_id: newTask._id,
          role: 'participant'
        })
      )
    ];
    
    data.taskAssignments.push(...assignments);
    
    await writeData(data);
    res.status(201).json(newTask.toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Error adding task' });
  }
});

// Update task details
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.body.owner_id;
    
    const data = await readData();
    const taskIndex = data.tasks.findIndex(task => task._id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Verify user owns the task
    if (data.tasks[taskIndex].owner_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to modify this task' });
    }
    
    const validationErrors = Task.validate(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    data.tasks[taskIndex].update(req.body);
    await writeData(data);
    res.json(data.tasks[taskIndex].toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const data = await readData();
    const taskIndex = data.tasks.findIndex(task => task._id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Verify user owns the task
    if (data.tasks[taskIndex].owner_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this task' });
    }
    
    data.tasks.splice(taskIndex, 1);
    // Remove associated task assignments
    data.taskAssignments = data.taskAssignments.filter(assignment => assignment.task_id !== taskId);
    
    await writeData(data);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// Update task status
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status_id, user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const data = await readData();
    const taskIndex = data.tasks.findIndex(task => task._id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = data.tasks[taskIndex];
    const isOwner = task.owner_id === user_id;
    const isParticipant = task.participants?.includes(user_id);

    // Check permissions
    if (!isOwner && !isParticipant) {
      return res.status(403).json({ message: 'Unauthorized to modify this task' });
    }

    // Participants can only toggle between in progress (2) and completed (4)
    if (isParticipant && !isOwner) {
      if (task.status_id !== 2 && task.status_id !== 4) {
        return res.status(403).json({ message: 'Participants can only modify in-progress or completed tasks' });
      }
      if (status_id !== 2 && status_id !== 4) {
        return res.status(403).json({ message: 'Participants can only toggle between in-progress and completed' });
      }
    }

    // Update the task status
    data.tasks[taskIndex].updateStatus(status_id);
    
    // Save the changes to the data file
    await writeData(data);
    
    // Return task with user information
    const taskWithInfo = addUserInfoToTask(data.tasks[taskIndex], data);
    res.json(taskWithInfo);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task status: ' + error.message });
  }
});

/**
 * Task Participant Management Routes
 */

// Add participant to task
app.post('/api/tasks/:taskId/participants', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { participantId } = req.body;

    // Load current data
    const data = await readData();

    // Validate input
    if (!participantId) {
      return res.status(400).json({ message: 'Please enter a user code' });
    }

    // Find the task
    const task = data.tasks.find(t => t._id === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user exists
    const participant = data.users.find(u => u._id === participantId);
    if (!participant) {
      return res.status(404).json({ message: 'User code not found. Please check the code and try again.' });
    }

    // Check if user is already a participant
    if (task.participants?.includes(participantId)) {
      return res.status(400).json({ message: 'This user is already a participant in this task' });
    }

    // Check if user is the owner
    if (task.owner_id === participantId) {
      return res.status(400).json({ message: 'The task owner cannot be added as a participant' });
    }

    // Add participant
    if (!task.participants) {
      task.participants = [];
    }
    task.participants.push(participantId);

    // Create task assignment using TaskAssignment class
    const newAssignment = new TaskAssignment({
      user_id: participantId,
      task_id: taskId,
      role: 'participant'
    });
    data.taskAssignments.push(newAssignment);

    // Add participant name to response
    task.participantNames = {
      ...task.participantNames,
      [participantId]: participant.fullName
    };

    await writeData(data);
    res.json({ message: 'Participant added successfully', task });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ message: 'Failed to add participant. Please try again.' });
  }
});

// Remove participant from task
app.delete('/api/tasks/:taskId/participants/:participantId', async (req, res) => {
  try {
    const { taskId, participantId } = req.params;
    
    // Load current data
    const data = await readData();
    
    // Find the task
    const task = data.tasks.find(t => t._id === taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Remove participant
    if (task.participants) {
      task.participants = task.participants.filter(p => p !== participantId);
    }
    
    // Remove task assignment
    data.taskAssignments = data.taskAssignments.filter(
      ta => !(ta.task_id === taskId && ta.user_id === participantId && ta.role === 'participant')
    );
    
    // Save changes
    await writeData(data);
    
    // Return task with user information
    const taskWithInfo = addUserInfoToTask(task, data);
    res.json({ message: 'Participant removed successfully', task: taskWithInfo });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
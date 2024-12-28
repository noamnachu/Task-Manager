class Task {
  static PRIORITY_IDS = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    URGENT: 4
  };

  static STATUS_IDS = {
    DRAFT: 1,
    IN_PROGRESS: 2,
    ON_HOLD: 3,
    COMPLETED: 4,
    DELETED: 5
  };

  constructor(data) {
    this._id = data._id || String(Date.now());
    this.title = data.title;
    this.description = data.description || '';
    this.due_date = data.due_date;
    this.priority_id = Number(data.priority_id);
    this.status_id = Number(data.status_id);
    this.createdAt = data.createdAt || new Date().toISOString();
    this.update_date = data.update_date || null;
    this.owner_id = data.owner_id;
    this.participants = data.participants || [];
  }

  static validate(data) {
    const errors = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!data.due_date) {
      errors.push('Due date is required');
    }

    if (!data.priority_id || ![1, 2, 3, 4].includes(Number(data.priority_id))) {
      errors.push('Valid priority is required');
    }

    if (!data.status_id || ![1, 2, 3, 4, 5].includes(Number(data.status_id))) {
      errors.push('Valid status is required');
    }

    if (!data.owner_id) {
      errors.push('Owner code is required');
    }

    return errors;
  }

  updateStatus(newStatus) {
    this.status_id = Number(newStatus);
    this.update_date = new Date().toISOString();
  }

  update(data) {
    this.title = data.title;
    this.description = data.description || '';
    this.due_date = data.due_date;
    this.priority_id = Number(data.priority_id);
    this.status_id = Number(data.status_id);
    this.update_date = new Date().toISOString();
  }

  toJSON() {
    return {
      _id: this._id,
      title: this.title,
      description: this.description,
      due_date: this.due_date,
      priority_id: this.priority_id,
      status_id: this.status_id,
      createdAt: this.createdAt,
      update_date: this.update_date,
      owner_id: this.owner_id,
      participants: this.participants
    };
  }
}

module.exports = Task; 
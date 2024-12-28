class TaskAssignment {
    constructor(data) {
        this._id = Date.now().toString();
        this.user_id = data.user_id;
        this.task_id = data.task_id;
        this.assignedAt = new Date().toISOString();
        this.role = data.role;
    }

    static validate(data) {
        const errors = [];
        if (!data.user_id) {
            errors.push('User code is required');
        }
        if (!data.task_id) {
            errors.push('Task code is required');
        }
        return errors;
    }

    toJSON() {
        return {
            _id: this._id,
            user_id: this.user_id,
            task_id: this.task_id,
            assignedAt: this.assignedAt,
            role: this.role
        };
    }
}

module.exports = TaskAssignment; 
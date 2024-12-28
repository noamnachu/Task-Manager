class User {
    constructor(data) {
        this._id = data.id;
        this.fullName = data.fullName.trim();
        this.lastLogin = data.lastLogin || new Date().toISOString();
    }

    updateLastLogin() {
        this.lastLogin = new Date().toISOString();
    }

    toJSON() {
        return {
            id: this._id,
            fullName: this.fullName,
            lastLogin: this.lastLogin
        };
    }

    static validate(data) {
        const errors = [];
        return errors;
    }
}

module.exports = User; 
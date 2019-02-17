const crypto = require('crypto');

class User {
    constructor(username, id, password = null) {
        this.username = username;
        this.id = id;
        if (password != null) {
            this.passwordHash = this.createPasswordHash(password);
        }
    }

    createPasswordHash(password) {
        return crypto.createHash('sha256').update(password).digest('hex').toString();
    }

    checkPassword(password) {
        return this.passwordHash === this.createPasswordHash(password);
    }

    static transformToUser(obj) {
        if (obj.hasOwnProperty('username') && obj.hasOwnProperty('passwordHash')) {
            const user = new User(obj.username, obj.id);

            user.passwordHash = obj.passwordHash;
            return user;
        } else {
            return null;
        }
    }
}

module.exports = User;

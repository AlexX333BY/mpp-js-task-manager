const path = require('path');
const fs = require('fs');
const Task = require('..' + path.sep + path.join('scripts', 'task'));
const User = require('..' + path.sep + path.join('scripts', 'user'));
const jwt = require('jsonwebtoken');

const commonLocalization = { title: 'Task Manager', greeting: 'Welcome to Task Manager!' },
    pageLocalization = { title: commonLocalization.title, greeting: commonLocalization.greeting, taskNameQuery: 'Name',
        taskAttachmentQuery: 'Attachment', taskCompleteDateQuery: 'Completion date',
        submitTaskButton: 'Submit task', nonCompletedTasks: 'Non-completed tasks', completedTasks: 'Completed tasks',
        taskListHeader: 'Tasks', addTaskHeader: 'Add new task' },
    taskLocalization  = { completeTaskButton: 'Complete', downloadAttachment: 'Download attachment',
        completedStatus: 'Completed', nonCompletedStatus: 'Not completed' },
    loginLocalization = { title: commonLocalization.title, greeting: commonLocalization.greeting, loginHeader: 'Login',
        usernameQuery: 'Username', passwordQuery: 'Password', submitLoginButton: 'Login' };

function getIndexTemplate() {
    return fs.readFileSync(path.join('views', 'index.ejs')).toString();
}

function getLoginTemplate() {
    return fs.readFileSync(path.join('views', 'login.ejs')).toString();
}

function getTaskTemplate() {
    return fs.readFileSync(path.join('views', 'task.ejs')).toString();
}

function isTokenValid(token) {
    if (token == null) {
        return false;
    }
    try {
        const decoded = decodeUserFromToken(token),
            tokenUser = users.filter((user) => user.username === decoded.username);
        if (tokenUser.length === 0) {
            return false;
        } else {
            return tokenUser[0].passwordHash === decoded.passwordHash;
        }
    } catch(err) {
        return false;
    }
}

function decodeUserFromToken(token) {
    return jwt.verify(token, privateKey);
}

function createToken(user) {
    return jwt.sign(JSON.parse(JSON.stringify(user)), privateKey, { expiresIn: tokenExpirationTime });
}

function getTasks(completionFilters, userId) {
    return { tasks: tasks.filter((task) => (task.authorId == userId) && completionFilters.includes(task.isCompleted())),
        template: getTaskTemplate(),
        loc: taskLocalization };
}

module.exports = {
    getPage: function ({token, page}) {
        switch (page) {
            case 'LOGIN':
                return { template: getLoginTemplate(), loc: JSON.stringify(loginLocalization) };
            case 'INDEX':
                if (isTokenValid(token)) {
                    return { template: getIndexTemplate(), loc: JSON.stringify(pageLocalization) };
                } else {
                    return null;
                }
            default:
                return null;
        }
    },

    getTasks: function({token, filters}) {
        if (isTokenValid(token)) {
            return getTasks(filters, decodeUserFromToken(token).id);
        } else {
            return null;
        }
    },

    downloadAttachment: function ({token, taskId}) {
        if (isTokenValid(token)) {
            const userId = decodeUserFromToken(token).id,
                task = tasks[taskId];
            if (task.authorId == userId) {
                return JSON.stringify(fs.readFile(task.attachmentFileName));
            } else {
                return null;
            }
        } else {
            return null;
        }
    },

    login: function ({username, password}) {
        const suchUsers = users.filter((user) => user.username === username);
        if (suchUsers.length === 0) {
            const user = new User(username, users.length, password);
            users.push(user);
            updateUsersStorage();
            return createToken(user);
        } else {
            const user = suchUsers[0];
            if (user.checkPassword(password)) {
                return createToken(user)
            } else {
                return null;
            }
        }
    },

    completeTask: function ({token, taskId}) {
        if (isTokenValid(token)) {
            const userId = decodeUserFromToken(token).id,
                task = tasks.filter((task) => (task.id === taskId) && (task.authorId === userId));
            if (task.length > 0) {
                task[0].complete();
                updateTasksStorage();
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    },

    addTask: function ({token, taskName, taskCompleteDate, jsonedAttachment, filename}) {
        if (isTokenValid(token)) {
            const newTaskId = tasks.length;
            let attachmentFileName = null;

            if (jsonedAttachment != null) {
                const attachmentPath = attachmentsDirectory + newTaskId + path.sep;
                if (!fs.existsSync(attachmentPath)) {
                    fs.mkdirSync(attachmentPath);
                }

                attachmentFileName = attachmentPath + filename;
                fs.writeFileSync(attachmentFileName, JSON.parse(jsonedAttachment));
            }

            tasks.push(new Task(taskName, new Date(taskCompleteDate), newTaskId, decodeUserFromToken(token).id,
                attachmentFileName));
            updateTasksStorage();
            return true;
        } else {
            return false;
        }
    }
};
